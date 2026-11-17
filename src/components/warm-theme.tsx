import { GeistSerif } from "geist/font/serif";

export const serif = GeistSerif.className;

export const WARM = {
  cream: "#f5efe4",
  paper: "#fbf8f2",
  ink: "#3a2e28",
  muted: "#75665b",
  terracotta: "#d4704a",
  terracottaDeep: "#a84a2a",
  mustard: "#e2a83d",
  teal: "#4f9a94",
  tealDeep: "#2f6f6a",
  navy: "#2f4858",
  sage: "#8fae8b",
  wood: "#a8663c",
};

export type Book = { h: number; w: number; color: string; band?: string; label?: string; tilt?: number };

export const HOME_SHELF: Book[] = [
  { h: 118, w: 26, color: WARM.terracotta, band: WARM.mustard },
  { h: 132, w: 30, color: WARM.navy, label: "JavaScript" },
  { h: 104, w: 22, color: WARM.mustard },
  { h: 126, w: 28, color: WARM.teal, band: WARM.cream },
  { h: 112, w: 24, color: WARM.terracotta },
  { h: 96, w: 20, color: WARM.sage, tilt: -8 },
  { h: 0, w: 14, color: "transparent" },
  { h: 128, w: 30, color: WARM.mustard, band: WARM.terracotta, label: "React" },
  { h: 120, w: 24, color: WARM.navy },
  { h: 136, w: 32, color: WARM.terracotta, band: WARM.cream },
  { h: 108, w: 22, color: WARM.teal },
  { h: 124, w: 26, color: WARM.mustard },
  { h: 116, w: 28, color: WARM.sage, band: WARM.navy, label: "SQL" },
  { h: 0, w: 14, color: "transparent" },
  { h: 130, w: 28, color: WARM.teal, band: WARM.mustard },
  { h: 110, w: 24, color: WARM.terracotta },
  { h: 122, w: 30, color: WARM.navy, band: WARM.mustard, label: "Next.js" },
  { h: 100, w: 22, color: WARM.mustard, tilt: 7 },
];

export function Bookshelf({ books = HOME_SHELF, maxWidth = 640, labels = true }: { books?: Book[]; maxWidth?: number; labels?: boolean }) {
  return (
    <div className="relative mx-auto w-full" style={{ maxWidth }} aria-hidden="true">
      <div className={`flex items-end justify-center gap-[3px] overflow-x-clip px-2 sm:gap-1 ${labels ? "pt-12" : "pt-2"}`}>
        {books.map((book, index) => {
          if (book.h === 0) return <span key={index} style={{ width: book.w }} className="shrink-0" />;
          return (
            <span
              key={index}
              className="relative shrink-0 rounded-t-[3px]"
              style={{
                height: book.h,
                width: book.w,
                background: book.color,
                transform: book.tilt ? `rotate(${book.tilt}deg)` : undefined,
                transformOrigin: "bottom center",
                boxShadow: "inset -4px 0 0 rgba(0,0,0,0.12), inset 3px 0 0 rgba(255,255,255,0.12)",
              }}
            >
              {book.band && (
                <>
                  <span className="absolute inset-x-0 top-[14%] h-[6px]" style={{ background: book.band, opacity: 0.85 }} />
                  <span className="absolute inset-x-0 bottom-[16%] h-[4px]" style={{ background: book.band, opacity: 0.85 }} />
                </>
              )}
              {labels && book.label && (
                <span
                  className="absolute bottom-full left-1/2 mb-3 hidden -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[13px] shadow-sm sm:block"
                  style={{ background: WARM.paper, color: WARM.ink, border: "1px solid #e6dccd" }}
                >
                  {book.label}
                </span>
              )}
            </span>
          );
        })}
      </div>
      <div className="relative h-3 rounded-sm" style={{ background: WARM.wood, boxShadow: "0 10px 18px -8px rgba(58,46,40,0.45)" }} />
      <div
        className="mx-auto h-6 w-[96%] rounded-b-[40%] opacity-30"
        style={{ background: "radial-gradient(ellipse at top, rgba(58,46,40,0.35), transparent 70%)" }}
      />
    </div>
  );
}
