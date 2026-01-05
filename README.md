# Hiredly AI

**Your AI-Powered Career Coach & Interview Simulator**

Hiredly AI is a comprehensive career preparation platform designed to help job seekers stand out. It leverages advanced AI to optimize resumes, identify skill gaps, provide learning resources, and simulate realistic technical interviews with an interactive AI Voice Agent.

## 🚀 Key Features

*   **📄 AI Resume Analysis**: Upload your PDF resume to get instant feedback on ATS compatibility, content quality, and formatting.
*   **✨ Smart Optimization**: Automatically enhances your resume content to better align with specific job descriptions.
*   **🤖 Mock Interviews**: Practice verbal interviews with a lifelike AI Voice Agent that reacts and responds in real-time.
*   **📊 Skill Gap Analysis**: Identifies missing hard and soft skills based on target roles and recommends specific courses and videos.
*   **📥 PDF Generation**: Export your fully optimized and formatted resume as a professional PDF. 
*   **📈 Progress Tracking**: Track your interview scores and practice history over time.

## �🛠️ Tech Stack

### Backend
*   **Language**: Python 3.8+
*   **Framework**: FastAPI
*   **Database**: SQLite (SQLAlchemy ORM)
*   **AI Models**: Google Gemini 2.0 Flash

### Frontend (Main App)
*   **Framework**: React (Vite)
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React

### Interview Agent
*   **Framework**: React (Vite)
*   **3D Graphics**: React Three Fiber (R3F), Drei
*   **Animation**: 3D Avatar integration

## 📋 Prerequisites

Before running the project, ensure you have the following installed:
*   **Python**: v3.8 or higher
*   **Node.js**: v18 or higher
*   **npm** (Node Package Manager)

## 📦 Installation

Clone the repository:
```bash
git clone https://github.com/yourusername/hiredly-ai.git
cd hiredly-ai
```

### 1. Backend Setup
Navigate to the backend directory and set up the Python environment:
```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```
**Environment Variables**: Create a `.env` file in `backend/` and add your keys:
```env
GOOGLE_API_KEY=your_gemini_api_key
```

### 2. Frontend Setup
Navigate to the frontend directory:
```bash
cd frontend
npm install
```
**Environment Variables**: Create a `.env.local` file in `frontend/` if needed (defaults usually work for local dev)

### 3. Interview Agent Setup
Navigate to the interview agent directory:
```bash
cd interview_agent
npm install
```

## ▶️ Running the Application

### Manual Start
You will need three separate terminal instances.

**Terminal 1 (Backend):**
```bash
cd backend
.\venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

**Terminal 3 (Interview Agent):**
```bash
cd interview_agent
npm run dev
```

## 🖼️ Usage Flow
1.  **Register/Login**: Create an account to save your progress.
2.  **Onboarding**: Chat with the AI agent to build your profile or upload an existing resume.
3.  **Dashboard**: View your stats, recent applications, and resume status.
4.  **Optimize**: detailed analysis of your resume against a job description.
5.  **Interview**: Launch the Mock Interview Agent to practice speaking.

## 💻 Screenshots

<p align="center">
  <img src="screenshots/Screenshot%202026-01-05%20142752.png" width="45%" />
  <img src="screenshots/Screenshot%202026-01-05%20142807.png" width="45%" />
</p>
<p align="center">
  <img src="screenshots/Screenshot%202026-01-05%20142843.png" width="45%" />
  <img src="screenshots/Screenshot%202026-01-05%20142907.png" width="45%" />
</p>
