from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import LifeArea, BigGoal
from app.schemas.schemas import LifeAreaCreate, LifeAreaUpdate, LifeAreaOut, BigGoalOut

router = APIRouter(prefix="/life-areas", tags=["Life Areas"])

@router.get("/", response_model=list[LifeAreaOut])
def list_life_areas(db: Session = Depends(get_db)):
    return db.query(LifeArea).order_by(LifeArea.order).all()

@router.post("/", response_model=LifeAreaOut)
def create_life_area(data: LifeAreaCreate, db: Session = Depends(get_db)):
    area = LifeArea(**data.model_dump())
    db.add(area)
    db.commit()
    db.refresh(area)
    return area

@router.patch("/{area_id}", response_model=LifeAreaOut)
def update_life_area(area_id: str, data: LifeAreaUpdate, db: Session = Depends(get_db)):
    area = db.query(LifeArea).filter(LifeArea.id == area_id).first()
    if not area:
        raise HTTPException(status_code=404, detail="Life area not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(area, k, v)
    db.commit()
    db.refresh(area)
    return area

@router.delete("/{area_id}")
def delete_life_area(area_id: str, db: Session = Depends(get_db)):
    area = db.query(LifeArea).filter(LifeArea.id == area_id).first()
    if not area:
        raise HTTPException(status_code=404, detail="Life area not found")
    db.delete(area)
    db.commit()
    return {"ok": True}

@router.get("/{area_id}/goals", response_model=list[BigGoalOut])
def list_goals_for_area(area_id: str, db: Session = Depends(get_db)):
    goals = db.query(BigGoal).filter(BigGoal.life_area_id == area_id).all()
    result = []
    for g in goals:
        out = BigGoalOut.model_validate(g)
        ac = g.active_cycle
        out.has_active_cycle = ac is not None
        out.active_cycle_id = ac.id if ac else None
        result.append(out)
    return result
