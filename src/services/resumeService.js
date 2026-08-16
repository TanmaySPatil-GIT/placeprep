/**
 * Resume Analysis Service
 * Communicates with backend Flask API endpoints for resume analysis and question generation.
 * Includes a 120-second timeout for Render free tier cold start tolerance.
 */
import { getBackendUrl } from '../config/api';

export async function analyzeResumeApi(file, targetField = 'Software Development', companyName = 'Google', options = {}) {
  if (!file) {
    throw new Error('No resume PDF file uploaded. Please select a valid PDF file.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('resume', file);
  
  if (targetField) {
    formData.append('target_field', targetField);
    formData.append('targetField', targetField);
  }
  
  if (companyName) {
    formData.append('company_name', companyName);
    formData.append('companyName', companyName);
  }

  if (options.requireTargetField) {
    formData.append('require_target_field', 'true');
  }

  const FLASK_RESUME_URL = `${getBackendUrl()}/api/analyze-resume`;
  const timeoutMs = options.timeoutMs || 120000; // 120 seconds for Render cold starts

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(FLASK_RESUME_URL, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Server responded with HTTP error ${response.status}`);
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Backend server wake-up timed out after 2 minutes. Render cold starts may take up to a minute — please try again.');
    }
    if (err.message === 'Failed to fetch' || err.message.includes('fetch')) {
      throw new Error(`Failed to connect to backend at ${FLASK_RESUME_URL}. Please check CORS configuration or verify the backend server is running.`);
    }
    throw err;
  }
}

export async function generateResumeQuestionsApi(extractedProfile, companyName = 'Google', targetField = 'Software Development', options = {}) {
  const FLASK_QUESTIONS_URL = `${getBackendUrl()}/api/generate-resume-interview-questions`;
  const timeoutMs = options.timeoutMs || 60000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(FLASK_QUESTIONS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        extractedProfile,
        selectedCompany: companyName,
        companyName,
        targetField,
        target_field: targetField
      })
    });

    clearTimeout(timeoutId);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}`);
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Server request timed out while generating interview questions.');
    }
    throw err;
  }
}

