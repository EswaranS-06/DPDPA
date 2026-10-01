// The guide card and highlight drawn inside DUATF pages. Installed on every page of the guide
// browser as an init script; it renders only on the DUATF origin and lives in a shadow root, so it
// never inherits or changes the app's styles. Buttons report back through window.__duatfPlaybook.

export const BINDING = '__duatfPlaybook'
export const TARGET_ATTRIBUTE = 'data-duatf-guide-target'

/** What the runner asks the card to show. */
export type CardView =
  | {
      kind: 'step'
      index: number
      total: number
      tour: string
      title: string
      say: string
      mode: 'show' | 'guide'
      /** Reading time before the guide acts, in show mode; 0 while paused. */
      readMs: number
      paused: boolean
      /** What the guide will do on Next, if anything ("Select it", "Type it", ...). */
      action: string | null
      hasTarget: boolean
    }
  | {
      kind: 'you'
      index: number
      total: number
      tour: string
      title: string
      say: string
      instruction: string
    }
  | {
      kind: 'blocked'
      index: number
      total: number
      tour: string
      title: string
      say: string
      who: string
    }
  | { kind: 'signin'; tour: string }
  | { kind: 'done'; tour: string; text: string }

const CSS = `
:host { all: initial; }
.ring {
  position: fixed; z-index: 2147483646; pointer-events: none; border-radius: 8px;
  outline: 2px solid #4f46e5; outline-offset: 3px;
  box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.22);
  transition: top 160ms ease, left 160ms ease, width 160ms ease, height 160ms ease, opacity 160ms ease;
}
.ring[hidden] { display: none; }
.ring.pulse { animation: pulse 1.4s ease-in-out infinite; }
@keyframes pulse { 50% { outline-offset: 6px; outline-color: #818cf8; } }
.card {
  position: fixed; z-index: 2147483647; bottom: 20px; right: 20px; width: min(380px, calc(100vw - 32px));
  box-sizing: border-box; padding: 16px 18px 14px; border-radius: 12px;
  background: #ffffff; color: #0f172a; border: 1px solid #cbd5e1;
  box-shadow: 0 18px 40px -12px rgba(15, 23, 42, 0.35);
  font: 14px/1.5 Inter, 'Segoe UI', system-ui, sans-serif; letter-spacing: -0.003em;
}
.card.left { right: auto; left: 20px; }
.card.top { bottom: auto; top: 20px; }
.meta { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 6px; font-size: 12px; color: #5f6e84; }
.meta strong { color: #3730a3; font-weight: 600; }
h2 { margin: 0 0 4px; font-size: 16px; line-height: 1.3; font-weight: 650; letter-spacing: -0.01em; }
p { margin: 0 0 10px; color: #334155; }
.turn { display: inline-flex; align-items: center; gap: 6px; margin: 2px 0 8px; padding: 2px 8px; border-radius: 999px;
  font-size: 12px; font-weight: 650; color: #93370d; background: #fffaeb; border: 1px solid #fedf89; }
.instruction { padding: 8px 10px; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0; color: #0f172a; }
.bar { height: 3px; margin: 2px 0 12px; border-radius: 3px; background: #e2e8f0; overflow: hidden; }
.bar span { display: block; height: 100%; width: 0; background: #4f46e5; }
.bar.run span { animation: fill linear forwards; }
@keyframes fill { to { width: 100%; } }
.actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
button {
  font: 600 13px/1 Inter, 'Segoe UI', system-ui, sans-serif; padding: 8px 12px; border-radius: 8px; cursor: pointer;
  border: 1px solid #cbd5e1; background: #ffffff; color: #0f172a;
}
button:hover { background: #f1f5f9; }
button:focus-visible { outline: 2px solid #4f46e5; outline-offset: 2px; }
button.primary { background: #4f46e5; border-color: #4f46e5; color: #ffffff; }
button.primary:hover { background: #4338ca; }
button.quiet { border-color: transparent; color: #475569; margin-left: auto; }
.who { color: #93370d; }
@media (prefers-reduced-motion: reduce) { .ring { transition: none; } .ring.pulse { animation: none; } .bar.run span { animation: none; width: 100%; } }
`

/** Source of the init script; origin is the DUATF address the card may draw on. */
export const overlayScript = (origin: string): string => `(() => {
  if (location.origin !== ${JSON.stringify(origin)} || window.__duatfGuide) return;
  const TARGET = ${JSON.stringify(TARGET_ATTRIBUTE)};
  const send = (message) => { try { window[${JSON.stringify(BINDING)}]?.(message); } catch (e) {} };
  let host, root, ring, card, frame = 0, view = null;

  const mount = () => {
    if (host && host.isConnected) return;
    host = document.createElement('duatf-guide');
    root = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = ${JSON.stringify(CSS)};
    ring = document.createElement('div'); ring.className = 'ring'; ring.hidden = true;
    card = document.createElement('div'); card.className = 'card'; card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', 'DUATF Playbook guide'); card.hidden = true;
    root.append(style, ring, card);
    document.documentElement.append(host);
  };

  const place = () => {
    frame = requestAnimationFrame(place);
    if (!ring) return;
    const target = document.querySelector('[' + TARGET + ']');
    if (!target || !view || view.kind === 'done' || view.kind === 'signin') { ring.hidden = true; return; }
    const r = target.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) { ring.hidden = true; return; }
    ring.hidden = false;
    ring.style.top = r.top + 'px'; ring.style.left = r.left + 'px';
    ring.style.width = r.width + 'px'; ring.style.height = r.height + 'px';
    // Keep the card clear of the highlighted element.
    const right = r.right > innerWidth - 420, bottom = r.bottom > innerHeight - 260;
    card.classList.toggle('left', right && bottom);
    card.classList.toggle('top', right && bottom && r.left < 420);
  };

  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };
  const btn = (text, cls, action) => { const b = el('button', cls, text); b.type = 'button'; b.addEventListener('click', (e) => { e.stopPropagation(); send({ type: 'control', action }); }); return b; };

  const render = () => {
    mount();
    card.replaceChildren();
    if (!view) { card.hidden = true; ring.hidden = true; return; }
    card.hidden = false;
    const meta = el('div', 'meta');
    const left = el('span'); left.append(el('strong', null, 'DUATF Playbook'), document.createTextNode(' · ' + view.tour));
    meta.append(left);
    if ('index' in view) meta.append(el('span', null, 'Step ' + (view.index + 1) + ' of ' + view.total));
    card.append(meta);
    const actions = el('div', 'actions');
    if (view.kind === 'step') {
      card.append(el('h2', null, view.title), el('p', null, view.say));
      if (view.mode === 'show') {
        const bar = el('div', 'bar' + (view.paused || !view.readMs ? '' : ' run')); const fill = el('span');
        if (!view.paused && view.readMs) fill.style.animationDuration = view.readMs + 'ms';
        bar.append(fill); card.append(bar);
        if (view.index > 0) actions.append(btn('Back', '', 'back'));
        actions.append(btn(view.paused ? 'Play' : 'Pause', '', view.paused ? 'resume' : 'pause'));
        actions.append(btn('Next', 'primary', 'next'));
      } else {
        if (view.action) card.append(el('p', null, view.action === 'Select it' ? 'Select the highlighted item yourself, or press "Do it for me".' : 'Do it yourself and press Next, or press "Do it for me".'));
        if (view.index > 0) actions.append(btn('Back', '', 'back'));
        if (view.action) actions.append(btn('Do it for me', '', 'doit'));
        actions.append(btn('Next', 'primary', 'next'));
      }
      ring.classList.toggle('pulse', view.mode === 'guide' && !!view.action);
    } else if (view.kind === 'you') {
      card.append(el('span', 'turn', 'Your turn'), el('h2', null, view.title), el('p', null, view.say), el('p', 'instruction', view.instruction));
      if (view.index > 0) actions.append(btn('Back', '', 'back'));
      actions.append(btn('I have done it', 'primary', 'done'), btn('Skip', '', 'skip'));
      ring.classList.add('pulse');
    } else if (view.kind === 'blocked') {
      card.append(el('h2', null, view.title), el('p', null, view.say), el('p', 'who', 'This is not on the page for your account. Who can do it: ' + view.who + '.'));
      if (view.index > 0) actions.append(btn('Back', '', 'back'));
      actions.append(btn('Skip this step', 'primary', 'next'));
    } else if (view.kind === 'signin') {
      card.append(el('h2', null, 'Sign in first'), el('p', null, 'Sign in with your own DUATF account in this window. The guide carries on by itself once you are in.'));
    } else if (view.kind === 'done') {
      card.append(el('h2', null, 'Done'), el('p', null, view.text));
      actions.append(btn('Close', 'primary', 'close'));
    }
    if (view.kind !== 'done') actions.append(btn('End', 'quiet', 'stop'));
    card.append(actions);
  };

  document.addEventListener('click', (event) => {
    const target = document.querySelector('[' + TARGET + ']');
    if (target && event.target instanceof Node && target.contains(event.target)) send({ type: 'targetClicked' });
  }, true);

  window.__duatfGuide = {
    show(next) { view = next; render(); if (!frame) place(); },
    hide() { view = null; render(); },
  };
  send({ type: 'ready', path: location.pathname + location.search });
})();`
