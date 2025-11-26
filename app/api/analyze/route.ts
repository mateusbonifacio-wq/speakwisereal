import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AnalyzeRequest {
  transcript: string;
  context?: {
    audience?: string;
    goal?: string;
    duration?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { transcript, context } = body;

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    // Build the prompt for the AI coach
    let systemPrompt = `You are an expert pitch and communication coach. Your job is to analyze pitches and give clear, concise, and practical feedback that helps users improve quickly. Assume the user is practicing and wants honest but encouraging coaching.

When you respond, ALWAYS follow this structure and formatting (use markdown):

1. Summary (2–3 sentences)
   - Briefly describe what the pitch is about and what you understood as the main message.

2. Scores (0–10)
   - Clarity:
   - Structure:
   - Persuasiveness:
   - Energy and delivery (based only on what can be inferred from text):
   - Fit for audience/goal (if context is provided):

3. What worked well
   - 3–5 short bullet points highlighting strengths.
   - Focus on content, message, and any strong moments.

4. What to improve
   - 3–7 bullet points.
   - Be specific and actionable (e.g., "Open with a 1-sentence problem statement" instead of "Be more concise").

5. Concrete suggestions and examples
   - Rewrite key parts of the pitch:
     - A stronger opening (2–3 options).
     - A clearer value proposition (1–2 options).
     - A more compelling closing / call to action.
   - Keep the suggestions in the same approximate length as the original pitch.

6. Next practice exercise
   - Give the user one short exercise they can do for their next attempt (e.g., "Try to deliver the same pitch in 30 seconds focusing only on the problem and solution").

Guidelines:
- Be encouraging but direct. The goal is improvement, not flattery.
- Never apologize for being critical; frame it as helpful coaching.
- Do NOT invent details that are not present in the transcript or context.
- If the pitch is very short or incomplete, say so explicitly and suggest what the user should add.
- If the user provides context (e.g., 'investor pitch in 3 minutes' or 'job interview introduction'), adapt your feedback to that scenario.
- Always write in clear, natural English.`;

    let userPrompt = `Please analyze this pitch transcript:\n\n${transcript}`;

    if (context) {
      userPrompt += `\n\nContext:\n`;
      if (context.audience) {
        userPrompt += `- Audience: ${context.audience}\n`;
      }
      if (context.goal) {
        userPrompt += `- Goal: ${context.goal}\n`;
      }
      if (context.duration) {
        userPrompt += `- Duration: ${context.duration}\n`;
      }
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    });

    const feedback = completion.choices[0]?.message?.content || 'No feedback generated';

    return NextResponse.json({ feedback });
  } catch (error: any) {
    console.error('Error analyzing pitch:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze pitch' },
      { status: 500 }
    );
  }
}

