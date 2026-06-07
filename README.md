# ProjectPilot AI – AI-Powered Project Mentor for Students

ProjectPilot AI acts as a virtual project mentor, helping students overcome the struggle of choosing project ideas, selecting tech stacks, and planning development stages. 

## Features
- **Project Planner:** Get a full overview of your idea with recommended tech stacks and a weekly timeline.
- **Architecture Generator:** Understand the structural design of your frontend, backend, and database.
- **Database Designer:** See the suggested entities and schemas.
- **Interview Preparation:** Get mock interview questions tailored to your tech choices.

## Tech Stack
- **Frontend:** React, Tailwind CSS, Vite
- **Backend:** Python, Flask, Flask-CORS
- **AI Integration:** Google Gemini API (gemini-1.5-flash)

## Quick Start

### 1. Backend Setup
1. Navigate to the `backend/` directory.
2. Create a `.env` file and add your `GEMINI_API_KEY`.
3. Install dependencies: `pip install -r requirements.txt`
4. Start the server: `python app.py`

### 2. Frontend Setup
1. Navigate to the `frontend/` directory.
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`
4. Open the localhost link in your browser!

## Folder Structure
```text
projectpilot-ai/
├── frontend/          # React + Vite application
│   ├── src/           # UI Components and pages
│   ├── index.html
│   └── package.json
├── backend/           # Flask API
│   ├── app.py         # Main API routes
│   ├── requirements.txt
│   └── .env           # API Keys
└── README.md
```
