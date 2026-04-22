import type { TableResponse } from "../api/client";

interface Props {
  data: TableResponse | undefined;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  monoColumns?: string[];
  wideColumns?: string[];
}

export function DataTable({
  data,
  loading,
  error,
  emptyMessage = "No records match the current filters.",
  monoColumns = [],
  wideColumns = [],
}: Props) {
  return (
    <div className="overflow-hidden rounded border border-border bg-white shadow-sm">
      {loading && <div className="h-0.5 w-full animate-pulse bg-brand" />}
      <div className="max-h-[640px] overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-subtle">
            <tr>
              {data?.columns.map((col) => (
                <th
                  key={col}
                  scope="col"
                  className="border-b border-border px-4 py-2.5 text-left text-[12px] font-medium uppercase tracking-[0.04em] text-ink-secondary"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr>
                <td
                  colSpan={data?.columns.length || 1}
                  className="px-4 py-10 text-center text-sm text-brand"
                >
                  {error}
                </td>
              </tr>
            ) : !data || data.rows.length === 0 ? (
              <tr>
                <td
                  colSpan={data?.columns.length || 1}
                  className="px-4 py-12 text-center text-sm text-ink-tertiary"
                >
                  {loading ? "Loading…" : emptyMessage}
                </td>
              </tr>
            ) : (
              data.rows.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-border last:border-b-0 hover:bg-muted"
                >
                  {data.columns.map((col) => {
                    const isMono = monoColumns.includes(col);
                    const isWide = wideColumns.includes(col);
                    const raw = row[col];
                    const value =
                      raw === null || raw === undefined || raw === ""
                        ? "—"
                        : String(raw);
                    return (
                      <td
                        key={col}
                        className={`align-top px-4 py-3 text-ink-primary ${
                          isMono ? "font-mono text-[13px]" : ""
                        } ${isWide ? "max-w-[360px] whitespace-normal break-words" : "whitespace-nowrap"}`}
                      >
                        {value === "—" ? (
                          <span className="text-ink-tertiary">—</span>
                        ) : (
                          value
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
