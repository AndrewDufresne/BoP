import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

const styles: Record<Variant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-hover disabled:bg-muted disabled:text-ink-tertiary",
  secondary:
    "bg-white text-ink-primary border border-border-strong hover:bg-subtle disabled:text-ink-tertiary",
  ghost:
    "bg-transparent text-ink-secondary hover:bg-subtle disabled:text-ink-tertiary",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({
  variant = "secondary",
  className = "",
  children,
  ...rest
}: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 h-9 px-4 rounded text-sm font-medium transition-colors focus-ring disabled:cursor-not-allowed";
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
