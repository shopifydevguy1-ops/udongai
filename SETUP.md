# Quick Setup Guide

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Environment Variables

Create a `.env.local` file in the root directory with at least one LLM provider API key:

```env
# Required: At least one provider
GROQ_API_KEY=your_groq_api_key
# OR
OPENROUTER_API_KEY=your_openrouter_api_key
# OR
HUGGINGFACE_API_KEY=your_huggingface_api_key

# Optional
WORKSPACE_ROOT=/path/to/your/project
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Getting API Keys

- **Groq**: https://console.groq.com (Free tier available, recommended)
- **OpenRouter**: https://openrouter.ai (Free tier available)
- **HuggingFace**: https://huggingface.co/settings/tokens

## 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 4. Deploy to Vercel

1. Push to GitHub
2. Import in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Features

✅ VS Code-like interface  
✅ Multi-LLM provider support  
✅ Credit-safe token management  
✅ File explorer  
✅ Context-aware AI chat  
✅ Rate limiting  

## Troubleshooting

- **No API response**: Check API keys are set correctly
- **File access errors**: Verify WORKSPACE_ROOT path
- **Token limit errors**: System auto-adjusts, but you can reduce maxTokens

