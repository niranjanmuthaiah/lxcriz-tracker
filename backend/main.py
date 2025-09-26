from fastapi import FastAPI, HTTPException, Query, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Optional
import hashlib
import jwt
from datetime import datetime, timedelta
import json

app = FastAPI(title="Lxcriz Tracker API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple secret key and settings
SECRET_KEY = "lxcriz-secret-2025"
ALGORITHM = "HS256"

# Simple in-memory storage
users_db = {}
user_expenses = {}
next_id = 1

security = HTTPBearer(auto_error=False)

# Simple password hashing (for demo - use bcrypt in production)
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def create_token(username: str) -> str:
    payload = {
        "sub": username,
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if not credentials:
        raise HTTPException(401, "Authorization required")
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username or username not in users_db:
            raise HTTPException(401, "Invalid token")
        return username
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.JWTError:
        raise HTTPException(401, "Invalid token")

# Models
class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    full_name: str

class UserLogin(BaseModel):
    username: str
    password: str

class ExpenseCreate(BaseModel):
    description: str
    amount: float
    category: str
    notes: Optional[str] = None

# Routes
@app.get("/")
def read_root():
    return {"message": "Lxcriz Tracker API", "version": "1.0.0"}

@app.post("/register")
def register(user: UserRegister):
    if user.username in users_db:
        raise HTTPException(400, "Username already exists")
    
    users_db[user.username] = {
        "username": user.username,
        "email": user.email,
        "password_hash": hash_password(user.password),
        "full_name": user.full_name
    }
    
    user_expenses[user.username] = []
    
    token = create_token(user.username)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name
        }
    }

@app.post("/login")
def login(user: UserLogin):
    if user.username not in users_db:
        raise HTTPException(401, "Invalid username or password")
    
    stored_user = users_db[user.username]
    if not verify_password(user.password, stored_user["password_hash"]):
        raise HTTPException(401, "Invalid username or password")
    
    token = create_token(user.username)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "username": stored_user["username"],
            "email": stored_user["email"],
            "full_name": stored_user["full_name"]
        }
    }

@app.get("/me")
def get_me(current_user: str = Depends(get_current_user)):
    user = users_db[current_user]
    return {
        "username": user["username"],
        "email": user["email"],
        "full_name": user["full_name"]
    }

@app.get("/expenses")
def get_expenses(current_user: str = Depends(get_current_user)):
    if current_user not in user_expenses:
        user_expenses[current_user] = []
    return user_expenses[current_user]

@app.post("/expenses")
def create_expense(expense: ExpenseCreate, current_user: str = Depends(get_current_user)):
    global next_id
    
    if current_user not in user_expenses:
        user_expenses[current_user] = []
    
    now = datetime.now()
    new_expense = {
        "id": next_id,
        "description": expense.description,
        "amount": expense.amount,
        "category": expense.category,
        "notes": expense.notes,
        "date": now.strftime("%Y-%m-%d"),
        "created_at": now.isoformat()
    }
    
    user_expenses[current_user].append(new_expense)
    next_id += 1
    
    return new_expense

@app.put("/expenses/{expense_id}")
def update_expense(expense_id: int, expense: ExpenseCreate, current_user: str = Depends(get_current_user)):
    if current_user not in user_expenses:
        raise HTTPException(404, "Expense not found")
    
    for i, exp in enumerate(user_expenses[current_user]):
        if exp["id"] == expense_id:
            user_expenses[current_user][i].update({
                "description": expense.description,
                "amount": expense.amount,
                "category": expense.category,
                "notes": expense.notes
            })
            return user_expenses[current_user][i]
    
    raise HTTPException(404, "Expense not found")

@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, current_user: str = Depends(get_current_user)):
    if current_user not in user_expenses:
        raise HTTPException(404, "Expense not found")
    
    initial_count = len(user_expenses[current_user])
    user_expenses[current_user] = [exp for exp in user_expenses[current_user] if exp["id"] != expense_id]
    
    if len(user_expenses[current_user]) == initial_count:
        raise HTTPException(404, "Expense not found")
    
    return {"message": "Expense deleted successfully"}
