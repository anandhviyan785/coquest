import type { LangId } from './types'

const PYTHON: Array<[RegExp, string]> = [
  [/IndentationError|TabError/, 'Python uses indentation to group code. Check that the lines inside an if, loop or function are indented by the same amount (four spaces).'],
  [/SyntaxError.*(expected ':'|invalid syntax)/s, 'Python could not read this line. Look for a missing colon at the end of an if, for, while or def line, or an unmatched bracket or quote.'],
  [/SyntaxError.*(unterminated string|EOL while scanning)/s, 'A piece of text is missing its closing quote.'],
  [/SyntaxError.*Maybe you meant '=='/s, 'A single = stores a value. To compare two values, use ==.'],
  [/SyntaxError/, 'Python could not read this code. Check the line shown for a missing bracket, quote or colon.'],
  [/NameError/, 'You used a name Python does not know. Check the spelling, and make sure the variable or function is created before it is used.'],
  [/TypeError.*(can only concatenate|unsupported operand)/s, 'You are mixing types that do not combine, such as text and a number. Convert one with int() or str().'],
  [/TypeError.*missing \d+ required positional/s, 'A function was called with too few arguments. Compare the call with the function definition.'],
  [/TypeError.*takes \d+ positional/s, 'A function was called with too many arguments. For methods, check that the first parameter is self.'],
  [/TypeError/, 'A value was used in a way its type does not allow. Check what type each variable holds.'],
  [/ValueError.*invalid literal for int/s, 'int() was given text that is not a whole number.'],
  [/ZeroDivisionError/, 'The code divided by zero. Check the value on the right of the division.'],
  [/IndexError/, 'The code asked for a position that does not exist. Remember indexes start at 0, so the last one is the length minus 1.'],
  [/KeyError/, 'That key is not in the dictionary. Check the spelling, or test with "in" first.'],
  [/AttributeError/, 'That object does not have the attribute or method you used. Check the spelling and the type of the object.'],
  [/EOFError/, 'The program asked for input, but there was none left. Add a line to the Input box for every input() call.'],
  [/RecursionError/, 'A function kept calling itself without stopping. Check its stopping condition.'],
]

const JAVASCRIPT: Array<[RegExp, string]> = [
  [/ReferenceError/, 'You used a name that has not been declared. Check the spelling, and declare it with let or const first.'],
  [/SyntaxError/, 'JavaScript could not read this code. Look for a missing bracket, brace, quote or comma.'],
  [/TypeError.*is not a function/s, 'You tried to call something that is not a function. Check the name and what it holds.'],
  [/TypeError.*(undefined|null)/s, 'You tried to use a property of something that is undefined or null. Check that the value exists first.'],
  [/TypeError.*Assignment to constant/s, 'A const cannot be reassigned. Use let if the value needs to change.'],
  [/RangeError/, 'A function kept calling itself without stopping, or a value was out of range.'],
]

const GENERAL: Array<[RegExp, string]> = [
  [/Time limit exceeded/, 'The program ran too long. Check that every loop has a way to end.'],
  [/Output limit exceeded/, 'The program printed far too much. A loop is probably printing without stopping.'],
  [/Compile error/, 'The compiler could not build this program. Read the first error line: it names the line number and what it expected.'],
  [/SQL error.*no such (table|column)/s, 'The query mentions a table or column that does not exist. Check the spelling against the exercise description.'],
  [/SQL error.*syntax error/s, 'The query has a syntax error. Check the order of the keywords: SELECT, FROM, WHERE, GROUP BY, ORDER BY, LIMIT.'],
]

/** A plain-language explanation of a runtime error, or null when there is nothing useful to add. */
export const explainError = (lang: LangId, message: string): string | null => {
  const rules = [...GENERAL, ...(lang === 'python' ? PYTHON : lang === 'javascript' ? JAVASCRIPT : [])]
  return rules.find(([pattern]) => pattern.test(message))?.[1] ?? null
}
