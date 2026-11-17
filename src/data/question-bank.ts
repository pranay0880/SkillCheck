import type { Level, McqOption, TestCase } from "../lib/types";
import type { Skill } from "./skills";

export interface BankMcq {
  type: "mcq";
  skill: Skill;
  level: Level;
  title: string;
  prompt: string;
  points: number;
  options: McqOption[];
  correctOptionIds: string[];
}

export interface BankCode {
  type: "code";
  skill: Skill;
  level: Level;
  title: string;
  prompt: string;
  points: number;
  functionName: string;
  starterCode: string;
  testCases: TestCase[];
}

export interface BankText {
  type: "text";
  skill: Skill;
  level: Level;
  title: string;
  prompt: string;
  points: number;
  markingGuide: string;
}

export type BankQuestion = BankMcq | BankCode | BankText;

const MCQ_POINTS: Record<Level, number> = { fresher: 1, junior: 2 };
const CODE_POINTS: Record<Level, number> = { fresher: 5, junior: 10 };

function mcq(skill: Skill, level: Level, title: string, prompt: string, options: string[], correct: string): BankMcq {
  return {
    type: "mcq",
    skill,
    level,
    title,
    prompt,
    points: MCQ_POINTS[level],
    options: options.map((text, index) => ({ id: String.fromCharCode(97 + index), text })),
    correctOptionIds: correct.split(""),
  };
}

function code(
  skill: Skill,
  level: Level,
  title: string,
  prompt: string,
  functionName: string,
  params: string,
  testCases: TestCase[],
): BankCode {
  return {
    type: "code",
    skill,
    level,
    title,
    prompt,
    points: CODE_POINTS[level],
    functionName,
    starterCode: `function ${functionName}(${params}) {\n  \n}\n`,
    testCases,
  };
}

const visible = (args: unknown[], expected: unknown): TestCase => ({ args, expected, hidden: false });
const hidden = (args: unknown[], expected: unknown): TestCase => ({ args, expected, hidden: true });

const JAVASCRIPT: BankQuestion[] = [
  mcq("JavaScript", "fresher", "JS: var inside a loop with setTimeout",
    "What does this log?\n\nfor (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 0);\n}",
    ["0 1 2", "3 3 3", "undefined undefined undefined", "It throws a ReferenceError"], "b"),
  mcq("JavaScript", "fresher", "JS: typeof null",
    "What is the result of typeof null?",
    ["'null'", "'object'", "'undefined'", "'number'"], "b"),
  mcq("JavaScript", "fresher", "JS: array methods that return a new array",
    "Which of these array methods return a NEW array without changing the original? (Select all that apply)",
    ["map", "push", "filter", "sort", "slice"], "ace"),
  mcq("JavaScript", "junior", "JS: event loop order",
    "What is logged, in order?\n\nconsole.log('A');\nsetTimeout(() => console.log('B'), 0);\nPromise.resolve().then(() => console.log('C'));\nconsole.log('D');",
    ["A B C D", "A D B C", "A D C B", "A C D B"], "c"),
  mcq("JavaScript", "junior", "JS: Promise.all with a rejection",
    "What happens if one of the promises passed to Promise.all rejects?",
    ["It waits for all, then resolves with the successful ones", "It rejects with that error as soon as it happens", "It ignores the rejected promise", "It retries the rejected promise once"], "b"),
  mcq("JavaScript", "junior", "JS: this in arrow functions",
    "How does `this` behave inside an arrow function?",
    ["It always refers to the global object", "It refers to the object the function is called on", "It is taken from the surrounding (lexical) scope where the arrow function is defined", "Arrow functions cannot access `this`"], "c"),
  code("JavaScript", "fresher", "JS code: sum of an array",
    "Write a function sumArray(numbers) that returns the sum of all numbers in the array. An empty array returns 0.",
    "sumArray", "numbers",
    [visible([[1, 2, 3]], 6), visible([[]], 0), hidden([[-5, 10, 2.5]], 7.5), hidden([[100]], 100)]),
  code("JavaScript", "fresher", "JS code: reverse a string",
    "Write a function reverseString(text) that returns the string reversed.",
    "reverseString", "text",
    [visible(["hello"], "olleh"), visible([""], ""), hidden(["Next.js"], "sj.txeN"), hidden(["a"], "a")]),
  code("JavaScript", "fresher", "JS code: FizzBuzz list",
    "Write fizzBuzz(n) that returns an array of strings for 1..n: multiples of 3 become \"Fizz\", multiples of 5 become \"Buzz\", multiples of both become \"FizzBuzz\", others become the number as a string.",
    "fizzBuzz", "n",
    [visible([5], ["1", "2", "Fizz", "4", "Buzz"]), visible([1], ["1"]),
      hidden([15], ["1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz", "11", "Fizz", "13", "14", "FizzBuzz"]), hidden([0], [])]),
  code("JavaScript", "fresher", "JS code: palindrome check",
    "Write isPalindrome(text) that returns true if the text reads the same forwards and backwards, ignoring case, spaces and punctuation.",
    "isPalindrome", "text",
    [visible(["racecar"], true), visible(["hello"], false), hidden(["A man, a plan, a canal: Panama"], true), hidden([""], true)]),
  code("JavaScript", "junior", "JS code: group by key",
    "Write groupBy(items, key) that groups an array of objects by the value of the given key. Return an object where each key maps to an array of matching items, in their original order.",
    "groupBy", "items, key",
    [visible([[{ team: "a", n: 1 }, { team: "b", n: 2 }, { team: "a", n: 3 }], "team"], { a: [{ team: "a", n: 1 }, { team: "a", n: 3 }], b: [{ team: "b", n: 2 }] }),
      visible([[], "team"], {}),
      hidden([[{ role: "dev" }, { role: "qa" }, { role: "dev" }, { role: "pm" }], "role"], { dev: [{ role: "dev" }, { role: "dev" }], qa: [{ role: "qa" }], pm: [{ role: "pm" }] })]),
  code("JavaScript", "junior", "JS code: flatten nested array",
    "Write flatten(list) that flattens an arbitrarily nested array into a single-level array. Do not use Array.prototype.flat.",
    "flatten", "list",
    [visible([[1, [2, [3, [4]], 5]]], [1, 2, 3, 4, 5]), visible([[]], []), hidden([[[[]], [1], [[2, 3]]]], [1, 2, 3]), hidden([["a", ["b", ["c"]]]], ["a", "b", "c"])]),
  code("JavaScript", "junior", "JS code: remove duplicates by id",
    "Write uniqueById(items) that removes objects with a duplicate id, keeping the FIRST occurrence and preserving order.",
    "uniqueById", "items",
    [visible([[{ id: 1, v: "a" }, { id: 2, v: "b" }, { id: 1, v: "c" }]], [{ id: 1, v: "a" }, { id: 2, v: "b" }]), visible([[]], []),
      hidden([[{ id: "x" }, { id: "y" }, { id: "x" }, { id: "z" }, { id: "y" }]], [{ id: "x" }, { id: "y" }, { id: "z" }])]),
];

const TYPESCRIPT: BankQuestion[] = [
  mcq("TypeScript", "fresher", "TS: typing an array of strings",
    "Which of these correctly type a variable as an array of strings? (Select all that apply)",
    ["let names: string[]", "let names: Array<string>", "let names: [string]", "let names: string"], "ab"),
  mcq("TypeScript", "fresher", "TS: optional property",
    "How do you mark a property as optional in an interface?",
    ["name: optional string", "name?: string", "name: string | optional", "?name: string"], "b"),
  mcq("TypeScript", "fresher", "TS: union types",
    "What does `let id: string | number;` mean?",
    ["id must be both a string and a number", "id can hold either a string or a number", "id is a string that contains a number", "It is a syntax error"], "b"),
  mcq("TypeScript", "junior", "TS: unknown vs any",
    "What is the key difference between `unknown` and `any`?",
    ["There is no difference", "`unknown` forces you to narrow the type before using it; `any` turns type checking off", "`any` is safer than `unknown`", "`unknown` can only hold primitive values"], "b"),
  mcq("TypeScript", "junior", "TS: Partial utility type",
    "Given `interface User { id: string; name: string; email: string }`, which type makes every property optional?",
    ["Required<User>", "Partial<User>", "Pick<User, 'id'>", "Readonly<User>"], "b"),
  mcq("TypeScript", "junior", "TS: keyof operator",
    "Given `type User = { id: string; name: string }`, what is `keyof User`?",
    ["string", "\"id\" | \"name\"", "[\"id\", \"name\"]", "{ id: string; name: string }"], "b"),
];

const REACT: BankQuestion[] = [
  mcq("React", "fresher", "React: why lists need keys",
    "Why does React need a `key` prop when rendering a list?",
    ["To apply CSS styles to each item", "To identify which items changed, were added or were removed between renders", "To make the list accessible to screen readers", "Keys are only needed for lists longer than 10 items"], "b"),
  mcq("React", "fresher", "React: props are read-only",
    "Which statement about props is correct?",
    ["A component can change its own props directly", "Props are read-only inside the component that receives them", "Props can only be strings", "Props are shared global state"], "b"),
  mcq("React", "fresher", "React: calling setState twice",
    "count starts at 0. After clicking the button once, what is count?\n\nconst onClick = () => {\n  setCount(count + 1);\n  setCount(count + 1);\n};",
    ["0", "1", "2", "It throws an error"], "b"),
  mcq("React", "junior", "React: useEffect without dependencies",
    "When does `useEffect(() => { doSomething(); })` (no dependency array) run?",
    ["Once, after the first render", "After every render", "Never", "Only when the component unmounts"], "b"),
  mcq("React", "junior", "React: purpose of useMemo",
    "What is useMemo for?",
    ["Storing state that triggers re-renders", "Caching the result of an expensive calculation between renders until its dependencies change", "Running side effects after render", "Memoizing a whole component"], "b"),
  mcq("React", "junior", "React: sharing state between siblings",
    "Two sibling components need the same piece of state. What is the usual React approach?",
    ["Copy the state into both components and keep them in sync with useEffect", "Lift the state up to their closest common parent and pass it down as props", "Store it in a global variable", "Use refs to read each other's state"], "b"),
  code("React", "junior", "React code: todo reducer",
    "Write a reducer todoReducer(state, action) for a todo list, as used with useReducer.\n\nstate is an array of { id, text, done }.\nActions:\n- { type: \"add\", id, text } → append { id, text, done: false }\n- { type: \"toggle\", id } → flip done for that id\n- { type: \"remove\", id } → remove that todo\n- any other type → return state unchanged\n\nDo not mutate the original state; return a new array.",
    "todoReducer", "state, action",
    [visible([[], { type: "add", id: 1, text: "Learn React" }], [{ id: 1, text: "Learn React", done: false }]),
      visible([[{ id: 1, text: "A", done: false }], { type: "toggle", id: 1 }], [{ id: 1, text: "A", done: true }]),
      hidden([[{ id: 1, text: "A", done: false }, { id: 2, text: "B", done: true }], { type: "remove", id: 1 }], [{ id: 2, text: "B", done: true }]),
      hidden([[{ id: 1, text: "A", done: true }], { type: "unknown" }], [{ id: 1, text: "A", done: true }])]),
];

const NEXTJS: BankQuestion[] = [
  mcq("Next.js", "fresher", "Next.js: file that defines a route's UI",
    "In the Next.js App Router, which file makes a folder publicly accessible as a page?",
    ["index.tsx", "page.tsx", "route.tsx", "view.tsx"], "b"),
  mcq("Next.js", "fresher", "Next.js: client-side navigation",
    "What is the recommended way to link between pages in a Next.js app?",
    ["<a href=\"/about\"> everywhere", "The <Link href=\"/about\"> component from next/link", "window.location = '/about'", "A <form> submit"], "b"),
  mcq("Next.js", "fresher", "Next.js: dynamic route folder",
    "Which path creates a dynamic route for blog posts such as /blog/hello-world?",
    ["app/blog/:slug/page.tsx", "app/blog/[slug]/page.tsx", "app/blog/{slug}/page.tsx", "app/blog/slug/page.tsx"], "b"),
  mcq("Next.js", "junior", "Next.js: Server vs Client Components",
    "In the App Router, which statement about Server Components is TRUE?",
    ["They can use useState and useEffect", "They are the default; add 'use client' only when you need interactivity or browser APIs", "They are sent to the browser as JavaScript and hydrated", "They cannot fetch data"], "b"),
  mcq("Next.js", "junior", "Next.js: reading route params",
    "In recent Next.js versions, how do you read the slug in app/blog/[slug]/page.tsx (a Server Component)?",
    ["const { slug } = params", "const { slug } = await params", "const { slug } = useRouter().query", "const slug = window.location.pathname"], "b"),
  mcq("Next.js", "junior", "Next.js: Server Actions",
    "Which TWO statements about Server Actions are correct? (Select all that apply)",
    ["They are marked with the 'use server' directive", "They run in the browser", "They must re-check authorization, because they can be called directly with a POST request", "They only work in the Pages Router"], "ac"),
];

const NODE: BankQuestion[] = [
  mcq("Node.js", "fresher", "Node: what Node.js is",
    "What is Node.js?",
    ["A JavaScript framework for building UIs", "A JavaScript runtime built on Chrome's V8 engine that runs JavaScript outside the browser", "A database", "A CSS preprocessor"], "b"),
  mcq("Node.js", "fresher", "Node: installing dependencies",
    "Which command installs all dependencies listed in package.json?",
    ["node install", "npm install", "npm build", "node package.json"], "b"),
  mcq("Node.js", "fresher", "Node: reading an environment variable",
    "How do you read an environment variable called PORT in Node.js?",
    ["env.PORT", "process.env.PORT", "window.env.PORT", "require('PORT')"], "b"),
  mcq("Node.js", "junior", "Node: readFileSync and the event loop",
    "Why should you avoid fs.readFileSync inside a request handler on a busy server?",
    ["It returns a Promise you might forget to await", "It blocks the event loop, so no other requests are handled until it finishes", "It cannot read text files", "It is deprecated"], "b"),
  mcq("Node.js", "junior", "Node: using ES modules",
    "How do you make .js files in a Node.js project use import/export (ES modules) by default?",
    ["Add \"type\": \"module\" to package.json", "Rename node_modules to modules", "Run node --es5", "ES modules are not supported in Node.js"], "a"),
  mcq("Node.js", "junior", "Node: unhandled promise rejections",
    "In modern Node.js (v15+), what happens by default when a Promise rejects and nothing handles it?",
    ["Nothing; it is silently ignored", "A warning is printed and the process keeps running forever", "The process exits with an error", "The promise is retried automatically"], "c"),
  code("Node.js", "junior", "Node code: parse a Cookie header",
    "Write parseCookies(header) that turns a Cookie request header into an object.\n\n- Pairs are separated by \";\" and may have spaces around them.\n- Split each pair on the FIRST \"=\" only.\n- Decode values with decodeURIComponent.\n- An empty or missing header returns {}.\n\nExample: \"theme=dark; name=Asha%20K\" → { theme: \"dark\", name: \"Asha K\" }",
    "parseCookies", "header",
    [visible(["theme=dark; name=Asha%20K"], { theme: "dark", name: "Asha K" }), visible([""], {}),
      hidden(["token=a=b=c"], { token: "a=b=c" }), hidden(["  a=1 ;b=2  "], { a: "1", b: "2" })]),
];

const EXPRESS: BankQuestion[] = [
  mcq("Express", "fresher", "Express: defining a GET route",
    "Which code defines a route that handles GET requests to /users?",
    ["app.route('GET /users', handler)", "app.get('/users', handler)", "app.fetch('/users', handler)", "express.get('/users', handler)"], "b"),
  mcq("Express", "fresher", "Express: route parameters",
    "For the route app.get('/users/:id', handler), how do you read the id?",
    ["req.query.id", "req.body.id", "req.params.id", "req.id"], "c"),
  mcq("Express", "fresher", "Express: parsing JSON bodies",
    "Which built-in middleware lets you read a JSON request body from req.body?",
    ["express.static()", "express.json()", "express.urlencoded()", "express.body()"], "b"),
  mcq("Express", "junior", "Express: middleware order",
    "Which statement about Express middleware is correct?",
    ["Middleware runs in random order", "Middleware runs in the order it is registered, and must call next() (or send a response) to continue", "Middleware only runs for POST requests", "next() ends the request"], "b"),
  mcq("Express", "junior", "Express: error-handling middleware",
    "How does Express recognise error-handling middleware?",
    ["It is named errorHandler", "It takes four arguments: (err, req, res, next)", "It is registered with app.error()", "It must be the first middleware"], "b"),
  mcq("Express", "junior", "Express: query strings",
    "For a request to /products?page=2&sort=price, how do you read the page value?",
    ["req.params.page", "req.query.page", "req.body.page", "req.headers.page"], "b"),
  code("Express", "junior", "Express code: match a route pattern",
    "Write matchRoute(pattern, path) that works like Express route matching.\n\n- Segments starting with \":\" are parameters and match any non-empty segment.\n- Other segments must match exactly.\n- The number of segments must be equal.\n- Return an object of parameters if it matches, or null if it does not.\n\nExample: matchRoute(\"/users/:id\", \"/users/42\") → { id: \"42\" }",
    "matchRoute", "pattern, path",
    [visible(["/users/:id", "/users/42"], { id: "42" }), visible(["/users/:id", "/posts/1"], null),
      hidden(["/users/:id/orders/:orderId", "/users/7/orders/9"], { id: "7", orderId: "9" }),
      hidden(["/users/:id", "/users/1/extra"], null), hidden(["/health", "/health"], {})]),
];

const PYTHON: BankQuestion[] = [
  mcq("Python", "fresher", "Python: type of a list",
    "What does print(type([])) output?",
    ["<class 'array'>", "<class 'list'>", "<class 'tuple'>", "list"], "b"),
  mcq("Python", "fresher", "Python: creating a dictionary",
    "Which line creates a dictionary?",
    ["data = [\"a\", 1]", "data = (\"a\", 1)", "data = {\"a\": 1}", "data = {\"a\", 1}"], "c"),
  mcq("Python", "fresher", "Python: string length",
    "What does len(\"hello\") return?",
    ["4", "5", "6", "It raises an error"], "b"),
  mcq("Python", "junior", "Python: list comprehension",
    "What is the value of [x * 2 for x in range(3)]?",
    ["[2, 4, 6]", "[0, 2, 4]", "[0, 1, 2]", "[0, 2, 4, 6]"], "b"),
  mcq("Python", "junior", "Python: mutable default argument",
    "What does the second call print?\n\ndef add(item, items=[]):\n    items.append(item)\n    return items\n\nadd(\"a\")\nprint(add(\"b\"))",
    ["['b']", "['a', 'b']", "['a']", "It raises an error"], "b"),
  mcq("Python", "junior", "Python: tuple vs list",
    "What is the main difference between a tuple and a list?",
    ["Tuples are immutable; lists are mutable", "Lists cannot hold mixed types", "Tuples can only hold numbers", "There is no difference"], "a"),
];

const HTML: BankQuestion[] = [
  mcq("HTML", "fresher", "HTML: semantic navigation",
    "Which element is the correct semantic wrapper for the main site navigation links?",
    ["<div class=\"nav\">", "<nav>", "<menu>", "<section>"], "b"),
  mcq("HTML", "fresher", "HTML: purpose of alt",
    "What is the main purpose of the alt attribute on an <img>?",
    ["To show a tooltip on hover", "To describe the image for screen readers and when the image cannot load", "To set the image size", "To improve image quality"], "b"),
  mcq("HTML", "fresher", "HTML: email input",
    "Which input gives built-in email validation and an email keyboard on phones?",
    ["<input type=\"text\">", "<input type=\"email\">", "<input type=\"mail\">", "<email>"], "b"),
  mcq("HTML", "junior", "HTML: button vs clickable div",
    "Why is <button> better than <div onclick> for an action?",
    ["It is faster to render", "It is focusable and works with the keyboard and screen readers by default", "Divs cannot have click handlers", "There is no difference"], "b"),
  mcq("HTML", "junior", "HTML: labelling an input",
    "Which correctly associates a label with an input?",
    ["<label>Email</label><input id=\"email\">", "<label for=\"email\">Email</label><input id=\"email\">", "<label name=\"email\">Email</label><input name=\"email\">", "<input label=\"Email\">"], "b"),
  mcq("HTML", "junior", "HTML: heading structure",
    "Which heading structure is best for a typical page?",
    ["Several <h1> elements for visual emphasis", "One <h1>, then <h2> for sections and <h3> for sub-sections, without skipping levels", "Only <h3> elements because they are smaller", "Headings are optional if text is bold"], "b"),
];

const CSS: BankQuestion[] = [
  mcq("CSS", "fresher", "CSS: box-sizing border-box",
    "With box-sizing: border-box, a box has width: 200px, padding: 20px and border: 5px. What is its total rendered width?",
    ["200px", "240px", "250px", "210px"], "a"),
  mcq("CSS", "fresher", "CSS: flexbox column alignment",
    "In a container with display: flex and flex-direction: column, which property aligns items along the vertical axis?",
    ["align-items", "justify-content", "align-content", "vertical-align"], "b"),
  mcq("CSS", "fresher", "CSS: selector specificity",
    "An element matches both #title { color: red } and .title { color: blue }. What colour is it?",
    ["Blue, because classes are newer", "Red, because an ID selector is more specific than a class selector", "Whichever rule comes last", "Purple"], "b"),
  mcq("CSS", "junior", "CSS: absolute positioning",
    "An element with position: absolute is positioned relative to what?",
    ["The browser window, always", "Its nearest ancestor with a position other than static", "Its previous sibling", "The <body> element, always"], "b"),
  mcq("CSS", "junior", "CSS: grid columns",
    "What does grid-template-columns: repeat(3, 1fr) create?",
    ["Three rows of equal height", "Three equal-width columns", "One column three times wider", "Three columns of 1px"], "b"),
  mcq("CSS", "junior", "CSS: rem unit",
    "What is 1rem relative to?",
    ["The parent element's font size", "The root (<html>) element's font size", "The viewport width", "Always 16px, regardless of settings"], "b"),
];

const TAILWIND: BankQuestion[] = [
  mcq("Tailwind CSS", "fresher", "Tailwind: padding utility",
    "With the default spacing scale, which class adds 1rem of padding on all sides?",
    ["p-1", "p-4", "padding-4", "p-16"], "b"),
  mcq("Tailwind CSS", "fresher", "Tailwind: responsive prefix",
    "Which class makes an element display: flex only on medium screens and larger?",
    ["flex-md", "md:flex", "flex:md", "@md-flex"], "b"),
  mcq("Tailwind CSS", "fresher", "Tailwind: hover styles",
    "How do you change a button's background on hover?",
    ["bg-blue-600:hover", "hover:bg-blue-600", "on-hover-bg-blue-600", "bg-hover-blue-600"], "b"),
  mcq("Tailwind CSS", "junior", "Tailwind: mobile-first breakpoints",
    "In `class=\"text-sm md:text-lg\"`, what text size is used on a phone?",
    ["text-lg", "text-sm", "Neither; it uses the browser default", "Both are applied"], "b"),
  mcq("Tailwind CSS", "junior", "Tailwind v4: custom theme values",
    "In Tailwind CSS v4, where do you define custom design tokens such as brand colours?",
    ["In tailwind.config.js only", "In your CSS with the @theme directive", "In package.json", "In a .env file"], "b"),
  mcq("Tailwind CSS", "junior", "Tailwind: dark mode variant",
    "What does `dark:bg-gray-900` do by default?",
    ["Always sets a dark background", "Applies bg-gray-900 when the user's system prefers a dark colour scheme", "Applies only when JavaScript is disabled", "Inverts all colours"], "b"),
];

const BOOTSTRAP: BankQuestion[] = [
  mcq("Bootstrap", "fresher", "Bootstrap: grid columns",
    "How many columns does the Bootstrap grid have per row?",
    ["10", "12", "16", "24"], "b"),
  mcq("Bootstrap", "fresher", "Bootstrap: primary button",
    "Which classes create a Bootstrap primary button?",
    ["button primary", "btn btn-primary", "btn-main", "bs-button-primary"], "b"),
  mcq("Bootstrap", "fresher", "Bootstrap: grid structure",
    "What is the correct nesting for a Bootstrap grid layout?",
    [".col > .row > .container", ".container > .row > .col", ".row > .container > .col", ".grid > .col > .row"], "b"),
  mcq("Bootstrap", "junior", "Bootstrap: col-md-6",
    "What does class=\"col-md-6\" do?",
    ["Always half width", "Half width from the md breakpoint up; full width on smaller screens", "Six columns on mobile only", "Hides the column below md"], "b"),
  mcq("Bootstrap", "junior", "Bootstrap: spacing utilities",
    "Which class adds a top margin using Bootstrap's spacing scale step 3?",
    ["margin-top-3", "mt-3", "m-t-3", "top-3"], "b"),
  mcq("Bootstrap", "junior", "Bootstrap: responsive display",
    "What does class=\"d-none d-md-block\" do?",
    ["Always hidden", "Hidden on small screens, shown as block from the md breakpoint up", "Shown on small screens, hidden from md up", "Shown only on md screens"], "b"),
];

const GIT: BankQuestion[] = [
  mcq("Git", "fresher", "Git: undo the last local commit",
    "You committed locally (not pushed) and want to undo the commit but KEEP the changes. Which command?",
    ["git reset --hard HEAD~1", "git reset --soft HEAD~1", "git revert HEAD", "git checkout HEAD~1"], "b"),
  mcq("Git", "fresher", "Git: create and switch branch",
    "Which commands create a new branch called feature/login and switch to it? (Select all that apply)",
    ["git checkout -b feature/login", "git switch -c feature/login", "git branch feature/login --go", "git new feature/login"], "ab"),
  mcq("Git", "fresher", "Git: check what changed",
    "Which command shows which files are modified, staged or untracked?",
    ["git log", "git status", "git show", "git remote -v"], "b"),
  mcq("Git", "junior", "Git: rebase vs merge",
    "Which statement about git rebase is TRUE?",
    ["It always creates a merge commit", "It rewrites commit history, so avoid rebasing branches others have already pulled", "It deletes the target branch", "It only works on main"], "b"),
  mcq("Git", "junior", "Git: finishing a merge conflict",
    "After fixing the conflict markers in a file during a merge, what do you do next?",
    ["git push --force", "git add the file, then git commit (or git merge --continue)", "Delete the .git folder", "git reset --hard"], "b"),
  mcq("Git", "junior", "Git: stash",
    "What does git stash do?",
    ["Deletes uncommitted changes permanently", "Saves uncommitted changes aside so you get a clean working tree, and lets you re-apply them later", "Pushes changes to a hidden remote branch", "Squashes all commits"], "b"),
];

const MONGODB: BankQuestion[] = [
  mcq("MongoDB", "fresher", "MongoDB: how data is stored",
    "How does MongoDB store data?",
    ["Rows in tables", "Documents (BSON, JSON-like) in collections", "Key-value pairs only", "CSV files"], "b"),
  mcq("MongoDB", "fresher", "MongoDB: greater-than query",
    "Which query finds users older than 25?",
    ["db.users.find({ age > 25 })", "db.users.find({ age: { $gt: 25 } })", "db.users.find({ $gt: { age: 25 } })", "db.users.where(\"age > 25\")"], "b"),
  mcq("MongoDB", "fresher", "MongoDB: default primary key",
    "What is the default unique identifier field on every MongoDB document?",
    ["id", "_id", "key", "uuid"], "b"),
  mcq("MongoDB", "junior", "MongoDB: updating one field",
    "Which call changes only the name field of a document, keeping all other fields?",
    ["db.users.replaceOne({ _id }, { name: \"Asha\" })", "db.users.updateOne({ _id }, { $set: { name: \"Asha\" } })", "db.users.insertOne({ _id, name: \"Asha\" })", "db.users.updateOne({ _id }, { name: \"Asha\" })"], "b"),
  mcq("MongoDB", "junior", "MongoDB: indexes",
    "What is the trade-off of adding an index?",
    ["Faster reads, but extra storage and slightly slower writes", "Faster writes, but slower reads", "No trade-off at all", "Indexes delete duplicate documents"], "a"),
  mcq("MongoDB", "junior", "MongoDB: counting with $group",
    "Which aggregation stage counts users per role?",
    ["{ $count: \"$role\" }", "{ $group: { _id: \"$role\", count: { $sum: 1 } } }", "{ $match: { role: { $count: 1 } } }", "{ $sort: { role: 1 } }"], "b"),
];

const SQL: BankQuestion[] = [
  mcq("SQL", "fresher", "SQL: select everything",
    "Which statement returns all columns from the users table?",
    ["GET * FROM users;", "SELECT * FROM users;", "SELECT users;", "SHOW users;"], "b"),
  mcq("SQL", "fresher", "SQL: filtering rows",
    "Which clause filters rows before they are returned?",
    ["ORDER BY", "WHERE", "GROUP BY", "LIMIT"], "b"),
  mcq("SQL", "fresher", "SQL: sorting",
    "How do you sort results by name from Z to A?",
    ["ORDER BY name ASC", "ORDER BY name DESC", "SORT name DESC", "GROUP BY name DESC"], "b"),
  mcq("SQL", "junior", "SQL: INNER JOIN",
    "What does an INNER JOIN return?",
    ["All rows from both tables", "Only rows that have matching values in both tables", "All rows from the left table", "Rows that do not match"], "b"),
  mcq("SQL", "junior", "SQL: counting per group",
    "Which query counts employees in each department?",
    ["SELECT department, COUNT(*) FROM employees;", "SELECT department, COUNT(*) FROM employees GROUP BY department;", "SELECT COUNT(department) FROM employees ORDER BY department;", "SELECT department FROM employees WHERE COUNT(*) > 0;"], "b"),
  mcq("SQL", "junior", "SQL: WHERE vs HAVING",
    "What is the difference between WHERE and HAVING?",
    ["They are identical", "WHERE filters rows before grouping; HAVING filters groups after aggregation", "HAVING filters rows before grouping; WHERE filters groups", "HAVING can only be used with JOIN"], "b"),
];

const REST: BankQuestion[] = [
  mcq("REST APIs", "fresher", "REST: method to create a resource",
    "Which HTTP method is normally used to create a new resource?",
    ["GET", "POST", "DELETE", "HEAD"], "b"),
  mcq("REST APIs", "fresher", "REST: 404 status",
    "What does HTTP status 404 mean?",
    ["Server error", "Not Found", "Unauthorized", "Created"], "b"),
  mcq("REST APIs", "fresher", "REST: 201 status",
    "Which status code best fits a successful POST that created a new record?",
    ["200 OK", "201 Created", "204 No Content", "302 Found"], "b"),
  mcq("REST APIs", "junior", "REST: idempotent methods",
    "Which HTTP methods are idempotent by definition? (Select all that apply)",
    ["GET", "POST", "PUT", "DELETE"], "acd"),
  mcq("REST APIs", "junior", "REST: 401 vs 403",
    "What is the difference between 401 and 403?",
    ["They mean the same thing", "401 means not authenticated; 403 means authenticated but not allowed", "401 means forbidden; 403 means not logged in", "403 is only for rate limiting"], "b"),
  mcq("REST APIs", "junior", "REST: nested resource URL",
    "Which URL best follows REST conventions for getting the orders of user 42?",
    ["GET /getOrders?user=42", "GET /users/42/orders", "POST /users/42/getOrders", "GET /orders/user-42/list"], "b"),
  code("REST APIs", "junior", "REST code: build a query string",
    "Write toQueryString(params) that converts an object into a URL query string.\n\n- Skip keys whose value is null or undefined.\n- Array values repeat the key.\n- Encode keys and values with encodeURIComponent.\n- Keep the object's key order.\n- Return an empty string when there are no params.\n\nExample: { q: \"next js\", tags: [\"a\", \"b\"], page: 2 } → \"q=next%20js&tags=a&tags=b&page=2\"",
    "toQueryString", "params",
    [visible([{ q: "next js", tags: ["a", "b"], page: 2 }], "q=next%20js&tags=a&tags=b&page=2"), visible([{}], ""),
      hidden([{ a: null, b: undefined, c: 0 }], "c=0"), hidden([{ "x&y": "1=2" }], "x%26y=1%3D2")]),
];

const CONTENTFUL: BankQuestion[] = [
  mcq("Contentful", "fresher", "Contentful: content types",
    "In Contentful, what defines which fields an entry has?",
    ["An asset", "A content type", "A locale", "An environment alias"], "b"),
  mcq("Contentful", "fresher", "Contentful: API for published content",
    "Which API should a website use to fetch PUBLISHED content?",
    ["Content Management API", "Content Delivery API", "Content Preview API", "Images API"], "b"),
  mcq("Contentful", "fresher", "Contentful: previewing drafts",
    "Which API returns draft (unpublished) content for previewing?",
    ["Content Delivery API", "Content Preview API", "GraphQL Admin API", "Webhooks API"], "b"),
  mcq("Contentful", "junior", "Contentful: reference fields",
    "What is a reference field used for?",
    ["Storing a URL string", "Linking an entry to other entries or assets", "Referencing a Git commit", "Storing translations"], "b"),
  mcq("Contentful", "junior", "Contentful: rich text output",
    "What does the Delivery API return for a Rich Text field?",
    ["A ready-made HTML string", "A structured JSON document that you render, for example with @contentful/rich-text-react-renderer", "Markdown", "Plain text only"], "b"),
  mcq("Contentful", "junior", "Contentful: changing a content model safely",
    "What is the recommended way to change a content model used by a live site?",
    ["Edit fields directly in the master environment during peak traffic", "Use a separate environment and scripted migrations, then promote the change", "Delete and recreate the content type", "Change it only through the Delivery API"], "b"),
];

const ACCESSIBILITY: BankQuestion[] = [
  mcq("Accessibility", "fresher", "A11y: decorative images",
    "What alt text should a purely decorative image have?",
    ["alt=\"image\"", "alt=\"\" (empty)", "No alt attribute at all", "alt=\"decorative image\""], "b"),
  mcq("Accessibility", "fresher", "A11y: WCAG text contrast",
    "What is the minimum contrast ratio for normal-size body text under WCAG 2.2 AA?",
    ["3:1", "4.5:1", "7:1", "2:1"], "b"),
  mcq("Accessibility", "fresher", "A11y: keyboard access",
    "Which statement about keyboard users is correct?",
    ["Only links need to work with a keyboard", "Every interactive element must be reachable and usable with the keyboard alone", "Keyboard support is optional if the site works with a mouse", "Tab order does not matter"], "b"),
  mcq("Accessibility", "junior", "A11y: icon-only button",
    "A button contains only an SVG icon (no text). What is the best way to make it accessible?",
    ["Add a title on the SVG only", "Add aria-label=\"Close\" on the <button> and aria-hidden=\"true\" on the SVG", "Use a <div onclick> instead", "Nothing; screen readers read SVG paths"], "b"),
  mcq("Accessibility", "junior", "A11y: form error messages",
    "What is the best way to show a validation error for an input?",
    ["Turn the border red only", "Show a text message and link it to the input with aria-describedby (and mark the input aria-invalid)", "Show an alert() popup", "Put the error in the placeholder"], "b"),
  mcq("Accessibility", "junior", "A11y: first rule of ARIA",
    "What is the 'first rule of ARIA'?",
    ["Add ARIA roles to every element", "Use a native HTML element with the built-in semantics you need instead of adding ARIA when you can", "ARIA replaces the need for keyboard support", "Always use role=\"button\" on links"], "b"),
];

const SEO: BankQuestion[] = [
  mcq("SEO", "fresher", "SEO: page title",
    "Which tag sets the title that usually appears as the headline in search results?",
    ["<h1>", "<title>", "<meta name=\"title\">", "<header>"], "b"),
  mcq("SEO", "fresher", "SEO: meta description",
    "What does the meta description mainly do?",
    ["Guarantees a top ranking", "Provides a summary that search engines may show as the snippet under the title", "Hides the page from search", "Sets the page language"], "b"),
  mcq("SEO", "fresher", "SEO: h1 usage",
    "What is the best practice for <h1> on a page?",
    ["No <h1> at all", "One clear <h1> describing the page's main topic", "Every paragraph in an <h1>", "Use <h1> only for the logo"], "b"),
  mcq("SEO", "junior", "SEO: canonical URL",
    "What does <link rel=\"canonical\" href=\"…\"> tell search engines?",
    ["Which page to load first", "The preferred URL when the same content is reachable at several URLs", "To stop crawling the site", "The page's author"], "b"),
  mcq("SEO", "junior", "SEO: metadata in Next.js",
    "In the Next.js App Router, how do you set a page's title and description?",
    ["Edit _document.js", "Export a metadata object or a generateMetadata function from the page or layout", "Use next/head inside a Server Component", "Set them in next.config.js"], "b"),
  mcq("SEO", "junior", "SEO: noindex",
    "What does <meta name=\"robots\" content=\"noindex\"> do?",
    ["Speeds up indexing", "Asks search engines not to include the page in their index", "Blocks all users from the page", "Removes the page from the sitemap automatically"], "b"),
];

const PERFORMANCE: BankQuestion[] = [
  mcq("Performance Optimization", "fresher", "Perf: modern image formats",
    "Which image formats are usually smallest for photos on the web? (Select all that apply)",
    ["BMP", "WebP", "AVIF", "TIFF"], "bc"),
  mcq("Performance Optimization", "fresher", "Perf: lazy-loading images",
    "Which attribute tells the browser to delay loading an off-screen image?",
    ["defer", "loading=\"lazy\"", "async", "lazy=\"true\""], "b"),
  mcq("Performance Optimization", "fresher", "Perf: minification",
    "What does minifying JavaScript and CSS do?",
    ["Removes unused features from the browser", "Reduces file size by removing whitespace, comments and shortening names", "Converts code to images", "Makes code run on the server"], "b"),
  mcq("Performance Optimization", "junior", "Perf: Core Web Vitals",
    "Which of these are Core Web Vitals? (Select all that apply)",
    ["LCP (Largest Contentful Paint)", "INP (Interaction to Next Paint)", "CLS (Cumulative Layout Shift)", "DNS (Domain Name System)"], "abc"),
  mcq("Performance Optimization", "junior", "Perf: debouncing input",
    "Why debounce a search box that calls an API on every keystroke?",
    ["To make typing faster", "To wait until the user pauses typing, so far fewer requests are sent", "To cache images", "To encrypt the request"], "b"),
  mcq("Performance Optimization", "junior", "Perf: React.memo",
    "What does wrapping a component in React.memo do?",
    ["Caches API responses", "Skips re-rendering the component when its props are shallowly equal to the previous props", "Makes the component a Server Component", "Prevents the component from ever re-rendering"], "b"),
];

export const QUESTION_BANK: BankQuestion[] = [
  ...JAVASCRIPT,
  ...TYPESCRIPT,
  ...REACT,
  ...NEXTJS,
  ...NODE,
  ...EXPRESS,
  ...PYTHON,
  ...HTML,
  ...CSS,
  ...TAILWIND,
  ...BOOTSTRAP,
  ...GIT,
  ...MONGODB,
  ...SQL,
  ...REST,
  ...CONTENTFUL,
  ...ACCESSIBILITY,
  ...SEO,
  ...PERFORMANCE,
];
