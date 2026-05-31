from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import init_db
from app.routers.routes import goals_router, cycles_router, tasks_router, sprint_router, dashboard_router, kr_router
from app.routers.life_areas import router as life_areas_router
from app.routers.settings import settings_router

app = FastAPI(title="LifeOS API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

app.include_router(life_areas_router)
app.include_router(goals_router)
app.include_router(cycles_router)
app.include_router(kr_router)
app.include_router(tasks_router)
app.include_router(sprint_router)
app.include_router(dashboard_router)
app.include_router(settings_router)

@app.get("/health")
def health():
    return {"status": "ok"}
