"""SQL templates and parameterised query builders.

All user-supplied values are bound through SQLite ``?`` placeholders.

Country values in the source tables are stored as comma-joined strings such
as ``"China,Japan,India"``. Filtering uses a substring match against
``',' || column || ','`` so any selected country anywhere in the joined value
is matched, while keeping the original string intact in the output.
"""
from __future__ import annotations

import sqlite3
from typing import Sequence

import pandas as pd

from .schemas import FilterPayload


def _in_clause(column: str, values: Sequence[str]) -> tuple[str, list[str]]:
    """Build a parameterised ``column IN (?, ?, ...)`` fragment."""
    if not values:
        return "", []
    placeholders = ",".join(["?"] * len(values))
    return f" AND {column} IN ({placeholders})", list(values)


def _country_clause(column: str, values: Sequence[str]) -> tuple[str, list[str]]:
    """Match any country in the comma-joined ``column`` against ``values``."""
    if not values:
        return "", []
    parts = [f"(',' || {column} || ',') LIKE ?" for _ in values]
    params = [f"%,{v},%" for v in values]
    return f" AND ({' OR '.join(parts)})", params


def _build_where(
    filters: FilterPayload,
    country_col: str,
    status_col: str | None,
    purpose_col: str | None,
) -> tuple[str, list[str]]:
    where = ""
    params: list[str] = []

    clause, p = _country_clause(country_col, filters.countries)
    where += clause
    params.extend(p)

    if status_col is not None:
        clause, p = _in_clause(status_col, filters.statuses)
        where += clause
        params.extend(p)

    if purpose_col is not None:
        clause, p = _in_clause(purpose_col, filters.purposes)
        where += clause
        params.extend(p)

    return where, params


def query_model_inventory(conn: sqlite3.Connection, filters: FilterPayload) -> pd.DataFrame:
    where, params = _build_where(
        filters,
        country_col="muc.site_of_operation",
        status_col="muc.model_status",
        purpose_col="muc.model_use_case_purpose",
    )
    sql = f"""
        SELECT
            muc.global_model_oversight_forum AS "Function",
            muc.model_id                     AS "GMIS ID",
            group_concat(muc.model_use_case_id, ",") AS "MUC ID",
            muc.name                         AS "Model Name",
            muc.model_status                 AS "Model Status",
            mta.model_tier                   AS "Model Tier",
            muc.asset_class                  AS "Portfolios Covered",
            muc.model_output                 AS "Model Output",
            muc.business_line__level_3       AS "Business Unit",
            muc.model_ownerdisplay_name      AS "Model Owners",
            muc.region                       AS "Region",
            muc.site_of_operation            AS "Country",
            muc.model_use_case_purpose       AS "Model Use Case Purpose"
        FROM model_muc_table muc
        JOIN MTA_TABLE mta ON muc.model_id = mta.model_id
        WHERE 1=1{where}
        GROUP BY muc.model_id
    """
    return pd.read_sql_query(sql, conn, params=params)


def query_dqm(conn: sqlite3.Connection, filters: FilterPayload) -> pd.DataFrame:
    """DQM listing filtered by Country only (no Status / Purpose on this table)."""
    where, params = _build_where(
        filters,
        country_col="site_of_operation",
        status_col=None,
        purpose_col=None,
    )
    sql = f"""
        SELECT
            dqm_id                                                  AS "DQM ID",
            name                                                    AS "DQM Name",
            dqm_category                                            AS "DQM Category",
            dqm_owner || ' (' || trim(dqm_ownerdisplay_name) || ')' AS "DQM Owner",
            regions                                                 AS "Region",
            site_of_operation                                       AS "Country"
        FROM dqm_table
        WHERE 1=1{where}
    """
    return pd.read_sql_query(sql, conn, params=params)


def query_model_limitations(conn: sqlite3.Connection, filters: FilterPayload) -> pd.DataFrame:
    where, params = _build_where(
        filters,
        country_col="muc.site_of_operation",
        status_col="muc.model_status",
        purpose_col="muc.model_use_case_purpose",
    )
    sql = f"""
        SELECT
            muc.model_category    AS "Function",
            muc.model_id          AS "GMIS ID",
            mri.date_raised       AS "Last IMR Date",
            mri.imr_review_id     AS "IMR Review ID",
            muc.ras_rating        AS "IMR Rating",
            mri.severity          AS "Severity",
            mri.description       AS "Key Model Limitations",
            muc.model_use_case_id AS "Model Use Case ID"
        FROM model_muc_table muc
        JOIN mri_table mri ON muc.model_use_case_id = mri.model_use_case_id
        WHERE 1=1{where}
    """
    return pd.read_sql_query(sql, conn, params=params)


def _split_clean(values: list[str | None]) -> list[str]:
    out: set[str] = set()
    for v in values:
        if not v:
            continue
        for piece in str(v).split(","):
            piece = piece.strip()
            if piece:
                out.add(piece)
    return sorted(out, key=str.lower)


def query_filter_options(conn: sqlite3.Connection) -> dict[str, list[str]]:
    """Distinct Country / Status / Purpose option sets.

    Country values are split on ``,`` across both tables, trimmed and
    deduplicated so the UI shows a clean atomic list.
    Status and Purpose come from ``model_muc_table``.
    """
    raw_country_rows = conn.execute(
        """
        SELECT site_of_operation FROM model_muc_table
        UNION ALL
        SELECT site_of_operation FROM dqm_table
        """
    ).fetchall()
    countries = _split_clean([row[0] for row in raw_country_rows])

    status_rows = conn.execute(
        "SELECT DISTINCT model_status FROM model_muc_table "
        "WHERE model_status IS NOT NULL AND TRIM(model_status) <> '' "
        "ORDER BY model_status COLLATE NOCASE"
    ).fetchall()
    statuses = [r[0] for r in status_rows]

    purpose_rows = conn.execute(
        "SELECT DISTINCT model_use_case_purpose FROM model_muc_table "
        "WHERE model_use_case_purpose IS NOT NULL AND TRIM(model_use_case_purpose) <> '' "
        "ORDER BY model_use_case_purpose COLLATE NOCASE"
    ).fetchall()
    purposes = [r[0] for r in purpose_rows]

    return {
        "countries": countries,
        "statuses": statuses,
        "purposes": purposes,
    }
