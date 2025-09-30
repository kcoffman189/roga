// components/library/TagBadge.tsx
export default function TagBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-fog text-coal/60 text-[10px] font-medium px-2 py-0.5">
      {children}
    </span>
  );
}
