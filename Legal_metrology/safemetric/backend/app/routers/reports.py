import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.inspection import Inspection
from app.models.report import Report
from app.auth.jwt_handler import get_current_user

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("")
def list_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reports = (
        db.query(Report)
        .join(Inspection, Report.inspection_id == Inspection.id)
        .filter(Inspection.user_id == current_user.id)
        .order_by(Report.created_at.desc())
        .all()
    )

    result = []
    for r in reports:
        insp = r.inspection
        result.append({
            "report_id": r.id,
            "inspection_id": r.inspection_id,
            "product_name": insp.product_name if insp else "Packaged Commodity",
            "compliance_status": insp.compliance_status if insp else "UNKNOWN",
            "compliance_score": insp.compliance_score if insp else 0.0,
            "created_at": r.created_at,
            "download_url": f"/api/reports/{r.inspection_id}/download"
        })
    return result

@router.get("/{inspection_id}")
def get_report(
    inspection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = (
        db.query(Report)
        .join(Inspection, Report.inspection_id == Inspection.id)
        .filter(Report.inspection_id == inspection_id, Inspection.user_id == current_user.id)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found for this inspection.")

    insp = report.inspection
    return {
        "report_id": report.id,
        "inspection_id": report.inspection_id,
        "product_name": insp.product_name,
        "compliance_status": insp.compliance_status,
        "compliance_score": insp.compliance_score,
        "created_at": report.created_at,
        "download_url": f"/api/reports/{inspection_id}/download"
    }

@router.get("/{inspection_id}/download")
def download_report_pdf(
    inspection_id: int,
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.inspection_id == inspection_id).first()
    if not report or not os.path.exists(report.report_path):
        raise HTTPException(status_code=404, detail="PDF report file not found.")

    filename = f"SafeMetric_Inspection_Report_{inspection_id}.pdf"
    return FileResponse(
        path=report.report_path,
        media_type="application/pdf",
        filename=filename
    )
