import type { Unit } from '../../lib/types.ts'
import { choice, fill, out } from '../helpers.ts'

const EXPLORERS = `CREATE TABLE explorers (id INTEGER PRIMARY KEY, name TEXT, league TEXT, xp INTEGER);
INSERT INTO explorers (name, league, xp) VALUES
  ('Ada', 'Gold', 1500), ('Sam', 'Silver', 620), ('Lee', 'Gold', 1320),
  ('Mia', 'Bronze', 90), ('Kai', 'Silver', 480);`

const WITH_SCORES = `${EXPLORERS}
CREATE TABLE scores (explorer_id INTEGER, lesson TEXT, points INTEGER);
INSERT INTO scores (explorer_id, lesson, points) VALUES
  (1, 'basics', 90), (1, 'loops', 80), (2, 'basics', 70),
  (3, 'basics', 85), (3, 'loops', 95), (3, 'logic', 60);`

const PROFILES = `CREATE TABLE profiles (name TEXT, city TEXT);
INSERT INTO profiles (name, city) VALUES ('Ada', 'Paris'), ('Sam', NULL), ('Lee', 'Oslo'), ('Mia', NULL);`

/** SQL units 3 to 5: joins, changing data, NULL handling and subqueries. */
export const SQL_MORE_UNITS: Unit[] = [
  {
    id: 'sql-3',
    title: 'Joining Tables',
    lessons: [
      {
        id: 'sql-3-1',
        title: 'INNER JOIN',
        summary: 'Combine rows from two tables.',
        explain: [
          'Real databases split data across tables. A `JOIN` connects them using a matching column. Here `scores.explorer_id` points at `explorers.id`.',
          '`INNER JOIN` keeps only the rows that match on both sides. Give tables short aliases (`explorers e`) so columns read clearly: `e.name`, `s.points`.',
        ],
        example: { code: 'SELECT e.name, s.lesson\nFROM scores s\nJOIN explorers e ON e.id = s.explorer_id;', output: 'name | lesson\n-----+-------\nAda  | basics\nAda  | loops\n...' },
        questions: [
          choice('What does an INNER JOIN return?', ['Every row of both tables', 'Only rows that match in both tables', 'Only the first table', 'Rows that do not match'], 1, 'Rows without a partner are dropped.'),
          fill('Complete the keyword that says how the tables match.', 'FROM scores s JOIN explorers e ___ e.id = s.explorer_id', ['ON', 'on'], 'ON states the matching condition.'),
        ],
        exercise: {
          prompt: 'The `scores` table has `explorer_id`, `lesson` and `points`. Show each explorer\'s `name` and the `lesson` of each score, sorted by name and then lesson.',
          setup: WITH_SCORES,
          starter: '-- Join scores to explorers\n',
          solution: 'SELECT e.name, s.lesson FROM scores s JOIN explorers e ON e.id = s.explorer_id ORDER BY e.name, s.lesson;',
          tests: [out('Six scores with names', 'name | lesson\n-----+-------\nAda  | basics\nAda  | loops\nLee  | basics\nLee  | logic\nLee  | loops\nSam  | basics')],
          hints: ['FROM scores s JOIN explorers e ON e.id = s.explorer_id', 'Finish with ORDER BY e.name, s.lesson.'],
        },
      },
      {
        id: 'sql-3-2',
        title: 'LEFT JOIN',
        summary: 'Keep rows even when nothing matches.',
        explain: [
          '`LEFT JOIN` keeps every row from the left table, even those with no match on the right. The missing columns come back as `NULL`.',
          'This is how you find things that have nothing attached, such as explorers who have no scores. `COUNT(column)` ignores NULLs, so unmatched rows count as 0.',
        ],
        example: { code: 'SELECT e.name, s.lesson\nFROM explorers e\nLEFT JOIN scores s ON s.explorer_id = e.id;', output: 'name | lesson\n-----+-------\nAda  | basics\n...\nMia  | NULL' },
        questions: [
          choice('What does LEFT JOIN do with a left row that has no match?', ['Drops it', 'Keeps it with NULLs for the right columns', 'Raises an error', 'Duplicates it'], 1, 'The left table is always fully kept.'),
          choice('What does COUNT(s.lesson) return for a row with no match?', ['0', '1', 'NULL', 'An error'], 0, 'COUNT(column) skips NULLs, so the group counts 0.'),
        ],
        exercise: {
          prompt: 'Show every explorer\'s `name` and how many scores they have as `lessons` (zero included). Sort by `lessons`, largest first, then by `name`.',
          setup: WITH_SCORES,
          starter: '-- LEFT JOIN, then GROUP BY\n',
          solution: 'SELECT e.name, COUNT(s.lesson) AS lessons FROM explorers e LEFT JOIN scores s ON s.explorer_id = e.id GROUP BY e.id ORDER BY lessons DESC, e.name;',
          tests: [out('Lee 3, Ada 2, Sam 1, Kai 0, Mia 0', 'name | lessons\n-----+--------\nLee  | 3\nAda  | 2\nSam  | 1\nKai  | 0\nMia  | 0')],
          hints: ['FROM explorers e LEFT JOIN scores s ON s.explorer_id = e.id', 'GROUP BY e.id and count s.lesson, not *.'],
        },
      },
    ],
  },
  {
    id: 'sql-4',
    title: 'Changing Data',
    lessons: [
      {
        id: 'sql-4-1',
        title: 'INSERT and UPDATE',
        summary: 'Add rows and change them.',
        explain: [
          '`INSERT INTO table (columns) VALUES (values);` adds a row. `UPDATE table SET column = value WHERE condition;` changes existing rows. Without a `WHERE`, an UPDATE changes every row, so always check it.',
          '`DELETE FROM table WHERE condition;` removes rows, with the same warning. You can run several statements in a row, ending with a `SELECT` to see the result.',
        ],
        example: { code: "INSERT INTO explorers (name, league, xp) VALUES ('Zed', 'Bronze', 50);\nUPDATE explorers SET xp = xp + 10 WHERE name = 'Zed';\nSELECT name, xp FROM explorers WHERE name = 'Zed';", output: 'name | xp\n-----+---\nZed  | 60' },
        questions: [
          choice('What happens if you run UPDATE without a WHERE clause?', ['Nothing', 'Every row is changed', 'Only the first row is changed', 'It raises an error'], 1, 'No filter means all rows match.'),
          fill('Complete the statement that removes rows.', "___ FROM explorers WHERE xp < 100;", ['DELETE', 'delete'], 'DELETE FROM removes the matching rows.'),
        ],
        exercise: {
          prompt: "Add an explorer named `Zed` in the `Bronze` league with `50` XP. Then give every `Bronze` explorer `100` extra XP. Finally select the `name` and `xp` of the Bronze explorers, sorted by name.",
          setup: EXPLORERS,
          starter: '-- INSERT, UPDATE, then SELECT\n',
          solution: "INSERT INTO explorers (name, league, xp) VALUES ('Zed', 'Bronze', 50);\nUPDATE explorers SET xp = xp + 100 WHERE league = 'Bronze';\nSELECT name, xp FROM explorers WHERE league = 'Bronze' ORDER BY name;",
          tests: [out('Mia 190, Zed 150', 'name | xp\n-----+----\nMia  | 190\nZed  | 150')],
          hints: ["INSERT INTO explorers (name, league, xp) VALUES ('Zed', 'Bronze', 50);", "UPDATE explorers SET xp = xp + 100 WHERE league = 'Bronze'; then SELECT."],
        },
      },
      {
        id: 'sql-4-2',
        title: 'NULL and CASE',
        summary: 'Handle missing values and label rows.',
        explain: [
          '`NULL` means "no value". It is not equal to anything, not even itself, so use `IS NULL` and `IS NOT NULL` instead of `= NULL`.',
          '`CASE WHEN condition THEN a ELSE b END` picks a value per row, like an if statement inside a query. `COALESCE(city, \'unknown\')` is a shortcut that replaces NULL.',
        ],
        example: { code: "SELECT name, CASE WHEN city IS NULL THEN 'unknown' ELSE city END AS city\nFROM profiles;", output: 'name | city\n-----+--------\nAda  | Paris\nSam  | unknown\n...' },
        questions: [
          choice('How do you test for a missing value?', ['city = NULL', 'city IS NULL', 'city == NULL', 'city EMPTY'], 1, 'NULL never equals anything, so use IS NULL.'),
          fill('Complete the keyword that closes a CASE expression.', "CASE WHEN xp > 100 THEN 'high' ELSE 'low' ___", ['END', 'end'], 'Every CASE ends with END.'),
        ],
        exercise: {
          prompt: "The `profiles` table has `name` and `city`, and some cities are missing. Show each `name` and the `city`, replacing a missing city with `unknown`. Sort by name.",
          setup: PROFILES,
          starter: '-- Use CASE or COALESCE\n',
          solution: "SELECT name, COALESCE(city, 'unknown') AS city FROM profiles ORDER BY name;",
          tests: [out('Missing cities become unknown', 'name | city\n-----+--------\nAda  | Paris\nLee  | Oslo\nMia  | unknown\nSam  | unknown')],
          hints: ["COALESCE(city, 'unknown') returns the city, or 'unknown' when it is NULL.", 'Name the column city with AS and finish with ORDER BY name.'],
        },
      },
    ],
  },
  {
    id: 'sql-5',
    title: 'Advanced Queries',
    lessons: [
      {
        id: 'sql-5-1',
        title: 'HAVING and DISTINCT',
        summary: 'Filter groups and remove duplicates.',
        explain: [
          '`WHERE` filters rows before grouping. `HAVING` filters the groups after `GROUP BY`, which is how you keep only groups with, say, more than one member.',
          '`SELECT DISTINCT column` removes duplicate values from the result.',
        ],
        example: { code: 'SELECT league, COUNT(*) AS members\nFROM explorers\nGROUP BY league\nHAVING COUNT(*) > 1;', output: 'league | members\n-------+--------\nGold   | 2\nSilver | 2' },
        questions: [
          choice('Which clause filters groups after GROUP BY?', ['WHERE', 'HAVING', 'LIMIT', 'DISTINCT'], 1, 'HAVING works on aggregated groups.'),
          choice('What does SELECT DISTINCT league do?', ['Counts leagues', 'Returns each league value once', 'Sorts leagues', 'Deletes duplicates from the table'], 1, 'It only affects the result, not the table.'),
        ],
        exercise: {
          prompt: 'Show each `league` that has more than one explorer, with the number of explorers as `members`. Sort by league.',
          setup: EXPLORERS,
          starter: '-- GROUP BY, then HAVING\n',
          solution: 'SELECT league, COUNT(*) AS members FROM explorers GROUP BY league HAVING COUNT(*) > 1 ORDER BY league;',
          tests: [out('Gold 2 and Silver 2', 'league | members\n-------+--------\nGold   | 2\nSilver | 2')],
          hints: ['GROUP BY league and count with COUNT(*) AS members.', 'Add HAVING COUNT(*) > 1 before ORDER BY.'],
        },
      },
      {
        id: 'sql-5-2',
        title: 'Subqueries',
        summary: 'A query inside a query.',
        explain: [
          'A subquery is a `SELECT` inside another statement, wrapped in brackets. The inner query runs first and the outer query uses its answer.',
          'A common use is comparing to an aggregate: `WHERE xp > (SELECT AVG(xp) FROM explorers)` keeps the above-average rows.',
        ],
        example: { code: 'SELECT name FROM explorers\nWHERE xp > (SELECT AVG(xp) FROM explorers);', output: 'name\n----\nAda\nLee' },
        questions: [
          choice('In WHERE xp > (SELECT AVG(xp) FROM explorers), which part runs first?', ['The outer query', 'The inner query', 'Neither', 'Both at once'], 1, 'The bracketed query is evaluated first and gives a single value.'),
          fill('Complete the aggregate that finds the highest value.', 'SELECT ___(xp) FROM explorers;', ['MAX', 'max'], 'MAX returns the largest value in the column.'),
        ],
        exercise: {
          prompt: 'Show the `name` of every explorer whose XP is above the average XP of all explorers, highest XP first.',
          setup: EXPLORERS,
          starter: '-- Compare xp to a subquery\n',
          solution: 'SELECT name FROM explorers WHERE xp > (SELECT AVG(xp) FROM explorers) ORDER BY xp DESC;',
          tests: [out('Ada then Lee', 'name\n----\nAda\nLee')],
          hints: ['WHERE xp > (SELECT AVG(xp) FROM explorers)', 'Add ORDER BY xp DESC.'],
        },
      },
    ],
    boss: {
      id: 'boss:sql-5',
      title: 'Break the Cartesian Colossus',
      monster: 'The Cartesian Colossus',
      story: 'The Cartesian Colossus multiplies every row by every other row. Join your tables the right way to stop it.',
      stages: [
        {
          prompt: 'Show the `name` of every explorer who has **no** scores, sorted by name.',
          setup: WITH_SCORES,
          starter: '-- Find explorers without scores\n',
          solution: 'SELECT name FROM explorers WHERE id NOT IN (SELECT explorer_id FROM scores) ORDER BY name;',
          tests: [out('Kai and Mia', 'name\n----\nKai\nMia')],
          hints: ['A subquery can list explorer_id values from scores.', 'Use WHERE id NOT IN (...) and ORDER BY name.'],
        },
        {
          prompt: 'Show the `name` and total points as `total` of the explorer with the highest total score.',
          setup: WITH_SCORES,
          starter: '-- JOIN, SUM, ORDER BY, LIMIT\n',
          solution: 'SELECT e.name, SUM(s.points) AS total FROM explorers e JOIN scores s ON s.explorer_id = e.id GROUP BY e.id ORDER BY total DESC LIMIT 1;',
          tests: [out('Lee with 240', 'name | total\n-----+------\nLee  | 240')],
          hints: ['JOIN the tables and GROUP BY e.id with SUM(s.points).', 'Sort by total DESC and keep one row with LIMIT 1.'],
        },
      ],
    },
  },
]
