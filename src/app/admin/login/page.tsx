import type { Metadata } from "next";
import { Brand } from "@/components/Brand";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Admin login" };

export default function LoginPage() {
  return (
    <main id="main" className="mx-auto max-w-md px-4 py-16">
      <div className="card p-6">
        <p className="mb-5">
          <Brand />
        </p>
        <h1 className="mb-1 text-xl">Admin login</h1>
        <p className="mb-5 text-muted">Enter the admin password to manage tests and results.</p>
        <LoginForm />
      </div>
    </main>
  );
}
