"""SQL templates and parameterised query builders.

All user-supplied values are bound through SQLite ``?`` placeholders.
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


def _build_where(
    filters: FilterPayload,
    region_col: str,
    country_col: str,
    status_col: str | None,
) -> tuple[str, list[str]]:
    where = ""
    params: list[str] = []
    pairs: list[tuple[str, Sequence[str]]] = [
        (region_col, filters.regions),
        (country_col, filters.countries),
    ]
    if status_col is not None:
        pairs.append((status_col, filters.statuses))
    for column, vals in pairs:
        clause, p = _in_clause(column, vals)
        where += clause
        params.extend(p)
    return where, params


def query_model_inventory(conn: sqlite3.Connection, filters: FilterPayload) -> pd.DataFrame:
    where, params = _build_where(
        filters,
        region_col="muc.region",
        country_col="muc.site_of_operation",
        status_col="muc.model_status",
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
    """DQM listing filtered by Region / Country.

    The dqm_table region column is named ``regions`` (per business spec); the
    country column is ``site_of_operation``. Status is not applicable here.
    """
    where, params = _build_where(
        filters,
        region_col="regions",
        country_col="site_of_operation",
        status_col=None,
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
        region_col="muc.region",
        country_col="muc.site_of_operation",
        status_col="muc.model_status",
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


def query_filter_options(conn: sqlite3.Connection) -> dict[str, object]:
    """Distinct Region / Country / Status with the Region→Country mapping.

    Region/Country pairs are unioned across ``model_muc_table`` and
    ``dqm_table`` so the UI can drive both views from a single option set.
    Status comes only from ``model_muc_table``.
    """
    region_country_sql = """
        SELECT DISTINCT region, country FROM (
            SELECT region AS region,  site_of_operation AS country FROM model_muc_table
            UNION
            SELECT regions AS region, site_of_operation AS country FROM dqm_table
        )
        WHERE region IS NOT NULL AND TRIM(region) <> ''
          AND country IS NOT NULL AND TRIM(country) <> ''
        ORDER BY region, country
    """
    pairs = conn.execute(region_country_sql).fetchall()

    countries_by_region: dict[str, list[str]] = {}
    for row in pairs:
        countries_by_region.setdefault(row["region"], []).append(row["country"])

    regions = sorted(countries_by_region.keys())
    countries = sorted({c for cs in countries_by_region.values() for c in cs})

    status_rows = conn.execute(
        "SELECT DISTINCT model_status FROM model_muc_table "
        "WHERE model_status IS NOT NULL AND TRIM(model_status) <> '' "
        "ORDER BY model_status"
    ).fetchall()
    statuses = [r[0] for r in status_rows]

    return {
        "regions": regions,
        "countries": countries,
        "statuses": statuses,
        "countries_by_region": countries_by_region,
    }
