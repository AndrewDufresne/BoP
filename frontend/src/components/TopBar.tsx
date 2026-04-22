export function TopBar() {
  return (
    <header className="h-14 border-b border-border bg-white">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="inline-block h-6 w-6 bg-brand"
            style={{ clipPath: "polygon(50% 0,100% 50%,50% 100%,0 50%)" }}
          />
          <h1 className="text-[15px] font-semibold tracking-tight text-ink-primary">
            Model Inventory &amp; EUC Portal
          </h1>
        </div>
        <span className="rounded border border-border bg-subtle px-2 py-0.5 text-xs font-medium text-ink-secondary">
          DEV
        </span>
      </div>
    </header>
  );
}
