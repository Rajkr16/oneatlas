import Link from "next/link";
import { GlobalSearch } from "./GlobalSearch";

const NAV = [
  { href: "/models", text: "Models" },
  { href: "/rankings", text: "Rankings" },
  { href: "/labs", text: "Labs" },
  { href: "/providers", text: "Providers" },
  { href: "/compare", text: "Compare" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-5 px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          OneAtlas
        </Link>
        <nav className="hidden gap-5 text-sm text-muted md:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-ink">
              {n.text}
            </Link>
          ))}
        </nav>
        <div className="ml-auto w-full max-w-xs">
          <GlobalSearch />
        </div>
      </div>
      <nav className="flex gap-5 overflow-x-auto px-4 pb-2 text-sm text-muted md:hidden" aria-label="Main mobile">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="shrink-0 hover:text-ink">
            {n.text}
          </Link>
        ))}
      </nav>
    </header>
  );
}
