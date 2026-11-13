import type { Unit } from '../../lib/types.ts'
import { choice, fill, out } from '../helpers.ts'

/** JavaScript units 3 to 5: strings, objects, recursion, destructuring and classes. */
export const JS_MORE_UNITS: Unit[] = [
  {
    id: 'js-3',
    title: 'Strings and Objects',
    lessons: [
      {
        id: 'js-3-1',
        title: 'String Methods',
        summary: 'Slice, search and reshape text.',
        explain: [
          'Strings come with built-in methods. `toUpperCase()` and `toLowerCase()` change case, `includes("x")` checks for text inside, and `slice(start, end)` cuts out a piece. Strings never change in place: every method returns a new string.',
          '`split(",")` turns a string into an array and `join("-")` turns an array back into a string. `trim()` removes spaces from both ends, and `.length` counts characters.',
        ],
        example: { code: 'const word = "  Quest  ";\nconsole.log(word.trim().toUpperCase());\nconsole.log("quest".slice(0, 3));\nconsole.log("a,b,c".split(",").length);', output: 'QUEST\nque\n3' },
        questions: [
          choice('What does "coding".slice(0, 3) return?', ['cod', 'codi', 'ing', 'odi'], 0, 'slice stops before the end index, so indexes 0, 1 and 2 are kept.'),
          fill('Complete the method that checks whether a string contains some text.', 'console.log("QUEST".___("UE"));', ['includes'], 'includes() returns true when the text is found.'),
        ],
        exercise: {
          prompt: 'Write a function `initials(name)` that takes a full name such as `"ada lovelace"` and returns the initials in capitals, such as `"AL"`.',
          starter: 'function initials(name) {\n  // Split into words, take the first letter of each\n}',
          solution: 'function initials(name) {\n  return name.split(" ").map((w) => w[0].toUpperCase()).join("");\n}',
          tests: [
            out('Two words', 'AL', { append: 'console.log(initials("ada lovelace"));' }),
            out('Three words', 'JRT', { append: 'console.log(initials("john ronald tolkien"));' }),
          ],
          hints: ['split(" ") gives an array of words.', 'map each word to w[0].toUpperCase() and join("") the letters.'],
        },
      },
      {
        id: 'js-3-2',
        title: 'Objects',
        summary: 'Group related values under names.',
        explain: [
          'An object stores values under named keys: `{ name: "Ada", xp: 10 }`. Read a value with a dot (`player.name`) or with brackets (`player["name"]`), and add or change one by assigning to it.',
          '`Object.keys(obj)` lists the keys and `Object.values(obj)` lists the values. Use `key in obj` to check whether a key exists.',
        ],
        example: { code: 'const player = { name: "Ada", xp: 10 };\nplayer.xp += 5;\nplayer.league = "Gold";\nconsole.log(player.name, player.xp);\nconsole.log(Object.keys(player).length);', output: 'Ada 15\n3' },
        questions: [
          choice('How do you read the xp value of player?', ['player.xp', 'player(xp)', 'player->xp', 'xp.player'], 0, 'Dot notation reads a property by name.'),
          choice('What does Object.keys({ a: 1, b: 2 }) return?', ['[1, 2]', '["a", "b"]', '2', '{ a, b }'], 1, 'keys() returns the property names as an array of strings.'),
        ],
        exercise: {
          prompt: 'Write a function `totalXp(players)` that takes an array of objects like `{ name: "Ada", xp: 120 }` and returns the sum of all their `xp` values.',
          starter: 'function totalXp(players) {\n  // Add up each player\'s xp\n}',
          solution: 'function totalXp(players) {\n  let total = 0;\n  for (const p of players) {\n    total += p.xp;\n  }\n  return total;\n}',
          tests: [
            out('Three players', '450', { append: 'console.log(totalXp([{ name: "Ada", xp: 120 }, { name: "Sam", xp: 200 }, { name: "Lee", xp: 130 }]));' }),
            out('No players', '0', { append: 'console.log(totalXp([]));' }),
          ],
          hints: ['Start a total at 0 and loop with for...of.', 'Add p.xp to the total on every pass, then return it.'],
        },
      },
    ],
  },
  {
    id: 'js-4',
    title: 'Flexible Functions',
    lessons: [
      {
        id: 'js-4-1',
        title: 'Default and Rest Parameters',
        summary: 'Functions that adapt to their inputs.',
        explain: [
          'A default parameter supplies a value when the caller leaves one out: `function greet(name = "friend")`. Calling `greet()` then uses "friend".',
          'A rest parameter collects extra arguments into an array: `function sum(...numbers)`. Inside the function, `numbers` is a normal array, so you can loop over it or call `reduce`.',
        ],
        example: { code: 'function greet(name = "friend") {\n  return `Hi, ${name}!`;\n}\nfunction sum(...nums) {\n  return nums.reduce((a, b) => a + b, 0);\n}\nconsole.log(greet());\nconsole.log(sum(1, 2, 3, 4));', output: 'Hi, friend!\n10' },
        questions: [
          choice('What does greet() return when it is defined as function greet(name = "friend")?', ['undefined', 'An error', 'A greeting for "friend"', 'null'], 2, 'The default is used when no argument is passed.'),
          fill('Complete the syntax that gathers all arguments into an array.', 'function total(___numbers) { return numbers.length; }', ['...'], 'Three dots before a parameter name make it a rest parameter.'),
        ],
        exercise: {
          prompt: 'Write a function `average(...numbers)` that returns the average of all the numbers it receives. If it receives none, return `0`.',
          starter: 'function average(...numbers) {\n  // Return the mean, or 0 when there are no numbers\n}',
          solution: 'function average(...numbers) {\n  if (numbers.length === 0) {\n    return 0;\n  }\n  return numbers.reduce((a, b) => a + b, 0) / numbers.length;\n}',
          tests: [
            out('Four numbers', '5', { append: 'console.log(average(2, 4, 6, 8));' }),
            out('One number', '7', { append: 'console.log(average(7));' }),
            out('No numbers', '0', { append: 'console.log(average());' }),
          ],
          hints: ['numbers is an array, so check numbers.length first.', 'Use reduce((a, b) => a + b, 0) and divide by numbers.length.'],
        },
      },
      {
        id: 'js-4-2',
        title: 'Recursion',
        summary: 'A function that calls itself.',
        explain: [
          'Recursion means a function solves a problem by calling itself on a smaller version of the problem. Every recursive function needs a base case that stops the calls, or it would run forever.',
          'For example, the factorial of 4 is `4 * factorial(3)`. The base case is `factorial(0)`, which is 1.',
        ],
        example: { code: 'function factorial(n) {\n  if (n === 0) {\n    return 1;\n  }\n  return n * factorial(n - 1);\n}\nconsole.log(factorial(5));', output: '120' },
        questions: [
          choice('What stops a recursive function from running forever?', ['A loop', 'A base case', 'A const', 'A return type'], 1, 'The base case returns without calling the function again.'),
          choice('What does factorial(3) return with the function above?', ['3', '6', '9', '12'], 1, '3 * 2 * 1 = 6.'),
        ],
        exercise: {
          prompt: 'Write a recursive function `sumTo(n)` that returns `1 + 2 + ... + n`. `sumTo(0)` is `0`.',
          starter: 'function sumTo(n) {\n  // Use a base case and a recursive call\n}',
          solution: 'function sumTo(n) {\n  if (n === 0) {\n    return 0;\n  }\n  return n + sumTo(n - 1);\n}',
          tests: [
            out('sumTo(4)', '10', { append: 'console.log(sumTo(4));' }),
            out('sumTo(10)', '55', { append: 'console.log(sumTo(10));' }),
            out('sumTo(0)', '0', { append: 'console.log(sumTo(0));' }),
          ],
          hints: ['The base case is n === 0, which returns 0.', 'Otherwise return n + sumTo(n - 1).'],
        },
      },
    ],
  },
  {
    id: 'js-5',
    title: 'Modern JavaScript',
    lessons: [
      {
        id: 'js-5-1',
        title: 'Destructuring and Spread',
        summary: 'Unpack and combine values quickly.',
        explain: [
          'Destructuring pulls values out of arrays and objects in one line: `const [first, second] = list;` and `const { name, xp } = player;`. The names inside the braces must match the keys.',
          'The spread operator `...` copies items into a new array or object: `[...a, ...b]` joins two arrays, and `{ ...player, xp: 50 }` makes a copy with one value changed.',
        ],
        example: { code: 'const player = { name: "Ada", xp: 10 };\nconst { name, xp } = player;\nconst better = { ...player, xp: 50 };\nconst all = [...[1, 2], ...[3]];\nconsole.log(name, xp, better.xp, all.length);', output: 'Ada 10 50 3' },
        questions: [
          choice('What does const [a, b] = [10, 20]; make a equal to?', ['10', '20', '[10, 20]', 'undefined'], 0, 'Array destructuring matches by position, so a is the first item.'),
          fill('Complete the spread that copies the array.', 'const copy = [___original];', ['...'], 'Spread unpacks the items into the new array.'),
        ],
        exercise: {
          prompt: 'Write a function `merge(a, b)` that takes two arrays and returns one new array with all the items of `a` followed by all the items of `b`, using spread.',
          starter: 'function merge(a, b) {\n  // Return a new array\n}',
          solution: 'function merge(a, b) {\n  return [...a, ...b];\n}',
          tests: [
            out('Joins two arrays', '1,2,3,4', { append: 'console.log(merge([1, 2], [3, 4]).join(","));' }),
            out('Empty first array', '9', { append: 'console.log(merge([], [9]).join(","));' }),
          ],
          hints: ['Put both arrays inside square brackets.', 'return [...a, ...b];'],
        },
      },
      {
        id: 'js-5-2',
        title: 'Classes',
        summary: 'Blueprints for objects.',
        explain: [
          'A class is a blueprint for objects. The `constructor` runs when you create one with `new`, and it sets up the properties using `this`. Functions inside a class are called methods.',
          'Every object made from the class gets its own copy of the data but shares the same methods.',
        ],
        example: { code: 'class Explorer {\n  constructor(name) {\n    this.name = name;\n    this.xp = 0;\n  }\n  gain(n) {\n    this.xp += n;\n  }\n}\nconst ada = new Explorer("Ada");\nada.gain(20);\nconsole.log(ada.name, ada.xp);', output: 'Ada 20' },
        questions: [
          choice('Which keyword creates an object from a class?', ['make', 'new', 'create', 'object'], 1, '`new ClassName()` runs the constructor and returns the object.'),
          fill('Complete the keyword that refers to the current object.', 'constructor(name) { ___.name = name; }', ['this'], 'this is the object being built or used.'),
        ],
        exercise: {
          prompt: 'Write a class `Counter` with a constructor that starts `count` at `0`, an `add()` method that increases it by 1, and a `value()` method that returns it.',
          starter: 'class Counter {\n  // constructor, add and value\n}',
          solution: 'class Counter {\n  constructor() {\n    this.count = 0;\n  }\n  add() {\n    this.count += 1;\n  }\n  value() {\n    return this.count;\n  }\n}',
          tests: [
            out('Starts at zero', '0', { append: 'console.log(new Counter().value());' }),
            out('Three adds', '3', { append: 'const c = new Counter(); c.add(); c.add(); c.add(); console.log(c.value());' }),
          ],
          hints: ['In the constructor, write this.count = 0;', 'add() does this.count += 1 and value() returns this.count.'],
        },
      },
    ],
    boss: {
      id: 'boss:js-5',
      title: 'Tame the Prototype Hydra',
      monster: 'The Prototype Hydra',
      story: 'Every time you cut one bug off the Prototype Hydra, two more grow back. Use objects and recursion to stop it.',
      stages: [
        {
          prompt: 'Write `countWords(text)` that returns an object with how many times each word appears. For example `"a b a"` gives `{ a: 2, b: 1 }`.',
          starter: 'function countWords(text) {\n}',
          solution: 'function countWords(text) {\n  const counts = {};\n  for (const word of text.split(" ")) {\n    counts[word] = (counts[word] || 0) + 1;\n  }\n  return counts;\n}',
          tests: [
            out('Counts repeats', '2,1', { append: 'const c = countWords("a b a"); console.log(c.a + "," + c.b);' }),
            out('Single word', '1', { append: 'console.log(countWords("quest").quest);' }),
          ],
          hints: ['Start with an empty object and loop over text.split(" ").', 'counts[word] = (counts[word] || 0) + 1;'],
        },
        {
          prompt: 'Write a recursive `power(base, exponent)` that returns `base` raised to a whole `exponent`. `power(2, 0)` is `1`.',
          starter: 'function power(base, exponent) {\n}',
          solution: 'function power(base, exponent) {\n  if (exponent === 0) {\n    return 1;\n  }\n  return base * power(base, exponent - 1);\n}',
          tests: [
            out('2 to the 5', '32', { append: 'console.log(power(2, 5));' }),
            out('Anything to the 0', '1', { append: 'console.log(power(9, 0));' }),
          ],
          hints: ['The base case is exponent === 0, which returns 1.', 'Otherwise return base * power(base, exponent - 1).'],
        },
      ],
    },
  },
]
