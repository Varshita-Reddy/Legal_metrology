import os
import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.inspection import Inspection
from app.models.field import InspectionField
from app.models.report import Report
from app.services.quality_service import analyze_image_quality
from app.ocr.ocr_service import ocr_service
from app.extraction.field_extractor import field_extractor
from app.rules.rule_engine import rule_engine
from app.reports.pdf_generator import generate_pdf_report

class InspectionService:
    def analyze_and_record(
        self,
        db: Session,
        user: User,
        image_path: str,
        hint: str = "",
        product_name_override: Optional[str] = None
    ) -> Inspection:
        """
        End-to-end regulatory inspection analysis:
        Image Quality Check -> OpenCV Preprocessing -> OCR -> Extraction -> Rules Engine -> DB Save -> PDF Generate
        """
        # 1. Quality Analysis
        quality_res = analyze_image_quality(image_path)
        quality_score = quality_res.get("quality_score", 100.0)
        quality_notes = "; ".join(quality_res.get("warnings", [])) or "Good Quality"

        # 2. OCR Processing
        ocr_result = ocr_service.process_image(image_path, hint=hint)
        raw_ocr_text = ocr_result.get("raw_text", "")
        avg_confidence = ocr_result.get("avg_confidence", 95.0)
        bounding_boxes = ocr_result.get("bounding_boxes", [])

        # 3. Field Extraction
        extracted_data = field_extractor.extract_declarations(raw_ocr_text, bounding_boxes)

        # 4. Product Name Resolution
        detected_name = extracted_data.get("product_name", {}).get("value")
        product_name = product_name_override or detected_name or "Packaged Commodity"

        # 5. Rule Engine Evaluation
        evaluation = rule_engine.evaluate(extracted_data)
        compliance_status = evaluation.get("compliance_status", "NON-COMPLIANT")
        compliance_score = evaluation.get("compliance_score", 0.0)
        violations = evaluation.get("violations", [])

        # 6. Database record creation
        inspection = Inspection(
            user_id=user.id,
            product_name=product_name,
            image_path=image_path,
            inspection_date=datetime.datetime.utcnow(),
            compliance_status=compliance_status,
            compliance_score=compliance_score,
            raw_ocr_text=raw_ocr_text,
            extracted_data=extracted_data,
            violations=violations,
            quality_score=quality_score,
            quality_notes=quality_notes,
            created_at=datetime.datetime.utcnow()
        )
        db.add(inspection)
        db.commit()
        db.refresh(inspection)

        # 7. Record Inspection Fields in DB
        for field_name, field_dict in extracted_data.items():
            val = str(field_dict.get("value", ""))
            conf = float(field_dict.get("confidence", 0.0))
            stat = str(field_dict.get("status", "Missing"))
            
            db_field = InspectionField(
                inspection_id=inspection.id,
                field_name=field_name,
                extracted_value=val,
                confidence=conf,
                status=stat
            )
            db.add(db_field)

        # 8. Generate PDF Report immediately
        reports_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "reports")
        os.makedirs(reports_dir, exist_ok=True)
        pdf_path = os.path.join(reports_dir, f"SafeMetric_Report_INS_{inspection.id}.pdf")

        generate_pdf_report(
            inspection_id=inspection.id,
            inspector_name=user.name,
            product_name=product_name,
            compliance_status=compliance_status,
            compliance_score=compliance_score,
            extracted_data=extracted_data,
            violations=violations,
            avg_confidence=avg_confidence,
            image_path=image_path,
            output_pdf_path=pdf_path
        )

        report_rec = Report(
            inspection_id=inspection.id,
            report_path=pdf_path,
            created_at=datetime.datetime.utcnow()
        )
        db.add(report_rec)
        db.commit()
        db.refresh(inspection)

        return inspection


inspection_service = InspectionService()
