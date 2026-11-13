import type { Course } from '../lib/types.ts'
import { choice, fill, out } from './helpers.ts'
import { SQL_MORE_UNITS } from './more/sql.ts'

const EXPLORERS = `CREATE TABLE explorers (id INTEGER PRIMARY KEY, name TEXT, league TEXT, xp INTEGER);
INSERT INTO explorers (name, league, xp) VALUES
  ('Ada', 'Gold', 1500), ('Sam', 'Silver', 620), ('Lee', 'Gold', 1320),
  ('Mia', 'Bronze', 90), ('Kai', 'Silver', 480);`

export const sql: Course = {
  id: 'sql',
  name: 'SQL',
  tagline: 'Ask questions of data',
  units: [
    {
      id: 'sql-1',
      title: 'Querying Data',
      lessons: [
        {
          id: 'sql-1-1',
          title: 'SELECT',
          summary: 'Read columns from a table.',
          explain: [
            'A database stores data in tables made of rows and columns. `SELECT` reads data: list the columns you want, then `FROM` and the table name.',
            '`SELECT *` returns every column. Statements end with a semicolon, and keywords are conventionally written in capitals.',
          ],
          example: { code: 'SELECT name, xp FROM explorers;', output: 'name | xp\n-----+-----\nAda  | 1500\nSam  | 620\n...' },
          questions: [
            choice('What does SELECT * mean?', ['Select nothing', 'Select every column', 'Select the first row', 'Multiply the rows'], 1, 'The asterisk is shorthand for "all columns".'),
            fill('Complete the keyword that names the table.', 'SELECT name ___ explorers;', ['FROM', 'from'], 'FROM says which table to read.'),
          ],
          exercise: {
            prompt: 'The `explorers` table has the columns `id`, `name`, `league` and `xp`. Select the `name` and `league` of every explorer.',
            setup: EXPLORERS,
            starter: '-- Write your query below\n',
            solution: 'SELECT name, league FROM explorers;',
            tests: [out('Returns name and league for all five explorers', 'name | league\n-----+-------\nAda  | Gold\nSam  | Silver\nLee  | Gold\nMia  | Bronze\nKai  | Silver')],
            hints: ['List the two columns separated by a comma.', 'SELECT name, league FROM explorers;'],
          },
        },
        {
          id: 'sql-1-2',
          title: 'WHERE',
          summary: 'Filter the rows you get back.',
          explain: [
            '`WHERE` keeps only the rows that match a condition. Text values go in single quotes: `WHERE league = \'Gold\'`.',
            'Use `=`, `<>`, `<`, `>`, `<=`, `>=` to compare, and `AND` / `OR` to combine conditions.',
          ],
          example: { code: "SELECT name FROM explorers WHERE league = 'Gold';", output: 'name\n----\nAda\nLee' },
          questions: [
            choice('How is text written in SQL?', ['In double brackets', "In single quotes, like 'Gold'", 'Without quotes', 'In backticks only'], 1, 'String literals use single quotes.'),
            choice('Which rows does `WHERE xp > 500 AND league = \'Silver\'` keep?', ['Any Silver explorer', 'Anyone above 500 XP', 'Silver explorers above 500 XP', 'Nobody'], 2, 'AND requires both conditions to be true.'),
          ],
          exercise: {
            prompt: 'Select the `name` and `xp` of explorers with more than `600` XP.',
            setup: EXPLORERS,
            starter: '-- Write your query below\n',
            solution: 'SELECT name, xp FROM explorers WHERE xp > 600;',
            tests: [out('Returns Ada, Sam and Lee', 'name | xp\n-----+-----\nAda  | 1500\nSam  | 620\nLee  | 1320')],
            hints: ['Start with SELECT name, xp FROM explorers', 'Add WHERE xp > 600 before the semicolon.'],
          },
        },
      ],
    },
    {
      id: 'sql-2',
      title: 'Sorting and Summarising',
      lessons: [
        {
          id: 'sql-2-1',
          title: 'ORDER BY and LIMIT',
          summary: 'Sort results and take the top few.',
          explain: [
            '`ORDER BY` sorts the result by a column. Add `DESC` for largest-first; the default is `ASC`, smallest-first.',
            '`LIMIT` cuts the result off after a number of rows — together they answer "top N" questions.',
          ],
          example: { code: 'SELECT name, xp FROM explorers ORDER BY xp DESC LIMIT 2;', output: 'name | xp\n-----+-----\nAda  | 1500\nLee  | 1320' },
          questions: [choice('Which keyword sorts from largest to smallest?', ['ASC', 'DESC', 'TOP', 'MAX'], 1, 'DESC is short for descending.')],
          exercise: {
            prompt: 'Select the `name` of the three explorers with the **lowest** XP, lowest first.',
            setup: EXPLORERS,
            starter: '-- Write your query below\n',
            solution: 'SELECT name FROM explorers ORDER BY xp ASC LIMIT 3;',
            tests: [out('Returns Mia, Kai, Sam', 'name\n----\nMia\nKai\nSam')],
            hints: ['ORDER BY xp sorts smallest-first by default.', 'Finish with LIMIT 3.'],
          },
        },
        {
          id: 'sql-2-2',
          title: 'Aggregates and GROUP BY',
          summary: 'Count, total and average.',
          explain: [
            'Aggregate functions combine many rows into one value: `COUNT(*)`, `SUM(xp)`, `AVG(xp)`, `MIN(xp)` and `MAX(xp)`.',
            '`GROUP BY` splits the rows into groups first, so you get one result per group — for example, one row per league.',
          ],
          example: { code: 'SELECT league, COUNT(*) AS members FROM explorers GROUP BY league;', output: 'league | members\n-------+--------\nBronze | 1\nGold   | 2\nSilver | 2' },
          questions: [choice('What does COUNT(*) return?', ['The largest value', 'The number of rows', 'The total of a column', 'The column names'], 1, 'COUNT(*) counts rows.')],
          exercise: {
            prompt: 'For each league, show the `league` and the total XP of its explorers as a column named `total_xp`. Sort by `total_xp`, largest first.',
            setup: EXPLORERS,
            starter: '-- Write your query below\n',
            solution: 'SELECT league, SUM(xp) AS total_xp FROM explorers GROUP BY league ORDER BY total_xp DESC;',
            tests: [out('Gold 2820, Silver 1100, Bronze 90', 'league | total_xp\n-------+---------\nGold   | 2820\nSilver | 1100\nBronze | 90')],
            hints: ['SELECT league, SUM(xp) AS total_xp FROM explorers GROUP BY league', 'Add ORDER BY total_xp DESC at the end.'],
          },
        },
      ],
    },
    ...SQL_MORE_UNITS,
  ],
}
