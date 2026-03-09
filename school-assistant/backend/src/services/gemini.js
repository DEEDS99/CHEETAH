/**
 * Google Gemini AI Service
 * Handles: Screen analysis, Q&A, form detection, past paper parsing
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Analyze Screenshot for Questions & Forms ─────────────────
async function analyzeScreenshot(base64Image) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are an expert school assistant AI. Analyze this screenshot carefully.

Your tasks:
1. DETECT if there are any questions, exam questions, homework problems, or form fields visible
2. IDENTIFY all questions (numbered or not)
3. ANSWER each question clearly and concisely with step-by-step explanations where needed
4. DETECT any form fields (text inputs, dropdowns, checkboxes) and suggest what to fill in
5. NOTE the subject/topic (Math, Science, History, etc.)

Respond in this EXACT JSON format:
{
  "hasQuestions": true/false,
  "hasForms": true/false,
  "subject": "subject name or null",
  "questions": [
    {
      "number": 1,
      "question": "the question text",
      "answer": "detailed answer with explanation",
      "type": "multiple_choice/short_answer/calculation/essay"
    }
  ],
  "formFields": [
    {
      "label": "field label",
      "suggestedValue": "what to fill in",
      "fieldType": "text/dropdown/checkbox/date"
    }
  ],
  "summary": "brief summary of what's on screen",
  "tips": ["study tip 1", "study tip 2"]
}`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: 'image/png',
        data: base64Image.replace(/^data:image\/\w+;base64,/, '')
      }
    }
  ]);

  const text = result.response.text();

  // Parse JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      // fallback
    }
  }

  return {
    hasQuestions: false,
    hasForms: false,
    subject: null,
    questions: [],
    formFields: [],
    summary: text,
    tips: []
  };
}

// ── Chat with AI Assistant ───────────────────────────────────
async function chatWithAI(message, history = []) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const systemPrompt = `You are a friendly, expert school assistant AI. You help students:
- Answer homework and exam questions with clear explanations
- Explain concepts in simple, understandable language
- Provide step-by-step solutions for math and science problems
- Help with essay writing, grammar, and language
- Suggest revision strategies and study tips
- Work across all subjects: Math, Science, English, History, Geography, etc.

Always be encouraging, accurate, and educational. Show your working for calculations.`;

  const chatHistory = history.map(h => ({
    role: h.role,
    parts: [{ text: h.content }]
  }));

  const chat = model.startChat({
    history: chatHistory,
    generationConfig: { maxOutputTokens: 2000 }
  });

  const result = await chat.sendMessage(`${systemPrompt}\n\nStudent question: ${message}`);
  return result.response.text();
}

// ── Parse Past Paper PDF Content ────────────────────────────
async function parsePastPaper(pdfText, title) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are analyzing an exam past paper. Extract all questions and their model answers.

Paper: "${title}"

Paper text:
${pdfText.substring(0, 15000)}

Respond in this EXACT JSON format:
{
  "subject": "subject name",
  "year": 2023,
  "questions": [
    {
      "number": 1,
      "question": "full question text",
      "answer": "model answer / mark scheme answer",
      "marks": 2,
      "topic": "topic area"
    }
  ],
  "totalMarks": 100,
  "paperType": "Multiple Choice/Structured/Essay"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {}
  }
  return { subject: 'Unknown', year: null, questions: [], totalMarks: 0 };
}

// ── Generate Quiz from Paper ─────────────────────────────────
async function generateQuiz(questions, count = 5) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const sample = questions.slice(0, 20).map((q, i) => `Q${i+1}: ${q.question_text}`).join('\n');

  const prompt = `Create a ${count}-question multiple choice quiz from these exam questions:

${sample}

Respond in EXACT JSON:
{
  "quiz": [
    {
      "question": "question text",
      "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
      "correct": "A",
      "explanation": "why this is correct"
    }
  ]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {}
  }
  return { quiz: [] };
}

module.exports = { analyzeScreenshot, chatWithAI, parsePastPaper, generateQuiz };
