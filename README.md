# SpeakWise Real - AI Pitch Coach

An AI-powered pitch and communication coaching application that analyzes your pitch transcripts and provides structured, actionable feedback to help you improve your communication skills.

## Features

- **Comprehensive Pitch Analysis**: Get detailed feedback on clarity, structure, persuasiveness, and more
- **Structured Feedback**: Receive feedback in a clear format with scores, strengths, improvements, and concrete suggestions
- **Context-Aware**: Provide optional context about your audience, goal, and duration for tailored feedback
- **Actionable Suggestions**: Get rewritten openings, value propositions, and closing statements
- **Practice Exercises**: Receive specific exercises to improve your next pitch

## Setup

### Prerequisites

- Node.js 18+ and npm/yarn
- OpenAI API key

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

3. Create a `.env.local` file in the root directory and add your OpenAI API key:
```
OPENAI_API_KEY=your_openai_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Enter your pitch transcript**: Paste or type your pitch transcript in the text area
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
- **OpenAI API**: GPT-4 for pitch analysis
- **CSS**: Custom styling with modern design

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

