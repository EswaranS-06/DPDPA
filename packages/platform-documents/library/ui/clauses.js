// DPDP Document Studio — clause engine.
// Turns a rendered document (Markdown) into numbered contract clauses that can be dropped into
// another agreement (NDA, MSA, SOW, vendor contract) instead of issuing a full standalone document.
(function () {
  'use strict';

  const HEADING = /^(#{1,4})\s+(.*)$/;
  // Sections that rarely belong inside another contract; unticked by default.
  const DEFAULT_EXCLUDE = /^recitals$|revision history|document control|acknowledg|in witness|^signature|^declaration|^approval$|assessor section|for office use|clause library/i;

  // Removes existing numbering / labels so the clause can be renumbered cleanly.
  function cleanTitle(title) {
    return String(title)
      .replace(/\*\*/g, '')
      .replace(/^(?:PART\s+[A-Z0-9-]+\s*[:.—-]\s*|Clause\s+[A-Z]*-?\d+[A-Z]?\s*[:.—-]\s*|ANNEX(?:URE)?\s+[A-Z0-9-]+\s*[:.—-]\s*|SCHEDULE\s+[A-Z0-9-]+\s*[:.—-]\s*|APPENDIX\s+[A-Z0-9-]+\s*[:.—-]\s*|[A-Z]{1,3}-\d+[A-Z]?\s*[:.—-]\s*|[A-Z]?\d+(?:\.\d+)*[.:)]?\s+|[A-Z]\.\s+)/i, '')
      .replace(/\s*\((?:insert|internal|public|completed by|issued|sent|filed)[^)]*\)\s*$/i, '') // drafting-only parentheticals
      .replace(/[.:\s]+$/, '')
      .trim();
  }

  const KEEP_CASE = ['DPDP', 'DPO', 'SDF', 'DPIA', 'RoPA', 'CERT-In', 'RBI', 'SEBI', 'IRDAI', 'India', 'Indian', 'Board', 'Act', 'Rules', 'SOP', 'VPC', 'CCTV', 'HR', 'IT', 'ID', 'KYC', 'DSA', 'DPA'];
  // "DEFINITIONS AND INTERPRETATION" → "Definitions and interpretation" (acronyms kept).
  function sentenceCase(title) {
    if (!/[A-Z]/.test(title) || title !== title.toUpperCase()) return title;
    let s = title.toLowerCase().replace(/^./, (c) => c.toUpperCase());
    for (const k of KEEP_CASE) s = s.replace(new RegExp(`\\b${k.replace('-', '\\-')}\\b`, 'gi'), k);
    return s.replace(/^./, (c) => c.toUpperCase());
  }

  function originalNumber(title) {
    const m = String(title).replace(/\*\*/g, '').match(/^(\d+)[.:)]?\s/);
    return m ? m[1] : null;
  }

  /** Splits Markdown into a flat, ordered list of heading sections with parent links and stable paths. */
  function parseSections(markdown) {
    const sections = [];
    const preamble = [];
    let current = null;
    let inFence = false;
    for (const line of markdown.split('\n')) {
      if (/^```/.test(line)) inFence = !inFence;
      const m = !inFence && line.match(HEADING);
      if (m) {
        current = { level: m[1].length, title: m[2].trim(), lines: [] };
        sections.push(current);
      } else {
        (current ? current.lines : preamble).push(line);
      }
    }
    const stack = [];
    sections.forEach((s, i) => {
      while (stack.length && stack[stack.length - 1].level >= s.level) stack.pop();
      s.index = i;
      s.parent = stack.length ? stack[stack.length - 1].index : null;
      s.depth = stack.length;
      s.path = [...stack.map((x) => x.title), s.title].join(' › ');
      s.body = s.lines.join('\n').replace(/^\s*---\s*$/gm, '').trim();
      delete s.lines;
      stack.push(s);
    });
    return { preamble: preamble.join('\n').trim(), sections };
  }

  function defaultSelection(parsed) {
    const excludedRoots = new Set();
    const selected = [];
    for (const s of parsed.sections) {
      if (s.parent !== null && excludedRoots.has(s.parent)) { excludedRoots.add(s.index); continue; }
      if (s.level === 1 || DEFAULT_EXCLUDE.test(cleanTitle(s.title))) { if (s.level > 1) excludedRoots.add(s.index); continue; }
      selected.push(s.path);
    }
    return selected;
  }

  // "3.1 The processor shall…" inside section "3. PROCESSING" becomes "14.3.1 The processor shall…".
  function renumberBody(body, orig, number) {
    if (!orig) return body;
    const re = new RegExp(`^(\\s*)(\\*\\*)?${orig}\\.(\\d+(?:\\.\\d+)*)(\\*\\*)?(\\s)`, 'gm');
    return body.replace(re, (_, sp, b1, rest, b2, ws) => `${sp}${b1 || ''}${number}.${rest}${b2 || ''}${ws}`);
  }

  const startsWithBlock = (text) => /^(\||>|[-*+]\s|\d+\.\s|\d+(?:\.\d+)+\s|\([a-z0-9]+\)\s|[A-Z]\.\s|```|<|#|!\[)/.test(text.trim());

  /**
   * Builds one clause from sections (possibly from several documents).
   * items: [{ section, group }] — group is the source document id; levels are normalised per group.
   * opts: { number, title, intro, headingCase: 'upper' | 'title' }
   */
  function buildClause(items, opts = {}) {
    const number = String(opts.number || '1').trim();
    const title = String(opts.title || 'Data Protection').trim();
    const out = [`**${number}. ${opts.headingCase === 'title' ? title : title.toUpperCase()}**`, ''];
    if (opts.intro && opts.intro.trim()) out.push(opts.intro.trim(), '');
    const minLevel = {};
    for (const { section, group } of items) minLevel[group] = Math.min(minLevel[group] ?? 9, section.level);
    const counters = [];
    let lastGroup = null;
    for (const { section, group } of items) {
      if (group !== lastGroup && lastGroup !== null) counters.length = 1; // new source document continues at top level
      lastGroup = group;
      let depth = section.level - minLevel[group];
      if (depth > counters.length) depth = counters.length; // never skip a numbering level
      counters.length = depth + 1;
      counters[depth] = (counters[depth] || 0) + 1;
      const no = [number, ...counters].join('.');
      const heading = sentenceCase(cleanTitle(section.title));
      const body = renumberBody(section.body, originalNumber(section.title), no);
      const blocks = body ? body.split(/\n{2,}/) : [];
      if (blocks.length && !startsWithBlock(blocks[0])) {
        out.push(`**${no} ${heading}.** ${blocks[0]}`);
        if (blocks.length > 1) out.push('', blocks.slice(1).join('\n\n'));
      } else {
        out.push(`**${no} ${heading}.**`);
        if (body) out.push('', body);
      }
      out.push('');
    }
    return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  }

  window.DPDPClauses = { parseSections, defaultSelection, buildClause, cleanTitle, sentenceCase };
})();
