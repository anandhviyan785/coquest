import type { Unit } from '../../lib/types.ts'
import { choice, fill, out } from '../helpers.ts'

export const unit6: Unit = {
  id: 'py-6',
  title: 'Advanced Python',
  lessons: [
    {
      id: 'py-6-1',
      title: 'Object-Oriented Programming',
      summary: 'Bundle data and behaviour together.',
      explain: [
        'Object-oriented programming groups related data and the functions that work on it into one unit called an object. A string is an object: it holds characters and has methods such as `.upper()`.',
        'A class is the blueprint; an object (or instance) is one thing built from it. Many objects can be made from the same class, each with its own data.',
      ],
      example: { code: 'name = "quest"\nprint(name.upper())\nprint(type(name))\n\nitems = [3, 1, 2]\nitems.sort()\nprint(items)', output: "QUEST\n<class 'str'>\n[1, 2, 3]" },
      questions: [
        choice('In OOP, what is a class?', ['A single value', 'A blueprint for creating objects', 'A kind of loop', 'A file'], 1, 'A class describes what its objects store and what they can do.'),
        choice('What is `.append` in `scores.append(5)`?', ['A variable', 'A method — a function that belongs to an object', 'A class', 'A keyword'], 1, 'Methods are functions attached to an object, called with a dot.'),
      ],
      exercise: {
        prompt: 'Strings are objects with built-in methods. Read a line with `input()`, then print it in upper case, then print how many times the letter `a` appears in the original line (use `.count`).',
        starter: 'text = input()\n\n# Use two string methods\n',
        solution: 'text = input()\nprint(text.upper())\nprint(text.count("a"))',
        tests: [out('Works for "banana"', 'BANANA\n3', { stdin: 'banana' }), out('Works for "sky"', 'SKY\n0', { stdin: 'sky' })],
        hints: ['text.upper() returns a new upper-case string.', 'text.count("a") returns how many times "a" appears.'],
      },
    },
    {
      id: 'py-6-2',
      title: 'Classes',
      summary: 'Design your own kind of object.',
      explain: [
        'Define a class with the `class` keyword. The special method `__init__` runs whenever a new object is created and is where you set up its data. `self` refers to the object being worked on.',
        'Values stored on `self`, such as `self.name`, are attributes. Functions defined inside the class are methods, and every method takes `self` as its first parameter.',
      ],
      example: { code: 'class Explorer:\n    def __init__(self, name):\n        self.name = name\n        self.xp = 0\n\n    def gain(self, amount):\n        self.xp = self.xp + amount\n\nada = Explorer("Ada")\nada.gain(30)\nprint(ada.name, ada.xp)', output: 'Ada 30' },
      questions: [
        choice('When does `__init__` run?', ['When the program starts', 'Each time a new object is created', 'Only when you call it by name', 'When the object is printed'], 1, '__init__ is the initialiser: it runs automatically on creation.'),
        fill('Complete the first parameter that every method needs.', 'class Dog:\n    def bark(___):\n        print("Woof")', ['self'], 'self gives the method access to the object it was called on.'),
      ],
      exercise: {
        prompt: 'Create a class `Counter`. A new counter starts with `value` equal to 0. Give it a method `increment()` that adds 1 to `value`, and a method `reset()` that sets it back to 0.',
        starter: 'class Counter:\n    # Write __init__, increment and reset\n    pass',
        solution: 'class Counter:\n    def __init__(self):\n        self.value = 0\n\n    def increment(self):\n        self.value = self.value + 1\n\n    def reset(self):\n        self.value = 0',
        tests: [
          out('Starts at 0 and counts up', '0\n2', { append: 'c = Counter()\nprint(c.value)\nc.increment()\nc.increment()\nprint(c.value)' }),
          out('reset() returns to 0', '0', { append: 'c = Counter()\nc.increment()\nc.reset()\nprint(c.value)' }),
          out('Counters are independent', '1 0', { append: 'a = Counter()\nb = Counter()\na.increment()\nprint(a.value, b.value)' }),
        ],
        hints: ['In __init__(self), set self.value = 0.', 'Each method takes self and changes self.value.'],
      },
    },
    {
      id: 'py-6-3',
      title: 'Inheritance',
      summary: 'Build new classes on top of existing ones.',
      explain: [
        'Inheritance lets one class reuse another. Write the parent class in brackets: `class Dog(Animal)`. The child gets all of the parent\'s attributes and methods for free.',
        'A child can add new methods, or override one by defining a method with the same name. `super()` calls the parent\'s version, which is handy inside `__init__`.',
      ],
      example: { code: 'class Animal:\n    def __init__(self, name):\n        self.name = name\n\n    def speak(self):\n        return "..."\n\nclass Dog(Animal):\n    def speak(self):\n        return "Woof"\n\npet = Dog("Rex")\nprint(pet.name, pet.speak())', output: 'Rex Woof' },
      questions: [
        choice('What is printed?', ['Hello', 'Hi', 'Hello then Hi', 'An error'], 1, 'B overrides greet, so B\'s version is used.', 'class A:\n    def greet(self):\n        print("Hello")\n\nclass B(A):\n    def greet(self):\n        print("Hi")\n\nB().greet()'),
        choice('What does `super().__init__(name)` do?', ['Deletes the parent', 'Runs the parent class\'s __init__', 'Creates a new class', 'Nothing'], 1, 'super() gives access to the parent class, so its setup code can run.'),
      ],
      exercise: {
        prompt: 'A `Shape` class is provided. Create a class `Square` that inherits from `Shape`. Its `__init__(self, side)` should call the parent with the name `"square"` and store `side`. Override `area()` to return `side * side`.',
        starter: 'class Shape:\n    def __init__(self, name):\n        self.name = name\n\n    def area(self):\n        return 0\n\n    def describe(self):\n        return f"{self.name} with area {self.area()}"\n\n# Define Square below\n',
        solution: 'class Shape:\n    def __init__(self, name):\n        self.name = name\n\n    def area(self):\n        return 0\n\n    def describe(self):\n        return f"{self.name} with area {self.area()}"\n\nclass Square(Shape):\n    def __init__(self, side):\n        super().__init__("square")\n        self.side = side\n\n    def area(self):\n        return self.side * self.side',
        tests: [out('describe() uses the overridden area', 'square with area 16', { append: 'print(Square(4).describe())' }), out('Square is a Shape', 'True', { append: 'print(isinstance(Square(1), Shape))' })],
        hints: ['Start with class Square(Shape):', 'Inside __init__, call super().__init__("square") and then set self.side = side.'],
      },
    },
    {
      id: 'py-6-4',
      title: 'File Handling',
      summary: 'Save data and read it back.',
      explain: [
        '`open()` opens a file. The second argument is the mode: `"w"` writes (replacing anything already there), `"a"` appends to the end, and `"r"` reads.',
        'Use `with open(...) as f:` so the file is closed automatically when the block ends. `f.write()` writes text, `f.read()` reads everything, and looping over `f` gives one line at a time.',
      ],
      example: { code: 'with open("log.txt", "w") as f:\n    f.write("first\\n")\n    f.write("second\\n")\n\nwith open("log.txt", "r") as f:\n    for line in f:\n        print(line.strip())', output: 'first\nsecond' },
      questions: [
        choice('Which mode adds to the end of a file without erasing it?', ['"r"', '"w"', '"a"', '"x"'], 2, '"a" stands for append.'),
        choice('Why use `with` when opening a file?', ['It makes the file bigger', 'It closes the file automatically', 'It encrypts the file', 'It is required for reading'], 1, 'with guarantees the file is closed when the block finishes, even after an error.'),
      ],
      exercise: {
        prompt: 'Define `save_and_count(filename, lines)`. It should write each string in the list `lines` to the file on its own line, then reopen the file, read it, and return how many lines it contains.',
        starter: 'def save_and_count(filename, lines):\n    # Write the lines, then read them back and count\n    pass',
        solution: 'def save_and_count(filename, lines):\n    with open(filename, "w") as f:\n        for line in lines:\n            f.write(line + "\\n")\n    with open(filename, "r") as f:\n        return len(f.readlines())',
        tests: [
          out('Counts three lines', '3', { append: 'print(save_and_count("notes.txt", ["a", "b", "c"]))' }),
          out('The file really contains the text', 'map\nrope', { append: 'save_and_count("kit.txt", ["map", "rope"])\nprint(open("kit.txt").read().strip())' }),
        ],
        hints: ['Write each line with f.write(line + "\\n") inside a with open(filename, "w") block.', 'Open it again with "r" and use len(f.readlines()).'],
      },
    },
    {
      id: 'py-6-5',
      title: 'Exception Handling',
      summary: 'Recover gracefully when things go wrong.',
      explain: [
        'When Python hits a problem it cannot handle — dividing by zero, converting "abc" to a number — it raises an exception and stops. `try` and `except` let you catch the exception and carry on.',
        'Name the exception you expect, such as `except ValueError:`, so unrelated bugs are not hidden. An optional `finally` block runs whether or not an error occurred.',
      ],
      example: { code: 'try:\n    number = int("abc")\n    print(number)\nexcept ValueError:\n    print("That is not a number")\nfinally:\n    print("Finished")', output: 'That is not a number\nFinished' },
      questions: [
        choice('What is printed?', ['A then B', 'Only B', 'A then C', 'B then C'], 3, 'The division fails before "A" prints, so control jumps to except (B), and finally always runs (C).', 'try:\n    x = 1 / 0\n    print("A")\nexcept ZeroDivisionError:\n    print("B")\nfinally:\n    print("C")'),
        fill('Complete the keyword that catches the error.', 'try:\n    value = int(text)\n___ ValueError:\n    value = 0', ['except'], 'except introduces the block that handles a raised exception.'),
      ],
      exercise: {
        prompt: 'Define `safe_divide(a, b)` that returns `a / b`. If `b` is zero, return the string `"Cannot divide by zero"` instead of crashing.',
        starter: 'def safe_divide(a, b):\n    # Use try and except\n    pass',
        solution: 'def safe_divide(a, b):\n    try:\n        return a / b\n    except ZeroDivisionError:\n        return "Cannot divide by zero"',
        tests: [out('safe_divide(10, 4)', '2.5', { append: 'print(safe_divide(10, 4))' }), out('safe_divide(3, 0)', 'Cannot divide by zero', { append: 'print(safe_divide(3, 0))' })],
        hints: ['Put return a / b inside a try block.', 'Catch the specific error: except ZeroDivisionError:'],
      },
    },
  ],
  boss: {
    id: 'boss:py-6',
    title: 'Outwit the Exception Phantom',
    monster: 'The Exception Phantom',
    story: 'The Exception Phantom crashes every program it touches. Build classes sturdy enough to survive it and the tower is yours.',
    stages: [
      {
        prompt: 'Create a class `Wallet` that starts with a `balance` of 0. `deposit(amount)` adds to the balance. `spend(amount)` subtracts from it, but if there is not enough money it must raise a `ValueError` and leave the balance unchanged.',
        starter: 'class Wallet:\n    pass',
        solution: 'class Wallet:\n    def __init__(self):\n        self.balance = 0\n\n    def deposit(self, amount):\n        self.balance = self.balance + amount\n\n    def spend(self, amount):\n        if amount > self.balance:\n            raise ValueError("Not enough money")\n        self.balance = self.balance - amount',
        tests: [
          out('Deposits and spends', '70', { append: 'w = Wallet()\nw.deposit(100)\nw.spend(30)\nprint(w.balance)' }),
          out('Overspending raises ValueError', 'refused 20', { append: 'w = Wallet()\nw.deposit(20)\ntry:\n    w.spend(50)\n    print("allowed")\nexcept ValueError:\n    print("refused", w.balance)' }),
        ],
        hints: ['Check before subtracting: if amount > self.balance:', 'raise ValueError("Not enough money") stops the method before the balance changes.'],
      },
      {
        prompt: 'Define `parse_numbers(items)` that takes a list of strings and returns a list of integers. Strings that are not valid whole numbers must be skipped rather than crashing the function.',
        starter: 'def parse_numbers(items):\n    pass',
        solution: 'def parse_numbers(items):\n    numbers = []\n    for item in items:\n        try:\n            numbers.append(int(item))\n        except ValueError:\n            continue\n    return numbers',
        tests: [out('Skips the bad values', '[4, 15, -2]', { append: 'print(parse_numbers(["4", "x", "15", "", "-2"]))' }), out('All bad gives an empty list', '[]', { append: 'print(parse_numbers(["a", "b"]))' })],
        hints: ['Wrap int(item) in try / except ValueError inside the loop.', 'When the conversion fails, just move on to the next item.'],
      },
      {
        prompt: 'A `Monster` class is provided. Create `Boss(Monster)` whose `__init__(self, name, health, shield)` also stores `shield`. Override `hit(damage)`: damage is absorbed by the shield first, and only what is left over reduces health. Health must never go below 0.',
        starter: 'class Monster:\n    def __init__(self, name, health):\n        self.name = name\n        self.health = health\n\n    def hit(self, damage):\n        self.health = max(0, self.health - damage)\n\n    def is_defeated(self):\n        return self.health == 0\n\n# Define Boss below\n',
        solution: 'class Monster:\n    def __init__(self, name, health):\n        self.name = name\n        self.health = health\n\n    def hit(self, damage):\n        self.health = max(0, self.health - damage)\n\n    def is_defeated(self):\n        return self.health == 0\n\nclass Boss(Monster):\n    def __init__(self, name, health, shield):\n        super().__init__(name, health)\n        self.shield = shield\n\n    def hit(self, damage):\n        absorbed = min(self.shield, damage)\n        self.shield = self.shield - absorbed\n        super().hit(damage - absorbed)',
        tests: [
          out('The shield absorbs damage first', '0 90', { append: 'b = Boss("Phantom", 100, 20)\nb.hit(30)\nprint(b.shield, b.health)' }),
          out('A small hit only dents the shield', '15 100', { append: 'b = Boss("Phantom", 100, 20)\nb.hit(5)\nprint(b.shield, b.health)' }),
          out('Health stops at 0 and the boss is defeated', '0 True', { append: 'b = Boss("Phantom", 10, 0)\nb.hit(500)\nprint(b.health, b.is_defeated())' }),
        ],
        hints: ['absorbed = min(self.shield, damage) is how much the shield takes.', 'Reduce the shield by absorbed, then pass the rest to super().hit(damage - absorbed).'],
      },
    ],
  },
}
