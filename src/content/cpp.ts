import type { Course } from '../lib/types.ts'
import { choice, fill, out } from './helpers.ts'

const MAIN_OPEN = '#include <iostream>\nusing namespace std;\n\nint main() {\n'
const MAIN_CLOSE = '    return 0;\n}'

export const cpp: Course = {
  id: 'cpp',
  name: 'C++',
  tagline: 'Fast, powerful and close to the machine',
  units: [
    {
      id: 'cpp-1',
      title: 'Fundamentals',
      lessons: [
        {
          id: 'cpp-1-1',
          title: 'Hello, C++',
          summary: 'The shape of a C++ program.',
          explain: [
            'Every C++ program starts running at a function called `main`. `#include <iostream>` brings in the tools for input and output.',
            '`cout` sends text to the screen using the `<<` operator, and `endl` ends the line. Every statement ends with a semicolon.',
          ],
          example: { code: `${MAIN_OPEN}    cout << "Hello, world!" << endl;\n${MAIN_CLOSE}`, output: 'Hello, world!' },
          questions: [
            choice('Where does a C++ program begin running?', ['At the first line of the file', 'In the main function', 'In iostream', 'At cout'], 1, 'Execution always starts at main().'),
            fill('Complete the statement that prints Hi.', '___ << "Hi" << endl;', ['cout', 'std::cout'], 'cout is the standard output stream.'),
          ],
          exercise: {
            prompt: 'Print `Hello, QUEST!` on one line and `C++ is fast` on the next.',
            starter: `${MAIN_OPEN}    // Write your two cout statements here\n\n${MAIN_CLOSE}`,
            solution: `${MAIN_OPEN}    cout << "Hello, QUEST!" << endl;\n    cout << "C++ is fast" << endl;\n${MAIN_CLOSE}`,
            tests: [out('Prints both lines', 'Hello, QUEST!\nC++ is fast')],
            hints: ['Each line is cout << "text" << endl;', 'Do not forget the semicolon at the end of each statement.'],
          },
        },
        {
          id: 'cpp-1-2',
          title: 'Variables and Input',
          summary: 'Typed variables and reading with cin.',
          explain: [
            'C++ is statically typed: you state a variable\'s type when you create it. `int` holds whole numbers, `double` holds decimals and `string` holds text.',
            '`cin >> x` reads a value typed by the user into the variable `x`.',
          ],
          example: { code: `${MAIN_OPEN}    int a, b;\n    cin >> a >> b;\n    cout << a + b << endl;\n${MAIN_CLOSE}`, output: '12' },
          questions: [
            choice('Which type stores a whole number?', ['double', 'string', 'int', 'char'], 2, 'int is short for integer.'),
            choice('What does `cin >> n;` do?', ['Prints n', 'Reads a value into n', 'Deletes n', 'Compares n'], 1, 'cin reads input; >> points toward the variable receiving it.'),
          ],
          exercise: {
            prompt: 'Read two whole numbers and print their product.',
            starter: `${MAIN_OPEN}    int a, b;\n    // Read a and b, then print a * b\n\n${MAIN_CLOSE}`,
            solution: `${MAIN_OPEN}    int a, b;\n    cin >> a >> b;\n    cout << a * b << endl;\n${MAIN_CLOSE}`,
            tests: [out('6 times 7', '42', { stdin: '6 7' }), out('Negative numbers', '-10', { stdin: '-2 5' })],
            hints: ['Read both in one statement: cin >> a >> b;', 'cout << a * b << endl; prints the product.'],
          },
        },
      ],
    },
    {
      id: 'cpp-2',
      title: 'Control Flow',
      lessons: [
        {
          id: 'cpp-2-1',
          title: 'If and Else',
          summary: 'Make decisions.',
          explain: [
            'Conditions go in round brackets and the block goes in curly braces. `==` compares, `&&` means and, `||` means or.',
            'Chain extra cases with `else if`, and finish with `else` for everything remaining.',
          ],
          example: { code: `${MAIN_OPEN}    int n = 7;\n    if (n % 2 == 0) {\n        cout << "Even" << endl;\n    } else {\n        cout << "Odd" << endl;\n    }\n${MAIN_CLOSE}`, output: 'Odd' },
          questions: [choice('Which operator tests equality in C++?', ['=', '==', '===', ':='], 1, '== compares; a single = assigns.')],
          exercise: {
            prompt: 'Read a whole number. Print `Positive`, `Negative` or `Zero`.',
            starter: `${MAIN_OPEN}    int n;\n    cin >> n;\n    // Decide what to print\n\n${MAIN_CLOSE}`,
            solution: `${MAIN_OPEN}    int n;\n    cin >> n;\n    if (n > 0) {\n        cout << "Positive" << endl;\n    } else if (n < 0) {\n        cout << "Negative" << endl;\n    } else {\n        cout << "Zero" << endl;\n    }\n${MAIN_CLOSE}`,
            tests: [out('5 is Positive', 'Positive', { stdin: '5' }), out('-2 is Negative', 'Negative', { stdin: '-2' }), out('0 is Zero', 'Zero', { stdin: '0' })],
            hints: ['Use if (n > 0) { ... } else if (n < 0) { ... } else { ... }', 'Each branch prints with cout << "..." << endl;'],
          },
        },
        {
          id: 'cpp-2-2',
          title: 'Loops',
          summary: 'Repeat with for and while.',
          explain: [
            'A `for` loop has three parts in its brackets: a starting statement, a condition, and a step. `for (int i = 1; i <= 5; i++)` counts from 1 to 5.',
            'A `while` loop repeats as long as its condition stays true.',
          ],
          example: { code: `${MAIN_OPEN}    for (int i = 1; i <= 3; i++) {\n        cout << i << endl;\n    }\n${MAIN_CLOSE}`, output: '1\n2\n3' },
          questions: [choice('How many times does this loop run?', ['3', '4', '5', '6'], 2, 'i takes the values 0, 1, 2, 3 and 4.', 'for (int i = 0; i < 5; i++) { }')],
          exercise: {
            prompt: 'Read a whole number `n` and print the sum of the numbers from 1 to `n`.',
            starter: `${MAIN_OPEN}    int n;\n    cin >> n;\n    int total = 0;\n    // Loop from 1 to n\n\n    cout << total << endl;\n${MAIN_CLOSE}`,
            solution: `${MAIN_OPEN}    int n;\n    cin >> n;\n    int total = 0;\n    for (int i = 1; i <= n; i++) {\n        total += i;\n    }\n    cout << total << endl;\n${MAIN_CLOSE}`,
            tests: [out('1 to 5', '15', { stdin: '5' }), out('1 to 100', '5050', { stdin: '100' })],
            hints: ['for (int i = 1; i <= n; i++)', 'Inside the loop: total += i;'],
          },
        },
      ],
    },
  ],
}
