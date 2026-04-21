import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "TantricPlants",
  description: "Plant care tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900 font-sans antialiased">
        <header className="border-b border-stone-200 bg-white px-6 py-4 flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold text-green-700 tracking-tight">
            🌱 TantricPlants
          </Link>
          <nav className="flex gap-4 text-sm text-stone-700">
            <Link href="/" className="hover:text-stone-900 transition-colors">Plants</Link>
            <Link href="/care" className="hover:text-stone-900 transition-colors">Care</Link>
            <Link href="/reminders" className="hover:text-stone-900 transition-colors">Reminders</Link>
            <Link href="/settings" className="hover:text-stone-900 transition-colors">Settings</Link>
          </nav>
          <div className="ml-auto">
            <Link
              href="/plants/new"
              className="bg-green-700 text-white text-sm px-3 py-1.5 rounded-md hover:bg-green-800 transition-colors"
            >
              + Add plant
            </Link>
          </div>
        </header>
        <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
