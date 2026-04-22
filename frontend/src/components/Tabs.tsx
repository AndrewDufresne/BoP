interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface Props {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: Props) {
  return (
    <div role="tablist" className="flex border-b border-border">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`group relative flex items-center gap-2 px-4 py-3 text-sm transition-colors focus-ring ${
              isActive
                ? "text-ink-primary font-medium"
                : "text-ink-secondary hover:text-ink-primary"
            }`}
          >
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span className="rounded bg-subtle px-1.5 py-0.5 text-[11px] text-ink-tertiary">
                {tab.count}
              </span>
            )}
            <span
              className={`absolute inset-x-3 -bottom-px h-0.5 ${
                isActive ? "bg-brand" : "bg-transparent"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
