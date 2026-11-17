import type { TestCase } from "./types";

export interface RunCaseResult {
  passed: boolean;
  hidden: boolean;
  actual?: string;
  error?: string;
}

export interface RunOutcome {
  results: RunCaseResult[];
  logs: string[];
  fatalError?: string;
}

const CASE_TIMEOUT_MS = 2000;
const MAX_LOG_LINES = 50;

const WORKER_SOURCE = `
"use strict";
const blocked = ["fetch", "XMLHttpRequest", "WebSocket", "EventSource", "importScripts", "indexedDB", "caches", "Worker"];
for (const key of blocked) {
  try { Object.defineProperty(self, key, { value: undefined, configurable: false, writable: false }); } catch (e) {}
}
function canonical(value) {
  if (value === undefined) return "undefined";
  if (typeof value === "number" && Number.isNaN(value)) return "NaN";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  return "{" + Object.keys(value).sort().map(function (k) { return JSON.stringify(k) + ":" + canonical(value[k]); }).join(",") + "}";
}
function show(value) {
  try { return canonical(value); } catch (e) { return String(value); }
}
self.onmessage = function (event) {
  const data = event.data;
  const logs = [];
  const fakeConsole = {};
  ["log", "info", "warn", "error", "debug"].forEach(function (level) {
    fakeConsole[level] = function () {
      if (logs.length < ${MAX_LOG_LINES}) logs.push(Array.prototype.map.call(arguments, show).join(" "));
    };
  });
  let fn;
  try {
    fn = new Function("console", data.code + "\\n;return typeof " + data.functionName + " === 'function' ? " + data.functionName + " : undefined;")(fakeConsole);
  } catch (e) {
    self.postMessage({ kind: "fatal", error: "Code failed to load: " + (e && e.message ? e.message : String(e)), logs: logs });
    return;
  }
  if (typeof fn !== "function") {
    self.postMessage({ kind: "fatal", error: "Function '" + data.functionName + "' was not found. Keep the given function name.", logs: logs });
    return;
  }
  data.cases.forEach(function (testCase, index) {
    let result;
    try {
      const args = JSON.parse(JSON.stringify(testCase.args));
      const actual = fn.apply(null, args);
      const passed = canonical(actual) === canonical(testCase.expected);
      result = { passed: passed, hidden: testCase.hidden, actual: testCase.hidden ? undefined : show(actual) };
    } catch (e) {
      result = { passed: false, hidden: testCase.hidden, error: e && e.message ? e.message : String(e) };
    }
    self.postMessage({ kind: "case", index: index, result: result, logs: logs.slice() });
  });
  self.postMessage({ kind: "done", logs: logs });
};
`;

const WORKER_URL = `data:text/javascript;charset=utf-8,${encodeURIComponent(WORKER_SOURCE)}`;

type WorkerMessage =
  | { kind: "fatal"; error: string; logs: string[] }
  | { kind: "case"; index: number; result: RunCaseResult; logs: string[] }
  | { kind: "done"; logs: string[] };

export function runCode(code: string, functionName: string, cases: TestCase[]): Promise<RunOutcome> {
  return new Promise((resolve) => {
    const results: RunCaseResult[] = [];
    let logs: string[] = [];
    let worker: Worker;
    try {
      worker = new Worker(WORKER_URL);
    } catch {
      resolve({ results: [], logs: [], fatalError: "This browser blocked the code sandbox. Try Chrome, Edge or Firefox." });
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;

    const finish = (fatalError?: string) => {
      if (timer) clearTimeout(timer);
      worker.terminate();
      const filled = cases.map(
        (testCase, index) =>
          results[index] ?? {
            passed: false,
            hidden: testCase.hidden,
            error: fatalError ? "Not run" : "Timed out (possible infinite loop)",
          },
      );
      resolve({ results: filled, logs, fatalError });
    };

    const armTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => finish(), CASE_TIMEOUT_MS);
    };

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const message = event.data;
      logs = message.logs;
      if (message.kind === "fatal") {
        finish(message.error);
      } else if (message.kind === "case") {
        results[message.index] = message.result;
        armTimer();
      } else {
        finish();
      }
    };
    worker.onerror = (event) => {
      event.preventDefault();
      finish(event.message || "The code crashed while running.");
    };

    armTimer();
    worker.postMessage({ code, functionName, cases });
  });
}

export function scoreFromResults(results: RunCaseResult[], points: number): number {
  if (results.length === 0) return 0;
  const passed = results.filter((result) => result.passed).length;
  return Math.round((passed / results.length) * points * 100) / 100;
}
