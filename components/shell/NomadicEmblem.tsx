import { cn } from "@/lib/utils";

export function NomadicEmblem({
  className,
  size = 28,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--nomadic-navy)]",
        className
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span
        className="rounded-full bg-[var(--nomadic-orange)]"
        style={{ width: size * 0.36, height: size * 0.36 }}
      />
    </span>
  );
}
