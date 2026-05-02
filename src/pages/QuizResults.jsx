import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Award, Clock, CheckCircle2, XCircle, RotateCcw, Share2, Download, ChevronRight, Copy, Check } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { saveSharedQuiz } from '../lib/storage';

export default function QuizResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const [copyDone, setCopyDone] = React.useState(false);
  const [shareLink, setShareLink] = React.useState('');

  const quiz = location.state?.quiz;

  if (!quiz) {
    return (
      <div style={{ textAlign: 'center', marginTop: '5rem' }}>
        <h2>No quiz results found.</h2>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')} style={{ marginTop: '1rem' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const { title, score, total, timeTaken, results } = quiz;
  const percentage = Math.round((score / total) * 100);

  const formatTime = (seconds) => {
    const m = Math.floor((seconds ?? 0) / 60);
    const s = (seconds ?? 0) % 60;
    return `${m}m ${s}s`;
  };

  // ── Export as PDF ─────────────────────────────────────────────────────────
  const handleExport = async () => {
    const doc    = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW  = doc.internal.pageSize.getWidth();
    const pageH  = doc.internal.pageSize.getHeight();
    const margin = 16;
    const usableW = pageW - margin * 2;
    const halfW   = (usableW - 6) / 2;
    const col2    = margin + halfW + 6;
    const FOOTER  = 14;
    let y = 0;

    const C = {
      primary : [99,  102, 241],
      accent  : [139, 92,  246],
      success : [16,  185, 129],
      danger  : [239, 68,  68],
      dark    : [30,  35,  70],
      mid     : [90,  95,  130],
      light   : [245, 246, 255],
      white   : [255, 255, 255],
      border  : [215, 217, 240],
    };

    // Guard: new page if needed
    const guard = (needed) => {
      if (y + needed > pageH - FOOTER - 4) { doc.addPage(); y = 24; }
    };

    // Single-line text (does NOT change y)
    const t = (text, x, yy, size, bold, col) => {
      doc.setFontSize(size);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setTextColor(...col);
      doc.text(String(text), x, yy);
    };

    // Horizontal rule (advances y)
    const hr = (col = C.border, lw = 0.25) => {
      doc.setDrawColor(...col); doc.setLineWidth(lw);
      doc.line(margin, y, pageW - margin, y); y += 5;
    };

    // Filled rounded rect (does NOT change y)
    const fbox = (bx, by, bw, bh, r, fill) => {
      doc.setFillColor(...fill);
      doc.roundedRect(bx, by, bw, bh, r, r, 'F');
    };

    // Load logo
    let logo = null;
    try {
      const res = await fetch('/logo.png');
      if (res.ok) {
        const blob = await res.blob();
        logo = await new Promise(resolve => {
          const fr = new FileReader();
          fr.onloadend = () => resolve(fr.result);
          fr.readAsDataURL(blob);
        });
      }
    } catch (_) {}

    // ── HEADER BANNER ─────────────────────────────────────────────────────
    doc.setFillColor(...C.primary);
    doc.rect(0, 0, pageW, 48, 'F');
    doc.setFillColor(...C.accent);
    doc.circle(pageW + 5, -5, 30, 'F');

    if (logo) doc.addImage(logo, 'PNG', margin, 8, 20, 20);
    else {
      fbox(margin, 10, 18, 18, 4, C.white);
      t('Q', margin + 5, 22, 13, true, C.primary);
    }
    t('QuizGenius AI',               margin + 25, 17,   15,  true,  C.white);
    t('AI-Powered Quiz Results Report', margin + 25, 24, 8.5, false, [200, 202, 255]);

    doc.setDrawColor(255, 255, 255); doc.setLineWidth(0.2);
    doc.line(margin, 29, pageW - margin, 29);

    t('REPORT FOR',                         margin, 37,  7.5, false, [180, 183, 255]);
    t(doc.splitTextToSize(title, usableW - 10)[0], margin, 45, 11, true,  C.white);

    y = 58;

    // ── SUMMARY CARDS ──────────────────────────────────────────────────────
    const bW = (usableW - 8) / 3;
    const bH = 26;

    const summaryCard = (label, value, sub, bx, highlight) => {
      fbox(bx, y, bW, bH, 3, highlight ? C.light : [250, 250, 255]);
      doc.setDrawColor(...C.border); doc.setLineWidth(0.25);
      doc.roundedRect(bx, y, bW, bH, 3, 3, 'S');
      t(label, bx + 4, y + 6.5, 7,  false, C.mid);
      t(value, bx + 4, y + 16,  13, true,  highlight ? C.primary : C.dark);
      t(sub,   bx + 4, y + 22,  7,  false, C.mid);
    };

    const grade = percentage >= 90 ? 'Excellent' : percentage >= 70 ? 'Passed' : 'Needs Work';
    const avgSec = total > 0 ? Math.round((timeTaken ?? 0) / total) : 0;
    summaryCard('FINAL SCORE', `${score} / ${total}`, `${percentage}% accuracy`, margin, true);
    summaryCard('TIME TAKEN',  formatTime(timeTaken),  `~${avgSec}s / question`, margin + bW + 4, false);
    summaryCard('GRADE',       grade, new Date(quiz.createdAt).toLocaleDateString('en-GB'), margin + (bW + 4) * 2, false);
    y += bH + 8;

    // Accuracy bar
    t('ACCURACY', margin, y, 7.5, true, C.mid); y += 4;
    fbox(margin, y, usableW, 4.5, 2, C.border);
    fbox(margin, y, Math.max(2, usableW * percentage / 100), 4.5, 2, percentage >= 70 ? C.success : C.danger);
    t(`${percentage}%`, margin + usableW + 2, y + 3.5, 7.5, true, C.primary);
    y += 12;

    hr(C.border, 0.35);

    // ── QUESTION REVIEW ───────────────────────────────────────────────────
    t('QUESTION REVIEW', margin, y, 8.5, true, C.mid); y += 8;

    results.forEach((item, idx) => {
      const isOk    = item.isCorrect;
      const okCol   = isOk ? C.success : C.danger;
      const okBg    = isOk ? [236, 253, 245] : [254, 242, 242];
      const statusTx = isOk ? '✓  CORRECT' : '✗  INCORRECT';

      // Pre-measure line arrays
      const qLines   = doc.setFontSize(10) || doc.splitTextToSize(`${idx + 1}.  ${item.text}`, usableW);
      const qaLines  = doc.setFontSize(9)  || doc.splitTextToSize(String(item.userAnswer || '—'), halfW - 5);
      const caLines  = doc.setFontSize(9)  || doc.splitTextToSize(String(item.correctAnswer || '—'), halfW - 5);
      const expLines = doc.setFontSize(8.5)|| doc.splitTextToSize(String(item.explanation || ''), usableW - 7);

      // Re-split after font-size calls
      doc.setFontSize(10);
      const qL  = doc.splitTextToSize(`${idx + 1}.  ${item.text}`, usableW);
      doc.setFontSize(9);
      const qaL = doc.splitTextToSize(String(item.userAnswer || '—'), halfW - 5);
      const caL = doc.splitTextToSize(String(item.correctAnswer || '—'), halfW - 5);
      doc.setFontSize(8.5);
      const exL = doc.splitTextToSize(String(item.explanation || ''), usableW - 7);

      const qH    = qL.length * 5.5 + 4;
      const ansBoxH = Math.max(qaL.length, caL.length) * 5 + 13;
      const expH  = exL.length * 4.5 + 10;
      guard(qH + ansBoxH + expH + 20);

      // Question text
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.dark);
      qL.forEach(line => { doc.text(line, margin, y); y += 5.5; });
      y += 3;

      // ── YOUR ANSWER box (left) ──
      guard(ansBoxH);
      const boxTop = y;
      fbox(margin, boxTop, halfW, ansBoxH, 2.5, okBg);
      fbox(margin, boxTop, halfW, 7, 2.5, okCol);
      doc.setFillColor(...okCol); doc.rect(margin, boxTop + 5, halfW, 2, 'F');
      t('YOUR ANSWER', margin + 3, boxTop + 5.3, 7, true, C.white);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.dark);
      let ay = boxTop + 12;
      qaL.forEach(line => { doc.text(line, margin + 3, ay); ay += 5; });

      // ── CORRECT ANSWER box (right) ──
      fbox(col2, boxTop, halfW, ansBoxH, 2.5, [236, 253, 245]);
      fbox(col2, boxTop, halfW, 7, 2.5, C.success);
      doc.setFillColor(...C.success); doc.rect(col2, boxTop + 5, halfW, 2, 'F');
      t('CORRECT ANSWER', col2 + 3, boxTop + 5.3, 7, true, C.white);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.success);
      let cy = boxTop + 12;
      caL.forEach(line => { doc.text(line, col2 + 3, cy); cy += 5; });

      y = boxTop + ansBoxH + 4;

      // Status pill
      guard(8);
      const pillW = doc.getStringUnitWidth(statusTx) * 8.5 / doc.internal.scaleFactor + 10;
      fbox(margin, y, pillW, 6.5, 2, okCol);
      t(statusTx, margin + 4, y + 4.5, 7.5, true, C.white);
      y += 10;

      // Explanation block
      guard(expH);
      fbox(margin, y, usableW, expH, 2.5, [248, 247, 255]);
      doc.setFillColor(...C.accent); doc.rect(margin, y, 2.5, expH, 'F');
      t('Explanation', margin + 6, y + 5.5, 8, true, C.accent);
      doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.mid);
      let ey = y + 10;
      exL.forEach(line => { doc.text(line, margin + 6, ey); ey += 4.5; });
      y += expH + 8;

      if (idx < results.length - 1) hr([228, 229, 248], 0.2);
    });

    // ── FOOTER — every page ──────────────────────────────────────────────
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      const fy = pageH - FOOTER + 1;
      fbox(0, fy, pageW, FOOTER, 0, C.light);
      doc.setDrawColor(...C.border); doc.setLineWidth(0.25);
      doc.line(0, fy, pageW, fy);
      if (logo) doc.addImage(logo, 'PNG', margin, fy + 3, 6, 6);
      t('QuizGenius AI', margin + 9, fy + 8, 7.5, true, C.primary);
      t(`Generated: ${new Date().toLocaleDateString('en-GB', { dateStyle: 'long' })}`, margin + 42, fy + 8, 7, false, C.mid);
      t(`Page ${p} of ${totalPages}`, pageW - margin - 22, fy + 8, 7.5, false, C.mid);
    }

    doc.save(`${title.replace(/\s+/g, '_')}_QuizGenius_Results.pdf`);
  };

  // ── Share link ────────────────────────────────────────────────────────────
  const handleShare = () => {
    const shareId = saveSharedQuiz(quiz);
    const url = `${window.location.origin}/shared/${shareId}`;
    setShareLink(url);
    navigator.clipboard.writeText(url).then(() => {
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 3000);
    });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    });
  };

  return (
    <div className="animate-slide-up" style={{ maxWidth: '900px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '100px', height: '100px', borderRadius: '50%',
          background: percentage >= 70 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
          color: percentage >= 70 ? 'var(--success)' : 'var(--warning)',
          marginBottom: '1.5rem'
        }}>
          <Award size={64} />
        </div>
        <h1 className="gradient-text" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>Quiz Completed!</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Results for: <strong>{title}</strong></p>
      </div>

      {/* Stats */}
      <div className="card-grid" style={{ marginBottom: '3rem' }}>
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '500' }}>Final Score</p>
          <div style={{ fontSize: '3rem', fontWeight: '700', color: 'var(--primary)' }}>{score}/{total}</div>
          <div className="badge badge-primary" style={{ marginTop: '0.5rem' }}>{percentage}% Accuracy</div>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '500' }}>Time Taken</p>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Clock size={32} style={{ color: 'var(--text-muted)' }} />
            {formatTime(timeTaken)}
          </div>
          <div className="badge" style={{ marginTop: '0.5rem', background: 'var(--surface-border)' }}>
            {total > 0 ? `~${Math.round((timeTaken ?? 0) / total)}s / question` : ''}
          </div>
        </div>

        {/* Actions */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn btn-primary" style={{ width: '100%' }}
            onClick={() => navigate('/take-quiz', { state: { title, questions: results.map(r => ({ text: r.text, options: r.options, correctAnswer: r.correctAnswer, explanation: r.explanation })) } })}>
            <RotateCcw size={18} /> Retake Quiz
          </button>
          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleExport}>
            <Download size={18} /> Export as PDF
          </button>
          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleShare}>
            <Share2 size={18} /> {shareLink ? 'Share again' : 'Generate Share Link'}
          </button>

          {shareLink && (
            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid var(--primary)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{shareLink}</span>
              <button onClick={copyLink} title="Copy link" style={{ background: 'none', border: 'none', cursor: 'pointer', color: copyDone ? 'var(--success)' : 'var(--primary)', flexShrink: 0 }}>
                {copyDone ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          )}
          {copyDone && <p style={{ color: 'var(--success)', fontSize: '0.85rem', textAlign: 'center', margin: 0 }}>✓ Link copied!</p>}
        </div>
      </div>

      {/* Detailed Review */}
      <h2 style={{ marginBottom: '1.5rem' }}>Detailed Review</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {results.map((item, i) => (
          <div key={i} className="glass-panel" style={{ padding: '2rem', borderLeft: `6px solid ${item.isCorrect ? 'var(--success)' : 'var(--danger)'}` }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ marginTop: '0.25rem' }}>
                {item.isCorrect ? <CheckCircle2 size={24} color="var(--success)" /> : <XCircle size={24} color="var(--danger)" />}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', lineHeight: '1.5' }}>
                  <span style={{ color: 'var(--text-muted)', marginRight: '0.4rem' }}>Q{i + 1}.</span>{item.text}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: item.isCorrect ? '1fr' : '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ background: item.isCorrect ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', padding: '0.9rem', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Your Answer</p>
                    <p style={{ fontWeight: '600', color: item.isCorrect ? 'var(--success)' : 'var(--danger)' }}>{item.userAnswer || '—'}</p>
                  </div>
                  {!item.isCorrect && (
                    <div style={{ background: 'rgba(16,185,129,0.06)', padding: '0.9rem', borderRadius: 'var(--radius-md)' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Correct Answer</p>
                      <p style={{ fontWeight: '600', color: 'var(--success)' }}>{item.correctAnswer}</p>
                    </div>
                  )}
                </div>
                <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)' }}>
                  <p style={{ fontWeight: '600', marginBottom: '0.4rem', color: 'var(--accent)' }}>✨ Explanation</p>
                  <p style={{ color: 'var(--text-color)', lineHeight: '1.6', fontSize: '0.95rem' }}>{item.explanation}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '3rem', textAlign: 'center' }}>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')} style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
          Back to Dashboard <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
