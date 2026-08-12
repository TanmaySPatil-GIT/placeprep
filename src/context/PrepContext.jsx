import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

import { INITIAL_FIELDS } from '../utils/seedFields';

const PrepContext = createContext();

export function usePrep() {
  const context = useContext(PrepContext);
  if (!context) {
    console.warn('usePrep was invoked outside of a <PrepProvider> tree or before initialization.');
    return {};
  }
  return context;
}

const DEFAULT_COMPANY = {
  id: 'google',
  name: 'Google',
  logoText: 'G',
  difficulty: 'Hard',
  description: 'Global technology leader in search, cloud, AI, and enterprise software.',
  rounds: ['Online Assessment', 'DSA Coding Round', 'System Design & Coding', 'Hiring Committee Review']
};

const DEFAULT_FIELD = INITIAL_FIELDS[0]; // Software Development (SDE)

export function PrepProvider({ children }) {
  const [selectedField, setSelectedField] = useState(() => {
    try {
      const saved = localStorage.getItem('placeprep_selected_field');
      return saved ? JSON.parse(saved) : DEFAULT_FIELD;
    } catch (e) {
      return DEFAULT_FIELD;
    }
  });

  const [selectedCompany, setSelectedCompany] = useState(() => {
    try {
      const saved = localStorage.getItem('placeprep_selected_company');
      return saved ? JSON.parse(saved) : DEFAULT_COMPANY;
    } catch (e) {
      return DEFAULT_COMPANY;
    }
  });

  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [sessionResults, setSessionResults] = useState(() => {
    try {
      const saved = localStorage.getItem('placeprep_session_results');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [dsaResult, setDsaResultState] = useState(() => {
    try {
      const saved = localStorage.getItem('placeprep_dsa_result');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [aptitudeResult, setAptitudeResultState] = useState(() => {
    try {
      const saved = localStorage.getItem('placeprep_aptitude_result');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Resume Analyzer State
  const [resumeData, setResumeDataState] = useState(() => {
    try {
      const saved = localStorage.getItem('placeprep_resume_data');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [resumeQuestions, setResumeQuestionsState] = useState(() => {
    try {
      const saved = localStorage.getItem('placeprep_resume_questions');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [experienceLevel, setExperienceLevelState] = useState(() => {
    try {
      const saved = localStorage.getItem('placeprep_experience_level');
      return saved || 'Fresher';
    } catch (e) {
      return 'Fresher';
    }
  });

  const [experienceYears, setExperienceYearsState] = useState(() => {
    try {
      const saved = localStorage.getItem('placeprep_experience_years');
      return saved || '0-2';
    } catch (e) {
      return '0-2';
    }
  });

  const [difficultyLevel, setDifficultyLevelState] = useState(() => {
    try {
      const saved = localStorage.getItem('placeprep_difficulty_level');
      return saved || 'Medium';
    } catch (e) {
      return 'Medium';
    }
  });

  const [selectedLanguage, setSelectedLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('placeprep_selected_language');
      return saved ? JSON.parse(saved) : { code: 'en-US', name: 'English' };
    } catch (e) {
      return { code: 'en-US', name: 'English' };
    }
  });

  const selectLanguage = (langObj) => {
    setSelectedLanguageState(langObj);
    try {
      localStorage.setItem('placeprep_selected_language', JSON.stringify(langObj));
    } catch (e) {
      console.warn('Error saving language selection:', e);
    }
  };

  const selectExperience = (level, years = '0-2') => {
    setExperienceLevelState(level);
    setExperienceYearsState(years);
    try {
      localStorage.setItem('placeprep_experience_level', level);
      localStorage.setItem('placeprep_experience_years', years);
    } catch (e) {
      console.warn('Error saving experience settings:', e);
    }
  };

  const [interviewMode, setInterviewModeState] = useState(() => {
    try {
      const saved = localStorage.getItem('placeprep_interview_mode');
      return saved || 'single';
    } catch (e) {
      return 'single';
    }
  });

  const selectInterviewMode = (mode) => {
    setInterviewModeState(mode);
    try {
      localStorage.setItem('placeprep_interview_mode', mode);
    } catch (e) {
      console.warn('Error saving interview mode:', e);
    }
  };

  // Interviewer Persona: Strict | Friendly | Rapid-fire
  const [interviewerPersona, setInterviewerPersonaState] = useState(() => {
    try {
      const saved = localStorage.getItem('placeprep_interviewer_persona');
      return saved || 'Friendly';
    } catch (e) {
      return 'Friendly';
    }
  });

  const selectInterviewerPersona = (persona) => {
    setInterviewerPersonaState(persona);
    try {
      localStorage.setItem('placeprep_interviewer_persona', persona);
    } catch (e) {
      console.warn('Error saving interviewer persona:', e);
    }
  };

  const selectDifficulty = (difficulty) => {
    setDifficultyLevelState(difficulty);
    try {
      localStorage.setItem('placeprep_difficulty_level', difficulty);
    } catch (e) {
      console.warn('Error saving difficulty level:', e);
    }
  };

  const [technicalMcqResult, setTechnicalMcqResultState] = useState(() => {
    try {
      const saved = localStorage.getItem('placeprep_technical_mcq_result');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [technicalInterviewResult, setTechnicalInterviewResultState] = useState(() => {
    try {
      const saved = localStorage.getItem('placeprep_technical_interview_result');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [hrInterviewResult, setHrInterviewResultState] = useState(() => {
    try {
      const saved = localStorage.getItem('placeprep_hr_interview_result');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [negotiationResult, setNegotiationResultState] = useState(() => {
    try {
      const saved = localStorage.getItem('placeprep_negotiation_result');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const setNegotiationResult = (result) => {
    setNegotiationResultState(result);
    try {
      localStorage.setItem('placeprep_negotiation_result', JSON.stringify(result));
    } catch (e) {}
  };

  const [systemDesignResult, setSystemDesignResultState] = useState(() => {
    try {
      const saved = localStorage.getItem('placeprep_system_design_result');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const setSystemDesignResult = (result) => {
    setSystemDesignResultState(result);
    try {
      localStorage.setItem('placeprep_system_design_result', JSON.stringify(result));
    } catch (e) {}
  };

  const setTechnicalMcqResult = (result) => {
    setTechnicalMcqResultState(result);
    try {
      localStorage.setItem('placeprep_technical_mcq_result', JSON.stringify(result));
    } catch (e) {}
  };

  const setTechnicalInterviewResult = (result) => {
    setTechnicalInterviewResultState(result);
    try {
      localStorage.setItem('placeprep_technical_interview_result', JSON.stringify(result));
    } catch (e) {}
  };

  const setHrInterviewResult = (result) => {
    setHrInterviewResultState(result);
    try {
      localStorage.setItem('placeprep_hr_interview_result', JSON.stringify(result));
    } catch (e) {}
  };

  const selectField = async (fieldObj) => {
    setSelectedField(fieldObj);
    setCurrentRoundIndex(0);
    setSessionResults([]);
    setDsaResultState(null);
    setAptitudeResultState(null);
    setTechnicalMcqResultState(null);
    setTechnicalInterviewResultState(null);
    setHrInterviewResultState(null);
    setSystemDesignResultState(null);
    setResumeQuestionsState(null);
    try {
      localStorage.setItem('placeprep_selected_field', JSON.stringify(fieldObj));
      localStorage.removeItem('placeprep_session_results');
      localStorage.removeItem('placeprep_dsa_result');
      localStorage.removeItem('placeprep_aptitude_result');
      localStorage.removeItem('placeprep_technical_mcq_result');
      localStorage.removeItem('placeprep_technical_interview_result');
      localStorage.removeItem('placeprep_hr_interview_result');
      localStorage.removeItem('placeprep_system_design_result');
      localStorage.removeItem('placeprep_resume_questions');
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userRef, { selectedField: fieldObj, targetField: fieldObj.name }, { merge: true });
      }
    } catch (e) {
      console.warn('Error saving selectedField:', e);
    }
  };

  const selectCompany = (company) => {
    setSelectedCompany(company);
    setCurrentRoundIndex(0);
    setSessionResults([]);
    setDsaResultState(null);
    setAptitudeResultState(null);
    setTechnicalMcqResultState(null);
    setTechnicalInterviewResultState(null);
    setHrInterviewResultState(null);
    try {
      localStorage.setItem('placeprep_selected_company', JSON.stringify(company));
      localStorage.removeItem('placeprep_session_results');
      localStorage.removeItem('placeprep_dsa_result');
      localStorage.removeItem('placeprep_aptitude_result');
      localStorage.removeItem('placeprep_technical_mcq_result');
      localStorage.removeItem('placeprep_technical_interview_result');
      localStorage.removeItem('placeprep_hr_interview_result');
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  };

  const setDsaResult = (result) => {
    setDsaResultState(result);
    try {
      localStorage.setItem('placeprep_dsa_result', JSON.stringify(result));
    } catch (e) {}
  };

  const setAptitudeResult = (result) => {
    setAptitudeResultState(result);
    try {
      localStorage.setItem('placeprep_aptitude_result', JSON.stringify(result));
    } catch (e) {}
  };

  const setResumeData = async (data) => {
    setResumeDataState(data);
    try {
      localStorage.setItem('placeprep_resume_data', JSON.stringify(data));
      // Save to Firestore if user is authenticated
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userRef, { resumeData: data, lastResumeUpdate: new Date().toISOString() }, { merge: true });
      }
    } catch (e) {
      console.warn('Error saving resume data:', e);
    }
  };

  const setResumeQuestions = (questions) => {
    setResumeQuestionsState(questions);
    try {
      localStorage.setItem('placeprep_resume_questions', JSON.stringify(questions));
    } catch (e) {}
  };

  const advanceRound = () => {
    setCurrentRoundIndex((prev) => prev + 1);
  };

  const setRoundIndex = (index) => {
    setCurrentRoundIndex(index);
  };

  const addAnswerResult = (result) => {
    setSessionResults((prev) => {
      const updated = [...prev.filter(r => r.questionId !== result.questionId), result];
      try {
        localStorage.setItem('placeprep_session_results', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const value = {
    selectedField,
    selectedCompany,
    experienceLevel,
    experienceYears,
    difficultyLevel,
    selectedLanguage,
    interviewMode,
    interviewerPersona,
    currentRoundIndex,
    sessionResults,
    dsaResult,
    aptitudeResult,
    technicalMcqResult,
    technicalInterviewResult,
    hrInterviewResult,
    negotiationResult,
    systemDesignResult,
    resumeData,
    resumeQuestions,
    selectField,
    selectCompany,
    selectExperience,
    selectDifficulty,
    selectLanguage,
    selectInterviewMode,
    selectInterviewerPersona,
    advanceRound,
    setRoundIndex,
    addAnswerResult,
    setDsaResult,
    setAptitudeResult,
    setTechnicalMcqResult,
    setTechnicalInterviewResult,
    setHrInterviewResult,
    setNegotiationResult,
    setSystemDesignResult,
    setResumeData,
    setResumeQuestions
  };

  return (
    <PrepContext.Provider value={value}>
      {children}
    </PrepContext.Provider>
  );
}
