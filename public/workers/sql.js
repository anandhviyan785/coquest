/* CoQuest SQL sandbox: an in-memory SQLite database (sql.js / WebAssembly) inside a Web Worker.
   Every run starts from a fresh database seeded with the exercise's tables. */
const SQLJS = 'https://cdn.jsdelivr.net/npm/sql.js@1.12.0/dist/'
importScripts(SQLJS + 'sql-wasm.js')

const ready = initSqlJs({ locateFile: (file) => SQLJS + file })
ready.then(
  () => postMessage({ type: 'ready' }),
  (err) => postMessage({ type: 'fatal', message: 'Could not load the SQL runtime: ' + err.message }),
)

function table(result) {
  const rows = [result.columns, ...result.values.map((r) => r.map((v) => (v === null ? 'NULL' : String(v))))]
  const widths = result.columns.map((_, i) => Math.max(...rows.map((r) => r[i].length)))
  const line = (r) => r.map((cell, i) => cell.padEnd(widths[i])).join(' | ').trimEnd()
  return [line(rows[0]), widths.map((w) => '-'.repeat(w)).join('-+-'), ...rows.slice(1).map(line)].join('\n')
}

onmessage = async (event) => {
  const { id, code, setup } = event.data
  let SQL
  try {
    SQL = await ready
  } catch (err) {
    postMessage({ id, type: 'done', error: 'Could not load the SQL runtime. Check your connection.' })
    return
  }
  postMessage({ id, type: 'start' })
  const db = new SQL.Database()
  try {
    if (setup) db.run(setup)
    const results = db.exec(code)
    if (results.length === 0) postMessage({ id, type: 'out', text: '(no rows returned)' })
    results.forEach((r) => postMessage({ id, type: 'out', text: table(r) }))
    postMessage({ id, type: 'done' })
  } catch (err) {
    postMessage({ id, type: 'done', error: 'SQL error: ' + err.message })
  } finally {
    db.close()
  }
}
