# Ask AI Integration — MLM LIVE

The updated project contains both deliverables:

1. **MLM LIVE frontend** — a protected `/ask-ai` route, a mobile tab, a desktop sidebar item, image validation/optimization, and a structured prescription result screen.
2. **Cloudflare Worker** — the complete project is in `cloudflare-worker/`, including deployment commands and production notes.

## How the flow works

```text
User selects prescription (maximum 10 MB)
        ↓
Browser resizes and converts it to WEBP
        ↓
Raw WEBP is sent to Cloudflare Worker
        ↓
Worker validates origin, type, signature, and size
        ↓
Worker calls OpenAI Responses API (API key remains server-side)
        ↓
Structured transcription and explanation return to the Ask AI screen
```

## Connect the two projects

1. Follow `cloudflare-worker/README.md` to set `ALLOWED_ORIGINS`, add the `OPENAI_API_KEY` secret, test, and deploy.
2. Copy the deployed Worker base URL.
3. Add it to the MLM LIVE production environment:

```env
VITE_ASK_AI_WORKER_URL=https://mlmlive-prescription-reader.<your-subdomain>.workers.dev
```

4. Build and deploy the frontend:

```bash
npm install
npm run build
```

No OpenAI secret belongs in the frontend environment.

## Model naming

“Gemini mini” is not an OpenAI model. Because the requested architecture ends at OpenAI, this package defaults to the image-capable OpenAI model `gpt-5-mini`. The model is configurable through `OPENAI_MODEL` in `cloudflare-worker/wrangler.jsonc`.

## Important production notes

- AI handwriting transcription can be wrong. The UI and model prompt explicitly tell users to verify medicine names and doses with a doctor or pharmacist.
- The Worker uses `store: false` and does not write images or results to Cloudflare storage.
- Configure Cloudflare WAF/rate limiting before a high-volume public launch.
- Publish appropriate medical-document privacy and consent wording for the regions where the app operates.
