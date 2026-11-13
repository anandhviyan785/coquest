import type { Unit } from '../../lib/types.ts'
import { choice, dom, fill } from '../helpers.ts'

/** HTML units 3 to 5: semantic layout, tables, richer forms, text and the document skeleton. */
export const HTML_MORE_UNITS: Unit[] = [
  {
    id: 'html-3',
    title: 'Layout and Tables',
    lessons: [
      {
        id: 'html-3-1',
        title: 'Semantic Layout',
        summary: 'Name the parts of a page.',
        explain: [
          'Semantic elements describe the role of a section, not just how it looks. `<header>` holds the top of the page, `<nav>` holds the main links, `<main>` holds the central content and `<footer>` holds the bottom.',
          '`<section>` groups related content under a heading and `<article>` marks a self-contained piece such as a blog post. Browsers, search engines and screen readers all use these names.',
        ],
        example: { code: '<header><h1>QUEST</h1></header>\n<nav><a href="#">Home</a></nav>\n<main>\n  <article><h2>News</h2></article>\n</main>\n<footer>Made by QUEST</footer>' },
        questions: [
          choice('Which element holds the main navigation links?', ['<menu>', '<nav>', '<links>', '<header>'], 1, '<nav> marks a block of navigation links.'),
          fill('Complete the tag for the bottom section of a page.', '<___>Copyright QUEST</___>', ['footer'], '<footer> holds closing information.'),
        ],
        exercise: {
          prompt: 'Build a page with a `<header>` containing an `<h1>` that says `QUEST`, a `<main>` containing a `<p>` that says `Welcome`, and a `<footer>` that says `Goodbye`.',
          starter: '<!-- Header, main and footer -->\n',
          solution: '<header>\n  <h1>QUEST</h1>\n</header>\n<main>\n  <p>Welcome</p>\n</main>\n<footer>Goodbye</footer>',
          tests: [
            dom('Header contains the h1', 'header > h1', 'QUEST'),
            dom('Main contains the paragraph', 'main > p', 'Welcome'),
            dom('Footer says Goodbye', 'footer', 'Goodbye'),
          ],
          hints: ['Use three separate elements: <header>, <main> and <footer>.', 'Put <h1>QUEST</h1> inside the header and <p>Welcome</p> inside main.'],
        },
      },
      {
        id: 'html-3-2',
        title: 'Tables',
        summary: 'Rows and columns of data.',
        explain: [
          'A `<table>` shows data in rows and columns. Each row is a `<tr>`. Header cells are `<th>` and normal cells are `<td>`.',
          'Group the heading row in `<thead>` and the data rows in `<tbody>` so browsers and screen readers understand the structure.',
        ],
        example: { code: '<table>\n  <thead>\n    <tr><th>Name</th><th>XP</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>Ada</td><td>1500</td></tr>\n  </tbody>\n</table>' },
        questions: [
          choice('Which element is one row of a table?', ['<td>', '<tr>', '<th>', '<row>'], 1, '<tr> stands for table row.'),
          choice('Which element is a header cell?', ['<td>', '<tr>', '<th>', '<thead>'], 2, '<th> marks a heading cell.'),
        ],
        exercise: {
          prompt: 'Build a table with a header row (`Name` and `XP`) and one data row (`Ada` and `1500`). Use `<th>` for the headings and `<td>` for the data.',
          starter: '<!-- Build the table -->\n',
          solution: '<table>\n  <thead>\n    <tr><th>Name</th><th>XP</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>Ada</td><td>1500</td></tr>\n  </tbody>\n</table>',
          tests: [
            dom('First heading is Name', 'table th:nth-child(1)', 'Name'),
            dom('Second heading is XP', 'table th:nth-child(2)', 'XP'),
            dom('First cell is Ada', 'table td:nth-child(1)', 'Ada'),
            dom('Second cell is 1500', 'table td:nth-child(2)', '1500'),
          ],
          hints: ['Each row is a <tr> with cells inside it.', 'Headings are <th>Name</th><th>XP</th> and data is <td>Ada</td><td>1500</td>.'],
        },
      },
    ],
  },
  {
    id: 'html-4',
    title: 'Richer Content',
    lessons: [
      {
        id: 'html-4-1',
        title: 'Text Meaning',
        summary: 'Emphasis, quotes and code.',
        explain: [
          '`<strong>` marks important text and usually shows as bold. `<em>` marks emphasis and usually shows as italic. Use them for meaning, not just looks.',
          '`<blockquote>` holds a long quotation, `<code>` marks a piece of computer code, and `<br>` forces a line break. `<hr>` draws a dividing line.',
        ],
        example: { code: '<p>This is <strong>very</strong> <em>important</em>.</p>\n<p>Run <code>npm start</code> to begin.</p>' },
        questions: [
          choice('Which element marks important text?', ['<b>', '<strong>', '<big>', '<mark>'], 1, '<strong> carries the meaning of importance.'),
          fill('Complete the element that marks a piece of code.', '<p>Type <___>print()</___> to show text.</p>', ['code'], '<code> marks computer code.'),
        ],
        exercise: {
          prompt: 'Write one paragraph that says `Always save your work`, with the word `Always` wrapped in `<strong>` and the word `save` wrapped in `<em>`.',
          starter: '<!-- One paragraph with strong and em -->\n',
          solution: '<p><strong>Always</strong> <em>save</em> your work</p>',
          tests: [
            dom('Paragraph exists', 'p', 'your work'),
            dom('Always is strong', 'p strong', 'Always'),
            dom('save is emphasised', 'p em', 'save'),
          ],
          hints: ['Put <strong> around Always and <em> around save.', 'Keep everything inside a single <p>.'],
        },
      },
      {
        id: 'html-4-2',
        title: 'More Form Controls',
        summary: 'Choices, checkboxes and long text.',
        explain: [
          'A `<select>` shows a drop-down with `<option>` items. A `<textarea>` collects several lines of text. A checkbox is `<input type="checkbox">` and radio buttons are `<input type="radio">` that share a `name`.',
          'Add the `required` attribute to make a field mandatory, and `placeholder` to show a hint inside an empty field.',
        ],
        example: { code: '<select id="league">\n  <option>Gold</option>\n  <option>Silver</option>\n</select>\n<textarea placeholder="Tell us more"></textarea>\n<input type="checkbox" id="news"> <label for="news">Send news</label>' },
        questions: [
          choice('Which element creates a drop-down menu?', ['<dropdown>', '<select>', '<list>', '<menu>'], 1, '<select> with <option> children makes a drop-down.'),
          fill('Complete the attribute that makes a field mandatory.', '<input type="text" ___>', ['required'], '`required` stops the form being sent while the field is empty.'),
        ],
        exercise: {
          prompt: 'Build a form with a `<select>` that has the id `league` and two options, `Gold` and `Silver`, plus a `<textarea>` with the id `note`.',
          starter: '<!-- A select and a textarea inside a form -->\n',
          solution: '<form>\n  <select id="league">\n    <option>Gold</option>\n    <option>Silver</option>\n  </select>\n  <textarea id="note"></textarea>\n</form>',
          tests: [
            dom('Select with the id league', 'form select#league'),
            dom('First option is Gold', 'select#league option:nth-child(1)', 'Gold'),
            dom('Second option is Silver', 'select#league option:nth-child(2)', 'Silver'),
            dom('Textarea with the id note', 'form textarea#note'),
          ],
          hints: ['<select id="league"> holds <option> elements.', 'A textarea has an opening and closing tag: <textarea id="note"></textarea>.'],
        },
      },
    ],
  },
  {
    id: 'html-5',
    title: 'A Complete Page',
    lessons: [
      {
        id: 'html-5-1',
        title: 'The Document Skeleton',
        summary: 'Doctype, head and body.',
        explain: [
          'A full page starts with `<!doctype html>`, then an `<html>` element with a `lang` attribute. Inside are two parts: `<head>` for information about the page, and `<body>` for what visitors see.',
          'The head holds `<title>` (the tab name) and `<meta charset="utf-8">`, which makes accents and symbols display correctly. `<meta name="viewport" ...>` helps pages fit phone screens.',
        ],
        example: { code: '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="utf-8">\n    <title>My Page</title>\n  </head>\n  <body>\n    <h1>Hello</h1>\n  </body>\n</html>' },
        questions: [
          choice('Which element holds the text shown in the browser tab?', ['<head>', '<title>', '<h1>', '<tab>'], 1, '<title> inside the head names the page.'),
          choice('Where do visible page contents go?', ['<head>', '<body>', '<meta>', '<html lang>'], 1, 'The body holds everything visitors see.'),
        ],
        exercise: {
          prompt: 'Write a complete page: `<html>` with `lang="en"`, a `<head>` containing a `<title>` that says `QUEST Home`, and a `<body>` containing an `<h1>` that says `Welcome`.',
          starter: '<!doctype html>\n<!-- Build the page -->\n',
          solution: '<!doctype html>\n<html lang="en">\n  <head>\n    <title>QUEST Home</title>\n  </head>\n  <body>\n    <h1>Welcome</h1>\n  </body>\n</html>',
          tests: [
            dom('The html element has lang en', 'html[lang="en"]'),
            dom('The head has the title', 'head > title', 'QUEST Home'),
            dom('The body has the h1', 'body > h1', 'Welcome'),
          ],
          hints: ['Wrap everything in <html lang="en"> ... </html>.', 'The title goes inside <head> and the h1 inside <body>.'],
        },
      },
      {
        id: 'html-5-2',
        title: 'Accessible Pages',
        summary: 'Pages everyone can use.',
        explain: [
          'Accessibility means everyone can use your page, including people using screen readers or only a keyboard. Give every image meaningful `alt` text, keep headings in order (`h1` then `h2`, not `h1` then `h4`) and label every form field.',
          'When a button has only an icon, add `aria-label` so assistive technology can announce it: `<button aria-label="Close">X</button>`.',
        ],
        example: { code: '<img src="logo.png" alt="QUEST logo">\n<button aria-label="Close">X</button>' },
        questions: [
          choice('What does the alt attribute on an image provide?', ['A tooltip colour', 'A text description for people who cannot see it', 'The image size', 'A link'], 1, 'Screen readers read the alt text aloud.'),
          fill('Complete the attribute that gives an icon button a spoken name.', '<button ___-label="Close">X</button>', ['aria'], 'aria-label supplies an accessible name.'),
        ],
        exercise: {
          prompt: 'Add an image with the `src` `owl.png` and `alt` text `A friendly owl`, then a button with `aria-label="Close"` whose visible text is `X`.',
          starter: '<!-- Accessible image and button -->\n',
          solution: '<img src="owl.png" alt="A friendly owl">\n<button aria-label="Close">X</button>',
          tests: [
            dom('Image with the right src', 'img[src="owl.png"]'),
            dom('Image has alt text', 'img[alt="A friendly owl"]'),
            dom('Button has an aria-label', 'button[aria-label="Close"]', 'X'),
          ],
          hints: ['<img src="owl.png" alt="..."> has no closing tag.', 'Give the button aria-label="Close" and the text X.'],
        },
      },
    ],
    boss: {
      id: 'boss:html-5',
      title: 'Banish the Div Soup Demon',
      monster: 'The Div Soup Demon',
      story: 'The Div Soup Demon hides every page under a pile of meaningless divs. Name each part properly to drive it out.',
      stages: [
        {
          prompt: 'Build a `<nav>` that contains an unordered list with three links whose text is `Home`, `Learn` and `Shop`.',
          starter: '<!-- A navigation list -->\n',
          solution: '<nav>\n  <ul>\n    <li><a href="#">Home</a></li>\n    <li><a href="#">Learn</a></li>\n    <li><a href="#">Shop</a></li>\n  </ul>\n</nav>',
          tests: [
            dom('Nav contains a list', 'nav ul'),
            dom('First link is Home', 'nav li:nth-child(1) a', 'Home'),
            dom('Second link is Learn', 'nav li:nth-child(2) a', 'Learn'),
            dom('Third link is Shop', 'nav li:nth-child(3) a', 'Shop'),
          ],
          hints: ['Nest <ul> inside <nav>.', 'Each item is <li><a href="#">Text</a></li>.'],
        },
        {
          prompt: 'Build an `<article>` with an `<h2>` that says `Patch notes`, a `<p>` with any text, and a `<footer>` inside the article that says `By QUEST`.',
          starter: '<!-- An article with a heading, text and a footer -->\n',
          solution: '<article>\n  <h2>Patch notes</h2>\n  <p>Bugs squashed.</p>\n  <footer>By QUEST</footer>\n</article>',
          tests: [
            dom('Article has the heading', 'article > h2', 'Patch notes'),
            dom('Article has a paragraph', 'article > p'),
            dom('Article has its own footer', 'article > footer', 'By QUEST'),
          ],
          hints: ['Everything lives inside <article> ... </article>.', 'A footer can be placed inside an article.'],
        },
      ],
    },
  },
]
