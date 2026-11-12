import type { Course } from '../lib/types.ts'
import { choice, dom, fill } from './helpers.ts'

export const html: Course = {
  id: 'html',
  name: 'HTML',
  tagline: 'The structure of every web page',
  units: [
    {
      id: 'html-1',
      title: 'Page Structure',
      lessons: [
        {
          id: 'html-1-1',
          title: 'Elements and Tags',
          summary: 'Headings and paragraphs.',
          explain: [
            'HTML describes the structure of a page using elements. Most elements have an opening tag, some content and a closing tag: `<p>Hello</p>`.',
            '`<h1>` is the main heading; `<h2>` to `<h6>` are smaller headings. `<p>` is a paragraph.',
          ],
          example: { code: '<h1>My Journal</h1>\n<p>Today I started learning HTML.</p>' },
          questions: [
            choice('Which tag creates the most important heading?', ['<head>', '<h1>', '<h6>', '<p>'], 1, 'h1 is the top-level heading; h6 is the smallest.'),
            fill('Complete the closing tag.', '<p>Hello</___>', ['p'], 'A closing tag repeats the element name after a slash.'),
          ],
          exercise: {
            prompt: 'Create an `<h1>` that says `QUEST Log` and a paragraph that says `Day one complete`.',
            starter: '<!-- Write your heading and paragraph below -->\n',
            solution: '<h1>QUEST Log</h1>\n<p>Day one complete</p>',
            tests: [dom('Has an h1 saying "QUEST Log"', 'h1', 'QUEST Log'), dom('Has a paragraph saying "Day one complete"', 'p', 'Day one complete')],
            hints: ['<h1>QUEST Log</h1> is the heading.', 'Close every tag: <p>Day one complete</p>.'],
          },
        },
        {
          id: 'html-1-2',
          title: 'Links and Images',
          summary: 'Attributes add detail to elements.',
          explain: [
            'Attributes go inside the opening tag and give extra information. A link is an `<a>` element whose `href` attribute holds the destination.',
            'An image uses `<img>` with a `src` (the file) and `alt` (a text description). `<img>` has no closing tag.',
          ],
          example: { code: '<a href="https://example.com">Visit the site</a>\n<img src="map.png" alt="A treasure map">' },
          questions: [
            choice('Which attribute sets where a link goes?', ['src', 'href', 'alt', 'link'], 1, 'href stands for hypertext reference.'),
            choice('Why does an image need alt text?', ['To make it load faster', 'To describe it for people who cannot see it', 'To set its size', 'It does not'], 1, 'Screen readers read alt text aloud, and it shows if the image fails to load.'),
          ],
          exercise: {
            prompt: 'Create a link with the text `Start exploring` that points to `https://example.com`, and an image with the source `quest.png` and the alt text `QUEST the explorer`.',
            starter: '<!-- Add a link and an image -->\n',
            solution: '<a href="https://example.com">Start exploring</a>\n<img src="quest.png" alt="QUEST the explorer">',
            tests: [
              dom('Link points to https://example.com', 'a[href="https://example.com"]', 'Start exploring'),
              dom('Image uses quest.png', 'img[src="quest.png"]'),
              dom('Image has the alt text', 'img[alt="QUEST the explorer"]'),
            ],
            hints: ['<a href="https://example.com">Start exploring</a>', '<img src="quest.png" alt="QUEST the explorer"> — no closing tag needed.'],
          },
        },
      ],
    },
    {
      id: 'html-2',
      title: 'Lists and Forms',
      lessons: [
        {
          id: 'html-2-1',
          title: 'Lists',
          summary: 'Bulleted and numbered lists.',
          explain: [
            '`<ul>` is an unordered (bulleted) list and `<ol>` is an ordered (numbered) one. Each item inside is an `<li>`.',
            'Elements nest: the `<li>` elements live inside the list element, and indentation makes that structure easy to read.',
          ],
          example: { code: '<ul>\n  <li>Map</li>\n  <li>Rope</li>\n</ul>' },
          questions: [choice('Which element is a numbered list?', ['<ul>', '<ol>', '<li>', '<nl>'], 1, 'ol stands for ordered list.')],
          exercise: {
            prompt: 'Create an ordered list with three items, in this order: `Learn`, `Practise`, `Battle`.',
            starter: '<!-- Build your ordered list -->\n',
            solution: '<ol>\n  <li>Learn</li>\n  <li>Practise</li>\n  <li>Battle</li>\n</ol>',
            tests: [
              dom('First item is Learn', 'ol > li:nth-child(1)', 'Learn'),
              dom('Second item is Practise', 'ol > li:nth-child(2)', 'Practise'),
              dom('Third item is Battle', 'ol > li:nth-child(3)', 'Battle'),
            ],
            hints: ['Wrap everything in <ol> ... </ol>.', 'Each item is <li>text</li>, placed inside the <ol>.'],
          },
        },
        {
          id: 'html-2-2',
          title: 'Forms',
          summary: 'Collect input from visitors.',
          explain: [
            'A `<form>` groups controls that collect information. `<input>` is a field; its `type` attribute decides what kind — `text`, `email`, `password` and more.',
            'A `<label>` names a field. Linking them with `for` and `id` lets people click the label to focus the field, and helps screen readers.',
          ],
          example: { code: '<form>\n  <label for="name">Name</label>\n  <input id="name" type="text">\n  <button type="submit">Send</button>\n</form>' },
          questions: [choice('Which attribute links a label to its input?', ['name', 'for', 'href', 'link'], 1, 'The label\'s for must match the input\'s id.')],
          exercise: {
            prompt: 'Build a form containing a label `Email` linked to an input with the id `email` and type `email`, plus a submit button that says `Join`.',
            starter: '<!-- Build the sign-up form -->\n',
            solution: '<form>\n  <label for="email">Email</label>\n  <input id="email" type="email">\n  <button type="submit">Join</button>\n</form>',
            tests: [
              dom('Label is linked to the email field', 'form label[for="email"]', 'Email'),
              dom('Input has id and type email', 'form input#email[type="email"]'),
              dom('Submit button says Join', 'form button[type="submit"]', 'Join'),
            ],
            hints: ['The label needs for="email" and the input needs id="email".', 'The button is <button type="submit">Join</button>, inside the form.'],
          },
        },
      ],
    },
  ],
}
