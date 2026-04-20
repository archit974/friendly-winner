# Resume Feedback Studio

Full-stack resume feedback tool with:

- polished frontend interface
- backend API built with Node.js
- resume scoring and feedback generation
- persistent local storage for review sessions

## Features

- multi-screen UI with overview, review studio, and feedback vault
- PDF upload with embedded-text extraction plus OCR fallback for scanned resume PDFs
- working buttons for sample loading, clearing forms, feedback generation, refresh, and JSON download
- structured scoring across ATS readiness, impact, skills, structure, and role alignment
- local JSON persistence in `data/submissions.json`

## Run locally

```bash
npm start
```

Open `http://localhost:3000`
