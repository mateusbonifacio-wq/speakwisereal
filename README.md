# SpeakWise Real - AI Pitch Coach

An AI-powered pitch and communication coaching application that analyzes your pitch transcripts and provides structured, actionable feedback to help you improve your communication skills.

## Features

- **🎤 Voice Recording**: Record your pitch directly in the browser with real-time speech-to-text transcription
- **Comprehensive Pitch Analysis**: Get detailed feedback on clarity, structure, persuasiveness, and more
- **Structured Feedback**: Receive feedback in a clear format with scores, strengths, improvements, and concrete suggestions
- **Context-Aware**: Provide optional context about your audience, goal, and duration for tailored feedback
- **Actionable Suggestions**: Get rewritten openings, value propositions, and closing statements
- **Practice Exercises**: Receive specific exercises to improve your next pitch

## Setup

### Prerequisites

- Node.js 18+ and npm/yarn
- Google AI API key (free) - Get it at [Google AI Studio](https://makersuite.google.com/app/apikey)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mateusbonifacio-wq/speakwisereal.git
cd speakwisereal
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory and add your Google AI API key:
```
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
```

**Or if you prefer to use ElevenLabs API key:**
```
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

**To get a free Google AI API key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to your `.env.local` file

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploy on Vercel

1. **Push your code to GitHub** (if you haven't already):
```bash
git add .
git commit -m "Initial commit"
git push -u origin main
```

2. **Go to [Vercel](https://vercel.com)** and sign in with your GitHub account

3. **Click "New Project"** and import your `speakwisereal` repository

4. **Add Environment Variable**:
   - In the Vercel project settings, go to "Environment Variables"
   - Add `GOOGLE_AI_API_KEY` with your Google AI API key value (or `ELEVENLABS_API_KEY` if using ElevenLabs)
   - Make sure to add it for all environments (Production, Preview, Development)
   - **Get a free Google AI API key**: [Google AI Studio](https://makersuite.google.com/app/apikey)

5. **Deploy**: Click "Deploy" and Vercel will automatically build and deploy your application

6. **Your app will be live** at a URL like `https://speakwisereal.vercel.app`

## Usage

1. **Enter your pitch transcript**: 
   - **Option 1**: Click "🎤 Record Pitch" to record your pitch using your microphone (speech-to-text transcription)
   - **Option 2**: Paste or type your pitch transcript in the text area
   - The app uses your browser's built-in speech recognition (works in Chrome, Edge, Safari)
2. **Add optional context** (recommended):
   - **Audience**: Who you're pitching to (e.g., "Investors", "Job interviewers")
   - **Goal**: What you want to achieve (e.g., "Secure funding", "Get hired")
   - **Duration**: How long the pitch should be (e.g., "3 minutes", "30 seconds")
3. **Click "Analyze Pitch"** to get your feedback
4. **Review the feedback** which includes:
   - Summary of your pitch
   - Scores (0-10) for different aspects
   - What worked well
   - What to improve
   - Concrete suggestions with rewritten examples
   - Next practice exercise

## How It Works

The application uses OpenAI's GPT-4 model to analyze your pitch transcript. The AI coach follows a structured format to provide:

- **Summary**: Brief overview of your pitch
- **Scores**: Quantitative assessment (0-10) for clarity, structure, persuasiveness, energy, and fit
- **What Worked Well**: Strengths and strong moments
- **What to Improve**: Specific, actionable improvements
- **Concrete Suggestions**: Rewritten openings, value propositions, and closings
- **Practice Exercise**: A focused exercise for your next attempt

## Project Structure

```
speakwisereal/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts      # API endpoint for pitch analysis
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main application page
├── package.json
├── tsconfig.json
└── README.md
```

## Technologies

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Google Gemini API**: Free AI model for pitch analysis (or ElevenLabs API key)
- **CSS**: Custom styling with modern design

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

