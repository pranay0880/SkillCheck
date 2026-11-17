"use client";

import { useActionState } from "react";
import { login } from "../actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, null);
  return (
    <form action={formAction} noValidate>
      {state?.message && (
        <p role="alert" className="alert alert-error">
          {state.message}
        </p>
      )}
      <div className="field">
        <label className="label" htmlFor="password">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required autoFocus />
      </div>
      <button className="btn btn-primary w-full" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
