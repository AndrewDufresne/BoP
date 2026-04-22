"""Pydantic request / response models."""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class FilterPayload(BaseModel):
    regions: list[str] = Field(default_factory=list)
    countries: list[str] = Field(default_factory=list)
    statuses: list[str] = Field(default_factory=list)


class ExportPayload(BaseModel):
    filters: FilterPayload = Field(default_factory=FilterPayload)


class FilterOptions(BaseModel):
    regions: list[str]
    countries: list[str]
    statuses: list[str]
    countries_by_region: dict[str, list[str]] = Field(default_factory=dict)


class TableResponse(BaseModel):
    columns: list[str]
    rows: list[dict[str, Any]]
