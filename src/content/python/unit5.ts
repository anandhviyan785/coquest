import type { Unit } from '../../lib/types.ts'
import { choice, fill, out } from '../helpers.ts'

export const unit5: Unit = {
  id: 'py-5',
  title: 'Data Structures',
  lessons: [
    {
      id: 'py-5-1',
      title: 'Lists',
      summary: 'Keep many values in order.',
      explain: [
        'A list holds several values in order, written inside square brackets. Each item has an index, starting at 0. `items[0]` is the first item and `items[-1]` is the last.',
        'Lists can change. `append()` adds to the end, `remove()` deletes a value, and `len()` tells you how many items there are. A `for` loop visits every item in turn.',
      ],
      example: { code: 'tools = ["map", "rope"]\ntools.append("torch")\nprint(tools[0])\nprint(len(tools))\nfor tool in tools:\n    print(tool)', output: 'map\n3\nmap\nrope\ntorch' },
      questions: [
        choice('What is printed?', ['a', 'b', 'c', 'An error'], 1, 'Indexes start at 0, so index 1 is the second item.', 'letters = ["a", "b", "c"]\nprint(letters[1])'),
        fill('Complete the method that adds 9 to the end of the list.', 'numbers = [1, 5]\nnumbers.___(9)', ['append'], 'append() adds one item to the end of a list.'),
      ],
      exercise: {
        prompt: 'Define `evens(numbers)` that returns a new list containing only the even numbers from `numbers`, in the same order.',
        starter: 'def evens(numbers):\n    result = []\n    # Add each even number to result\n\n    return result',
        solution: 'def evens(numbers):\n    result = []\n    for n in numbers:\n        if n % 2 == 0:\n            result.append(n)\n    return result',
        tests: [out('evens([1, 2, 3, 4, 10])', '[2, 4, 10]', { append: 'print(evens([1, 2, 3, 4, 10]))' }), out('evens([7, 9])', '[]', { append: 'print(evens([7, 9]))' })],
        hints: ['Loop with for n in numbers.', 'When n % 2 == 0, call result.append(n).'],
      },
    },
    {
      id: 'py-5-2',
      title: 'Tuples',
      summary: 'Fixed groups of values.',
      explain: [
        'A tuple is like a list that cannot be changed after it is created. It is written with round brackets: `point = (3, 4)`. You read items by index, just like a list.',
        'Tuples are ideal for values that belong together, such as coordinates. You can unpack a tuple into separate variables in one line: `x, y = point`.',
      ],
      example: { code: 'point = (3, 4)\nx, y = point\nprint(x + y)\nprint(point[0])', output: '7\n3' },
      questions: [
        choice('What happens when this runs?', ['The tuple becomes (9, 2)', 'An error: tuples cannot be changed', 'Prints 9', 'Nothing'], 1, 'Tuples are immutable — their items cannot be reassigned.', 'pair = (1, 2)\npair[0] = 9'),
        choice('After this runs, what is b?', ['10', '20', '(10, 20)', 'An error'], 1, 'Unpacking assigns the first item to a and the second to b.', 'a, b = (10, 20)'),
      ],
      exercise: {
        prompt: 'Define `min_max(numbers)` that returns a tuple containing the smallest and largest numbers in the list, in that order.',
        starter: 'def min_max(numbers):\n    # Return (smallest, largest)\n    pass',
        solution: 'def min_max(numbers):\n    return (min(numbers), max(numbers))',
        tests: [out('min_max([4, 9, 1, 7])', '(1, 9)', { append: 'print(min_max([4, 9, 1, 7]))' }), out('Unpacks into two variables', '-3 8', { append: 'low, high = min_max([8, -3, 2])\nprint(low, high)' })],
        hints: ['The built-in functions min() and max() work on lists.', 'Return both in round brackets: return (min(numbers), max(numbers)).'],
      },
    },
    {
      id: 'py-5-3',
      title: 'Dictionaries',
      summary: 'Look values up by name.',
      explain: [
        'A dictionary stores pairs of keys and values inside curly braces. Instead of a position, you look a value up by its key: `ages["Ada"]`.',
        'Assigning to a key adds it or updates it. Use `in` to check whether a key exists, and `.items()` to loop over keys and values together.',
      ],
      example: { code: 'xp = {"Ada": 120, "Sam": 80}\nxp["Sam"] = 95\nxp["Lee"] = 10\nprint(xp["Sam"])\nfor name, points in xp.items():\n    print(name, points)', output: '95\nAda 120\nSam 95\nLee 10' },
      questions: [
        choice('What is printed?', ['red', 'apple', 'yellow', 'An error'], 0, 'The key "apple" maps to the value "red".', 'colours = {"apple": "red", "banana": "yellow"}\nprint(colours["apple"])'),
        fill('Complete the expression that checks whether the key "Ada" exists.', 'if "Ada" ___ scores:\n    print("Found")', ['in'], 'in tests whether a key is present in a dictionary.'),
      ],
      exercise: {
        prompt: 'Define `count_letters(word)` that returns a dictionary mapping each letter in `word` to how many times it appears.',
        starter: 'def count_letters(word):\n    counts = {}\n    # Count each letter\n\n    return counts',
        solution: 'def count_letters(word):\n    counts = {}\n    for letter in word:\n        if letter in counts:\n            counts[letter] = counts[letter] + 1\n        else:\n            counts[letter] = 1\n    return counts',
        tests: [out('count_letters("hello")', "{'h': 1, 'e': 1, 'l': 2, 'o': 1}", { append: 'print(count_letters("hello"))' }), out('count_letters("aaa")', "{'a': 3}", { append: 'print(count_letters("aaa"))' })],
        hints: ['Loop over the word one letter at a time.', 'If the letter is already a key, add 1 to its value. Otherwise set it to 1.'],
      },
    },
    {
      id: 'py-5-4',
      title: 'Sets',
      summary: 'Collections with no duplicates.',
      explain: [
        'A set is an unordered collection in which every value appears only once. Create one with curly braces or by converting a list: `set([1, 1, 2])` gives `{1, 2}`.',
        'Sets are fast at answering "is this in here?" and support maths-style operations: `a & b` is the values in both, `a | b` is the values in either, and `a - b` is the values only in `a`.',
      ],
      example: { code: 'seen = {"py", "js"}\nseen.add("py")\nseen.add("sql")\nprint(len(seen))\nprint({1, 2, 3} & {2, 3, 4})', output: '3\n{2, 3}' },
      questions: [
        choice('What is printed?', ['5', '3', '2', '1'], 1, 'Duplicates collapse, leaving {1, 2, 3}.', 'print(len(set([1, 1, 2, 3, 3])))'),
        choice('Which operator gives the values found in both sets?', ['|', '&', '-', '+'], 1, '& is intersection: values present in both sets.'),
      ],
      exercise: {
        prompt: 'Define `shared(a, b)` that takes two lists and returns a **sorted list** of the values that appear in both.',
        starter: 'def shared(a, b):\n    # Return a sorted list of the common values\n    pass',
        solution: 'def shared(a, b):\n    return sorted(set(a) & set(b))',
        tests: [out('shared([3, 1, 2, 3], [3, 2, 9])', '[2, 3]', { append: 'print(shared([3, 1, 2, 3], [3, 2, 9]))' }), out('No overlap gives an empty list', '[]', { append: 'print(shared([1], [2]))' })],
        hints: ['Convert both lists to sets and use &.', 'sorted(...) turns a set into a sorted list.'],
      },
    },
  ],
  boss: {
    id: 'boss:py-5',
    title: 'Tame the Data Hydra',
    monster: 'The Data Hydra',
    story: 'Every head of the Data Hydra spits a different tangle of data. Bring order to each one and the heads fall quiet.',
    stages: [
      {
        prompt: 'Define `top_scorer(scores)` where `scores` is a dictionary of names to points. Return the name with the highest score.',
        starter: 'def top_scorer(scores):\n    pass',
        solution: 'def top_scorer(scores):\n    best_name = None\n    best_score = None\n    for name, score in scores.items():\n        if best_score is None or score > best_score:\n            best_name = name\n            best_score = score\n    return best_name',
        tests: [out('Sam leads', 'Sam', { append: 'print(top_scorer({"Ada": 70, "Sam": 95, "Lee": 60}))' }), out('Works with one player', 'Ada', { append: 'print(top_scorer({"Ada": 1}))' })],
        hints: ['Loop with for name, score in scores.items().', 'Remember the best name and score so far, and update them when you see a higher score.'],
      },
      {
        prompt: 'Define `unique_in_order(items)` that returns a list with duplicates removed, keeping the first occurrence of each value in its original position.',
        starter: 'def unique_in_order(items):\n    pass',
        solution: 'def unique_in_order(items):\n    seen = set()\n    result = []\n    for item in items:\n        if item not in seen:\n            seen.add(item)\n            result.append(item)\n    return result',
        tests: [out('Removes repeats, keeps order', '[3, 1, 2]', { append: 'print(unique_in_order([3, 1, 3, 2, 1]))' }), out('Works with words', "['a', 'b']", { append: 'print(unique_in_order(["a", "a", "b"]))' })],
        hints: ['A plain set() would lose the order, so build a result list as well.', 'Use a set called seen to remember what you have already added.'],
      },
      {
        prompt: 'Define `group_by_length(words)` that returns a dictionary mapping each word length to the list of words with that length, in the order they appear.',
        starter: 'def group_by_length(words):\n    pass',
        solution: 'def group_by_length(words):\n    groups = {}\n    for word in words:\n        size = len(word)\n        if size not in groups:\n            groups[size] = []\n        groups[size].append(word)\n    return groups',
        tests: [out('Groups three words', "{2: ['hi', 'yo'], 5: ['quest']}", { append: 'print(group_by_length(["hi", "quest", "yo"]))' }), out('Empty list gives empty dictionary', '{}', { append: 'print(group_by_length([]))' })],
        hints: ['The key is len(word); the value is a list.', 'If the key is not in the dictionary yet, create an empty list for it first.'],
      },
    ],
  },
}
