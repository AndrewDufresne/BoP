import { useEffect, useMemo, useRef, useState } from "react";

interface Props {
  label: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  searchPlaceholder?: string;
}

export function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "All",
  disabled,
  searchPlaceholder = "Search…",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open) {
      // focus the search input shortly after the dropdown opens
      const id = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.toLowerCase().includes(q));
  }, [options, query]);

  const toggle = (opt: string) => {
    onChange(
      value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]
    );
  };

  const summary =
    value.length === 0
      ? placeholder
      : value.length <= 2
        ? value.join(", ")
        : `${value.length} selected`;

  return (
    <div className="flex flex-col gap-1.5" ref={ref}>
      <label className="text-[13px] font-medium text-ink-secondary">{label}</label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className={`focus-ring w-full h-9 px-3 pr-8 rounded border border-border bg-white text-left text-sm transition-colors hover:border-border-strong disabled:bg-subtle disabled:text-ink-tertiary ${
            value.length === 0 ? "text-ink-tertiary" : "text-ink-primary"
          }`}
        >
          <span className="block truncate">{summary}</span>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary">
            ▾
          </span>
        </button>
        {open && (
          <div className="absolute z-20 mt-1 w-full rounded border border-border bg-white shadow-md">
            <div className="border-b border-border p-2">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="focus-ring w-full h-8 rounded border border-border bg-white px-2 text-sm text-ink-primary placeholder:text-ink-tertiary"
              />
              {value.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="mt-2 text-[12px] text-ink-secondary hover:text-brand"
                >
                  Clear selection ({value.length})
                </button>
              )}
            </div>
            <div className="max-h-56 overflow-auto py-1">
              {filtered.length === 0 ? (
                <div className="px-3 py-2 text-sm text-ink-tertiary">
                  No matches
                </div>
              ) : (
                filtered.map((opt) => {
                  const checked = value.includes(opt);
                  return (
                    <label
                      key={opt}
                      className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-ink-primary hover:bg-subtle"
                    >
                      <input
                        type="checkbox"
                        className="accent-brand"
                        checked={checked}
                        onChange={() => toggle(opt)}
                      />
                      <span className="truncate">{opt}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
