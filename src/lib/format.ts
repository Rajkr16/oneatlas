const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

export const fmtPrice = (n: number) => (n === 0 ? "Free" : usd.format(n));

export const fmtContext = (n: number | null | undefined) => {
  if (!n) return "–";
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return String(n);
};

export const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

export const label = (s: string) =>
  s.replace(/[-_]/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export const modelHref = (slug: string) => `/models/${slug}`;
