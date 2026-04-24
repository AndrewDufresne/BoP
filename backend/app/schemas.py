"""Pydantic request / response models."""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class FilterPayload(BaseModel):
    countries: list[str] = Field(default_factory=list)
    statuses: list[str] = Field(default_factory=list)
    purposes: list[str] = Field(default_factory=list)


class ExportPayload(BaseModel):
    filters: FilterPayload = Field(default_factory=FilterPayload)


class FilterOptions(BaseModel):
    countries: list[str]
    statuses: list[str]
    purposes: list[str]


class TableResponse(BaseModel):
    columns: list[str]
    rows: list[dict[str, Any]]
