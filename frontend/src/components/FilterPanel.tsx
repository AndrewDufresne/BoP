import { Button } from "./Button";
import { MultiSelect } from "./MultiSelect";
import type { FilterOptions, FilterPayload } from "../api/client";

interface Props {
  options: FilterOptions | undefined;
  filters: FilterPayload;
  setFilters: (next: FilterPayload) => void;
  onApply: () => void;
  onDownload: () => void;
  applying?: boolean;
  downloading?: boolean;
}

const EMPTY: FilterPayload = { countries: [], statuses: [], purposes: [] };

export function FilterPanel({
  options,
  filters,
  setFilters,
  onApply,
  onDownload,
  applying,
  downloading,
}: Props) {
  const update = (patch: Partial<FilterPayload>) =>
    setFilters({ ...filters, ...patch });

  return (
    <section className="rounded border border-border bg-white p-5 shadow-sm">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MultiSelect
          label="Country"
          options={options?.countries ?? []}
          value={filters.countries}
          onChange={(countries) => update({ countries })}
          searchPlaceholder="Search country…"
        />
        <MultiSelect
          label="Model Status"
          options={options?.statuses ?? []}
          value={filters.statuses}
          onChange={(statuses) => update({ statuses })}
          searchPlaceholder="Search status…"
        />
        <MultiSelect
          label="Model Use Case Purpose"
          options={options?.purposes ?? []}
          value={filters.purposes}
          onChange={(purposes) => update({ purposes })}
          searchPlaceholder="Search purpose…"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
        <Button variant="ghost" onClick={() => setFilters(EMPTY)}>
          Reset
        </Button>
        <Button variant="secondary" onClick={onApply} disabled={applying}>
          {applying ? "Applying…" : "Apply Filters"}
        </Button>
        <Button variant="primary" onClick={onDownload} disabled={downloading}>
          {downloading ? "Preparing…" : "Download Excel"}
        </Button>
      </div>
    </section>
  );
}
