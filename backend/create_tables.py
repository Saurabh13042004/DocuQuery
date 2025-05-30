from app.database import engine
from app import models

# This will drop all tables and recreate them with the current models
models.Base.metadata.drop_all(bind=engine)
models.Base.metadata.create_all(bind=engine)

print("Database tables recreated successfully!")