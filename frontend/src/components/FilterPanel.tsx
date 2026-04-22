import { useMemo } from "react";
import { Button } from "./Button";
import { MultiSelect } from "./MultiSelect";
import type { FilterOptions, FilterPayload } from "../api/client";

interface Props {
  options: FilterOptions | undefined;
  filters: FilterPayload;
  setFilters: (next: FilterPayload) => void;
  dqmId: string;
  setDqmId: (next: string) => void;
  onApply: () => void;
  onDownload: () => void;
  applying?: boolean;
  downloading?: boolean;
}

export function FilterPanel({
  options,
  filters,
  setFilters,
  dqmId,
  setDqmId,
  onApply,
  onDownload,
  applying,
  downloading,
}: Props) {
  // Country list shown is intersection-friendly: when no region is selected we
  // show all; otherwise we keep the full backend list (Region/Country mapping
  // lives in the database, not the UI).
  const countryOptions = useMemo(() => options?.countries ?? [], [options]);

  const update = (patch: Partial<FilterPayload>) =>
    setFilters({ ...filters, ...patch });

  return (
    <section className="rounded border border-border bg-white p-5 shadow-sm">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MultiSelect
          label="Region"
          options={options?.regions ?? []}
          value={filters.regions}
          onChange={(regions) => update({ regions })}
        />
        <MultiSelect
          label="Country"
          options={countryOptions}
          value={filters.countries}
          onChange={(countries) => update({ countries })}
        />
        <MultiSelect
          label="Model Status"
          options={options?.statuses ?? []}
          value={filters.statuses}
          onChange={(statuses) => update({ statuses })}
        />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="dqm-id"
            className="text-[13px] font-medium text-ink-secondary"
          >
            DQM ID
          </label>
          <input
            id="dqm-id"
            type="text"
            value={dqmId}
            onChange={(e) => setDqmId(e.target.value)}
            placeholder="e.g. DQM-000182"
            className="focus-ring h-9 rounded border border-border bg-white px-3 text-sm text-ink-primary placeholder:text-ink-tertiary hover:border-border-strong"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
        <Button
          variant="ghost"
          onClick={() =>
            setFilters({ regions: [], countries: [], statuses: [] })
          }
        >
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
