import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { TopBar } from "./components/TopBar";
import { FilterPanel } from "./components/FilterPanel";
import { Tabs } from "./components/Tabs";
import { DataTable } from "./components/DataTable";
import {
  downloadExcel,
  fetchDqm,
  fetchFilterOptions,
  fetchInventory,
  fetchLimitations,
  type FilterPayload,
} from "./api/client";

const TAB_INVENTORY = "inventory";
const TAB_DQM = "dqm";
const TAB_LIMITATIONS = "limitations";

const EMPTY_FILTERS: FilterPayload = { regions: [], countries: [], statuses: [] };

export default function App() {
  const [filters, setFilters] = useState<FilterPayload>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FilterPayload>(EMPTY_FILTERS);
  const [activeTab, setActiveTab] = useState(TAB_INVENTORY);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const optionsQuery = useQuery({
    queryKey: ["filter-options"],
    queryFn: fetchFilterOptions,
  });

  const inventoryQuery = useQuery({
    queryKey: ["inventory", appliedFilters],
    queryFn: () => fetchInventory(appliedFilters),
  });

  const limitationsQuery = useQuery({
    queryKey: ["limitations", appliedFilters],
    queryFn: () => fetchLimitations(appliedFilters),
  });

  const dqmQuery = useQuery({
    queryKey: ["dqm", appliedFilters],
    queryFn: () => fetchDqm(appliedFilters),
  });

  const downloadMutation = useMutation({
    mutationFn: () => downloadExcel(filters),
    onError: (e: unknown) => setErrorBanner(extractError(e, "Failed to generate Excel.")),
  });

  useEffect(() => {
    const errors = [
      inventoryQuery.error,
      limitationsQuery.error,
      dqmQuery.error,
    ].filter(Boolean);
    if (errors.length > 0) {
      setErrorBanner(extractError(errors[0], "Failed to load data."));
    } else {
      setErrorBanner(null);
    }
  }, [inventoryQuery.error, limitationsQuery.error, dqmQuery.error]);

  const onApply = () => setAppliedFilters(filters);

  const onDownload = () => {
    setAppliedFilters(filters);
    downloadMutation.mutate();
  };

  const tabs = [
    {
      id: TAB_INVENTORY,
      label: "Model Inventory",
      count: inventoryQuery.data?.rows.length,
    },
    {
      id: TAB_DQM,
      label: "DQM Inventory",
      count: dqmQuery.data?.rows.length,
    },
    {
      id: TAB_LIMITATIONS,
      label: "Model Limitations",
      count: limitationsQuery.data?.rows.length,
    },
  ];

  return (
    <div className="min-h-full bg-canvas">
      <TopBar />

      <main className="mx-auto max-w-[1280px] px-6 py-6">
        <div className="mb-5">
          <h2 className="text-2xl font-semibold tracking-tight text-ink-primary">
            Model Inventory &amp; EUC
          </h2>
          <p className="mt-1 text-sm text-ink-secondary">
            Filter by Region, Country and Model Status across all three
            datasets, preview below, and export everything to a single Excel
            workbook.
          </p>
        </div>

        <FilterPanel
          options={optionsQuery.data}
          filters={filters}
          setFilters={setFilters}
          onApply={onApply}
          onDownload={onDownload}
          applying={
            inventoryQuery.isFetching ||
            limitationsQuery.isFetching ||
            dqmQuery.isFetching
          }
          downloading={downloadMutation.isPending}
        />

        {errorBanner && (
          <div className="mt-4 rounded border border-brand bg-brand-soft px-4 py-2.5 text-sm text-brand">
            {errorBanner}
          </div>
        )}

        <div className="mt-5">
          <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

          <div className="mt-4">
            {activeTab === TAB_INVENTORY && (
              <DataTable
                data={inventoryQuery.data}
                loading={inventoryQuery.isFetching}
                monoColumns={["GMIS ID", "MUC ID"]}
                wideColumns={["Model Use Case Purpose"]}
              />
            )}
            {activeTab === TAB_DQM && (
              <DataTable
                data={dqmQuery.data}
                loading={dqmQuery.isFetching}
                monoColumns={["DQM ID"]}
              />
            )}
            {activeTab === TAB_LIMITATIONS && (
              <DataTable
                data={limitationsQuery.data}
                loading={limitationsQuery.isFetching}
                monoColumns={["GMIS ID", "Model Use Case ID", "IMR Review ID"]}
                wideColumns={["Key Model Limitations"]}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function extractError(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: string }).message;
    if (typeof m === "string" && m.length > 0) return m;
  }
  return fallback;
}
