# SafeMetric – AI Powered Legal Metrology Compliance System

> **Team Name:** SAFE METRIC  
> **Tagline:** Scan. Validate. Trust.  
> **Statutory Basis:** Legal Metrology Act, 2009 & Legal Metrology (Packaged Commodities) Rules, 2011  

---

## 1. System Overview

**SafeMetric** is an enterprise-grade AI-powered regulatory compliance system built for enforcement officers, inspectors, and supervisors. It automates the inspection of packaged commodities by capturing or uploading product labels, extracting declarations using OpenCV computer vision and PaddleOCR, validating declarations against configurable Legal Metrology rules, detecting statutory infractions, generating official PDF certificates, and maintaining an auditable inspection history.

### Core Product Principle & Terminology Mandate
> [!IMPORTANT]
> SafeMetric evaluates **PACKAGED PRODUCT LABEL DECLARATION COMPLIANCE**. It does **NOT** evaluate consumable, physical, or medical safety.
>
> **Standard Statutory Terminology:**
> - `COMPLIANT`
> - `NON-COMPLIANT`
> - `PARTIALLY COMPLIANT`
> - `REVIEW REQUIRED`
> - `MISSING DECLARATION`
> - `INVALID DECLARATION`
> - `LOW OCR CONFIDENCE`
>
> *Prohibited Phrasing:* "Product is safe", "Guaranteed safe". The system provides automated compliance assistance; final regulatory determination remains subject to physical inspection by an authorized officer.

---

## 2. Architecture & Tech Stack

SafeMetric consists of **two unified client applications** powered by a single shared backend:

```
                  ┌────────────────────────────────────────┐
                  │          WEB APPLICATION               │
                  │   React 18 + Vite + Lucide Icons       │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼  REST API (JSON)
┌─────────────────────────────────────┴─────────────────────────────────────┐
│                       FASTAPI SHARED BACKEND                              │
│  • Pydantic Schemas  • SQLAlchemy ORM  • SQLite (PostgreSQL Ready)        │
│  • OpenCV Vision Preprocessing (CLAHE, Bilateral Denoising, Otsu)         │
│  • PaddleOCR Text Engine & Fallback Bounding Box Extractor                │
│  • Legal Metrology (Packaged Commodities) Rules 2011 Rule Engine          │
│  • ReportLab Statutory PDF Report Generator                               │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      ▲  REST API (JSON)
                                      │
                  ┌───────────────────┴────────────────────┐
                  │          MOBILE APPLICATION            │
                  │ React Native + Expo (Camera First)     │
                  └────────────────────────────────────────┘
```

---

## 3. Directory Layout

```
safemetric/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app entrypoint, lifespan & static mounts
│   │   ├── database.py              # SQLite / SQLAlchemy connection
│   │   ├── demo_seeder.py           # Pre-seeds rules, demo officer & sample images
│   │   ├── models/                  # User, Inspection, InspectionField, Rule, Report
│   │   ├── schemas/                 # Pydantic schemas
│   │   ├── routers/                 # auth, inspections, dashboard, reports, profile, rules
│   │   ├── services/                # quality_service, inspection_service
│   │   ├── auth/                    # bcrypt security & JWT handlers
│   │   ├── ocr/                     # preprocessing (OpenCV) & ocr_service
│   │   ├── extraction/              # normalizer & field_extractor (12 declarations)
│   │   ├── rules/                   # base_rules, packaged_commodities, general_rules, rule_engine
│   │   └── reports/                 # pdf_generator (ReportLab)
│   ├── uploads/                     # Uploaded label images
│   ├── reports/                     # Generated PDF reports
│   ├── demo_samples/                # Pre-rendered benchmark label images
│   ├── requirements.txt
│   └── .env.example
│
├── web/
│   ├── src/
│   │   ├── components/              # Sidebar, Header, EvidenceViewer, AnalysisProgress, ProtectedRoute
│   │   ├── pages/                   # Login, Register, Dashboard, Scan, Result, History, Reports, Profile
│   │   ├── context/                 # AuthContext
│   │   ├── services/                # Axios API client
│   │   ├── index.css                # Enterprise GovTech Design Tokens
│   │   ├── App.jsx                  # React Router routes
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── mobile/
│   ├── src/
│   │   ├── screens/                 # Login, Register, Dashboard, Scan, Result, History, Reports, Profile
│   │   ├── navigation/              # AppNavigator (Native Stack) & TabNavigator (Bottom Tabs)
│   │   ├── services/                # Mobile API client
│   │   ├── context/                 # Mobile AuthContext
│   │   └── utils/                   # Theme tokens
│   ├── App.js                       # Mobile root
│   ├── app.json                     # Expo configuration
│   └── package.json
│
└── README.md
```

---

## 4. Run Commands

### 1. Shared Backend (FastAPI)

```bash
# Navigate to backend folder
cd safemetric/backend

# (Optional) Create and activate virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend development server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend API Docs:* `http://127.0.0.1:8000/docs`

---

### 2. Web Application (React + Vite)

```bash
# Navigate to web folder
cd safemetric/web

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
*Web App URL:* `http://localhost:5173`

---

### 3. Mobile Application (React Native / Expo)

```bash
# Navigate to mobile folder
cd safemetric/mobile

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

**Testing on Different Targets:**
- **Android Emulator:** Press `a` in the Expo terminal (connects to `10.0.2.2:8000`).
- **Physical Device:** Install the **Expo Go** app on your phone, ensure your phone and PC are on the same Wi-Fi, and scan the QR code.
- **Web Browser:** Press `w` to test the mobile UI directly in your web browser.

---

## 5. Demo Officer Credentials

For testing and Smart India Hackathon jury demonstration:

| Field | Value |
|---|---|
| **Email** | `officer@safemetric.gov.in` |
| **Password** | `password123` |
| **Name** | Inspector Rajesh Kumar |
| **Role** | Senior Legal Metrology Inspector |
| **Organization** | Department of Consumer Affairs, Delhi Zone |

*Both Web and Mobile login screens include a 1-click **"Fill Demo Officer Credentials"** button for quick login.*

---

## 6. SIH Judge Demonstration Flow (Under 2 Minutes)

1. **Open SafeMetric Web** (`http://localhost:5173`) or Mobile App.
2. **Login:** Click *"Fill Demo Officer Credentials"* → Click *"Login to SafeMetric"*.
3. **Dashboard:** Review KPI metrics (Total Inspections, Compliant %, Non-Compliant count, violations category chart, and recent audit logs).
4. **Initiate Scan:** Click **`+ SCAN PRODUCT`**.
5. **Demonstrate Compliant Commodity:**
   - Click the **`✓ SafeRice (Compliant)`** button (or capture/upload `sample_saferice.png`).
   - Click **`ANALYZE PRODUCT COMPLIANCE`**.
   - Observe the **7-stage animated progress pipeline** (OpenCV preprocessing → PaddleOCR → Field extraction → Rule validation → Report preparation).
   - **Result Screen:** Verify `COMPLIANT` green banner, 100% score, 0 violations, and declaration checklist.
   - Inspect evidence with interactive OCR bounding boxes.
   - Click **`DOWNLOAD PDF REPORT`** to view the publication-grade statutory certificate.
6. **Demonstrate Non-Compliant Commodity:**
   - Click **`Scan Next Commodity`**.
   - Select **`✕ Crispy Wafers (Non-Compliant)`** (or capture/upload `sample_wafer.png`).
   - Click **`ANALYZE PRODUCT COMPLIANCE`**.
   - **Result Screen:** Verify `NON-COMPLIANT` red banner, itemized violations (Missing Consumer Care Cell under Rule 6(1)(n), ambiguous Net Quantity notation "Approx 200g" under Rule 12, missing currency symbol under Rule 6(1)(e)).
7. **Audit Trail:** Navigate to **`History`** to show that both records are permanently saved with filtering, search, and sorting.
8. **Reports Archive:** Open **`Reports`** to see all generated statutory certificates.

---

## 7. Legal Metrology Rules Implemented

| Rule ID | Statutory Reference | Requirement Checked | Severity |
|---|---|---|---|
| `PCR-2011-R6-1-E` | Rule 6(1)(e), PCR 2011 | Maximum Retail Price (MRP) in ₹ inclusive of all taxes | HIGH |
| `PCR-2011-R6-1-C` | Rule 6(1)(c) & R11, PCR 2011 | Net Quantity in standard SI metric units (g, kg, ml, l) | HIGH |
| `PCR-2011-R6-1-A` | Rule 6(1)(a), PCR 2011 | Manufacturer / Packer name and role designation | HIGH |
| `PCR-2011-R6-1-A-ADDR` | Rule 6(1)(a), PCR 2011 | Complete physical factory or registered postal address | HIGH |
| `PCR-2011-R6-1-N` | Rule 6(1)(n), PCR 2011 | Consumer Care grievance phone number and email address | HIGH |
| `PCR-2011-R6-1-D` | Rule 6(1)(d), PCR 2011 | Month and year of manufacture or pre-packing | MEDIUM |
| `PCR-2011-R6-1-D-PROVISO` | Rule 6(1)(d) proviso, PCR 2011 | Best Before / Use By / Expiry date declaration | MEDIUM |
| `PCR-2011-R6-1-AB` | Rule 6(1)(ab), PCR 2011 | Country of Origin statement ("Made in India", etc.) | MEDIUM |
| `PCR-2011-R6-1-Q` | Rule 6(1)(q), PCR 2011 | Batch, code, or lot number for inspection trace | LOW |
| `LMA-2009-SEC-18` | Section 18, LM Act 2009 | Minimum legibility, contrast, and conspicuous placement | HIGH |

---

## 8. Known Limitations & Future Roadmap

- **Multi-angle Stitching:** Cylindrical packaging (bottles, cans) currently requires flat-label presentation; future releases will support panorama cylindrical unwrapping.
- **Multilingual Recognition:** Support for regional Indian official languages (Hindi, Tamil, Marathi, Bengali, Telugu) under the 8th Schedule.
- **Central Regulatory Registry:** Integration with the National Consumer Helpline (NCH) and e-Daakhil consumer grievance portals.
