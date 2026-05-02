import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Clock, Bookmark, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { saveQuiz } from '../lib/storage';

// ── Smart distractor engine ──────────────────────────────────────────────────

// Strip punctuation from a word
const clean = (w) => w.replace(/[^a-zA-Z0-9'-]/g, '').trim();

// Extract a pool of meaningful words from the full document text
const buildWordPool = (text) => {
  const stopWords = new Set([
    'the','a','an','and','or','but','in','on','at','to','for','of','with',
    'by','from','this','that','these','those','is','are','was','were','be',
    'been','being','have','has','had','do','does','did','will','would','could',
    'should','may','might','shall','can','not','no','nor','so','yet','both',
    'either','neither','as','if','though','although','because','since','while',
    'when','where','who','which','what','how','all','each','every','any','some',
    'such','its','their','our','your','his','her','my','it','they','we','i',
    'he','she','you','them','him','her','us','me','more','also','then','than',
    'into','about','over','after','before','during','through','between','among',
  ]);

  const words = text
    .split(/\s+/)
    .map(clean)
    .filter(w => w.length > 3 && !stopWords.has(w.toLowerCase()));
  
  // Unique pool, case-preserved
  const seen = new Set();
  return words.filter(w => {
    const key = w.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// Get words that are "similar" to the correct answer:
// same first letter, similar length (±3 chars), from the document pool
const getPlausibleDistractors = (correctWord, allWords, count = 3) => {
  const target = correctWord.toLowerCase();
  const targetLen = correctWord.length;
  const firstChar = target[0];

  // Score each candidate by plausibility
  const scored = allWords
    .filter(w => w.toLowerCase() !== target)
    .map(w => {
      let score = 0;
      const wl = w.toLowerCase();
      // Same first letter → very plausible
      if (wl[0] === firstChar) score += 3;
      // Similar length (within ±3) → plausible
      const lenDiff = Math.abs(w.length - targetLen);
      if (lenDiff <= 1) score += 3;
      else if (lenDiff <= 3) score += 2;
      else if (lenDiff <= 5) score += 1;
      // Shares a suffix (e.g., -tion, -ing, -ment) → very plausible
      const suffix3 = target.slice(-3);
      if (wl.endsWith(suffix3)) score += 2;
      // Small random noise so we don't always pick the same ones
      score += Math.random() * 0.5;
      return { w, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count * 3)              // oversample
    .sort(() => Math.random() - 0.5)  // shuffle
    .slice(0, count)
    .map(x => x.w);

  // Pad with transformed versions of the correct word if not enough
  while (scored.length < count) {
    scored.push(correctWord + 's');
  }
  return scored;
};

// Main question generator
const generateQuestionsLocally = (text, config) => {
  if (!text || text.trim().length < 20) {
    text = "The mitochondria produces energy for the cell. The nucleus contains DNA. Ribosomes synthesise proteins. The cell membrane controls what enters and exits. Photosynthesis converts light into glucose.";
  }

  // Sentence extraction — keeps sentences 15–160 chars long
  const allSentences = (text.match(/[A-Z][^.!?]{15,160}[.!?]/g) || [text.split('.').filter(Boolean)[0] + '.']).map(s => s.trim());

  // Remove near-duplicate sentences (same first 30 chars)
  const seenStarts = new Set();
  const sentences = allSentences.filter(s => {
    const k = s.slice(0, 30).toLowerCase();
    if (seenStarts.has(k)) return false;
    seenStarts.add(k);
    return true;
  });

  const wordPool = buildWordPool(text);
  const numQuestions = Math.max(1, parseInt(config.numQuestions) || 5);
  const questions = [];
  const usedSentenceIndices = new Set();

  for (let i = 0; i < numQuestions; i++) {
    // Pick a fresh sentence (avoid reuse unless we run out)
    let sentIdx;
    let attempts = 0;
    do {
      sentIdx = Math.floor(Math.random() * sentences.length);
      attempts++;
    } while (usedSentenceIndices.has(sentIdx) && attempts < sentences.length * 2);
    usedSentenceIndices.add(sentIdx);

    const sentence = sentences[sentIdx].trim();
    const isTrueFalse = config.type === 'true-false' || (config.type === 'mixed' && Math.random() > 0.5);

    if (isTrueFalse) {
      // 50% chance the statement is true as-is; 50% chance we swap one keyword to make it false
      const sentWords = sentence.split(' ').map(clean).filter(w => w.length > 4);
      const swapWord = sentWords[Math.floor(Math.random() * sentWords.length)] || 'thing';
      const distractors = getPlausibleDistractors(swapWord, wordPool, 1);
      const isTrue = Math.random() > 0.5;
      const displaySentence = isTrue
        ? sentence
        : sentence.replace(new RegExp(`\\b${swapWord}\\b`, 'i'), distractors[0] || swapWord + 's');

      questions.push({
        id: i + 1,
        text: `True or False: ${displaySentence}`,
        options: ['True', 'False'],
        correctAnswer: isTrue ? 'True' : 'False',
        explanation: `The document states: "${sentence}"`,
      });
    } else {
      // Multiple choice: blank out a key noun/verb
      const sentWords = sentence.split(' ').map(clean).filter(w => w.length > 4);
      if (sentWords.length === 0) {
        i--; // try again
        continue;
      }
      const keyword = sentWords[Math.floor(Math.random() * sentWords.length)];
      if (!keyword || keyword.length === 0) { i--; continue; }

      // Build fill-in-the-blank question
      const blanked = sentence.replace(new RegExp(`\\b${keyword}\\b`, 'gi'), '______');
      
      // Get 3 contextually plausible (but wrong) distractors from the SAME document
      const distractors = getPlausibleDistractors(keyword, wordPool, 3);

      // Shuffle all 4 options
      const options = [keyword, ...distractors].sort(() => Math.random() - 0.5);

      questions.push({
        id: i + 1,
        text: `Fill in the blank: ${blanked}`,
        options,
        correctAnswer: keyword,
        explanation: `The complete sentence from your document: "${sentence}"`,
      });
    }
  }

  return questions;
};

export default function QuizTaking() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [bookmarked, setBookmarked] = useState([]);
  const [timeLeft, setTimeLeft] = useState(600);
  const [showWarning, setShowWarning] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const quizTitle = location.state?.title || "Document Quiz";
  
  useEffect(() => {
    // Generate questions once on mount
    if (location.state?.questions) {
      // Retaking quiz (passed questions)
      setQuestions(location.state.questions);
      setIsLoading(false);
    } else {
      // New quiz generation
      const text = location.state?.extractedText || '';
      const config = location.state?.config || { numQuestions: 5, type: 'multiple-choice' };
      
      // Simulate slight processing delay for realism
      setTimeout(() => {
        const generated = generateQuestionsLocally(text, config);
        setQuestions(generated);
        setTimeLeft(generated.length * 60); // 1 minute per question
        setIsLoading(false);
      }, 1000);
    }
  }, [location.state]);

  useEffect(() => {
    if (isLoading) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isLoading]);

  const handleSelect = (opt) => {
    setAnswers({ ...answers, [currentQ]: opt });
    setShowWarning(false);
  };

  const toggleBookmark = () => {
    if (bookmarked.includes(currentQ)) {
      setBookmarked(bookmarked.filter(q => q !== currentQ));
    } else {
      setBookmarked([...bookmarked, currentQ]);
    }
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) setCurrentQ(currentQ + 1);
  };

  const handlePrev = () => {
    if (currentQ > 0) setCurrentQ(currentQ - 1);
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < questions.length) {
      setShowWarning(true);
      return;
    }

    const results = questions.map((q, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === q.correctAnswer;
      return { ...q, userAnswer, isCorrect };
    });

    const score = results.filter(r => r.isCorrect).length;

    const quizData = {
      id: Date.now().toString(),
      userEmail: user.email,
      title: quizTitle,
      score,
      total: questions.length,
      timeTaken: (questions.length * 60) - timeLeft,
      createdAt: new Date().toISOString(),
      results
    };

    saveQuiz(quizData);
    navigate('/results', { state: { quiz: quizData } });
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <Loader2 size={48} className="text-primary animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
        <h2 className="gradient-text">Analyzing Document & Crafting Quiz...</h2>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (questions.length === 0) return <div>Failed to generate questions.</div>;

  const progress = ((Object.keys(answers).length) / questions.length) * 100;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{quizTitle}</h2>
            <p style={{ color: 'var(--text-muted)' }}>Question {currentQ + 1} of {questions.length}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: '600', color: timeLeft < 60 ? 'var(--danger)' : 'var(--primary)' }}>
            <Clock size={24} />
            {formatTime(timeLeft)}
          </div>
        </div>
        
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2.5rem', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.5rem', lineHeight: '1.5' }}>
            {questions[currentQ].text}
          </h3>
          <button 
            onClick={toggleBookmark}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: bookmarked.includes(currentQ) ? 'var(--warning)' : 'var(--text-muted)' }}
          >
            <Bookmark size={28} fill={bookmarked.includes(currentQ) ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
          {questions[currentQ].options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleSelect(opt)}
              style={{
                display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', 
                borderRadius: 'var(--radius-md)', border: '2px solid',
                borderColor: answers[currentQ] === opt ? 'var(--primary)' : 'var(--surface-border)',
                background: answers[currentQ] === opt ? 'rgba(99, 102, 241, 0.05)' : 'var(--surface)',
                color: 'var(--text-color)', fontSize: '1.1rem', cursor: 'pointer',
                transition: 'all 0.2s ease', textAlign: 'left'
              }}
            >
              <div style={{ 
                width: '24px', height: '24px', borderRadius: '50%', border: '2px solid',
                borderColor: answers[currentQ] === opt ? 'var(--primary)' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {answers[currentQ] === opt && <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)' }} />}
              </div>
              {opt}
            </button>
          ))}
        </div>

        {showWarning && (
          <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <AlertTriangle size={20} />
            You have unanswered questions. Please complete all questions before submitting.
          </div>
        )}

        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', borderTop: '1px solid var(--surface-border)' }}>
          <button className="btn btn-secondary" onClick={handlePrev} disabled={currentQ === 0}>
            <ChevronLeft size={20} /> Previous
          </button>
          
          {currentQ === questions.length - 1 ? (
            <button className="btn btn-primary" onClick={handleSubmit}>
              <CheckCircle2 size={20} /> Submit Quiz
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleNext}>
              Next <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
