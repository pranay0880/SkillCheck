# SkillCheck

Internal assessment platform for testing developers with **multiple-choice** and **JavaScript coding** questions.

- **Stack:** Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS v4 · MongoDB
- **Hosting:** Vercel + MongoDB Atlas (free tiers are enough)

## Features

| Area | What it does |
| --- | --- |
| Written answers | Descriptive questions answered in a text box (autosaved). They are marked by the admin on the result page, next to an admin-only marking guide. Blank written answers score 0 automatically; the results list shows how many still need marking. |
| Assessment papers | Four ready-made 55-mark papers (Category 1: Full Stack + CMS, Sets A/B; Category 2: Frontend + CMS, Sets A/B), each 15 one-mark MCQs + 10 three-mark written questions + 2 five-mark JavaScript coding questions (Category 1: one frontend, one backend; Category 2: one JavaScript, one React), in paper order. Defined in `src/data/assessment-sets.ts`; load with `npm run seed:assessments`. |
| Question bank | Multiple-choice (single or multi-answer), written and coding questions, each tagged with one **skill** and a level (Fresher / Junior). The Questions page groups questions by skill. Includes a 125-question bank covering 19 skills (Admin → Questions → *Import question bank*, or `npm run seed:questions`). |
| Coding questions | Developer writes a JavaScript function in a Monaco editor. Visible test cases can be run while answering; hidden test cases are used for grading only. |
| Tests | Pick questions and set a time limit. Integrity settings per test: **question order** (fixed, shuffle within sections, or shuffle all; decided per person when they first open the test), **shuffle MCQ options** per person (stable across reloads), and **require fullscreen**. |
| Integrity | Fullscreen is enforced while answering (questions are hidden outside fullscreen; each exit is logged; skipped and flagged on devices without fullscreen). **One device at a time**: the open test sends a heartbeat every 20 s; opening it in another browser or tab is blocked and logged, and the server rejects answers from the blocked copy (released after about 50 s without a heartbeat). Results show tab switches, fullscreen exits and blocked second-device attempts. The start screen lists recommendations, guidelines and warnings that the employee must acknowledge. |
| Users | Employee directory (Admin → Users). Required fields: name, employee ID, role, employee email and at least one skill. Employee ID and email must be unique (case-insensitive). Filter by role or skill; each user shows their test history. |
| Test links | Each test can have several links, each with an audience: **all employees**, **role(s)**, or **selected employees**. Opening a link asks for employee email + employee ID, then a **6-digit code emailed via Resend** (10 minutes, 5 tries, rate-limited). After verifying, the attempt is locked to that browser with a signed httpOnly cookie, so a forwarded test URL cannot be used by someone else. *Email this link* sends the invite to everyone in the audience who has not submitted. Links can be turned off or deleted. |
| Taking a test | Server-enforced timer, autosave, auto-submit at time-out, tab-switch tracking. |
| Grading | Multiple-choice is scored on submit (all-or-nothing). Code is auto-graded against all test cases when the admin opens the result. The admin can override any mark and add a private note. |

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open http://localhost:3000/admin and sign in with `ADMIN_PASSWORD`.

### Environment variables

| Name | Required | Notes |
| --- | --- | --- |
| `MONGODB_URI` | yes | Atlas connection string, e.g. `mongodb+srv://user:pass@cluster0.xxxx.mongodb.net/` |
| `MONGODB_DB` | no | Database name. Default `skilltest`. |
| `ADMIN_PASSWORD` | yes | Password for `/admin`. |
| `SESSION_SECRET` | yes | Long random string (32+ chars) used to sign the admin cookie. `openssl rand -hex 32` |
| `RESEND_API_KEY` | yes (for email) | Resend API key with sending access. Without it, codes cannot be emailed; in local development the code is shown on screen instead. |
| `EMAIL_FROM` | yes (for email) | Sender, e.g. `SkillCheck <noreply@pranaydasari.in>`. The domain must be verified in Resend. |
| `APP_URL` | no | Public base URL used in invite emails, e.g. `https://skillcheck.pranaydasari.in`. Defaults to the request host. |
| `APP_TIMEZONE` | no | Time zone for displayed dates. Default `Asia/Kolkata`. |
| `MONGODB_DNS_SERVERS` | no | **Local only.** Set to `8.8.8.8,1.1.1.1` if you get `querySrv ECONNREFUSED` (some Windows networks give Node an unusable DNS server). Not needed on Vercel. |

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel: **Add New → Project → Import** the repo. Framework is detected as Next.js.
3. Add the environment variables above under **Settings → Environment Variables** (Production and Preview).
4. In MongoDB Atlas: **Network Access → Add IP Address → Allow access from anywhere (`0.0.0.0/0`)**, because Vercel functions do not have fixed IPs.
5. Deploy. Visit `https://<your-app>.vercel.app/admin`.

## Data model (database `skilltest`)

| Collection | Contents |
| --- | --- |
| `questions` | Question bank. MCQ answer keys and hidden test cases live only here. |
| `tests` | Title, instructions, time limit, ordered question ids, shuffle flag. |
| `users` | Employee directory: name, employee ID, role, email, skills. Unique indexes on employee ID and email are created automatically. |
| `otps` | Hashed one-time codes (deleted after use; expired codes are removed automatically by a TTL index). |
| `members` | One document per attempt (linked to a user by `userId`, with a copy of their name, employee ID, role and skills): invite token, status (`invited` → `in_progress` → `submitted`), question order, answers, scores, tab switches, timestamps. |

## How it works (design notes)

- **Admin auth:** single password compared in constant time; session is an HMAC-signed, `httpOnly`, `SameSite=Strict` cookie valid for 12 hours. `src/proxy.ts` does a fast redirect for missing cookies; every admin page and Server Action re-verifies with `requireAdmin()`.
- **Nothing secret reaches the developer:** the test page receives only question text, options and *visible* test cases (`toPublicQuestion`). Answer keys and hidden cases never leave the server during a test.
- **Timer is server-side:** the deadline is `startedAt + duration`. Saves after the deadline (plus a 30 s grace) are rejected, and an expired attempt is finalized the next time it is loaded.
- **Code sandbox:** code runs in a Web Worker created from a `data:` URL, which gives it an opaque origin, so it cannot call the app with anyone's cookies. `fetch`, `XMLHttpRequest`, `WebSocket`, `importScripts` and nested workers are also removed. Each case has a 2 s timeout; infinite loops are killed by terminating the worker.
- **Why code is graded in the admin's browser:** running untrusted code on the server would risk exposing secrets such as the database URL. Grading in the admin's browser sandbox keeps hidden test cases away from the developer. The server recomputes the score from the pass/fail list, so the client cannot send an inflated score.
- **Next.js 16 specifics:** Cache Components is on, so every request-time read (cookies, DB, `Date.now()`) sits inside `<Suspense>` and calls `connection()` first. Middleware is now `src/proxy.ts`.

## Skills and the question bank

- The skill list lives in `src/data/skills.ts`. It is used for question categories and as suggestions for user skills.
- The bank lives in `src/data/question-bank.ts`: 3 fresher + 3 junior multiple-choice questions per skill, plus JavaScript coding questions for JavaScript, React, Node.js, Express and REST APIs. Python, SQL and MongoDB are multiple-choice only, because the code sandbox runs JavaScript.
- `npm run check:questions` validates the bank: unique titles, valid answer keys, and every coding test case passes a reference solution.
- `npm run seed:questions` inserts any bank questions that are missing from the `questions` collection (matched by title). It never overwrites or deletes existing questions, so it is safe to run again.

## Writing coding questions

- The developer must define a function with the configured **function name**.
- **Arguments** are a JSON array of the values passed in: `[[1, 2, 3]]` means one array argument, `["a", 2]` means two arguments.
- **Expected** is any JSON value. Objects are compared by value with key order ignored.
- Use *Check your test cases with a reference solution* in the editor to confirm every case passes before saving.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run check:questions` | Validate the question bank |
| `npm run seed:questions` | Load missing bank questions into MongoDB (uses `.env.local`) |
| `npm run seed:assessments` | Load the four assessment papers as tests. Adds missing questions; for existing tests it only appends missing questions (never removes or reorders) |
