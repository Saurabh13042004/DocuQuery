from fastapi import FastAPI
from app.api.routes import router
from app.database import engine, Base

app = FastAPI()

@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)

@app.on_event("shutdown")
async def shutdown():
    pass

app.include_router(router)