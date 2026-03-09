/**
 * ============================================================
 * SCHOOL ASSISTANT — Main Overlay UI
 * Transparent, draggable, always-on-top floating panel
 * Tabs: AI Screen Reader | Chat | Past Papers | History
 * ============================================================
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { analyzeScreen, chat, getPapers, uploadPaper, getPaperQuestions, generateQuiz, getHistory, clearHistory, deletePaper } from './services/api';

// ── Check if running in Electron ───────────────────────────
const isElectron = () => {
  return typeof window !== 'undefined' && window.process && window.process.type === 'renderer';
};

let ipcRenderer = null;
if (isElectron()) {
  try { ipcRenderer = window.require('electron').ipcRenderer; } catch(e) {}
}

// ── Styles ──────────────────────────────────────────────────
const styles = {
  wrapper: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    padding: '0',
    background: 'transparent',
  },
  panel: {
    width: '410px',
    maxHeight: '680px',
    background: 'rgba(10, 10, 20, 0.88)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    border: '1px solid rgba(120, 100, 255, 0.3)',
    boxShadow: '0 8px 40px rgba(100, 80, 255, 0.25), 0 0 0 1px rgba(255,255,255,0.05)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    color: '#e8e8f0',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    fontSize: '13px',
    userSelect: 'none',
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 99999,
    transition: 'opacity 0.3s ease',
  },
  header: {
    padding: '12px 16px 10px',
    background: 'linear-gradient(135deg, rgba(100,80,255,0.4) 0%, rgba(60,40,180,0.4) 100%)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    cursor: 'move',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    WebkitAppRegion: 'drag',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
  logo: { fontSize: '20px' },
  title: { fontWeight: '700', fontSize: '14px', color: '#fff', letterSpacing: '0.3px' },
  subtitle: { fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginTop: '1px' },
  headerRight: { display: 'flex', gap: '6px', alignItems: 'center', WebkitAppRegion: 'no-drag' },
  iconBtn: {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    color: '#fff',
    width: '26px',
    height: '26px',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    transition: 'background 0.2s',
  },
  controls: {
    padding: '10px 14px',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    WebkitAppRegion: 'no-drag',
  },
  startBtn: {
    flex: 1,
    padding: '8px 14px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '700',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.2s',
  },
  stopBtn: {
    background: 'linear-gradient(135deg, #ff4466, #cc2244)',
    color: '#fff',
    boxShadow: '0 2px 12px rgba(255,50,80,0.35)',
  },
  goBtn: {
    background: 'linear-gradient(135deg, #44dd88, #22aa55)',
    color: '#fff',
    boxShadow: '0 2px 12px rgba(50,220,120,0.35)',
  },
  snapBtn: {
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.06)',
    color: '#ccc',
    cursor: 'pointer',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontWeight: '600',
  },
  opacityRow: {
    padding: '0 14px 8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11px',
    color: 'rgba(255,255,255,0.45)',
    WebkitAppRegion: 'no-drag',
  },
  slider: { flex: 1, accentColor: '#7060ff' },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    WebkitAppRegion: 'no-drag',
  },
  tab: {
    flex: 1,
    padding: '8px 4px',
    border: 'none',
    background: 'transparent',
    color: 'rgba(255,255,255,0.4)',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    borderBottom: '2px solid transparent',
    letterSpacing: '0.2px',
  },
  activeTab: {
    color: '#a090ff',
    borderBottom: '2px solid #7060ff',
    background: 'rgba(112,96,255,0.08)',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 14px',
    WebkitAppRegion: 'no-drag',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(255,255,255,0.1) transparent',
  },
  statusBar: {
    padding: '6px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    fontSize: '10px',
    color: 'rgba(255,255,255,0.4)',
    background: 'rgba(0,0,0,0.2)',
  },
  dot: (color) => ({
    width: '6px', height: '6px', borderRadius: '50%',
    background: color, display: 'inline-block',
    boxShadow: `0 0 6px ${color}`,
  }),
  card: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    padding: '12px',
    marginBottom: '10px',
  },
  questionTag: {
    display: 'inline-block',
    background: 'rgba(100,80,255,0.2)',
    color: '#a090ff',
    padding: '2px 7px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '700',
    marginBottom: '6px',
  },
  answerBox: {
    background: 'rgba(50,200,100,0.08)',
    border: '1px solid rgba(50,200,100,0.2)',
    borderRadius: '8px',
    padding: '10px',
    marginTop: '8px',
    color: '#88ddaa',
    lineHeight: '1.5',
    fontSize: '12px',
  },
  inputRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
    WebkitAppRegion: 'no-drag',
  },
  input: {
    flex: 1,
    padding: '9px 12px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '12px',
    outline: 'none',
  },
  sendBtn: {
    padding: '9px 14px',
    background: 'linear-gradient(135deg, #7060ff, #5040cc)',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '12px',
  },
  msgUser: {
    background: 'rgba(112,96,255,0.2)',
    border: '1px solid rgba(112,96,255,0.3)',
    borderRadius: '10px 10px 2px 10px',
    padding: '8px 10px',
    marginBottom: '8px',
    color: '#c8c0ff',
    fontSize: '12px',
    alignSelf: 'flex-end',
    maxWidth: '90%',
    marginLeft: 'auto',
  },
  msgAI: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px 10px 10px 2px',
    padding: '8px 10px',
    marginBottom: '8px',
    color: '#e0e0f0',
    fontSize: '12px',
    lineHeight: '1.55',
    maxWidth: '95%',
  },
  uploadBox: {
    border: '2px dashed rgba(112,96,255,0.3)',
    borderRadius: '10px',
    padding: '20px',
    textAlign: 'center',
    cursor: 'pointer',
    marginBottom: '12px',
    color: 'rgba(255,255,255,0.4)',
    transition: 'all 0.2s',
  },
  badge: (color) => ({
    display: 'inline-block',
    background: `rgba(${color},0.15)`,
    border: `1px solid rgba(${color},0.3)`,
    borderRadius: '4px',
    padding: '1px 6px',
    fontSize: '10px',
    fontWeight: '600',
    marginLeft: '6px',
  }),
  quizOption: (selected, correct, checked) => ({
    padding: '7px 10px',
    marginBottom: '5px',
    borderRadius: '6px',
    cursor: checked ? 'default' : 'pointer',
    border: `1px solid ${
      checked && correct ? 'rgba(50,220,100,0.5)' :
      checked && selected && !correct ? 'rgba(255,80,80,0.5)' :
      selected ? 'rgba(112,96,255,0.5)' :
      'rgba(255,255,255,0.08)'
    }`,
    background: checked && correct ? 'rgba(50,220,100,0.1)' :
                checked && selected && !correct ? 'rgba(255,80,80,0.1)' :
                selected ? 'rgba(112,96,255,0.1)' :
                'rgba(255,255,255,0.03)',
    color: '#e0e0f0',
    fontSize: '11px',
    transition: 'all 0.15s',
  }),
};

// ── Loading Spinner ─────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
      <div style={{
        width: '24px', height: '24px',
        border: '3px solid rgba(255,255,255,0.1)',
        borderTopColor: '#7060ff',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── SCREEN TAB ───────────────────────────────────────────────
function ScreenTab({ isRunning, lastAnalysis, onManualCapture, loading }) {
  if (loading) return <Spinner />;

  if (!lastAnalysis && !isRunning) {
    return (
      <div style={{ textAlign: 'center', padding: '30px 10px', color: 'rgba(255,255,255,0.3)' }}>
        <div style={{ fontSize: '40px', marginBottom: '10px' }}>👁️</div>
        <div style={{ fontWeight: '600', marginBottom: '6px', color: 'rgba(255,255,255,0.5)' }}>Screen Reader Ready</div>
        <div style={{ fontSize: '11px', lineHeight: '1.5' }}>Press ▶ Start to begin auto-monitoring<br/>or 📸 Snap for a one-time capture</div>
      </div>
    );
  }

  if (!lastAnalysis) {
    return (
      <div style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.4)' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
        <div>Monitoring screen...</div>
        <div style={{ fontSize: '11px', marginTop: '4px', color: 'rgba(255,255,255,0.3)' }}>Looking for questions & forms</div>
      </div>
    );
  }

  const { analysis } = lastAnalysis;

  return (
    <div>
      {/* Summary */}
      <div style={{ ...styles.card, marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
          Screen Summary
          {analysis.subject && <span style={styles.badge('180,140,255')}>{analysis.subject}</span>}
        </div>
        <div style={{ color: '#d0d0e8', fontSize: '12px', lineHeight: '1.4' }}>
          {analysis.summary || 'Screen captured successfully.'}
        </div>
      </div>

      {/* Questions & Answers */}
      {analysis.questions && analysis.questions.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#a090ff', marginBottom: '8px' }}>
            🎯 {analysis.questions.length} Question{analysis.questions.length > 1 ? 's' : ''} Detected
          </div>
          {analysis.questions.map((q, i) => (
            <div key={i} style={styles.card}>
              <div style={styles.questionTag}>Q{q.number || i+1} · {q.type || 'Question'}</div>
              <div style={{ color: '#d0d8ff', fontSize: '12px', lineHeight: '1.4', marginBottom: '8px' }}>
                {q.question}
              </div>
              <div style={styles.answerBox}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#44cc88', marginBottom: '4px' }}>✅ ANSWER</div>
                {q.answer}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Fields */}
      {analysis.formFields && analysis.formFields.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#ffa060', marginBottom: '8px' }}>
            📝 {analysis.formFields.length} Form Field{analysis.formFields.length > 1 ? 's' : ''} Detected
          </div>
          {analysis.formFields.map((f, i) => (
            <div key={i} style={{ ...styles.card, borderColor: 'rgba(255,160,96,0.2)' }}>
              <div style={{ fontSize: '10px', color: '#ffa060', marginBottom: '3px' }}>{f.label} · {f.fieldType}</div>
              <div style={{ color: '#ffe0c0', fontSize: '12px' }}>→ Fill: <strong>{f.suggestedValue}</strong></div>
            </div>
          ))}
        </div>
      )}

      {/* Tips */}
      {analysis.tips && analysis.tips.length > 0 && (
        <div style={{ ...styles.card, borderColor: 'rgba(255,200,80,0.15)', background: 'rgba(255,200,80,0.04)' }}>
          <div style={{ fontSize: '10px', color: '#ffcc40', fontWeight: '700', marginBottom: '6px' }}>💡 Study Tips</div>
          {analysis.tips.map((tip, i) => (
            <div key={i} style={{ fontSize: '11px', color: '#ffe090', marginBottom: '3px' }}>• {tip}</div>
          ))}
        </div>
      )}

      {!analysis.hasQuestions && !analysis.hasForms && (
        <div style={{ textAlign: 'center', padding: '16px', color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
          No questions or forms detected on screen.<br/>
          <span style={{ fontSize: '11px' }}>Try navigating to an exam or form page.</span>
        </div>
      )}
    </div>
  );
}

// ── CHAT TAB ────────────────────────────────────────────────
function ChatTab() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '👋 Hi! I\'m your AI school assistant powered by Gemini. Ask me anything — maths, science, history, essays, you name it!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setLoading(true);
    try {
      const history = messages.slice(-6).map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', content: m.content }));
      const result = await chat(question, history);
      setMessages(prev => [...prev, { role: 'assistant', content: result.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Error: ' + (err.response?.data?.error || err.message) }]);
    }
    setLoading(false);
  };

  return (
    <div>
      <div style={styles.inputRow}>
        <input
          style={styles.input}
          placeholder="Ask anything — maths, science, history..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <button style={styles.sendBtn} onClick={send} disabled={loading}>
          {loading ? '...' : '→'}
        </button>
      </div>
      <div>
        {messages.map((m, i) => (
          <div key={i} style={m.role === 'user' ? styles.msgUser : styles.msgAI}>
            {m.role === 'assistant' && <span style={{ fontSize: '10px', color: '#7060ff', fontWeight: '700', display: 'block', marginBottom: '3px' }}>🤖 AI Assistant</span>}
            <span style={{ whiteSpace: 'pre-wrap' }}>{m.content}</span>
          </div>
        ))}
        {loading && <div style={styles.msgAI}><Spinner /></div>}
        <div ref={endRef} />
      </div>
    </div>
  );
}

// ── PAPERS TAB ──────────────────────────────────────────────
function PapersTab() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizChecked, setQuizChecked] = useState(false);
  const [view, setView] = useState('list'); // list | questions | quiz
  const fileRef = useRef(null);

  useEffect(() => { loadPapers(); }, []);

  async function loadPapers() {
    setLoading(true);
    try {
      const res = await getPapers();
      setPapers(res.papers || []);
    } catch (e) {}
    setLoading(false);
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('paper', file);
    fd.append('title', file.name.replace('.pdf', ''));
    try {
      await uploadPaper(fd);
      await loadPapers();
      alert('✅ Paper uploaded and processed!');
    } catch (err) {
      alert('❌ Upload failed: ' + (err.response?.data?.error || err.message));
    }
    setUploading(false);
    e.target.value = '';
  }

  async function openQuestions(paper) {
    setSelectedPaper(paper);
    setLoading(true);
    try {
      const res = await getPaperQuestions(paper.id);
      setQuestions(res.questions || []);
      setView('questions');
    } catch (e) {}
    setLoading(false);
  }

  async function startQuiz(paper) {
    setSelectedPaper(paper);
    setLoading(true);
    try {
      const res = await generateQuiz(paper.id, 5);
      setQuiz(res.quiz || []);
      setQuizAnswers({});
      setQuizChecked(false);
      setView('quiz');
    } catch (e) { alert('❌ Quiz generation failed'); }
    setLoading(false);
  }

  async function handleDelete(paperId) {
    if (!window.confirm('Delete this paper?')) return;
    await deletePaper(paperId);
    await loadPapers();
  }

  const score = quiz ? quiz.filter((q, i) => quizAnswers[i] === q.correct).length : 0;

  if (loading) return <Spinner />;

  if (view === 'questions' && selectedPaper) {
    return (
      <div>
        <button onClick={() => setView('list')} style={{ ...styles.snapBtn, marginBottom: '10px', width: '100%', justifyContent: 'center' }}>
          ← Back to Papers
        </button>
        <div style={{ fontWeight: '700', color: '#a090ff', marginBottom: '10px' }}>{selectedPaper.title}</div>
        {questions.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '20px' }}>No questions extracted yet.</div>
        ) : questions.map((q, i) => (
          <div key={i} style={styles.card}>
            <div style={styles.questionTag}>Q{q.question_number || i+1}{q.marks ? ` · ${q.marks}mk` : ''}</div>
            <div style={{ color: '#d0d8ff', fontSize: '12px', marginBottom: '8px', lineHeight: '1.4' }}>{q.question_text}</div>
            {q.answer_text && (
              <div style={styles.answerBox}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#44cc88', marginBottom: '3px' }}>✅ Answer</div>
                {q.answer_text}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (view === 'quiz' && quiz) {
    return (
      <div>
        <button onClick={() => setView('list')} style={{ ...styles.snapBtn, marginBottom: '10px', width: '100%', justifyContent: 'center' }}>
          ← Back to Papers
        </button>
        <div style={{ fontWeight: '700', color: '#a090ff', marginBottom: '4px' }}>📝 Quiz — {selectedPaper?.title}</div>
        {quizChecked && (
          <div style={{ ...styles.card, borderColor: 'rgba(100,220,150,0.3)', background: 'rgba(50,180,100,0.1)', textAlign: 'center', marginBottom: '10px' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#44dd88' }}>{score}/{quiz.length}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
              {score === quiz.length ? '🏆 Perfect!' : score >= quiz.length/2 ? '👍 Good effort!' : '📚 Keep revising!'}
            </div>
          </div>
        )}
        {quiz.map((q, qi) => (
          <div key={qi} style={{ ...styles.card, marginBottom: '10px' }}>
            <div style={styles.questionTag}>Q{qi+1}</div>
            <div style={{ color: '#d0d8ff', fontSize: '12px', marginBottom: '8px', lineHeight: '1.4' }}>{q.question}</div>
            {q.options.map((opt, oi) => {
              const letter = opt.charAt(0);
              const isSelected = quizAnswers[qi] === letter;
              const isCorrect = q.correct === letter;
              return (
                <div key={oi}
                  style={styles.quizOption(isSelected, isCorrect, quizChecked)}
                  onClick={() => !quizChecked && setQuizAnswers(prev => ({ ...prev, [qi]: letter }))}>
                  {opt}
                  {quizChecked && isCorrect && ' ✅'}
                  {quizChecked && isSelected && !isCorrect && ' ❌'}
                </div>
              );
            })}
            {quizChecked && (
              <div style={{ marginTop: '6px', fontSize: '11px', color: '#88aaff', lineHeight: '1.4' }}>
                💡 {q.explanation}
              </div>
            )}
          </div>
        ))}
        {!quizChecked ? (
          <button onClick={() => setQuizChecked(true)} style={{ ...styles.sendBtn, width: '100%', padding: '10px' }}>
            Check Answers ✓
          </button>
        ) : (
          <button onClick={() => { setQuizChecked(false); setQuizAnswers({}); }} style={{ ...styles.snapBtn, width: '100%', justifyContent: 'center', padding: '10px' }}>
            Retry Quiz 🔄
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Upload */}
      <div
        style={styles.uploadBox}
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { const fakeEvent = { target: { files: [f], value: '' } }; handleUpload(fakeEvent); } }}
      >
        {uploading ? <div>⏳ Processing with AI...</div> : (
          <>
            <div style={{ fontSize: '28px', marginBottom: '6px' }}>📄</div>
            <div style={{ fontWeight: '600', fontSize: '12px' }}>Drop PDF here or click to upload</div>
            <div style={{ fontSize: '10px', marginTop: '3px' }}>Past papers, worksheets, textbook chapters</div>
          </>
        )}
      </div>
      <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleUpload} />

      {/* Papers list */}
      {papers.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '20px', fontSize: '12px' }}>
          No papers uploaded yet.<br/>Upload a PDF to start revising!
        </div>
      ) : papers.map(paper => (
        <div key={paper.id} style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', color: '#e0e0ff', fontSize: '12px', marginBottom: '3px' }}>{paper.title}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                {paper.subject} {paper.year ? `· ${paper.year}` : ''} · {paper.question_count} questions
              </div>
            </div>
            <button onClick={() => handleDelete(paper.id)} style={{ ...styles.iconBtn, background: 'rgba(255,60,60,0.15)', color: '#ff6666', marginLeft: '6px' }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            <button onClick={() => openQuestions(paper)} style={{ ...styles.snapBtn, flex: 1, justifyContent: 'center' }}>
              📖 Review
            </button>
            <button onClick={() => startQuiz(paper)} style={{ ...styles.sendBtn, flex: 1, padding: '6px' }}>
              🎯 Quiz Me
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── HISTORY TAB ──────────────────────────────────────────────
function HistoryTab() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await getHistory();
      setHistory(res.history || []);
    } catch (e) {}
    setLoading(false);
  }

  async function handleClear() {
    if (!window.confirm('Clear all history?')) return;
    await clearHistory();
    setHistory([]);
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{history.length} answers saved</div>
        {history.length > 0 && (
          <button onClick={handleClear} style={{ ...styles.iconBtn, fontSize: '10px', width: 'auto', padding: '4px 8px', background: 'rgba(255,60,60,0.15)', color: '#ff8888' }}>
            Clear All
          </button>
        )}
      </div>
      {history.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '20px', fontSize: '12px' }}>
          No history yet.<br/>Start the screen reader or ask questions in Chat!
        </div>
      ) : history.map((h, i) => (
        <div key={i} style={{ ...styles.card, marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div style={styles.questionTag}>{h.source === 'screen' ? '👁️ Screen' : '💬 Chat'}</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>
              {new Date(h.created_at).toLocaleDateString()}
            </div>
          </div>
          <div style={{ color: '#b0b0d0', fontSize: '11px', marginBottom: '6px', fontStyle: 'italic' }}>"{h.question}"</div>
          <div style={{ color: '#d0d8ff', fontSize: '11px', lineHeight: '1.4' }}>{h.answer.substring(0, 200)}{h.answer.length > 200 ? '...' : ''}</div>
        </div>
      ))}
    </div>
  );
}

// ── MAIN APP ────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState('screen');
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState(null);
  const [opacity, setOpacity] = useState(0.92);
  const [status, setStatus] = useState('Ready');
  const [backendOk, setBackendOk] = useState(false);
  const intervalRef = useRef(null);
  const panelRef = useRef(null);
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, startLeft: 0, startTop: 0 });

  // Check backend on startup
  useEffect(() => {
    fetch('http://localhost:3001/health')
      .then(r => r.json())
      .then(() => { setBackendOk(true); setStatus('Backend connected ✓'); })
      .catch(() => { setStatus('⚠️ Backend offline — start it first'); });
  }, []);

  // Listen for Electron global shortcut trigger
  useEffect(() => {
    if (ipcRenderer) {
      ipcRenderer.on('trigger-analyze', () => captureAndAnalyze());
      return () => ipcRenderer.removeAllListeners('trigger-analyze');
    }
  }, []);

  // Set opacity
  useEffect(() => {
    if (ipcRenderer) ipcRenderer.send('set-opacity', opacity);
  }, [opacity]);

  // Auto-monitor loop
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(captureAndAnalyze, 4000);
      setStatus('🔴 Live — monitoring screen');
    } else {
      clearInterval(intervalRef.current);
      if (backendOk) setStatus('Monitoring stopped');
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  // Capture & analyze
  const captureAndAnalyze = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setStatus('Analyzing screen...');
    try {
      let screenshot = null;

      if (ipcRenderer) {
        // Electron: use desktopCapturer
        const result = await ipcRenderer.invoke('capture-screen');
        if (result.success) screenshot = result.screenshot;
      } else {
        // Web: use getDisplayMedia
        try {
          const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          const track = stream.getVideoTracks()[0];
          const imageCapture = new ImageCapture(track);
          const bitmap = await imageCapture.grabFrame();
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(bitmap.width, 1280);
          canvas.height = Math.round(bitmap.height * (canvas.width / bitmap.width));
          const ctx = canvas.getContext('2d');
          ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
          screenshot = canvas.toDataURL('image/png');
          stream.getTracks().forEach(t => t.stop());
        } catch (e) {
          setStatus('❌ Screen permission denied');
          setLoading(false);
          return;
        }
      }

      if (screenshot) {
        const result = await analyzeScreen(screenshot);
        setLastAnalysis(result);
        const qCount = result.analysis?.questions?.length || 0;
        setStatus(qCount > 0 ? `✅ Found ${qCount} question${qCount > 1 ? 's' : ''}!` : '✓ Screen analyzed — no questions found');
        if (tab !== 'screen') setTab('screen');
      }
    } catch (err) {
      setStatus('❌ Analysis failed: ' + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  }, [loading, tab]);

  // Drag logic (mouse)
  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    dragRef.current = { isDragging: true, startX: e.clientX, startY: e.clientY, startLeft: rect.left, startTop: rect.top };
    e.preventDefault();
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!dragRef.current.isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const panel = panelRef.current;
      if (panel) {
        panel.style.left = (dragRef.current.startLeft + dx) + 'px';
        panel.style.top = (dragRef.current.startTop + dy) + 'px';
        panel.style.right = 'auto';
      }
    };
    const onUp = () => { dragRef.current.isDragging = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  return (
    <div style={styles.wrapper}>
      <div ref={panelRef} style={{ ...styles.panel, opacity }}>
        {/* ── Header ────────────────────────────────── */}
        <div style={styles.header} onMouseDown={onMouseDown}>
          <div style={styles.headerLeft}>
            <span style={styles.logo}>🎓</span>
            <div>
              <div style={styles.title}>School Assistant</div>
              <div style={styles.subtitle}>Powered by Gemini AI</div>
            </div>
          </div>
          <div style={styles.headerRight}>
            <button style={styles.iconBtn} title="Minimize" onClick={() => ipcRenderer?.send('minimize-window')}>—</button>
            <button style={{ ...styles.iconBtn, background: 'rgba(255,60,60,0.2)' }} title="Close" onClick={() => ipcRenderer?.send('close-window')}>✕</button>
          </div>
        </div>

        {/* ── Start / Stop Controls ─────────────────── */}
        <div style={styles.controls}>
          <button
            style={{ ...styles.startBtn, ...(isRunning ? styles.stopBtn : styles.goBtn) }}
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? '⏹ Stop Monitoring' : '▶ Start Monitoring'}
          </button>
          <button style={styles.snapBtn} onClick={captureAndAnalyze} disabled={loading}>
            {loading ? '⏳' : '📸'} Snap
          </button>
        </div>

        {/* ── Opacity Slider ────────────────────────── */}
        <div style={styles.opacityRow}>
          <span>👁</span>
          <input
            type="range" min="0.3" max="1" step="0.05"
            value={opacity}
            style={styles.slider}
            onChange={e => setOpacity(parseFloat(e.target.value))}
          />
          <span>{Math.round(opacity * 100)}%</span>
        </div>

        {/* ── Tabs ──────────────────────────────────── */}
        <div style={styles.tabs}>
          {[['screen', '👁️ Screen'], ['chat', '💬 Chat'], ['papers', '📚 Papers'], ['history', '🕐 History']].map(([id, label]) => (
            <button key={id} style={{ ...styles.tab, ...(tab === id ? styles.activeTab : {}) }} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ───────────────────────────── */}
        <div style={styles.content}>
          {tab === 'screen' && <ScreenTab isRunning={isRunning} lastAnalysis={lastAnalysis} onManualCapture={captureAndAnalyze} loading={loading} />}
          {tab === 'chat' && <ChatTab />}
          {tab === 'papers' && <PapersTab />}
          {tab === 'history' && <HistoryTab />}
        </div>

        {/* ── Status Bar ────────────────────────────── */}
        <div style={styles.statusBar}>
          <span style={styles.dot(isRunning ? '#44dd88' : backendOk ? '#7060ff' : '#ff6644')} />
          <span>{status}</span>
          {isRunning && <span style={{ marginLeft: 'auto', color: '#44dd88', fontSize: '10px' }}>● LIVE</span>}
        </div>
      </div>
    </div>
  );
}
