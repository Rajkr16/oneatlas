import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { CompareProvider } from "@/components/CompareProvider";

const font = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument" });

export const metadata: Metadata = {
  title: { default: "OneAtlas: AI model discovery", template: "%s · OneAtlas" },
  description: "Discover, compare and rank AI models across labs and providers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={font.variable}>
      <body className="font-sans antialiased">
        <CompareProvider>
          <Header />
          <main className="mx-auto max-w-7xl px-4 py-8 pb-24">{children}</main>
          <footer className="border-t border-line py-6 text-center text-xs text-muted">
            Model and provider data from the OpenRouter public API. Benchmarks are sample data.
          </footer>
        </CompareProvider>
      </body>
    </html>
  );
}
