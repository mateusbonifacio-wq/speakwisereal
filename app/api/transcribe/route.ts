import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured. Please set ELEVENLABS_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    // Convert File to Buffer for ElevenLabs API
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create FormData for ElevenLabs API
    // Based on the Python example, ElevenLabs expects a file upload
    const elevenLabsFormData = new FormData();
    const blob = new Blob([buffer], { type: audioFile.type || 'audio/mpeg' });
    elevenLabsFormData.append('file', blob, audioFile.name);

    // Minimal parameters - just the model
    elevenLabsFormData.append('model_id', 'scribe_v1');

    // Call ElevenLabs Speech-to-Text API
    // Note: The endpoint might be different, check ElevenLabs docs
    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: elevenLabsFormData,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('ElevenLabs API error:', errorData);
      return NextResponse.json(
        { error: `ElevenLabs API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    // Log full response to debug what ElevenLabs is actually returning
    console.log('ElevenLabs full response:', JSON.stringify(result, null, 2));
    console.log('Response keys:', Object.keys(result));
    if (result.segments) {
      console.log('Segments sample:', JSON.stringify(result.segments.slice(0, 3), null, 2));
    }
    
    // Extract transcription text - comprehensive extraction
    let transcription = '';
    
    // Priority 1: Direct string or text field
    if (typeof result === 'string') {
      transcription = result;
    } else if (result.text) {
      transcription = String(result.text);
    } else if (result.transcription) {
      transcription = String(result.transcription);
    }
    
    // Priority 2: Extract from segments (most common format)
    if (!transcription && result.segments && Array.isArray(result.segments)) {
      const allTexts: string[] = [];
      
      for (const seg of result.segments) {
        // Try every possible field that might contain text
        const text = seg.text || seg.transcript || seg.word || seg.content || 
                     seg.speech || seg.utterance || seg.sentence || '';
        
        if (text && typeof text === 'string' && text.trim()) {
          // Only add if it's actual speech text, not audio events
          const cleanText = String(text).trim();
          if (cleanText.length > 0 && !cleanText.match(/^\([^)]+\)$/)) {
            allTexts.push(cleanText);
          }
        }
      }
      
      transcription = allTexts.join(' ').trim();
    }
    
    // Priority 3: Extract from words array
    if (!transcription && result.words && Array.isArray(result.words)) {
      transcription = result.words
        .map((w: any) => w.word || w.text || w.content || '')
        .filter((w: any) => w && String(w).trim())
        .join(' ')
        .trim();
    }
    
    // Clean up the transcription
    if (transcription) {
      transcription = transcription.replace(/\s+/g, ' ').trim();
    }
    
    console.log('Final transcription:', transcription);

    // Extract emotional and audio metadata
    const audioAnalysis = {
      // Audio events (laughter, applause, etc.)
      audioEvents: result.audio_events || result.events || [],
      
      // Speaker diarization (if multiple speakers)
      speakers: result.speakers || result.diarization || [],
      
      // Speech patterns (pauses, pace indicators)
      speechPatterns: {
        pauses: result.pauses || [],
        pace: result.pace || result.speaking_rate || null,
        volume: result.volume || result.energy || null,
      },
      
      // Segments with timing (to analyze pace and pauses)
      segments: result.segments || [],
      
      // Original metadata
      metadata: result.metadata || {}
    };

    // Analyze transcription patterns for emotions
    const emotionIndicators = {
      fillerWords: (transcription.match(/\b(uh|um|er|ah|like|you know|so|well)\b/gi) || []).length,
      repetitions: (transcription.match(/\b(\w+)(?:\s+\1\b)+/gi) || []).length,
      questionMarks: (transcription.match(/\?/g) || []).length,
      exclamationMarks: (transcription.match(/!/g) || []).length,
      ellipsis: (transcription.match(/\.{2,}/g) || []).length,
      wordCount: transcription.split(/\s+/).filter(w => w.length > 0).length,
      averageWordsPerSentence: transcription.split(/[.!?]+/).filter(s => s.trim().length > 0).length > 0 
        ? transcription.split(/\s+/).filter(w => w.length > 0).length / transcription.split(/[.!?]+/).filter(s => s.trim().length > 0).length 
        : 0
    };

    // Detect emotional state based on patterns
    const emotionalState = {
      nervousness: emotionIndicators.fillerWords > 5 || emotionIndicators.repetitions > 2,
      hesitation: emotionIndicators.ellipsis > 2 || emotionIndicators.questionMarks > emotionIndicators.exclamationMarks,
      enthusiasm: emotionIndicators.exclamationMarks > 2,
      rushed: emotionIndicators.averageWordsPerSentence > 25,
      confidence: emotionIndicators.fillerWords < 2 && emotionIndicators.repetitions === 0 && emotionIndicators.questionMarks === 0,
      fillerWordCount: emotionIndicators.fillerWords,
      repetitionCount: emotionIndicators.repetitions
    };

    return NextResponse.json({ 
      transcription,
      audioAnalysis,
      emotionIndicators,
      emotionalState,
      metadata: result.metadata || {}
    });
  } catch (error: any) {
    console.error('Error transcribing audio:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
