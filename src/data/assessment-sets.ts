import type { Level, TestCase } from "../lib/types";
import type { BankCode, BankMcq, BankQuestion, BankText } from "./question-bank";
import type { Skill } from "./skills";

export interface AssessmentSet {
  code: string;
  title: string;
  description: string;
  durationMinutes: number;
  questions: BankQuestion[];
}

const LEVEL: Level = "junior";
const MCQ_MARKS = 1;
const WRITTEN_MARKS = 3;
const CODING_MARKS = 5;

const INSTRUCTIONS =
  "Answer all questions.\nSection 1 (Q1–Q15): multiple choice, 1 mark each. Choose the single best answer.\nSection 2 (Q16–Q25): written answers, 3 marks each. Explain clearly and give examples where useful.\nSection 3 (Q26–Q27): coding in JavaScript, 5 marks each. Run the visible tests; hidden tests also count.\nTotal: 55 marks.";

const shown = (args: unknown[], expected: unknown): TestCase => ({ args, expected, hidden: false });
const secret = (args: unknown[], expected: unknown): TestCase => ({ args, expected, hidden: true });

function coding(
  code: string,
  n: number,
  skill: Skill,
  area: string,
  prompt: string,
  functionName: string,
  params: string,
  testCases: TestCase[],
): BankCode {
  return {
    type: "code",
    skill,
    level: LEVEL,
    title: `${code} · Section 3 · Q${n} (${area})`,
    prompt,
    points: CODING_MARKS,
    functionName,
    starterCode: `function ${functionName}(${params}) {\n  \n}\n`,
    testCases,
  };
}

const PRODUCTS = [
  { name: "Mouse", price: 25, category: "Electronics" },
  { name: "Desk", price: 150, category: "Furniture" },
  { name: "Keyboard", price: 45, category: "Electronics" },
  { name: "Lamp", price: 30, category: "Furniture" },
];

const TODOS = [
  { id: 1, text: "Buy milk", done: false },
  { id: 2, text: "Write report", done: true },
  { id: 3, text: "Buy bread", done: true },
  { id: 4, text: "Call mom", done: false },
];

const CART_PEN_BOOK = {
  items: [
    { id: 1, name: "Pen", price: 10, qty: 2 },
    { id: 2, name: "Book", price: 12.5, qty: 1 },
  ],
  total: 32.5,
};

function mcq(code: string, n: number, skill: Skill, prompt: string, options: string[], answer: "A" | "B" | "C" | "D"): BankMcq {
  return {
    type: "mcq",
    skill,
    level: LEVEL,
    title: `${code} · Section 1 · Q${n}`,
    prompt,
    points: MCQ_MARKS,
    options: options.map((text, index) => ({ id: String.fromCharCode(97 + index), text })),
    correctOptionIds: [answer.toLowerCase()],
  };
}

function written(code: string, n: number, skill: Skill, prompt: string, guide: string[]): BankText {
  return {
    type: "text",
    skill,
    level: LEVEL,
    title: `${code} · Section 2 · Q${n}`,
    prompt,
    points: WRITTEN_MARKS,
    markingGuide: `Suggested marking (${WRITTEN_MARKS} marks):\n${guide.map((line) => `• ${line}`).join("\n")}`,
  };
}

const FS_A = "FS-A";
const FULL_STACK_A: BankQuestion[] = [
  mcq(FS_A, 1, "HTML", "Which HTML element is most appropriate for the main navigation section of a webpage?", ["<div>", "<nav>", "<section>", "<aside>"], "B"),
  mcq(FS_A, 2, "CSS", "What is the difference between display: none and visibility: hidden?", ["Both remove the element from layout", "display:none removes layout space, visibility:hidden preserves it", "visibility:hidden removes layout space", "There is no difference"], "B"),
  mcq(FS_A, 3, "JavaScript", "What will the following JavaScript return: typeof null?", ["null", "undefined", "object", "number"], "C"),
  mcq(FS_A, 4, "JavaScript", "Which method creates a new array containing elements that satisfy a condition?", ["map()", "forEach()", "filter()", "reduce()"], "C"),
  mcq(FS_A, 5, "React", "What is the primary purpose of React's useEffect hook?", ["To create components", "To handle side effects", "To define CSS", "To update props"], "B"),
  mcq(FS_A, 6, "React", "Why should keys be provided when rendering lists in React?", ["To improve CSS styling", "To help React identify elements between renders", "To prevent API calls", "To create unique IDs in the database"], "B"),
  mcq(FS_A, 7, "Next.js", "Which Next.js feature allows a page to be generated at build time?", ["SSR", "CSR", "Static Site Generation", "Middleware"], "C"),
  mcq(FS_A, 8, "Next.js", "What is the purpose of getServerSideProps in the Next.js Pages Router?", ["Fetch data at request time on the server", "Fetch data only in the browser", "Create API routes", "Generate CSS"], "A"),
  mcq(FS_A, 9, "Express", "Which Express.js method is used to define middleware?", ["app.use()", "app.render()", "app.listen()", "app.static()"], "A"),
  mcq(FS_A, 10, "Node.js", "Which Node.js module is commonly used to work with file systems?", ["http", "fs", "path", "events"], "B"),
  mcq(FS_A, 11, "Node.js", "What is the purpose of async/await in Node.js?", ["To stop asynchronous execution", "To simplify handling of Promises", "To make code synchronous at the OS level", "To create threads"], "B"),
  mcq(FS_A, 12, "Contentful", "What is a Contentful Content Type?", ["A CSS component", "A schema defining the structure of content entries", "A user authentication token", "A media file"], "B"),
  mcq(FS_A, 13, "TypeScript", "What is the main benefit of TypeScript over plain JavaScript?", ["Faster runtime execution", "Static type checking at compile time", "It runs natively in all browsers", "It replaces Node.js"], "B"),
  mcq(FS_A, 14, "TypeScript", "Which TypeScript type should you prefer over any when a value's type is not known and must be checked before use?", ["never", "void", "unknown", "object"], "C"),
  mcq(FS_A, 15, "TypeScript", "Which TypeScript utility type makes all properties of a type optional?", ["Required<T>", "Partial<T>", "Readonly<T>", "Pick<T, K>"], "B"),
  written(FS_A, 16, "JavaScript", "Explain the difference between localStorage, sessionStorage, and cookies. When would you use each?", [
    "localStorage: persists until cleared, about 5–10 MB, same origin, not sent to the server. Use for preferences such as theme.",
    "sessionStorage: per tab, cleared when the tab closes. Use for temporary state such as a multi-step form draft.",
    "Cookies: small (about 4 KB), sent with every request, can have expiry and HttpOnly/Secure/SameSite flags. Use for sessions/auth; mentions not storing sensitive tokens in localStorage.",
  ]),
  written(FS_A, 17, "JavaScript", "Explain the difference between == and === in JavaScript with examples.", [
    "== compares after type coercion; === compares value and type with no coercion.",
    "Correct examples, e.g. 0 == '0' is true but 0 === '0' is false; null == undefined is true, null === undefined is false.",
    "Recommends === by default to avoid surprising coercion bugs.",
  ]),
  written(FS_A, 18, "React", "How does React's virtual DOM work, and how does it help improve application performance?", [
    "React keeps a lightweight JavaScript representation of the UI and builds a new tree when state or props change.",
    "It diffs (reconciles) the new tree against the previous one to find the minimal changes.",
    "It batches and applies only those changes to the real DOM, which avoids expensive full re-renders and layout work.",
  ]),
  written(FS_A, 19, "React", "Explain the difference between controlled and uncontrolled components in React.", [
    "Controlled: the input value lives in React state and changes through onChange (value + setState).",
    "Uncontrolled: the DOM keeps the value; read it with a ref or FormData; defaultValue sets the initial value.",
    "When to use each: controlled for validation and dynamic UI; uncontrolled for simple forms or file inputs. Includes an example.",
  ]),
  written(FS_A, 20, "Next.js", "What is the difference between Server-Side Rendering (SSR) and Static Site Generation (SSG) in Next.js?", [
    "SSR renders HTML on every request (fresh, per-user data) at the cost of server work per request.",
    "SSG renders HTML at build time and serves it from a CDN (very fast, but data can be stale).",
    "Mentions revalidation/ISR or the App Router equivalents (dynamic vs static rendering, revalidate) and when to choose each.",
  ]),
  written(FS_A, 21, "Express", "How would you implement centralized error handling in an Express.js application?", [
    "An error-handling middleware with four arguments (err, req, res, next), registered after all routes.",
    "Routes call next(err) (or async errors are forwarded with a wrapper or Express 5), plus a custom error class with a status code.",
    "Sends a consistent JSON error response with the right status, logs the error, and hides stack traces in production; 404 handler for unknown routes.",
  ]),
  written(FS_A, 22, "Node.js", "Explain the Node.js event loop and how it handles asynchronous operations.", [
    "Node runs JavaScript on a single thread; I/O is handed to the OS or libuv thread pool so the thread is not blocked.",
    "When operations finish, callbacks are queued and the event loop runs them in phases (timers, poll/I/O, check, close).",
    "Microtasks (Promises, process.nextTick) run between callbacks; warns that CPU-heavy work blocks the loop.",
  ]),
  written(FS_A, 23, "Contentful", "How would you fetch and display blog content from Contentful in a React or Next.js application? Explain the process.", [
    "Create a content type (e.g. blogPost) and entries; get the space ID and a Delivery API token, stored in environment variables.",
    "Fetch with the contentful SDK (createClient + getEntries with content_type) or the GraphQL API, on the server where possible.",
    "Map fields to components; render rich text with @contentful/rich-text-react-renderer and images via asset URLs; handle loading/errors and revalidation.",
  ]),
  written(FS_A, 24, "TypeScript", "Explain the difference between interface and type in TypeScript. When would you use each?", [
    "Both describe object shapes; interfaces can be extended and declaration-merged.",
    "type aliases can also express unions, intersections, tuples, primitives and mapped/conditional types.",
    "Sensible guidance: interface for public object/class contracts, type for unions and composed types; consistency within a codebase.",
  ]),
  written(FS_A, 25, "TypeScript", "How would you type the request body, route params, and response of an Express.js route handler in TypeScript?", [
    "Uses Express generics: Request<Params, ResBody, ReqBody, Query> and Response<ResBody>.",
    "Defines interfaces for params, body and response, e.g. Request<{ id: string }, UserResponse, CreateUserBody>.",
    "Mentions that types do not validate at runtime, so validate the body (e.g. zod) as well.",
  ]),
  coding(FS_A, 26, "Next.js", "Frontend",
    "Frontend: turn a blog post title into a URL slug for a Next.js route such as /blog/[slug].\n\nWrite slugify(title) that:\n- converts to lowercase and trims surrounding spaces,\n- removes every character that is not a–z, 0–9, a space or a hyphen,\n- replaces each run of spaces and/or hyphens with a single hyphen,\n- removes hyphens from the start and end.\n\nExample: slugify(\"  Next.js 15: What's New?  \") → \"nextjs-15-whats-new\"",
    "slugify", "title",
    [shown(["Hello World"], "hello-world"), shown(["  Next.js 15: What's New?  "], "nextjs-15-whats-new"),
      secret(["React -- Hooks   Guide"], "react-hooks-guide"), secret(["  --Hello--  "], "hello"), secret([""], ""), secret(["Café au lait"], "caf-au-lait")]),
  coding(FS_A, 27, "Express", "Backend",
    "Backend: build the JSON body for a paginated API endpoint such as GET /api/products?page=2&pageSize=10.\n\nWrite paginate(items, page, pageSize) that returns:\n{ data, page, pageSize, total, totalPages, hasNext, hasPrev }\n\n- page is 1-based; if page is less than 1, use 1.\n- data is the slice of items for that page (an empty array if the page is past the end).\n- total is items.length and totalPages is Math.ceil(total / pageSize) (0 when there are no items).\n- hasNext is true if page < totalPages; hasPrev is true if page > 1.\n\nExample: paginate([1, 2, 3, 4, 5], 1, 2) → { data: [1, 2], page: 1, pageSize: 2, total: 5, totalPages: 3, hasNext: true, hasPrev: false }",
    "paginate", "items, page, pageSize",
    [shown([[1, 2, 3, 4, 5], 1, 2], { data: [1, 2], page: 1, pageSize: 2, total: 5, totalPages: 3, hasNext: true, hasPrev: false }),
      shown([[1, 2, 3, 4, 5], 3, 2], { data: [5], page: 3, pageSize: 2, total: 5, totalPages: 3, hasNext: false, hasPrev: true }),
      secret([[1, 2, 3], 0, 2], { data: [1, 2], page: 1, pageSize: 2, total: 3, totalPages: 2, hasNext: true, hasPrev: false }),
      secret([[], 1, 10], { data: [], page: 1, pageSize: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false }),
      secret([[1, 2, 3], 5, 2], { data: [], page: 5, pageSize: 2, total: 3, totalPages: 2, hasNext: false, hasPrev: true })]),
];

const FS_B = "FS-B";
const FULL_STACK_B: BankQuestion[] = [
  mcq(FS_B, 1, "HTML", "Which HTML attribute improves accessibility by providing alternative text for an image?", ["title", "alt", "src", "aria-hidden"], "B"),
  mcq(FS_B, 2, "CSS", "Which CSS property controls the stacking order of positioned elements?", ["display", "overflow", "z-index", "opacity"], "C"),
  mcq(FS_B, 3, "JavaScript", "What does the JavaScript spread operator (...) do when used with an array?", ["Deletes elements", "Expands iterable elements", "Sorts the array", "Converts array to string"], "B"),
  mcq(FS_B, 4, "JavaScript", "What is the output of Boolean('false')?", ["false", "true", "undefined", "null"], "B"),
  mcq(FS_B, 5, "React", "Which React hook is primarily used to store and update component state?", ["useEffect", "useMemo", "useState", "useCallback"], "C"),
  mcq(FS_B, 6, "React", "What is React.memo primarily used for?", ["Managing global state", "Avoiding unnecessary component re-renders when props are unchanged", "Fetching API data", "Creating routes"], "B"),
  mcq(FS_B, 7, "Next.js", "What is the purpose of dynamic routing in Next.js?", ["To create routes based on variable URL segments", "To create CSS dynamically", "To manage component state", "To create database schemas"], "A"),
  mcq(FS_B, 8, "Next.js", "What is the purpose of the Next.js Image component?", ["To edit images", "To provide image optimization features", "To upload images to a CMS", "To convert images to SVG"], "B"),
  mcq(FS_B, 9, "Express", "Which HTTP status code indicates that a resource was successfully created?", ["200", "201", "400", "500"], "B"),
  mcq(FS_B, 10, "Express", "Which Express.js feature helps parse incoming JSON request bodies?", ["express.json()", "express.static()", "express.router()", "express.listen()"], "A"),
  mcq(FS_B, 11, "Node.js", "What is the purpose of package.json in Node.js?", ["Store application configuration and dependencies", "Store database records", "Define HTML structure", "Manage browser cookies"], "A"),
  mcq(FS_B, 12, "Contentful", "What is a Contentful reference field used for?", ["Applying CSS styles", "Linking one content entry to another", "Creating API authentication", "Compressing media"], "B"),
  mcq(FS_B, 13, "TypeScript", "What does the TypeScript compiler (tsc) do?", ["Runs unit tests", "Compiles TypeScript into JavaScript", "Installs npm packages", "Starts a development server"], "B"),
  mcq(FS_B, 14, "TypeScript", "What is a generic in TypeScript?", ["A way to write reusable code that works with many types through type parameters", "A default export", "A CSS utility class", "A runtime type check"], "A"),
  mcq(FS_B, 15, "TypeScript", "Which tsconfig.json option enables a group of strict type-checking rules?", ["\"allowJs\"", "\"strict\"", "\"noEmit\"", "\"target\""], "B"),
  written(FS_B, 16, "CSS", "Explain the difference between position: relative, absolute, fixed, and sticky in CSS.", [
    "relative: stays in normal flow, offset from its own position; becomes the containing block for absolute children.",
    "absolute: removed from flow, positioned against the nearest positioned ancestor; fixed: positioned against the viewport and stays on scroll.",
    "sticky: behaves as relative until a scroll threshold (e.g. top: 0), then sticks within its parent. Good examples for each.",
  ]),
  written(FS_B, 17, "JavaScript", "What is event delegation in JavaScript? Explain with an example.", [
    "Attach one listener to a common parent instead of every child, relying on event bubbling.",
    "Use event.target (or closest()) to find which child was clicked.",
    "Example, e.g. a <ul> click handler handling all <li> items, including ones added later; benefits: fewer listeners, works for dynamic elements.",
  ]),
  written(FS_B, 18, "JavaScript", "Explain the difference between Promise.all() and Promise.allSettled().", [
    "Promise.all resolves with all values when every promise fulfils, and rejects immediately on the first rejection.",
    "Promise.allSettled always waits for all and resolves with { status, value | reason } for each.",
    "Use all when every result is required; allSettled when partial failures are acceptable (e.g. several independent API calls).",
  ]),
  written(FS_B, 19, "React", "How would you optimize a React application that contains a large number of components?", [
    "Avoid unnecessary re-renders: React.memo, useMemo/useCallback, keep state close to where it is used, stable keys.",
    "Code splitting and lazy loading (React.lazy/Suspense, dynamic import) and list virtualization for long lists.",
    "Measures first with React DevTools Profiler; mentions avoiding large context values and expensive work in render.",
  ]),
  written(FS_B, 20, "Next.js", "What are React Server Components, and how are they different from Client Components in Next.js?", [
    "Server Components render on the server, are the default in the App Router, can fetch data directly and send no JavaScript for themselves.",
    "Client Components use 'use client', run in the browser, and can use state, effects, event handlers and browser APIs.",
    "Composition rules: Server Components can render Client Components and pass serializable props; keep interactivity at the leaves.",
  ]),
  written(FS_B, 21, "Express", "Explain how you would implement JWT-based authentication in an Express.js application.", [
    "On login, verify credentials (hashed passwords with bcrypt), then sign a JWT with a secret and short expiry (jsonwebtoken).",
    "Send it in an HttpOnly cookie or Authorization: Bearer header; auth middleware verifies it and sets req.user, returning 401 if invalid.",
    "Security: secret in env vars, expiry/refresh tokens, HTTPS, role checks for authorization.",
  ]),
  written(FS_B, 22, "Node.js", "What is the difference between process.nextTick(), setImmediate(), and setTimeout() in Node.js?", [
    "process.nextTick runs right after the current operation, before Promise microtasks and before the event loop continues.",
    "setImmediate runs in the check phase, after I/O callbacks in the current loop iteration.",
    "setTimeout(fn, 0) runs in the timers phase after at least the delay; notes overusing nextTick can starve I/O.",
  ]),
  written(FS_B, 23, "Contentful", "How would you manage multiple environments (development, staging, production) when integrating Contentful into a web application?", [
    "Use Contentful environments (and aliases such as master) inside a space for dev/staging/prod content models.",
    "Different space/environment IDs and tokens per app environment in environment variables; Preview API for staging, Delivery API for production.",
    "Content-model changes via migration scripts, tested in a non-production environment, then promoted (alias switch).",
  ]),
  written(FS_B, 24, "TypeScript", "What are union types and type narrowing in TypeScript? Explain with an example.", [
    "A union (A | B) means a value can be one of several types.",
    "Narrowing uses checks such as typeof, instanceof, in, equality or a discriminant field so TypeScript knows the exact type in a branch.",
    "A correct example, e.g. function format(id: string | number) { if (typeof id === 'string') ... }.",
  ]),
  written(FS_B, 25, "TypeScript", "How would you type component props and fetched data (e.g. from getServerSideProps or a Server Component) in a Next.js TypeScript project?", [
    "Define interfaces for props and API data and use them in the component signature.",
    "Pages Router: GetServerSideProps<Props> / InferGetServerSidePropsType; App Router: type the async fetch function's return value and page params.",
    "Mentions runtime validation of external data (e.g. zod) because fetched JSON is not guaranteed to match the types.",
  ]),
  coding(FS_B, 26, "React", "Frontend",
    "Frontend: build a className string for a React component, like the popular classnames/clsx helpers.\n\nWrite classNames(...args) where each argument can be:\n- a string: included if it is not empty,\n- an object: each key is included if its value is truthy,\n- an array: handled the same way, recursively,\n- anything falsy (null, undefined, false, 0, \"\"): ignored.\n\nReturn the class names joined by a single space, in order.\n\nExample: classNames(\"btn\", { active: true, disabled: false }) → \"btn active\"",
    "classNames", "...args",
    [shown(["btn", "btn-primary"], "btn btn-primary"), shown(["btn", { active: true, disabled: false }], "btn active"),
      secret(["a", null, false, 0, "", ["b", { c: true, d: 0 }]], "a b c"), secret([], ""), secret([{ x: 1, y: "yes", z: null }, [[["deep"]]]], "x y deep")]),
  coding(FS_B, 27, "Node.js", "Backend",
    "Backend: implement the filtering and sorting used by an API endpoint such as GET /api/products?category=furniture&minPrice=20&sort=price_asc.\n\nWrite filterProducts(products, query). Each product is { name, price, category }. query may contain:\n- minPrice and/or maxPrice (inclusive),\n- category (match ignoring upper/lower case),\n- sort: \"price_asc\", \"price_desc\" or \"name\" (A–Z).\n\nKeep the original order when there is no sort. Return a new array and do not change the input.\n\nExample: filterProducts(products, { category: \"electronics\" }) → the Mouse and Keyboard products",
    "filterProducts", "products, query",
    [shown([PRODUCTS, { category: "electronics" }], [PRODUCTS[0], PRODUCTS[2]]),
      shown([PRODUCTS, { minPrice: 30, sort: "price_asc" }], [PRODUCTS[3], PRODUCTS[2], PRODUCTS[1]]),
      secret([PRODUCTS, { maxPrice: 40, sort: "name" }], [PRODUCTS[3], PRODUCTS[0]]),
      secret([PRODUCTS, {}], PRODUCTS),
      secret([PRODUCTS, { minPrice: 20, maxPrice: 100, category: "Furniture", sort: "price_desc" }], [PRODUCTS[3]]),
      secret([PRODUCTS, { sort: "price_desc" }], [PRODUCTS[1], PRODUCTS[2], PRODUCTS[3], PRODUCTS[0]])]),
];

const FE_A = "FE-A";
const FRONTEND_A: BankQuestion[] = [
  mcq(FE_A, 1, "HTML", "Which HTML attribute is used to open a link in a new browser tab?", ["target='_self'", "target='_blank'", "rel='new'", "open='new'"], "B"),
  mcq(FE_A, 2, "CSS", "Which CSS layout system is best suited for arranging items in one dimension?", ["Grid", "Flexbox", "Float", "Position"], "B"),
  mcq(FE_A, 3, "CSS", "What is the purpose of CSS media queries?", ["To add animations", "To apply styles based on device or viewport conditions", "To create HTML elements", "To load images"], "B"),
  mcq(FE_A, 4, "JavaScript", "What will Array.isArray([]) return?", ["false", "undefined", "true", "object"], "C"),
  mcq(FE_A, 5, "JavaScript", "What is the difference between map() and forEach()?", ["map returns a new array; forEach does not", "forEach returns a new array; map does not", "Both always return the same result", "Neither iterates over arrays"], "A"),
  mcq(FE_A, 6, "JavaScript", "What is a JavaScript closure?", ["A function bundled with access to its lexical scope", "A method to close browser windows", "A CSS property", "A type of Promise"], "A"),
  mcq(FE_A, 7, "React", "Which React hook can help avoid recalculating an expensive value on every render?", ["useEffect", "useMemo", "useState", "useContext"], "B"),
  mcq(FE_A, 8, "React", "What happens when a React component's state changes?", ["The browser reloads", "React schedules a re-render", "The component is deleted", "All application state is reset"], "B"),
  mcq(FE_A, 9, "React", "What is the purpose of React Context?", ["To share data across components without passing props through every level", "To create CSS styles", "To replace all API calls", "To render HTML on the server"], "A"),
  mcq(FE_A, 10, "React", "What is the purpose of the dangerouslySetInnerHTML prop in React?", ["To apply inline CSS", "To inject raw HTML into an element", "To create a React route", "To update component state"], "B"),
  mcq(FE_A, 11, "Contentful", "What does a Contentful content entry represent?", ["A specific piece of content based on a content type", "A CSS stylesheet", "An API endpoint", "A user account"], "A"),
  mcq(FE_A, 12, "Contentful", "Which Contentful feature allows editors to manage images and documents?", ["Content Types", "Assets", "Locales", "Webhooks"], "B"),
  mcq(FE_A, 13, "TypeScript", "Which file extension is used for React components written in TypeScript?", [".ts", ".tsx", ".jsx", ".rts"], "B"),
  mcq(FE_A, 14, "TypeScript", "In interface User { name: string; age?: number }, what does the ? after age mean?", ["age is required", "age is optional", "age can only be null", "age is private"], "B"),
  mcq(FE_A, 15, "TypeScript", "In const [items, setItems] = useState<string[]>([]), what is the type of items?", ["string", "string[]", "any", "never[]"], "B"),
  written(FE_A, 16, "HTML", "Explain the difference between semantic and non-semantic HTML elements. Give examples.", [
    "Semantic elements describe their meaning/role (header, nav, main, article, section, footer, button).",
    "Non-semantic elements carry no meaning (div, span) and are for grouping/styling.",
    "Benefits: accessibility (screen readers, landmarks), SEO and readability; correct examples of each.",
  ]),
  written(FE_A, 17, "CSS", "What is the difference between CSS Flexbox and CSS Grid? When would you use each?", [
    "Flexbox is one-dimensional (a row or a column) and content-driven.",
    "Grid is two-dimensional (rows and columns together) and layout-driven, with explicit tracks and areas.",
    "Use cases: Flexbox for navbars, button groups, aligning items; Grid for page layouts, card galleries, dashboards. They can be combined.",
  ]),
  written(FE_A, 18, "JavaScript", "Explain event bubbling and event capturing in JavaScript.", [
    "Event flow has three phases: capturing (window down to the target), target, and bubbling (target back up to window).",
    "addEventListener listens in the bubbling phase by default; { capture: true } listens during capturing.",
    "stopPropagation stops further travel; example of parent and child handlers firing order; links to event delegation.",
  ]),
  written(FE_A, 19, "JavaScript", "What is the difference between null, undefined, and an empty string in JavaScript?", [
    "undefined: a variable or property that has not been assigned a value (default).",
    "null: an intentional 'no value' set by the developer; typeof null is 'object' (historical quirk).",
    "'' is a real string of length 0; all three are falsy; null == undefined is true but === is false.",
  ]),
  written(FE_A, 20, "React", "Explain how React's reconciliation process works.", [
    "On state/props change React renders a new element tree and compares it with the previous one (diffing).",
    "Different element types replace the subtree; same type updates props; keys identify list items across renders.",
    "Only the computed differences are committed to the DOM (render phase vs commit phase).",
  ]),
  written(FE_A, 21, "React", "How would you implement pagination or infinite scrolling in a React application?", [
    "State for page/cursor, items, loading and hasMore; fetch with limit/skip or a cursor from the API.",
    "Pagination: page controls that refetch; infinite scroll: IntersectionObserver on a sentinel element (or a scroll listener) to load the next page.",
    "Handles loading, end of list, errors and duplicate requests; mentions virtualization or React Query/SWR for large lists.",
  ]),
  written(FE_A, 22, "Contentful", "Explain how you would integrate Contentful with React to display a list of blog articles.", [
    "Content type for blog posts; space ID and Delivery API token in environment variables.",
    "Create a client (contentful SDK) and getEntries({ content_type: 'blogPost', order: '-sys.createdAt' }) or use GraphQL.",
    "Map entries to a typed list component (title, slug, excerpt, image asset URL); handle loading/errors and link to detail pages.",
  ]),
  written(FE_A, 23, "Contentful", "How would you handle API loading states, empty responses, and errors when fetching Contentful data?", [
    "Track loading/error/data state (or use React Query/SWR / Suspense) and show a spinner or skeleton while loading.",
    "Show a friendly empty state when items is empty, and guard against missing optional fields.",
    "Catch errors (network, 401 token, rate limit 429) with try/catch, show an error message with retry, and log them.",
  ]),
  written(FE_A, 24, "TypeScript", "What is the difference between any and unknown in TypeScript? Why is unknown generally safer?", [
    "any turns off type checking; anything can be done with it and errors only show at runtime.",
    "unknown accepts any value but must be narrowed (typeof, instanceof, type guards) before use.",
    "unknown is safer because the compiler forces you to check the type; example such as parsing JSON or catch(error).",
  ]),
  written(FE_A, 25, "TypeScript", "How would you define TypeScript types for Contentful blog entries and use them in a React component?", [
    "Define an interface for the fields (title: string, slug: string, body: Document, image?: Asset ...) or use EntrySkeletonType / generated types (cf-content-types-generator).",
    "Use the type with client.getEntries<BlogSkeleton>() so returned entries are typed.",
    "Type the component props (e.g. { posts: BlogPost[] }) and access fields safely, handling optional fields.",
  ]),
  coding(FE_A, 26, "JavaScript", "JavaScript",
    "Write chunk(array, size) that splits an array into groups of the given size, for example to show products in rows of 3.\n\n- The last group may be smaller.\n- If size is less than 1, return an empty array.\n- Do not change the input array.\n\nExample: chunk([1, 2, 3, 4, 5], 2) → [[1, 2], [3, 4], [5]]",
    "chunk", "array, size",
    [shown([[1, 2, 3, 4, 5], 2], [[1, 2], [3, 4], [5]]), shown([[], 3], []),
      secret([[1, 2, 3], 5], [[1, 2, 3]]), secret([[1, 2, 3, 4], 0], []), secret([["a", "b", "c", "d"], 2], [["a", "b"], ["c", "d"]])]),
  coding(FE_A, 27, "React", "React",
    "Write a reducer cartReducer(state, action) for a shopping cart, as used with React's useReducer.\n\nstate is { items, total } where each item is { id, name, price, qty }.\nActions:\n- { type: \"add\", item: { id, name, price } } → if the id is already in the cart, increase its qty by 1; otherwise append it with qty 1.\n- { type: \"remove\", id } → remove that item.\n- { type: \"setQty\", id, qty } → set the quantity; if qty is 0 or less, remove the item.\n- { type: \"clear\" } → empty the cart.\n- any other type → return state unchanged.\n\nAfter every change, total must be the sum of price × qty, rounded to 2 decimal places. Do not mutate state; return a new object.",
    "cartReducer", "state, action",
    [shown([{ items: [], total: 0 }, { type: "add", item: { id: 1, name: "Pen", price: 10 } }], { items: [{ id: 1, name: "Pen", price: 10, qty: 1 }], total: 10 }),
      shown([{ items: [{ id: 1, name: "Pen", price: 10, qty: 1 }], total: 10 }, { type: "add", item: { id: 1, name: "Pen", price: 10 } }], { items: [{ id: 1, name: "Pen", price: 10, qty: 2 }], total: 20 }),
      secret([CART_PEN_BOOK, { type: "setQty", id: 2, qty: 3 }], { items: [{ id: 1, name: "Pen", price: 10, qty: 2 }, { id: 2, name: "Book", price: 12.5, qty: 3 }], total: 57.5 }),
      secret([CART_PEN_BOOK, { type: "remove", id: 1 }], { items: [{ id: 2, name: "Book", price: 12.5, qty: 1 }], total: 12.5 }),
      secret([CART_PEN_BOOK, { type: "setQty", id: 1, qty: 0 }], { items: [{ id: 2, name: "Book", price: 12.5, qty: 1 }], total: 12.5 }),
      secret([CART_PEN_BOOK, { type: "clear" }], { items: [], total: 0 }),
      secret([CART_PEN_BOOK, { type: "unknown" }], CART_PEN_BOOK)]),
];

const FE_B = "FE-B";
const FRONTEND_B: BankQuestion[] = [
  mcq(FE_B, 1, "HTML", "Which HTML element is used to associate a label with a form input?", ["<label>", "<span>", "<legend>", "<fieldset>"], "A"),
  mcq(FE_B, 2, "CSS", "Which CSS property is used to create space inside an element's border?", ["margin", "padding", "gap", "outline"], "B"),
  mcq(FE_B, 3, "CSS", "What is the default value of the CSS position property?", ["relative", "absolute", "static", "fixed"], "C"),
  mcq(FE_B, 4, "JavaScript", "What does the JavaScript find() method return?", ["All matching elements", "The first matching element or undefined", "A new sorted array", "The index of every matching element"], "B"),
  mcq(FE_B, 5, "JavaScript", "Which method converts a JSON string into a JavaScript object?", ["JSON.stringify()", "JSON.parse()", "Object.toString()", "JSON.convert()"], "B"),
  mcq(FE_B, 6, "JavaScript", "What is the purpose of optional chaining (?.) in JavaScript?", ["To prevent errors when accessing properties on null or undefined values", "To create optional functions", "To make variables constant", "To remove object properties"], "A"),
  mcq(FE_B, 7, "React", "What is the purpose of useCallback in React?", ["To memoize a function reference", "To fetch API data", "To update state directly", "To create context"], "A"),
  mcq(FE_B, 8, "React", "Which React pattern is commonly used to share reusable component logic?", ["Higher-Order Components", "HTML templates only", "CSS inheritance", "DOM manipulation"], "A"),
  mcq(FE_B, 9, "React", "Why should side effects generally not be performed directly during React rendering?", ["Rendering should remain pure and predictable", "React does not support functions", "Rendering happens only once", "It prevents JSX compilation"], "A"),
  mcq(FE_B, 10, "React", "What is the purpose of lazy loading components in React?", ["To load components only when needed", "To load all components immediately", "To prevent components from rendering", "To remove unused CSS"], "A"),
  mcq(FE_B, 11, "Contentful", "What is a Contentful environment?", ["A separate version of content and configuration within a space", "A React component", "A CSS layout", "A browser session"], "A"),
  mcq(FE_B, 12, "Contentful", "What is the main purpose of Contentful webhooks?", ["To notify external systems when specified content events occur", "To create image files", "To define React routes", "To style content entries"], "A"),
  mcq(FE_B, 13, "TypeScript", "What does the TypeScript utility type Readonly<T> do?", ["Makes all properties immutable at compile time", "Freezes the object at runtime", "Hides properties from the IDE", "Deletes all properties"], "A"),
  mcq(FE_B, 14, "TypeScript", "Which TypeScript keyword declares a set of named constants?", ["const", "enum", "type", "namespace"], "B"),
  mcq(FE_B, 15, "TypeScript", "How do you correctly type an onChange handler for a text input in React with TypeScript?", ["(e: React.ChangeEvent<HTMLInputElement>) => void", "(e: string) => void", "(e: MouseEvent) => void", "(e: any[]) => void"], "A"),
  written(FE_B, 16, "CSS", "Explain the difference between em, rem, %, vh, and vw CSS units.", [
    "em is relative to the element's (or parent's) font size and compounds when nested; rem is relative to the root <html> font size.",
    "% is relative to the parent's corresponding property (e.g. width of the containing block).",
    "vh/vw are 1% of the viewport height/width; sensible uses (rem for typography/spacing, vw/vh for full-screen sections).",
  ]),
  written(FE_B, 17, "CSS", "How would you make a webpage responsive across mobile, tablet, and desktop devices?", [
    "Viewport meta tag and a mobile-first approach with media queries at breakpoints.",
    "Fluid layouts with Flexbox/Grid, relative units (%, rem, vw), max-width and clamp() for type.",
    "Responsive images (srcset/sizes, max-width: 100%) and testing on devices or DevTools device mode.",
  ]),
  written(FE_B, 18, "JavaScript", "Explain the difference between synchronous and asynchronous JavaScript with examples.", [
    "Synchronous code runs line by line and blocks until each step finishes.",
    "Asynchronous code starts work (timers, fetch, file I/O) and continues; results are handled later via callbacks, Promises or async/await through the event loop.",
    "Correct examples, e.g. console.log order with setTimeout, or fetch with await.",
  ]),
  written(FE_B, 19, "JavaScript", "What is debouncing in JavaScript? Where would you use it in a search feature?", [
    "Debouncing delays running a function until a set time has passed without new calls (timer reset on each call).",
    "In search: call the API only after the user pauses typing (e.g. 300 ms), not on every keystroke.",
    "Benefits (fewer requests, less load, smoother UI); a simple implementation with setTimeout/clearTimeout or lodash.debounce; contrast with throttling.",
  ]),
  written(FE_B, 20, "React", "What is the difference between props and state in React? Give practical examples.", [
    "Props are inputs passed from parent to child and are read-only in the child.",
    "State is data owned and updated by the component itself (useState), and changing it re-renders the component.",
    "Practical examples, e.g. a Button receiving a label prop vs a Counter or form input keeping its value in state; lifting state up.",
  ]),
  written(FE_B, 21, "React", "How would you prevent unnecessary re-renders in a React application?", [
    "React.memo for pure components, useMemo for expensive values, useCallback for stable function props.",
    "Keep state local and split components/contexts so updates affect fewer components; stable keys; avoid new object/array literals as props.",
    "Profile with React DevTools before optimising.",
  ]),
  written(FE_B, 22, "Contentful", "Explain the difference between Contentful content types, entries, and assets.", [
    "Content type: the schema/model that defines fields (like a class or table definition).",
    "Entry: an actual piece of content created from a content type (like an instance or row).",
    "Asset: a media file (image, video, PDF) with metadata, referenced from entries; example such as a blogPost type, a post entry and its hero image asset.",
  ]),
  written(FE_B, 23, "Contentful", "Suppose an editor updates a blog article in Contentful, but the changes are not appearing on the website. How would you troubleshoot this issue?", [
    "Check the entry was actually published (not just saved as draft) and that the site uses the right space, environment and locale.",
    "Check caching: CDN, Next.js static generation / revalidate time, and whether a webhook triggers a rebuild or revalidation.",
    "Verify the API (Delivery vs Preview token) returns the new data directly, then check the query/fields mapping and logs.",
  ]),
  written(FE_B, 24, "TypeScript", "What are generics in TypeScript? Write a simple generic function and explain how it works.", [
    "Generics are type parameters that let code work with many types while keeping type safety.",
    "A correct function, e.g. function identity<T>(value: T): T { return value; } or function first<T>(items: T[]): T | undefined.",
    "Explains that T is inferred from the argument (or given explicitly) and that the return type follows it; may mention constraints (T extends ...).",
  ]),
  written(FE_B, 25, "TypeScript", "How would you type the props (including optional props and children) of a reusable React Button component in TypeScript?", [
    "An interface/type for props with optional fields using ?, e.g. variant?: 'primary' | 'secondary', disabled?: boolean, onClick?: () => void.",
    "Types children as React.ReactNode (or uses PropsWithChildren).",
    "Extends native button props (React.ButtonHTMLAttributes<HTMLButtonElement> or ComponentProps<'button'>) and sets defaults for optional props.",
  ]),
  coding(FE_B, 26, "JavaScript", "JavaScript",
    "Write countWords(text) that counts how often each word appears, for example to show tag or keyword frequency.\n\n- Ignore upper/lower case (use lowercase keys).\n- A word is a run of letters a–z and/or digits 0–9; everything else (spaces, punctuation) separates words.\n- Return an object mapping each word to its count. Empty text returns {}.\n\nExample: countWords(\"The cat and the hat.\") → { the: 2, cat: 1, and: 1, hat: 1 }",
    "countWords", "text",
    [shown(["The cat and the hat."], { the: 2, cat: 1, and: 1, hat: 1 }), shown([""], {}),
      secret(["Hello, hello! HELLO?"], { hello: 3 }), secret(["JS is fun; JS is fast"], { js: 2, is: 2, fun: 1, fast: 1 }),
      secret(["  42 apples and 42 oranges  "], { "42": 2, apples: 1, and: 1, oranges: 1 })]),
  coding(FE_B, 27, "React", "React",
    "In a React TodoList component, the visible list should be derived from props/state on each render instead of being stored in its own state.\n\nWrite getVisibleTodos(todos, filter, search) where each todo is { id, text, done }:\n- filter is \"all\", \"active\" (done is false) or \"completed\" (done is true),\n- search matches todos whose text contains it, ignoring upper/lower case; an empty or blank search matches everything,\n- keep the original order and return a new array without changing the input.\n\nExample: getVisibleTodos(todos, \"active\", \"\") → the todos that are not done",
    "getVisibleTodos", "todos, filter, search",
    [shown([TODOS, "active", ""], [TODOS[0], TODOS[3]]), shown([TODOS, "all", "buy"], [TODOS[0], TODOS[2]]),
      secret([TODOS, "completed", "BUY"], [TODOS[2]]), secret([TODOS, "completed", "   "], [TODOS[1], TODOS[2]]),
      secret([TODOS, "active", "report"], []), secret([[], "all", ""], [])]),
];

export const ASSESSMENT_SETS: AssessmentSet[] = [
  {
    code: FS_A,
    title: "Category 1: Full Stack + CMS — Set A",
    description: `Topics: HTML, CSS, JavaScript, TypeScript, React, Next.js, Express.js, Node.js, Contentful.\n\n${INSTRUCTIONS}`,
    durationMinutes: 60,
    questions: FULL_STACK_A,
  },
  {
    code: FS_B,
    title: "Category 1: Full Stack + CMS — Set B",
    description: `Topics: HTML, CSS, JavaScript, TypeScript, React, Next.js, Express.js, Node.js, Contentful.\n\n${INSTRUCTIONS}`,
    durationMinutes: 60,
    questions: FULL_STACK_B,
  },
  {
    code: FE_A,
    title: "Category 2: Frontend + CMS — Set A",
    description: `Topics: HTML, CSS, JavaScript, TypeScript, React, Contentful.\n\n${INSTRUCTIONS}`,
    durationMinutes: 60,
    questions: FRONTEND_A,
  },
  {
    code: FE_B,
    title: "Category 2: Frontend + CMS — Set B",
    description: `Topics: HTML, CSS, JavaScript, TypeScript, React, Contentful.\n\n${INSTRUCTIONS}`,
    durationMinutes: 60,
    questions: FRONTEND_B,
  },
];
