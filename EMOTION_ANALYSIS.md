# Audio Emotion Analysis Integration Guide

This guide explains how to integrate OpenSMILE or other advanced audio emotion analysis tools into SpeakWise Real.

## Current Implementation

Currently, the system analyzes emotions from:
1. **Text patterns** in the transcript (filler words, repetitions, etc.)
2. **Basic audio metadata** from ElevenLabs transcription

## OpenSMILE Integration Options

### Option 1: OpenSMILE via Docker/Container (Recommended)

OpenSMILE is an open-source toolkit for extracting audio features. Here's how to integrate it:

1. **Run OpenSMILE in a Docker container** or as a microservice
2. **Send audio files** to the OpenSMILE service
3. **Extract features** like pitch, energy, spectral features
4. **Use machine learning models** to predict emotions from features

Example workflow:
```typescript
// app/lib/audio-emotion-analysis.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function analyzeWithOpenSMILE(audioBuffer: Buffer, outputPath: string) {
  // Save audio to temp file
  const tempAudioPath = `/tmp/audio_${Date.now()}.wav`;
  await fs.writeFile(tempAudioPath, audioBuffer);
  
  // Run OpenSMILE command
  const command = `opensmile -I ${tempAudioPath} -O ${outputPath} -config config/emobase_liveinstall.conf`;
  await execAsync(command);
  
  // Parse OpenSMILE output (CSV format)
  const features = parseOpenSMILEOutput(outputPath);
  
  // Clean up
  await fs.unlink(tempAudioPath);
  
  return features;
}
```

### Option 2: Use Cloud APIs with Emotion Detection

Several cloud services offer emotion detection from audio:

#### AssemblyAI
```typescript
const response = await fetch('https://api.assemblyai.com/v2/transcript', {
  method: 'POST',
  headers: {
    authorization: process.env.ASSEMBLYAI_API_KEY,
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    audio_url: audioUrl,
    sentiment_analysis: true,
    emotion_detection: true, // if available
  }),
});
```

#### Deepgram
```typescript
const response = await fetch('https://api.deepgram.com/v1/listen', {
  method: 'POST',
  headers: {
    Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
    'Content-Type': 'audio/wav',
  },
  body: audioBuffer,
  // Deepgram can provide speaker diarization and sentiment
});
```

#### Google Cloud Speech-to-Text with Emotion Detection
Google Cloud offers emotion detection in some models (check latest docs).

### Option 3: Custom Node.js Audio Analysis

Use libraries like:
- `wavefile` - Parse WAV files
- `node-wav` - WAV file processing
- `audio-buffer-utils` - Audio manipulation
- `pitchfinder` - Pitch detection

Example:
```typescript
import WaveFile from 'wavefile';
import { extractPitch, extractEnergy } from './audio-utils';

export async function analyzeAudioEmotions(audioBuffer: Buffer) {
  const wav = new WaveFile(audioBuffer);
  const samples = wav.getSamples(false, Float32Array);
  
  // Extract features
  const pitch = extractPitch(samples, wav.fmt.sampleRate);
  const energy = extractEnergy(samples);
  const tempo = extractTempo(samples, wav.fmt.sampleRate);
  
  // Predict emotions from features
  const emotions = predictEmotions({
    pitch,
    energy,
    tempo,
  });
  
  return emotions;
}
```

## Recommended Approach

For production, we recommend:

1. **Hybrid approach**: 
   - Use text analysis (current) for quick feedback
   - Use audio analysis (OpenSMILE or API) for detailed emotion detection
   
2. **Start with AssemblyAI or Deepgram** (easier integration)
   - They provide sentiment and emotion detection out of the box
   - No need to run local services
   
3. **Move to OpenSMILE** (more control, better features)
   - When you need more detailed acoustic features
   - When you want to train custom emotion models
   - Requires Docker/container infrastructure

## Implementation Steps

1. **Add audio emotion analysis endpoint** (`/api/analyze-emotions`)
2. **Call it after transcription** to get acoustic features
3. **Combine with text analysis** for comprehensive emotion detection
4. **Use in feedback generation** to provide more accurate emotional coaching

## Example Integration

```typescript
// After transcribing audio
const transcription = await transcribeAudio(audioFile);

// Analyze emotions from audio
const audioEmotions = await analyzeAudioEmotions(audioBuffer);

// Combine with text analysis
const combinedEmotions = {
  textBased: analyzeTextEmotions(transcription.text),
  audioBased: audioEmotions,
};

// Send to coach for feedback
const feedback = await generateFeedback(transcription, combinedEmotions);
```

## Next Steps

1. Choose an emotion detection service/approach
2. Implement the audio analysis function
3. Update the transcription API to include emotion analysis
4. Update the coach prompt to use acoustic emotion features

