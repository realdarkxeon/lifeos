from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models.models import BigGoal, Cycle, KeyResult, Task, WeeklySprint, TaskStatus
from app.schemas.schemas import (
    BigGoalCreate, BigGoalUpdate, BigGoalOut,
    CycleCreate, CycleOut,
    KeyResultOut,
    TaskCreate, TaskUpdate, TaskOut,
    SprintPull, SprintReflection, WeeklySprintOut,
    DashboardOut, ActiveGoalSummary, LifeAreaOut
)

# ── Goals ──────────────────────────────────────────────────────────────────

goals_router = APIRouter(prefix="/goals", tags=["Goals"])

@goals_router.post("/", response_model=BigGoalOut)
def create_goal(data: BigGoalCreate, db: Session = Depends(get_db)):
    goal = BigGoal(**data.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    out = BigGoalOut.model_validate(goal)
    out.has_active_cycle = False
    return out

@goals_router.patch("/{goal_id}", response_model=BigGoalOut)
def update_goal(goal_id: str, data: BigGoalUpdate, db: Session = Depends(get_db)):
    goal = db.query(BigGoal).filter(BigGoal.id == goal_id).first()
    if not goal:
        raise HTTPException(404, "Goal not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(goal, k, v)
    db.commit()
    db.refresh(goal)
    out = BigGoalOut.model_validate(goal)
    out.has_active_cycle = goal.active_cycle is not None
    return out

@goals_router.delete("/{goal_id}")
def delete_goal(goal_id: str, db: Session = Depends(get_db)):
    goal = db.query(BigGoal).filter(BigGoal.id == goal_id).first()
    if not goal:
        raise HTTPException(404, "Goal not found")
    db.delete(goal)
    db.commit()
    return {"ok": True}

# ── Cycles ─────────────────────────────────────────────────────────────────

cycles_router = APIRouter(prefix="/cycles", tags=["Cycles"])

@cycles_router.post("/", response_model=CycleOut)
def activate_goal(data: CycleCreate, db: Session = Depends(get_db)):
    goal = db.query(BigGoal).filter(BigGoal.id == data.big_goal_id).first()
    if not goal:
        raise HTTPException(404, "Goal not found")
    # Deactivate any active cycle for any goal in the same life area
    area_goal_ids = db.query(BigGoal.id).filter(BigGoal.life_area_id == goal.life_area_id).subquery()
    db.query(Cycle).filter(
        Cycle.big_goal_id.in_(area_goal_ids),
        Cycle.is_active == True
    ).update({"is_active": False}, synchronize_session=False)

    end_date = data.start_date + timedelta(weeks=12)
    cycle = Cycle(
        big_goal_id=data.big_goal_id,
        start_date=data.start_date,
        end_date=end_date,
        is_active=True
    )
    db.add(cycle)
    db.flush()

    for i, kr in enumerate(data.key_results):
        key_result = KeyResult(cycle_id=cycle.id, order=i, **{k: v for k, v in kr.model_dump().items() if k != "order"})
        db.add(key_result)

    db.commit()
    db.refresh(cycle)
    return cycle

@cycles_router.get("/{cycle_id}", response_model=CycleOut)
def get_cycle(cycle_id: str, db: Session = Depends(get_db)):
    cycle = db.query(Cycle).filter(Cycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(404, "Cycle not found")
    return cycle

@cycles_router.get("/{cycle_id}/tasks", response_model=list[TaskOut])
def get_cycle_tasks(cycle_id: str, status: str = None, db: Session = Depends(get_db)):
    q = db.query(Task).filter(Task.cycle_id == cycle_id)
    if status:
        q = q.filter(Task.status == status)
    return q.all()

# ── Tasks ──────────────────────────────────────────────────────────────────

tasks_router = APIRouter(prefix="/tasks", tags=["Tasks"])

@tasks_router.post("/", response_model=TaskOut)
def create_task(data: TaskCreate, db: Session = Depends(get_db)):
    task = Task(**data.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@tasks_router.patch("/{task_id}", response_model=TaskOut)
def update_task(task_id: str, data: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task not found")

    updates = data.model_dump(exclude_unset=True)
    was_completed = task.is_completed
    old_sprint_week = task.sprint_week
    old_cycle_id = task.cycle_id

    going_to_backlog = (
        updates.get("status") == TaskStatus.backlog
        and task.status != TaskStatus.backlog
    )
    explicit_uncomplete = updates.get("is_completed") is False

    # Single source of truth: task is being uncompleted if either the
    # client explicitly said so, or it's moving to backlog while it was
    # previously completed. This fires the KR decrement exactly once.
    should_uncomplete = was_completed and (explicit_uncomplete or going_to_backlog)

    going_to_complete = updates.get("is_completed") is True and not was_completed

    try:
        if going_to_complete:
            updates["completed_at"] = datetime.utcnow()

        if should_uncomplete:
            updates["is_completed"] = False
            updates["completed_at"] = None
            updates.setdefault("status", TaskStatus.sprint if not going_to_backlog else TaskStatus.backlog)
            if task.key_result_id and task.kr_value:
                kr = db.query(KeyResult).filter(KeyResult.id == task.key_result_id).first()
                if kr:
                    kr.current = max(0.0, (kr.current or 0.0) - task.kr_value)

        if going_to_backlog:
            updates["sprint_week"] = None

        for k, v in updates.items():
            setattr(task, k, v)

        if old_sprint_week:
            sprint = db.query(WeeklySprint).filter(
                WeeklySprint.cycle_id == old_cycle_id,
                WeeklySprint.week_number == old_sprint_week
            ).first()
            if sprint:
                sprint_qs = db.query(Task).filter(
                    Task.cycle_id == old_cycle_id,
                    Task.sprint_week == old_sprint_week
                )
                sprint.planned_count = sprint_qs.count()
                sprint.completed_count = sprint_qs.filter(Task.is_completed == True).count()
                sprint.execution_score = (
                    round(sprint.completed_count / sprint.planned_count * 100, 1)
                    if sprint.planned_count else None
                )

        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(task)
    return task

@tasks_router.delete("/{task_id}")
def delete_task(task_id: str, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task not found")
    db.delete(task)
    db.commit()
    return {"ok": True}

# ── Weekly Sprint ──────────────────────────────────────────────────────────

sprint_router = APIRouter(prefix="/sprints", tags=["Sprint"])

def _current_week(cycle: Cycle) -> int:
    delta = datetime.utcnow() - cycle.start_date
    return min(max(delta.days // 7 + 1, 1), 12)

@sprint_router.post("/{cycle_id}/pull", response_model=WeeklySprintOut)
def pull_sprint(cycle_id: str, data: SprintPull, db: Session = Depends(get_db)):
    cycle = db.query(Cycle).filter(Cycle.id == cycle_id, Cycle.is_active == True).first()
    if not cycle:
        raise HTTPException(404, "Active cycle not found")

    week = _current_week(cycle)
    sprint = db.query(WeeklySprint).filter(
        WeeklySprint.cycle_id == cycle_id,
        WeeklySprint.week_number == week
    ).first()
    if not sprint:
        sprint = WeeklySprint(cycle_id=cycle_id, week_number=week)
        db.add(sprint)
        db.flush()

    tasks = db.query(Task).filter(Task.id.in_(data.task_ids)).all()
    for task in tasks:
        task.status = TaskStatus.sprint
        task.sprint_week = week

    sprint.planned_count = len(tasks)
    db.commit()
    db.refresh(sprint)
    sprint.tasks = tasks
    return sprint

@sprint_router.post("/{cycle_id}/complete/{task_id}", response_model=TaskOut)
def complete_task(cycle_id: str, task_id: str, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id, Task.cycle_id == cycle_id).first()
    if not task:
        raise HTTPException(404, "Task not found")
    task.is_completed = True
    task.status = TaskStatus.done
    task.completed_at = datetime.utcnow()

    if task.key_result_id and task.kr_value:
        kr = db.query(KeyResult).filter(KeyResult.id == task.key_result_id).first()
        if kr:
            kr.current = (kr.current or 0.0) + task.kr_value

    # Update sprint score
    cycle = db.query(Cycle).filter(Cycle.id == cycle_id).first()
    week = _current_week(cycle)
    sprint = db.query(WeeklySprint).filter(
        WeeklySprint.cycle_id == cycle_id,
        WeeklySprint.week_number == week
    ).first()
    if sprint:
        sprint.completed_count = db.query(Task).filter(
            Task.cycle_id == cycle_id,
            Task.sprint_week == week,
            Task.is_completed == True
        ).count()
        if sprint.planned_count:
            sprint.execution_score = round(sprint.completed_count / sprint.planned_count * 100, 1)

    db.commit()
    db.refresh(task)
    return task

@sprint_router.post("/{cycle_id}/reflect", response_model=WeeklySprintOut)
def add_reflection(cycle_id: str, data: SprintReflection, db: Session = Depends(get_db)):
    cycle = db.query(Cycle).filter(Cycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(404, "Cycle not found")
    week = _current_week(cycle)
    sprint = db.query(WeeklySprint).filter(
        WeeklySprint.cycle_id == cycle_id,
        WeeklySprint.week_number == week
    ).first()
    if not sprint:
        sprint = WeeklySprint(cycle_id=cycle_id, week_number=week)
        db.add(sprint)
    sprint.reflection = data.reflection
    db.commit()
    db.refresh(sprint)
    return sprint

# ── Dashboard ──────────────────────────────────────────────────────────────

dashboard_router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@dashboard_router.get("/", response_model=DashboardOut)
def get_dashboard(db: Session = Depends(get_db)):
    active_cycles = db.query(Cycle).options(joinedload(Cycle.key_results)).filter(Cycle.is_active == True).all()
    summaries = []
    print("ACTIVE CYCLES:", active_cycles)
    for cycle in active_cycles:
        goal = cycle.big_goal
        area = goal.life_area
        week = _current_week(cycle)
        backlog_count = db.query(Task).filter(
            Task.cycle_id == cycle.id,
            Task.status == TaskStatus.backlog
        ).count()
        sprint_tasks = db.query(Task).filter(
            Task.cycle_id == cycle.id,
            Task.sprint_week == week
        ).all()
        summaries.append(ActiveGoalSummary(
            life_area=LifeAreaOut.model_validate(area),
            big_goal=BigGoalOut.model_validate(goal),
            cycle=CycleOut.model_validate(cycle),
            backlog_count=backlog_count,
            sprint_tasks=[TaskOut.model_validate(t) for t in sprint_tasks],
            current_week=week
        ))

    # Current week sprint (first active cycle for now)
    current_sprint = None
    if active_cycles:
        cycle = active_cycles[0]
        week = _current_week(cycle)
        sprint = db.query(WeeklySprint).filter(
            WeeklySprint.cycle_id == cycle.id,
            WeeklySprint.week_number == week
        ).first()
        if sprint:
            sprint_tasks = db.query(Task).filter(
                Task.cycle_id == cycle.id,
                Task.sprint_week == week
            ).all()
            current_sprint = WeeklySprintOut.model_validate(sprint)
            current_sprint.tasks = [TaskOut.model_validate(t) for t in sprint_tasks]

    return DashboardOut(active_goals=summaries, current_week_sprint=current_sprint)

# ── Key Results ────────────────────────────────────────────────────────────

from app.schemas.schemas import KeyResultUpdate

kr_router = APIRouter(prefix="/key-results", tags=["Key Results"])

@kr_router.patch("/{kr_id}", response_model=KeyResultOut)
def update_key_result(kr_id: str, data: KeyResultUpdate, db: Session = Depends(get_db)):
    kr = db.query(KeyResult).filter(KeyResult.id == kr_id).first()
    if not kr:
        raise HTTPException(404, "Key result not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(kr, k, v)
    db.commit()
    db.refresh(kr)
    return kr
