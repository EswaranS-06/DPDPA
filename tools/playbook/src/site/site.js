// The DUATF Playbook page: lists the tasks, filters them as you type, starts a tour in the guide
// window and mirrors its progress. Talks only to the local playbook server.

const $ = (selector) => document.querySelector(selector)

const el = (tag, attributes = {}, ...children) => {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(attributes)) {
    if (value === undefined || value === null || value === false) continue
    if (key === 'class') node.className = value
    else if (key === 'text') node.textContent = value
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value)
    else node.setAttribute(key, value === true ? '' : value)
  }
  for (const child of children.flat()) {
    if (child !== null && child !== undefined) node.append(child)
  }
  return node
}

const post = (path, body) =>
  fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

let catalog = { groups: [], tours: [] }
let state = null
let query = ''

const words = (text) =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)

/** The title with the words that match the query underlined. */
const highlighted = (title) => {
  const terms = words(query)
  if (terms.length === 0) return [title]
  const parts = []
  for (const piece of title.split(/(\s+)/)) {
    const term = terms.find((word) => piece.toLowerCase().startsWith(word))
    if (term && piece.trim())
      parts.push(el('mark', { text: piece.slice(0, term.length) }), piece.slice(term.length))
    else parts.push(piece)
  }
  return parts
}

const canDo = (tour) => {
  if (!state || !state.user) return null
  return tour.who.some((role) => state.user.roles.includes(role))
}

const renderTask = (tour) => {
  const allowed = canDo(tour)
  const yours = tour.steps.some((step) => step.yours)
  return el(
    'li',
    { class: 'task', id: `task-${tour.id}`, 'data-id': tour.id },
    el(
      'div',
      {},
      el('h3', { id: `title-${tour.id}` }, highlighted(tour.title)),
      el('p', { class: 'summary', text: tour.summary }),
      el(
        'p',
        { class: 'facts' },
        el('span', { text: `${tour.steps.length} steps${yours ? ', the last one yours' : ''}` }),
        el('span', { 'aria-hidden': 'true', text: '·' }),
        el('span', { class: 'visually-hidden', text: 'Who can do it:' }),
        tour.who.length === 6
          ? el('span', { class: 'who', text: 'Everyone' })
          : tour.who.map((role) =>
              el('span', {
                class: state?.user?.roles.includes(role) ? 'who you' : 'who',
                text: role,
              }),
            ),
        allowed === false
          ? el('span', { text: 'Your account can watch it but not finish it.' })
          : null,
      ),
    ),
    el(
      'div',
      { class: 'buttons' },
      el('button', {
        type: 'button',
        class: 'primary',
        'aria-describedby': `title-${tour.id}`,
        text: 'Show me',
        onclick: () => start(tour.id, 'show'),
      }),
      el('button', {
        type: 'button',
        'aria-describedby': `title-${tour.id}`,
        text: 'Guide me',
        onclick: () => start(tour.id, 'guide'),
      }),
    ),
    el(
      'details',
      {},
      el('summary', { text: 'See the steps' }),
      el(
        'ol',
        {},
        tour.steps.map((step) =>
          el('li', { class: step.yours ? 'yours' : null, text: step.title }),
        ),
      ),
    ),
  )
}

const renderAll = () => {
  const main = $('#tasks')
  main.replaceChildren(
    ...catalog.groups.map((group) => {
      const tours = catalog.tours.filter((tour) => tour.group === group.id)
      return el(
        'section',
        { class: 'group', id: `group-${group.id}`, 'aria-labelledby': `heading-${group.id}` },
        el(
          'div',
          { class: 'group-head' },
          el('h2', { id: `heading-${group.id}`, text: group.title }),
          el('span', { class: 'group-count', 'data-count': group.id, text: String(tours.length) }),
        ),
        el('p', { class: 'group-purpose', text: group.purpose }),
        el('ul', { class: 'tasks' }, tours.map(renderTask)),
      )
    }),
    el('p', { class: 'empty-results', id: 'empty', hidden: true }),
  )
  $('#group-index').replaceChildren(
    ...catalog.groups.map((group) =>
      el(
        'li',
        { 'data-group': group.id },
        el(
          'a',
          { href: `#group-${group.id}` },
          el('span', { text: group.title }),
          el('span', { class: 'count', 'data-index-count': group.id }),
        ),
      ),
    ),
  )
  markActive()
}

const applyFilter = (ids) => {
  const shown = new Set(ids)
  let total = 0
  for (const group of catalog.groups) {
    const tours = catalog.tours.filter((tour) => tour.group === group.id)
    let count = 0
    for (const tour of tours) {
      const row = document.getElementById(`task-${tour.id}`)
      const visible = shown.has(tour.id)
      row.hidden = !visible
      if (visible) {
        count += 1
        row.querySelector('h3').replaceChildren(...highlighted(tour.title))
      }
    }
    total += count
    document.getElementById(`group-${group.id}`).hidden = count === 0
    document.querySelector(`[data-count="${group.id}"]`).textContent = String(count)
    document.querySelector(`[data-index-count="${group.id}"]`).textContent = String(count)
    document.querySelector(`[data-group="${group.id}"]`).className = count === 0 ? 'empty' : ''
  }
  const empty = $('#empty')
  empty.hidden = total > 0
  empty.textContent = `No task matches “${query}”. Try a shorter word, or clear the search to see every task.`
  $('#result-count').textContent = query
    ? `${total} ${total === 1 ? 'task matches' : 'tasks match'} “${query}”. Press Escape to clear.`
    : `${catalog.tours.length} tasks in ${catalog.groups.length} groups. Press / to search.`
}

let searchTimer = 0
const search = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    const asked = query
    const response = await fetch(`/api/search?q=${encodeURIComponent(asked)}`)
    const { ids } = await response.json()
    if (asked === query) applyFilter(ids)
  }, 60)
}

const start = async (tour, mode) => {
  await post('/api/run', { tour, mode })
}

const control = (action) => post('/api/control', { action })

// --- Live state ------------------------------------------------------------------------------

const STATUS_TEXT = {
  starting: 'Starting…',
  playing: 'Playing. Pause any time.',
  paused: 'Paused.',
  waiting: 'Waiting for you: do the step, or press Next.',
  'your-turn': 'Your turn.',
  'sign-in': 'Sign in with your own account in the guide window. The tour carries on by itself.',
  blocked: '',
  done: '',
  stopped: 'Stopped.',
  error: '',
}

const markActive = () => {
  for (const row of document.querySelectorAll('.task.active')) row.classList.remove('active')
  const run = state && state.run
  if (run && !['done', 'stopped', 'error'].includes(run.status)) {
    document.getElementById(`task-${run.tourId}`)?.classList.add('active')
  }
}

const renderGuideStatus = () => {
  const dot = $('.dot')
  const text = $('#guide-text')
  if (state.error) {
    dot.dataset.state = 'error'
    text.textContent = state.error
  } else if (state.run && state.run.status === 'sign-in') {
    dot.dataset.state = 'sign-in'
    text.textContent = 'Waiting for you to sign in, in the guide window.'
  } else if (state.browser === 'opening') {
    dot.dataset.state = 'opening'
    text.textContent = 'Opening the guide window…'
  } else if (state.browser === 'open') {
    dot.dataset.state = 'open'
    const who = state.user
      ? ` Signed in as ${state.user.name}${state.user.roles ? ` (${state.user.roles})` : ''}.`
      : ''
    const tab =
      state.tab === 'reused'
        ? 'Using the guide window that was already open.'
        : 'Guide window open.'
    text.textContent = `${tab}${who}`
  } else {
    dot.dataset.state = 'closed'
    text.textContent = 'The guide window opens with the first task.'
  }
}

const renderPractice = () => {
  const select = $('#practice')
  const chosen = state.practice ?? ''
  const options = [
    el('option', { value: '', text: 'the client open in the guide window' }),
    ...state.clients.map((client) =>
      el('option', { value: client.code, text: `${client.name} (${client.code})` }),
    ),
  ]
  if (chosen && !state.clients.some((client) => client.code === chosen)) {
    options.push(el('option', { value: chosen, text: chosen }))
  }
  select.replaceChildren(...options)
  select.value = chosen
}

const renderNow = () => {
  const panel = $('#now')
  const run = state.run
  const layout = $('.layout')
  if (!run) {
    panel.hidden = true
    layout.classList.remove('playing')
    return
  }
  panel.hidden = false
  layout.classList.add('playing')
  const finished = ['done', 'stopped', 'error'].includes(run.status)
  $('#now-mode').textContent = finished
    ? run.status === 'done'
      ? 'Finished'
      : run.status === 'error'
        ? 'Could not continue'
        : 'Stopped'
    : run.mode === 'guide'
      ? `Guiding, step ${Math.min(run.step + 1, run.total)} of ${run.total}`
      : `Showing, step ${Math.min(run.step + 1, run.total)} of ${run.total}`
  $('#now-title').textContent = run.title
  const message = $('#now-message')
  message.textContent = run.message || STATUS_TEXT[run.status] || ''
  message.classList.toggle('turn', run.status === 'your-turn')
  $('#now-steps').replaceChildren(
    ...run.stepTitles.map((title, index) =>
      el('li', {
        class: [
          index < run.step ? 'past' : '',
          index === run.step && !finished ? 'current' : '',
          index === run.step && run.status === 'your-turn' ? 'turn' : '',
        ]
          .filter(Boolean)
          .join(' '),
        'aria-current': index === run.step && !finished ? 'step' : null,
        text: title,
      }),
    ),
  )
  const pause = $('#pause')
  pause.textContent = run.status === 'paused' ? 'Play' : 'Pause'
  pause.dataset.control = run.status === 'paused' ? 'resume' : 'pause'
  pause.hidden = run.mode !== 'show'
  for (const button of document.querySelectorAll('.now-actions button[data-control]')) {
    button.disabled = finished || (button.dataset.control === 'back' && run.step === 0)
  }
}

const connect = () => {
  const events = new EventSource('/api/events')
  events.onmessage = (event) => {
    const previousUser = state && state.user && state.user.roles
    state = JSON.parse(event.data)
    $('#base').textContent = state.base
    renderGuideStatus()
    renderPractice()
    renderNow()
    if ((state.user && state.user.roles) !== previousUser && catalog.tours.length) {
      renderAll()
      applyFilterNow()
    } else {
      markActive()
    }
  }
}

const applyFilterNow = () => {
  if (query) search()
  else applyFilter(catalog.tours.map((tour) => tour.id))
}

// --- Wiring ----------------------------------------------------------------------------------

const input = $('#q')
input.addEventListener('input', () => {
  query = input.value.trim()
  search()
})
input.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    input.value = ''
    query = ''
    applyFilterNow()
  }
  if (event.key === 'Enter') {
    const first = document.querySelector('.task:not([hidden]) button.primary')
    if (first) first.focus()
  }
})
document.addEventListener('keydown', (event) => {
  const typing = ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)
  if (event.key === '/' && !typing) {
    event.preventDefault()
    input.focus()
  }
})
for (const button of document.querySelectorAll('.now-actions button[data-control]')) {
  button.addEventListener('click', () => control(button.dataset.control))
}
const stepsToggle = $('#steps-toggle')
stepsToggle.addEventListener('click', () => {
  const expanded = $('#now').classList.toggle('expanded')
  stepsToggle.setAttribute('aria-expanded', String(expanded))
})
const practice = $('#practice')
practice.addEventListener('focus', () => post('/api/clients', {}))
practice.addEventListener('change', () => post('/api/practice', { client: practice.value }))

fetch('/api/catalog')
  .then((response) => response.json())
  .then((data) => {
    catalog = data
    renderAll()
    applyFilter(catalog.tours.map((tour) => tour.id))
    connect()
  })
