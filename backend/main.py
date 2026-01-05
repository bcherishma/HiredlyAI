from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, Float, func, desc
from sqlalchemy.orm import sessionmaker, declarative_base, Session, relationship
from datetime import datetime
import bcrypt
import httpx
import os
import json
import re
from fastapi import File, UploadFile
from fastapi.responses import StreamingResponse
from pypdf import PdfReader
from io import BytesIO
from google import genai
from google.genai import types
from dotenv import load_dotenv
from jinja2 import Environment, FileSystemLoader
from xhtml2pdf import pisa

load_dotenv()

# --- Database Setup ---
DATABASE_URL = "sqlite:///./hiredly.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- Models ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String, nullable=True)
    hashed_password = Column(String)
    resume_data = Column(Text, nullable=True)
    sessions = relationship("InterviewSession", back_populates="user")
    applications = relationship("Application", back_populates="user")

class Application(Base):
    __tablename__ = "applications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    company_name = Column(String)
    role = Column(String)
    status = Column(String) # Applied, Interview Prep, Offer
    job_description = Column(Text)
    # New columns for Analysis Agent results
    ats_score_data = Column(Text, nullable=True)      # JSON: {score, match_reasons, missing_keywords}
    skill_gap_data = Column(Text, nullable=True)      # JSON: {missing_hard_skills, missing_soft_skills}
    resource_data = Column(Text, nullable=True)       # JSON: {recommended_courses, recommended_videos}
    enhanced_resume_data = Column(Text, nullable=True) # JSON: {optimized_resume_data, improvement_summary}
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="applications")

class InterviewSession(Base):
    __tablename__ = "interview_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    duration_seconds = Column(Integer)
    score = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="sessions")

Base.metadata.create_all(bind=engine)

# --- Schemas ---
class UserCreate(BaseModel):
    full_name: str
    email: str
    phone: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class ChatRequest(BaseModel):
    message: str
    userId: str
    sessionId: str
    appName: str

class InitSessionRequest(BaseModel):
    appName: str
    userId: str
    sessionId: str

class UserUpdate(BaseModel):
    resume_data: dict

class SessionCreate(BaseModel):
    user_id: int
    duration_seconds: int
    score: int

class ApplicationCreate(BaseModel):
    user_id: int
    company_name: str
    role: str
    status: str
    job_description: str


# --- Security ---

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

# --- App Setup ---
app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"message": "Hiredly AI Backend is running"}

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = User(
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {
        "message": "User created successfully",
        "user_id": new_user.id,
        "full_name": new_user.full_name
    }

@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {
        "message": "Login successful",
        "user_id": db_user.id,
        "full_name": db_user.full_name
    }

@app.get("/api/profile/{user_id}")
def get_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    resume_data = {}
    if user.resume_data:
        try:
            resume_data = json.loads(user.resume_data)
        except json.JSONDecodeError:
            resume_data = {}

    return {
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "resume_data": resume_data
    }

@app.put("/api/profile/{user_id}")
def update_profile(user_id: int, update_data: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.resume_data = json.dumps(update_data.resume_data)
    db.commit()
    
    return {"message": "Profile updated successfully"}

@app.post("/api/interview/session")
def save_session(session: SessionCreate, db: Session = Depends(get_db)):
    db_session = InterviewSession(
        user_id=session.user_id,
        duration_seconds=session.duration_seconds,
        score=session.score
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return {"message": "Session saved", "id": db_session.id}

@app.get("/api/interview/stats/{user_id}")
def get_interview_stats(user_id: int, db: Session = Depends(get_db)):
    sessions = db.query(InterviewSession).filter(InterviewSession.user_id == user_id).all()
    
    total_sessions = len(sessions)
    total_duration = sum(s.duration_seconds for s in sessions) if sessions else 0
    avg_score = int(sum(s.score for s in sessions) / total_sessions) if total_sessions > 0 else 0
    
    # Format duration (e.g., "1h 30m" or "45m")
    hours = total_duration // 3600
    minutes = (total_duration % 3600) // 60
    
    if hours > 0:
        time_display = f"{hours}h {minutes}m"
    else:
        time_display = f"{minutes}m"
        
    return {
        "sessions_completed": total_sessions,
        "practice_time": time_display,
        "avg_score": avg_score
    }

@app.get("/api/interview/history/{user_id}")
def get_interview_history(user_id: int, db: Session = Depends(get_db)):
    # Get last 5 sessions, ordered by most recent
    sessions = db.query(InterviewSession).filter(InterviewSession.user_id == user_id).order_by(desc(InterviewSession.created_at)).limit(5).all()
    
    history = []
    for s in sessions:
        # Format date (e.g., "Oct 24, 2024")
        date_str = s.created_at.strftime("%b %d, %Y")
        
        # Format duration
        hours = s.duration_seconds // 3600
        minutes = (s.duration_seconds % 3600) // 60
        seconds = s.duration_seconds % 60
        
        if hours > 0:
            duration_str = f"{hours}h {minutes}m"
        elif minutes > 0:
            duration_str = f"{minutes}m {seconds}s"
        else:
            duration_str = f"{seconds}s"
            
        history.append({
            "id": s.id,
            "date": date_str,
            "duration": duration_str,
            "score": s.score
        })
        
    return history


@app.post("/api/applications")
def create_application(application: ApplicationCreate, db: Session = Depends(get_db)):
    db_application = Application(
        user_id=application.user_id,
        company_name=application.company_name,
        role=application.role,
        status=application.status,
        job_description=application.job_description
    )
    db.add(db_application)
    db.commit()
    db.refresh(db_application)
    return {"message": "Application created", "id": db_application.id}

@app.get("/api/applications/{user_id}")
def get_applications(user_id: int, db: Session = Depends(get_db)):
    applications = db.query(Application).filter(Application.user_id == user_id).order_by(desc(Application.created_at)).all()
    return applications

@app.delete("/api/applications/{app_id}")
def delete_application(app_id: int, db: Session = Depends(get_db)):
    application = db.query(Application).filter(Application.id == app_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    db.delete(application)
    db.commit()
    return {"message": "Application deleted"}


class ApplicationUpdate(BaseModel):
    status: str

@app.patch("/api/applications/{app_id}")
def update_application_status(app_id: int, status_update: ApplicationUpdate, db: Session = Depends(get_db)):
    application = db.query(Application).filter(Application.id == app_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    application.status = status_update.status
    db.commit()
    db.refresh(application)
    return {"message": "Application status updated", "status": application.status}

# --- Proxy Endpoints ---

ADK_BASE_URL = "http://127.0.0.1:8008"

@app.post("/api/init_session")
async def init_session(request: InitSessionRequest):
    async with httpx.AsyncClient() as client:
        try:
            url = f"{ADK_BASE_URL}/apps/{request.appName}/users/{request.userId}/sessions/{request.sessionId}"
            # Ensure we send a JSON body (even empty) so proper headers are set and ADK accepts it
            response = await client.post(url, json={})
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat")
async def chat(request: ChatRequest):
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            payload = {
                "appName": request.appName,
                "userId": request.userId,
                "sessionId": request.sessionId,
                "newMessage": {
                    "role": "user",
                    "parts": [
                        {
                            "text": request.message
                        }
                    ]
                }
            }
            print(f"Sending Payload to ADK: {payload}")
            response = await client.post(f"{ADK_BASE_URL}/run", json=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"ADK Exception Type: {type(e)}")
            print(f"ADK Exception Repr: {repr(e)}")
            detail = str(e)
            if hasattr(e, 'response') and e.response is not None:
                print(f"ADK Response Content: {e.response.text}")
                detail = f"{detail} | ADK Response: {e.response.text}"
            raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {detail}")

# --- Optimiser Agent Integration ---

OPTIMISER_AGENT_URL = "http://127.0.0.1:8008"
import uuid

class AnalyzeRequest(BaseModel):
    application_id: int

@app.post("/api/analyze_application")
async def analyze_application(request: AnalyzeRequest, db: Session = Depends(get_db)):
    # 1. Fetch Application & User Data
    application = db.query(Application).filter(Application.id == request.application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    user = db.query(User).filter(User.id == application.user_id).first()
    if not user or not user.resume_data:
        raise HTTPException(status_code=400, detail="User resume not found")

    # 2. Prepare Context
    resume_text = user.resume_data # This is a JSON string
    job_description = application.job_description
    
    prompt = f"""
    Please analyze the following application.
    
    APPLICATION ID: {request.application_id}
    
    JOB DESCRIPTION:
    {job_description}
    
    USER RESUME:
    {resume_text}
    
    Proceed with the sequential analysis (ATS -> Skill Gap -> Resources -> Resume Enhancement).
    """

    # 3. Call Optimiser Agent (Init Session + Run)
    session_id = str(uuid.uuid4())
    user_id_str = str(user.id)
    app_name = "optimiser_agent"
    
    async with httpx.AsyncClient(timeout=300.0) as client: # Longer timeout for sequential chain
        try:
            # A. Init Session
            # URL: /apps/{appName}/users/{userId}/sessions/{sessionId}
            init_url = f"{OPTIMISER_AGENT_URL}/apps/{app_name}/users/{user_id_str}/sessions/{session_id}"
            print(f"Initializing Session: {init_url}")
            init_res = await client.post(init_url, json={})
            init_res.raise_for_status()
            
            # B. Run Agent
            run_url = f"{OPTIMISER_AGENT_URL}/run"
            payload = {
                "appName": app_name,
                "userId": user_id_str,
                "sessionId": session_id,
                "newMessage": {
                    "role": "user",
                    "parts": [{"text": prompt}]
                }
            }
            print(f"Running Analysis Agent: {run_url}")
            run_res = await client.post(run_url, json=payload)
            run_res.raise_for_status()
            
            return {
                "message": "Analysis started successfully",
                "session_id": session_id,
                "agent_response": run_res.json()
            }
            
        except httpx.HTTPError as e:
            print(f"Agent Error: {e}")
            if hasattr(e, 'response') and e.response is not None:
                 print(f"Agent Response: {e.response.text}")
            raise HTTPException(status_code=500, detail=f"Failed to communicate with Analysis Agent: {str(e)}")


# --- Resume Upload & Extraction ---

def extract_resume_data(text: str) -> dict:
    """
    Uses Gemini to extract structured resume data from text.
    """
    client = genai.Client(http_options={'api_version': 'v1alpha'})
    
    prompt = """
    You are an expert resume parser. Extract the following details from the resume text below and return ONLY valid JSON matching this schema:
    {
      "personal_info": { "name": "", "email": "", "phone": "", "location": "", "linkedin": "" },
      "education": [ { "institution": "", "degree": "", "cgpa": "", "location": "", "period": "" } ],
      "experience": [ { "company": "", "role": "", "location": "", "period": "", "responsibilities": [] } ],
      "projects": [ { "name": "", "tech_stack": [], "description": "", "achievement": "" } ],
      "skills": { "languages": [], "web_technologies": [], "databases": [], "tools_and_software": [], "ai_ml": [], "cloud": [], "soft_skills": [] },
      "certifications": [],
      "achievements": []
    }
    
    RULES:
    1. If a field is missing, leave it as empty string or empty list.
    2. Expand acronyms where recognized (e.g., "BE" -> "Bachelor of Engineering").
    3. Return ONLY the JSON. No execution logs or markdown.
    
    RESUME TEXT:
    """ + text

    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config={
                'response_mime_type': 'application/json'
            }
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Extraction Error: {e}")
        return {}

def save_extracted_data(data: dict, db: Session):
    """Saves extracted data to users table in database."""
    try:
        user_email = data.get("personal_info", {}).get("email", "")
        if not user_email:
            raise Exception("Email not found in resume")
            
        user = db.query(User).filter(User.email == user_email).first()
        
        if not user:
            # We strictly only update existing users
            raise Exception(f"User with email {user_email} not found. Please sign up first.")
            
        user.resume_data = json.dumps(data)
        db.commit()
            
        return "resume_updated", user_email, user.full_name
    except Exception as e:
        print(f"Save Error: {e}")
        raise e

@app.post("/api/upload_resume")
async def upload_resume(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        # 1. Read PDF
        content = await file.read()
        pdf_reader = PdfReader(BytesIO(content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
            
        # 2. Extract Data
        extracted_data = extract_resume_data(text)
        
        if not extracted_data:
             raise HTTPException(status_code=500, detail="Failed to extract data from resume")

        # 3. Save Data (Update DB)
        filename, email, name = save_extracted_data(extracted_data, db)
        
        return {
            "success": True, 
            "message": "Resume processed successfully",
            "filename": filename,
            "extracted_email": email,
            "extracted_name": name
        }
        
    except Exception as e:
        print(f"Upload Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- PDF Generation ---

@app.post("/api/generate_pdf/{application_id}")
async def generate_pdf(application_id: int, db: Session = Depends(get_db)):
    # 1. Fetch Application & Data
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
        
    user = db.query(User).filter(User.id == application.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    original_resume_json = user.resume_data
    resume_diff_json = application.enhanced_resume_data
    
    if not original_resume_json or not resume_diff_json:
        raise HTTPException(status_code=400, detail="Resume data or analysis missing. Please run analysis first.")

    # 2. Merge JSONs using Gemini
    # We do this to ensure the final JSON perfectly matches the schema even if the Diff was partial
    client = genai.Client(http_options={'api_version': 'v1alpha'})
    
    merge_prompt = f"""
    You are a JSON Merge Expert.
    
    **TASK:**
    Merge the 'Original Resume' and the 'Resume Diff' into a SINGLE, VALID JSON object representing the final optimized resume.
    
    **RULES:**
    1. The 'Resume Diff' contains changes/improvements. It takes precedence over the Original.
    2. Any fields NOT in the Diff should be kept exactly as they are in the Original.
    3. The Output JSON MUST follow the exact schema required for the resume template.
    4. Ensure 'tech_stack' in projects is a string or list (normalize it if needed).
    
    **ORIGINAL RESUME:**
    {original_resume_json}
    
    **RESUME DIFF:**
    {resume_diff_json}
    
    **OUTPUT:**
    Return ONLY the JSON object.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=merge_prompt,
            config={'response_mime_type': 'application/json'}
        )
        final_resume_json = json.loads(response.text)
        
    except Exception as e:
        print(f"Merge Error: {e}")
        # Fallback: Just use original if merge fails, or maybe try to manual merge? 
        # For now, let's fail to alert the user.
        raise HTTPException(status_code=500, detail=f"Failed to merge resume data: {str(e)}")

    # 3. Render HTML Template
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        template_dir = os.path.join(current_dir, "templates")
        # Ensure template dir exists or use current dir
        if not os.path.exists(template_dir):
             os.makedirs(template_dir, exist_ok=True)
             
        env = Environment(loader=FileSystemLoader(template_dir))
        template = env.get_template("resume_template.html")
        
        # Flatten skills if needed for template convenience, though template handles it
        html_content = template.render(**final_resume_json)
        
    except Exception as e:
        print(f"Template Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to render PDF template: {str(e)}")

    # 4. Generate PDF
    pdf_buffer = BytesIO()
    pisa_status = pisa.CreatePDF(html_content, dest=pdf_buffer)
    
    if pisa_status.err:
        raise HTTPException(status_code=500, detail="PDF generation failed")
        
    pdf_buffer.seek(0)
    
    filename = f"{user.full_name.replace(' ', '_')}_Optimized_Resume.pdf"
    
    return StreamingResponse(
        pdf_buffer, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

