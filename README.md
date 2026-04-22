# BoP — Model Inventory & EUC Portal

Business-minimal React + FastAPI portal for browsing Model Inventory, DQM
Inventory and Model Limitations, and exporting them to a single Excel
workbook (`BoP_generated.xlsx`).

```
BoP/
├── backend/        # FastAPI + SQLite + xlsxwriter
└── frontend/       # React + Vite + TypeScript + Tailwind
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- A SQLite database file containing the following tables:
  - `model_muc_table`
  - `MTA_TABLE`
  - `dqm_table`
  - `mri_table`

The schemas and column names match the SQL templates in
[Doc/business,req.txt](Doc/business,req.txt).

## Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Point to your SQLite file (default: backend/data/app.db)
$env:BOP_DB_PATH = "C:\path\to\app.db"

uvicorn app.main:app --reload --port 8000
```

API surface:

| Method | Path | Purpose |
|---|---|---|
| GET  | `/api/health`                 | Liveness probe |
| GET  | `/api/filters/options`        | Distinct Region / Country / Status + cascade map |
| POST | `/api/model-inventory`        | Inventory rows (filtered) |
| POST | `/api/model-limitations`      | Limitations rows (filtered) |
| POST | `/api/dqm`                    | DQM rows (filtered by Region / Country) |
| POST | `/api/export/excel`           | Streamed `BoP_generated.xlsx` |

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

Vite runs on <http://localhost:5173> and proxies `/api/*` to
<http://127.0.0.1:8000>.

## Excel formatting

The exporter mirrors `Excel_generation_sample_code.py`:

- HSBC Red header background (`#DB0011`) with bold white text and borders
- Wrapped text on long-form columns C and G, column width 40
- Frozen header row
- Three sheets: `Model Inventory`, `DQM`, `Model Limitations`
- Output file: `BoP_generated.xlsx`

## Design

See [Doc/design.md](Doc/design.md) for the full token set, typography and
component rules. Plan and milestones live in [Doc/Plan.md](Doc/Plan.md).
