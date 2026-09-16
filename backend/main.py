from fastapi import FastAPI
from database import engine
import models

# Automatically create tables in MySQL based on models.py
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="PMPML Booking API", version="1.0")

@app.get("/")
def read_root():
    return {"message": "Welcome to the PMPML Booking API! Database connected successfully."}