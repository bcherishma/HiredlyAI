import { GoogleGenAI } from '@google/genai';
import { TranscriptionItem, FeedbackReport } from '../types';

export const generateFeedback = async (transcripts: TranscriptionItem[], duration?: string): Promise<FeedbackReport> => {
    if (!process.env.API_KEY) {
        throw new Error("API Key not found");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const conversationText = transcripts.map(t => `${t.sender}: ${t.text}`).join('\n');

    const prompt = `
    You are an expert HR Technical Recruiter. Analyze the provided interview transcript and generate a structured performance report.

    ### Evaluation Criteria:
    1. **Communication Skills:** Clarity, conciseness, and confidence.
    2. **Technical Accuracy:** Correctness of answers and depth of knowledge.
    3. **Interview Etiquette:** Professionalism, active listening, and structure of responses (e.g., STAR method).

    ### Output Requirements:
    - Return ONLY raw JSON. No markdown blocks, no preamble, and no closing remarks.
    - If the transcript is empty, invalid, or contains no candidate responses, return the "Empty State" schema below.
    - Ensure all feedback is actionable and specific to the transcript content.

    ### JSON Schema:
    {
        "strengths": ["Specific example of what they did well"],
        "improvements": ["Specific area where they struggled"],
        "tips": ["Actionable advice for the next interview"],
        "overallScore": number (0-100)
    }

    ### Empty State (If no transcript):
    {
        "strengths": [],
        "improvements": ["No transcript provided for analysis."],
        "tips": ["Please upload or provide a transcript to receive feedback."],
        "overallScore": 0
    }

    Transcript:
    ${conversationText}
  `;

    try {
        const result = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json"
            }
        });

        const responseText = result.text;
        const feedback: FeedbackReport = JSON.parse(responseText || "{}");

        // Ensure all fields exist
        return {
            strengths: feedback.strengths || [],
            improvements: feedback.improvements || [],
            tips: feedback.tips || [],
            overallScore: feedback.overallScore || 0,
            duration: duration
        };

    } catch (error) {
        console.error("Failed to generate feedback:", error);
        // Return a dummy error report or rethrow
        return {
            strengths: ["Could not analyze session."],
            improvements: ["Please check API configuration."],
            tips: ["Try again later."],
            overallScore: 0
        };
    }
};
