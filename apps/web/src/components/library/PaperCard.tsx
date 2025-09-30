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

export default function PaperCard({
  title,
  subtitle,
  abstract,
  tags,
  href,
  accent = "violet",
}: Props) {
  return (
    <a href={href} className="block">
      <article className="card text-center py-8 px-4 w-40 transition-shadow hover:shadow-lg" style={{minHeight: '215px', width: '160px'}}>
        <div className="h-16 mb-4 flex items-center justify-center">
          {/* Placeholder icon; replace with SVG under /public/icons if desired */}
          <span className="text-5xl">📖</span>
        </div>

        <h3 className="heading text-sm mb-3 break-words">{title}</h3>

        <p className="copy text-xs break-words line-clamp-3">{abstract}</p>

        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1 justify-center">
            {tags.slice(0, 2).map((t) => (
              <TagBadge key={t}>{t}</TagBadge>
            ))}
          </div>
        )}
      </article>
    </a>
  );
}
