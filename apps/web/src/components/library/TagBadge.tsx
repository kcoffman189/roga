// components/library/TagBadge.tsx
export default function TagBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-fog text-coal/80 text-xs font-semibold px-3 py-1">
      {children}
    </span>
  );
}
