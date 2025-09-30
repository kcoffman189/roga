// components/library/PaperCard.tsx
import TagBadge from "./TagBadge";

type Props = {
  title: string;
  subtitle?: string;
  abstract: string;
  tags: string[];
  href: string;
  accent?: "teal" | "violet" | "coral";
};

const accentMap = {
  teal: "bg-teal/10 text-teal",
  violet: "bg-violet/10 text-violet",
  coral: "bg-coral/10 text-coral",
};

export default function PaperCard({
  title,
  subtitle,
  abstract,
  tags,
  href,
  accent = "violet",
}: Props) {
  return (
    <article className="card transition-shadow hover:shadow-lg">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${accentMap[accent]} mb-4`}>
        {/* Placeholder icon; replace with SVG under /public/icons if desired */}
        <span className="text-xl">📖</span>
      </div>

      <h3 className="font-display font-bold text-lg text-coal">{title}</h3>
      {subtitle && <p className="text-coal/70 text-sm mt-1">{subtitle}</p>}

      <p className="text-coal/80 text-sm mt-3 line-clamp-3">{abstract}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map((t) => (
          <TagBadge key={t}>{t}</TagBadge>
        ))}
      </div>

      <div className="mt-5">
        <a
          href={href}
          className="inline-flex items-center gap-2 rounded-2xl bg-teal text-white px-4 py-2 font-semibold hover:bg-violet transition-colors"
        >
          Read Now
          <span>→</span>
        </a>
      </div>
    </article>
  );
}
