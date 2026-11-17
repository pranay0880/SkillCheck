import Link from "next/link";
import { Brand } from "@/components/Brand";

export default function HomePage() {
  return (
    <main id="main" className="mx-auto max-w-xl px-4 py-12">
      <div className="card">
        <p className="mb-4">
          <Brand />
        </p>
        <h1 className="mb-2">Internal developer assessments</h1>
        <p className="mb-5 text-muted">
          If you were invited to take a test, open the personal link you received. Admins can manage questions, tests and
          results from the admin area.
        </p>
        <Link className="btn btn-primary" href="/admin">
          Go to admin
        </Link>
      </div>
    </main>
  );
}
