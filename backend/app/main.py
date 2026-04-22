"""FastAPI application entry point."""
from __future__ import annotations

import re
from io import BytesIO

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .db import get_connection
from .queries import (
    query_dqm,
    query_filter_options,
    query_model_inventory,
    query_model_limitations,
)
from .schemas import ExportPayload, FilterOptions, FilterPayload, TableResponse
from .services.excel_builder import build_workbook

DQM_ID_PATTERN = re.compile(r"^[A-Za-z0-9_\-]{1,64}$")
EXCEL_MEDIA = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
EXPORT_FILENAME = "BoP_generated.xlsx"

app = FastAPI(title="Model Inventory & EUC Portal", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def _df_to_response(df: pd.DataFrame) -> TableResponse:
    df = df.where(pd.notnull(df), None)
    return TableResponse(
        columns=list(df.columns),
        rows=df.to_dict(orient="records"),
    )


def _validate_dqm_id(dqm_id: str) -> str:
    dqm_id = dqm_id.strip()
    if not dqm_id or not DQM_ID_PATTERN.match(dqm_id):
        raise HTTPException(status_code=400, detail="Invalid dqm_id format.")
    return dqm_id


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/filters/options", response_model=FilterOptions)
def filter_options() -> FilterOptions:
    with get_connection() as conn:
        opts = query_filter_options(conn)
    return FilterOptions(**opts)


@app.post("/api/model-inventory", response_model=TableResponse)
def model_inventory(payload: FilterPayload) -> TableResponse:
    with get_connection() as conn:
        df = query_model_inventory(conn, payload)
    return _df_to_response(df)


@app.post("/api/model-limitations", response_model=TableResponse)
def model_limitations(payload: FilterPayload) -> TableResponse:
    with get_connection() as conn:
        df = query_model_limitations(conn, payload)
    return _df_to_response(df)


@app.get("/api/dqm/{dqm_id}", response_model=TableResponse)
def dqm_lookup(dqm_id: str) -> TableResponse:
    dqm_id = _validate_dqm_id(dqm_id)
    with get_connection() as conn:
        df = query_dqm(conn, dqm_id)
    return _df_to_response(df)


@app.post("/api/export/excel")
def export_excel(payload: ExportPayload) -> StreamingResponse:
    dqm_id = _validate_dqm_id(payload.dqm_id) if payload.dqm_id else None

    with get_connection() as conn:
        inventory_df = query_model_inventory(conn, payload.filters)
        limitations_df = query_model_limitations(conn, payload.filters)
        dqm_df = query_dqm(conn, dqm_id) if dqm_id else pd.DataFrame(
            columns=["DQM ID", "DQM Name", "DQM Category", "DQM Owner"]
        )

    blob = build_workbook(inventory_df, dqm_df, limitations_df)
    return StreamingResponse(
        BytesIO(blob),
        media_type=EXCEL_MEDIA,
        headers={"Content-Disposition": f'attachment; filename="{EXPORT_FILENAME}"'},
    )
