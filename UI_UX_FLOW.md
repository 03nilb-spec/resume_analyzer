# Phase 1 UI/UX Flow

## User Journey

The first screen is the analyzer workspace. The user uploads a resume, optionally pastes a job description, clicks Analyze Resume, and sees a dashboard with ATS-style scoring and improvement guidance.

## Page States

- Empty state: shows the upload panel and a results placeholder explaining what the dashboard will contain.
- Ready state: a valid PDF or DOCX is selected and the Analyze Resume button is available.
- Loading state: the button shows an analyzing state while the file is parsed and scored.
- Results state: the dashboard shows the overall score, score breakdown, matched skills, missing skills, suggestions, strengths, formatting issues, and detected sections.
- Error state: validation or parsing problems appear beside the form without storing the uploaded content.

## Upload Behavior

- Supported formats: PDF and DOCX.
- Maximum size: 5 MB.
- Files are sent to the analysis API as multipart form data.
- Uploaded files and extracted text are not persisted to a database in Phase 1.

## Optional Job Description Behavior

- If a JD is provided, keyword matching and missing skills are calculated against the JD.
- If no JD is provided, the analyzer uses broad cross-field skill signals and general resume quality checks.
- The UI remains the same in both modes, but missing skills will usually be more specific when a JD is present.

## Dashboard Layout

- Overall ATS score is the primary visual focus.
- Category cards explain the weighted scoring model:
  - Keyword match: 40%
  - Semantic similarity: 30%
  - Experience relevance: 20%
  - Formatting: 10%
- Detail sections help the user act on the score instead of only seeing a number.

## Error States

- Unsupported file type: ask for PDF or DOCX.
- Oversized file: ask for a file under 5 MB.
- Empty or scanned resume: explain that the resume text is too short to analyze.
- Parsing failure: ask the user to try another text-based PDF or DOCX.
