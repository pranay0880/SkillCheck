"use client";

export function PrintButton({ fileName }: { fileName: string }) {
  const onPrint = () => {
    const previous = document.title;
    document.title = fileName;
    window.addEventListener("afterprint", () => (document.title = previous), { once: true });
    window.print();
  };

  return (
    <button type="button" className="btn btn-primary" onClick={onPrint}>
      Download PDF
    </button>
  );
}
