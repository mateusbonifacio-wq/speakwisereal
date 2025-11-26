import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface AnalyzeRequest {
  transcript: string;
  audioAnalysis?: {
    emotionIndicators?: any;
    emotionalState?: any;
    audioEvents?: any[];
    speechPatterns?: any;
  };
  context?: {
    audience?: string;
    goal?: string;
    duration?: string;
    scenario?: string;
    english_level?: string;
    tone_style?: string;
    constraints?: string;
    notes_from_user?: string;
  };
  session_info?: {
    practice_attempt?: number;
    wants_deploy_suggestions?: boolean;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { transcript, audioAnalysis, context, session_info } = body;

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured. Please set GOOGLE_AI_API_KEY or ELEVENLABS_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Build the prompt for the AI coach
    let systemPrompt = `You are "SpeakWise Real", an AI-powered pitch and communication coach.

Your role:
- Help users improve spoken pitches, introductions, and persuasive messages.
- Act like a top-tier communication and storytelling coach: clear, direct, and supportive.
- Focus on practical, actionable improvement, not flattery.
- Analyze emotional delivery, sentiment, and vocal patterns from the transcript to detect nervousness, confidence, energy, enthusiasm, hesitation, etc.
- Provide empathetic feedback about emotional state and help users overcome nervousness and improve delivery.
- Optionally help the user "deploy" or "share" a final version of their pitch (text + audio generated elsewhere).

You receive, in the user message, a structured payload with:

- pitch_transcript (required):
  A transcript of a spoken pitch in English. It may come from automatic speech-to-text, so it can contain filler words, repetitions, or minor transcription errors.
  IMPORTANT: Analyze patterns in the transcript to infer emotional state:
  - Filler words (uh, um, like, you know) → nervousness, hesitation
  - Repetitions → nervousness, lack of confidence
  - Short, choppy sentences → nervousness, rushed delivery
  - Question marks or uncertainty markers → lack of confidence
  - Exclamation marks → enthusiasm (could be good or overdone)
  - Pauses indicated by "..." or commas → good pacing vs. hesitation
  - Self-correcting patterns → nervousness, lack of preparation
  Use these patterns to provide empathetic feedback about emotional delivery.

- context (optional but useful), which may include:
  - audience: who the pitch is for (e.g., investors, hiring manager, customers, conference audience, podcast listeners).
  - goal: what the speaker wants to achieve (e.g., raise funding, get hired, book a meeting, close a sale, build awareness).
  - duration: desired length (e.g., 30 seconds, 1 minute, 3 minutes, 5 minutes, "elevator pitch").
  - scenario: type of situation (e.g., startup investor pitch, job interview intro, sales call opener, conference talk, networking event).
  - english_level: e.g., beginner / intermediate / advanced / fluent.
  - tone_style: e.g., confident, friendly, inspiring, professional, casual, humorous.
  - constraints: anything the user must respect (e.g., "no jargon", "non-native audience", "max 1 minute", "keep it simple").
  - notes_from_user: any extra notes they speak or type (e.g., "this is my first attempt", "I'm nervous", "I want something punchy").

- session_info (optional):
  - practice_attempt: number of the attempt in this session (1 for first attempt, 2 for second, etc.).
  - wants_deploy_suggestions: boolean flag (true/false) indicating whether the user wants help preparing a "deployable" version (title, description, tags) for sharing their pitch page.

If some context fields are missing, you must still give full feedback based only on the transcript, and clearly say what you are assuming.

Your job:
1) Analyze the pitch based on the transcript and any available context.
2) Provide structured, concise, and practical feedback that the user can apply in their next iteration.
3) Rewrite the pitch in a stronger version that respects the user's constraints (duration, audience, tone, etc.).
4) When requested, suggest how to "deploy/share" the pitch, with a title, one-line description, and tags.

When you respond, ALWAYS follow this exact structure and headings, in Markdown:

1. **Quick Summary (2–3 sentences)**
   - Briefly describe what the pitch is about and what you understood as the main message.
   - If the pitch is very unclear, say that explicitly and focus on clarification.

2. **Scores (0–10)**
   For each category, give a score from 0–10 and a short reason (one sentence):
   - Clarity:
   - Structure & Flow:
   - Persuasiveness:
   - Storytelling & Examples:
   - Conciseness vs. Duration (is it too long/short for the stated duration?):
   - Fit for Audience & Goal:
   - Delivery & Energy (estimate from word choice and style only):

3. **Context Check**
   - Restate the context you are using (audience, goal, duration, scenario, tone_style, constraints).
   - If any important context is missing, clearly state what you are ASSUMING, e.g.:
     - "No duration given, I will assume 60–90 seconds."
     - "No audience specified, I will assume potential investors."
   - Mention any mismatch you detect, e.g.:
     - "Goal is to get a meeting, but there is no clear call to action."
     - "Audience is non-technical, but there is heavy technical jargon."

4. **Emotional & Delivery Analysis**
   - Analyze the emotional state and delivery patterns detected in the transcript.
   - Identify signs of: nervousness, confidence, enthusiasm, hesitation, rushed delivery, etc.
   - Be empathetic and supportive. For example:
     - "I notice several filler words ('uh', 'like') which suggest some nervousness—this is completely normal and can be improved with practice."
     - "Your pace seems rushed in the middle section, which might indicate anxiety about time."
     - "The repetition of certain phrases suggests hesitation—this often happens when we're not fully confident in what we're saying."
   - Provide encouragement and specific strategies to address any emotional/delivery issues.
   - If no major issues detected, acknowledge the confident delivery.

5. **What You Did Well**
   - 3–7 bullet points.
   - Highlight specific strengths: content clarity, strong problem articulation, clear value proposition, good hook, memorable line, personal story, credibility, confident delivery, etc.
   - Refer to concrete patterns in the pitch (but do NOT quote long passages).

6. **What to Improve (Actionable)**
   - 5–10 bullet points.
   - Each point must be specific and actionable.
   - Prefer instructions like:
     - "Open with a one-sentence problem statement before describing your solution."
     - "Cut repeated phrases in the second half to keep the pitch under 60 seconds."
     - "Clarify who you help in one simple sentence, right after your introduction."
     - "Add one concrete example or mini-story to make the problem feel real."
   - Avoid vague advice like "be more engaging" or "improve your storytelling" without explaining HOW.

7. **Improved Pitch (Same Idea, Stronger Version)**
   - Rewrite the entire pitch in a stronger way, keeping:
     - The same core idea, business, and facts.
     - A length roughly appropriate for the stated duration:
       - "Very short" or ≤ 30 seconds → around 60–90 words.
       - About 1 minute → around 120–170 words.
       - 2–3 minutes → around 250–400 words.
       - For longer pitches, focus on clarity and structure over exact word count.
   - Make sure the improved pitch:
     - Has a clear, compelling opening (hook or problem statement).
     - States the problem, solution, and value proposition clearly.
     - Uses language that fits the audience (technical vs. non-technical).
     - Reflects the desired tone_style (confident, friendly, inspiring, etc.).
     - Ends with a clear, concrete call to action aligned with the goal (e.g., "I'd love to schedule a 20-minute meeting to show you a live demo.").
   - Do NOT invent business metrics, user numbers, or factual claims that were not mentioned in the transcript or context.

8. **Alternative Openings & Closings**
   - **Opening Options (2–3):**
     - Provide 2–3 alternative opening lines or very short opening paragraphs the user could use to start the pitch.
     - They should be punchy and tailored to the audience and goal.
   - **Closing / Call-to-Action Options (2–3):**
     - Provide 2–3 concise closing lines tailored to the goal (e.g., ask for a meeting, ask for feedback, invite to try the product, ask for an interview).

9. **Delivery Tips (Voice, Pace, Body Language, Emotional Control)**
   - 3–7 short bullet points on delivery, including emotional delivery.
   - Address any nervousness or confidence issues detected.
   - Examples:
     - "Slow down slightly on the problem statement and leave a 1-second pause after it."
     - "Emphasize key words that describe the pain point and the benefit."
     - "Smile while you speak the opening line to project warmth and confidence."
     - "To reduce filler words, practice pausing instead of saying 'uh' or 'like'—silence is more powerful than filler."
     - "Take 3 deep breaths before starting to calm nerves and slow your pace."
     - "If you're feeling rushed, remember that your audience needs time to process—slow down by 20%."
   - You are inferring possible delivery issues from the text patterns (filler words, repetitions, etc.), so make that clear (e.g., "Based on the many filler words in your transcript, I suspect you might be speaking too fast or feeling nervous…").
   - Keep tips simple enough to apply in the next practice round.

10. **Next Practice Exercise**
   - Give ONE short exercise the user can do for their next attempt.
   - Example exercises:
     - "Deliver the same pitch in 30 seconds focusing only on the problem and solution."
     - "Practice just the opening 3 times, varying your energy and seeing what feels most natural."
     - "Record yourself and remove filler words like 'uh', 'like', and 'you know'."

11. **Deploy / Sharing Suggestions**  (only if \`wants_deploy_suggestions\` is true)
   - Suggest how the user could present this pitch on a public page (text + audio).
   - Provide:
     - **Title for the Pitch Page**  
       - 1 short, clear title (max ~60 characters).
     - **One-Line Description**  
       - 1 sentence that explains what the pitch is about and for whom (max ~160 characters).
     - **Tags**  
       - 3–7 short tags (single words or short phrases), e.g.:
         - \`startup\`, \`seed-round\`, \`B2B SaaS\`, \`job-interview\`, \`sales-pitch\`, \`healthcare\`, etc.
   - Make sure the title and description are accurate and do not invent facts.

General rules and style guidelines:
- Always be encouraging but honest. The goal is improvement, not making the user feel perfect.
- Do NOT invent business details, numbers, user counts, revenue, or any factual claims that are not present in the transcript or context.
- If the pitch is extremely short, incomplete, or unclear, say this explicitly and focus first on helping the user build a minimal solid structure.
- If the pitch significantly misses the stated goal or audience, explain why and how to fix it.
- Write in clear, natural English. Avoid jargon unless the context makes it clearly appropriate.
- Use Markdown headings and bullet points exactly as requested for readability.
- Never apologize for giving critical feedback; frame it as helpful coaching for growth.`;

    // ALWAYS analyze emotions from transcript - this is critical for emotional feedback
    const analyzeEmotionsFromText = (text: string) => {
      // Count filler words (common indicators of nervousness)
      const fillerWordsList = ['uh', 'um', 'er', 'ah', 'like', 'you know', 'so', 'well', 'actually', 'basically', 'literally'];
      let fillerWords = 0;
      fillerWordsList.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = text.match(regex);
        fillerWords += matches ? matches.length : 0;
      });
      
      // Find repetitions (same word/phrase repeated)
      const words = text.toLowerCase().split(/\s+/);
      let repetitions = 0;
      for (let i = 0; i < words.length - 1; i++) {
        if (words[i] === words[i + 1] && words[i].length > 2) {
          repetitions++;
        }
      }
      
      const questionMarks = (text.match(/\?/g) || []).length;
      const exclamationMarks = (text.match(/!/g) || []).length;
      const ellipsis = (text.match(/\.{2,}/g) || []).length;
      const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const avgWordsPerSentence = sentences.length > 0 ? wordCount / sentences.length : 0;
      
      // Detect uncertainty markers
      const uncertaintyMarkers = (text.match(/\b(maybe|perhaps|might|could|i think|i guess|sort of|kind of)\b/gi) || []).length;
      
      return {
        fillerWords,
        repetitions,
        questionMarks,
        exclamationMarks,
        ellipsis,
        uncertaintyMarkers,
        wordCount,
        avgWordsPerSentence,
        nervousness: fillerWords > 3 || repetitions > 1 || uncertaintyMarkers > 2,
        hesitation: ellipsis > 1 || questionMarks > 1 || uncertaintyMarkers > 2,
        enthusiasm: exclamationMarks > 1,
        rushed: avgWordsPerSentence > 20,
        confidence: fillerWords <= 2 && repetitions === 0 && questionMarks === 0 && uncertaintyMarkers === 0
      };
    };

    const textEmotions = analyzeEmotionsFromText(transcript);
    
    // Log emotions for debugging
    console.log('Emotional analysis from transcript:', textEmotions);

    let userPrompt = `Please analyze this pitch transcript:\n\n${transcript}`;
    
    // Add audio analysis information if available, otherwise use text-based analysis
    userPrompt += `\n\nEmotional & Delivery Analysis (from transcript):\n`;
    if (audioAnalysis && audioAnalysis.emotionalState) {
      // Use audio analysis if available
      userPrompt += `- Filler words detected: ${audioAnalysis.emotionIndicators?.fillerWordCount || textEmotions.fillerWords}\n`;
      userPrompt += `- Repetitions detected: ${audioAnalysis.emotionIndicators?.repetitionCount || textEmotions.repetitions}\n`;
      userPrompt += `- Emotional state indicators:\n`;
      if (audioAnalysis.emotionalState.nervousness || textEmotions.nervousness) {
        userPrompt += `  * Nervousness detected (filler words: ${audioAnalysis.emotionIndicators?.fillerWords || textEmotions.fillerWords}, repetitions: ${audioAnalysis.emotionIndicators?.repetitions || textEmotions.repetitions})\n`;
      }
      if (audioAnalysis.emotionalState.hesitation || textEmotions.hesitation) {
        userPrompt += `  * Hesitation detected (uncertainty markers, pauses, ellipsis)\n`;
      }
      if (audioAnalysis.emotionalState.enthusiasm || textEmotions.enthusiasm) {
        userPrompt += `  * Enthusiasm detected\n`;
      }
      if (audioAnalysis.emotionalState.rushed || textEmotions.rushed) {
        userPrompt += `  * Rushed delivery detected (high words per sentence: ${textEmotions.avgWordsPerSentence.toFixed(1)})\n`;
      }
      if (audioAnalysis.emotionalState.confidence || textEmotions.confidence) {
        userPrompt += `  * Confident delivery (low filler words, clear speech)\n`;
      }
      if (audioAnalysis.speechPatterns?.pace) {
        userPrompt += `- Speaking pace: ${audioAnalysis.speechPatterns.pace}\n`;
      }
      if (audioAnalysis.audioEvents && audioAnalysis.audioEvents.length > 0) {
        userPrompt += `- Audio events detected: ${audioAnalysis.audioEvents.map((e: any) => e.type || e).join(', ')}\n`;
      }
    } else {
      // Use text-based emotion analysis
      userPrompt += `- Filler words detected: ${textEmotions.fillerWords}\n`;
      userPrompt += `- Repetitions detected: ${textEmotions.repetitions}\n`;
      userPrompt += `- Question marks: ${textEmotions.questionMarks}\n`;
      userPrompt += `- Exclamation marks: ${textEmotions.exclamationMarks}\n`;
      userPrompt += `- Average words per sentence: ${textEmotions.avgWordsPerSentence.toFixed(1)}\n`;
      userPrompt += `- Emotional state indicators:\n`;
      if (textEmotions.nervousness) {
        userPrompt += `  * Nervousness detected (filler words: ${textEmotions.fillerWords}, repetitions: ${textEmotions.repetitions})\n`;
      }
      if (textEmotions.hesitation) {
        userPrompt += `  * Hesitation detected (uncertainty markers, ellipsis: ${textEmotions.ellipsis})\n`;
      }
      if (textEmotions.enthusiasm) {
        userPrompt += `  * Enthusiasm detected (exclamation marks: ${textEmotions.exclamationMarks})\n`;
      }
      if (textEmotions.rushed) {
        userPrompt += `  * Rushed delivery detected (high words per sentence: ${textEmotions.avgWordsPerSentence.toFixed(1)})\n`;
      }
      if (textEmotions.confidence) {
        userPrompt += `  * Confident delivery (low filler words: ${textEmotions.fillerWords}, clear speech)\n`;
      }
    }
    
    userPrompt += `\n\nCRITICAL INSTRUCTION: The emotional analysis above shows the speaker's actual emotional state based on their speech patterns. You MUST use this information in your feedback. In the "Emotional & Delivery Analysis" section, reference these specific findings and provide empathetic, supportive coaching. Don't just mention emotions in passing—make it a central part of your feedback to help them improve their delivery and overcome nervousness or hesitation.`;

    if (context) {
      userPrompt += `\n\nContext:\n`;
      if (context.audience) {
        userPrompt += `- audience: ${context.audience}\n`;
      }
      if (context.goal) {
        userPrompt += `- goal: ${context.goal}\n`;
      }
      if (context.duration) {
        userPrompt += `- duration: ${context.duration}\n`;
      }
      if (context.scenario) {
        userPrompt += `- scenario: ${context.scenario}\n`;
      }
      if (context.english_level) {
        userPrompt += `- english_level: ${context.english_level}\n`;
      }
      if (context.tone_style) {
        userPrompt += `- tone_style: ${context.tone_style}\n`;
      }
      if (context.constraints) {
        userPrompt += `- constraints: ${context.constraints}\n`;
      }
      if (context.notes_from_user) {
        userPrompt += `- notes_from_user: ${context.notes_from_user}\n`;
      }
    }

    if (session_info) {
      userPrompt += `\n\nSession Info:\n`;
      if (session_info.practice_attempt) {
        userPrompt += `- practice_attempt: ${session_info.practice_attempt}\n`;
      }
      if (session_info.wants_deploy_suggestions !== undefined) {
        userPrompt += `- wants_deploy_suggestions: ${session_info.wants_deploy_suggestions}\n`;
      }
    }

    // First, try to get available models from the API
    let modelNames = [
      'gemini-1.5-pro',
      'gemini-1.5-flash', 
      'gemini-pro',
      'gemini-1.0-pro'
    ];
    
    // Try to fetch available models from API
    try {
      const modelsResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
      );
      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json();
        const availableModelNames = (modelsData.models || [])
          .filter((m: any) => 
            m.supportedGenerationMethods?.includes('generateContent') ||
            m.supportedGenerationMethods?.includes('generateContentStream')
          )
          .map((m: any) => m.name.replace('models/', ''));
        
        if (availableModelNames.length > 0) {
          modelNames = availableModelNames;
          console.log(`Found available models: ${modelNames.join(', ')}`);
        }
      }
    } catch (err) {
      console.log('Could not fetch model list, using defaults');
    }
    
    let model;
    let modelError: any = null;
    
    for (const modelName of modelNames) {
      try {
        model = genAI.getGenerativeModel({ model: modelName });
        // Test the model with a simple request
        const testResult = await model.generateContent('test');
        await testResult.response;
        // If we get here without error, this model works
        console.log(`Using model: ${modelName}`);
        break;
      } catch (err: any) {
        modelError = err;
        console.log(`Model ${modelName} failed: ${err.message}`);
        continue;
      }
    }
    
    if (!model) {
      throw new Error(
        `No available Gemini models found. Tried: ${modelNames.join(', ')}. ` +
        `Last error: ${modelError?.message || 'Unknown'}. ` +
        `\n\nTroubleshooting:\n` +
        `1. Verify your API key at https://makersuite.google.com/app/apikey\n` +
        `2. Make sure you're using a Google AI Studio API key (not Vertex AI)\n` +
        `3. Check that your API key has access to Gemini models\n` +
        `4. Visit /api/list-models to see which models are available with your key`
      );
    }

    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const feedback = response.text() || 'No feedback generated';

    return NextResponse.json({ feedback });
  } catch (error: any) {
    console.error('Error analyzing pitch:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze pitch' },
      { status: 500 }
    );
  }
}

