# Curilens — Screenshot your curiosity. Discover what's real.

An AI-powered curiosity engine that transforms screenshots of intriguing internet content into evidence-backed knowledge.

Users encounter a claim on social media, screenshot it, share it directly to Curilens, and receive a factual analysis, an accurate rewrite, and credible recommendations for further exploration.

**Brand tagline:** Look closer. Learn deeper.

## How it works

1. **Screenshot** an intriguing claim on any app
2. **Share** it to Curilens via the iOS Share Sheet (Apple Shortcuts) or upload directly
3. Curilens **extracts text** using Google Gemini multimodal vision
4. **Identifies and categorizes** individual claims
5. **Verifies** each claim using the Clocked AI verification API
6. **Rewrites** the content into factual and exploratory versions
7. **Recommends** credible books, papers, and articles for deeper exploration

## Technology

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Storage, Edge Functions)
- **AI Provider:** Google Gemini (`@google/genai` SDK) for OCR, claim identification, and rewrites
- **Verification:** Clocked AI API for independent claim verification
- **Mobile Integration:** Apple Shortcuts-based iOS Share Sheet workflow

## Architecture

```
iPhone Screenshot → iOS Share Sheet → Curilens /api/share endpoint
  → Text Extraction (Gemini Vision)
  → Claim Identification (Gemini)
  → Evidence Retrieval
  → Clocked Verification
  → Factual & Exploratory Rewrites (Gemini)
  → Keep Exploring Recommendations
```

## Environment Variables

| Variable | Scope | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Frontend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Supabase anonymous key |
| `GEMINI_API_KEY` | Edge Function (secret) | Google Gemini API key |
| `GEMINI_MODEL` | Edge Function (optional) | Gemini model override (default: `gemini-2.5-flash`) |
| `CLOCKED_API_KEY` | Edge Function (secret) | Clocked AI verification API key |

All API keys are stored as Supabase Edge Function secrets and never exposed in frontend code.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Configure environment variables (see table above)

3. Run the development server:
   ```
   npm run dev
   ```

4. Build for production:
   ```
   npm run build
   ```

## iPhone Share Sheet Setup

See the in-app Share Setup page for step-by-step instructions on creating an Apple Shortcut that sends screenshots directly to Curilens from the iOS Share Sheet.

## Features

- **Home:** Screenshot upload with drag-and-drop, recent analyses
- **Processing:** Live pipeline progress (extraction → claims → research → verification → rewriting)
- **Analysis:** Four-section results — Overview, Claims, Rewrite (factual/exploratory), Keep Exploring
- **Library:** Saved investigations with search and topic filtering
- **Share Setup:** iOS Shortcut configuration instructions
- **Settings:** API connection status, privacy controls, environment variable reference

## Privacy

- Screenshots are stored securely and never displayed publicly
- No public gallery
- Delete anytime — screenshots, claims, sources, and recommendations are permanently removed
- Screenshot contents are only sent to Gemini (OCR + rewrites) and Clocked (verification)

## License

Built for the Clocked AI Build Challenge.
