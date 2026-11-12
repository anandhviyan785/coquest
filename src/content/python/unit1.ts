import type { Unit } from '../../lib/types.ts'
import { choice, fill, out } from '../helpers.ts'

export const unit1: Unit = {
  id: 'py-1',
  title: 'Fundamentals',
  lessons: [
    {
      id: 'py-1-1',
      title: 'Introduction to Python',
      summary: 'Write and run your first program.',
      explain: [
        'Python is a programming language known for reading almost like plain English. A Python program is a list of instructions that run from top to bottom, one line at a time.',
        'The `print()` function shows text on the screen. Text must be wrapped in quotes — that makes it a string. Anything after a `#` is a comment: a note for humans that Python ignores.',
      ],
      example: { code: '# This line is a comment\nprint("Hello, world!")\nprint("Python runs top to bottom")', output: 'Hello, world!\nPython runs top to bottom' },
      questions: [
        choice('What does this program display?', ['Hello', 'print("Hello")', '"Hello"', 'Nothing'], 0, 'print() shows the text inside the quotes — the quotes themselves are not displayed.', 'print("Hello")'),
        fill('Complete the line so it displays the word Quest.', '___("Quest")', ['print'], 'print() is the function that displays output.'),
      ],
      exercise: {
        prompt: 'Print two lines: first `Hello, QUEST!` and then `I am learning Python`.',
        starter: '# Write your two print statements below\n',
        solution: 'print("Hello, QUEST!")\nprint("I am learning Python")',
        tests: [out('Prints both lines', 'Hello, QUEST!\nI am learning Python')],
        hints: ['Each print() call displays one line.', 'Spelling, capitals and punctuation must match exactly — including the comma and exclamation mark.'],
      },
    },
    {
      id: 'py-1-2',
      title: 'Variables',
      summary: 'Store values and give them names.',
      explain: [
        'A variable is a named box that holds a value. You create one with `=`, the assignment operator: the name goes on the left and the value on the right.',
        'Once a variable exists you can use its name anywhere you would use the value. Assigning again replaces what was stored. Names can contain letters, digits and underscores, but cannot start with a digit.',
      ],
      example: { code: 'score = 10\nprint(score)\nscore = score + 5\nprint(score)', output: '10\n15' },
      questions: [
        choice('What is printed?', ['3', '7', '10', 'x'], 1, 'x starts as 3, then is replaced by 7. A variable only remembers its latest value.', 'x = 3\nx = 7\nprint(x)'),
        choice('Which of these is a valid variable name?', ['2fast', 'my-name', 'player_score', 'class'], 2, 'Names cannot start with a digit, contain hyphens, or be reserved words like class.'),
      ],
      exercise: {
        prompt: 'Create a variable `planet` holding the text `Mars` and a variable `moons` holding the number `2`. Then print `planet`, and print `moons` on the next line.',
        starter: '# Create your variables, then print them\n',
        solution: 'planet = "Mars"\nmoons = 2\nprint(planet)\nprint(moons)',
        tests: [out('Prints the planet and its moons', 'Mars\n2'), out('Variables hold the right values', 'Mars\n2\nMars 2', { append: 'print(planet, moons)' })],
        hints: ['Text needs quotes: planet = "Mars". Numbers do not: moons = 2.', 'Print a variable by name without quotes: print(planet).'],
      },
    },
    {
      id: 'py-1-3',
      title: 'Data Types',
      summary: 'Integers, floats, strings and booleans.',
      explain: [
        'Every value has a type. `int` is a whole number, `float` has a decimal point, `str` is text, and `bool` is either `True` or `False`.',
        'The `type()` function tells you the type of a value. You can convert between types with `int()`, `float()` and `str()` — for example `int("42")` turns the text "42" into the number 42.',
      ],
      example: { code: 'age = 16\nheight = 1.72\nname = "Ada"\nprint(type(age))\nprint(type(height))\nprint(int("42") + 1)', output: "<class 'int'>\n<class 'float'>\n43" },
      questions: [
        choice('What type is the value 3.0?', ['int', 'float', 'str', 'bool'], 1, 'Any number written with a decimal point is a float, even if the decimal part is zero.'),
        choice('What does this print?', ['5', '23', 'An error', '2 3'], 1, 'Both values are strings, so + joins them together instead of adding.', 'print("2" + "3")'),
      ],
      exercise: {
        prompt: 'The variable `text_number` holds the string `"25"`. Convert it to an integer, add `17`, and print the result.',
        starter: 'text_number = "25"\n\n# Convert it, add 17, and print the result\n',
        solution: 'text_number = "25"\nprint(int(text_number) + 17)',
        tests: [out('Prints 42', '42')],
        hints: ['int(text_number) gives you the number 25.', 'You can do the maths right inside print(): print(int(text_number) + 17).'],
      },
    },
    {
      id: 'py-1-4',
      title: 'Operators',
      summary: 'Do maths with numbers.',
      explain: [
        'Python has the arithmetic operators you expect: `+`, `-`, `*` and `/`. Division with `/` always produces a float.',
        'Three more are worth knowing: `//` divides and drops the remainder, `%` gives only the remainder, and `**` raises to a power. Multiplication and division happen before addition and subtraction; use brackets to change the order.',
      ],
      example: { code: 'print(7 / 2)\nprint(7 // 2)\nprint(7 % 2)\nprint(2 ** 3)\nprint((2 + 3) * 4)', output: '3.5\n3\n1\n8\n20' },
      questions: [
        choice('What does 17 % 5 evaluate to?', ['3', '2', '3.4', '12'], 1, '17 divided by 5 is 3 with 2 left over. % gives the remainder.'),
        choice('What is printed?', ['20', '14', '24', '9'], 1, 'Multiplication happens first: 3 * 4 = 12, then 2 + 12 = 14.', 'print(2 + 3 * 4)'),
      ],
      exercise: {
        prompt: 'A film lasts `total_minutes` minutes. Print the number of whole hours, then on the next line print the minutes left over.',
        starter: 'total_minutes = 137\n\n# Print the whole hours, then the leftover minutes\n',
        solution: 'total_minutes = 137\nprint(total_minutes // 60)\nprint(total_minutes % 60)',
        tests: [out('137 minutes is 2 hours and 17 minutes', '2\n17')],
        hints: ['// gives whole hours: total_minutes // 60.', '% gives what is left: total_minutes % 60.'],
      },
    },
    {
      id: 'py-1-5',
      title: 'Input and Output',
      summary: 'Read what the user types and reply.',
      explain: [
        'The `input()` function pauses the program and waits for the user to type a line. Whatever they type comes back as a string — even if it looks like a number.',
        'To build a reply, use an f-string: put `f` before the opening quote and write variables inside curly braces. `f"Hi {name}"` inserts the value of `name` into the text.',
      ],
      example: { code: 'name = input()\nage = int(input())\nprint(f"{name} will be {age + 1} next year")', output: 'Ada will be 17 next year' },
      questions: [
        choice('The user types 5. What type is the value stored in n?', ['int', 'float', 'str', 'bool'], 2, 'input() always returns a string. Use int(input()) to get a number.', 'n = input()'),
        fill('Complete the f-string so it prints the value of the variable city.', 'city = "Oslo"\nprint(f"I live in {___}")', ['city'], 'Inside an f-string, a variable name in curly braces is replaced by its value.'),
      ],
      exercise: {
        prompt: 'Read a name with `input()`, then read a number with `input()`. Print `Hello, NAME! Double your number is X.` where X is the number multiplied by 2.',
        starter: '# Read the two inputs (call input() with nothing inside the brackets)\n',
        solution: 'name = input()\nnumber = int(input())\nprint(f"Hello, {name}! Double your number is {number * 2}.")',
        tests: [
          out('Works for Ada and 21', 'Hello, Ada! Double your number is 42.', { stdin: 'Ada\n21' }),
          out('Works for Sam and 5', 'Hello, Sam! Double your number is 10.', { stdin: 'Sam\n5' }),
        ],
        hints: ['The number arrives as text. Wrap it: number = int(input()).', 'Use an f-string: print(f"Hello, {name}! Double your number is {number * 2}.")'],
      },
    },
  ],
  boss: {
    id: 'boss:py-1',
    title: 'Crack the Python Code',
    monster: 'The Cipher Sphinx',
    story: 'A stone sphinx guards the gate to the next unit. It only opens for explorers who can turn raw values into exact answers.',
    stages: [
      {
        prompt: 'The Sphinx whispers three numbers. Print their total on one line, then their average on the next line.',
        starter: 'a = 12\nb = 7\nc = 5\n\n# Print the total, then the average\n',
        solution: 'a = 12\nb = 7\nc = 5\ntotal = a + b + c\nprint(total)\nprint(total / 3)',
        tests: [out('Total and average', '24\n8.0')],
        hints: ['Add the three variables and store the result in total.', 'The average is total / 3. Dividing with / gives a float, so 8.0 is expected.'],
      },
      {
        prompt: 'Read a secret word with `input()`. Print the word repeated 3 times with no spaces, then print its length on the next line.',
        starter: '# Read the secret word, then print the two lines\n',
        solution: 'word = input()\nprint(word * 3)\nprint(len(word))',
        tests: [out('Works for "ab"', 'ababab\n2', { stdin: 'ab' }), out('Works for "quest"', 'questquestquest\n5', { stdin: 'quest' })],
        hints: ['Multiplying a string repeats it: "ab" * 3 is "ababab".', 'len(word) counts the characters in a string.'],
      },
      {
        prompt: 'The gate needs a passcode. Read a whole number with `input()`. Print `Code: X-Y` where X is the number squared and Y is the remainder when the number is divided by 7.',
        starter: '# Read the number and print the passcode\n',
        solution: 'n = int(input())\nprint(f"Code: {n ** 2}-{n % 7}")',
        tests: [out('Works for 9', 'Code: 81-2', { stdin: '9' }), out('Works for 15', 'Code: 225-1', { stdin: '15' })],
        hints: ['Convert the input first: n = int(input()).', 'n ** 2 squares a number and n % 7 gives the remainder. Put both inside an f-string.'],
      },
    ],
  },
}
