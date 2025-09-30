// data/papers.ts
export type Paper = {
  id: string;
  title: string;
  subtitle?: string;
  abstract: string;
  topic: "Question Intelligence" | "Leadership" | "Education" | "Curiosity" | "Empathy" | "Clarity";
  tags: string[];
  date: string;        // ISO string
  popularity?: number; // simple metric for sorting
  href: string;        // URL to PDF or article route
};

export const PAPERS: Paper[] = [
  {
    id: "qi-5-dimensions",
    title: "The 5 Dimensions of Question Intelligence",
    subtitle: "A practical framework for sharper thinking",
    abstract:
      "Define, measure, and train Question Intelligence with clarity, depth, curiosity, relevance, and empathy.",
    topic: "Question Intelligence",
    tags: ["Framework", "Roga Originals"],
    date: "2025-01-05",
    popularity: 98,
    href: "/docs/roga-5-dimensions.pdf"
  },
  {
    id: "why-questions-beat-answers",
    title: "Why Better Questions Beat Better Answers",
    abstract:
      "A research-backed look at how questions drive insight, alignment, and better decisions.",
    topic: "Leadership",
    tags: ["Research", "Decision-making"],
    date: "2025-01-20",
    popularity: 91,
    href: "/docs/why-questions.pdf"
  },
];
