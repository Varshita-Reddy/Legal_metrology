import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    product_name = Column(String(200), default="Packaged Commodity")
    image_path = Column(String(500), nullable=False)
    inspection_date = Column(DateTime, default=datetime.datetime.utcnow)
    compliance_status = Column(String(50), nullable=False) # COMPLIANT, NON-COMPLIANT, REVIEW REQUIRED, PARTIALLY COMPLIANT
    compliance_score = Column(Float, default=0.0)
    raw_ocr_text = Column(Text, default="")
    extracted_data = Column(JSON, default=dict)
    violations = Column(JSON, default=list)
    quality_score = Column(Float, default=100.0)
    quality_notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    inspector = relationship("User", back_populates="inspections")
    fields = relationship("InspectionField", back_populates="inspection", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="inspection", cascade="all, delete-orphan")
