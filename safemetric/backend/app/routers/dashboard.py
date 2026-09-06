from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.inspection import Inspection
from app.auth.jwt_handler import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inspections = (
        db.query(Inspection)
        .filter(Inspection.user_id == current_user.id)
        .order_by(Inspection.created_at.desc())
        .all()
    )

    total = len(inspections)
    compliant = sum(1 for i in inspections if i.compliance_status == "COMPLIANT")
    non_compliant = sum(1 for i in inspections if i.compliance_status == "NON-COMPLIANT")
    review_required = sum(1 for i in inspections if i.compliance_status in ("REVIEW REQUIRED", "PARTIALLY COMPLIANT"))

    compliance_pct = round((compliant / total * 100), 1) if total > 0 else 0.0

    # Recent inspections (up to 6)
    recent = [
        {
            "id": i.id,
            "product_name": i.product_name,
            "image_url": f"/api/inspections/{i.id}/image",
            "compliance_status": i.compliance_status,
            "compliance_score": i.compliance_score,
            "inspection_date": i.inspection_date,
            "violations_count": len(i.violations) if i.violations else 0
        }
        for i in inspections[:6]
    ]

    # Category breakdown of violations
    violations_map = {}
    for i in inspections:
        if i.violations:
            for v in i.violations:
                f_name = v.get("field", "Other")
                violations_map[f_name] = violations_map.get(f_name, 0) + 1

    # Trend data (daily or weekly buckets)
    trend_data = []
    # Create sample aggregated trend from recent inspections
    date_map = {}
    for i in reversed(inspections[:10]):
        d_str = i.created_at.strftime("%d %b")
        if d_str not in date_map:
            date_map[d_str] = {"date": d_str, "total": 0, "compliant": 0, "non_compliant": 0}
        date_map[d_str]["total"] += 1
        if i.compliance_status == "COMPLIANT":
            date_map[d_str]["compliant"] += 1
        else:
            date_map[d_str]["non_compliant"] += 1

    trend_data = list(date_map.values())

    return {
        "total_inspections": total,
        "compliant_count": compliant,
        "non_compliant_count": non_compliant,
        "review_required_count": review_required,
        "compliance_percentage": compliance_pct,
        "recent_inspections": recent,
        "trend_data": trend_data,
        "violations_breakdown": violations_map
    }
