'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export default function Home() {
  const [transcript, setTranscript] = useState('');
  const [audience, setAudience] = useState('');
  const [goal, setGoal] = useState('');
  const [duration, setDuration] = useState('');
  const [scenario, setScenario] = useState('');
  const [englishLevel, setEnglishLevel] = useState('');
  const [toneStyle, setToneStyle] = useState('');
  const [constraints, setConstraints] = useState('');
  const [notesFromUser, setNotesFromUser] = useState('');
  const [wantsDeploySuggestions, setWantsDeploySuggestions] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isRecordingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError('');
      setTranscript('');

      // Request microphone permission and start recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Initialize MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Combine all chunks into a single blob
        const audioBlob = new Blob(chunksRef.current, { 
          type: mediaRecorder.mimeType || 'audio/webm' 
        });
        
        // Transcribe using ElevenLabs
        setIsTranscribing(true);
        try {
          const formData = new FormData();
          const audioFile = new File([audioBlob], 'recording.webm', { 
            type: audioBlob.type 
          });
          formData.append('audio', audioFile);

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to transcribe audio');
          }

          setTranscript(data.transcription || '');
        } catch (err: any) {
          setError(err.message || 'Failed to transcribe recording');
        } finally {
          setIsTranscribing(false);
          chunksRef.current = [];
        }
      };

      setIsRecording(true);
      isRecordingRef.current = true;
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
    } catch (err: any) {
      setError('Could not access microphone. Please check permissions.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's an audio file
    if (!file.type.startsWith('audio/')) {
      setError('Please upload an audio file (mp3, wav, m4a, etc.)');
      return;
    }

    setIsTranscribing(true);
    setError('');
    setTranscript('');

    try {
      const formData = new FormData();
      formData.append('audio', file);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to transcribe audio');
      }

      setTranscript(data.transcription || '');
    } catch (err: any) {
      setError(err.message || 'Failed to transcribe audio file');
    } finally {
      setIsTranscribing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFeedback('');

    try {
      const context: any = {};
      if (audience) context.audience = audience;
      if (goal) context.goal = goal;
      if (duration) context.duration = duration;
      if (scenario) context.scenario = scenario;
      if (englishLevel) context.english_level = englishLevel;
      if (toneStyle) context.tone_style = toneStyle;
      if (constraints) context.constraints = constraints;
      if (notesFromUser) context.notes_from_user = notesFromUser;

      const sessionInfo: any = {};
      if (wantsDeploySuggestions) {
        sessionInfo.wants_deploy_suggestions = true;
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript,
          context: Object.keys(context).length > 0 ? context : undefined,
          session_info: Object.keys(sessionInfo).length > 0 ? sessionInfo : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze pitch');
      }

      setFeedback(data.feedback);
    } catch (err: any) {
      setError(err.message || 'An error occurred while analyzing your pitch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>SpeakWise Real</h1>
      <p className="subtitle">AI-Powered Pitch & Communication Coach</p>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="transcript">
              Pitch Transcript <span style={{ color: 'red' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              {!isRecording ? (
                <>
                  <button
                    type="button"
                    onClick={startRecording}
                    style={{
                      background: '#10b981',
                      padding: '0.5rem 1rem',
                      fontSize: '0.9rem',
                    }}
                  >
                    🎤 Record Pitch
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isTranscribing}
                    style={{
                      background: '#3b82f6',
                      padding: '0.5rem 1rem',
                      fontSize: '0.9rem',
                      opacity: isTranscribing ? 0.6 : 1,
                    }}
                  >
                    {isTranscribing ? '⏳ Transcribing...' : '📁 Upload Audio File'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  style={{
                    background: '#ef4444',
                    padding: '0.5rem 1rem',
                    fontSize: '0.9rem',
                  }}
                >
                  ⏹️ Stop Recording ({formatTime(recordingTime)})
                </button>
              )}
            </div>
            <textarea
              id="transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={isRecording ? "Speak your pitch... (transcription will appear here)" : "Paste, type, or record your pitch transcript here..."}
              required
              style={{
                minHeight: '150px',
                borderColor: isRecording ? '#10b981' : undefined,
                borderWidth: isRecording ? '2px' : undefined,
              }}
            />
            {isRecording && (
              <div style={{ 
                marginTop: '0.5rem', 
                color: '#10b981', 
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }}></span>
                Recording... Speak clearly into your microphone (using ElevenLabs)
              </div>
            )}
            {isTranscribing && (
              <div style={{ 
                marginTop: '0.5rem', 
                color: '#3b82f6', 
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#3b82f6',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }}></span>
                Transcribing with ElevenLabs...
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="optional">Optional Context</label>
            <div className="context-fields">
              <div>
                <label htmlFor="audience" style={{ fontSize: '0.9rem', fontWeight: 400 }}>
                  Audience
                </label>
                <input
                  type="text"
                  id="audience"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="e.g., Investors, Job interviewers, Customers"
                />
              </div>
              <div>
                <label htmlFor="goal" style={{ fontSize: '0.9rem', fontWeight: 400 }}>
                  Goal
                </label>
                <input
                  type="text"
                  id="goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g., Secure funding, Get hired, Close sale"
                />
              </div>
              <div>
                <label htmlFor="duration" style={{ fontSize: '0.9rem', fontWeight: 400 }}>
                  Duration
                </label>
                <input
                  type="text"
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 3 minutes, 30 seconds, 5 minutes"
                />
              </div>
              <div>
                <label htmlFor="scenario" style={{ fontSize: '0.9rem', fontWeight: 400 }}>
                  Scenario
                </label>
                <input
                  type="text"
                  id="scenario"
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  placeholder="e.g., Investor pitch, Job interview, Sales call"
                />
              </div>
              <div>
                <label htmlFor="englishLevel" style={{ fontSize: '0.9rem', fontWeight: 400 }}>
                  English Level
                </label>
                <select
                  id="englishLevel"
                  value={englishLevel}
                  onChange={(e) => setEnglishLevel(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem' }}
                >
                  <option value="">Select level...</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="fluent">Fluent</option>
                </select>
              </div>
              <div>
                <label htmlFor="toneStyle" style={{ fontSize: '0.9rem', fontWeight: 400 }}>
                  Tone/Style
                </label>
                <select
                  id="toneStyle"
                  value={toneStyle}
                  onChange={(e) => setToneStyle(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem' }}
                >
                  <option value="">Select tone...</option>
                  <option value="confident">Confident</option>
                  <option value="friendly">Friendly</option>
                  <option value="inspiring">Inspiring</option>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="constraints" style={{ fontSize: '0.9rem', fontWeight: 400 }}>
                  Constraints
                </label>
                <input
                  type="text"
                  id="constraints"
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  placeholder="e.g., No jargon, Non-native audience, Max 1 minute"
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="notesFromUser" style={{ fontSize: '0.9rem', fontWeight: 400 }}>
                  Additional Notes
                </label>
                <input
                  type="text"
                  id="notesFromUser"
                  value={notesFromUser}
                  onChange={(e) => setNotesFromUser(e.target.value)}
                  placeholder="e.g., This is my first attempt, I'm nervous, I want something punchy"
                />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="wantsDeploySuggestions"
                  checked={wantsDeploySuggestions}
                  onChange={(e) => setWantsDeploySuggestions(e.target.checked)}
                  style={{ width: 'auto' }}
                />
                <label htmlFor="wantsDeploySuggestions" style={{ fontSize: '0.9rem', fontWeight: 400, margin: 0 }}>
                  Include deploy/sharing suggestions (title, description, tags)
                </label>
              </div>
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <button type="submit" disabled={loading || !transcript.trim()}>
            {loading ? 'Analyzing...' : 'Analyze Pitch'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="card">
          <div className="loading">Analyzing your pitch... This may take a moment.</div>
        </div>
      )}

      {feedback && (
        <div className="card">
          <div className="feedback-content">
            <ReactMarkdown>{feedback}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

