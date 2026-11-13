import type { Course } from '../lib/types.ts'
import { choice, fill, out } from './helpers.ts'
import { JAVA_MORE_UNITS } from './more/java.ts'

const OPEN = 'public class Main {\n    public static void main(String[] args) {\n'
const OPEN_SCANNER = 'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner in = new Scanner(System.in);\n'
const CLOSE = '    }\n}'

export const java: Course = {
  id: 'java',
  name: 'Java',
  tagline: 'Structured, typed and everywhere',
  units: [
    {
      id: 'java-1',
      title: 'Fundamentals',
      lessons: [
        {
          id: 'java-1-1',
          title: 'Hello, Java',
          summary: 'Classes, main and printing.',
          explain: [
            'All Java code lives inside a class. The program starts at a method with the exact signature `public static void main(String[] args)`.',
            '`System.out.println()` prints a line of text. Every statement ends with a semicolon, and blocks are wrapped in curly braces.',
          ],
          example: { code: `${OPEN}        System.out.println("Hello, world!");\n${CLOSE}`, output: 'Hello, world!' },
          questions: [
            choice('Where must all Java code be written?', ['Inside a class', 'At the top of the file', 'Inside a loop', 'Anywhere'], 0, 'Java is class-based: every method belongs to a class.'),
            fill('Complete the statement that prints a line.', 'System.out.___("Hi");', ['println'], 'println prints its argument followed by a new line.'),
          ],
          exercise: {
            prompt: 'Print `Hello, QUEST!` on one line and `Java is everywhere` on the next.',
            starter: `${OPEN}        // Write your two println statements here\n\n${CLOSE}`,
            solution: `${OPEN}        System.out.println("Hello, QUEST!");\n        System.out.println("Java is everywhere");\n${CLOSE}`,
            tests: [out('Prints both lines', 'Hello, QUEST!\nJava is everywhere')],
            hints: ['System.out.println("text"); prints one line.', 'Keep the class named Main so the program can be found.'],
          },
        },
        {
          id: 'java-1-2',
          title: 'Variables and Input',
          summary: 'Typed variables and the Scanner.',
          explain: [
            'Java variables have a declared type: `int` for whole numbers, `double` for decimals, `boolean` for true/false and `String` for text.',
            'A `Scanner` reads input. `in.nextInt()` reads the next whole number and `in.next()` reads the next word.',
          ],
          example: { code: `${OPEN_SCANNER}        int a = in.nextInt();\n        int b = in.nextInt();\n        System.out.println(a + b);\n${CLOSE}`, output: '12' },
          questions: [
            choice('Which type holds text in Java?', ['int', 'char', 'String', 'text'], 2, 'String (with a capital S) stores text.'),
            choice('What does `in.nextInt()` return?', ['The next line of text', 'The next whole number typed', 'A random number', 'Nothing'], 1, 'nextInt() parses the next token of input as an int.'),
          ],
          exercise: {
            prompt: 'Read two whole numbers and print their product.',
            starter: `${OPEN_SCANNER}        // Read two ints and print their product\n\n${CLOSE}`,
            solution: `${OPEN_SCANNER}        int a = in.nextInt();\n        int b = in.nextInt();\n        System.out.println(a * b);\n${CLOSE}`,
            tests: [out('6 times 7', '42', { stdin: '6 7' }), out('Negative numbers', '-10', { stdin: '-2 5' })],
            hints: ['int a = in.nextInt(); reads one number.', 'System.out.println(a * b); prints the product.'],
          },
        },
      ],
    },
    {
      id: 'java-2',
      title: 'Control Flow',
      lessons: [
        {
          id: 'java-2-1',
          title: 'If and Else',
          summary: 'Make decisions.',
          explain: [
            'Java conditions go in round brackets and must be boolean. Use `==` to compare numbers, and `.equals()` to compare Strings.',
            'Chain cases with `else if` and finish with `else`.',
          ],
          example: { code: `${OPEN}        int n = 7;\n        if (n % 2 == 0) {\n            System.out.println("Even");\n        } else {\n            System.out.println("Odd");\n        }\n${CLOSE}`, output: 'Odd' },
          questions: [choice('How should two Strings be compared for equal text?', ['a == b', 'a.equals(b)', 'a = b', 'a.same(b)'], 1, '== checks whether they are the same object; equals() compares the text.')],
          exercise: {
            prompt: 'Read a whole number. Print `Positive`, `Negative` or `Zero`.',
            starter: `${OPEN_SCANNER}        int n = in.nextInt();\n        // Decide what to print\n\n${CLOSE}`,
            solution: `${OPEN_SCANNER}        int n = in.nextInt();\n        if (n > 0) {\n            System.out.println("Positive");\n        } else if (n < 0) {\n            System.out.println("Negative");\n        } else {\n            System.out.println("Zero");\n        }\n${CLOSE}`,
            tests: [out('5 is Positive', 'Positive', { stdin: '5' }), out('-2 is Negative', 'Negative', { stdin: '-2' }), out('0 is Zero', 'Zero', { stdin: '0' })],
            hints: ['if (n > 0) { ... } else if (n < 0) { ... } else { ... }', 'Each branch calls System.out.println with the right word.'],
          },
        },
        {
          id: 'java-2-2',
          title: 'Loops',
          summary: 'Repeat with for and while.',
          explain: [
            'A `for` loop packs a start, a condition and a step into one line: `for (int i = 1; i <= 5; i++)`.',
            'A `while` loop repeats for as long as its condition is true.',
          ],
          example: { code: `${OPEN}        for (int i = 1; i <= 3; i++) {\n            System.out.println(i);\n        }\n${CLOSE}`, output: '1\n2\n3' },
          questions: [choice('What does `i++` do?', ['Doubles i', 'Adds 1 to i', 'Prints i', 'Resets i'], 1, 'i++ is shorthand for i = i + 1.')],
          exercise: {
            prompt: 'Read a whole number `n` and print the sum of the numbers from 1 to `n`.',
            starter: `${OPEN_SCANNER}        int n = in.nextInt();\n        int total = 0;\n        // Loop from 1 to n\n\n        System.out.println(total);\n${CLOSE}`,
            solution: `${OPEN_SCANNER}        int n = in.nextInt();\n        int total = 0;\n        for (int i = 1; i <= n; i++) {\n            total += i;\n        }\n        System.out.println(total);\n${CLOSE}`,
            tests: [out('1 to 5', '15', { stdin: '5' }), out('1 to 100', '5050', { stdin: '100' })],
            hints: ['for (int i = 1; i <= n; i++)', 'Inside the loop: total += i;'],
          },
        },
      ],
    },
    ...JAVA_MORE_UNITS,
  ],
}
