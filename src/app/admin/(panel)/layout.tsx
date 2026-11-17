import { AdminSidebar } from "./AdminSidebar";

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[232px_minmax(0,1fr)]">
      <AdminSidebar />
      <main id="main" className="min-w-0 px-4 pb-12 pt-6 md:px-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
