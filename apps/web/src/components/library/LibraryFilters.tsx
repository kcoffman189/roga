// components/library/LibraryFilters.tsx
"use client";

import { useMemo } from "react";
import type { Paper } from "@/data/papers";

type Props = {
  papers: Paper[];
  topic: string;
  setTopic: (v: string) => void;
  sort: "date" | "popularity";
  setSort: (v: "date" | "popularity") => void;
  q: string;
  setQ: (v: string) => void;
};

export default function LibraryFilters({ papers, topic, setTopic, sort, setSort, q, setQ }: Props) {
  const topics = useMemo(
    () => Array.from(new Set(papers.map((p) => p.topic))).sort(),
    [papers]
  );

  return (
    <div className="bg-white rounded-2xl shadow-card p-4 md:p-5 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
      <div className="flex gap-3">
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="rounded-xl border border-black/10 bg-fog px-3 py-2"
        >
          <option value="">All Topics</option>
          {topics.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "date" | "popularity")}
          className="rounded-xl border border-black/10 bg-fog px-3 py-2"
        >
          <option value="date">Newest</option>
          <option value="popularity">Popular</option>
        </select>
      </div>

      <div className="flex-1 md:max-w-sm">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search Roga Originals…"
          className="w-full rounded-xl border border-black/10 bg-fog px-3 py-2"
        />
      </div>
    </div>
  );
}
