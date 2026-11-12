import type { Unit } from '../../lib/types.ts'
import { choice, fill, out } from '../helpers.ts'

export const unit3: Unit = {
  id: 'py-3',
  title: 'Loops',
  lessons: [
    {
      id: 'py-3-1',
      title: 'For Loops',
      summary: 'Repeat code a set number of times.',
      explain: [
        'A `for` loop repeats a block once for every item in a sequence. `range(5)` produces the numbers 0, 1, 2, 3, 4 — it starts at zero and stops before 5.',
        '`range(start, stop)` lets you choose where to begin, and `range(start, stop, step)` lets you skip. The loop variable takes each value in turn.',
      ],
      example: { code: 'for i in range(3):\n    print("Lap", i)\n\nfor n in range(2, 9, 3):\n    print(n)', output: 'Lap 0\nLap 1\nLap 2\n2\n5\n8' },
      questions: [
        choice('How many times does this loop print?', ['3', '4', '5', '6'], 1, 'range(1, 5) gives 1, 2, 3, 4 — the stop value is not included.', 'for i in range(1, 5):\n    print(i)'),
        fill('Complete the loop so it runs 10 times.', 'for i in ___(10):\n    print(i)', ['range'], 'range(10) produces the ten numbers 0 to 9.'),
      ],
      exercise: {
        prompt: 'Read a whole number `n`. Print the sum of all whole numbers from 1 up to and including `n`.',
        starter: 'n = int(input())\ntotal = 0\n\n# Loop from 1 to n, adding each number to total\n\nprint(total)',
        solution: 'n = int(input())\ntotal = 0\nfor i in range(1, n + 1):\n    total = total + i\nprint(total)',
        tests: [out('1 to 5 sums to 15', '15', { stdin: '5' }), out('1 to 100 sums to 5050', '5050', { stdin: '100' })],
        hints: ['To include n, the range must stop at n + 1.', 'Inside the loop: total = total + i.'],
      },
    },
    {
      id: 'py-3-2',
      title: 'While Loops',
      summary: 'Repeat for as long as a condition holds.',
      explain: [
        'A `while` loop keeps running its block as long as its condition is `True`. Use it when you do not know in advance how many repeats you need.',
        'Something inside the loop must eventually make the condition false. If nothing does, the loop never ends — an infinite loop.',
      ],
      example: { code: 'fuel = 3\nwhile fuel > 0:\n    print("Fuel left:", fuel)\n    fuel = fuel - 1\nprint("Empty")', output: 'Fuel left: 3\nFuel left: 2\nFuel left: 1\nEmpty' },
      questions: [
        choice('What is wrong with this loop?', ['Nothing', 'It never ends', 'It never starts', 'It prints 6'], 1, 'count never changes, so count < 5 stays true forever.', 'count = 0\nwhile count < 5:\n    print(count)'),
        choice('What is printed last?', ['1', '2', '8', '16'], 3, 'n doubles each pass: 2, 4, 8, 16. At 16 the condition 16 < 10 fails, and 16 is printed.', 'n = 1\nwhile n < 10:\n    n = n * 2\nprint(n)'),
      ],
      exercise: {
        prompt: 'Read a whole number. Keep halving it with `//` until it reaches 0, and print how many halvings that took.',
        starter: 'number = int(input())\nsteps = 0\n\n# Loop while number is greater than 0\n\nprint(steps)',
        solution: 'number = int(input())\nsteps = 0\nwhile number > 0:\n    number = number // 2\n    steps = steps + 1\nprint(steps)',
        tests: [out('8 takes 4 halvings', '4', { stdin: '8' }), out('100 takes 7 halvings', '7', { stdin: '100' })],
        hints: ['The loop condition is number > 0.', 'Each pass does two things: number = number // 2 and steps = steps + 1.'],
      },
    },
    {
      id: 'py-3-3',
      title: 'Break and Continue',
      summary: 'Leave a loop early or skip a turn.',
      explain: [
        '`break` stops a loop immediately, even if there are items left. `continue` skips the rest of the current pass and jumps to the next one.',
        'Both are usually placed inside an `if`, so they only trigger in particular situations.',
      ],
      example: { code: 'for n in range(1, 8):\n    if n == 3:\n        continue\n    if n == 6:\n        break\n    print(n)', output: '1\n2\n4\n5' },
      questions: [
        choice('What is printed?', ['0 1 2 3 4', '0 1 2', '0 1 2 3', '3'], 1, 'When i reaches 3, break ends the loop before the print.', 'for i in range(5):\n    if i == 3:\n        break\n    print(i)'),
        fill('Complete the keyword that skips to the next pass of the loop.', 'for n in range(10):\n    if n % 2 == 0:\n        ___\n    print(n)', ['continue'], 'continue skips the rest of this pass, so only odd numbers are printed.'),
      ],
      exercise: {
        prompt: 'Read numbers one per line until you read `0`, then stop. Ignore negative numbers. Print the sum of the positive numbers you read.',
        starter: 'total = 0\nwhile True:\n    number = int(input())\n    # Stop on 0, skip negatives, otherwise add to total\n\nprint(total)',
        solution: 'total = 0\nwhile True:\n    number = int(input())\n    if number == 0:\n        break\n    if number < 0:\n        continue\n    total = total + number\nprint(total)',
        tests: [out('Adds positives and stops at 0', '12', { stdin: '5\n-3\n7\n0\n99' }), out('Handles 0 straight away', '0', { stdin: '0' })],
        hints: ['if number == 0: break ends the loop.', 'if number < 0: continue jumps back to the top without adding.'],
      },
    },
  ],
  boss: {
    id: 'boss:py-3',
    title: 'Escape the Infinite Loop',
    monster: 'The Loop Serpent',
    story: 'The Loop Serpent has swallowed its own tail and trapped the corridor in endless repetition. Break each loop it has cursed.',
    stages: [
      {
        prompt: 'This countdown never ends. Fix it so it prints 5, 4, 3, 2, 1 and then `Liftoff`.',
        starter: 'count = 5\nwhile count > 0:\n    print(count)\nprint("Liftoff")',
        solution: 'count = 5\nwhile count > 0:\n    print(count)\n    count = count - 1\nprint("Liftoff")',
        tests: [out('Counts down and lifts off', '5\n4\n3\n2\n1\nLiftoff')],
        hints: ['Nothing inside the loop changes count.', 'Add count = count - 1 inside the loop, indented.'],
      },
      {
        prompt: 'Read a whole number `n`. Print every number from 1 to `n`, but print `Fizz` instead of multiples of 3, `Buzz` instead of multiples of 5, and `FizzBuzz` for multiples of both.',
        starter: 'n = int(input())\n\n# Loop from 1 to n\n',
        solution: 'n = int(input())\nfor i in range(1, n + 1):\n    if i % 15 == 0:\n        print("FizzBuzz")\n    elif i % 3 == 0:\n        print("Fizz")\n    elif i % 5 == 0:\n        print("Buzz")\n    else:\n        print(i)',
        tests: [out('Works up to 15', '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz', { stdin: '15' })],
        hints: ['Check "both" first: i % 15 == 0.', 'Use if / elif / elif / else inside the for loop.'],
      },
      {
        prompt: 'The Serpent hides a number. Read a whole number `n` greater than 1 and print the smallest number greater than 1 that divides it exactly. (For a prime, that is the number itself.)',
        starter: 'n = int(input())\n\n# Try 2, 3, 4... and stop at the first divisor\n',
        solution: 'n = int(input())\nd = 2\nwhile n % d != 0:\n    d = d + 1\nprint(d)',
        tests: [out('Smallest divisor of 91 is 7', '7', { stdin: '91' }), out('Smallest divisor of 12 is 2', '2', { stdin: '12' }), out('13 is prime', '13', { stdin: '13' })],
        hints: ['Start with d = 2 and loop while n % d != 0.', 'Increase d by 1 each pass. The loop ends at the first exact divisor.'],
      },
    ],
  },
}
