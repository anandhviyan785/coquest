import type { Course } from '../lib/types.ts'
import { choice, fill, out } from './helpers.ts'

export const javascript: Course = {
  id: 'javascript',
  name: 'JavaScript',
  tagline: 'The language of the web',
  units: [
    {
      id: 'js-1',
      title: 'Fundamentals',
      lessons: [
        {
          id: 'js-1-1',
          title: 'Values and Variables',
          summary: 'Log output and store values.',
          explain: [
            '`console.log()` prints a value. Declare variables with `let` when the value will change and `const` when it will not. Statements usually end with a semicolon.',
            'Template literals use backticks and `${}` to insert values into text, much like an f-string in Python.',
          ],
          example: { code: 'const name = "Ada";\nlet xp = 10;\nxp = xp + 5;\nconsole.log(`${name} has ${xp} XP`);', output: 'Ada has 15 XP' },
          questions: [
            choice('Which keyword declares a variable that can be reassigned?', ['const', 'let', 'def', 'static'], 1, 'let allows reassignment; const does not.'),
            fill('Complete the call that prints to the console.', 'console.___("Hello");', ['log'], 'console.log() writes a line of output.'),
          ],
          exercise: {
            prompt: 'Declare a constant `planet` with the value `"Mars"` and a variable `moons` with the value `2`. Log `Mars has 2 moons` using a template literal.',
            starter: '// Declare planet and moons, then log the sentence\n',
            solution: 'const planet = "Mars";\nlet moons = 2;\nconsole.log(`${planet} has ${moons} moons`);',
            tests: [out('Logs the sentence', 'Mars has 2 moons')],
            hints: ['const planet = "Mars"; and let moons = 2;', 'Use backticks: `${planet} has ${moons} moons`'],
          },
        },
        {
          id: 'js-1-2',
          title: 'Conditions',
          summary: 'Branch with if, else if and else.',
          explain: [
            'Conditions go in round brackets and blocks go in curly braces. Use `===` to test for equality — it compares both value and type.',
            'Combine conditions with `&&` (and), `||` (or) and `!` (not).',
          ],
          example: { code: 'const score = 72;\nif (score >= 90) {\n  console.log("A");\n} else if (score >= 70) {\n  console.log("B");\n} else {\n  console.log("C");\n}', output: 'B' },
          questions: [
            choice('What does this log?', ['true', 'false', 'undefined', 'An error'], 1, '=== also compares type. The number 5 and the string "5" are different types.', 'console.log(5 === "5");'),
            choice('Which operator means "and"?', ['&&', '||', '!', '=='], 0, '&& is true only when both sides are true.'),
          ],
          exercise: {
            prompt: 'Write a function `sign(n)` that returns `"positive"`, `"negative"` or `"zero"`.',
            starter: 'function sign(n) {\n  // Return the right word\n}',
            solution: 'function sign(n) {\n  if (n > 0) {\n    return "positive";\n  } else if (n < 0) {\n    return "negative";\n  }\n  return "zero";\n}',
            tests: [out('sign(8)', 'positive', { append: 'console.log(sign(8));' }), out('sign(-3)', 'negative', { append: 'console.log(sign(-3));' }), out('sign(0)', 'zero', { append: 'console.log(sign(0));' })],
            hints: ['Start with if (n > 0) { return "positive"; }', 'After checking positive and negative, the only case left is zero.'],
          },
        },
      ],
    },
    {
      id: 'js-2',
      title: 'Functions and Arrays',
      lessons: [
        {
          id: 'js-2-1',
          title: 'Loops and Arrays',
          summary: 'Work through lists of values.',
          explain: [
            'An array is an ordered list in square brackets. Indexes start at 0 and `.length` gives the number of items. `push()` adds to the end.',
            'A `for...of` loop visits each item. The classic `for (let i = 0; i < n; i++)` loop counts instead.',
          ],
          example: { code: 'const tools = ["map", "rope"];\ntools.push("torch");\nfor (const tool of tools) {\n  console.log(tool);\n}\nconsole.log(tools.length);', output: 'map\nrope\ntorch\n3' },
          questions: [
            choice('What does this log?', ['1', '2', '3', 'undefined'], 2, '.length counts the items in the array.', 'console.log([4, 5, 6].length);'),
            fill('Complete the method that adds an item to the end of an array.', 'const list = [1];\nlist.___(2);', ['push'], 'push() appends one or more items.'),
          ],
          exercise: {
            prompt: 'Write a function `sum(numbers)` that returns the total of all numbers in the array.',
            starter: 'function sum(numbers) {\n  let total = 0;\n  // Add each number to total\n\n  return total;\n}',
            solution: 'function sum(numbers) {\n  let total = 0;\n  for (const n of numbers) {\n    total += n;\n  }\n  return total;\n}',
            tests: [out('sum([1, 2, 3, 4])', '10', { append: 'console.log(sum([1, 2, 3, 4]));' }), out('sum([])', '0', { append: 'console.log(sum([]));' })],
            hints: ['Loop with for (const n of numbers).', 'total += n adds n to the running total.'],
          },
        },
        {
          id: 'js-2-2',
          title: 'Arrow Functions and Array Methods',
          summary: 'Transform arrays without loops.',
          explain: [
            'An arrow function is a compact way to write a function: `(n) => n * 2`. When the body is a single expression, its value is returned automatically.',
            '`map()` builds a new array by transforming every item. `filter()` keeps only the items that pass a test.',
          ],
          example: { code: 'const nums = [1, 2, 3, 4];\nconst doubled = nums.map((n) => n * 2);\nconst even = nums.filter((n) => n % 2 === 0);\nconsole.log(doubled);\nconsole.log(even);', output: '[ 2, 4, 6, 8 ]\n[ 2, 4 ]' },
          questions: [
            choice('What does filter() return?', ['A single value', 'A new array of the items that passed the test', 'true or false', 'Nothing'], 1, 'filter() never changes the original; it returns a new array.'),
            choice('What does this log?', ['[ 1, 2, 3 ]', '[ 2, 3, 4 ]', '6', '[ 1, 4, 9 ]'], 3, 'Each item is replaced by itself multiplied by itself.', 'console.log([1, 2, 3].map((n) => n * n));'),
          ],
          exercise: {
            prompt: 'Write a function `longWords(words)` that returns the words with more than 4 letters, converted to upper case.',
            starter: 'function longWords(words) {\n  // Use filter and map\n}',
            solution: 'function longWords(words) {\n  return words.filter((w) => w.length > 4).map((w) => w.toUpperCase());\n}',
            tests: [out('Filters and shouts', 'QUEST,EXPLORER', { append: 'console.log(longWords(["hi", "quest", "map", "explorer"]).join(","));' }), out('No long words', '0', { append: 'console.log(longWords(["a", "be"]).length);' })],
            hints: ['Chain the two methods: words.filter(...).map(...).', 'filter with (w) => w.length > 4, then map with (w) => w.toUpperCase().'],
          },
        },
      ],
      boss: {
        id: 'boss:js-2',
        title: 'Untangle the Callback Kraken',
        monster: 'The Callback Kraken',
        story: 'The Callback Kraken wraps its arms around every array it finds. Free them with clean functions.',
        stages: [
          {
            prompt: 'Write `countWhere(items, test)` that returns how many items make the `test` function return true.',
            starter: 'function countWhere(items, test) {\n}',
            solution: 'function countWhere(items, test) {\n  return items.filter(test).length;\n}',
            tests: [out('Counts the evens', '2', { append: 'console.log(countWhere([1, 2, 3, 4], (n) => n % 2 === 0));' }), out('Counts nothing', '0', { append: 'console.log(countWhere([], () => true));' })],
            hints: ['filter(test) keeps the items that pass.', 'The answer is the length of that filtered array.'],
          },
          {
            prompt: 'Write `reverseWords(sentence)` that reverses the order of the words in a sentence.',
            starter: 'function reverseWords(sentence) {\n}',
            solution: 'function reverseWords(sentence) {\n  return sentence.split(" ").reverse().join(" ");\n}',
            tests: [out('Reverses three words', 'code love I', { append: 'console.log(reverseWords("I love code"));' }), out('One word is unchanged', 'quest', { append: 'console.log(reverseWords("quest"));' })],
            hints: ['split(" ") turns a sentence into an array of words.', 'reverse() flips the array and join(" ") glues it back together.'],
          },
        ],
      },
    },
  ],
}
