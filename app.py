"""
NHAI Street Light Performance Dashboard - Web Application
Built with FastAPI, designed for modern browsers and cloud deployment on Render.
"""

import os
import shutil
from typing import List, Optional
from fastapi import FastAPI, Request, UploadFile, File, Query, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

from data_loader import manager, DEFAULT_EXCEL_PATH

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = FastAPI(
    title="NHAI CCMS Street Light Performance Dashboard",
    description="Live operational telemetry, failure tracking, and SLA management for NHAI PIU Chengalpattu",
    version="1.0.0"
)

# Mount static files directory
app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")

# Templates
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))


class SimulationRequest(BaseModel):
    panel_ids: List[str]


@app.get("/", response_class=HTMLResponse)
async def dashboard_home(request: Request):
    """Renders the main NHAI operational dashboard."""
    summary = manager.get_summary()
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={"summary": summary}
    )


@app.get("/api/summary")
async def get_summary_api():
    """Returns the comprehensive KPI and telemetry metrics."""
    return JSONResponse(content=manager.get_summary())


@app.get("/api/panels")
async def get_panels_api(
    section: Optional[str] = Query(None, description="Filter by section: all, Section-1, Section-2, Section-3"),
    health: Optional[str] = Query(None, description="Filter by health tier: all, optimal, minor, moderate, critical"),
    search: Optional[str] = Query(None, description="Search query across ID, section, ward"),
    sort_by: Optional[str] = Query("non_burning_lights", description="Field to sort by"),
    sort_order: Optional[str] = Query("desc", description="Sort direction: asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=200, description="Page size limit")
):
    """Returns filtered, sorted, and paginated panel telemetry data."""
    panels = manager.get_panels(section=section, health=health, search=search)

    # Sort results
    reverse = (sort_order.lower() == "desc")
    valid_sort_keys = [
        "ccms_id", "section", "ward", "connected_lights", "burning_lights",
        "non_burning_lights", "burning_percentage", "non_burning_percentage",
        "connected_load_w", "recorded_load_w", "non_burning_load_w"
    ]
    sort_field = sort_by if sort_by in valid_sort_keys else "non_burning_lights"
    panels = sorted(panels, key=lambda x: x.get(sort_field, 0), reverse=reverse)

    total_count = len(panels)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    paginated_items = panels[start_idx:end_idx]

    return JSONResponse(content={
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": (total_count + limit - 1) // limit if limit > 0 else 1,
        "panels": paginated_items
    })


@app.get("/api/panel/{ccms_id}")
async def get_single_panel(ccms_id: str):
    """Returns single panel telemetry including full wattage distribution."""
    for p in manager.panels:
        if p["ccms_id"].lower() == ccms_id.lower():
            return JSONResponse(content=p)
    raise HTTPException(status_code=404, detail=f"Panel '{ccms_id}' not found")


@app.post("/api/simulate")
async def simulate_resolution_api(payload: SimulationRequest):
    """Simulates SLA improvements when specified panels are rectified."""
    result = manager.simulate_resolution(payload.panel_ids)
    return JSONResponse(content=result)


@app.post("/api/upload")
async def upload_telemetry_excel(file: UploadFile = File(...)):
    """Uploads and reprocesses a fresh telemetry Excel workbook."""
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload an Excel (.xlsx) file.")

    temp_path = os.path.join(BASE_DIR, "uploaded_telemetry.xlsx")
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Test loading
        count = manager.load_data(temp_path)
        # If successful, overwrite active file or keep uploaded as active
        return JSONResponse(content={
            "success": True,
            "message": f"Successfully processed {count} CCMS panel records.",
            "summary": manager.get_summary()
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process telemetry file: {str(e)}")


@app.get("/api/export/csv")
async def export_csv_file():
    """Generates and downloads CSV of the full panel inventory."""
    csv_data = manager.export_csv()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=NHAI_CCMS_Panel_Inventory.csv"}
    )


@app.get("/health")
async def health_check():
    """Healthcheck endpoint for Render / monitoring."""
    return JSONResponse(content={
        "status": "healthy",
        "service": "nhai-ccms-dashboard",
        "panels_loaded": len(manager.panels),
        "burning_ratio": manager.summary_cache.get("kpis", {}).get("burning_percentage")
    })


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print("\n" + "=" * 60)
    print("  🚀 NHAI CCMS Dashboard is running!")
    print(f"  👉 Open in your browser: http://127.0.0.1:{port}")
    print(f"  👉 Or open:               http://localhost:{port}")
    print("  ⚠️  Note: Do NOT click 'http://0.0.0.0:8000' in Windows!")
    print("=" * 60 + "\n")
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)

