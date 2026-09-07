import os
import uuid
import shutil
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.inspection import Inspection
from app.models.field import InspectionField
from app.models.report import Report
from app.auth.jwt_handler import get_current_user
from app.services.inspection_service import inspection_service

router = APIRouter(prefix="/api/inspections", tags=["Inspections"])

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
MAX_FILE_SIZE = 15 * 1024 * 1024 # 15MB

@router.post("/analyze")
async def analyze_inspection(
    file: Optional[UploadFile] = File(None),
    demo_sample: Optional[str] = Form(None),
    product_name: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    saved_image_path = ""
    hint = demo_sample or ""

    if file and file.filename:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format '{ext}'. Allowed formats: PNG, JPG, JPEG, WEBP."
            )

        unique_filename = f"scan_{uuid.uuid4().hex[:10]}{ext}"
        saved_image_path = os.path.join(upload_dir, unique_filename)

        with open(saved_image_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Basic file size check
        if os.path.getsize(saved_image_path) > MAX_FILE_SIZE:
            os.remove(saved_image_path)
            raise HTTPException(status_code=400, detail="Image size exceeds maximum limit of 15MB.")
            
    elif demo_sample:
        # Resolve demo sample image
        demo_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "demo_samples")
        os.makedirs(demo_dir, exist_ok=True)
        
        sample_filename = f"sample_{demo_sample}.png"
        sample_path = os.path.join(demo_dir, sample_filename)
        
        if not os.path.exists(sample_path):
            # Create a placeholder demo label if not already generated
            saved_image_path = os.path.join(upload_dir, f"demo_{demo_sample}_{uuid.uuid4().hex[:6]}.png")
            # We'll touch or write an empty/simple demo marker
            with open(saved_image_path, "wb") as f:
                f.write(b"DEMO_LABEL_IMAGE")
        else:
            saved_image_path = sample_path
    else:
        raise HTTPException(
            status_code=400,
            detail="No product label image provided. Please capture with camera, upload a file, or choose a demo sample."
        )

    # Execute end-to-end inspection
    try:
        inspection = inspection_service.analyze_and_record(
            db=db,
            user=current_user,
            image_path=saved_image_path,
            hint=hint or (file.filename if file else ""),
            product_name_override=product_name
        )
    except Exception as e:
        print(f"[Inspection Execution Error] {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process inspection: {str(e)}")

    # Format response
    fields_list = [
        {
            "field_name": f.field_name,
            "extracted_value": f.extracted_value,
            "confidence": f.confidence,
            "status": f.status
        }
        for f in inspection.fields
    ]

    report = db.query(Report).filter(Report.inspection_id == inspection.id).first()

    # Image URL for client viewing
    rel_img_url = f"/api/inspections/{inspection.id}/image"

    return {
        "id": inspection.id,
        "product_name": inspection.product_name,
        "image_url": rel_img_url,
        "inspection_date": inspection.inspection_date,
        "compliance_status": inspection.compliance_status,
        "compliance_score": inspection.compliance_score,
        "raw_ocr_text": inspection.raw_ocr_text,
        "extracted_data": inspection.extracted_data,
        "violations": inspection.violations,
        "fields": fields_list,
        "quality_score": inspection.quality_score,
        "quality_notes": inspection.quality_notes,
        "has_report": report is not None,
        "report_id": report.id if report else None,
        "created_at": inspection.created_at
    }


@router.get("")
def list_inspections(
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    sort_by: Optional[str] = "newest", # newest, oldest, score
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Inspection).filter(Inspection.user_id == current_user.id)

    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(Inspection.compliance_status == status_filter.upper())

    if search:
        query = query.filter(Inspection.product_name.ilike(f"%{search.strip()}%"))

    if sort_by == "oldest":
        query = query.order_by(Inspection.created_at.asc())
    elif sort_by == "score":
        query = query.order_by(Inspection.compliance_score.desc())
    else:
        query = query.order_by(Inspection.created_at.desc())

    inspections = query.all()

    return [
        {
            "id": i.id,
            "user_id": i.user_id,
            "product_name": i.product_name,
            "image_url": f"/api/inspections/{i.id}/image",
            "inspection_date": i.inspection_date,
            "compliance_status": i.compliance_status,
            "compliance_score": i.compliance_score,
            "violations_count": len(i.violations) if i.violations else 0,
            "created_at": i.created_at
        }
        for i in inspections
    ]


@router.get("/{inspection_id}")
def get_inspection(
    inspection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inspection = db.query(Inspection).filter(
        Inspection.id == inspection_id,
        Inspection.user_id == current_user.id
    ).first()

    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection record not found.")

    fields_list = [
        {
            "field_name": f.field_name,
            "extracted_value": f.extracted_value,
            "confidence": f.confidence,
            "status": f.status
        }
        for f in inspection.fields
    ]

    report = db.query(Report).filter(Report.inspection_id == inspection.id).first()

    return {
        "id": inspection.id,
        "user_id": inspection.user_id,
        "product_name": inspection.product_name,
        "image_url": f"/api/inspections/{inspection.id}/image",
        "inspection_date": inspection.inspection_date,
        "compliance_status": inspection.compliance_status,
        "compliance_score": inspection.compliance_score,
        "raw_ocr_text": inspection.raw_ocr_text,
        "extracted_data": inspection.extracted_data,
        "violations": inspection.violations,
        "fields": fields_list,
        "quality_score": inspection.quality_score,
        "quality_notes": inspection.quality_notes,
        "has_report": report is not None,
        "report_id": report.id if report else None,
        "created_at": inspection.created_at
    }


@router.get("/{inspection_id}/image")
def get_inspection_image(
    inspection_id: int,
    db: Session = Depends(get_db)
):
    from fastapi.responses import FileResponse
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection or not os.path.exists(inspection.image_path):
        raise HTTPException(status_code=404, detail="Image not found on filesystem.")
    
    return FileResponse(inspection.image_path)


@router.delete("/{inspection_id}")
def delete_inspection(
    inspection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inspection = db.query(Inspection).filter(
        Inspection.id == inspection_id,
        Inspection.user_id == current_user.id
    ).first()

    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection record not found.")

    db.delete(inspection)
    db.commit()
    return {"message": f"Inspection #{inspection_id} successfully deleted."}
