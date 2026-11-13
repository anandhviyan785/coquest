import type { Unit } from '../../lib/types.ts'
import { choice, fill, out } from '../helpers.ts'

const MAIN_OPEN = '#include <iostream>\nusing namespace std;\n\nint main() {\n'
const MAIN_CLOSE = '    return 0;\n}'

/** C++ units 3 to 5: functions, arrays, strings, vectors, classes and references. */
export const CPP_MORE_UNITS: Unit[] = [
  {
    id: 'cpp-3',
    title: 'Functions and Arrays',
    lessons: [
      {
        id: 'cpp-3-1',
        title: 'Functions',
        summary: 'Reusable blocks of code.',
        explain: [
          'A function packages code under a name. Its header states the return type, the name and the typed parameters: `int square(int n)`. A function that returns nothing uses `void`.',
          'A function must be defined (or declared) before the code that calls it. `return` sends a value back to the caller.',
        ],
        example: { code: '#include <iostream>\nusing namespace std;\n\nint square(int n) {\n    return n * n;\n}\n\nint main() {\n    cout << square(6) << endl;\n    return 0;\n}', output: '36' },
        questions: [
          choice('Which return type means a function returns nothing?', ['null', 'void', 'empty', 'none'], 1, '`void` marks a function that returns no value.'),
          fill('Complete the keyword that sends a value back.', 'int one() { ___ 1; }', ['return'], 'return ends the function and hands back the value.'),
        ],
        exercise: {
          prompt: 'Write a function `maxOf(int a, int b)` that returns the larger of two numbers. Read two whole numbers and print the larger one using your function.',
          starter: '#include <iostream>\nusing namespace std;\n\n// Write maxOf here\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << maxOf(a, b) << endl;\n    return 0;\n}',
          solution: '#include <iostream>\nusing namespace std;\n\nint maxOf(int a, int b) {\n    if (a > b) {\n        return a;\n    }\n    return b;\n}\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << maxOf(a, b) << endl;\n    return 0;\n}',
          tests: [out('First is larger', '9', { stdin: '9 4' }), out('Second is larger', '12', { stdin: '3 12' })],
          hints: ['The header is int maxOf(int a, int b).', 'Use if (a > b) { return a; } and return b; otherwise.'],
        },
      },
      {
        id: 'cpp-3-2',
        title: 'Arrays',
        summary: 'A fixed-size list of one type.',
        explain: [
          'An array holds several values of the same type. `int scores[5];` makes room for five whole numbers, and `int scores[3] = {5, 8, 2};` fills them in. Indexes start at 0.',
          'C++ arrays do not know their own size, so keep a separate variable such as `n` for how many items you use, and never read past the end.',
        ],
        example: { code: `${MAIN_OPEN}    int scores[3] = {5, 8, 2};\n    int total = 0;\n    for (int i = 0; i < 3; i++) {\n        total += scores[i];\n    }\n    cout << total << endl;\n${MAIN_CLOSE}`, output: '15' },
        questions: [
          choice('What is the index of the first item in an array?', ['0', '1', '-1', 'first'], 0, 'C++ arrays are zero-indexed.'),
          choice('What happens if you read scores[10] in an array of 3 items?', ['It returns 0 safely', 'It is undefined behaviour and may crash or give garbage', 'The compiler fixes it', 'It wraps round to the start'], 1, 'C++ does not check bounds, so out-of-range access is undefined behaviour.'),
        ],
        exercise: {
          prompt: 'Read a whole number `n` (at most 100), then `n` whole numbers. Print the numbers in reverse order, one per line.',
          starter: `${MAIN_OPEN}    int n;\n    cin >> n;\n    int values[100];\n    // Read n numbers, then print them backwards\n\n${MAIN_CLOSE}`,
          solution: `${MAIN_OPEN}    int n;\n    cin >> n;\n    int values[100];\n    for (int i = 0; i < n; i++) {\n        cin >> values[i];\n    }\n    for (int i = n - 1; i >= 0; i--) {\n        cout << values[i] << endl;\n    }\n${MAIN_CLOSE}`,
          tests: [out('Three numbers', '30\n20\n10', { stdin: '3\n10 20 30' }), out('One number', '7', { stdin: '1\n7' })],
          hints: ['Fill the array with cin >> values[i]; in a loop.', 'Print with a loop that counts down from n - 1 to 0.'],
        },
      },
    ],
  },
  {
    id: 'cpp-4',
    title: 'Strings and Vectors',
    lessons: [
      {
        id: 'cpp-4-1',
        title: 'Strings',
        summary: 'Work with text.',
        explain: [
          'The `string` type holds text. Include `<string>` (iostream usually brings it in). `s.length()` gives the number of characters, `s[i]` reads one character and `s + t` joins two strings.',
          '`cin >> s` reads one word. A single character such as `\'a\'` uses single quotes, while a string uses double quotes. Compare strings directly with `==`.',
        ],
        example: { code: `#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string word = "quest";\n    cout << word.length() << endl;\n    cout << word[0] << endl;\n    return 0;\n}`, output: '5\nq' },
        questions: [
          choice('How do you get the number of characters in the string s?', ['s.length()', 's.len', 'length(s)', 's.size'], 0, 'length() (or size()) returns the character count.'),
          fill('Complete the quotes for a single character.', "char c = ___a___;", ["'"], 'A char literal uses single quotes, for example \'a\'.'),
        ],
        exercise: {
          prompt: 'Read one lower-case word and print how many vowels (`a`, `e`, `i`, `o`, `u`) it contains.',
          starter: `#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s;\n    cin >> s;\n    int count = 0;\n    // Count the vowels\n\n    cout << count << endl;\n    return 0;\n}`,
          solution: `#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s;\n    cin >> s;\n    int count = 0;\n    for (int i = 0; i < s.length(); i++) {\n        char c = s[i];\n        if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') {\n            count++;\n        }\n    }\n    cout << count << endl;\n    return 0;\n}`,
          tests: [out('quest', '2', { stdin: 'quest' }), out('education', '5', { stdin: 'education' }), out('rhythm', '0', { stdin: 'rhythm' })],
          hints: ['Loop with for (int i = 0; i < s.length(); i++) and read s[i].', "Test each letter against 'a', 'e', 'i', 'o' and 'u' with ||."],
        },
      },
      {
        id: 'cpp-4-2',
        title: 'Vectors',
        summary: 'A list that can grow.',
        explain: [
          '`vector<int>` is a list that grows as you add items. Include `<vector>`. `v.push_back(x)` adds to the end, `v.size()` gives the length and `v[i]` reads an item.',
          'A range-based loop visits each item: `for (int x : v)`. Prefer a vector over a raw array whenever the size can change.',
        ],
        example: { code: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> v;\n    v.push_back(4);\n    v.push_back(9);\n    cout << v.size() << " " << v[1] << endl;\n    return 0;\n}`, output: '2 9' },
        questions: [
          choice('Which method adds an item to the end of a vector?', ['add', 'append', 'push_back', 'insert_end'], 2, 'push_back adds to the end.'),
          fill('Complete the header that provides vector.', '#include <___>', ['vector'], '<vector> declares the vector type.'),
        ],
        exercise: {
          prompt: 'Read a whole number `n`, then `n` whole numbers. Store them in a vector and print their sum.',
          starter: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    vector<int> v;\n    // Read n numbers into v, then print the sum\n\n    return 0;\n}`,
          solution: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    vector<int> v;\n    for (int i = 0; i < n; i++) {\n        int x;\n        cin >> x;\n        v.push_back(x);\n    }\n    int total = 0;\n    for (int x : v) {\n        total += x;\n    }\n    cout << total << endl;\n    return 0;\n}`,
          tests: [out('Four numbers', '10', { stdin: '4\n1 2 3 4' }), out('A negative number', '-5', { stdin: '1\n-5' })],
          hints: ['Read each number into a variable x, then call v.push_back(x);', 'Add up the items with for (int x : v) { total += x; }'],
        },
      },
    ],
  },
  {
    id: 'cpp-5',
    title: 'Classes and References',
    lessons: [
      {
        id: 'cpp-5-1',
        title: 'Classes',
        summary: 'Bundle data and behaviour.',
        explain: [
          'A `class` groups data (members) and functions (methods). Members marked `private:` can only be changed by the class itself, and `public:` members can be used from outside. Do not forget the semicolon after the closing brace.',
          'Create an object with `Counter c;` and call its methods with a dot: `c.add();`.',
        ],
        example: { code: '#include <iostream>\nusing namespace std;\n\nclass Explorer {\npublic:\n    void gain(int n) { xp += n; }\n    int total() { return xp; }\nprivate:\n    int xp = 0;\n};\n\nint main() {\n    Explorer ada;\n    ada.gain(20);\n    cout << ada.total() << endl;\n    return 0;\n}', output: '20' },
        questions: [
          choice('What does private mean for a class member?', ['Only the class itself can use it directly', 'It is hidden from the compiler', 'It cannot change', 'It is deleted at the end'], 0, 'private members are accessible only inside the class.'),
          fill('Complete the character that must follow the closing brace of a class.', 'class A { int x; }___', [';'], 'A class definition ends with a semicolon.'),
        ],
        exercise: {
          prompt: 'Complete the `Counter` class: a private `count` that starts at 0, a public `add()` that increases it by 1, and a public `value()` that returns it.',
          starter: '#include <iostream>\nusing namespace std;\n\nclass Counter {\n    // Write the member, add() and value() here\n};\n\nint main() {\n    Counter c;\n    c.add();\n    c.add();\n    c.add();\n    cout << c.value() << endl;\n    return 0;\n}',
          solution: '#include <iostream>\nusing namespace std;\n\nclass Counter {\npublic:\n    void add() { count += 1; }\n    int value() { return count; }\nprivate:\n    int count = 0;\n};\n\nint main() {\n    Counter c;\n    c.add();\n    c.add();\n    c.add();\n    cout << c.value() << endl;\n    return 0;\n}',
          tests: [out('Three adds', '3')],
          hints: ['Declare private: int count = 0; inside the class.', 'add() does count += 1; and value() returns count.'],
        },
      },
      {
        id: 'cpp-5-2',
        title: 'References',
        summary: 'Let a function change its arguments.',
        explain: [
          'Normally a function gets a copy of its arguments, so changing them inside does not affect the caller. Adding `&` to a parameter makes it a reference: it is another name for the caller\'s variable.',
          'So `void swapValues(int &a, int &b)` can really swap two variables. Pass by reference for functions that must change their inputs, or when copying would be slow.',
        ],
        example: { code: '#include <iostream>\nusing namespace std;\n\nvoid addOne(int &n) {\n    n = n + 1;\n}\n\nint main() {\n    int x = 4;\n    addOne(x);\n    cout << x << endl;\n    return 0;\n}', output: '5' },
        questions: [
          choice('What does the & in int &n mean?', ['n is a copy', 'n is another name for the caller\'s variable', 'n is a pointer to a pointer', 'n is constant'], 1, 'A reference parameter shares the caller\'s variable.'),
          choice('Without &, what does a function receive?', ['The original variable', 'A copy of the value', 'The variable\'s address', 'Nothing'], 1, 'Pass by value copies the argument.'),
        ],
        exercise: {
          prompt: 'Write a function `swapValues(int &a, int &b)` that swaps two numbers. Read two whole numbers, swap them with your function and print them as `a b`.',
          starter: '#include <iostream>\nusing namespace std;\n\n// Write swapValues here\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    swapValues(a, b);\n    cout << a << " " << b << endl;\n    return 0;\n}',
          solution: '#include <iostream>\nusing namespace std;\n\nvoid swapValues(int &a, int &b) {\n    int temp = a;\n    a = b;\n    b = temp;\n}\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    swapValues(a, b);\n    cout << a << " " << b << endl;\n    return 0;\n}',
          tests: [out('3 and 8', '8 3', { stdin: '3 8' }), out('Negative number', '4 -1', { stdin: '-1 4' })],
          hints: ['The header is void swapValues(int &a, int &b).', 'Keep one value in a temporary variable while you overwrite the other.'],
        },
      },
    ],
    boss: {
      id: 'boss:cpp-5',
      title: 'Slay the Segfault Serpent',
      monster: 'The Segfault Serpent',
      story: 'The Segfault Serpent strikes whenever code reads where it should not. Keep every index and reference safe to defeat it.',
      stages: [
        {
          prompt: 'Read a whole number `n` (0 to 10) and print its factorial. The factorial of 0 is 1.',
          starter: `${MAIN_OPEN}    int n;\n    cin >> n;\n\n${MAIN_CLOSE}`,
          solution: `${MAIN_OPEN}    int n;\n    cin >> n;\n    long long result = 1;\n    for (int i = 2; i <= n; i++) {\n        result *= i;\n    }\n    cout << result << endl;\n${MAIN_CLOSE}`,
          tests: [out('5 factorial', '120', { stdin: '5' }), out('0 factorial', '1', { stdin: '0' }), out('10 factorial', '3628800', { stdin: '10' })],
          hints: ['Start a result at 1 and multiply it by every number from 2 to n.', 'A loop from 2 to n does nothing when n is 0 or 1, so the answer stays 1.'],
        },
        {
          prompt: 'Read one word and print `palindrome` if it reads the same backwards, or `not palindrome` otherwise.',
          starter: `#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s;\n    cin >> s;\n\n    return 0;\n}`,
          solution: `#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s;\n    cin >> s;\n    bool same = true;\n    for (int i = 0; i < s.length() / 2; i++) {\n        if (s[i] != s[s.length() - 1 - i]) {\n            same = false;\n        }\n    }\n    cout << (same ? "palindrome" : "not palindrome") << endl;\n    return 0;\n}`,
          tests: [out('level', 'palindrome', { stdin: 'level' }), out('quest', 'not palindrome', { stdin: 'quest' }), out('a', 'palindrome', { stdin: 'a' })],
          hints: ['Compare s[i] with s[s.length() - 1 - i] for the first half of the word.', 'If any pair differs, the word is not a palindrome.'],
        },
      ],
    },
  },
]
