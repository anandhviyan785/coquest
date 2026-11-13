"""Runs a SQL exercise against SQLite and prints the result the way the in-app SQL sandbox does.
Reads {"setup": str, "code": str} as JSON on stdin. Used by verify-content.ts."""
import json
import sqlite3
import sys

payload = json.load(sys.stdin)
db = sqlite3.connect(':memory:')
try:
    if payload.get('setup'):
        db.executescript(payload['setup'])
    blocks = []
    for statement in [s for s in payload['code'].split(';') if s.strip()]:
        cursor = db.execute(statement)
        if cursor.description is None:
            continue
        columns = [c[0] for c in cursor.description]
        rows = [columns] + [['NULL' if v is None else str(v) for v in r] for r in cursor.fetchall()]
        widths = [max(len(r[i]) for r in rows) for i in range(len(columns))]
        line = lambda r: ' | '.join(c.ljust(widths[i]) for i, c in enumerate(r)).rstrip()
        blocks.append('\n'.join([line(rows[0]), '-+-'.join('-' * w for w in widths)] + [line(r) for r in rows[1:]]))
    print('\n'.join(blocks) if blocks else '(no rows returned)')
except Exception as err:  # noqa: BLE001 - report any SQL error to the verifier
    print('SQL error: ' + str(err), file=sys.stderr)
    sys.exit(1)
