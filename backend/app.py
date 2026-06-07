from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure Gemini API
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("Warning: GEMINI_API_KEY is not set in environment variables.")

genai.configure(api_key=api_key)
model = genai.GenerativeModel("gemini-2.5-flash")

@app.route("/generate", methods=["POST"])
def generate():
    data = request.json
    
    if not data or not all(k in data for k in ("title", "level", "duration")):
        return jsonify({"error": "Missing title, level, or duration in request body"}), 400

    prompt = f"""
    You are a senior software architect and project mentor.

    Project Title: {data['title']}
    Skill Level: {data['level']}
    Duration: {data['duration']}

    Provide a complete project plan in clean markdown. Do not include introductory text, just the content requested.
    Generate:
    1. Project Overview
    2. Recommended Tech Stack
    3. Architecture
    4. Database Design
    5. Folder Structure
    6. Development Roadmap
    7. Interview Questions
    """

    try:
        response = model.generate_content(prompt)
        return jsonify({
            "result": response.text
        })
    except Exception as e:
        import traceback
        error_msg = f"Error calling Gemini API: {e}\n{traceback.format_exc()}"
        print(error_msg, flush=True)
        return jsonify({"error": str(e)}), 500

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    
    if not data or not all(k in data for k in ("context", "question")):
        return jsonify({"error": "Missing context or question in request body"}), 400

    prompt = f"""
    You are Project Pilot, a senior software architect and mentor. 
    The user has a generated project blueprint context below:
    
    --- BLUEPRINT CONTEXT START ---
    {data['context']}
    --- BLUEPRINT CONTEXT END ---
    
    Based ONLY on the blueprint above, answer the user's doubt:
    User Question: {data['question']}
    
    Provide a clear, helpful, and concise answer using markdown. Provide code snippets if relevant.
    """

    try:
        response = model.generate_content(prompt)
        return jsonify({
            "result": response.text
        })
    except Exception as e:
        import traceback
        error_msg = f"Error calling Gemini API for chat: {e}\n{traceback.format_exc()}"
        print(error_msg, flush=True)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False, port=5000)
