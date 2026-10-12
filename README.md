# 🛣️ NHAI CCMS Street Light Performance & Failure Dashboard

### National Highways Authority of India (NHAI) • PIU Chengalpattu
**MoRTH Highway Lighting SLA Monitoring System**

---

## 📌 Executive Overview
This web application is a full interactive conversion of the **NHAI CCMS Lamp Failure, Burning & Non-Burning Performance Dashboard** Excel sheet (`NHAI-LAMP-FAILURE-DASHBOARD.xlsx`).

It monitors **106 CCMS (Centralized Control and Monitoring System) panels**, **2,694 street lights**, and **516.41 kW connected electrical load** along the Chengalpattu highway corridor.

---

## 🌟 Key Features
- **Live Highway Telemetry Bar**: Shows active panel communication, operational date (`12-Oct-2026`), and network health.
- **Executive KPI Cards**: 
  - `106` Monitored CCMS Panels (100% online)
  - `2,694` Connected Lamps (516.41 kW total load)
  - `2,442` Active Burning Lamps (`90.65%` burning ratio)
  - `252` Non-Burning Outages (`9.35%` deficit)
  - `51.08 kW` Unserved Highway Load Deficit
  - `90.65%` Network SLA Compliance (Target: `>95.0%`)
- **Interactive SLA Rectification Simulator ("What-If" Engine)**:
  - Simulate the impact of deploying maintenance crews to the **Top 5 Hotspot Panels** (recovers 119 lamps, lifts SLA to `95.06%` compliance).
  - Simulate resolving all **Top 15 Problem Panels** (recovers 204 lamps, lifts SLA to `98.22%` compliance).
  - Custom checkbox toggles for any combination of panels.
- **Section & Corridor Analytics**: Section-1 (Ward 28-53), Section-2 (Ward 54-102), Section-3 (Ward 103-120) with active meters and failure shares.
- **Wattage Rating Breakdown**: Granular outage share and deficit load analysis for 150W, 180W, 200W, 220W, 250W, and 300W luminaires.
- **Interactive Visualizations (Chart.js)**:
  - Donut Chart: Network Active Burning vs Outages
  - Grouped Bar Chart: Section-wise Active vs Non-burning Lamps
  - Horizontal Bar Chart: Wattage Failure Counts & Deficit kW
  - Donut Chart: CCMS Health Tiers (100% Optimal, Minor, Moderate, Critical)
- **CCMS Panel Inventory Explorer**:
  - Live search by Panel ID, Section, or Ward
  - Section and Health tier filtering
  - Column sorting & pagination
  - Single panel **Telemetry Modal** showing detailed rating breakdown and load figures
- **Ingestion & Export Tools**:
  - Drag-and-drop upload of new `.xlsx` telemetry workbooks
  - Instant CSV inventory export
  - Print / PDF Executive Brief generator
- **Executive Engineering Directives**:
  - 5 official technical audit sections detailing the 80/20 root cause phenomenon and 3-phase engineering action plan.
- **Theme Switcher**: Executive Command Center Dark Mode & Clean Daylight Light Mode.

---

## 🛠️ Tech Stack
- **Backend**: Python 3.11+ / FastAPI / Uvicorn / Pandas / OpenPyXL
- **Frontend**: Semantic HTML5, Vanilla CSS3 (Custom Design System), JavaScript (ES6+), Chart.js
- **Deployment**: Production-ready for Render (Free Tier), Heroku, Docker, or any Linux/Windows VPS

---

## 🚀 Quick Start (Local)

1. Clone or download this directory.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the application:
   ```bash
   python app.py
   ```
4. Open your browser at:
   ```
   http://localhost:8000
   ```

---

## ☁️ Deployment to Render
See [DEPLOYMENT.md](file:///c:/Users/Vinoth/Desktop/NHAI-WEBSITE/DEPLOYMENT.md) for full instructions:
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
- Includes pre-configured `render.yaml` for 1-click Blueprint deployment.
