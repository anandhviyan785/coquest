import type { Unit } from '../../lib/types.ts'
import { choice, fill, out } from '../helpers.ts'

const OPEN = 'public class Main {\n    public static void main(String[] args) {\n'
const OPEN_SCANNER = 'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner in = new Scanner(System.in);\n'
const CLOSE = '    }\n}'

/** Java units 3 to 5: methods, arrays, strings, lists, classes and inheritance. */
export const JAVA_MORE_UNITS: Unit[] = [
  {
    id: 'java-3',
    title: 'Methods and Arrays',
    lessons: [
      {
        id: 'java-3-1',
        title: 'Methods',
        summary: 'Reusable blocks of code.',
        explain: [
          'A method packages code under a name. Its header states the return type, the name and the typed parameters: `static int square(int n)`. A method that returns nothing uses `void`.',
          'Call a method by name with arguments: `square(4)`. `return` sends a value back to the caller. Methods that main calls directly are marked `static`.',
        ],
        example: { code: `public class Main {\n    static int square(int n) {\n        return n * n;\n    }\n\n    public static void main(String[] args) {\n        System.out.println(square(6));\n    }\n}`, output: '36' },
        questions: [
          choice('Which return type means a method returns nothing?', ['null', 'void', 'empty', 'none'], 1, '`void` marks a method that returns no value.'),
          fill('Complete the keyword that sends a value back.', 'static int one() { ___ 1; }', ['return'], 'return ends the method and hands back the value.'),
        ],
        exercise: {
          prompt: 'Write a method `max(int a, int b)` that returns the larger of two numbers. Read two whole numbers and print the larger one using your method.',
          starter: `import java.util.Scanner;\n\npublic class Main {\n    // Write max(int a, int b) here\n\n    public static void main(String[] args) {\n        Scanner in = new Scanner(System.in);\n        int a = in.nextInt();\n        int b = in.nextInt();\n        System.out.println(max(a, b));\n    }\n}`,
          solution: `import java.util.Scanner;\n\npublic class Main {\n    static int max(int a, int b) {\n        if (a > b) {\n            return a;\n        }\n        return b;\n    }\n\n    public static void main(String[] args) {\n        Scanner in = new Scanner(System.in);\n        int a = in.nextInt();\n        int b = in.nextInt();\n        System.out.println(max(a, b));\n    }\n}`,
          tests: [out('First is larger', '9', { stdin: '9 4' }), out('Second is larger', '12', { stdin: '3 12' })],
          hints: ['The header is static int max(int a, int b).', 'Use if (a > b) { return a; } and return b; otherwise.'],
        },
      },
      {
        id: 'java-3-2',
        title: 'Arrays',
        summary: 'A fixed-size list of one type.',
        explain: [
          'An array holds several values of the same type. Create one with `int[] scores = new int[3];` or with values: `int[] scores = {5, 8, 2};`. Indexes start at 0, and `scores.length` is the size.',
          'Loop over an array with a `for` loop, or with a for-each loop: `for (int s : scores)`.',
        ],
        example: { code: `${OPEN}        int[] scores = {5, 8, 2};\n        int total = 0;\n        for (int s : scores) {\n            total += s;\n        }\n        System.out.println(total + " " + scores.length);\n${CLOSE}`, output: '15 3' },
        questions: [
          choice('What is the index of the first item in an array?', ['0', '1', '-1', 'first'], 0, 'Java arrays are zero-indexed.'),
          choice('How do you get the size of the array `a`?', ['a.size()', 'a.length', 'a.count', 'length(a)'], 1, 'Arrays expose a length field, without brackets.'),
        ],
        exercise: {
          prompt: 'Read a whole number `n`, then `n` more whole numbers. Print the largest one.',
          starter: `${OPEN_SCANNER}        int n = in.nextInt();\n        int[] values = new int[n];\n        // Read n numbers into values, then print the largest\n\n${CLOSE}`,
          solution: `${OPEN_SCANNER}        int n = in.nextInt();\n        int[] values = new int[n];\n        for (int i = 0; i < n; i++) {\n            values[i] = in.nextInt();\n        }\n        int best = values[0];\n        for (int v : values) {\n            if (v > best) {\n                best = v;\n            }\n        }\n        System.out.println(best);\n${CLOSE}`,
          tests: [out('Five numbers', '9', { stdin: '5\n3 9 2 7 1' }), out('Negative numbers', '-1', { stdin: '3\n-5 -1 -8' })],
          hints: ['Fill the array with values[i] = in.nextInt(); in a loop.', 'Start best at values[0] and update it when a bigger number appears.'],
        },
      },
    ],
  },
  {
    id: 'java-4',
    title: 'Strings and Lists',
    lessons: [
      {
        id: 'java-4-1',
        title: 'Strings',
        summary: 'Work with text.',
        explain: [
          'A `String` has helpful methods: `length()`, `charAt(i)`, `toUpperCase()`, `substring(start, end)` and `equals(other)`. Compare strings with `equals`, never with `==`.',
          'Join strings with `+`. Strings are immutable, so every method returns a new string instead of changing the original.',
        ],
        example: { code: `${OPEN}        String word = "quest";\n        System.out.println(word.length());\n        System.out.println(word.toUpperCase());\n        System.out.println(word.charAt(0));\n${CLOSE}`, output: '5\nQUEST\nq' },
        questions: [
          choice('How should you compare two strings for equal text?', ['a == b', 'a.equals(b)', 'a = b', 'a.same(b)'], 1, 'equals compares the characters; == compares object identity.'),
          fill('Complete the method that returns the number of characters.', 'System.out.println("hello".___());', ['length'], 'length() counts the characters.'),
        ],
        exercise: {
          prompt: 'Read one word and print it reversed. For example `quest` becomes `tseuq`.',
          starter: `${OPEN_SCANNER}        String word = in.next();\n        // Build and print the reversed word\n\n${CLOSE}`,
          solution: `${OPEN_SCANNER}        String word = in.next();\n        String reversed = "";\n        for (int i = word.length() - 1; i >= 0; i--) {\n            reversed += word.charAt(i);\n        }\n        System.out.println(reversed);\n${CLOSE}`,
          tests: [out('quest', 'tseuq', { stdin: 'quest' }), out('A palindrome', 'level', { stdin: 'level' })],
          hints: ['Loop from word.length() - 1 down to 0.', 'Add word.charAt(i) to a result string on each pass.'],
        },
      },
      {
        id: 'java-4-2',
        title: 'ArrayList',
        summary: 'A list that can grow.',
        explain: [
          '`ArrayList<Integer>` is a list that grows as you add items. Import it with `import java.util.ArrayList;`. The type in angle brackets says what it stores; use `Integer` for whole numbers and `String` for text.',
          'Key methods are `add(x)`, `get(i)`, `size()` and `remove(i)`.',
        ],
        example: { code: `import java.util.ArrayList;\n\npublic class Main {\n    public static void main(String[] args) {\n        ArrayList<String> tools = new ArrayList<>();\n        tools.add("map");\n        tools.add("rope");\n        System.out.println(tools.size() + " " + tools.get(1));\n    }\n}`, output: '2 rope' },
        questions: [
          choice('Which method adds an item to an ArrayList?', ['push', 'append', 'add', 'insertEnd'], 2, 'ArrayList uses add().'),
          choice('Which method gives the number of items in an ArrayList?', ['length', 'size()', 'count', 'length()'], 1, 'Lists use size(); arrays use the length field.'),
        ],
        exercise: {
          prompt: 'Read a whole number `n`, then `n` whole numbers. Print only the even ones, each on its own line, in the order they were given.',
          starter: `import java.util.ArrayList;\nimport java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner in = new Scanner(System.in);\n        int n = in.nextInt();\n        ArrayList<Integer> evens = new ArrayList<>();\n        // Read n numbers, keep the even ones, then print them\n\n    }\n}`,
          solution: `import java.util.ArrayList;\nimport java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner in = new Scanner(System.in);\n        int n = in.nextInt();\n        ArrayList<Integer> evens = new ArrayList<>();\n        for (int i = 0; i < n; i++) {\n            int v = in.nextInt();\n            if (v % 2 == 0) {\n                evens.add(v);\n            }\n        }\n        for (int e : evens) {\n            System.out.println(e);\n        }\n    }\n}`,
          tests: [out('Mixed numbers', '2\n8\n4', { stdin: '5\n2 3 8 5 4' }), out('Odds only prints nothing', '', { stdin: '2\n1 3' })],
          hints: ['Read each number, then test it with v % 2 == 0.', 'evens.add(v); and finish with a loop that prints each item.'],
        },
      },
    ],
  },
  {
    id: 'java-5',
    title: 'Objects',
    lessons: [
      {
        id: 'java-5-1',
        title: 'Classes and Objects',
        summary: 'Bundle data and behaviour.',
        explain: [
          'A class defines fields (data) and methods (behaviour). A constructor has the same name as the class and sets the fields up. Create an object with `new`.',
          'Mark fields `private` so only the class itself changes them, and expose them through methods. Put extra classes after `Main` in the same file.',
        ],
        example: { code: `public class Main {\n    public static void main(String[] args) {\n        Explorer ada = new Explorer("Ada");\n        ada.gain(20);\n        System.out.println(ada.describe());\n    }\n}\n\nclass Explorer {\n    private String name;\n    private int xp;\n\n    Explorer(String name) {\n        this.name = name;\n    }\n\n    void gain(int n) {\n        xp += n;\n    }\n\n    String describe() {\n        return name + " has " + xp + " XP";\n    }\n}`, output: 'Ada has 20 XP' },
        questions: [
          choice('What is a constructor?', ['A method that deletes an object', 'A method with the class name that sets up a new object', 'A loop', 'A variable type'], 1, 'The constructor runs when `new` creates the object.'),
          fill('Complete the keyword that creates an object.', 'Explorer ada = ___ Explorer("Ada");', ['new'], '`new` allocates the object and runs its constructor.'),
        ],
        exercise: {
          prompt: 'Complete the `Counter` class: a private `count` that starts at 0, an `add()` method that increases it by 1, and a `value()` method that returns it.',
          starter: `public class Main {\n    public static void main(String[] args) {\n        Counter c = new Counter();\n        c.add();\n        c.add();\n        c.add();\n        System.out.println(c.value());\n    }\n}\n\nclass Counter {\n    // Write the field, add() and value() here\n}`,
          solution: `public class Main {\n    public static void main(String[] args) {\n        Counter c = new Counter();\n        c.add();\n        c.add();\n        c.add();\n        System.out.println(c.value());\n    }\n}\n\nclass Counter {\n    private int count = 0;\n\n    void add() {\n        count += 1;\n    }\n\n    int value() {\n        return count;\n    }\n}`,
          tests: [out('Three adds', '3')],
          hints: ['Declare private int count = 0; inside the class.', 'add() does count += 1; and value() returns count.'],
        },
      },
      {
        id: 'java-5-2',
        title: 'Inheritance',
        summary: 'Build one class on top of another.',
        explain: [
          'A class can inherit from another with `extends`. The child class gets the parent\'s fields and methods and can add its own, or replace a method with `@Override`.',
          'Calling a method on a variable runs the version that belongs to the real object, so a `Cat` stored in an `Animal` variable still meows.',
        ],
        example: { code: `public class Main {\n    public static void main(String[] args) {\n        Animal a = new Dog();\n        System.out.println(a.sound());\n    }\n}\n\nclass Animal {\n    String sound() {\n        return "...";\n    }\n}\n\nclass Dog extends Animal {\n    @Override\n    String sound() {\n        return "Woof";\n    }\n}`, output: 'Woof' },
        questions: [
          choice('Which keyword makes one class inherit from another?', ['inherits', 'extends', 'implements', 'from'], 1, 'class Dog extends Animal.'),
          choice('What does @Override tell the compiler?', ['This method replaces one from the parent', 'This method is private', 'This method runs twice', 'This method is static'], 0, 'It checks that a parent method with the same signature exists.'),
        ],
        exercise: {
          prompt: 'Complete `Cat` so it extends `Animal` and overrides `sound()` to return `"Meow"`.',
          starter: `public class Main {\n    public static void main(String[] args) {\n        Animal pet = new Cat();\n        System.out.println(pet.sound());\n    }\n}\n\nclass Animal {\n    String sound() {\n        return "...";\n    }\n}\n\n// Write the Cat class here`,
          solution: `public class Main {\n    public static void main(String[] args) {\n        Animal pet = new Cat();\n        System.out.println(pet.sound());\n    }\n}\n\nclass Animal {\n    String sound() {\n        return "...";\n    }\n}\n\nclass Cat extends Animal {\n    @Override\n    String sound() {\n        return "Meow";\n    }\n}`,
          tests: [out('The cat meows', 'Meow')],
          hints: ['Start with class Cat extends Animal {', 'Override sound() and return "Meow";'],
        },
      },
    ],
    boss: {
      id: 'boss:java-5',
      title: 'Defeat the Null Pointer Golem',
      monster: 'The Null Pointer Golem',
      story: 'The Null Pointer Golem crumbles when every object is properly built. Show it clean classes and tidy lists.',
      stages: [
        {
          prompt: 'Read a whole number `n`, then `n` words. Print how many of the words are longer than 3 letters.',
          starter: `${OPEN_SCANNER}        int n = in.nextInt();\n\n${CLOSE}`,
          solution: `${OPEN_SCANNER}        int n = in.nextInt();\n        int count = 0;\n        for (int i = 0; i < n; i++) {\n            String word = in.next();\n            if (word.length() > 3) {\n                count++;\n            }\n        }\n        System.out.println(count);\n${CLOSE}`,
          tests: [out('Two long words', '2', { stdin: '4\ncat quest code go' }), out('None long enough', '0', { stdin: '2\nhi yo' })],
          hints: ['Read each word with in.next().', 'Count it when word.length() > 3.'],
        },
        {
          prompt: 'Write a method `isPrime(int n)` that returns true when `n` is prime. Read a number and print `prime` or `not prime`.',
          starter: `import java.util.Scanner;\n\npublic class Main {\n    // Write isPrime here\n\n    public static void main(String[] args) {\n        Scanner in = new Scanner(System.in);\n        int n = in.nextInt();\n        System.out.println(isPrime(n) ? "prime" : "not prime");\n    }\n}`,
          solution: `import java.util.Scanner;\n\npublic class Main {\n    static boolean isPrime(int n) {\n        if (n < 2) {\n            return false;\n        }\n        for (int i = 2; i * i <= n; i++) {\n            if (n % i == 0) {\n                return false;\n            }\n        }\n        return true;\n    }\n\n    public static void main(String[] args) {\n        Scanner in = new Scanner(System.in);\n        int n = in.nextInt();\n        System.out.println(isPrime(n) ? "prime" : "not prime");\n    }\n}`,
          tests: [out('13 is prime', 'prime', { stdin: '13' }), out('12 is not prime', 'not prime', { stdin: '12' }), out('1 is not prime', 'not prime', { stdin: '1' })],
          hints: ['Numbers below 2 are not prime.', 'Try dividers from 2 while i * i <= n; if any divides n evenly it is not prime.'],
        },
      ],
    },
  },
]
