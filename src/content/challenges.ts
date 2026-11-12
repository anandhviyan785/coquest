import type { Challenge } from '../lib/types.ts'
import { out } from './helpers.ts'

const py = (id: string, title: string, difficulty: Challenge['difficulty'], exercise: Challenge['exercise']): Challenge => ({
  id, title, difficulty, lang: 'python', exercise,
})

/** The pool the daily challenge rotates through, and that duels draw from. */
export const CHALLENGES: Challenge[] = [
  py('reverse-string', 'Mirror, Mirror', 'Easy', {
    prompt: 'Define `mirror(text)` that returns the text reversed.',
    starter: 'def mirror(text):\n    pass',
    solution: 'def mirror(text):\n    return text[::-1]',
    tests: [out('mirror("quest")', 'tseuq', { append: 'print(mirror("quest"))' }), out('mirror("a b")', 'b a', { append: 'print(mirror("a b"))' }), out('Empty text', '[]', { append: 'print("[" + mirror("") + "]")' })],
    hints: ['Slicing with a step of -1 walks backwards: text[::-1].', 'Or build a new string by looping over the text and adding each letter to the front.'],
  }),
  py('count-words', 'Word Counter', 'Easy', {
    prompt: 'Define `word_count(sentence)` that returns the number of words. Words are separated by one or more spaces.',
    starter: 'def word_count(sentence):\n    pass',
    solution: 'def word_count(sentence):\n    return len(sentence.split())',
    tests: [out('Three words', '3', { append: 'print(word_count("learn to code"))' }), out('Extra spaces', '2', { append: 'print(word_count("  hello   world "))' }), out('Empty sentence', '0', { append: 'print(word_count(""))' })],
    hints: ['.split() with no argument splits on any run of whitespace.', 'len() of the resulting list is the word count.'],
  }),
  py('sum-digits', 'Digit Sum', 'Easy', {
    prompt: 'Define `digit_sum(n)` that returns the sum of the digits of a non-negative whole number.',
    starter: 'def digit_sum(n):\n    pass',
    solution: 'def digit_sum(n):\n    return sum(int(d) for d in str(n))',
    tests: [out('digit_sum(1234)', '10', { append: 'print(digit_sum(1234))' }), out('digit_sum(0)', '0', { append: 'print(digit_sum(0))' }), out('digit_sum(9999)', '36', { append: 'print(digit_sum(9999))' })],
    hints: ['str(n) lets you loop over the digits as characters.', 'Convert each character back with int() and add them up.'],
  }),
  py('max-of-list', 'Highest Peak', 'Easy', {
    prompt: 'Define `highest(heights)` that returns the largest number in a non-empty list **without** using `max` or `sorted`.',
    starter: 'def highest(heights):\n    pass',
    solution: 'def highest(heights):\n    best = heights[0]\n    for h in heights:\n        if h > best:\n            best = h\n    return best',
    tests: [out('highest([3, 9, 4])', '9', { append: 'print(highest([3, 9, 4]))' }), out('All negative', '-1', { append: 'print(highest([-5, -1, -8]))' }), out('One value', '7', { append: 'print(highest([7]))' })],
    hints: ['Start with best = heights[0].', 'Loop through and replace best whenever you find something bigger.'],
  }),
  py('palindrome', 'Same Both Ways', 'Medium', {
    prompt: 'Define `is_palindrome(text)` that returns `True` if the text reads the same forwards and backwards, ignoring case and spaces.',
    starter: 'def is_palindrome(text):\n    pass',
    solution: 'def is_palindrome(text):\n    cleaned = text.lower().replace(" ", "")\n    return cleaned == cleaned[::-1]',
    tests: [out('"Never odd or even"', 'True', { append: 'print(is_palindrome("Never odd or even"))' }), out('"quest"', 'False', { append: 'print(is_palindrome("quest"))' }), out('"Level"', 'True', { append: 'print(is_palindrome("Level"))' })],
    hints: ['Clean the text first: lower-case it and remove the spaces.', 'Compare the cleaned text with its reverse.'],
  }),
  py('fizz-count', 'Fizz Census', 'Medium', {
    prompt: 'Define `fizz_count(n)` that returns how many numbers from 1 to `n` (inclusive) are divisible by 3 or by 5.',
    starter: 'def fizz_count(n):\n    pass',
    solution: 'def fizz_count(n):\n    return sum(1 for i in range(1, n + 1) if i % 3 == 0 or i % 5 == 0)',
    tests: [out('fizz_count(15)', '7', { append: 'print(fizz_count(15))' }), out('fizz_count(2)', '0', { append: 'print(fizz_count(2))' }), out('fizz_count(100)', '47', { append: 'print(fizz_count(100))' })],
    hints: ['Loop from 1 to n and keep a counter.', 'A number counts if i % 3 == 0 or i % 5 == 0.'],
  }),
  py('second-largest', 'Runner-Up', 'Medium', {
    prompt: 'Define `runner_up(numbers)` that returns the second-largest **distinct** value in the list. The list always has at least two different values.',
    starter: 'def runner_up(numbers):\n    pass',
    solution: 'def runner_up(numbers):\n    return sorted(set(numbers))[-2]',
    tests: [out('runner_up([4, 9, 7])', '7', { append: 'print(runner_up([4, 9, 7]))' }), out('Duplicates of the top value', '5', { append: 'print(runner_up([9, 9, 5, 1]))' }), out('Negatives', '-3', { append: 'print(runner_up([-3, -1, -7]))' })],
    hints: ['Duplicates get in the way — a set removes them.', 'Sort the distinct values and take the second from the end.'],
  }),
  py('caesar', 'Shifted Message', 'Medium', {
    prompt: 'Define `shift(text, amount)` that moves every lower-case letter forward through the alphabet by `amount`, wrapping from z back to a. Other characters stay the same.',
    starter: 'def shift(text, amount):\n    pass',
    solution: 'def shift(text, amount):\n    result = ""\n    for ch in text:\n        if "a" <= ch <= "z":\n            result += chr((ord(ch) - 97 + amount) % 26 + 97)\n        else:\n            result += ch\n    return result',
    tests: [out('shift("abc", 1)', 'bcd', { append: 'print(shift("abc", 1))' }), out('Wraps around', 'zab', { append: 'print(shift("xyz", 2))' }), out('Leaves spaces alone', 'khoor zruog', { append: 'print(shift("hello world", 3))' })],
    hints: ['ord(ch) gives a letter\'s number and chr() turns a number back into a letter. "a" is 97.', 'Subtract 97, add the amount, take % 26, then add 97 again.'],
  }),
  py('fibonacci', 'Rabbit Sequence', 'Medium', {
    prompt: 'Define `fib(n)` that returns the n-th Fibonacci number, where `fib(0)` is 0 and `fib(1)` is 1.',
    starter: 'def fib(n):\n    pass',
    solution: 'def fib(n):\n    a, b = 0, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a',
    tests: [out('fib(0)', '0', { append: 'print(fib(0))' }), out('fib(10)', '55', { append: 'print(fib(10))' }), out('fib(30)', '832040', { append: 'print(fib(30))' })],
    hints: ['Keep two variables for the last two numbers, starting at 0 and 1.', 'Each step: a, b = b, a + b. After n steps, a is the answer.'],
  }),
  py('anagram', 'Letter Shuffle', 'Medium', {
    prompt: 'Define `is_anagram(a, b)` that returns `True` if the two words use exactly the same letters, ignoring case.',
    starter: 'def is_anagram(a, b):\n    pass',
    solution: 'def is_anagram(a, b):\n    return sorted(a.lower()) == sorted(b.lower())',
    tests: [out('"Listen" and "Silent"', 'True', { append: 'print(is_anagram("Listen", "Silent"))' }), out('"quest" and "quests"', 'False', { append: 'print(is_anagram("quest", "quests"))' }), out('"aab" and "abb"', 'False', { append: 'print(is_anagram("aab", "abb"))' })],
    hints: ['Two anagrams have identical letters once sorted.', 'Compare sorted(a.lower()) with sorted(b.lower()).'],
  }),
  py('primes', 'Prime Hunter', 'Hard', {
    prompt: 'Define `primes_up_to(n)` that returns a list of every prime number less than or equal to `n`.',
    starter: 'def primes_up_to(n):\n    pass',
    solution: 'def primes_up_to(n):\n    found = []\n    for candidate in range(2, n + 1):\n        if all(candidate % p != 0 for p in found if p * p <= candidate):\n            found.append(candidate)\n    return found',
    tests: [out('primes_up_to(20)', '[2, 3, 5, 7, 11, 13, 17, 19]', { append: 'print(primes_up_to(20))' }), out('primes_up_to(1)', '[]', { append: 'print(primes_up_to(1))' }), out('There are 25 primes up to 100', '25', { append: 'print(len(primes_up_to(100)))' })],
    hints: ['A prime has no divisors other than 1 and itself. Test each candidate from 2 to n.', 'You only need to try dividing by the primes you have already found.'],
  }),
  py('run-length', 'Squeeze', 'Hard', {
    prompt: 'Define `squeeze(text)` that run-length encodes a string: each run of a repeated character becomes the character followed by the run length. `"aaabcc"` becomes `"a3b1c2"`.',
    starter: 'def squeeze(text):\n    pass',
    solution: 'def squeeze(text):\n    result = ""\n    i = 0\n    while i < len(text):\n        j = i\n        while j < len(text) and text[j] == text[i]:\n            j += 1\n        result += text[i] + str(j - i)\n        i = j\n    return result',
    tests: [out('squeeze("aaabcc")', 'a3b1c2', { append: 'print(squeeze("aaabcc"))' }), out('No repeats', 'a1b1c1', { append: 'print(squeeze("abc"))' }), out('Empty text', '[]', { append: 'print("[" + squeeze("") + "]")' })],
    hints: ['Walk through the text keeping track of where the current run started.', 'When the character changes, add the character and the run length to your result.'],
  }),
  py('brackets', 'Balanced Brackets', 'Hard', {
    prompt: 'Define `balanced(text)` that returns `True` if every `(`, `[` and `{` is closed by the right bracket in the right order. Other characters are ignored.',
    starter: 'def balanced(text):\n    pass',
    solution: 'def balanced(text):\n    pairs = {")": "(", "]": "[", "}": "{"}\n    stack = []\n    for ch in text:\n        if ch in "([{":\n            stack.append(ch)\n        elif ch in pairs:\n            if not stack or stack.pop() != pairs[ch]:\n                return False\n    return not stack',
    tests: [out('"{[()]}"', 'True', { append: 'print(balanced("{[()]}"))' }), out('"(]"', 'False', { append: 'print(balanced("(]"))' }), out('Unclosed bracket', 'False', { append: 'print(balanced("print((1 + 2)"))' }), out('Closing first', 'False', { append: 'print(balanced(")("))' })],
    hints: ['Use a list as a stack: push every opening bracket.', 'On a closing bracket, pop the stack and check it is the matching opener. At the end the stack must be empty.'],
  }),
  py('two-sum', 'Perfect Pair', 'Hard', {
    prompt: 'Define `pair_for(numbers, target)` that returns a tuple of the indexes of the two numbers that add up to `target`, smaller index first. Exactly one pair exists.',
    starter: 'def pair_for(numbers, target):\n    pass',
    solution: 'def pair_for(numbers, target):\n    seen = {}\n    for i, n in enumerate(numbers):\n        if target - n in seen:\n            return (seen[target - n], i)\n        seen[n] = i',
    tests: [out('pair_for([2, 7, 11, 15], 9)', '(0, 1)', { append: 'print(pair_for([2, 7, 11, 15], 9))' }), out('pair_for([3, 2, 4], 6)', '(1, 2)', { append: 'print(pair_for([3, 2, 4], 6))' }), out('Same value twice', '(0, 1)', { append: 'print(pair_for([5, 5], 10))' })],
    hints: ['For each number, the partner you need is target - number.', 'Remember each number\'s index in a dictionary so you can find partners instantly.'],
  }),
]

export const challengeById = (id: string): Challenge | undefined => CHALLENGES.find((c) => c.id === id)

/** Days since 1 Jan 2025 for a YYYY-MM-DD key; used to rotate the daily challenge. */
const dayNumber = (key: string): number => {
  const [y, m, d] = key.split('-').map(Number)
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(2025, 0, 1)) / 86_400_000)
}

/** Everyone gets the same challenge on the same calendar day. */
export const challengeForDay = (key: string): Challenge => {
  const n = CHALLENGES.length
  return CHALLENGES[((dayNumber(key) * 5) % n + n) % n]
}
