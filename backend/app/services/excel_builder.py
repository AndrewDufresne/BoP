"""Excel workbook builder.

Mirrors the formatting used in ``Excel_generation_sample_code.py``:
HSBC red header (#DB0011), white bold font, wrapped text on long columns.
"""
from __future__ import annotations

from io import BytesIO

import pandas as pd

HEADER_BG = "#DB0011"
HEADER_FG = "#FFFFFF"


def build_workbook(
    inventory_df: pd.DataFrame,
    dqm_df: pd.DataFrame,
    limitations_df: pd.DataFrame,
) -> bytes:
    """Render the three dataframes into a single .xlsx byte string."""
    sheets: dict[str, pd.DataFrame] = {
        "Model Inventory": inventory_df,
        "DQM": dqm_df,
        "Model Limitations": limitations_df,
    }

    buffer = BytesIO()
    with pd.ExcelWriter(buffer, engine="xlsxwriter") as writer:
        for sheet_name, df in sheets.items():
            df.to_excel(writer, sheet_name=sheet_name, index=False)

        workbook = writer.book
        wrap_format = workbook.add_format({"text_wrap": True, "valign": "top"})
        header_format = workbook.add_format(
            {
                "bold": True,
                "text_wrap": True,
                "valign": "top",
                "fg_color": HEADER_BG,
                "font_color": HEADER_FG,
                "border": 1,
            }
        )

        for sheet_name, df in sheets.items():
            worksheet = writer.sheets[sheet_name]
            # Long-text columns get a wider, wrapped layout (mirrors sample code).
            worksheet.set_column("C:C", 40, wrap_format)
            worksheet.set_column("G:G", 40, wrap_format)
            for col_idx, column in enumerate(df.columns):
                worksheet.write(0, col_idx, column, header_format)
            worksheet.freeze_panes(1, 0)

    return buffer.getvalue()
