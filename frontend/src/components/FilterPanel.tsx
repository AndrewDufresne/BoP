import { useEffect, useMemo } from "react";
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

export function FilterPanel({
  options,
  filters,
  setFilters,
  onApply,
  onDownload,
  applying,
  downloading,
}: Props) {
  // Country options cascade from selected regions. When no region is selected
  // we expose every country (full list).
  const countryOptions = useMemo(() => {
    if (!options) return [];
    if (filters.regions.length === 0) return options.countries;
    const allowed = new Set<string>();
    for (const region of filters.regions) {
      for (const c of options.countries_by_region[region] ?? []) {
        allowed.add(c);
      }
    }
    return [...allowed].sort();
  }, [options, filters.regions]);

  // Drop selected countries that no longer belong to the chosen regions, so
  // the user can never submit an inconsistent combination.
  useEffect(() => {
    if (filters.countries.length === 0) return;
    const allowed = new Set(countryOptions);
    const pruned = filters.countries.filter((c) => allowed.has(c));
    if (pruned.length !== filters.countries.length) {
      setFilters({ ...filters, countries: pruned });
    }
  }, [countryOptions, filters, setFilters]);

  const update = (patch: Partial<FilterPayload>) =>
    setFilters({ ...filters, ...patch });

  return (
    <section className="rounded border border-border bg-white p-5 shadow-sm">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
          placeholder={
            filters.regions.length === 0
              ? "All"
              : `All in ${filters.regions.length} region(s)`
          }
        />
        <MultiSelect
          label="Model Status"
          options={options?.statuses ?? []}
          value={filters.statuses}
          onChange={(statuses) => update({ statuses })}
        />
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
