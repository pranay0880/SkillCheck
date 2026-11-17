import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { Loading, PageHead } from "@/components/ui";
import { UserForm } from "../UserForm";

export const metadata: Metadata = { title: "Add user" };

export default function NewUserPage() {
  return (
    <>
      <PageHead title="Add user" subtitle="Add an employee so you can invite them to tests." />
      <Suspense fallback={<Loading />}>
        <Guarded />
      </Suspense>
    </>
  );
}

async function Guarded() {
  await requireAdmin();
  return <UserForm />;
}
