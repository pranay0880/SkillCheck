"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendAttemptCode, verifyAttemptCode, type AttemptCodeState } from "../actions";

export function VerifyPanel({ token }: { token: string }) {
  const router = useRouter();
  const [sendState, setSendState] = useState<AttemptCodeState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const send = () =>
    startTransition(async () => {
      setError(null);
      const result = await sendAttemptCode(token);
      setSendState(result);
      if (!result.ok) setError(result.message ?? "Could not send the code.");
    });

  const verify = (formData: FormData) =>
    startTransition(async () => {
      setError(null);
      const result = await verifyAttemptCode(token, formData);
      if (!result.ok) {
        setError(result.message ?? "Could not verify the code.");
        return;
      }
      router.refresh();
    });

  if (!sendState?.sent) {
    return (
      <>
        {error && (
          <p role="alert" className="alert alert-error">
            {error}
          </p>
        )}
        <button type="button" className="btn btn-primary w-full" onClick={send} disabled={pending}>
          {pending ? "Sending…" : "Email me a code"}
        </button>
      </>
    );
  }

  return (
    <form action={verify} noValidate>
      {sendState.ok && sendState.message && (
        <p role="status" className="mb-4">
          {sendState.message} It expires in 10 minutes.
        </p>
      )}
      {sendState.devCode && (
        <p className="alert alert-warning">
          Development only: email is not configured, so here is the code: <strong className="font-mono">{sendState.devCode}</strong>
        </p>
      )}
      {error && (
        <p role="alert" className="alert alert-error">
          {error}
        </p>
      )}
      <div className="field">
        <label className="label" htmlFor="verify-otp">
          Verification code
        </label>
        <input
          id="verify-otp"
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
      <button className="btn btn-primary mb-3 w-full" type="submit" disabled={pending}>
        {pending ? "Verifying…" : "Verify and continue"}
      </button>
      <button type="button" className="cursor-pointer text-sm text-primary underline" onClick={send} disabled={pending}>
        Send a new code
      </button>
    </form>
  );
}
