import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "verified" | "unverified" | "rejected" | "muted";
  className?: string;
}

const variantClasses = {
  default: "bg-zinc-800 text-zinc-200",
  verified: "bg-emerald-900/50 text-emerald-300 border border-emerald-700/50",
  unverified: "bg-amber-900/50 text-amber-300 border border-amber-700/50",
  rejected: "bg-red-900/50 text-red-300 border border-red-700/50",
  muted: "bg-zinc-800/50 text-zinc-400",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
