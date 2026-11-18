import type { BankMcq, BankQuestion, BankText } from "./question-bank";
import type { Skill } from "./skills";

const MCQ_MARKS = 1;
const WRITTEN_MARKS = 3;

type Answer = "A" | "B" | "C" | "D";

function mcq(role: string, n: number, skill: Skill, prompt: string, options: string[], answer: Answer): BankMcq {
  return {
    type: "mcq",
    skill,
    level: "fresher",
    title: `${role} basics · Q${n}`,
    prompt,
    points: MCQ_MARKS,
    options: options.map((text, index) => ({ id: String.fromCharCode(97 + index), text })),
    correctOptionIds: [answer.toLowerCase()],
  };
}

function written(role: string, n: number, skill: Skill, prompt: string, guide: string[]): BankText {
  return {
    type: "text",
    skill,
    level: "fresher",
    title: `${role} basics · Q${n}`,
    prompt,
    points: WRITTEN_MARKS,
    markingGuide: `Suggested marking (${WRITTEN_MARKS} marks):\n${guide.map((line) => `• ${line}`).join("\n")}`,
  };
}

const FE = "Frontend Developer";
const BE = "Backend Developer";
const FS = "Full Stack Developer";
const QA = "QA Engineer";
const UX = "UI/UX Designer";
const OPS = "DevOps Engineer";
const AI = "AI/ML Engineer";
const BA = "Business Analyst";

const FRONTEND: BankQuestion[] = [
  mcq(FE, 1, "HTML", "Which HTML element is the best choice for a site's main navigation links?", ["<div class=\"nav\">", "<section>", "<nav>", "<menu>"], "C"),
  mcq(FE, 2, "CSS", "In the CSS box model, which property adds space inside an element's border?", ["padding", "margin", "outline", "gap"], "A"),
  mcq(FE, 3, "JavaScript", "What does [1, 2, 3].map((n) => n * 2) return?", ["6", "[1, 2, 3]", "undefined", "[2, 4, 6]"], "D"),
  mcq(
    FE,
    4,
    "React",
    "What happens when you update a React component's state with its setter function?",
    ["The whole page reloads", "The component re-renders with the new state", "Nothing changes until the page is refreshed", "The state is reset to its initial value"],
    "B",
  ),
  written(FE, 5, "Accessibility", "Name three things you do to make a web form accessible, and explain why each one helps.", [
    "Every input has a visible <label> linked to it (for/id), so screen readers announce what the field is.",
    "Errors are clear text near the field and announced (aria-describedby or aria-live), not shown by colour alone.",
    "The form works with the keyboard alone, in a logical order, with a visible focus outline.",
    "Award 1 mark per well-explained point (max 3). Other valid points: required fields marked in text, autocomplete attributes.",
  ]),
];

const BACKEND: BankQuestion[] = [
  mcq(BE, 1, "REST APIs", "Which HTTP status code means a new resource was created?", ["200 OK", "204 No Content", "302 Found", "201 Created"], "D"),
  mcq(BE, 2, "Node.js", "Which JavaScript engine does Node.js use?", ["V8", "SpiderMonkey", "JavaScriptCore", "Chakra"], "A"),
  mcq(BE, 3, "SQL", "Which SQL clause filters rows before they are grouped?", ["HAVING", "WHERE", "ORDER BY", "LIMIT"], "B"),
  mcq(BE, 4, "MongoDB", "In MongoDB, what is a single record in a collection called?", ["A row", "A table", "A document", "A tuple"], "C"),
  written(BE, 5, "Express", "What is middleware in Express? Give two examples of what middleware is used for.", [
    "A function that runs between the request and the route handler, receiving (req, res, next).",
    "It can change req/res, end the response, or call next() to pass control on.",
    "Two valid examples, e.g. parsing JSON bodies (express.json), authentication checks, logging, CORS, error handling.",
  ]),
];

const FULL_STACK: BankQuestion[] = [
  mcq(
    FS,
    1,
    "Next.js",
    "In the Next.js App Router, what kind of component is a component by default?",
    ["A Client Component", "A Server Component", "A Web Component", "A static HTML file"],
    "B",
  ),
  mcq(
    FS,
    2,
    "REST APIs",
    "Which HTTP method is normally used to replace a whole existing resource?",
    ["POST", "GET", "PUT", "OPTIONS"],
    "C",
  ),
  mcq(
    FS,
    3,
    "JavaScript",
    "What does the await keyword do inside an async function?",
    [
      "Pauses that function until the promise settles, then gives its value",
      "Blocks the whole browser until the promise settles",
      "Converts a promise into a callback",
      "Runs the promise in a new thread",
    ],
    "A",
  ),
  mcq(FS, 4, "Git", "Which command creates a new branch and switches to it?", ["git branch -d feature", "git merge feature", "git push feature", "git switch -c feature"], "D"),
  written(
    FS,
    5,
    "REST APIs",
    "A user submits a login form and then sees their dashboard. Describe what happens between the browser, the server and the database.",
    [
      "Browser sends the credentials to the server over HTTPS (e.g. a POST request); the server validates the input.",
      "Server looks up the user in the database and checks the password against a stored hash, never plain text.",
      "On success the server creates a session or token (e.g. an httpOnly cookie), and the browser is sent to the dashboard, which loads the user's data using that session.",
    ],
  ),
];

const QA_ENGINEER: BankQuestion[] = [
  mcq(
    QA,
    1,
    "Functional testing",
    "What is regression testing?",
    [
      "Testing only brand-new features",
      "Re-testing after changes to make sure existing features still work",
      "Testing how the system behaves under heavy load",
      "Testing done by end users before release",
    ],
    "B",
  ),
  mcq(
    QA,
    2,
    "System testing",
    "Which testing level checks the complete, integrated application against its requirements?",
    ["Unit testing", "Integration testing", "Component testing", "System testing"],
    "D",
  ),
  mcq(
    QA,
    3,
    "API Testing",
    "An API call returns status 500. What does that usually mean?",
    ["The server hit an error while handling the request", "The request was not authorised", "The resource was not found", "The request body was invalid"],
    "A",
  ),
  mcq(QA, 4, "Automation", "Which tool is commonly used to automate tests of a website in a real browser?", ["JMeter", "Jira", "Selenium", "Postman"], "C"),
  written(QA, 5, "Functional testing", "Write a bug report for this issue: the Login button does nothing when the password field is empty.", [
    "A clear title and the steps to reproduce (open login page, enter email, leave password empty, click Login).",
    "Expected result (a message such as 'Password is required') versus actual result (nothing happens).",
    "Environment (browser, device, build or URL), severity or priority, and evidence such as a screenshot or console error.",
  ]),
];

const UI_UX: BankQuestion[] = [
  mcq(
    UX,
    1,
    "Wireframing",
    "What is the main purpose of a wireframe?",
    [
      "To show the final colours and images",
      "To plan the layout and structure of a screen without visual detail",
      "To write the production code",
      "To test the site's loading speed",
    ],
    "B",
  ),
  mcq(
    UX,
    2,
    "Accessibility",
    "What is the minimum WCAG AA contrast ratio for normal-size body text?",
    ["3:1", "2:1", "4.5:1", "7:1"],
    "C",
  ),
  mcq(
    UX,
    3,
    "Usability testing",
    "During a usability test, what should the facilitator mostly do?",
    [
      "Explain how to use each feature before the user tries it",
      "Fix problems in the design as soon as they appear",
      "Answer every question the user asks straight away",
      "Watch and ask the user to think aloud, without leading them",
    ],
    "D",
  ),
  mcq(
    UX,
    4,
    "Design Systems",
    "What is a design system?",
    [
      "A shared set of reusable components, styles and guidelines",
      "A single page template",
      "A tool for exporting images",
      "A list of brand colours only",
    ],
    "A",
  ),
  written(UX, 5, "UX", "Explain the difference between UI and UX, with an example from an app you know.", [
    "UI is the look and interactive surface: layout, colours, type, buttons and components.",
    "UX is the whole experience of reaching a goal: ease, flow, clarity and how the user feels.",
    "A concrete example showing they differ, e.g. a beautiful checkout (good UI) with too many steps (poor UX).",
  ]),
];

const DEVOPS: BankQuestion[] = [
  mcq(
    OPS,
    1,
    "Docker",
    "What is a Docker image?",
    ["A running container", "A virtual machine", "A read-only template used to create containers", "A backup of a database"],
    "C",
  ),
  mcq(
    OPS,
    2,
    "CI/CD",
    "What does continuous integration (CI) mean?",
    [
      "Deploying to production once a month",
      "Merging code often into a shared branch, with automatic builds and tests",
      "Writing all the tests after the release",
      "Keeping every developer on a separate long-lived branch",
    ],
    "B",
  ),
  mcq(OPS, 3, "Linux", "Which Linux command prints the current working directory?", ["pwd", "ls", "cd", "whoami"], "A"),
  mcq(OPS, 4, "Kubernetes", "What is the smallest deployable unit in Kubernetes?", ["A node", "A service", "A namespace", "A pod"], "D"),
  written(OPS, 5, "Monitoring", "A production API suddenly becomes slow. Describe how you would investigate it.", [
    "Check monitoring and metrics first: response times, error rates, CPU, memory, and when it started.",
    "Look at logs and recent changes, such as a new deployment or config change, and roll back if it lines up.",
    "Check dependencies (database, external services, network), scale or mitigate, and keep the team informed.",
  ]),
];

const AI_ML: BankQuestion[] = [
  mcq(
    AI,
    1,
    "Machine Learning",
    "Which of these is a supervised learning task?",
    [
      "Grouping customers into clusters without labels",
      "Reducing the number of features in a dataset",
      "Predicting house prices from labelled past sales",
      "Finding unusual transactions with no labelled examples",
    ],
    "C",
  ),
  mcq(
    AI,
    2,
    "Machine Learning",
    "What does overfitting mean?",
    [
      "The model does well on training data but poorly on new data",
      "The model is too simple to learn the data",
      "The training data is too large",
      "The model trains too slowly",
    ],
    "A",
  ),
  mcq(AI, 3, "Python", "Which Python library is mainly used to work with tables of data (DataFrames)?", ["Flask", "pandas", "Requests", "pytest"], "B"),
  mcq(AI, 4, "Statistics", "What is the median of the numbers 3, 7, 9, 1, 5?", ["7", "25", "3", "5"], "D"),
  written(AI, 5, "LLMs", "What is a 'hallucination' in a large language model, and how would you reduce it in an application?", [
    "A hallucination is a confident answer that is false or made up.",
    "Ground answers in trusted data (for example retrieval of relevant documents) and ask the model to cite or stay within that data.",
    "Add checks: clear instructions, structured outputs, evaluation sets or human review for important answers.",
  ]),
];

const BUSINESS_ANALYST: BankQuestion[] = [
  mcq(
    BA,
    1,
    "User Stories",
    "Which is the standard format for a user story?",
    [
      "The system shall do X",
      "As a <type of user>, I want <goal> so that <benefit>",
      "Given X, when Y, then Z",
      "Feature: X, Owner: Y, Date: Z",
    ],
    "B",
  ),
  mcq(
    BA,
    2,
    "Requirements Gathering",
    "Which of these is a non-functional requirement?",
    ["Users can reset their password", "Admins can export a report", "Pages load within 2 seconds", "Users can add items to a cart"],
    "C",
  ),
  mcq(BA, 3, "Agile", "In Scrum, who owns and prioritises the product backlog?", ["The Product Owner", "The Scrum Master", "The development team", "The project sponsor"], "A"),
  mcq(
    BA,
    4,
    "Process Modelling",
    "What is BPMN mainly used for?",
    ["Writing database queries", "Tracking project budgets", "Designing user interfaces", "Drawing business processes as standard diagrams"],
    "D",
  ),
  written(BA, 5, "Stakeholder Management", "Two stakeholders ask for requirements that conflict with each other. How would you handle it?", [
    "Understand each stakeholder's underlying need and the business goal behind it, not just the request.",
    "Bring them together with the facts: impact, cost, priority and trade-offs, and look for an option that serves the goal.",
    "Get a decision from the right owner (e.g. Product Owner or sponsor), document it, and communicate it to everyone affected.",
  ]),
];

export const ROLE_BASICS: BankQuestion[] = [
  ...FRONTEND,
  ...BACKEND,
  ...FULL_STACK,
  ...QA_ENGINEER,
  ...UI_UX,
  ...DEVOPS,
  ...AI_ML,
  ...BUSINESS_ANALYST,
];
