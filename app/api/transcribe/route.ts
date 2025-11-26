import { NextRequest, NextResponse } from 'next/server';
import { analyzeAudioEmotions } from '../../lib/audio-emotion-analysis';

/**
 * Extract audio events from transcription text
 * Returns array of detected audio events (for metadata analysis)
 */
function extractAudioEvents(text: string): string[] {
  if (!text) return [];
  
  const events: string[] = [];
  const matches = text.match(/\([^)]+\)/g);
  
  if (matches) {
    matches.forEach(match => {
      const content = match.replace(/[()]/g, '').toLowerCase();
      // Check if it looks like an audio event (not speech)
      const audioKeywords = [
        'thunder', 'wind', 'bird', 'laughter', 'applause', 'music', 
        'noise', 'static', 'phone', 'door', 'car', 'dog', 'siren',
        'airplane', 'footstep', 'breathing', 'sigh', 'cough'
      ];
      
      if (audioKeywords.some(keyword => content.includes(keyword))) {
        events.push(content);
      }
    });
  }
  
  return events;
}

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

    // Add optional parameters based on the Python example
    // These parameters enable emotion detection and audio analysis
    elevenLabsFormData.append('model_id', 'scribe_v1');
    elevenLabsFormData.append('tag_audio_events', 'true'); // Tags laughter, applause, etc.
    elevenLabsFormData.append('language_code', 'eng');
    elevenLabsFormData.append('diarize', 'true'); // Speaker diarization
    // Add parameter to get more detailed audio analysis
    elevenLabsFormData.append('include_audio_features', 'true');

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
    
    // Extract transcription text from response
    // The API response structure may vary, so we handle different formats
    let transcription = '';
    if (result.text) {
      transcription = result.text;
    } else if (result.transcription) {
      transcription = result.transcription;
    } else if (typeof result === 'string') {
      transcription = result;
    } else if (result.segments && Array.isArray(result.segments)) {
      // If response has segments with timing and text
      transcription = result.segments.map((seg: any) => seg.text || seg.transcript || '').join(' ');
    } else {
      transcription = JSON.stringify(result);
    }

    // Only clean obvious environmental noise, keep speech events like "(chuckles)" and "(laughter)"
    // These are part of the delivery and should be analyzed
    transcription = transcription
      // Remove only clear environmental sounds, keep speech-related events
      .replace(/\s*\(thunder\s+rumbling\)\s*/gi, ' ')
      .replace(/\s*\(wind\s+blowing\)\s*/gi, ' ')
      .replace(/\s*\(birds?\s+chirping\)\s*/gi, ' ')
      .replace(/\s*\(background\s+noise\)\s*/gi, ' ')
      .replace(/\s*\(static\)\s*/gi, ' ')
      // Keep (chuckles), (laughter), (applause) as they're part of delivery
      .replace(/\s+/g, ' ')
      .trim();
    
    // Extract audio events for metadata
    const audioEventsInText = extractAudioEvents(transcription);

    // Analyze audio features for emotion detection from the actual audio signal
    // This extracts acoustic features like pitch, energy, tempo, etc.
    let audioEmotionFeatures: any = {};
    try {
      audioEmotionFeatures = await analyzeAudioEmotions(buffer, audioFile.type);
    } catch (err) {
      console.log('Audio emotion analysis not available:', err);
    }

    // Extract emotional and audio metadata
    const audioAnalysis = {
      // Audio events (laughter, applause, environmental sounds, etc.)
      audioEvents: result.audio_events || result.events || audioEventsInText || [],
      
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
      
      // Acoustic emotion features from audio signal (OpenSMILE-style analysis)
      acousticFeatures: audioEmotionFeatures,
      
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

