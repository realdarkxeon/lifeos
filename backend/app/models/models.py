from sqlalchemy import Column, String, Boolean, Integer, Float, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import uuid
import enum

Base = declarative_base()

def gen_uuid():
    return str(uuid.uuid4())

class TaskStatus(str, enum.Enum):
    backlog = "backlog"
    sprint = "sprint"
    done = "done"

class LifeArea(Base):
    __tablename__ = "life_areas"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    icon = Column(String, nullable=True)
    color = Column(String, nullable=True)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    big_goals = relationship("BigGoal", back_populates="life_area", cascade="all, delete-orphan")

class BigGoal(Base):
    __tablename__ = "big_goals"

    id = Column(String, primary_key=True, default=gen_uuid)
    life_area_id = Column(String, ForeignKey("life_areas.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    life_area = relationship("LifeArea", back_populates="big_goals")
    cycles = relationship("Cycle", back_populates="big_goal", cascade="all, delete-orphan")

    @property
    def active_cycle(self):
        return next((c for c in self.cycles if c.is_active), None)

class Cycle(Base):
    __tablename__ = "cycles"

    id = Column(String, primary_key=True, default=gen_uuid)
    big_goal_id = Column(String, ForeignKey("big_goals.id"), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    execution_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    big_goal = relationship("BigGoal", back_populates="cycles")
    key_results = relationship("KeyResult", back_populates="cycle", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="cycle", cascade="all, delete-orphan")
    weekly_sprints = relationship("WeeklySprint", back_populates="cycle", cascade="all, delete-orphan")

class KeyResult(Base):
    __tablename__ = "key_results"

    id = Column(String, primary_key=True, default=gen_uuid)
    cycle_id = Column(String, ForeignKey("cycles.id"), nullable=False)
    title = Column(String, nullable=False)
    unit = Column(String, nullable=True)           # e.g. "articles", "hours", "kg"
    unit_type = Column(String, default="number")   # "number" | "boolean" | "percentage"
    target = Column(Float, nullable=True)          # numeric target value
    current = Column(Float, default=0.0)           # current progress value
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    cycle = relationship("Cycle", back_populates="key_results")
    tasks = relationship("Task", back_populates="key_result")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, default=gen_uuid)
    cycle_id = Column(String, ForeignKey("cycles.id"), nullable=False)
    key_result_id = Column(String, ForeignKey("key_results.id"), nullable=True)
    title = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    status = Column(Enum(TaskStatus), default=TaskStatus.backlog)
    is_completed = Column(Boolean, default=False)
    sprint_week = Column(Integer, nullable=True)
    kr_value = Column(Float, nullable=True)        # added to KR.current when completed
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    cycle = relationship("Cycle", back_populates="tasks")
    key_result = relationship("KeyResult", back_populates="tasks")

class WeeklySprint(Base):
    __tablename__ = "weekly_sprints"

    id = Column(String, primary_key=True, default=gen_uuid)
    cycle_id = Column(String, ForeignKey("cycles.id"), nullable=False)
    week_number = Column(Integer, nullable=False)
    planned_count = Column(Integer, default=0)
    completed_count = Column(Integer, default=0)
    execution_score = Column(Float, nullable=True)
    reflection = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    cycle = relationship("Cycle", back_populates="weekly_sprints")

class Settings(Base):
    __tablename__ = "settings"

    id = Column(String, primary_key=True, default=gen_uuid)
    key = Column(String, unique=True, nullable=False)
    value = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
