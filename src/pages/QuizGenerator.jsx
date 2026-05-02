import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings, Sliders, Hash, Type, Loader2 } from 'lucide-react';

export default function QuizGenerator() {
  const navigate = useNavigate();
  const location = useLocation();
  const title = location.state?.title || 'Your Document';

  const extractedText = location.state?.extractedText || '';

  const [isGenerating, setIsGenerating] = useState(false);
  const [config, setConfig] = useState({
    numQuestions: 5,
    type: 'multiple-choice',
    difficulty: 'medium',
    topic: ''
  });

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate API call to generate quiz
    setTimeout(() => {
      setIsGenerating(false);
      navigate('/take-quiz', { state: { title, extractedText, config } });
    }, 1500);
  };

  return (
    <div className="animate-slide-up" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Configure Your Quiz</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
          Customize how you want to be tested on "{title}"
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          
          <div>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Hash size={18} className="text-primary" />
              Number of Questions
            </label>
            <select 
              className="input-field" 
              value={config.numQuestions}
              onChange={(e) => setConfig({...config, numQuestions: e.target.value})}
            >
              <option value="5">5 Questions</option>
              <option value="10">10 Questions</option>
              <option value="15">15 Questions</option>
              <option value="20">20 Questions</option>
            </select>
          </div>

          <div>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Type size={18} className="text-primary" />
              Question Type
            </label>
            <select 
              className="input-field"
              value={config.type}
              onChange={(e) => setConfig({...config, type: e.target.value})}
            >
              <option value="multiple-choice">Multiple Choice</option>
              <option value="true-false">True / False</option>
              <option value="short-answer">Short Answer</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>

          <div>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sliders size={18} className="text-primary" />
              Difficulty Level
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {['easy', 'medium', 'hard'].map(level => (
                <button
                  key={level}
                  className={`btn ${config.difficulty === level ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, textTransform: 'capitalize' }}
                  onClick={() => setConfig({...config, difficulty: level})}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={18} className="text-primary" />
              Specific Topic Focus (Optional)
            </label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g., Cell Division, Mitosis"
              value={config.topic}
              onChange={(e) => setConfig({...config, topic: e.target.value})}
            />
          </div>
        </div>

        <div style={{ marginTop: '3rem', borderTop: '1px solid var(--surface-border)', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/upload')}>
            Back
          </button>
          
          <button 
            className="btn btn-primary" 
            style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 size={24} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                Generating AI Quiz...
              </>
            ) : (
              'Generate Quiz Now'
            )}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
