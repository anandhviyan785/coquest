/* CoQuest Python sandbox: runs learner code with Pyodide (CPython compiled to WebAssembly)
   inside a Web Worker. Nothing is sent to a server; the page kills this worker on timeout. */
const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'
importScripts(PYODIDE + 'pyodide.js')

const ready = loadPyodide({ indexURL: PYODIDE })
ready.then(
  () => postMessage({ type: 'ready' }),
  (err) => postMessage({ type: 'fatal', message: 'Could not load the Python runtime: ' + err.message }),
)

/** Keeps the part of a traceback that refers to the learner's code. */
function tidy(message) {
  const lines = String(message).split('\n')
  const start = lines.findIndex((l) => l.includes('File "<exec>"'))
  const kept = start >= 0 ? lines.slice(start) : lines.slice(-3)
  return kept.join('\n').replace(/File "<exec>", /g, '').trim()
}

onmessage = async (event) => {
  const { id, code, stdin } = event.data
  let py
  try {
    py = await ready
  } catch (err) {
    postMessage({ id, type: 'done', error: 'Could not load the Python runtime. Check your connection.' })
    return
  }
  const input = (stdin || '').split('\n')
  let cursor = 0
  py.setStdin({ stdin: () => (cursor < input.length ? input[cursor++] : null) })
  py.setStdout({ batched: (text) => postMessage({ id, type: 'out', text }) })
  py.setStderr({ batched: (text) => postMessage({ id, type: 'err', text }) })
  postMessage({ id, type: 'start' })
  const scope = py.globals.get('dict')()
  try {
    scope.set('__name__', '__main__')
    await py.runPythonAsync(code, { globals: scope })
    postMessage({ id, type: 'done' })
  } catch (err) {
    postMessage({ id, type: 'done', error: tidy(err.message) })
  } finally {
    try {
      py.runPython('import sys\nsys.stdout.flush()\nsys.stderr.flush()')
    } catch (_) {
      /* nothing left to flush */
    }
    scope.destroy()
  }
}
