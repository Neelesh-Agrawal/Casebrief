# Casebrief — Ship69 Day 59

Fill in what you built and why. Get three outputs instantly:
- A one-line project summary
- A polished case study paragraph
- A LinkedIn post ready to publish

Four audience modes: Portfolio, Client, LinkedIn, Hiring manager.

## Stack
- Vanilla HTML/CSS/JS
- Vercel serverless function
- Groq API (OpenAI-compatible)

## Deploy to Vercel
1. Push to GitHub
2. Import repo in Vercel
3. Add environment variable: `GROQ_API_KEY` = your key
4. Deploy

## Environment variables
| Key | Value |
|-----|-------|
| `GROQ_API_KEY` | Your Groq API key |

## Project structure
```
casebrief/
├── index.html          # Main UI
├── api/
│   └── casebrief.js    # Serverless API route
├── vercel.json         # Routing config
├── .gitignore
└── README.md
```
