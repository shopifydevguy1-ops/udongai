# AI Dev Agent

A production-ready AI development agent with VS Code-like interface, multi-LLM provider support, and credit-safe token management.

## Features

- 🎨 **VS Code-like Interface**: Familiar editor experience with Monaco Editor
- 🤖 **Multi-LLM Support**: Groq, OpenRouter, and HuggingFace with automatic fallback
- 💰 **Credit-Safe**: Automatic model downgrading and token limits to prevent unexpected costs
- 📁 **File Explorer**: Browse and edit local project files
- 💬 **Context-Aware Chat**: AI assistant that sees your open files
- 🔒 **Rate Limiting**: Built-in protection against excessive API usage
- ⚡ **Fast & Reliable**: Optimized for daily professional use

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Monaco Editor
- **State**: Zustand
- **Backend**: Vercel Serverless Functions
- **LLM Providers**: Groq, OpenRouter, HuggingFace

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- API keys for at least one LLM provider (Groq, OpenRouter, or HuggingFace)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd ai-dev-agent
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file:
```bash
cp .env.example .env.local
```

4. Add your API keys to `.env.local`:
```env
# At least one provider is required
GROQ_API_KEY=your_groq_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key

# Optional: Set workspace root (defaults to current directory)
WORKSPACE_ROOT=/path/to/your/project

# Optional: App URL for OpenRouter
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

### LLM Providers

The system supports three providers with automatic fallback:

1. **Groq** (Recommended for speed)
   - Free tier available
   - Fast inference
   - Get API key: https://console.groq.com

2. **OpenRouter** (Recommended for variety)
   - Access to multiple models
   - Free tier available
   - Get API key: https://openrouter.ai

3. **HuggingFace** (Alternative)
   - Open-source models
   - Get API key: https://huggingface.co/settings/tokens

### Model Selection

The system automatically selects models based on:
- Request complexity (token count)
- Cost optimization (prefers free tier)
- Automatic fallback if a provider fails

Models are configured in `lib/models.ts`. Default behavior:
- Simple requests → Free tier
- Medium requests → Free tier (fallback to mid)
- Complex requests → Mid tier (fallback to free)

### Token Limits

Safety limits are configured in `lib/token-manager.ts`:
- **MAX_TOKENS_PER_REQUEST**: 4096 (hard cap)
- **WARNING_THRESHOLD**: 3072 (warning before limit)
- **SAFE_DEFAULT**: 2048 (default max tokens)

The system will automatically:
- Reduce `max_tokens` if a request exceeds limits
- Warn when approaching limits
- Track usage per session

## Project Structure

```
├── app/
│   ├── api/          # API routes (chat, files)
│   ├── globals.css   # Global styles
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Main page
├── components/       # React components
│   ├── ChatPanel.tsx
│   ├── CodeEditor.tsx
│   ├── FileExplorer.tsx
│   ├── StatusBar.tsx
│   ├── TabBar.tsx
│   └── TerminalPanel.tsx
├── lib/
│   ├── llm/          # LLM provider implementations
│   │   ├── providers/
│   │   └── router.ts
│   ├── models.ts     # Model registry
│   ├── token-manager.ts
│   └── utils.ts
├── store/            # Zustand state management
│   └── useAppStore.ts
└── types/            # TypeScript types
    └── index.ts
```

## Usage

### Opening Files

1. Use the file explorer in the left sidebar
2. Click on any file to open it in the editor
3. Multiple files can be open in tabs

### Chat with AI

1. Open files you want the AI to see
2. Type your question in the chat panel
3. The AI will have context from all open files
4. Token usage is tracked and displayed

### Code Editing

- Use Monaco Editor (VS Code engine) for syntax highlighting
- Auto-detects language from file extension
- Changes are tracked in state (not saved to disk automatically)

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

The app is optimized for Vercel's serverless functions.

## Security Notes

- API keys are never exposed to the client
- File access is restricted to workspace root
- Rate limiting prevents abuse
- Token limits prevent unexpected costs

## Cost Management

The system is designed to be cost-safe:

1. **Default to Free Models**: Always tries free tier first
2. **Token Caps**: Hard limits prevent runaway costs
3. **Automatic Downgrading**: Falls back to cheaper models
4. **Usage Tracking**: Monitor token usage in real-time
5. **Rate Limiting**: Prevents excessive API calls

## Development

### Adding a New LLM Provider

1. Create a new provider class in `lib/llm/providers/`
2. Extend `BaseProvider` from `base.ts`
3. Implement `chat()` and `isAvailable()` methods
4. Register in `lib/llm/router.ts`

### Customizing Models

Edit `lib/models.ts` to:
- Add new models
- Adjust tiers
- Set cost information
- Configure max tokens

## Troubleshooting

### API Errors

- Check API keys are set correctly
- Verify provider availability
- Check rate limits
- Review console logs

### File Access Issues

- Ensure `WORKSPACE_ROOT` is set correctly
- Check file permissions
- Verify paths are within workspace

### Token Limit Errors

- Reduce `maxTokens` in requests
- Summarize context before sending
- Use smaller models for simple tasks

## License

MIT

## Contributing

Contributions welcome! Please ensure:
- Code follows TypeScript best practices
- All features include error handling
- Token safety is maintained
- UI remains responsive

---

Built for developers, by developers. 🚀

