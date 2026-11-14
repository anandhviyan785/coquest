/**
 * Everything search engines and first-time visitors see before signing in: site details and the
 * public pages. Plain TypeScript with no React imports, so the build step can read it in Node and
 * write each page's HTML (see scripts/prerender.ts) as well as the app rendering it.
 */

export const SITE = {
  name: 'CoQuest',
  origin: 'https://www.coquest.website',
  tagline: 'Your coding adventure starts here.',
  subTagline: 'Learn to code. Level up. Build anything.',
  logo: '/logo-512.png',
  ogImage: '/og-image.png',
} as const

export const HOME_TITLE = 'CoQuest | Learn Coding Through Play'
export const HOME_DESCRIPTION =
  'Learn Python, JavaScript, and programming fundamentals through interactive lessons, coding quests, XP, streaks, and fun gamified learning with CoQuest.'

export interface Section { heading: string; body: string[]; bullets?: string[] }
export interface Faq { question: string; answer: string }

export interface PublicPage {
  path: string
  title: string
  description: string
  h1: string
  lead: string
  /** The course this page teaches, used for the Course structured data. */
  course?: { name: string; description: string }
  sections: Section[]
  faq: Faq[]
  /** Paths of related public pages, shown as internal links. */
  related: string[]
  /** Label of the main button, which sends visitors to sign up. */
  cta: string
  /** Short name used in breadcrumbs and link text. */
  label: string
}

/** The home page's introduction. The visual design lives in pages/Landing.tsx. */
export const HOME = {
  h1: 'Your coding adventure starts here.',
  lead:
    'Learning to code does not have to be boring. CoQuest turns programming into an interactive adventure: short lessons you can try straight away, quests to finish, challenges to beat and a streak to keep alive. You do not need any experience to begin.',
  primaryCta: 'Start Your Coding Quest',
  secondaryCta: 'Explore Courses',
  points: [
    { title: 'Write real code from lesson one', text: 'Every lesson ends with a coding exercise that runs in your browser, so you learn by doing instead of watching.' },
    { title: 'Level up as you learn', text: 'Earn XP, keep a daily streak, collect achievements and take on boss battles that test what you have learned.' },
    { title: 'Made for beginners', text: 'Plain-language explanations, hints when you are stuck and a glossary for every course. QUEST the mascot cheers you on.' },
  ],
} as const

export const PUBLIC_PAGES: PublicPage[] = [
  {
    path: '/learn-python-for-beginners',
    label: 'Learn Python',
    title: 'Learn Python for Beginners | CoQuest',
    description: 'Learn Python from scratch with short interactive lessons, coding exercises that run in your browser, boss battles, XP and daily streaks. No experience needed.',
    h1: 'Learn Python for beginners, one small win at a time',
    lead: 'Python is one of the friendliest first languages. CoQuest teaches it through short lessons, instant coding practice and quests, so you build real skills without drowning in theory.',
    course: { name: 'Python for Beginners', description: 'An interactive beginner Python course covering fundamentals, conditions, loops, functions, data structures and more.' },
    sections: [
      {
        heading: 'What you will learn in the Python course',
        body: ['The course is split into units that build on each other, so every new idea rests on something you have already practised.'],
        bullets: [
          'Fundamentals: variables, data types, operators, input and output',
          'Conditional logic: booleans, if, else and elif',
          'Loops: for, while, break and continue',
          'Functions: reusing and organising your code',
          'Data structures: lists, dictionaries and friends',
          'Advanced Python: the next step once the basics feel natural',
        ],
      },
      {
        heading: 'How lessons work',
        body: [
          'Each lesson starts with a short explanation and a worked example, followed by quick questions and a coding exercise. You write Python in the built-in editor and run it right in your browser, with nothing to install.',
          'If an exercise is tricky, hints guide you towards the answer. When a unit ends, a boss battle checks that the ideas have really stuck.',
        ],
      },
      {
        heading: 'Why Python is a good first language',
        body: ['Python reads almost like English and needs very little punctuation, so you can focus on thinking like a programmer. It is used for websites, automation, data analysis and artificial intelligence, so the skills carry a long way.'],
      },
    ],
    faq: [
      { question: 'Do I need any programming experience to learn Python on CoQuest?', answer: 'No. The Python course starts with the very basics, and every concept is explained in plain language before you use it.' },
      { question: 'Do I have to install Python?', answer: 'No. Python runs inside your browser, so you can write and run code as soon as you open a lesson.' },
      { question: 'Is CoQuest free?', answer: 'Yes. You can create an account and start learning without paying.' },
    ],
    related: ['/learn-javascript-for-beginners', '/coding-lessons-for-beginners', '/coding-challenges'],
    cta: 'Start learning Python',
  },
  {
    path: '/learn-javascript-for-beginners',
    label: 'Learn JavaScript',
    title: 'Learn JavaScript for Beginners | CoQuest',
    description: 'Learn JavaScript step by step with interactive lessons, in-browser coding practice, quests and boss battles. Start with variables and finish with classes.',
    h1: 'Learn JavaScript for beginners, hands-on from the first lesson',
    lead: 'JavaScript powers the interactive web. CoQuest breaks it into small, playable steps, from your first console.log to functions, objects and classes.',
    course: { name: 'JavaScript for Beginners', description: 'An interactive beginner JavaScript course covering variables, conditions, functions, arrays, objects, recursion and classes.' },
    sections: [
      {
        heading: 'What the JavaScript course covers',
        body: ['Five units take you from the basics to modern JavaScript.'],
        bullets: [
          'Fundamentals: values, variables, const and let, and conditions',
          'Functions and arrays: loops, arrow functions, map and filter',
          'Strings and objects: text methods and grouping related data',
          'Flexible functions: default and rest parameters, and recursion',
          'Modern JavaScript: destructuring, spread and classes',
        ],
      },
      {
        heading: 'Practise by writing real code',
        body: ['Every lesson includes an exercise that runs your code against tests in the browser and tells you exactly what passed and what did not. A boss battle at the end of the harder units combines what you have learned into a bigger challenge.'],
      },
      {
        heading: 'Where JavaScript can take you',
        body: ['JavaScript runs in every web browser, and also on servers and in mobile apps. Learning it opens the door to building websites and web apps, and pairs naturally with HTML and CSS.'],
      },
    ],
    faq: [
      { question: 'Is JavaScript hard for a complete beginner?', answer: 'It is approachable if you take it in small steps. The CoQuest course introduces one idea at a time and checks your understanding with questions and exercises.' },
      { question: 'Do I need to set up a code editor?', answer: 'No. You write and run JavaScript in the built-in editor in your browser.' },
      { question: 'Should I learn HTML and CSS too?', answer: 'They work well together. HTML structures a page, CSS styles it and JavaScript makes it interactive. CoQuest has courses for all three.' },
    ],
    related: ['/learn-html-and-css', '/learn-python-for-beginners', '/coding-challenges'],
    cta: 'Start learning JavaScript',
  },
  {
    path: '/learn-html-and-css',
    label: 'Learn HTML and CSS',
    title: 'Learn HTML and CSS for Beginners | CoQuest',
    description: 'Learn HTML and CSS by building real page structure and styles in your browser. Interactive lessons on elements, forms, tables, layout, flexbox and more.',
    h1: 'Learn HTML and CSS by building pages as you go',
    lead: 'HTML gives a web page its structure and CSS gives it its look. In CoQuest you write both in a live editor and see whether your page meets each challenge straight away.',
    course: { name: 'HTML and CSS for Beginners', description: 'Interactive HTML and CSS courses covering page structure, semantic layout, forms, tables, selectors, the box model and flexbox.' },
    sections: [
      {
        heading: 'HTML: the structure of a page',
        body: ['The HTML course teaches elements, links and images, lists, forms, tables, semantic layout and the full document skeleton. It also covers accessibility basics, such as writing good alt text and labelling form fields.'],
        bullets: ['Headings, paragraphs and links', 'Lists, tables and forms', 'Header, nav, main and footer', 'A complete, accessible page'],
      },
      {
        heading: 'CSS: how a page looks',
        body: ['The CSS course covers selectors and properties, the box model, flexbox layout and hover states, so you can style what you build with HTML.'],
      },
      {
        heading: 'Learn by changing real code',
        body: ['Exercises check your markup and styles against clear goals, such as "has a heading that says QUEST Log" or "the button has a blue background". You get specific feedback and hints rather than a vague pass or fail.'],
      },
    ],
    faq: [
      { question: 'Do I learn HTML or CSS first?', answer: 'Start with HTML, because it creates the content that CSS then styles. After the HTML course, move on to CSS.' },
      { question: 'Do I need to install anything to practise?', answer: 'No. You write HTML and CSS in the browser editor and the result is checked there.' },
      { question: 'What comes after HTML and CSS?', answer: 'JavaScript is the natural next step, because it adds behaviour to the pages you build.' },
    ],
    related: ['/learn-javascript-for-beginners', '/learn-coding-online', '/coding-lessons-for-beginners'],
    cta: 'Start learning HTML and CSS',
  },
  {
    path: '/learn-coding-online',
    label: 'Learn coding online',
    title: 'Learn Coding Online, Free and Interactive | CoQuest',
    description: 'Learn to code online with CoQuest: seven languages, short interactive lessons, an in-browser code editor, streaks and quests. Start free with no setup.',
    h1: 'Learn coding online, right in your browser',
    lead: 'You do not need a powerful computer or a pile of software to start. CoQuest runs the lessons and the code editor in your browser, so you can learn to code on a laptop, a tablet or a phone.',
    sections: [
      {
        heading: 'Choose a language to start with',
        body: ['CoQuest has courses for Python, JavaScript, HTML, CSS, SQL, Java and C++. If you are not sure where to begin, Python and JavaScript are popular first languages, and HTML and CSS are a good choice if you want to build web pages.'],
        bullets: ['Python for beginners', 'JavaScript for beginners', 'HTML and CSS', 'SQL for working with data', 'Java and C++ for structured, typed languages'],
      },
      {
        heading: 'A routine that is easy to keep',
        body: ['Lessons are short on purpose. A daily XP goal, a streak and gentle reminders make it easier to practise a little each day, which helps more than occasional long sessions.'],
      },
      {
        heading: 'Learn by doing, not just watching',
        body: ['Every lesson ends with a coding exercise. You run your code, see the result and get feedback, so you build real programming habits from the start.'],
      },
    ],
    faq: [
      { question: 'Can I learn to code online for free?', answer: 'Yes. You can create a CoQuest account and start the courses without paying.' },
      { question: 'Does it work on my phone?', answer: 'Yes. CoQuest is designed to work on phones and tablets as well as computers.' },
      { question: 'How long should I practise each day?', answer: 'Even ten minutes helps. Your daily goal is something you choose and can change at any time.' },
    ],
    related: ['/learn-python-for-beginners', '/learn-javascript-for-beginners', '/gamified-coding-education'],
    cta: 'Start your coding quest',
  },
  {
    path: '/coding-lessons-for-beginners',
    label: 'Coding lessons for beginners',
    title: 'Coding Lessons for Beginners | CoQuest',
    description: 'Beginner coding lessons that explain one idea at a time, with examples, questions and a coding exercise. Learn programming without feeling overwhelmed.',
    h1: 'Coding lessons for beginners that explain one idea at a time',
    lead: 'The hardest part of learning to code is often not knowing what to do next. Each CoQuest lesson has one clear goal, a plain-language explanation and a small exercise to prove you understood it.',
    sections: [
      {
        heading: 'What is inside a lesson',
        body: ['Every lesson follows the same simple pattern, so you always know what to expect.'],
        bullets: ['A short explanation in everyday language', 'A worked example with its output', 'Quick questions to check understanding', 'A coding exercise with tests and hints'],
      },
      {
        heading: 'Help when you get stuck',
        body: ['Hints nudge you towards a solution without giving it away. Each course also has a glossary that explains the key terms, from variables to APIs, in plain language.'],
      },
      {
        heading: 'A path that builds step by step',
        body: ['Lessons are grouped into units that unlock in order. Each unit ends with a boss battle that mixes what you have learned, so you can see how far you have come.'],
      },
    ],
    faq: [
      { question: 'What should a complete beginner learn first?', answer: 'Start with the fundamentals of any language: variables, data types and simple output. The first unit of each CoQuest course covers these.' },
      { question: 'What if I get an exercise wrong?', answer: 'You can try again as often as you like. Tests show what went wrong and hints suggest the next step.' },
      { question: 'Is there a dictionary of coding terms?', answer: 'Yes. Every course has a glossary that explains the key terms in plain language.' },
    ],
    related: ['/learn-python-for-beginners', '/learn-coding-online', '/coding-challenges'],
    cta: 'Start your first lesson',
  },
  {
    path: '/gamified-coding-education',
    label: 'Gamified coding education',
    title: 'Gamified Coding Education That Keeps You Going | CoQuest',
    description: 'See how CoQuest uses XP, streaks, quests, achievements and boss battles to make learning programming more motivating, without losing the focus on real skills.',
    h1: 'Gamified coding education that keeps you coming back',
    lead: 'Games are good at keeping people practising. CoQuest borrows the best ideas, such as small goals, visible progress and friendly rewards, and points them at learning real programming skills.',
    sections: [
      {
        heading: 'The game ideas behind CoQuest',
        body: ['Gamification works best when it supports learning rather than replacing it. These are the elements CoQuest uses.'],
        bullets: [
          'XP and levels that show your progress',
          'Daily streaks and goals that build a habit',
          'Quests with small rewards for finishing',
          'Achievements for milestones along the way',
          'Boss battles that test a whole unit',
          'Duels and a daily challenge for friendly competition',
        ],
      },
      {
        heading: 'Rewards that follow real work',
        body: ['You earn XP by completing lessons and passing exercises, not just by opening the app. The rewards point back to the skill you are building.'],
      },
      {
        heading: 'Meet QUEST, your guide',
        body: ['QUEST the mascot celebrates your wins, reacts to your progress and reminds you to keep your streak, so learning feels more like a journey than a chore.'],
      },
    ],
    faq: [
      { question: 'Does gamification actually help with learning to code?', answer: 'It can help you stay consistent, which is a big part of learning. CoQuest keeps the focus on writing real code, with the game elements supporting your practice.' },
      { question: 'What are streaks?', answer: 'A streak counts the days in a row you reach your daily goal. Streak freezes protect it if you miss a day.' },
      { question: 'Can I turn the reminders off?', answer: 'Yes. Practice reminders can be switched on or off in Settings.' },
    ],
    related: ['/learn-coding-online', '/coding-challenges', '/coding-lessons-for-beginners'],
    cta: 'Start your coding quest',
  },
  {
    path: '/coding-challenges',
    label: 'Interactive coding challenges',
    title: 'Interactive Programming Challenges | CoQuest',
    description: 'Test your skills with interactive programming challenges: a new daily challenge, boss battles and duels, with coding exercises that run and check your code.',
    h1: 'Interactive programming challenges that put your skills to work',
    lead: 'Reading about code only gets you so far. CoQuest challenges ask you to write solutions that run, so you find out quickly what you really know.',
    sections: [
      {
        heading: 'Ways to test yourself',
        body: ['There are several kinds of challenge, from a quick daily puzzle to a full boss battle.'],
        bullets: [
          'Daily challenge: a new problem each day, with a timer and a leaderboard',
          'Boss battles: multi-stage fights at the end of a unit',
          'Duels: a head-to-head contest against another learner',
          'The playground: a free editor to experiment in any language',
        ],
      },
      {
        heading: 'Clear feedback on every attempt',
        body: ['Your code runs against tests, and you see which ones passed and what was expected. You can adjust your solution and try again straight away.'],
      },
      {
        heading: 'Ready when you are',
        body: ['Challenges build on the lessons, so a beginner can start with the first unit and come back to challenges as their skills grow.'],
      },
    ],
    faq: [
      { question: 'Do I need to finish the lessons before trying challenges?', answer: 'Lessons give you the tools, so they are the best place to start. The playground is open to everyone for free experimenting.' },
      { question: 'Which languages are the challenges in?', answer: 'The daily challenge and boss battles use the languages you learn in the courses, such as Python, JavaScript and SQL.' },
      { question: 'What is a boss battle?', answer: 'A boss battle is a short series of coding problems that tests everything in a unit. Beating it earns bonus XP.' },
    ],
    related: ['/gamified-coding-education', '/learn-python-for-beginners', '/learn-javascript-for-beginners'],
    cta: 'Start your coding quest',
  },
]

/** First path segment of every address that belongs to the signed-in app (and its sign-in page). */
const APP_ROOTS = ['login', 'learn', 'lesson', 'boss', 'leaderboard', 'quests', 'shop', 'profile', 'bosses', 'settings', 'playground', 'daily', 'duels', 'stats']

export const isAppPath = (path: string): boolean => APP_ROOTS.includes(path.split('/')[1] ?? '')

export const pageByPath = (path: string): PublicPage | undefined => PUBLIC_PAGES.find((p) => p.path === path)

/** Pages that must stay out of search results: sign-in and everything behind it. */
export const PRIVATE_PATHS = ['/login', '/lesson/', '/boss/', '/learn', '/leaderboard', '/quests', '/shop', '/profile', '/bosses', '/settings', '/playground', '/daily', '/duels', '/stats'] as const
