import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  timeout: 60_000,
});

export interface FilterOptions {
  regions: string[];
  countries: string[];
  statuses: string[];
  countries_by_region: Record<string, string[]>;
}

export interface FilterPayload {
  regions: string[];
  countries: string[];
  statuses: string[];
}

export interface TableResponse {
  columns: string[];
  rows: Record<string, unknown>[];
}

export const fetchFilterOptions = () =>
  api.get<FilterOptions>("/filters/options").then((r) => r.data);

export const fetchInventory = (payload: FilterPayload) =>
  api.post<TableResponse>("/model-inventory", payload).then((r) => r.data);

export const fetchLimitations = (payload: FilterPayload) =>
  api.post<TableResponse>("/model-limitations", payload).then((r) => r.data);

export const fetchDqm = (payload: FilterPayload) =>
  api.post<TableResponse>("/dqm", payload).then((r) => r.data);

export const downloadExcel = async (filters: FilterPayload) => {
  const response = await api.post(
    "/export/excel",
    { filters },
    { responseType: "blob" }
  );
  const blob = new Blob([response.data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "BoP_generated.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
