"""SQL templates and parameterised query builders.

All user-supplied values are bound through SQLite ``?`` placeholders.
"""
from __future__ import annotations

import sqlite3
from typing import Sequence

import pandas as pd

from .schemas import FilterPayload


def _in_clause(column: str, values: Sequence[str]) -> tuple[str, list[str]]:
    """Build a parameterised ``column IN (?, ?, ...)`` fragment.

    Returns ("", []) when ``values`` is empty so the caller can skip the clause.
    """
    if not values:
        return "", []
    placeholders = ",".join(["?"] * len(values))
    return f" AND {column} IN ({placeholders})", list(values)


def _build_where(filters: FilterPayload, alias: str = "muc") -> tuple[str, list[str]]:
    where = ""
    params: list[str] = []
    for column, vals in (
        (f"{alias}.region", filters.regions),
        (f"{alias}.site_of_operation", filters.countries),
        (f"{alias}.model_status", filters.statuses),
    ):
        clause, p = _in_clause(column, vals)
        where += clause
        params.extend(p)
    return where, params


def query_model_inventory(conn: sqlite3.Connection, filters: FilterPayload) -> pd.DataFrame:
    where, params = _build_where(filters, "muc")
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


def query_dqm(conn: sqlite3.Connection, dqm_id: str) -> pd.DataFrame:
    sql = """
        SELECT
            dqm_id                                                          AS "DQM ID",
            name                                                            AS "DQM Name",
            dqm_category                                                    AS "DQM Category",
            dqm_owner || ' (' || trim(dqm_ownerdisplay_name) || ')'         AS "DQM Owner"
        FROM dqm_table
        WHERE 1=1
          AND dqm_id = ?
    """
    return pd.read_sql_query(sql, conn, params=[dqm_id])


def query_model_limitations(conn: sqlite3.Connection, filters: FilterPayload) -> pd.DataFrame:
    where, params = _build_where(filters, "muc")
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


def query_filter_options(conn: sqlite3.Connection) -> dict[str, list[str]]:
    def _distinct(column: str) -> list[str]:
        cur = conn.execute(
            f"SELECT DISTINCT {column} FROM model_muc_table WHERE {column} IS NOT NULL "
            f"AND TRIM({column}) <> '' ORDER BY {column}"
        )
        return [row[0] for row in cur.fetchall()]

    return {
        "regions": _distinct("region"),
        "countries": _distinct("site_of_operation"),
        "statuses": _distinct("model_status"),
    }
