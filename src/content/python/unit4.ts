import type { Unit } from '../../lib/types.ts'
import { choice, fill, out } from '../helpers.ts'

export const unit4: Unit = {
  id: 'py-4',
  title: 'Functions',
  lessons: [
    {
      id: 'py-4-1',
      title: 'Defining Functions',
      summary: 'Name a block of code and reuse it.',
      explain: [
        'A function is a named block of code you can run whenever you like. Define one with `def`, a name, brackets and a colon. The indented lines underneath are the function body.',
        'Defining a function does not run it. To run it you call it by writing its name followed by brackets.',
      ],
      example: { code: 'def cheer():\n    print("Go, go, go!")\n\ncheer()\ncheer()', output: 'Go, go, go!\nGo, go, go!' },
      questions: [
        choice('What does this program print?', ['Hi', 'Hi twice', 'Nothing', 'An error'], 2, 'The function is defined but never called, so its body never runs.', 'def greet():\n    print("Hi")'),
        fill('Complete the keyword that defines a function.', '___ launch():\n    print("Launching")', ['def'], 'def is short for "define".'),
      ],
      exercise: {
        prompt: 'Define a function called `banner` that prints a line of 10 `=` characters, then `QUEST`, then another line of 10 `=` characters. Call it once.',
        starter: '# Define banner() and then call it\n',
        solution: 'def banner():\n    print("=" * 10)\n    print("QUEST")\n    print("=" * 10)\n\nbanner()',
        tests: [out('Prints the banner once', '==========\nQUEST\n=========='), out('banner() can be called again', '==========\nQUEST\n==========\n==========\nQUEST\n==========', { append: 'banner()' })],
        hints: ['"=" * 10 makes a string of ten equals signs.', 'After the definition, call it on a new unindented line: banner()'],
      },
    },
    {
      id: 'py-4-2',
      title: 'Parameters',
      summary: 'Pass information into a function.',
      explain: [
        'Parameters are variables listed in a function\'s brackets. When you call the function you supply values — arguments — and each parameter takes the matching one.',
        'A parameter can have a default value, used when the caller leaves that argument out: `def greet(name, greeting="Hello")`.',
      ],
      example: { code: 'def greet(name, greeting="Hello"):\n    print(f"{greeting}, {name}!")\n\ngreet("Ada")\ngreet("Sam", "Welcome")', output: 'Hello, Ada!\nWelcome, Sam!' },
      questions: [
        choice('What is printed?', ['6', '9', '18', '3 6'], 2, 'a becomes 3 and b becomes 6, so a * b is 18.', 'def area(a, b):\n    print(a * b)\n\narea(3, 6)'),
        choice('What is printed?', ['Level 1', 'Level 5', 'Level', 'An error'], 0, 'No argument was passed, so the default value 1 is used.', 'def show(level=1):\n    print("Level", level)\n\nshow()'),
      ],
      exercise: {
        prompt: 'Define `describe(name, xp)` that prints `NAME has XP XP` — for example `Ada has 120 XP`.',
        starter: '# Define describe(name, xp)\n',
        solution: 'def describe(name, xp):\n    print(f"{name} has {xp} XP")',
        tests: [out('describe("Ada", 120)', 'Ada has 120 XP', { append: 'describe("Ada", 120)' }), out('describe("Sam", 0)', 'Sam has 0 XP', { append: 'describe("Sam", 0)' })],
        hints: ['Two parameters go in the brackets, separated by a comma.', 'An f-string does the formatting: f"{name} has {xp} XP".'],
      },
    },
    {
      id: 'py-4-3',
      title: 'Return Values',
      summary: 'Send a result back to the caller.',
      explain: [
        '`return` hands a value back to wherever the function was called, and ends the function immediately. The caller can store that value, print it, or use it in a calculation.',
        'Printing and returning are different. `print` only displays something; `return` gives the program a value to keep working with. A function without `return` gives back `None`.',
      ],
      example: { code: 'def square(n):\n    return n * n\n\nresult = square(6)\nprint(result)\nprint(square(2) + square(3))', output: '36\n13' },
      questions: [
        choice('What is printed?', ['7', 'None', '3 4', 'Nothing'], 1, 'add prints nothing and has no return, so it gives back None, which is then printed.', 'def add(a, b):\n    total = a + b\n\nprint(add(3, 4))'),
        choice('What is printed?', ['A', 'A then B', 'B', 'Nothing'], 0, 'return ends the function, so the second print is never reached.', 'def run():\n    print("A")\n    return\n    print("B")\n\nrun()'),
      ],
      exercise: {
        prompt: 'Define `is_even(n)` that **returns** `True` when `n` is even and `False` otherwise. Do not print inside the function.',
        starter: '# Define is_even(n)\n',
        solution: 'def is_even(n):\n    return n % 2 == 0',
        tests: [out('is_even(10) is True', 'True', { append: 'print(is_even(10))' }), out('is_even(7) is False', 'False', { append: 'print(is_even(7))' }), out('Nothing is printed by the function itself', 'done', { append: 'is_even(4)\nprint("done")' })],
        hints: ['n % 2 == 0 is already True or False.', 'You can return a comparison directly: return n % 2 == 0.'],
      },
    },
    {
      id: 'py-4-4',
      title: 'Scope',
      summary: 'Where a variable can be seen.',
      explain: [
        'A variable created inside a function is local: it exists only while that function runs and cannot be seen outside it. A variable created outside any function is global.',
        'A function can read a global variable, but assigning to a name inside a function creates a new local one instead of changing the global. The clean way to get a value out of a function is to `return` it.',
      ],
      example: { code: 'points = 10\n\ndef bonus():\n    points = 99\n    return points\n\nprint(bonus())\nprint(points)', output: '99\n10' },
      questions: [
        choice('What happens when this runs?', ['Prints 5', 'Prints None', 'An error: secret is not defined', 'Prints secret'], 2, 'secret is local to hide(). It does not exist outside the function.', 'def hide():\n    secret = 5\n\nhide()\nprint(secret)'),
        choice('What is printed?', ['1', '2', '3', 'An error'], 0, 'The assignment inside the function makes a separate local x. The global x is untouched.', 'x = 1\n\ndef change():\n    x = 2\n\nchange()\nprint(x)'),
      ],
      exercise: {
        prompt: 'The function `add_bonus` tries to change the global `score`, but it does not work. Rewrite it so `add_bonus(score)` **returns** the score plus 50, and the last lines print `150`.',
        starter: 'score = 100\n\ndef add_bonus():\n    score = score + 50\n\nadd_bonus()\nprint(score)',
        solution: 'score = 100\n\ndef add_bonus(score):\n    return score + 50\n\nscore = add_bonus(score)\nprint(score)',
        tests: [out('Prints 150', '150'), out('add_bonus(20) returns 70', '150\n70', { append: 'print(add_bonus(20))' })],
        hints: ['Give the function a parameter and return the new value: return score + 50.', 'Store the result back: score = add_bonus(score).'],
      },
    },
  ],
  boss: {
    id: 'boss:py-4',
    title: 'Debug the Bug Monster',
    monster: 'The Bug Monster',
    story: 'The Bug Monster has crawled into three functions and broken each one. Find the bugs and squash them.',
    stages: [
      {
        prompt: '`average(a, b, c)` should return the mean of three numbers, but it gives the wrong answer. Fix it.',
        starter: 'def average(a, b, c):\n    return a + b + c / 3',
        solution: 'def average(a, b, c):\n    return (a + b + c) / 3',
        tests: [out('average(3, 6, 9) is 6.0', '6.0', { append: 'print(average(3, 6, 9))' }), out('average(10, 20, 60) is 30.0', '30.0', { append: 'print(average(10, 20, 60))' })],
        hints: ['Division happens before addition.', 'Brackets fix the order: (a + b + c) / 3.'],
      },
      {
        prompt: '`count_vowels(text)` should return how many vowels (a, e, i, o, u) are in the text, in either case. It has two bugs.',
        starter: 'def count_vowels(text):\n    count = 0\n    for letter in text:\n        if letter in "aeiou":\n            count = count + 1\n        return count',
        solution: 'def count_vowels(text):\n    count = 0\n    for letter in text.lower():\n        if letter in "aeiou":\n            count = count + 1\n    return count',
        tests: [out('"banana" has 3', '3', { append: 'print(count_vowels("banana"))' }), out('"QUEST Explorer" has 5', '5', { append: 'print(count_vowels("QUEST Explorer"))' })],
        hints: ['The return is inside the loop, so the function stops after the first letter.', 'Capital vowels are missed. Loop over text.lower() instead.'],
      },
      {
        prompt: 'Write `largest(a, b, c)` from scratch. It must return the largest of three numbers **without** using the built-in `max`.',
        starter: 'def largest(a, b, c):\n    # Return the biggest of the three\n    pass',
        solution: 'def largest(a, b, c):\n    biggest = a\n    if b > biggest:\n        biggest = b\n    if c > biggest:\n        biggest = c\n    return biggest',
        tests: [
          out('largest(1, 9, 4) is 9', '9', { append: 'print(largest(1, 9, 4))' }),
          out('largest(7, 2, 7) is 7', '7', { append: 'print(largest(7, 2, 7))' }),
          out('largest(-5, -2, -9) is -2', '-2', { append: 'print(largest(-5, -2, -9))' }),
        ],
        hints: ['Start by assuming a is the biggest.', 'Then compare b and c against your current biggest, updating it when one is larger.'],
      },
    ],
  },
}
