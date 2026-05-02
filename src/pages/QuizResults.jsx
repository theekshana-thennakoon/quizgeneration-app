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
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  // ── Export as PDF ────────────────────────────────────────────────────────────
  const handleExport = async () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW  = doc.internal.pageSize.getWidth();   // 210
    const pageH  = doc.internal.pageSize.getHeight();  // 297
    const margin = 18;
    const usableW = pageW - margin * 2;

    // ── Colours ──
    const C = {
      primary:  [99,  102, 241],
      accent:   [139, 92,  246],
      success:  [16,  185, 129],
      danger:   [239, 68,  68],
      dark:     [22,  27,  58],
      mid:      [80,  85,  115],
      light:    [245, 246, 255],
      white:    [255, 255, 255],
      border:   [220, 222, 240],
    };

    let y = 0;

    /* ── Utility helpers ─────────────────────────────── */
    const checkPage = (needed = 15) => {
      if (y + needed > pageH - 18) { doc.addPage(); y = 28; }
    };

    const txt = (text, x, yy, size, bold, color) => {
      doc.setFontSize(size);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setTextColor(...color);
      doc.text(text, x, yy);
    };

    const wrappedTxt = (text, x, startY, size, bold, color, maxW) => {
      doc.setFontSize(size);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(String(text), maxW);
      lines.forEach(line => {
        checkPage(size * 0.5 + 2);
        doc.text(line, x, y);
        y += size * 0.48;
      });
      y += 1.5;
    };

    const hLine = (col = C.border, thickness = 0.3) => {
      doc.setDrawColor(...col);
      doc.setLineWidth(thickness);
      doc.line(margin, y, pageW - margin, y);
      y += 5;
    };

    const pill = (text, x, yy, bgColor, textColor) => {
      const w = doc.getStringUnitWidth(text) * 9 / doc.internal.scaleFactor + 6;
      doc.setFillColor(...bgColor);
      doc.roundedRect(x, yy - 4.5, w, 6.5, 2, 2, 'F');
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textColor);
      doc.text(text, x + 3, yy);
    };

    /* ── Try to load logo ──────────────────────────────── */
    let logoBase64 = null;
    try {
      const resp = await fetch('/logo.png');
      if (resp.ok) {
        const blob = await resp.blob();
        logoBase64 = await new Promise(res => {
          const reader = new FileReader();
          reader.onloadend = () => res(reader.result);
          reader.readAsDataURL(blob);
        });
      }
    } catch (_) { /* logo unavailable — skip */ }

    /* ═══════════════════════════════════════════════════
       PAGE 1 — COVER SECTION
    ═══════════════════════════════════════════════════ */

    // Deep header bar
    doc.setFillColor(...C.primary);
    doc.rect(0, 0, pageW, 52, 'F');

    // Accent circle decoration (top-right)
    doc.setFillColor(...C.accent);
    doc.circle(pageW - 10, -8, 28, 'F');
    doc.setFillColor(255, 255, 255, 0.08);
    doc.circle(pageW + 5, 55, 22, 'F');

    // Logo
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', margin, 7, 22, 22);
    } else {
      // Fallback drawn icon: white circle with "Q"
      doc.setFillColor(...C.white);
      doc.circle(margin + 9, 18, 9, 'F');
      txt('Q', margin + 6, 21, 14, true, C.primary);
    }

    // Brand name
    txt('QuizGenius AI', margin + 27, 16, 16, true, C.white);
    txt('AI-Powered Quiz Results Report', margin + 27, 23, 9, false, [200, 202, 255]);

    // Thin separator inside header
    doc.setDrawColor(255, 255, 255, 0.3);
    doc.setLineWidth(0.3);
    doc.line(margin, 30, pageW - margin, 30);

    // Quiz title
    txt('Quiz Report', margin, 40, 9, false, [200, 202, 255]);
    const titleLines = doc.splitTextToSize(title, usableW - 40);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.white);
    doc.text(titleLines[0], margin, 48); // show first line only in header

    y = 62;

    /* ── Score summary row ─── */
    const boxH = 28;
    const boxW = (usableW - 8) / 3;

    const drawSummaryBox = (label, value, sub, bx, highlight) => {
      doc.setFillColor(...(highlight ? C.light : [250, 250, 255]));
      doc.roundedRect(bx, y, boxW, boxH, 3, 3, 'F');
      doc.setDrawColor(...C.border);
      doc.setLineWidth(0.3);
      doc.roundedRect(bx, y, boxW, boxH, 3, 3, 'S');
      txt(label,  bx + 5, y + 7,  7.5, false, C.mid);
      txt(value,  bx + 5, y + 17, 14, true, highlight ? C.primary : C.dark);
      txt(sub,    bx + 5, y + 23, 7.5, false, C.mid);
    };

    const gradeLabel = percentage >= 90 ? 'Excellent 🏆' :
                       percentage >= 70 ? 'Passed ✓'    : 'Needs Review';

    drawSummaryBox('FINAL SCORE', `${score} / ${total}`, `${percentage}% accuracy`, margin, true);
    drawSummaryBox('TIME TAKEN',  formatTime(timeTaken ?? 0), `~${Math.round((timeTaken ?? 0) / total)}s per Q`, margin + boxW + 4, false);
    drawSummaryBox('GRADE',       gradeLabel, new Date(quiz.createdAt).toLocaleDateString('en-GB'), margin + (boxW + 4) * 2, false);
    y += boxH + 10;

    /* ── Score progress bar ── */
    txt('ACCURACY', margin, y, 8, true, C.mid);
    y += 4;
    doc.setFillColor(...C.border);
    doc.roundedRect(margin, y, usableW, 5, 2, 2, 'F');
    doc.setFillColor(...(percentage >= 70 ? C.success : C.danger));
    doc.roundedRect(margin, y, usableW * percentage / 100, 5, 2, 2, 'F');
    txt(`${percentage}%`, margin + usableW + 2, y + 4, 8, true, C.primary);
    y += 12;

    hLine(C.border, 0.4);

    /* ═══════════════════════════════════════════════════
       QUESTIONS SECTION
    ═══════════════════════════════════════════════════ */
    txt('QUESTION REVIEW', margin, y, 9, true, C.mid);
    y += 7;

    results.forEach((item, idx) => {
      checkPage(35);

      const isOk = item.isCorrect;
      const accentCol = isOk ? C.success : C.danger;
      const bgCol     = isOk ? [240, 253, 244] : [254, 242, 242];
      const statusTxt = isOk ? '✓  CORRECT' : '✗  INCORRECT';

      // Question number badge + text
      doc.setFillColor(...C.primary);
      doc.roundedRect(margin, y, 8, 6, 1.5, 1.5, 'F');
      txt(`${idx + 1}`, margin + 2.2, y + 4.4, 7, true, C.white);

      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...C.dark);
      const qLines = doc.splitTextToSize(item.text, usableW - 12);
      let qy = y;
      qLines.forEach(line => {
        doc.text(line, margin + 11, qy + 4.5);
        qy += 5.2;
      });
      y = qy + 2;

      // Answer row
      checkPage(20);
      const ansW = (usableW - 6) / 2;

      // Your answer box
      doc.setFillColor(...bgCol);
      doc.roundedRect(margin, y, ansW, 16, 2, 2, 'F');
      doc.setFillColor(...accentCol);
      doc.roundedRect(margin, y, ansW, 5, 2, 2, 'F');
      doc.roundedRect(margin, y + 3, ansW, 2, 0, 0, 'F'); // flatten bottom corners
      txt('YOUR ANSWER', margin + 3, y + 3.8, 7, true, C.white);
      wrappedTxt(item.userAnswer || '—', margin + 3, y, 9, false, C.dark, ansW - 4);
      y -= 1.5;

      // Correct answer box (shown always, green)
      const cx = margin + ansW + 6;
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(cx, y - 14, ansW, 16, 2, 2, 'F');
      doc.setFillColor(...C.success);
      doc.roundedRect(cx, y - 14, ansW, 5, 2, 2, 'F');
      doc.roundedRect(cx, y - 11, ansW, 2, 0, 0, 'F');
      txt('CORRECT ANSWER', cx + 3, y - 10.2, 7, true, C.white);
      doc.setFontSize(9);
      doc.setFont('helvetica', isOk ? 'bold' : 'normal');
      doc.setTextColor(...C.success);
      doc.text(item.correctAnswer || '—', cx + 3, y - 4);

      // Status pill
      pill(statusTxt, margin, y + 3, accentCol, C.white);
      y += 10;

      // Explanation block
      checkPage(14);
      doc.setFillColor(248, 247, 255);
      const expLines = doc.splitTextToSize(`Explanation: ${item.explanation}`, usableW - 8);
      const expH = expLines.length * 4.8 + 5;
      doc.roundedRect(margin, y, usableW, expH, 2, 2, 'F');
      doc.setFillColor(...C.accent);
      doc.roundedRect(margin, y, 2, expH, 1, 1, 'F');
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...C.mid);
      expLines.forEach((line, li) => doc.text(line, margin + 5, y + 4.5 + li * 4.8));
      y += expH + 8;

      if (idx < results.length - 1) hLine([230, 230, 245], 0.25);
    });

    /* ═══════════════════════════════════════════════════
       FOOTER — every page
    ═══════════════════════════════════════════════════ */
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      // footer bar
      doc.setFillColor(...C.light);
      doc.rect(0, pageH - 14, pageW, 14, 'F');
      doc.setDrawColor(...C.border);
      doc.setLineWidth(0.3);
      doc.line(0, pageH - 14, pageW, pageH - 14);

      if (logoBase64) doc.addImage(logoBase64, 'PNG', margin, pageH - 12, 7, 7);
      txt('QuizGenius AI', margin + 9, pageH - 6.5, 8, true, C.primary);
      txt(`Generated on ${new Date().toLocaleDateString('en-GB', { dateStyle: 'long' })}`, margin + 40, pageH - 6.5, 7.5, false, C.mid);
      txt(`Page ${p} of ${totalPages}`, pageW - margin - 18, pageH - 6.5, 8, false, C.mid);
    }

    doc.save(`${title.replace(/\s+/g, '_')}_QuizGenius_Results.pdf`);
  };

  // ── Share link ───────────────────────────────────────────────────────────────
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
      {/* ── Header ── */}
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

      {/* ── Stats ── */}
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
            {formatTime(timeTaken ?? 0)}
          </div>
          <div className="badge" style={{ marginTop: '0.5rem', background: 'var(--surface-border)' }}>
            {total > 0 ? `~${Math.round((timeTaken ?? 0) / total)}s / question` : ''}
          </div>
        </div>

        {/* ── Actions card ── */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={() => navigate('/take-quiz', {
              state: {
                title,
                questions: results.map(r => ({
                  text: r.text, options: r.options,
                  correctAnswer: r.correctAnswer, explanation: r.explanation
                }))
              }
            })}
          >
            <RotateCcw size={18} /> Retake Quiz
          </button>

          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleExport}>
            <Download size={18} /> Export as PDF
          </button>

          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleShare}>
            <Share2 size={18} /> {shareLink ? 'Share again' : 'Generate Share Link'}
          </button>

          {/* ── Shareable link box ── */}
          {shareLink && (
            <div style={{
              background: 'rgba(99,102,241,0.08)', border: '1px solid var(--primary)',
              borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem',
              display: 'flex', alignItems: 'center', gap: '0.75rem'
            }}>
              <span style={{
                fontSize: '0.78rem', color: 'var(--text-muted)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1
              }}>{shareLink}</span>
              <button
                onClick={copyLink}
                title="Copy link"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: copyDone ? 'var(--success)' : 'var(--primary)', flexShrink: 0
                }}
              >
                {copyDone ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          )}
          {copyDone && (
            <p style={{ color: 'var(--success)', fontSize: '0.85rem', textAlign: 'center', margin: 0 }}>
              ✓ Link copied to clipboard!
            </p>
          )}
        </div>
      </div>

      {/* ── Detailed Review ── */}
      <h2 style={{ marginBottom: '1.5rem' }}>Detailed Review</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {results.map((item, i) => (
          <div key={i} className="glass-panel" style={{
            padding: '2rem',
            borderLeft: `6px solid ${item.isCorrect ? 'var(--success)' : 'var(--danger)'}`
          }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ marginTop: '0.25rem' }}>
                {item.isCorrect
                  ? <CheckCircle2 size={24} color="var(--success)" />
                  : <XCircle size={24} color="var(--danger)" />}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', lineHeight: '1.5' }}>
                  <span style={{ color: 'var(--text-muted)', marginRight: '0.4rem' }}>Q{i + 1}.</span>
                  {item.text}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: item.isCorrect ? '1fr' : '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{
                    background: item.isCorrect ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                    padding: '0.9rem', borderRadius: 'var(--radius-md)'
                  }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Your Answer</p>
                    <p style={{ fontWeight: '600', color: item.isCorrect ? 'var(--success)' : 'var(--danger)' }}>
                      {item.userAnswer || '—'}
                    </p>
                  </div>
                  {!item.isCorrect && (
                    <div style={{ background: 'rgba(16,185,129,0.06)', padding: '0.9rem', borderRadius: 'var(--radius-md)' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Correct Answer</p>
                      <p style={{ fontWeight: '600', color: 'var(--success)' }}>{item.correctAnswer}</p>
                    </div>
                  )}
                </div>

                <div style={{
                  background: 'var(--surface)', padding: '1rem',
                  borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)'
                }}>
                  <p style={{ fontWeight: '600', marginBottom: '0.4rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    ✨ Explanation
                  </p>
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
