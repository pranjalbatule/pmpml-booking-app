from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, get_db
import models, schemas, auth

# Create database tables automatically
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="PMPML Booking API", version="1.0")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the PMPML Booking API! Database connected successfully."}

# 1. User Registration Endpoint
@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = auth.hash_password(user.password)
    new_user = models.User(name=user.name, email=user.email, hashed_password=hashed_pwd)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "User registered successfully", "user_id": new_user.id, "email": new_user.email}

# 2. User Login Endpoint
@app.post("/api/auth/login", response_model=schemas.Token)
def login_user(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# 3. Search Pune PMPML Routes Endpoint
@app.get("/api/routes/search")
def search_routes(source: str, destination: str, db: Session = Depends(get_db)):
    routes = db.query(models.BusRoute).filter(
        models.BusRoute.source_stop.ilike(f"%{source}%"),
        models.BusRoute.destination_stop.ilike(f"%{destination}%")
    ).all()
    
    if not routes:
        return {"message": "No direct buses found for this route search.", "routes": []}
    
    return {"routes": routes}