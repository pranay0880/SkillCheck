"use client";

import { useActionState, useState } from "react";
import { requestJoinCode, verifyJoinCode, type JoinState } from "../actions";

export function JoinForm({ code }: { code: string }) {
  const [restart, setRestart] = useState(0);
  return <JoinFlow key={restart} code={code} onRestart={() => setRestart((value) => value + 1)} />;
}

function JoinFlow({ code, onRestart }: { code: string; onRestart: () => void }) {
  const [state, formAction, pending] = useActionState(async (previous: JoinState | null, formData: FormData) => {
    const intent = formData.get("intent");
    if (intent === "verify") return verifyJoinCode(code, previous, formData);
    return requestJoinCode(code, previous, formData);
  }, null);

  const step = state?.step ?? "details";

  return (
    <form action={formAction} noValidate>
      {state?.message && !state.ok && (
        <p role="alert" className="alert alert-error">
          {state.message}
        </p>
      )}

      {step === "details" ? (
        <>
          <div className="field">
            <label className="label" htmlFor="join-email">
              Employee email
            </label>
            <input
              id="join-email"
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={state?.email ?? ""}
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="join-employee-id">
              Employee ID
            </label>
            <input
              id="join-employee-id"
              name="employeeId"
              type="text"
              autoComplete="off"
              className="font-mono"
              defaultValue={state?.employeeId ?? ""}
              required
            />
          </div>
          <button className="btn btn-primary w-full" type="submit" name="intent" value="request" disabled={pending}>
            {pending ? "Checking…" : "Send me a code"}
          </button>
        </>
      ) : (
        <>
          <input type="hidden" name="email" value={state?.email ?? ""} />
          <input type="hidden" name="employeeId" value={state?.employeeId ?? ""} />
          <p className="mb-4" role="status">
            We sent a 6-digit code to <strong>{state?.maskedEmail}</strong>. It expires in 10 minutes.
          </p>
          {state?.devCode && (
            <p className="alert alert-warning">
              Development only: email is not configured, so here is the code: <strong className="font-mono">{state.devCode}</strong>
            </p>
          )}
          <div className="field">
            <label className="label" htmlFor="join-otp">
              Verification code
            </label>
            <input
              id="join-otp"
              name="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              className="font-mono text-xl tracking-[0.4em]"
              required
              autoFocus
            />
          </div>
          <button className="btn btn-primary mb-3 w-full" type="submit" name="intent" value="verify" disabled={pending}>
            {pending ? "Verifying…" : "Verify and continue"}
          </button>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <button type="submit" name="intent" value="request" className="cursor-pointer text-primary underline" disabled={pending}>
              Send a new code
            </button>
            <button type="button" className="cursor-pointer text-muted underline" onClick={onRestart}>
              Use a different email or ID
            </button>
          </div>
        </>
      )}
    </form>
  );
}
