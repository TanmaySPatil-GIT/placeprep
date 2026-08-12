/**
 * Resume Analysis Service
 * Communicates with backend Flask API endpoints for resume analysis and question generation.
 */

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

  const FLASK_RESUME_URL = import.meta.env.VITE_FLASK_API_URL
    ? `${import.meta.env.VITE_FLASK_API_URL}/api/analyze-resume`
    : 'http://localhost:5000/api/analyze-resume';

  const response = await fetch(FLASK_RESUME_URL, {
    method: 'POST',
    body: formData
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data;
}

export async function generateResumeQuestionsApi(extractedProfile, companyName = 'Google', targetField = 'Software Development') {
  const FLASK_QUESTIONS_URL = import.meta.env.VITE_FLASK_API_URL
    ? `${import.meta.env.VITE_FLASK_API_URL}/api/generate-resume-interview-questions`
    : 'http://localhost:5000/api/generate-resume-interview-questions';

  const response = await fetch(FLASK_QUESTIONS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      extractedProfile,
      selectedCompany: companyName,
      companyName,
      targetField,
      target_field: targetField
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data;
}
