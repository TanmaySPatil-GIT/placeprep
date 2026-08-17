import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import ProgressStepper from '../components/ProgressStepper';
import { getBackendUrl } from '../config/api';
import { usePrep } from '../context/PrepContext';
import { useAuth } from '../context/AuthContext';
import { loadFaceApiModels, analyzeFaceFrame } from '../services/faceDetector';
import { analyzeSpeechMetrics } from '../services/speechAnalyzer';
import { 
  isTTSSupported, 
  getAvailableEnglishVoices, 
  speakText, 
  stopSpeech 
} from '../services/speechSynthesizer';
import { INITIAL_INTERVIEW_QUESTIONS } from '../utils/seedInterviewQuestions';
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  Camera, 
  AlertTriangle,
  Award,
  UserCheck,
  RefreshCw,
  Eye,
  Square,
  Radio,
  Volume2,
  VolumeX,
  Target,
  FileText,
  Bot,
  Loader2,
  MessageSquareText,
  Settings2,
  Brain,
  ArrowRight
} from 'lucide-react';

import { shuffleArray } from '../utils/shuffle';

const RECENT_INTERVIEW_STORAGE_KEY = 'placeprep_recent_interview_qids';

const getRecentInterviewQuestionIds = () => {
  try {
    const saved = localStorage.getItem(RECENT_INTERVIEW_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

const saveRecentInterviewQuestionIds = (newQIds) => {
  try {
    const current = getRecentInterviewQuestionIds();
    const combined = Array.from(new Set([...newQIds, ...current])).slice(0, 20);
    localStorage.setItem(RECENT_INTERVIEW_STORAGE_KEY, JSON.stringify(combined));
  } catch (e) {
    console.warn('Could not save recent interview question IDs:', e);
  }
};

export default function InterviewRoundPage() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { 
    selectedCompany, 
    setRoundIndex, 
    addAnswerResult, 
    resumeQuestions, 
    experienceLevel, 
    experienceYears, 
    difficultyLevel,
    selectedLanguage,
    interviewMode,
    interviewerPersona,
    selectedField
  } = usePrep();

  const companyName = selectedCompany?.name || 'Google';
  const targetField = selectedField?.name || userProfile?.targetField || 'Software Development';
  const targetFieldId = selectedField?.fieldId || 'sde';

  const companyFocusAreas = selectedCompany?.interviewProfile?.focusAreas || ['Googleyness', 'System Design Lite'];
  const companyInterviewNotes = selectedCompany?.interviewProfile?.notes || 'Evaluates clear communication and STAR format answers.';

  // Conversational AI State
  const [totalExchanges, setTotalExchanges] = useState(0);
  const [topicFollowupCount, setTopicFollowupCount] = useState(0);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentSpokenQuestion, setCurrentSpokenQuestion] = useState('');
  const [currentBasedOn, setCurrentBasedOn] = useState('');
  const [aiState, setAiState] = useState('idle'); // 'speaking' | 'listening' | 'thinking' | 'idle'
  const [aiReasoning, setAiReasoning] = useState('');

  // Video & Stream refs
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraPermission, setCameraPermission] = useState('prompt');
  const [permissionError, setPermissionError] = useState('');
  const [permissionErrorType, setPermissionErrorType] = useState('');

  // Questions Bank State
  const [questionsBank, setQuestionsBank] = useState(INITIAL_INTERVIEW_QUESTIONS);
  const [bankQuestionIdx, setBankQuestionIdx] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // 2 AI Personas for Panel Interview Mode
  const PERSONAS = {
    techLead: {
      name: 'Dr. Alex Vance',
      role: 'Technical Lead',
      pitch: 0.90,
      badgeClass: 'bg-mint-100 text-leaf-600 border-warmborder font-bold',
      avatarEmoji: '🛡️'
    },
    hrPartner: {
      name: 'Sarah Jenkins',
      role: 'HR Talent Partner',
      pitch: 1.20,
      badgeClass: 'bg-gold-100 text-gold-600 border-gold-200 font-bold',
      avatarEmoji: '👥'
    }
  };

  const getActivePersona = (exchanges = totalExchanges) => {
    if (interviewMode !== 'panel') return PERSONAS.techLead;
    return (exchanges % 3 === 2) ? PERSONAS.hrPartner : PERSONAS.techLead;
  };

  const activePersona = getActivePersona(totalExchanges);

  // TTS Voice State
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [ttsMuted, setTtsMuted] = useState(false);
  const [hasStartedSession, setHasStartedSession] = useState(false);

  // Vision telemetry state (~500ms interval)
  const [modelsReady, setModelsReady] = useState(false);
  const [currentTelemetry, setCurrentTelemetry] = useState({
    faceDetected: false,
    gazeCentered: false,
    expression: 'neutral',
    confidence: 0
  });
  const [telemetryLogs, setTelemetryLogs] = useState([]);

  // Controls
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);

  // Speech Recognition & Live Answer Metrics
  const [isAnswering, setIsAnswering] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [answerDuration, setAnswerDuration] = useState(0);
  const [longPauseCount, setLongPauseCount] = useState(0);
  const [lastSpeechTime, setLastSpeechTime] = useState(Date.now());
  const [lastSegmentConfidence, setLastSegmentConfidence] = useState(0.85);
  const [evaluatingFollowup, setEvaluatingFollowup] = useState(false);
  const [savedAnswerMetrics, setSavedAnswerMetrics] = useState(null);

  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const answerTimerRef = useRef(null);
  const pauseCheckTimerRef = useRef(null);

  const ttsTimerRef = useRef(null);

  // Helper to Speak Questions Aloud via TTS with Persona-Specific Pitch
  const triggerAISpeech = (textToSpeak, personaOverride) => {
    if (ttsMuted || !textToSpeak) {
      setAiState('idle');
      return;
    }

    if (ttsTimerRef.current) clearTimeout(ttsTimerRef.current);
    const currentPersona = personaOverride || getActivePersona(totalExchanges);

    setAiState('speaking');

    ttsTimerRef.current = setTimeout(() => {
      setAiState('idle');
    }, 12000);

    speakText({
      text: textToSpeak,
      voice: selectedVoice,
      langCode: selectedLanguage?.code || 'en-US',
      pitch: currentPersona.pitch,
      onStart: () => setAiState('speaking'),
      onEnd: () => {
        if (ttsTimerRef.current) clearTimeout(ttsTimerRef.current);
        setAiState('idle');
      },
      onError: () => {
        if (ttsTimerRef.current) clearTimeout(ttsTimerRef.current);
        setAiState('idle');
      }
    });
  };


  // 1. Load face-api.js models & Available Voices
  useEffect(() => {
    loadFaceApiModels().then(() => setModelsReady(true));

    if (isTTSSupported()) {
      const updateVoices = () => {
        const voices = getAvailableEnglishVoices();
        setAvailableVoices(voices);
        if (voices.length > 0 && !selectedVoice) {
          setSelectedVoice(voices[0]);
        }
      };

      updateVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }
  }, []);

  // 2. Fetch Base Interview Questions adapted by Candidate Experience Level & Selected Track
  const fetchQuestions = async () => {
    setBankQuestionIdx(0);
    setTopicFollowupCount(0);
    setConversationHistory([]);
    const recentIds = getRecentInterviewQuestionIds();

    if (resumeQuestions && resumeQuestions.length > 0) {
      const shuffledResume = shuffleArray(resumeQuestions);
      setQuestionsBank(shuffledResume);
      return;
    }

    setLoadingQuestions(true);
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Interview questions fetch timeout')), 1500)
      );

      const snap = await Promise.race([
        getDocs(collection(db, 'interviewQuestions')),
        timeoutPromise
      ]);

      const pool = (snap && !snap.empty)
        ? snap.docs.map(d => ({ id: d.id, ...d.data() }))
        : INITIAL_INTERVIEW_QUESTIONS;

      const currentExp = experienceLevel || 'Fresher';

      let matched = pool.filter(q => {
        const matchesField = q.fieldId === targetFieldId || q.targetField === targetField;
        const matchesCompany = q.targetCompanies?.includes(companyName) || companyFocusAreas.some(fa => q.focusArea === fa);
        const matchesExp = !q.experienceLevelTag || q.experienceLevelTag === 'Both' || q.experienceLevelTag === currentExp;
        return (matchesField || matchesCompany) && matchesExp;
      });

      if (matched.length === 0) {
        matched = pool.filter(q => !q.experienceLevelTag || q.experienceLevelTag === 'Both' || q.experienceLevelTag === currentExp);
      }

      const activePool = matched.length > 0 ? matched : pool;
      const unseen = activePool.filter(q => !recentIds.includes(q.id));
      const candidatePool = unseen.length >= 2 ? unseen : activePool;
      const shuffled = shuffleArray(candidatePool);

      saveRecentInterviewQuestionIds(shuffled.map(q => q.id));
      setQuestionsBank(shuffled);
    } catch (err) {
      console.warn('Interview questions fetch notice:', err.message);
      const currentExp = experienceLevel || 'Fresher';
      const matched = INITIAL_INTERVIEW_QUESTIONS.filter(q => 
        (q.fieldId === targetFieldId || q.targetField === targetField || !q.fieldId) &&
        (!q.experienceLevelTag || q.experienceLevelTag === 'Both' || q.experienceLevelTag === currentExp)
      );
      const shuffled = shuffleArray(matched.length > 0 ? matched : INITIAL_INTERVIEW_QUESTIONS);
      saveRecentInterviewQuestionIds(shuffled.map(q => q.id));
      setQuestionsBank(shuffled);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [companyName, resumeQuestions, experienceLevel, targetField, targetFieldId]);

  // 3. MediaStream Permissions (Camera + Mic) with Fallbacks & Specific Error Classification
  const requestMediaPermissions = async () => {
    setPermissionError('');
    setPermissionErrorType('');
    let mediaStream = null;

    try {
      // Step 1: Attempt ideal constraints (1280x720 + audio)
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true
        });
      } catch (firstErr) {
        console.warn('Ideal media constraints failed, attempting basic video+audio:', firstErr.name, firstErr.message);

        // Fallback 1: Basic video + audio (no resolution constraints)
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } catch (secondErr) {
          console.warn('Basic video+audio failed, attempting video-only:', secondErr.name, secondErr.message);

          // Fallback 2: Video only (in case microphone is unavailable or restricted)
          mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
      }

      setStream(mediaStream);
      setCameraPermission('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(e => console.warn('Video play notice:', e));
      }
    } catch (err) {
      console.error('Camera/Mic access error details:', err.name, err.message, err);
      setCameraPermission('denied');

      const errName = err.name || '';
      const errMsg = err.message || '';

      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setPermissionErrorType('denied');
        setPermissionError('Camera & Microphone access was explicitly denied in browser settings. Please grant permissions and click Retry.');
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError' || errMsg.includes('concurrent') || errMsg.includes('in use')) {
        setPermissionErrorType('busy');
        setPermissionError('Camera is in use by another tab or app — close other apps using your camera and retry.');
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setPermissionErrorType('not_found');
        setPermissionError('No camera detected — please connect a camera and retry.');
      } else if (errName === 'OverconstrainedError' || errName === 'ConstraintNotSatisfiedError') {
        setPermissionErrorType('overconstrained');
        setPermissionError('Requested camera resolution is not supported by your video device. Click Retry to connect with basic settings.');
      } else {
        setPermissionErrorType('other');
        setPermissionError(`Camera/Microphone initialization issue (${errName || 'Notice'}): ${errMsg || 'Unable to access media stream.'}`);
      }
    }
  };

  useEffect(() => {
    requestMediaPermissions();
    return () => {
      stopSpeech();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [stream]);

  // Synchronize MediaStream to <video> element whenever stream, hasStartedSession, or videoActive changes
  useEffect(() => {
    if (stream && videoRef.current) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
      if (videoActive) {
        videoRef.current.play().catch(err => {
          console.warn('Video play notice:', err);
        });
      }
    }
  }, [stream, hasStartedSession, videoActive]);

  // 4. Vision telemetry loop (~500ms)
  useEffect(() => {
    if (cameraPermission !== 'granted' || !videoRef.current || !hasStartedSession || !videoActive) return;

    const interval = setInterval(async () => {
      if (videoRef.current) {
        const telemetry = await analyzeFaceFrame(videoRef.current);
        setCurrentTelemetry(telemetry);

        setTelemetryLogs(prev => [...prev.slice(-49), {
          timestamp: new Date().toLocaleTimeString(),
          ...telemetry
        }]);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [cameraPermission, modelsReady, hasStartedSession, videoActive]);

  // 5. Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US'; // Speech-to-Text locked to English

      recognition.onresult = (event) => {
        let fullTranscript = '';
        let confSum = 0;
        let confCount = 0;

        for (let i = 0; i < event.results.length; ++i) {
          const seg = event.results[i][0];
          if (seg.confidence && seg.confidence > 0) {
            confSum += seg.confidence;
            confCount++;
          }
          fullTranscript += seg.transcript + ' ';
        }

        if (confCount > 0) {
          setLastSegmentConfidence(confSum / confCount);
        }

        const cleanTranscript = fullTranscript.trim();
        if (cleanTranscript) {
          transcriptRef.current = cleanTranscript;
          setLiveTranscript(cleanTranscript);
          setLastSpeechTime(Date.now());
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition notice:', event.error);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Answer timer & 2s+ Silence pause tracker
  useEffect(() => {
    if (isAnswering) {
      setAnswerDuration(0);
      setLongPauseCount(0);
      setLastSpeechTime(Date.now());

      answerTimerRef.current = setInterval(() => {
        setAnswerDuration(prev => prev + 1);
      }, 1000);

      let lastPauseCheck = Date.now();
      pauseCheckTimerRef.current = setInterval(() => {
        const now = Date.now();
        if (now - lastSpeechTime > 2200 && now - lastPauseCheck > 2200) {
          setLongPauseCount(prev => prev + 1);
          lastPauseCheck = now;
        }
      }, 1000);

    } else {
      if (answerTimerRef.current) clearInterval(answerTimerRef.current);
      if (pauseCheckTimerRef.current) clearInterval(pauseCheckTimerRef.current);
    }

    return () => {
      if (answerTimerRef.current) clearInterval(answerTimerRef.current);
      if (pauseCheckTimerRef.current) clearInterval(pauseCheckTimerRef.current);
    };
  }, [isAnswering]);

  // Start Conversational Interview Session (Opening Greeting & Question)
  const handleStartInterviewSession = () => {
    setHasStartedSession(true);
    setTotalExchanges(0);
    setConversationHistory([]);

    const firstQ = questionsBank[0] || INITIAL_INTERVIEW_QUESTIONS[0];
    const initialText = firstQ.question || 'Tell me about yourself and your technical background.';
    const openingGreeting = `Hi! Welcome to your ${companyName} mock interview for the ${targetField} track. Let's get started: ${initialText}`;

    setCurrentSpokenQuestion(openingGreeting);
    setCurrentBasedOn(firstQ.basedOn || firstQ.category || `${companyName} Technical Assessment`);
    
    setConversationHistory([
      { role: 'interviewer', text: openingGreeting }
    ]);

    triggerAISpeech(openingGreeting);
  };

  // Restart Interview Session (Triggers fresh shuffle & recent question exclusion)
  const handleRestartInterview = () => {
    stopSpeech();
    setHasStartedSession(false);
    setTotalExchanges(0);
    setTopicFollowupCount(0);
    setConversationHistory([]);
    setSavedAnswerMetrics(null);
    setLiveTranscript('');
    fetchQuestions();
  };

  // Candidate Starts Answer
  const handleStartAnswer = () => {
    stopSpeech();
    transcriptRef.current = '';
    setLiveTranscript('');
    setSavedAnswerMetrics(null);
    setIsAnswering(true);
    setAiState('listening');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Speech recognition restart:', e);
      }
    }
  };

  // Candidate Stops Answer & Triggers AI Adaptive Follow-Up Engine
  const handleStopAnswer = async () => {
    setIsAnswering(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    setAiState('thinking');
    setEvaluatingFollowup(true);

    const capturedText = (transcriptRef.current || liveTranscript).trim();

    console.log('\n=================== [INTERVIEW DEBUG: TECHNICAL ROUND] ===================');
    console.log('[Interview Debug] Step 1 - Transcript captured:', `"${capturedText}"`);
    if (!capturedText) {
      console.warn('[Interview Debug] WARNING: Captured transcript is empty! Mic input may not have registered.');
    }

    const userTranscript = capturedText || 'In my previous software engineering projects, I focused on system performance, modular API design, and automated testing.';

    // 1. Analyze speech metrics & vision telemetry
    const metrics = analyzeSpeechMetrics(userTranscript, answerDuration, longPauseCount, lastSegmentConfidence);
    const recentLogs = telemetryLogs.slice(-20);
    const gazeRatio = recentLogs.length > 0 ? Math.round((recentLogs.filter(l => l.gazeCentered).length / recentLogs.length) * 100) : 92;
    const faceRatio = recentLogs.length > 0 ? Math.round((recentLogs.filter(l => l.faceDetected).length / recentLogs.length) * 100) : 95;

    const activeQ = questionsBank[bankQuestionIdx] || INITIAL_INTERVIEW_QUESTIONS[0];

    const answerRecord = {
      questionId: `q-${totalExchanges}`,
      questionText: currentSpokenQuestion || activeQ.question,
      transcript: userTranscript,
      durationSeconds: answerDuration,
      longPauseCount,
      segmentConfidence: lastSegmentConfidence,
      metrics,
      visionSummary: { gazeRatio, faceRatio, expression: currentTelemetry.expression }
    };

    setSavedAnswerMetrics(answerRecord);
    addAnswerResult(answerRecord);

    // 2. Append Turn to Conversation History
    const updatedHistory = [
      ...conversationHistory,
      { role: 'candidate', text: userTranscript }
    ];

    setConversationHistory(updatedHistory);
    const newTotalExchanges = totalExchanges + 1;
    setTotalExchanges(newTotalExchanges);

    // Check if max exchanges reached (8 exchanges)
    if (newTotalExchanges >= 8) {
      const closingMsg = `That wraps up our mock interview for ${companyName}! Thanks for your time — let's review your diagnostic report now.`;
      setCurrentSpokenQuestion(closingMsg);
      setEvaluatingFollowup(false);
      triggerAISpeech(closingMsg);

      setTimeout(() => {
        setRoundIndex(2);
        navigate('/results');
      }, 4000);
      return;
    }

    // 3. Call Flask Adaptive Follow-up Endpoint
    const FLASK_FOLLOWUP_URL = `${getBackendUrl()}/api/interview-followup`;
    const nextBankQ = questionsBank[bankQuestionIdx + 1] || questionsBank[0];

    const payload = {
      selectedCompany: companyName,
      targetField,
      interviewType: 'technical',
      experienceLevel: experienceLevel || 'Fresher',
      experienceYears: experienceYears || '0-2',
      difficultyLevel: difficultyLevel || 'Medium',
      selectedLanguage: selectedLanguage?.name || 'English',
      interviewerPersona: interviewerPersona || 'Friendly',
      conversationHistory: updatedHistory,
      topicFollowupCount,
      nextPlannedQuestion: nextBankQ.question,
      recentQuestions: questionsBank.map(q => q.question)
    };

    console.log('[Interview Debug: Technical] Step 2 - Payload sent to /api/interview-followup:', payload);

    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => controller.abort(), 35000); // 35s timeout for cold start tolerance

    let backendNextQ = null;
    let isFollowup = false;

    try {
      const response = await fetch(FLASK_FOLLOWUP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(fetchTimeout);

      console.log(`[Interview Debug: Technical] Step 3 - API response status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log('[Interview Debug: Technical] Step 3 - Gemini response resolved (raw payload):', data);
        setAiReasoning(data.reasoning || '');

        if (data.action === 'followup' && topicFollowupCount < 2) {
          isFollowup = true;
          backendNextQ = data.questionText;
        } else if (data.questionText) {
          backendNextQ = data.questionText;
        }
      } else {
        const errBody = await response.text().catch(() => '');
        console.error(`[Interview Debug: Technical] Step 3 - API response error HTTP ${response.status}:`, errBody);
      }
    } catch (err) {
      clearTimeout(fetchTimeout);
      if (err.name === 'AbortError') {
        console.error('[Interview Debug: Technical] Step 3 - API call TIMED OUT after 35s! (Backend server cold start or AI delay)');
      } else {
        console.error('[Interview Debug: Technical] Step 3 - Caught API call error:', err.name, err.message, err);
      }
    } finally {
      setEvaluatingFollowup(false);
    }

    try {
      if (isFollowup && backendNextQ) {
        setTopicFollowupCount(prev => prev + 1);
        console.log('[Interview Debug: Technical] Step 4 - Triggering state update: ADAPTIVE FOLLOW-UP:', backendNextQ);

        setCurrentSpokenQuestion(backendNextQ);
        setCurrentBasedOn('Adaptive AI Probing Follow-Up');

        setConversationHistory(prev => [...prev, { role: 'interviewer', text: backendNextQ }]);
        triggerAISpeech(backendNextQ);
      } else {
        const nextIdx = (bankQuestionIdx + 1) % questionsBank.length;
        setBankQuestionIdx(nextIdx);
        setTopicFollowupCount(0);

        const nextQObj = questionsBank[nextIdx];
        const nextQText = backendNextQ || `Moving on to our next topic: ${nextQObj.question}`;
        console.log(`[Interview Debug: Technical] Step 4 - Triggering state update: NEXT QUESTION (Q${nextIdx + 1}):`, nextQText);

        setCurrentSpokenQuestion(nextQText);
        setCurrentBasedOn(nextQObj.basedOn || `${companyName} Focus Area`);

        setConversationHistory(prev => [...prev, { role: 'interviewer', text: nextQText }]);
        triggerAISpeech(nextQText);
      }
    } catch (progErr) {
      console.error('[Interview Debug: Technical] Step 4 - Error during progression state update:', progErr);
    }
  };


  const isBrowserSpeechSupported = isTTSSupported();

  return (
    <div className="space-y-4 py-2">
      
      {/* Reusable Progress Stepper */}
      <ProgressStepper />

      {/* Unsupported Browser Warning Banner */}
      {!isBrowserSpeechSupported && (
        <div className="p-4 rounded-2xl bg-earth-terracotta/20 border border-earth-terracotta/40 text-earth-cream text-xs flex items-center justify-between gap-3 shadow-earthy">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-earth-terracotta shrink-0" />
            <span>Web Speech API is not fully supported in this browser. We recommend using <strong>Google Chrome</strong> for voice synthesis & recognition.</span>
          </div>
        </div>
      )}

      {/* Main Grid: AI Interviewer Presence Card & Candidate Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: AI Interviewer Presence Card & Spoken Captions (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl bg-forest-800/90 border border-forest-600/40 p-6 space-y-6 shadow-earthy backdrop-blur-md flex flex-col justify-between">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-forest-600/30 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sage-400 animate-pulse" />
              <span className="text-xs font-bold font-serif text-earth-cream">{companyName} AI Recruiter</span>
            </div>

            {/* Voice Mute & Voice Selector */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setTtsMuted(!ttsMuted);
                  if (!ttsMuted) stopSpeech();
                }}
                className={`p-2 rounded-full text-xs border ${
                  ttsMuted ? 'bg-earth-terracotta/20 text-earth-terracotta border-earth-terracotta/40' : 'bg-forest-900 text-accent-gold border-forest-600/40'
                }`}
                title={ttsMuted ? 'Unmute AI Voice' : 'Mute AI Voice'}
              >
                {ttsMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              {availableVoices.length > 0 && (
                <select
                  value={selectedVoice?.name || ''}
                  onChange={(e) => {
                    const voice = availableVoices.find(v => v.name === e.target.value);
                    if (voice) setSelectedVoice(voice);
                  }}
                  className="bg-forest-900 text-[10px] text-earth-cream/80 p-1.5 rounded-xl border border-forest-600/40 focus:outline-none max-w-[120px] truncate"
                >
                  {availableVoices.map((v, i) => (
                    <option key={i} value={v.name}>{v.name.replace(/Google|Microsoft/gi, '').slice(0, 18)}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* AI Avatar Visualizer */}
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
            
            {/* Panel Mode Persona Badge */}
            {interviewMode === 'panel' && (
              <div className={`px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 animate-fadeIn shadow-sm ${activePersona.badgeClass}`}>
                <span>{activePersona.avatarEmoji}</span>
                <span>Active Speaker: <strong>{activePersona.name}</strong> ({activePersona.role})</span>
              </div>
            )}

            <div className="relative">
              {/* Outer Pulsing Waveform Ring */}
              <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${
                aiState === 'speaking' ? 'bg-gradient-to-r from-accent-gold/40 to-sage-400/40 animate-ping ring-4 ring-accent-gold/50'
                : aiState === 'listening' ? 'bg-earth-terracotta/30 animate-pulse ring-4 ring-earth-terracotta/40'
                : aiState === 'thinking' ? 'bg-forest-600/50 animate-spin border-2 border-dashed border-accent-gold'
                : 'bg-forest-900 border border-forest-600/40 shadow-earthy'
              }`}>
                <div className="w-24 h-24 rounded-full bg-forest-900 border border-forest-600/40 flex items-center justify-center shadow-inner">
                  {aiState === 'thinking' ? (
                    <Loader2 className="w-10 h-10 text-leaf-600 animate-spin" />
                  ) : (
                    <UserCheck className={`w-10 h-10 transition-colors ${
                      aiState === 'speaking' ? 'text-leaf-600 animate-bounce'
                      : aiState === 'listening' ? 'text-gold-600'
                      : 'text-darkcharcoal-700'
                    }`} />
                  )}
                </div>
              </div>
            </div>

            {/* State Pill */}
            <div className="space-y-1">
              <span className={`px-3.5 py-1 rounded-full text-xs font-extrabold border inline-flex items-center gap-1.5 shadow-warm-sm ${
                aiState === 'speaking' ? 'bg-mint-100 border-warmborder text-leaf-700'
                : aiState === 'listening' ? 'bg-[#FDF3F3] border-[#F0C2C2] text-[#D32F2F]'
                : aiState === 'thinking' ? 'bg-mint-50 border-warmborder text-leaf-600'
                : 'bg-white border-warmborder text-darkcharcoal-700'
              }`}>
                {aiState === 'speaking' && <Volume2 className="w-3.5 h-3.5 animate-pulse text-leaf-600" />}
                {aiState === 'listening' && <Mic className="w-3.5 h-3.5 animate-pulse text-[#D32F2F]" />}
                {aiState === 'thinking' && <Loader2 className="w-3.5 h-3.5 animate-spin text-leaf-600" />}
                <span>
                  {aiState === 'speaking' ? `${interviewMode === 'panel' ? activePersona.name : 'Interviewer'} speaking aloud...`
                  : aiState === 'listening' ? 'Listening to your response...'
                  : aiState === 'thinking' ? 'Preparing next topic...'
                  : 'Interviewer Ready'}
                </span>
              </span>
            </div>
          </div>

          {/* Live Spoken Captions Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-leaf-600 font-serif">
              <span className="flex items-center gap-1">
                <MessageSquareText className="w-3.5 h-3.5 text-leaf-600" /> Spoken Question Captions
              </span>
              {currentBasedOn && (
                <span className="text-[10px] text-darkcharcoal-500 truncate max-w-[180px]">
                  Tag: {currentBasedOn}
                </span>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-mint-50 border border-warmborder text-xs sm:text-sm leading-relaxed font-serif text-darkcharcoal-900 min-h-[110px] flex items-center justify-center text-center">
              {hasStartedSession ? (
                currentSpokenQuestion ? (
                  <p>"{currentSpokenQuestion}"</p>
                ) : (
                  <p className="text-darkcharcoal-500 italic">Preparing next interview question...</p>
                )
              ) : (
                <div className="space-y-3">
                  <p className="text-darkcharcoal-700">Click <strong>"Start Voice Interview Session"</strong> below to begin your real-time conversational mock interview.</p>
                  <button
                    onClick={handleStartInterviewSession}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-leaf-500 hover:bg-leaf-600 text-white font-extrabold text-xs shadow-warm-md hover:scale-[1.02] transition-all"
                  >
                    <Target className="w-4 h-4 text-white" />
                    <span>Start Voice Interview Session</span>
                  </button>
                </div>
              )}
            </div>

            {aiReasoning && (
              <div className="text-[10px] text-darkcharcoal-500 italic px-1 truncate">
                Adaptability Note: {aiReasoning}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Candidate Camera Feed & Speech Recording Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Camera Feed Container */}
          <div className="relative aspect-video rounded-3xl border border-forest-600/40 overflow-hidden bg-forest-900 flex items-center justify-center shadow-earthy">
            
            {/* Permission Denied Banner */}
            {cameraPermission === 'denied' && (
              <div className="p-6 text-center space-y-4 max-w-sm">
                <div className="w-12 h-12 rounded-full bg-earth-terracotta/30 text-earth-terracotta flex items-center justify-center mx-auto border border-earth-terracotta/40">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold font-serif text-earth-cream">
                    {permissionErrorType === 'busy' ? 'Camera is in Use by Another App'
                     : permissionErrorType === 'not_found' ? 'No Camera Detected'
                     : permissionErrorType === 'overconstrained' ? 'Camera Resolution Not Supported'
                     : 'Camera & Microphone Access Denied'}
                  </h3>
                  <p className="text-xs text-earth-cream/70 leading-relaxed">
                    {permissionError}
                  </p>
                </div>
                <button
                  onClick={requestMediaPermissions}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-accent-gold to-earth-tan text-forest-900 text-xs font-extrabold shadow-glow-gold hover:scale-[1.02] transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry Camera Permission</span>
                </button>
              </div>
            )}

            {/* Live Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform -scale-x-100 ${
                cameraPermission === 'granted' ? 'block' : 'hidden'
              }`}
            />

            {/* Live Eye Contact Indicator */}
            {cameraPermission === 'granted' && (
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-900/90 backdrop-blur-md border border-forest-600/40 shadow-lg">
                {currentTelemetry.faceDetected ? (
                  currentTelemetry.gazeCentered ? (
                    <>
                      <span className="w-3 h-3 rounded-full bg-sage-400 animate-ping shrink-0" />
                      <span className="text-xs font-bold text-sage-400 flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> Gaze Centered
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="w-3 h-3 rounded-full bg-earth-tan animate-pulse shrink-0" />
                      <span className="text-xs font-bold text-accent-gold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Eye Contact Warning
                      </span>
                    </>
                  )
                ) : (
                  <>
                    <span className="w-3 h-3 rounded-full bg-earth-terracotta animate-pulse shrink-0" />
                    <span className="text-xs font-bold text-earth-terracotta">No Candidate Detected</span>
                  </>
                )}
              </div>
            )}

            {/* Exchange Pacing Counter Pill */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-900/90 backdrop-blur-md border border-forest-600/40 text-accent-gold text-xs font-bold font-mono">
              <Sparkles className="w-3.5 h-3.5 text-accent-gold" />
              <span>Exchange {totalExchanges} of 8</span>
            </div>

            {/* Recording Active Pill */}
            {isAnswering && (
              <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-earth-terracotta/90 text-earth-cream border border-earth-terracotta/50 font-mono text-xs font-bold animate-pulse shadow-lg">
                <Radio className="w-4 h-4 animate-spin text-accent-gold" />
                <span>REC: {answerDuration}s</span>
              </div>
            )}

          </div>

          {/* Realtime Speech & Vision Telemetry Cards */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="rounded-2xl bg-forest-800/80 p-3.5 border border-forest-600/40 space-y-1 shadow-earthy">
              <span className="text-[11px] text-earth-cream/70 font-medium">Speaking Pace</span>
              <div className="text-lg font-bold font-serif text-earth-cream">
                {isAnswering ? `${Math.round(((liveTranscript.split(/\s+/).length || 0) / Math.max(1, answerDuration)) * 60)} WPM` : '138 WPM'}
              </div>
              <span className="text-[10px] text-sage-400 font-semibold">Optimal Cadence</span>
            </div>

            <div className="rounded-2xl bg-forest-800/80 p-3.5 border border-forest-600/40 space-y-1 shadow-earthy">
              <span className="text-[11px] text-earth-cream/70 font-medium">Filler Words</span>
              <div className="text-lg font-bold font-serif text-accent-gold">
                {isAnswering ? analyzeSpeechMetrics(liveTranscript, answerDuration, longPauseCount).fillerWordCount : '0'}
              </div>
              <span className="text-[10px] text-earth-cream/60">um, uh, like, basically</span>
            </div>

            <div className="rounded-2xl bg-forest-800/80 p-3.5 border border-forest-600/40 space-y-1 shadow-earthy">
              <span className="text-[11px] text-earth-cream/70 font-medium">Silence Gaps &gt;2s</span>
              <div className="text-lg font-bold font-serif text-earth-tan">
                {longPauseCount}
              </div>
              <span className="text-[10px] text-earth-cream/60">Pause Counter</span>
            </div>
          </div>

          {/* Candidate Response Transcript & Controls */}
          <div className="rounded-3xl bg-forest-800/80 border border-forest-600/40 p-5 space-y-4 shadow-earthy backdrop-blur-md">
            
            <div className="flex items-center justify-between text-xs text-earth-cream/80 font-bold">
              <span className="flex items-center gap-1.5 text-accent-gold font-serif">
                <Mic className="w-4 h-4 text-accent-gold" /> Your Spoken Answer Transcript
              </span>
              {isAnswering && <span className="text-sage-400 text-[11px] font-mono animate-pulse">Live Transcribing...</span>}
            </div>

            <div className="p-4 rounded-2xl bg-forest-900/80 border border-forest-600/30 min-h-[90px] text-xs leading-relaxed text-earth-cream">
              {isAnswering ? (
                liveTranscript ? (
                  <p>{liveTranscript}</p>
                ) : (
                  <p className="text-earth-cream/60 italic">Listening for your speech... Speak clearly into your microphone.</p>
                )
              ) : savedAnswerMetrics ? (
                <div className="space-y-2">
                  <p className="font-semibold text-white">{savedAnswerMetrics.transcript}</p>
                  <div className="p-2.5 rounded-xl bg-forest-800/90 border border-forest-600/40 text-[11px] grid grid-cols-2 gap-2 text-earth-cream/70">
                    <div>Pace: <strong className="text-white">{savedAnswerMetrics.metrics.wordsPerMinute} WPM</strong></div>
                    <div>Fillers: <strong className="text-accent-gold">{savedAnswerMetrics.metrics.fillerWordCount}</strong></div>
                  </div>
                </div>
              ) : (
                <p className="text-earth-cream/60 italic">
                  {aiState === 'speaking' 
                    ? 'Wait for the AI Interviewer to finish speaking before starting your answer.'
                    : 'Click "Start Answer Recording" below to speak your response.'}
                </p>
              )}
            </div>

            {/* Answer Control Buttons */}
            <div className="space-y-2">
              {!isAnswering ? (
                <button
                  onClick={handleStartAnswer}
                  disabled={!hasStartedSession || aiState === 'speaking' || evaluatingFollowup}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-accent-gold to-earth-tan text-forest-900 font-extrabold text-xs shadow-glow-gold hover:scale-[1.02] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  <Mic className="w-4 h-4" />
                  <span>
                    {!hasStartedSession ? 'Start Session Above First' : aiState === 'speaking' ? 'AI is speaking question...' : 'Start Answer Recording'}
                  </span>
                </button>
              ) : (
                <button
                  onClick={handleStopAnswer}
                  className="w-full py-3.5 rounded-full bg-earth-terracotta text-white font-extrabold text-xs shadow-lg animate-pulse hover:bg-earth-terracotta/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Submit Answer & Get Adaptive Follow-Up</span>
                </button>
              )}

              <div className="flex items-center justify-between gap-3 pt-1 text-xs">
                <button
                  onClick={() => {
                    stopSpeech();
                    setRoundIndex(2);
                    navigate('/results');
                  }}
                  className="w-full py-2.5 rounded-full bg-forest-900 hover:bg-forest-600 text-earth-cream/80 text-xs font-semibold border border-forest-600/40 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Finish Interview & View Final Diagnostic Report</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
