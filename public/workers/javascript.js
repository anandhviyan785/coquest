/* CoQuest JavaScript sandbox: runs learner code in a Web Worker with no DOM access.
   Network and storage APIs are removed before the code runs; the page kills this worker on timeout. */
for (const name of ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'indexedDB', 'caches', 'importScripts', 'BroadcastChannel']) {
  try {
    Object.defineProperty(self, name, { value: undefined, writable: false, configurable: false })
  } catch (_) {
    /* property already locked */
  }
}

function show(value, depth = 0) {
  if (typeof value === 'string') return depth === 0 ? value : JSON.stringify(value)
  if (typeof value === 'function') return '[Function ' + (value.name || 'anonymous') + ']'
  if (value === undefined) return 'undefined'
  if (value instanceof Error) return value.name + ': ' + value.message
  if (Array.isArray(value)) return value.length ? '[ ' + value.map((v) => show(v, depth + 1)).join(', ') + ' ]' : '[]'
  if (value && typeof value === 'object') {
    if (value instanceof Map) return 'Map(' + value.size + ') {' + [...value].map(([k, v]) => show(k, 1) + ' => ' + show(v, 1)).join(', ') + '}'
    if (value instanceof Set) return 'Set(' + value.size + ') {' + [...value].map((v) => show(v, 1)).join(', ') + '}'
    const body = Object.entries(value).map(([k, v]) => k + ': ' + show(v, depth + 1)).join(', ')
    return body ? '{ ' + body + ' }' : '{}'
  }
  return String(value)
}

onmessage = (event) => {
  const { id, code, stdin } = event.data
  const input = (stdin || '').split('\n')
  let cursor = 0
  const emit = (type) => (...args) => postMessage({ id, type, text: args.map((a) => show(a)).join(' ') })
  const sandboxConsole = { log: emit('out'), info: emit('out'), debug: emit('out'), warn: emit('err'), error: emit('err') }
  const readLine = () => (cursor < input.length ? input[cursor++] : null)
  postMessage({ id, type: 'start' })
  try {
    new Function('console', 'prompt', 'readLine', '"use strict";\n' + code)(sandboxConsole, readLine, readLine)
    postMessage({ id, type: 'done' })
  } catch (err) {
    postMessage({ id, type: 'done', error: (err && err.name ? err.name + ': ' : '') + (err && err.message ? err.message : String(err)) })
  }
}

postMessage({ type: 'ready' })
