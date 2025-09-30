// app/library/page.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PAPERS, type Paper } from "@/data/papers";
import LibraryFilters from "@/components/library/LibraryFilters";
import PaperCard from "@/components/library/PaperCard";
import BrandMark from "@/components/ui/BrandMark";

export default function LibraryPage() {
  const [topic, setTopic] = useState<string>("");
  const [sort, setSort] = useState<"date" | "popularity">("date");
  const [q, setQ] = useState<string>("");

  const filtered = useMemo(() => {
    let list: Paper[] = [...PAPERS];

    if (topic) list = list.filter((p) => p.topic === topic);
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(needle) ||
          p.abstract.toLowerCase().includes(needle) ||
          p.tags.join(" ").toLowerCase().includes(needle)
      );
    }
    list.sort((a, b) =>
      sort === "date"
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : (b.popularity ?? 0) - (a.popularity ?? 0)
    );
    return list;
  }, [topic, sort, q]);

  return (
    <main className="min-h-screen bg-fog text-coal">
      {/* Page header */}
      <section className="bg-teal">
        <div className="max-w-6xl mx-auto px-6 py-10 text-white">
          <div className="flex items-center gap-3">
            <BrandMark size={32} />
            <h1 className="font-bold text-xl">Roga QI Library</h1>
          </div>
          <p className="mt-3 max-w-2xl text-white/90">
            Explore Roga Originals — our growing collection of insights on Question Intelligence.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="max-w-6xl mx-auto px-6 -mt-6">
        <LibraryFilters
          papers={PAPERS}
          topic={topic}
          setTopic={setTopic}
          sort={sort}
          setSort={setSort}
          q={q}
          setQ={setQ}
        />
      </section>

      {/* Grid */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        {filtered.length === 0 ? (
          <p className="text-coal/70">No papers match your filters yet.</p>
        ) : (
          <div className="flex flex-row flex-wrap justify-center items-stretch" style={{gap: '20px'}}>
            {filtered.map((p, i) => (
              <PaperCard
                key={p.id}
                title={p.title}
                subtitle={p.subtitle}
                abstract={p.abstract}
                tags={[p.topic, ...p.tags]}
                href={p.href}
                accent={(["violet", "teal", "coral"] as const)[i % 3]}
              />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-fog border-t border-black/5">
        <div className="max-w-6xl mx-auto px-6 py-8 text-sm text-coal/70 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>Roga trains Question Intelligence — the art of asking better questions.</p>
          <nav className="flex gap-4">
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/terms" className="hover:underline">Terms</Link>
            <Link href="/" className="hover:underline">Home</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
