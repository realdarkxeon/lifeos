from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.models import TaskStatus

# ── Life Area ──────────────────────────────────────────────────────────────

class LifeAreaCreate(BaseModel):
    name: str
    icon: Optional[str] = None
    color: Optional[str] = None
    order: Optional[int] = 0

class LifeAreaUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    order: Optional[int] = None

class LifeAreaOut(BaseModel):
    id: str
    name: str
    icon: Optional[str]
    color: Optional[str]
    order: int
    created_at: datetime
    model_config = {"from_attributes": True}

# ── Big Goal ───────────────────────────────────────────────────────────────

class BigGoalCreate(BaseModel):
    life_area_id: str
    title: str
    description: Optional[str] = None

class BigGoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class BigGoalOut(BaseModel):
    id: str
    life_area_id: str
    title: str
    description: Optional[str]
    created_at: datetime
    has_active_cycle: bool = False
    active_cycle_id: Optional[str] = None
    model_config = {"from_attributes": True}

# ── Key Result ─────────────────────────────────────────────────────────────

class KeyResultCreate(BaseModel):
    title: str
    unit: Optional[str] = None
    unit_type: Optional[str] = "number"
    target: Optional[float] = None
    order: Optional[int] = 0

class KeyResultUpdate(BaseModel):
    title: Optional[str] = None
    unit: Optional[str] = None
    unit_type: Optional[str] = None
    target: Optional[float] = None
    current: Optional[float] = None
    order: Optional[int] = None

class KeyResultOut(BaseModel):
    id: str
    cycle_id: str
    title: str
    unit: Optional[str]
    unit_type: str
    target: Optional[float]
    current: Optional[float]
    order: int
    created_at: datetime
    model_config = {"from_attributes": True}

# ── Cycle ──────────────────────────────────────────────────────────────────

class CycleCreate(BaseModel):
    big_goal_id: str
    start_date: datetime
    key_results: List[KeyResultCreate]

class CycleOut(BaseModel):
    id: str
    big_goal_id: str
    start_date: datetime
    end_date: datetime
    is_active: bool
    execution_score: Optional[float]
    key_results: List[KeyResultOut] = []
    created_at: datetime
    model_config = {"from_attributes": True}

# ── Task ───────────────────────────────────────────────────────────────────

class TaskCreate(BaseModel):
    cycle_id: str
    key_result_id: Optional[str] = None
    title: str
    notes: Optional[str] = None
    kr_value: Optional[float] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    notes: Optional[str] = None
    key_result_id: Optional[str] = None
    status: Optional[TaskStatus] = None
    is_completed: Optional[bool] = None
    kr_value: Optional[float] = None

class TaskOut(BaseModel):
    id: str
    cycle_id: str
    key_result_id: Optional[str]
    title: str
    notes: Optional[str]
    status: TaskStatus
    is_completed: bool
    sprint_week: Optional[int]
    kr_value: Optional[float]
    created_at: datetime
    completed_at: Optional[datetime]
    model_config = {"from_attributes": True}

# ── Weekly Sprint ──────────────────────────────────────────────────────────

class SprintPull(BaseModel):
    task_ids: List[str]

class SprintReflection(BaseModel):
    reflection: str

class WeeklySprintOut(BaseModel):
    id: str
    cycle_id: str
    week_number: int
    planned_count: int
    completed_count: int
    execution_score: Optional[float]
    reflection: Optional[str]
    tasks: List[TaskOut] = []
    created_at: datetime
    model_config = {"from_attributes": True}

# ── Dashboard ──────────────────────────────────────────────────────────────

class ActiveGoalSummary(BaseModel):
    life_area: LifeAreaOut
    big_goal: BigGoalOut
    cycle: CycleOut
    backlog_count: int
    sprint_tasks: List[TaskOut]
    current_week: int

class DashboardOut(BaseModel):
    active_goals: List[ActiveGoalSummary]
    current_week_sprint: Optional[WeeklySprintOut]
