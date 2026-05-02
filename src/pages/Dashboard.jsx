import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Clock, TrendingUp, Award, FolderOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserQuizzes } from '../lib/storage';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recentQuizzes, setRecentQuizzes] = useState([]);

  useEffect(() => {
    if (user) {
      setRecentQuizzes(getUserQuizzes(user.email));
    }
  }, [user]);

  const avgScore = recentQuizzes.length 
    ? Math.round(recentQuizzes.reduce((acc, q) => acc + (q.score / q.total), 0) / recentQuizzes.length * 100) 
    : 0;

  return (
    <div className="animate-slide-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Welcome back, {user?.name.split(' ')[0]}! 👋</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Here's your learning progress so far.</p>
        </div>
        <button onClick={() => navigate('/upload')} className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
          <Plus size={24} />
          Create New Quiz
        </button>
      </div>

      <div className="card-grid" style={{ marginBottom: '3rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--primary)' }}>
            <FileText size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Documents Uploaded</p>
            <h3 style={{ fontSize: '1.8rem', margin: 0 }}>{recentQuizzes.length}</h3>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--success)' }}>
            <Award size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Average Score</p>
            <h3 style={{ fontSize: '1.8rem', margin: 0 }}>{avgScore}%</h3>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--secondary)' }}>
            <TrendingUp size={32} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Quizzes Taken</p>
            <h3 style={{ fontSize: '1.8rem', margin: 0 }}>{recentQuizzes.length}</h3>
          </div>
        </div>
      </div>

      <h2 style={{ marginBottom: '1.5rem' }}>Your Quizzes</h2>
      
      {recentQuizzes.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(99, 102, 241, 0.1)', padding: '1.5rem', borderRadius: '50%', color: 'var(--primary)', marginBottom: '1.5rem' }}>
            <FolderOpen size={48} />
          </div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No quizzes yet</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Upload a document to generate your first AI-powered quiz.</p>
          <button onClick={() => navigate('/upload')} className="btn btn-primary">
            Get Started
          </button>
        </div>
      ) : (
        <div className="card-grid">
          {recentQuizzes.map(quiz => (
            <div key={quiz.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ background: 'var(--primary)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <FileText size={20} />
                </div>
                <span className={`badge ${quiz.score/quiz.total >= 0.7 ? 'badge-success' : 'badge-warning'}`}>
                  {quiz.score}/{quiz.total}
                </span>
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{quiz.title}</h3>
                <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <Clock size={16} />
                  {new Date(quiz.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ width: '100%', marginTop: 'auto' }}
                onClick={() => navigate('/results', { state: { quiz } })}
              >
                Review Results
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
