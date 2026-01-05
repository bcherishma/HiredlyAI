from google.adk.agents.llm_agent import Agent
from google.adk.agents.sequential_agent import SequentialAgent
import sqlite3
import json
import os

# --- 0. Shared Tool for Saving Results ---
def save_analysis_step(application_id: int, step_name: str, result_data: str):
    """
    Saves the JSON result of an analysis step to the database.
    Args:
        application_id (int): The ID of the application.
        step_name (str): One of 'ats_score', 'skill_gap', 'resources', 'enhanced_resume'.
        result_data (str): The JSON data as a serialized STRING.
    """
    column_map = {
        'ats_score': 'ats_score_data',
        'skill_gap': 'skill_gap_data',
        'resources': 'resource_data',
        'enhanced_resume': 'enhanced_resume_data'
    }
    
    if step_name not in column_map:
        return f"ERROR: Invalid step_name '{step_name}'."
        
    try:
        # Parse the input string to ensure it's valid JSON before saving
        # Though we save it as a string in DB anyway, this acts as validation
        parsed_data = json.loads(result_data)
        
        current_script_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(current_script_dir, '..', 'hiredly.db')
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT id FROM applications WHERE id = ?", (application_id,))
        if not cursor.fetchone():
             conn.close()
             return f"ERROR: Application ID {application_id} not found."
             
        target_column = column_map[step_name]
        query = f"UPDATE applications SET {target_column} = ? WHERE id = ?"
        
        # We save the raw string (which we confirmed is valid JSON)
        cursor.execute(query, (result_data, application_id))
        conn.commit()
        conn.close()
        
        return f"SUCCESS: Saved {step_name} result for Application {application_id}."
        
    except json.JSONDecodeError as e:
        return f"ERROR: Invalid JSON string provided: {str(e)}"
    except Exception as e:
        return f"ERROR: Database write failed: {str(e)}"

# --- 1. Analysis Agents (Pure Logic, No Tools) ---

ats_agent = Agent(
    model='gemini-2.0-flash',
    name='ATS_Scorer',
    description='Evaluates the resume against the job description.',
    instruction="""
    You are an expert Application Tracking System (ATS) evaluator.
    
    **INPUTS:**
    - Context (Application ID, User Resume, Job Description)
    
    **TASK:**
    1. Analyze the resume against the job description.
    2. Calculate a match score (0-100).
    3. Identify critical missing keywords and specific match reasons.
    
    **OUTPUT FORMAT:**
    - Return **ONLY** the JSON object. 
    - No markdown formatting.
    
    **JSON STRUCTURE:**
    {
        "score": 75,
        "match_reasons": ["..."],
        "missing_keywords": ["..."],
        "formatting_issues": ["..."]
    }
    """,
    output_key='ats_result'
)

skill_gap_agent = Agent(
    model='gemini-2.0-flash',
    name='Skill_Gap_Analyst',
    description='Identifies hard and soft skill gaps.',
    instruction="""
    You are a Senior Technical Recruiter.
    
    **TASK:**
    Identify hard/soft skills missing in the resume but required by the JD.
    
    **OUTPUT FORMAT:**
    - Return **ONLY** the JSON object.
    
    **JSON STRUCTURE:**
    {
        "missing_hard_skills": [{"skill": "...", "priority": "High"}],
        "missing_soft_skills": [{"skill": "...", "priority": "Low"}]
    }
    """,
    output_key='skill_gap_result'
)

resource_agent = Agent(
    model='gemini-2.0-flash',
    name='Resource_Recommender',
    description='Recommends learning resources for missing skills.',
    instruction="""
    You are an AI Learning Specialist.
    
    **INPUTS:**
    - List of Missing Skills (from previous agent)
    
    **TASK:**
    Recommend courses and YouTube videos for the top missing hard skills.
    
    **OUTPUT FORMAT:**
    - Return **ONLY** the JSON object.
    
    **JSON STRUCTURE:**
    {
        "recommended_courses": [{"title": "...", "provider": "...", "duration": "...", "skill": "..."}],
        "recommended_videos": [{"title": "...", "channel": "...", "views": "...", "skill": "..."}]
    }
    """,
    output_key='resource_result'
)

resume_enhancer_agent = Agent(
    model='gemini-2.0-flash',
    name='Resume_Enhancer',
    description='Generates an optimized resume and saves it.',
    instruction="""
    **ROLE:** Professional Resume Writer & Optimization Expert

    **INPUTS:**
    original_resume_json: The full JSON structure of the current resume.
    job_description: The target role details.
    missing_keywords: Keywords identified by the ATS Agent.

    **TASK:**
    Analyze & Align: Review the entire resume (Summary, Experience, Projects, Skills, etc.) against the Job Description and missing keywords.
    Strategic Rewrite: Rewrite relevant sections to naturally incorporate missing keywords. You may modify any field (e.g., Project descriptions, Bullet points, Professional Summaries) to better align with the JD.
    Truthfulness Constraint: Do not hallucinate new technologies, roles, or responsibilities. Only rephrase or emphasize existing information found in the original_resume_json.
    Structural Integrity: Use the exact same keys and nesting structure as the original_resume_json. If a key is named work_history, do not change it to experience.
    Output Generation: Create a JSON Diff containing only the objects/fields that have been modified, ensuring they map perfectly to the original schema.

    **CRITICAL**:
    Validate the JSON string for syntax errors before sending.
    If a section requires no changes to align with the JD, omit it from the diff.
    """,
    tools=[save_analysis_step],
    output_key='enhanced_resume_result'
)

def create_db_saver_agent(suffix: str):
    return Agent(
        model='gemini-2.0-flash',
        name=f'DB_Saver_{suffix}',
        description=f'Saves the {suffix} analysis results to the database.',
        instruction="""
        You are the Database Storage Agent.

        **INPUTS:**
        - The JSON output from the *immediately preceding* agent.
        - The Conversation History (find `application_id`).

        **TASK:**
        1. **Identify Data Type**:
            - `score`, `missing_keywords` -> `step_name='ats_score'`
            - `missing_hard_skills` -> `step_name='skill_gap'`
            - `recommended_courses` -> `step_name='resources'`
            - `optimized_resume_data` -> `step_name='enhanced_resume'`

        2. **Identify Application ID**: Look for `application_id` in the conversation history.

        3. **Save to DB**: Call `save_analysis_step(application_id, step_name, result_data)`.
           - **CRITICAL**: `result_data` MUST be passed as a **JSON STRING**, not a dictionary or object.
           - Take the exact output from the previous agent and serialize it to a JSON string if needed, or pass it as a raw string if it's already text.
           - Do NOT truncate or summarize the data.
        """,
        tools=[save_analysis_step]
    )

# --- 3. Sequential Orchestrator ---
root_agent = SequentialAgent(
    name='application_optimiser',
    description='Sequential workflow with interleaved DB saving.',
    sub_agents=[
        ats_agent, create_db_saver_agent('ATS'),
        skill_gap_agent, create_db_saver_agent('SkillGap'),
        resource_agent, create_db_saver_agent('Resource'),
        resume_enhancer_agent, create_db_saver_agent('Resume')
    ]
)
