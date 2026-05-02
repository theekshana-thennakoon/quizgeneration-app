import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Award, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { getSharedQuiz } from '../lib/storage';

export default function SharedQuiz() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const data = getSharedQuiz(shareId);
    if (data) setQuiz(data);
    else setNotFound(true);
  }, [shareId]);

  if (notFound) {
    return (
      <div style={{ textAlign: 'center', marginTop: '6rem' }}>
        <div style={{ display: 'inline-flex', color: 'var(--danger)', marginBottom: '1rem' }}>
          <AlertCircle size={64} />
        </div>
        <h2 style={{ marginBottom: '0.75rem' }}>Shared Quiz Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          This link may have expired or been removed.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Go to Home</button>
      </div>
    );
  }

  if (!quiz) {
    return <div style={{ textAlign: 'center', marginTop: '6rem', color: 'var(--text-muted)' }}>Loading...</div>;
  }

  const { title, score, total, timeTaken, results, sharedAt } = quiz;
  const percentage = Math.round((score / total) * 100);
  const formatTime = (s) => `${Math.floor(s / 60)}m ${s % 60}s`;

  return (
    <div className="animate-slide-up" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary), var(--accent))',
        borderRadius: 'var(--radius-lg)', padding: '1.5rem 2rem',
        marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem'
      }}>
        <Award size={36} color="white" />
        <div>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', margin: 0 }}>Shared Quiz Result</p>
          <h2 style={{ color: 'white', margin: 0, fontSize: '1.4rem' }}>{title}</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', margin: 0 }}>
            Shared on {new Date(sharedAt).toLocaleDateString('en-GB', { dateStyle: 'long' })}
          </p>
        </div>
      </div>

      {/* Score cards */}
      <div className="card-grid" style={{ marginBottom: '2.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.75rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontWeight: '500', marginBottom: '0.4rem' }}>Score</p>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--primary)' }}>{score}/{total}</div>
          <div className="badge badge-primary" style={{ marginTop: '0.4rem' }}>{percentage}%</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.75rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontWeight: '500', marginBottom: '0.4rem' }}>Time Taken</p>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Clock size={28} style={{ color: 'var(--text-muted)' }} /> {formatTime(timeTaken ?? 0)}
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.75rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontWeight: '500', marginBottom: '0.4rem' }}>Result</p>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: percentage >= 70 ? 'var(--success)' : 'var(--warning)' }}>
            {percentage >= 90 ? '🏆 Excellent' : percentage >= 70 ? '🎯 Passed' : '📚 Needs Work'}
          </div>
        </div>
      </div>

      {/* Question review */}
      <h2 style={{ marginBottom: '1.5rem' }}>Question Review</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {results.map((item, i) => (
          <div key={i} className="glass-panel" style={{
            padding: '1.75rem',
            borderLeft: `6px solid ${item.isCorrect ? 'var(--success)' : 'var(--danger)'}`
          }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ marginTop: '0.2rem' }}>
                {item.isCorrect
                  ? <CheckCircle2 size={22} color="var(--success)" />
                  : <XCircle size={22} color="var(--danger)" />}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: '600', marginBottom: '0.75rem', lineHeight: '1.5' }}>
                  <span style={{ color: 'var(--text-muted)', marginRight: '0.4rem' }}>Q{i + 1}.</span>
                  {item.text}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: item.isCorrect ? '1fr' : '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ background: item.isCorrect ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.2rem' }}>Given Answer</p>
                    <p style={{ fontWeight: '600', color: item.isCorrect ? 'var(--success)' : 'var(--danger)', margin: 0 }}>{item.userAnswer}</p>
                  </div>
                  {!item.isCorrect && (
                    <div style={{ background: 'rgba(16,185,129,0.08)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.2rem' }}>Correct Answer</p>
                      <p style={{ fontWeight: '600', color: 'var(--success)', margin: 0 }}>{item.correctAnswer}</p>
                    </div>
                  )}
                </div>
                <div style={{ background: 'var(--surface)', padding: '0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)' }}>
                  <p style={{ fontWeight: '600', color: 'var(--accent)', marginBottom: '0.3rem', fontSize: '0.9rem' }}>✨ Explanation</p>
                  <p style={{ color: 'var(--text-color)', lineHeight: '1.6', fontSize: '0.9rem', margin: 0 }}>{item.explanation}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ marginTop: '3rem', textAlign: 'center', padding: '2.5rem', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Want to create your own quiz?</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Upload any document and get an AI-generated quiz in seconds.</p>
        <button className="btn btn-primary" onClick={() => navigate('/auth')} style={{ padding: '1rem 2.5rem' }}>
          Try QuizGenius AI Free
        </button>
      </div>
    </div>
  );
}
