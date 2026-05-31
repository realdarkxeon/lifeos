from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Settings

settings_router = APIRouter(prefix="/settings", tags=["Settings"])

@settings_router.get("/")
def get_settings(db: Session = Depends(get_db)) -> dict:
    rows = db.query(Settings).all()
    return {r.key: r.value for r in rows}

@settings_router.patch("/")
def update_settings(data: dict, db: Session = Depends(get_db)) -> dict:
    for key, value in data.items():
        row = db.query(Settings).filter(Settings.key == key).first()
        if row:
            row.value = str(value)
        else:
            db.add(Settings(key=key, value=str(value)))
    db.commit()
    rows = db.query(Settings).all()
    return {r.key: r.value for r in rows}
