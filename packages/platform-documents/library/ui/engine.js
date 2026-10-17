// DPDP Document Studio — template engine.
// Implements the grammar in README §2: INCLUDE → drafting notes → IF → REPEAT → comments → placeholders.
(function () {
  'use strict';

  const PLACEHOLDER = /\[((?:[A-Z][A-Za-z0-9]*)(?:-[A-Za-z0-9]+)*)\](?!\()/g;
  const INCLUDE = /<!--\s*INCLUDE\s+([A-Za-z0-9-]+)\s*-->/g;
  const IF_OR_END = /<!--\s*(IF\s+[^>]*?|END IF)\s*-->/g;
  const REPEAT = /<!--\s*REPEAT\s+([A-Za-z0-9-]+)\s*-->\n?([\s\S]*?)<!--\s*END REPEAT\s*-->\n?/g;
  const COMMENT = /<!--[\s\S]*?-->/g;
  const DOC_LEVEL_FIELDS = ['Document-Title', 'Document-ID', 'Document-Version', 'Document-Owner', 'Document-Classification'];
  const RULES_COMMENCEMENT = '2027-05-13';

  const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function expandIncludes(text, blocks, depth = 0) {
    if (depth > 4) return text;
    return text.replace(INCLUDE, (_, name) => (blocks[name] !== undefined ? expandIncludes(blocks[name], blocks, depth + 1) : ''));
  }

  // Drafting notes are blockquotes that begin with "> **Drafting note". Removed, or kept and tagged for the consultant view.
  function handleDraftingNotes(text, keep) {
    const out = [];
    let inNote = false;
    for (const line of text.split('\n')) {
      if (line.startsWith('> **Drafting note')) {
        inNote = true;
        if (keep) out.push(line.replace('> **Drafting note', '> **🛈 Drafting note'));
        continue;
      }
      if (inNote && line.startsWith('>')) {
        if (keep) out.push(line);
        continue;
      }
      inNote = false;
      out.push(line);
    }
    return out.join('\n');
  }

  function isTruthy(value) {
    return !(value === undefined || value === null || value === false || value === '' || value === 'None' || value === 'false');
  }

  function evaluateCondition(expr, flags) {
    const neg = expr.match(/^NOT\s+([A-Za-z0-9-]+)$/);
    if (neg) return !isTruthy(flags[neg[1]]);
    const cmp = expr.match(/^([A-Za-z0-9-]+)\s*(==|!=)\s*([A-Za-z0-9-]+)$/);
    if (cmp) {
      const actual = String(flags[cmp[1]] ?? '');
      return cmp[2] === '==' ? actual === cmp[3] : actual !== cmp[3];
    }
    return isTruthy(flags[expr.trim()]);
  }

  function applyConditionals(text, flags) {
    let out = '';
    let last = 0;
    const stack = [];
    const visible = () => stack.every(Boolean);
    for (const m of text.matchAll(IF_OR_END)) {
      if (visible()) out += text.slice(last, m.index);
      last = m.index + m[0].length;
      if (m[1] === 'END IF') stack.pop();
      else stack.push(evaluateCondition(m[1].replace(/^IF\s+/, '').trim(), flags));
    }
    if (visible()) out += text.slice(last);
    return out.replace(/\n{3,}/g, '\n\n');
  }

  function formatValue(value, inTable) {
    let s = String(Array.isArray(value) ? value.join(', ') : value).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (inTable) return s.replace(/\|/g, '&#124;').replace(/\r?\n/g, '<br>');
    return s.replace(/\r?\n/g, '  \n');
  }

  // Marker text uses entities so a later placeholder pass cannot re-match it.
  function marker(name, kind) {
    return `<mark class="ph ph-${kind}" data-ph="${name}">&#91;${name}&#93;</mark>`;
  }

  // Unfilled collection fields are parked as sentinels until the global pass is done.
  const SENTINEL = /\u0001([^\u0002]+)\u0002/g;
  const park = (name) => `\u0001${name}\u0002`;

  // Substitutes placeholders line by line so table cells can be escaped safely.
  // lookup(name) → value | '' (missing) | null (not handled by this pass).
  function substitute(text, lookup, onMissing, found) {
    return text.split('\n').map((line) => {
      const inTable = line.trim().startsWith('|');
      return line.replace(PLACEHOLDER, (whole, name) => {
        const value = lookup(name);
        if (value === null) return whole;
        if (found) found.add(name);
        if (value !== undefined && String(value).trim() !== '') return formatValue(value, inTable);
        return onMissing(name, whole);
      });
    }).join('\n');
  }

  function expandRepeats(text, collections, analysis) {
    return text.replace(REPEAT, (_, name, body) => {
      const rows = (collections[name] || []).filter((r) => Object.values(r).some((v) => String(v || '').trim()));
      analysis.collections.add(name);
      const fields = new Set();
      body.replace(PLACEHOLDER, (w, f) => fields.add(f));
      if (!rows.length) {
        analysis.emptyCollections.add(name);
        return substitute(body, () => '', park, analysis.collectionFields);
      }
      return rows.map((row) => substitute(body, (f) => (fields.has(f) && (f in row) ? (row[f] || '') : null), park, analysis.collectionFields)).join('');
    });
  }

  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  function buildFlags(template, state, data) {
    const flags = Object.assign({}, state.flags);
    const docDefs = ((data || window.DPDP_DATA || {}).flags || { doc: [] }).doc;
    for (const f of docDefs) if (f.usedIn.includes(template.id)) flags[f.name] = f.default;
    flags['Pre-May-2027'] = todayIso() < RULES_COMMENCEMENT;
    Object.assign(flags, (state.docFlags || {})[template.id] || {});
    return flags;
  }

  const DP_CATEGORY_LABELS = { 'Attendant-Next-of-Kin': 'Attendant / Next of Kin', 'Vendor-Representative': 'Vendor Representative' };

  function formatIsoDate(v) {
    const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return v;
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  }

  function makeLookup(template, state, registry) {
    const raw = makeRawLookup(template, state, registry);
    const flags = buildFlags(template, state);
    return (name) => {
      if (typeof flags[name] === 'string' && !(name in state.values && String(state.values[name]).trim())) return flags[name];
      const v = raw(name);
      return registry[name] && registry[name].type === 'date' ? formatIsoDate(v) : v;
    };
  }

  function makeRawLookup(template, state, registry) {
    const docValues = (state.docValues || {})[template.id] || {};
    const category = buildFlags(template, state)['DP-Category'];
    const auto = {
      'DP-Category-Label': category && category !== 'Custom' ? (DP_CATEGORY_LABELS[category] || category) : '',
      // Public documents drop the internal parenthetical, e.g. "Privacy Notice (Master — Website & App)" → "Privacy Notice".
      'Document-Title': /^public/.test(template.publish || '') ? template.title.replace(/\s*\(.*\)\s*$/, '') : template.title,
      'Document-ID': template.id,
      'Document-Version': template.version || '1.0',
      'Last-Updated-Date': todayIso(),
    };
    const resolve = (name, depth = 0) => {
      if (depth > 3) return '';
      if (DOC_LEVEL_FIELDS.includes(name) && String(docValues[name] || '').trim()) return docValues[name];
      const v = state.values[name];
      if (v !== undefined && String(v).trim() !== '') return v;
      if (auto[name]) return auto[name];
      const def = registry[name] && registry[name].default;
      if (typeof def === 'string' && def.startsWith('=')) return resolve(def.slice(1), depth + 1);
      return '';
    };
    return resolve;
  }

  /**
   * Renders a template to Markdown.
   * mode: 'preview' (missing values highlighted) | 'export' (missing values left as [Name])
   * Returns { markdown, analysis: { fields, collections, emptyCollections, collectionFields, missing } }
   */
  function render(template, data, state, { mode = 'preview', showNotes = false } = {}) {
    const analysis = { fields: new Set(), collections: new Set(), emptyCollections: new Set(), collectionFields: new Set(), missing: [] };
    let text = expandIncludes(template.body, data.blocks);
    text = handleDraftingNotes(text, showNotes);
    text = applyConditionals(text, buildFlags(template, state, data));
    text = expandRepeats(text, state.collections || {}, analysis);
    text = text.replace(COMMENT, '');
    const lookup = makeLookup(template, state, data.registry);
    const onMissing = (name, whole) => (mode === 'preview' ? marker(name, 'missing') : whole);
    text = substitute(text, lookup, onMissing, analysis.fields);
    text = text.replace(SENTINEL, (_, name) => (mode === 'preview' ? marker(name, 'collection') : `[${name}]`));
    // Numbered sub-clauses written on consecutive lines ("1.1 …", "(a) …", "A. …") become separate paragraphs.
    text = text.replace(/([^\n|])\n(?=(?:\*\*)?(?:\d+(?:\.\d+)+|\([a-z0-9]{1,4}\)|[A-Z]\.)\s)/g, '$1\n\n');
    analysis.missing = [...analysis.fields].filter((n) => !String(lookup(n) || '').trim());
    return { markdown: text.trim() + '\n', analysis };
  }

  function parseDurationDays(value) {
    const m = String(value || '').match(/(\d+(?:\.\d+)?)\s*(working\s+day|business\s+day|day|hour|hr|week|month)/i);
    if (!m) return null;
    const n = parseFloat(m[1]);
    const unit = m[2].toLowerCase();
    if (unit.startsWith('hour') || unit === 'hr') return n / 24;
    if (unit.startsWith('week')) return n * 7;
    if (unit.startsWith('month')) return n * 30;
    if (unit.startsWith('working') || unit.startsWith('business')) return n * 1.4;
    return n;
  }

  window.DPDPEngine = { render, makeLookup, parseDurationDays, escapeHtml, buildFlags, isTruthy, formatIsoDate, DOC_LEVEL_FIELDS, todayIso };
})();
