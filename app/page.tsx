'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function Home() {
  const [transcript, setTranscript] = useState('');
  const [audience, setAudience] = useState('');
  const [goal, setGoal] = useState('');
  const [duration, setDuration] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript,
          context: Object.keys(context).length > 0 ? context : undefined,
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
            <textarea
              id="transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste or type your pitch transcript here..."
              required
            />
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

