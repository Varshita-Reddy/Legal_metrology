import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import Base, engine, SessionLocal
from app.routers import (
    auth_router,
    profile_router,
    inspections_router,
    dashboard_router,
    reports_router,
    rules_router
)
from app.demo_seeder import seed_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    Base.metadata.create_all(bind=engine)
    
    # Run seeder for default officer, rules and demo samples
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
        
    yield

app = FastAPI(
    title="SafeMetric – AI Powered Legal Metrology Compliance System",
    description="Regulatory automated label-compliance checking under the Legal Metrology (Packaged Commodities) Rules, 2011.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration allowing web and mobile requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directories for image assets
backend_root = os.path.dirname(os.path.dirname(__file__))
uploads_dir = os.path.join(backend_root, "uploads")
demo_dir = os.path.join(backend_root, "demo_samples")
reports_dir = os.path.join(backend_root, "reports")

os.makedirs(uploads_dir, exist_ok=True)
os.makedirs(demo_dir, exist_ok=True)
os.makedirs(reports_dir, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")
app.mount("/demo_samples", StaticFiles(directory=demo_dir), name="demo_samples")

# Include Routers
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(inspections_router)
app.include_router(dashboard_router)
app.include_router(reports_router)
app.include_router(rules_router)

@app.get("/")
def root():
    return {
        "system": "SafeMetric – AI Powered Legal Metrology Compliance System",
        "status": "ONLINE",
        "rules_edition": "Legal Metrology (Packaged Commodities) Rules, 2011",
        "statutory_act": "Legal Metrology Act, 2009",
        "demo_mode": os.getenv("DEMO_MODE", "true")
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "engine": "FastAPI",
        "db": "SQLite / SQLAlchemy"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
