import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Admin login" };

export default function LoginPage() {
  return (
    <AuthShell
      sideTitle="The admin desk"
      sideText="Build tests, share links with your team and review results, all in one place."
      sidePoints={["Questions grouped by skill", "Links for everyone, a role or chosen people", "Scores, written answers and integrity in one view"]}
      title="Welcome back"
      subtitle="Sign in to the SkillCheck admin area."
      footer={
        <>
          Taking a test? Open the link from your email instead.{" "}
          <Link href="/" className="font-medium" style={{ color: "#a84a2a" }}>
            Back to home
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
