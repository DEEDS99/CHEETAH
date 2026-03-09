/**
 * API Service — connects to School Assistant backend
 */
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Analyze screenshot
export async function analyzeScreen(screenshot) {
  const res = await api.post('/api/analyze', { screenshot });
  return res.data;
}

// Chat with AI
export async function chat(message, history = []) {
  const res = await api.post('/api/chat', { message, history });
  return res.data;
}

// Get past papers
export async function getPapers() {
  const res = await api.get('/api/papers');
  return res.data;
}

// Upload past paper
export async function uploadPaper(formData) {
  const res = await api.post('/api/papers/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
}

// Get questions for a paper
export async function getPaperQuestions(paperId) {
  const res = await api.get(`/api/papers/${paperId}/questions`);
  return res.data;
}

// Generate quiz
export async function generateQuiz(paperId, count = 5) {
  const res = await api.post(`/api/papers/${paperId}/quiz`, { count });
  return res.data;
}

// Delete paper
export async function deletePaper(paperId) {
  const res = await api.delete(`/api/papers/${paperId}`);
  return res.data;
}

// Get history
export async function getHistory() {
  const res = await api.get('/api/history');
  return res.data;
}

// Clear history
export async function clearHistory() {
  const res = await api.delete('/api/history');
  return res.data;
}

export default api;
