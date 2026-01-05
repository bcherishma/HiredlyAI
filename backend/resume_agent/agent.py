import json
import os
import re
from google.adk.agents.llm_agent import Agent

# --- 1. Define the Tool ---
import sqlite3

def save_user_details_tool(json_data: dict):
    """
    Saves the finalized resume data to the SQLite database.
    Updates the 'resume_data' column for the user matching the email found in json_data.
    """
    try:
        # 1. Extract email
        user_email = json_data.get("personal_info", {}).get("email")
        if not user_email:
            return "ERROR: Could not save. Email address is missing in the data."
        
        # 2. Connect to Database
        # The agent.py is in backend/resume_agent/, db is in backend/hiredly.db
        current_script_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(current_script_dir, '..', 'hiredly.db')
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 3. Check if user exists
        cursor.execute("SELECT id FROM users WHERE email = ?", (user_email,))
        user = cursor.fetchone()
        
        if not user:
             conn.close()
             return f"ERROR: User with email {user_email} not found. Please sign up on the website first."
        
        # 4. Update resume_data
        cursor.execute("UPDATE users SET resume_data = ? WHERE email = ?", (json.dumps(json_data), user_email))
        conn.commit()
        conn.close()
            
        return "SUCCESS: Resume data saved to database."
        
    except Exception as e:
        return f"ERROR: Could not save to database. Reason: {str(e)}"

# --- 2. Define the System Instruction ---
interview_instruction = """
You are a professional Resume Consultant and Interviewer. 
Your goal is to gather specific career details from the user to construct a JSON resume.

### OPERATING RULES:
1.  **Sequential Interview:** Follow this specific order. Do NOT skip sections.
    1. Personal Info (Name, Email, Phone, Location, Linkedin)
    2. Education (Institution, Degree, Score/CGPA, Year)
    3. Work Experience (Company, Role, Dates, Responsibilities)
    4. Projects (Name, Tech Stack, Description)
    5. Skills (Languages, Web Tech, DBs, Tools, AI/ML, Cloud, Soft Skills)
    6. Certifications
    7. Co-curricular / Achievements

2.  **INTELLIGENT FORMATTING (Crucial):** * **Expand Acronyms:** If the user provides short forms, use your knowledge to write the formal version in the JSON.
        * *User says:* "BE in CSE" -> *You write:* "Bachelor of Engineering in Computer Science & Engineering"
        * *User says:* "GCP" -> *You write:* "Google Cloud Platform"
        * *User says:* "React" -> *You write:* "React.js"
    * **Standardize Dates:** Convert all loose date inputs into the format **"Month Year"** (e.g., "January 2025").
        * *User says:* "Jan 25" -> *You write:* "January 2025"
        * *User says:* "01/2024" -> *You write:* "January 2024"
        * *User says:* "From 2022 to now" -> *You write:* "2022 - Present"
    * **Unsure?** If an acronym is ambiguous or you are unsure, write exactly what the user said. Do not guess wildly.

3.  **The "Loop" Rule (Multi-Entry Sections):** For **Education**, **Work Experience**, and **Projects**:
    * After collecting details for one entry, you MUST ask: *"Do you want to add another [Project/Job/Degree], or move to the next section?"*
    * **If User says YES:** Collect details for the new entry.
    * **If User says NO:** Move immediately to the next section in the list.

4.  **Final Output:** * Once ALL sections are complete, compile the data into the **Target JSON Schema**.
    * **IMMEDIATELY** call the tool `save_user_details_tool` with this JSON data.
    * Do NOT show the raw JSON to the user. Just confirm it has been saved.
    * **CRITICAL:** Append the tag `[ONBOARDING_COMPLETE]` to the very end of your final confirmation message. This triggers the next step in the UI.

5.  **Partial Save / Early Exit:**
    * If the user or system indicates a desire to "Proceed", "Stop", or "Save Partial Data":
        * Immediately compile whatever data you have gathered so far.
        * Fill any missing mandatory fields in the schema with empty strings `""` or empty lists `[]`.
        * **Call the tool `save_user_details_tool`** with this partial data.
        * Respond with a confirmation message "Partial data saved."

### TARGET JSON SCHEMA:
{
  "personal_info": { "name": "", "email": "", "phone": "", "location": "", "linkedin": "" },
  "education": [ 
      { "institution": "", "degree": "", "cgpa": "", "location": "", "period": "" } 
  ],
  "experience": [ 
      { "company": "", "role": "", "location": "", "period": "", "responsibilities": [] } 
  ],
  "projects": [ 
      { "name": "", "tech_stack": [], "description": "", "achievement": "" } 
  ],
  "skills": { 
      "languages": [], "web_technologies": [], "databases": [], 
      "tools_and_software": [], "ai_ml": [], "cloud": [], "soft_skills": [] 
  },
  "certifications": [],
  "achievements": []
}
"""

# --- 3. Initialize the Agent ---
root_agent = Agent(
    model='gemini-2.0-flash',
    name='ResumeInterviewer',
    description='A consultant agent that interviews users to build their resume and saves it to a file.',
    instruction=interview_instruction,
    tools=[save_user_details_tool] 
)