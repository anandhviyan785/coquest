import type { Course } from '../lib/types.ts'
import { choice, css as rule, fill } from './helpers.ts'

export const css: Course = {
  id: 'css',
  name: 'CSS',
  tagline: 'Colour, layout and style',
  units: [
    {
      id: 'css-1',
      title: 'Styling Basics',
      lessons: [
        {
          id: 'css-1-1',
          title: 'Selectors and Properties',
          summary: 'Choose elements and style them.',
          explain: [
            'A CSS rule has a selector that picks elements and a block of declarations in curly braces. Each declaration is a property, a colon, a value and a semicolon.',
            'An element selector such as `p` matches every paragraph. A class selector starts with a dot: `.card` matches every element with `class="card"`.',
          ],
          example: { code: 'h1 {\n  color: navy;\n  font-size: 32px;\n}\n\n.note {\n  color: gray;\n}' },
          questions: [
            choice('Which selector matches elements with class="hint"?', ['hint', '#hint', '.hint', '*hint'], 2, 'A dot selects by class; a hash selects by id.'),
            fill('Complete the property that sets text colour.', 'p {\n  ___: red;\n}', ['color'], 'color sets the colour of text.'),
          ],
          exercise: {
            prompt: 'Make every `h1` blue with a font size of `40px`, and give elements with the class `note` the colour `gray`.',
            markup: '<h1>QUEST Log</h1>\n<p class="note">Day one complete</p>',
            starter: '/* Style the h1 and the .note class */\n',
            solution: 'h1 {\n  color: blue;\n  font-size: 40px;\n}\n\n.note {\n  color: gray;\n}',
            tests: [rule('h1 is blue', 'h1', 'color', 'blue'), rule('h1 is 40px', 'h1', 'font-size', '40px'), rule('.note is gray', '.note', 'color', 'gray')],
            hints: ['h1 { color: blue; font-size: 40px; }', 'Class selectors start with a dot: .note { color: gray; }'],
          },
        },
        {
          id: 'css-1-2',
          title: 'The Box Model',
          summary: 'Padding, borders and margins.',
          explain: [
            'Every element is a box. `padding` is the space inside the box around the content, `border` is the edge, and `margin` is the space outside it.',
            'A border needs a width, a style and a colour, which can be written in one line: `border: 2px solid black`.',
          ],
          example: { code: '.card {\n  padding: 16px;\n  border: 2px solid black;\n  margin: 24px;\n}' },
          questions: [choice('Which property adds space inside an element, around its content?', ['margin', 'padding', 'border', 'gap'], 1, 'padding is inside the border; margin is outside.')],
          exercise: {
            prompt: 'Give the `.card` class `20px` of padding, a `12px` border radius and a background colour of `lightblue`.',
            markup: '<div class="card">Explorer badge</div>',
            starter: '.card {\n  /* Add three declarations */\n}',
            solution: '.card {\n  padding: 20px;\n  border-radius: 12px;\n  background-color: lightblue;\n}',
            tests: [rule('Padding is 20px', '.card', 'padding', '20px'), rule('Corners are rounded by 12px', '.card', 'border-radius', '12px'), rule('Background is lightblue', '.card', 'background-color', 'lightblue')],
            hints: ['padding: 20px; and border-radius: 12px;', 'background-color: lightblue;'],
          },
        },
      ],
    },
    {
      id: 'css-2',
      title: 'Layout',
      lessons: [
        {
          id: 'css-2-1',
          title: 'Flexbox',
          summary: 'Line items up in a row or column.',
          explain: [
            'Setting `display: flex` on a container lines its children up in a row. `gap` adds space between them.',
            '`justify-content` positions the items along the row (for example `center` or `space-between`) and `align-items` positions them across it.',
          ],
          example: { code: '.toolbar {\n  display: flex;\n  gap: 12px;\n  justify-content: space-between;\n  align-items: center;\n}' },
          questions: [choice('Which declaration turns an element into a flex container?', ['flex: on', 'display: flex', 'layout: flex', 'position: flex'], 1, 'display: flex activates flexbox for the element\'s children.')],
          exercise: {
            prompt: 'Make `.row` a flex container with a `16px` gap and its items centred horizontally with `justify-content`.',
            markup: '<div class="row"><button>Learn</button><button>Play</button><button>Duel</button></div>',
            starter: '.row {\n  /* Add three declarations */\n}',
            solution: '.row {\n  display: flex;\n  gap: 16px;\n  justify-content: center;\n}',
            tests: [rule('Uses flexbox', '.row', 'display', 'flex'), rule('Gap is 16px', '.row', 'gap', '16px'), rule('Items are centred', '.row', 'justify-content', 'center')],
            hints: ['display: flex; comes first.', 'gap: 16px; and justify-content: center;'],
          },
        },
        {
          id: 'css-2-2',
          title: 'Hover States',
          summary: 'React when the pointer moves over an element.',
          explain: [
            'A pseudo-class styles an element in a particular state. `:hover` applies while the pointer is over the element.',
            'Adding a `transition` makes the change animate smoothly instead of snapping.',
          ],
          example: { code: 'button {\n  background-color: navy;\n  transition: background-color 0.2s;\n}\n\nbutton:hover {\n  background-color: blue;\n}' },
          questions: [choice('When does a :hover rule apply?', ['Always', 'While the pointer is over the element', 'After a click', 'On page load'], 1, ':hover is active only while the pointer is over the element.')],
          exercise: {
            prompt: 'Give `button` a background colour of `navy` and white text. When hovered, the background should become `teal`.',
            markup: '<button>Start quest</button>',
            starter: '/* Style the button and its hover state */\n',
            solution: 'button {\n  background-color: navy;\n  color: white;\n}\n\nbutton:hover {\n  background-color: teal;\n}',
            tests: [rule('Button is navy', 'button', 'background-color', 'navy'), rule('Button text is white', 'button', 'color', 'white'), rule('Hover turns it teal', 'button:hover', 'background-color', 'teal')],
            hints: ['Write two rules: button { ... } and button:hover { ... }.', 'The hover rule only needs background-color: teal;'],
          },
        },
      ],
    },
  ],
}
