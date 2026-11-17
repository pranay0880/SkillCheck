import { QUESTION_BANK } from "../src/data/question-bank.ts";
import { SKILLS } from "../src/data/skills.ts";
import { ASSESSMENT_SETS } from "../src/data/assessment-sets.ts";

const REFERENCE_SOLUTIONS: Record<string, string> = {
  sumArray: "function sumArray(numbers) { return numbers.reduce((a, b) => a + b, 0); }",
  reverseString: "function reverseString(text) { return [...text].reverse().join(''); }",
  fizzBuzz:
    "function fizzBuzz(n) { const out = []; for (let i = 1; i <= n; i++) out.push(i % 15 === 0 ? 'FizzBuzz' : i % 3 === 0 ? 'Fizz' : i % 5 === 0 ? 'Buzz' : String(i)); return out; }",
  isPalindrome:
    "function isPalindrome(text) { const s = text.toLowerCase().replace(/[^a-z0-9]/g, ''); return s === [...s].reverse().join(''); }",
  groupBy:
    "function groupBy(items, key) { const out = {}; for (const item of items) { (out[item[key]] ??= []).push(item); } return out; }",
  flatten: "function flatten(list) { const out = []; for (const x of list) Array.isArray(x) ? out.push(...flatten(x)) : out.push(x); return out; }",
  uniqueById:
    "function uniqueById(items) { const seen = new Set(); return items.filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true))); }",
  todoReducer:
    "function todoReducer(state, action) { switch (action.type) { case 'add': return [...state, { id: action.id, text: action.text, done: false }]; case 'toggle': return state.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t)); case 'remove': return state.filter((t) => t.id !== action.id); default: return state; } }",
  parseCookies:
    "function parseCookies(header) { const out = {}; if (!header) return out; for (const part of header.split(';')) { const p = part.trim(); if (!p) continue; const i = p.indexOf('='); if (i === -1) continue; out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); } return out; }",
  matchRoute:
    "function matchRoute(pattern, path) { const a = pattern.split('/').filter(Boolean); const b = path.split('/').filter(Boolean); if (a.length !== b.length) return null; const params = {}; for (let i = 0; i < a.length; i++) { if (a[i].startsWith(':')) { if (!b[i]) return null; params[a[i].slice(1)] = b[i]; } else if (a[i] !== b[i]) return null; } return params; }",
  slugify:
    "function slugify(title) { return title.toLowerCase().trim().replace(/[^a-z0-9\\s-]/g, '').replace(/[\\s-]+/g, '-').replace(/^-+|-+$/g, ''); }",
  paginate:
    "function paginate(items, page, pageSize) { const p = Math.max(1, Math.floor(page)); const total = items.length; const totalPages = Math.ceil(total / pageSize); const start = (p - 1) * pageSize; return { data: items.slice(start, start + pageSize), page: p, pageSize, total, totalPages, hasNext: p < totalPages, hasPrev: p > 1 }; }",
  classNames:
    "function classNames(...args) { const out = []; const walk = (a) => { if (!a) return; if (typeof a === 'string') out.push(a); else if (Array.isArray(a)) a.forEach(walk); else if (typeof a === 'object') { for (const k of Object.keys(a)) if (a[k]) out.push(k); } }; args.forEach(walk); return out.join(' '); }",
  filterProducts:
    "function filterProducts(products, query) { let list = products.filter((p) => (query.minPrice === undefined || p.price >= query.minPrice) && (query.maxPrice === undefined || p.price <= query.maxPrice) && (!query.category || p.category.toLowerCase() === query.category.toLowerCase())); if (query.sort === 'price_asc') list = [...list].sort((a, b) => a.price - b.price); if (query.sort === 'price_desc') list = [...list].sort((a, b) => b.price - a.price); if (query.sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name)); return list; }",
  chunk:
    "function chunk(array, size) { if (size < 1) return []; const out = []; for (let i = 0; i < array.length; i += size) out.push(array.slice(i, i + size)); return out; }",
  cartReducer:
    "function cartReducer(state, action) { let items; switch (action.type) { case 'add': items = state.items.some((i) => i.id === action.item.id) ? state.items.map((i) => (i.id === action.item.id ? { ...i, qty: i.qty + 1 } : i)) : [...state.items, { ...action.item, qty: 1 }]; break; case 'remove': items = state.items.filter((i) => i.id !== action.id); break; case 'setQty': items = action.qty <= 0 ? state.items.filter((i) => i.id !== action.id) : state.items.map((i) => (i.id === action.id ? { ...i, qty: action.qty } : i)); break; case 'clear': items = []; break; default: return state; } const total = Math.round(items.reduce((s, i) => s + i.price * i.qty, 0) * 100) / 100; return { items, total }; }",
  countWords:
    "function countWords(text) { const out = {}; for (const w of text.toLowerCase().match(/[a-z0-9]+/g) ?? []) out[w] = (out[w] ?? 0) + 1; return out; }",
  getVisibleTodos:
    "function getVisibleTodos(todos, filter, search) { const q = search.trim().toLowerCase(); return todos.filter((t) => (filter === 'all' || (filter === 'active' ? !t.done : t.done)) && (!q || t.text.toLowerCase().includes(q))); }",
  toQueryString:
    "function toQueryString(params) { const parts = []; for (const [k, v] of Object.entries(params)) { if (v === null || v === undefined) continue; for (const item of Array.isArray(v) ? v : [v]) parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(item)); } return parts.join('&'); }",
};

function canonical(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`)
    .join(",")}}`;
}

const problems: string[] = [];
const titles = new Set<string>();
const perSkill = new Map<string, { fresher: number; junior: number; code: number }>();

for (const question of QUESTION_BANK) {
  if (titles.has(question.title)) problems.push(`Duplicate title: ${question.title}`);
  titles.add(question.title);
  if (!(SKILLS as readonly string[]).includes(question.skill)) problems.push(`Unknown skill on ${question.title}`);
  const counts = perSkill.get(question.skill) ?? { fresher: 0, junior: 0, code: 0 };
  if (question.type === "mcq") {
    counts[question.level] += 1;
    const ids = new Set(question.options.map((option) => option.id));
    if (question.correctOptionIds.length === 0 || !question.correctOptionIds.every((id) => ids.has(id))) {
      problems.push(`Bad answer key on ${question.title}`);
    }
  } else if (question.type === "code") {
    counts.code += 1;
    checkCode(question);
  }
  perSkill.set(question.skill, counts);
}

function checkCode(question: { title: string; functionName: string; testCases: { args: unknown[]; expected: unknown; hidden: boolean }[] }) {
  const source = REFERENCE_SOLUTIONS[question.functionName];
  if (!source) {
    problems.push(`No reference solution for ${question.functionName}`);
    return;
  }
  const fn = new Function(`${source}; return ${question.functionName};`)() as (...args: unknown[]) => unknown;
  question.testCases.forEach((testCase, index) => {
    const input = JSON.parse(JSON.stringify(testCase.args)) as unknown[];
    const before = JSON.stringify(input);
    const actual = fn(...input);
    if (canonical(actual) !== canonical(testCase.expected)) {
      problems.push(`${question.functionName} case ${index + 1}: expected ${canonical(testCase.expected)}, got ${canonical(actual)}`);
    }
    if (JSON.stringify(input) !== before) problems.push(`${question.functionName} case ${index + 1}: reference solution mutated its input`);
  });
  if (!question.testCases.some((testCase) => !testCase.hidden)) problems.push(`${question.title} has no visible case`);
  if (!question.testCases.some((testCase) => testCase.hidden)) problems.push(`${question.title} has no hidden case`);
}

for (const skill of SKILLS) {
  if (!perSkill.has(skill)) problems.push(`No questions for skill ${skill}`);
}

const setLines: string[] = [];
for (const set of ASSESSMENT_SETS) {
  const mcqs = set.questions.filter((question) => question.type === "mcq");
  const written = set.questions.filter((question) => question.type === "text");
  const codingQuestions = set.questions.filter((question) => question.type === "code");
  const marks = set.questions.reduce((sum, question) => sum + question.points, 0);
  if (mcqs.length !== 15) problems.push(`${set.code}: expected 15 MCQs, found ${mcqs.length}`);
  if (written.length !== 10) problems.push(`${set.code}: expected 10 written questions, found ${written.length}`);
  if (codingQuestions.length !== 2) problems.push(`${set.code}: expected 2 coding questions, found ${codingQuestions.length}`);
  if (marks !== 55) problems.push(`${set.code}: expected 55 marks, found ${marks}`);
  for (const question of set.questions) {
    if (titles.has(question.title)) problems.push(`Duplicate title: ${question.title}`);
    titles.add(question.title);
    if (!(SKILLS as readonly string[]).includes(question.skill)) problems.push(`Unknown skill on ${question.title}`);
    if (question.type === "mcq") {
      const ids = new Set(question.options.map((option) => option.id));
      if (question.options.length !== 4) problems.push(`${question.title}: expected 4 options`);
      if (question.correctOptionIds.length !== 1 || !ids.has(question.correctOptionIds[0])) {
        problems.push(`${question.title}: needs exactly one valid answer`);
      }
    } else if (question.type === "text" && !question.markingGuide.trim()) {
      problems.push(`${question.title}: missing marking guide`);
    } else if (question.type === "code") {
      checkCode(question);
    }
  }
  const key = mcqs
    .map((question, index) => `${index + 1}${question.type === "mcq" ? question.correctOptionIds[0].toUpperCase() : "?"}`)
    .join(" ");
  const codingLine = codingQuestions
    .map((question) => (question.type === "code" ? `${question.title.split("· ").pop()} ${question.functionName} (${question.testCases.length} cases)` : ""))
    .join(", ");
  setLines.push(
    `${set.code.padEnd(5)} ${set.title}\n      ${mcqs.length} MCQ + ${written.length} written + ${codingQuestions.length} coding = ${marks} marks\n      key: ${key}\n      coding: ${codingLine}`,
  );
}

const lines = [...perSkill.entries()].map(
  ([skill, c]) => `${skill.padEnd(26)} fresher MCQ ${c.fresher}  junior MCQ ${c.junior}  coding ${c.code}`,
);
process.stdout.write(
  `${lines.join("\n")}\n\nTotal bank questions: ${QUESTION_BANK.length}\n\nAssessment papers:\n${setLines.join("\n")}\n`,
);
if (problems.length > 0) {
  process.stderr.write(`\nProblems:\n- ${problems.join("\n- ")}\n`);
  process.exit(1);
}
process.stdout.write("All checks passed: unique titles, valid answer keys, every coding case passes its reference solution.\n");
