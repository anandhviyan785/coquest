import type { Unit } from '../../lib/types.ts'
import { choice, fill, out } from '../helpers.ts'

export const unit2: Unit = {
  id: 'py-2',
  title: 'Conditional Logic',
  lessons: [
    {
      id: 'py-2-1',
      title: 'Boolean Logic',
      summary: 'True, False and how to combine them.',
      explain: [
        'A boolean is a value that is either `True` or `False`. Comparisons produce booleans: `==` (equal), `!=` (not equal), `<`, `>`, `<=` and `>=`.',
        'Combine booleans with `and` (both must be true), `or` (at least one must be true) and `not` (flips the value). Note that `=` assigns a value, while `==` compares two values.',
      ],
      example: { code: 'age = 15\nprint(age >= 13)\nprint(age >= 13 and age <= 19)\nprint(not age == 15)', output: 'True\nTrue\nFalse' },
      questions: [
        choice('What does this print?', ['True', 'False', '5', 'An error'], 1, 'and needs both sides to be true. 5 > 3 is True but 5 > 10 is False.', 'print(5 > 3 and 5 > 10)'),
        choice('Which operator checks whether two values are equal?', ['=', '==', '!=', '=>'], 1, 'A single = assigns. A double == compares.'),
      ],
      exercise: {
        prompt: 'A ride is open to anyone who is at least `120` cm tall **and** at most `14` years old. Using the variables given, print `True` or `False` for whether this person can ride.',
        starter: 'height = 130\nage = 12\n\n# Print True or False\n',
        solution: 'height = 130\nage = 12\nprint(height >= 120 and age <= 14)',
        tests: [out('This rider is allowed', 'True')],
        hints: ['You need two comparisons: height >= 120 and age <= 14.', 'Join them with and, and print the whole expression.'],
      },
    },
    {
      id: 'py-2-2',
      title: 'If Statements',
      summary: 'Run code only when a condition is true.',
      explain: [
        'An `if` statement runs a block of code only when its condition is `True`. The condition is followed by a colon, and the block underneath is indented by four spaces.',
        'Indentation is how Python knows which lines belong to the `if`. Lines that are not indented run no matter what.',
      ],
      example: { code: 'temperature = 31\nif temperature > 30:\n    print("It is hot")\nprint("Done")', output: 'It is hot\nDone' },
      questions: [
        choice('What is printed?', ['A then B', 'Only A', 'Only B', 'Nothing'], 2, '2 > 5 is False, so the indented line is skipped. B is not indented, so it always runs.', 'if 2 > 5:\n    print("A")\nprint("B")'),
        fill('Add the missing character that ends the if line.', 'if score > 50___\n    print("Pass")', [':'], 'Every if line ends with a colon.'),
      ],
      exercise: {
        prompt: 'Read a whole number with `input()`. If it is negative, print `Negative`. Always print `Checked` at the end.',
        starter: 'number = int(input())\n\n# Add your if statement, then print Checked\n',
        solution: 'number = int(input())\nif number < 0:\n    print("Negative")\nprint("Checked")',
        tests: [out('Negative numbers are flagged', 'Negative\nChecked', { stdin: '-4' }), out('Positive numbers are not', 'Checked', { stdin: '9' })],
        hints: ['The condition is number < 0, followed by a colon.', 'print("Checked") must not be indented, so it runs every time.'],
      },
    },
    {
      id: 'py-2-3',
      title: 'If-Else',
      summary: 'Choose between two paths.',
      explain: [
        'Add `else` to an `if` to say what should happen when the condition is `False`. Exactly one of the two blocks will run — never both, never neither.',
        '`else` has no condition of its own. It lines up with the `if` and also ends with a colon.',
      ],
      example: { code: 'number = 7\nif number % 2 == 0:\n    print("Even")\nelse:\n    print("Odd")', output: 'Odd' },
      questions: [
        choice('What is printed?', ['Adult', 'Minor', 'Both', 'Nothing'], 1, '16 >= 18 is False, so the else block runs.', 'age = 16\nif age >= 18:\n    print("Adult")\nelse:\n    print("Minor")'),
        choice('How many of the two blocks in an if-else run?', ['Zero', 'Exactly one', 'Both', 'It depends'], 1, 'if-else always runs exactly one of its two blocks.'),
      ],
      exercise: {
        prompt: 'Read a password with `input()`. If it equals `open-sesame`, print `Access granted`. Otherwise print `Access denied`.',
        starter: 'password = input()\n\n# Decide which message to print\n',
        solution: 'password = input()\nif password == "open-sesame":\n    print("Access granted")\nelse:\n    print("Access denied")',
        tests: [out('The right password works', 'Access granted', { stdin: 'open-sesame' }), out('A wrong password is refused', 'Access denied', { stdin: 'letmein' })],
        hints: ['Compare with ==, not =.', 'Line else: up with if, and indent the print under each.'],
      },
    },
    {
      id: 'py-2-4',
      title: 'Elif',
      summary: 'Handle more than two cases.',
      explain: [
        '`elif` is short for "else if". It lets you check several conditions in order. Python tests each one from the top and runs the first block whose condition is `True`, then skips the rest.',
        'Order matters. Put the most specific condition first, and finish with an `else` to catch everything that did not match.',
      ],
      example: { code: 'score = 72\nif score >= 90:\n    print("A")\nelif score >= 70:\n    print("B")\nelse:\n    print("C")', output: 'B' },
      questions: [
        choice('What is printed?', ['Big', 'Medium', 'Big and Medium', 'Small'], 0, 'The first true condition wins. 95 > 50 is true, so the elif is never checked.', 'n = 95\nif n > 50:\n    print("Big")\nelif n > 20:\n    print("Medium")\nelse:\n    print("Small")'),
        fill('Complete the keyword that checks a second condition.', 'if speed > 100:\n    print("Fast")\n___ speed > 50:\n    print("Steady")', ['elif'], 'elif adds another condition after an if.'),
      ],
      exercise: {
        prompt: 'Read a temperature as a whole number. Print `Freezing` if it is below 0, `Cold` if it is below 15, `Warm` if it is below 28, and `Hot` otherwise.',
        starter: 'temp = int(input())\n\n# Use if, elif and else\n',
        solution: 'temp = int(input())\nif temp < 0:\n    print("Freezing")\nelif temp < 15:\n    print("Cold")\nelif temp < 28:\n    print("Warm")\nelse:\n    print("Hot")',
        tests: [
          out('-5 is Freezing', 'Freezing', { stdin: '-5' }),
          out('10 is Cold', 'Cold', { stdin: '10' }),
          out('20 is Warm', 'Warm', { stdin: '20' }),
          out('35 is Hot', 'Hot', { stdin: '35' }),
        ],
        hints: ['Check the smallest boundary first: if temp < 0.', 'Each elif only runs if the ones above it were false, so elif temp < 15 already means "0 or more".'],
      },
    },
    {
      id: 'py-2-5',
      title: 'Nested Conditions',
      summary: 'Put decisions inside decisions.',
      explain: [
        'An `if` block can contain another `if`. The inner one is only reached when the outer condition is true. Each level is indented four more spaces.',
        'Nesting is useful when a second question only makes sense after the first is answered. If the nesting gets deep, combining conditions with `and` is often clearer.',
      ],
      example: { code: 'has_ticket = True\nage = 11\nif has_ticket:\n    if age < 12:\n        print("Child seat")\n    else:\n        print("Standard seat")\nelse:\n    print("No entry")', output: 'Child seat' },
      questions: [
        choice('What is printed?', ['Inner', 'Outer only', 'Nothing', 'An error'], 2, 'The outer condition is False, so nothing inside it — including the inner if — is reached.', 'x = 3\nif x > 5:\n    if x > 1:\n        print("Inner")'),
        choice('How far is code inside an if inside an if indented?', ['4 spaces', '8 spaces', '2 spaces', 'Not at all'], 1, 'Each level of nesting adds four spaces.'),
      ],
      exercise: {
        prompt: 'Read a username, then a level (whole number). If the username is `quest`: print `Guide` when the level is 10 or more, otherwise print `Explorer`. For any other username, print `Unknown`.',
        starter: 'username = input()\nlevel = int(input())\n\n# Use an if inside an if\n',
        solution: 'username = input()\nlevel = int(input())\nif username == "quest":\n    if level >= 10:\n        print("Guide")\n    else:\n        print("Explorer")\nelse:\n    print("Unknown")',
        tests: [
          out('quest at level 12 is a Guide', 'Guide', { stdin: 'quest\n12' }),
          out('quest at level 3 is an Explorer', 'Explorer', { stdin: 'quest\n3' }),
          out('Anyone else is Unknown', 'Unknown', { stdin: 'bob\n50' }),
        ],
        hints: ['Start with the outer question: if username == "quest":', 'Inside that block, add an if/else about level, indented by 8 spaces for the prints.'],
      },
    },
  ],
  boss: {
    id: 'boss:py-2',
    title: 'Defeat the Syntax Beast',
    monster: 'The Syntax Beast',
    story: 'The Syntax Beast feeds on missing colons and crooked indentation. Each program below is broken. Repair them and it starves.',
    stages: [
      {
        prompt: 'This program should print `Even` or `Odd`, but it has **two syntax errors**. Fix it.',
        starter: 'number = int(input())\nif number % 2 = 0\n    print("Even")\nelse:\n    print("Odd")',
        solution: 'number = int(input())\nif number % 2 == 0:\n    print("Even")\nelse:\n    print("Odd")',
        tests: [out('8 is Even', 'Even', { stdin: '8' }), out('3 is Odd', 'Odd', { stdin: '3' })],
        hints: ['Comparing needs ==, not =.', 'Every if line must end with a colon.'],
      },
      {
        prompt: 'This ticket-price program has broken indentation and a wrong keyword. It should print `Free` for under 5s, `Half` for under 16s and `Full` otherwise.',
        starter: 'age = int(input())\nif age < 5:\nprint("Free")\nelse if age < 16:\n    print("Half")\nelse:\n    print("Full")',
        solution: 'age = int(input())\nif age < 5:\n    print("Free")\nelif age < 16:\n    print("Half")\nelse:\n    print("Full")',
        tests: [out('Age 3 is Free', 'Free', { stdin: '3' }), out('Age 12 is Half', 'Half', { stdin: '12' }), out('Age 40 is Full', 'Full', { stdin: '40' })],
        hints: ['The print under the first if must be indented.', 'Python spells "else if" as one word: elif.'],
      },
      {
        prompt: 'The Beast\'s last trick is a logic bug, not a syntax error. A year is a leap year if it is divisible by 4, **except** years divisible by 100 — unless they are also divisible by 400. Fix the program so it prints `Leap` or `Common` correctly.',
        starter: 'year = int(input())\nif year % 4 == 0:\n    print("Leap")\nelse:\n    print("Common")',
        solution: 'year = int(input())\nif year % 400 == 0:\n    print("Leap")\nelif year % 100 == 0:\n    print("Common")\nelif year % 4 == 0:\n    print("Leap")\nelse:\n    print("Common")',
        tests: [
          out('2024 is a leap year', 'Leap', { stdin: '2024' }),
          out('1900 is not', 'Common', { stdin: '1900' }),
          out('2000 is', 'Leap', { stdin: '2000' }),
          out('2023 is not', 'Common', { stdin: '2023' }),
        ],
        hints: ['Check the most specific rule first: divisible by 400.', 'Then divisible by 100 (Common), then divisible by 4 (Leap), then everything else.'],
      },
    ],
  },
}
