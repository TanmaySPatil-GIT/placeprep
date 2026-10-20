import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { usePrep } from '../context/PrepContext';
import { useAuth } from '../context/AuthContext';
import { INITIAL_HR_QUESTIONS } from '../utils/seedHrQuestions';
import { analyzeSpeechMetrics } from '../services/speechAnalyzer';
import { loadFaceApiModels, analyzeFaceFrame } from '../services/faceDetector';
import { speakText, stopSpeech, isTTSSupported, getAvailableEnglishVoices } from '../services/speechSynthesizer';
import { calculateConfidenceScore } from '../utils/confidenceScorer';
import { getBackendUrl } from '../config/api';
import { 
  initializeInterviewSession, 
  updateStateAfterTurn,
  markSessionCompleted
} from '../services/conversationStateManager.js';
import { evaluateDecisionEngine } from '../services/decisionEngine.js';
import { executeInterviewTurn, executeOpeningTurn } from '../services/interviewPipeline.js';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  ArrowRight,
  ShieldAlert,
  Brain,
  Users,
  Award,
  Loader2,
  UserCheck,
  MessageSquareText,
  Target
} from 'lucide-react';

import { shuffleArray } from '../utils/shuffle';
import ProgressStepper from '../components/ProgressStepper';

const HR_PERSONA = {
  name: 'Sarah Jenkins',
  role: 'Senior People & Culture Partner',
  badgeClass: 'bg-gold-100 text-gold-700 border-gold-200 font-bold',
  avatarEmoji: '👥'
};

const RECENT_HR_STORAGE_KEY = 'placeprep_recent_hr_qids';

const getRecentHrQuestionIds = () => {
  try {
    const saved = localStorage.getItem(RECENT_HR_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

const saveRecentHrQuestionIds = (newQIds) => {
  try {
    const current = getRecentHrQuestionIds();
    const combined = Array.from(new Set([...newQIds, ...current])).slice(0, 25);
    localStorage.setItem(RECENT_HR_STORAGE_KEY, JSON.stringify(combined));
  } catch (e) {
    console.warn('Could not save recent HR question IDs:', e);
  }
};

export default function HrInterviewRoundPage() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { 
    selectedCompany, 
    setRoundIndex, 
    addAnswerResult,
    setSessionState: setGlobalSessionState,
    setHrInterviewResult, 
    hrInterviewResult: savedHrResult, 
    difficultyLevel,
    selectedLanguage,
    interviewerPersona
  } = usePrep();

  const companyName = selectedCompany?.name || 'Google';
  const targetField = userProfile?.targetField || 'Software Development';

  // Video & Stream refs
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraPermission, setCameraPermission] = useState('prompt');
  const [permissionError, setPermissionError] = useState('');
  const [permissionErrorType, setPermissionErrorType] = useState('');

  // Questions Bank State
  const [questionsBank, setQuestionsBank] = useState(INITIAL_HR_QUESTIONS);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Conversational AI State
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentSpokenQuestion, setCurrentSpokenQuestion] = useState('');
  const [topicFollowupCount, setTopicFollowupCount] = useState(0);
  const [aiState, setAiState] = useState('idle'); // 'speaking' | 'listening' | 'thinking' | 'idle'
  const [evaluatingFollowup, setEvaluatingFollowup] = useState(false);
  const [hasStartedSession, setHasStartedSession] = useState(false);
  const [sessionState, setSessionState] = useState(null);
  const sessionStateRef = useRef(null); // mirrors sessionState for sync access in async handlers
  const currentQuestionIsFallbackRef = useRef(false);
  const [isFinished, setIsFinished] = useState(false);
  const [hrResult, setHrResult] = useState(savedHrResult);

  // Controls & Recording State
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [isAnswering, setIsAnswering] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [answerDuration, setAnswerDuration] = useState(0);
  const [longPauseCount, setLongPauseCount] = useState(0);
  const [lastSegmentConfidence, setLastSegmentConfidence] = useState(0.92);

  // Vision telemetry state
  const [modelsReady, setModelsReady] = useState(false);
  const [currentTelemetry, setCurrentTelemetry] = useState({
    faceDetected: true,
    gazeCentered: true,
    lookingAway: false,
    expression: 'neutral',
    emotionalBucket: 'Confident',
    confidence: 90
  });
  const [telemetryLogs, setTelemetryLogs] = useState([]);

  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const answerTimerRef = useRef(null);
  const pauseCheckTimerRef = useRef(null);
  const lastSpeechTimeRef = useRef(Date.now());

  // Load face-api.js models on mount
  useEffect(() => {
    loadFaceApiModels().then(success => {
      setModelsReady(success);
      console.log('[HrInterviewRoundPage] face-api.js models ready status:', success);
    });
  }, []);

  // 1. Fetch HR Questions
  const fetchHrQuestions = async () => {
    setLoadingQuestions(true);
    const recentIds = getRecentHrQuestionIds();
    try {
      const snap = await getDocs(collection(db, 'hrQuestions'));
      let pool = [];
      if (!snap.empty) {
        pool = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } else {
        pool = INITIAL_HR_QUESTIONS;
      }

      const unseen = pool.filter(q => !recentIds.includes(q.id));
      const candidatePool = unseen.length >= 2 ? unseen : pool;
      const shuffled = shuffleArray(candidatePool);

      setQuestionsBank(shuffled);
    } catch (err) {
      console.warn('HR questions fetch notice:', err.message);
      const shuffled = shuffleArray(INITIAL_HR_QUESTIONS);
      setQuestionsBank(shuffled);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    fetchHrQuestions();
  }, []);

  const handleRestartHrSession = () => {
    stopSpeech();
    setHasStartedSession(false);
    setIsFinished(false);
    setQuestionIdx(0);
    setConversationHistory([]);
    setLiveTranscript('');
    setHrResult(null);
    fetchHrQuestions();
  };

  // 2. MediaStream Permissions (Camera + Mic) with Fallbacks & Specific Error Classification
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
      }
    } catch (err) {
      console.error('Media permission error details:', err.name, err.message);
      setCameraPermission('denied');

      let errorMsg = 'Could not access camera or microphone. Please allow permissions in browser settings.';
      let typeStr = 'NotAllowedError';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        typeStr = 'NotAllowedError';
        errorMsg = 'Camera and microphone access was denied. Please click the camera icon in your browser address bar to allow access and refresh.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        typeStr = 'NotFoundError';
        errorMsg = 'No camera or microphone device was found on your system. Please connect a working webcam or mic.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        typeStr = 'NotReadableError';
        errorMsg = 'Webcam or microphone is currently in use by another application (e.g. Zoom, Teams, Meet). Please close other apps and try again.';
      }

      setPermissionError(errorMsg);
      setPermissionErrorType(typeStr);
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

  // Vision telemetry loop (~500ms)
  useEffect(() => {
    if (cameraPermission !== 'granted' || !videoRef.current || !hasStartedSession || !videoActive) return;

    const interval = setInterval(async () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
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

  // Speech Recognition Init with Auto-Reconnect and Interim Filler Buffer
  const accumulatedFinalRef = useRef('');
  const isAnsweringRef = useRef(false);
  const detectedFillersRef = useRef({});

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      // Support Indian English and user locale for maximum speech recognition accuracy
      const browserLang = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : 'en-IN';
      recognition.lang = browserLang.startsWith('en') ? browserLang : 'en-IN';

      recognition.onresult = (event) => {
        let interimText = '';
        let confSum = 0;
        let confCount = 0;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const seg = event.results[i][0];
          if (seg.confidence && seg.confidence > 0) {
            confSum += seg.confidence;
            confCount++;
          }
          if (event.results[i].isFinal) {
            accumulatedFinalRef.current += seg.transcript + ' ';
          } else {
            interimText += seg.transcript;
          }
        }

        if (confCount > 0) {
          setLastSegmentConfidence(confSum / confCount);
        }

        // Real-time interim disfluency detector (catches fillers before browser STT scrubs them)
        const combinedSlice = (interimText + ' ' + (event.results[event.results.length - 1]?.[0]?.transcript || '')).toLowerCase();
        const hesitationRegex = /\b(u+m+|u+h+|e+r+m*|a+h+|h+m+)\b/gi;
        const hesitationMatches = combinedSlice.match(hesitationRegex);
        if (hesitationMatches) {
          detectedFillersRef.current['um/uh'] = Math.max(detectedFillersRef.current['um/uh'] || 0, hesitationMatches.length);
        }
        const crutches = ['like', 'basically', 'actually', 'literally', 'you know', 'kind of', 'sort of', 'i mean', 'so yeah'];
        crutches.forEach(c => {
          const reg = new RegExp(`\\b${c}\\b`, 'gi');
          const m = combinedSlice.match(reg);
          if (m) {
            detectedFillersRef.current[c] = Math.max(detectedFillersRef.current[c] || 0, m.length);
          }
        });

        const clean = (accumulatedFinalRef.current + ' ' + interimText).replace(/\s+/g, ' ').trim();
        if (clean) {
          transcriptRef.current = clean;
          setLiveTranscript(clean);
          lastSpeechTimeRef.current = Date.now();
        }
      };

      recognition.onerror = (e) => {
        console.warn('Speech recognition error:', e.error);
      };

      // Seamless Auto-Reconnect: prevent Chrome from terminating mic if candidate pauses to think
      recognition.onend = () => {
        if (isAnsweringRef.current) {
          try {
            recognition.start();
            console.log('[HrInterviewRoundPage] Auto-reconnected SpeechRecognition after pause.');
          } catch (e) {
            // Already active or restarting
          }
        }
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Answer timer & 2s+ Silence pause tracker
  useEffect(() => {
    if (isAnswering) {
      setAnswerDuration(0);
      setLongPauseCount(0);
      lastSpeechTimeRef.current = Date.now();

      answerTimerRef.current = setInterval(() => {
        setAnswerDuration(prev => prev + 1);
      }, 1000);

      let lastPauseCheck = Date.now();
      pauseCheckTimerRef.current = setInterval(() => {
        const now = Date.now();
        if (now - lastSpeechTimeRef.current > 2200 && now - lastPauseCheck > 2200) {
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

  const ttsTimerRef = useRef(null);

  const triggerAISpeech = (text) => {
    if (ttsTimerRef.current) clearTimeout(ttsTimerRef.current);
    setAiState('speaking');
    
    // Safety fallback: Ensure aiState resets to 'idle' after 12s even if TTS onend event fails
    ttsTimerRef.current = setTimeout(() => {
      setAiState('idle');
    }, 12000);

    speakText({
      text,
      langCode: selectedLanguage?.code || 'en-US',
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

  const handleStartSession = async () => {
    console.log('[OpeningTurn Debug: HR] 1. handleStartSession triggered.');
    setHasStartedSession(true);
    setQuestionIdx(0);
    setConversationHistory([]);
    setAiState('thinking');

    try {
      let initSession = null;
      try {
        console.log('[OpeningTurn Debug: HR] 2. Awaiting initializeInterviewSession...');
        const sessionPromise = initializeInterviewSession({
          userId: userProfile?.uid || 'user_anon',
          selectedCompany: companyName,
          selectedField: 'sde',
          roundType: 'hr',
          difficultyLevel: difficultyLevel || 'medium'
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('initializeInterviewSession timeout')), 5000)
        );
        initSession = await Promise.race([sessionPromise, timeoutPromise]);
        console.log('[OpeningTurn Debug: HR] 3. initializeInterviewSession completed. Session ID:', initSession?.sessionId);
        setSessionState(initSession);
        sessionStateRef.current = initSession;
      } catch (err) {
        console.warn('[OpeningTurn Debug: HR] 3. HR Session initialization notice:', err.message);
      }

      // Save only question IDs selected for this current session into recent tracking
      saveRecentHrQuestionIds(questionsBank.slice(0, 8).map(q => q.id));

      let openingRes = null;
      let isFallbackOpening = false;
      try {
        console.log('[OpeningTurn Debug: HR] 4. Awaiting executeOpeningTurn (/api/generate-question)...');
        const openingPromise = executeOpeningTurn({
          sessionState: initSession,
          roundType: 'hr',
          backendUrl: getBackendUrl()
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('executeOpeningTurn timeout')), 10000)
        );
        openingRes = await Promise.race([openingPromise, timeoutPromise]);
        console.log('[OpeningTurn Debug: HR] 5. executeOpeningTurn completed. Opening text:', openingRes);
      } catch (opErr) {
        console.warn('[OpeningTurn Debug: HR] 5. HR executeOpeningTurn notice:', opErr.message);
      }

      let initialGreeting = null;
      if (openingRes) {
        initialGreeting = typeof openingRes === 'object' ? (openingRes.question || String(openingRes)) : openingRes;
        isFallbackOpening = Boolean(openingRes.isFallbackQuestion || openingRes.isFallback);
      }

      if (!initialGreeting) {
        console.log('[OpeningTurn Debug: HR] 6. Using initial fallback opening question.');
        const firstQ = questionsBank[0] || INITIAL_HR_QUESTIONS[0];
        initialGreeting = `Hello and welcome to your ${companyName} HR & Culture Fit interview! I'm Sarah from the Talent Partner team. Today's conversation is all about getting to know your journey, how you communicate with teammates, and how you tackle challenges under pressure. To get us started: ${firstQ.question}`;
        isFallbackOpening = true;
      }
      currentQuestionIsFallbackRef.current = isFallbackOpening;
      
      console.log('[OpeningTurn Debug: HR] 7. Setting opening question and resetting aiState to idle.');
      setCurrentSpokenQuestion(initialGreeting);
      setConversationHistory([{ role: 'interviewer', text: initialGreeting }]);

      setTimeout(() => {
        triggerAISpeech(initialGreeting);
      }, 500);
    } catch (err) {
      console.error('[HrInterviewRoundPage] Error starting HR session:', err);
    } finally {
      setAiState('idle');
    }
  };

  const handleStartAnswer = () => {
    stopSpeech();
    accumulatedFinalRef.current = '';
    transcriptRef.current = '';
    detectedFillersRef.current = {};
    setIsAnswering(true);
    isAnsweringRef.current = true;
    setLiveTranscript('');
    setAnswerDuration(0);
    setLongPauseCount(0);
    lastSpeechTimeRef.current = Date.now();
    setAiState('listening');

    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (e) {}
    }
  };

  const handleStopAnswer = async () => {
    console.log('[HrInterviewRoundPage] [setState START] setIsAnswering(false), setAiState("thinking"), setEvaluatingFollowup(true)');
    setIsAnswering(false);
    isAnsweringRef.current = false;
    setAiState('thinking');
    setEvaluatingFollowup(true);
    console.log('[HrInterviewRoundPage] [setState COMPLETE] isAnswering=false, aiState=thinking, evaluatingFollowup=true');

    const stopTimestamp = Date.now();

    if (answerTimerRef.current) clearInterval(answerTimerRef.current);
    if (pauseCheckTimerRef.current) clearInterval(pauseCheckTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    try {
      const capturedText = (transcriptRef.current || liveTranscript).trim();

      console.log('\n=================== [INTERVIEW DEBUG: HR ROUND] ===================');
      console.log(`[Interview Debug: HR] Step 1 - Transcript captured for Q${questionIdx + 1}:`, `"${capturedText}"`);
      if (!capturedText) {
        console.warn('[Interview Debug: HR] WARNING: Captured transcript is empty! Mic input may not have registered.');
      }

      const userTranscript = capturedText || "I don't have a response to this question right now.";
      const capturedFillers = { ...detectedFillersRef.current };
      
      const updatedHistory = [
        ...conversationHistory,
        { role: 'candidate', text: userTranscript }
      ];
      console.log('[HrInterviewRoundPage] [setState START] setConversationHistory (candidate answer)');
      setConversationHistory(updatedHistory);
      console.log('[HrInterviewRoundPage] [setState COMPLETE] setConversationHistory updated with candidate turn');

      const speechMetrics = analyzeSpeechMetrics(userTranscript, answerDuration, longPauseCount, lastSegmentConfidence, capturedFillers);
      console.log('[Interview Debug: HR] Granular speech metrics calculated:', speechMetrics);

      const metrics = calculateConfidenceScore({
        metrics: {
          wordsPerMinute: speechMetrics.wordsPerMinute,
          wordCount: speechMetrics.wordCount,
          fillerWordCount: speechMetrics.fillerWordCount,
          longPauseCount: speechMetrics.longPauseCount
        },
        visionSummary: { gazeRatio: 90, faceRatio: 95 }
      });

      const isSituation = /situation|when|while|during|at/i.test(userTranscript);
      const isTask = /task|goal|objective|needed|had to/i.test(userTranscript);
      const isAction = /i created|i built|i decided|i led|i resolved|action/i.test(userTranscript);
      const isResult = /result|outcome|increased|reduced|achieved|finally/i.test(userTranscript);
      
      const starDetected = { isSituation, isTask, isAction, isResult };

      if (typeof addAnswerResult === 'function') {
        addAnswerResult({
          questionId: `hr-q-${questionIdx}`,
          questionText: currentSpokenQuestion,
          transcript: userTranscript,
          durationSeconds: answerDuration,
          longPauseCount,
          metrics,
          speechMetrics,
          starDetected,
          visionSummary: { gazeRatio: 90, faceRatio: 95 }
        });
      } else {
        console.warn('[Interview Debug: HR] addAnswerResult is not available on PrepContext, skipping history recording');
      }

      const askedQuestionsHistory = updatedHistory
        .filter(turn => turn.role === 'interviewer' || turn.role === 'assistant')
        .map(turn => turn.text);

      console.log('\n=================== [FRONTEND DEBUG: HR INTERVIEW] ===================');
      console.log('[Interview Debug: HR] PREVIOUSLY ASKED QUESTIONS (Count:', askedQuestionsHistory.length, '):', askedQuestionsHistory);
      console.log('[Interview Debug: HR] FULL CONVERSATION HISTORY PAYLOAD:', updatedHistory);
      console.log('======================================================================\n');

      let backendNextQ = null;
      let isNewTopic = false;
      const controller = new AbortController();
      const fetchTimeout = setTimeout(() => controller.abort(), 15000);

      try {
        const activeSession = sessionStateRef.current || sessionState;
        console.log('[HrInterviewRoundPage] Executing turn pipeline with activeSession:', activeSession?.sessionId);
        const turnResult = await executeInterviewTurn({
          sessionState: activeSession,
          question: currentSpokenQuestion,
          studentAnswer: userTranscript,
          roundType: 'hr',
          currentTopicId: activeSession?.currentTopicId || 'behavioral-handling-conflict',
          backendUrl: getBackendUrl(),
          signal: controller.signal,
          isFallbackQuestion: currentQuestionIsFallbackRef.current
        });

        clearTimeout(fetchTimeout);

        if (turnResult) {
          backendNextQ = turnResult.interviewerResponse;
          isNewTopic = turnResult.isNewTopic;
          if (turnResult.updatedSessionState) {
            console.log('[HrInterviewRoundPage] [setState START] setSessionState with updated session state');
            setSessionState(turnResult.updatedSessionState);
            sessionStateRef.current = turnResult.updatedSessionState;
            if (typeof setGlobalSessionState === 'function') {
              setGlobalSessionState(turnResult.updatedSessionState);
            }
            console.log('[HrInterviewRoundPage] [setState COMPLETE] setSessionState updated');
          }
          if (turnResult.evaluatorOutput) {
            addAnswerResult({
              questionId: `hr-q-${totalExchanges}`,
              evidenceQuote: turnResult.evaluatorOutput.evidenceQuote,
              verdict: turnResult.evaluatorOutput.verdict,
              conceptsCorrect: turnResult.evaluatorOutput.conceptsCorrect,
              conceptsWrong: turnResult.evaluatorOutput.conceptsWrong,
              conceptsMissing: turnResult.evaluatorOutput.conceptsMissing,
              uncertainty: turnResult.evaluatorOutput.uncertainty,
              modelUsed: turnResult.evaluatorOutput.modelUsed,
              rubricVersion: turnResult.evaluatorOutput.rubricVersion,
              reason: turnResult.evaluatorOutput.reason,
              isFallbackQuestion: currentQuestionIsFallbackRef.current,
              degraded: Boolean(turnResult.evaluatorOutput.degraded)
            });
          }
          currentQuestionIsFallbackRef.current = Boolean(turnResult.isFallbackQuestion);
        }
      } catch (err) {
        clearTimeout(fetchTimeout);
        console.error('[Interview Debug: HR] Turn pipeline error:', err);
      } finally {
        console.log('[HrInterviewRoundPage] [setState START] setEvaluatingFollowup(false)');
        setEvaluatingFollowup(false);
        console.log('[HrInterviewRoundPage] [setState COMPLETE] setEvaluatingFollowup(false)');
      }

      // Enforce 1.8s interviewer reflection pause in 'thinking' state
      const elapsedMs = Date.now() - stopTimestamp;
      const MIN_PAUSE_MS = 1800;
      const remainingPauseMs = Math.max(0, MIN_PAUSE_MS - elapsedMs);

      setTimeout(() => {
        try {
          if (questionIdx < 7) {
            if (!backendNextQ) {
              const errorMsg = "I encountered an issue generating an AI follow-up response. Please try submitting your response again.";
              console.log('[HrInterviewRoundPage] [setState START] setCurrentSpokenQuestion (fallback error message), setAiState("idle")');
              setCurrentSpokenQuestion(errorMsg);
              setAiState('idle');
              console.log('[HrInterviewRoundPage] [setState COMPLETE] setCurrentSpokenQuestion set, aiState=idle');
              return;
            }

            const nextIdx = questionIdx + 1;
            console.log('[HrInterviewRoundPage] [setState START] setQuestionIdx:', nextIdx);
            setQuestionIdx(nextIdx);
            console.log('[HrInterviewRoundPage] [setState COMPLETE] setQuestionIdx updated');

            if (isNewTopic) {
              setTopicFollowupCount(0);
            } else {
              setTopicFollowupCount(prev => prev + 1);
            }

            let nextText = backendNextQ;

            // Anti-Repetition Safeguard: Check if nextText is a duplicate of any previously asked question
            const isDuplicate = (candidateText) => {
              if (!candidateText) return true;
              const normCandidate = candidateText.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
              return askedQuestionsHistory.some(prevQ => {
                const normPrev = prevQ.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
                if (normPrev === normCandidate) return true;
                const words1 = new Set(normCandidate.split(/\s+/).filter(w => w.length > 3));
                const words2 = new Set(normPrev.split(/\s+/).filter(w => w.length > 3));
                if (words1.size === 0 || words2.size === 0) return false;
                let matchCount = 0;
                for (const w of words1) {
                  if (words2.has(w)) matchCount++;
                }
                const overlap = matchCount / Math.min(words1.size, words2.size);
                return overlap > 0.75;
              });
            };

            if (isDuplicate(nextText)) {
              console.warn('[Anti-Repetition Safeguard: HR] Detected duplicate question from generator:', nextText);
              const unusedFromBank = questionsBank.find(q => !isDuplicate(q.question));
              if (unusedFromBank) {
                nextText = unusedFromBank.question;
                currentQuestionIsFallbackRef.current = true;
                console.log('[Anti-Repetition Safeguard: HR] Substituted with fresh question from question bank:', nextText);
              } else {
                const unusedInitial = INITIAL_HR_QUESTIONS.find(q => !isDuplicate(q.question));
                nextText = unusedInitial ? unusedInitial.question : `Let's discuss another key aspect of your engineering background. What is a complex project milestone you recently delivered?`;
                currentQuestionIsFallbackRef.current = true;
                console.log('[Anti-Repetition Safeguard: HR] Substituted with fresh fallback question:', nextText);
              }
            }

            console.log('[HrInterviewRoundPage] [setState START] setCurrentSpokenQuestion:', nextText);
            setCurrentSpokenQuestion(nextText);
            setConversationHistory(prev => [...prev, { role: 'interviewer', text: nextText }]);
            console.log('[HrInterviewRoundPage] [setState COMPLETE] setCurrentSpokenQuestion and setConversationHistory updated');
            
            triggerAISpeech(nextText);
          } else {
            const finalText = `Thank you! That completes Stage 6 — HR & Culture Fit Interview for ${companyName}. I have recorded your responses for the final evaluation.`;
            console.log('[HrInterviewRoundPage] [setState START] setCurrentSpokenQuestion (final), setHrResult, setIsFinished(true)');
            setCurrentSpokenQuestion(finalText);
            triggerAISpeech(finalText);

            const starScore = Object.values(starDetected).filter(Boolean).length * 25;
            const finalCommunicationScore = Math.round((metrics.compositeScore * 0.5) + (starScore * 0.5));

            const finalResult = {
              score: finalCommunicationScore,
              clarityScore: metrics.compositeScore,
              starAdherenceScore: starScore,
              answersCount: questionIdx + 1,
              isPassed: true,
              summary: `Strong candidate alignment with ${companyName} culture and STAR-structured communication.`,
              timestamp: new Date().toISOString()
            };

            setHrResult(finalResult);
            if (typeof setHrInterviewResult === 'function') {
              setHrInterviewResult(finalResult);
            }
            setIsFinished(true);
            console.log('[HrInterviewRoundPage] [setState COMPLETE] setHrResult and setIsFinished updated');
          }
        } finally {
          console.log('[HrInterviewRoundPage] [setState START] setAiState("idle") (unconditional reset)');
          setAiState('idle');
          console.log('[HrInterviewRoundPage] [setState COMPLETE] aiState reset to idle');
        }
      }, remainingPauseMs);

    } catch (outerErr) {
      console.error('[HrInterviewRoundPage] Outer handleStopAnswer error:', outerErr);
      setEvaluatingFollowup(false);
      setAiState('idle');
    }
  };


  return (
    <div className="space-y-6 py-2 max-w-6xl mx-auto">
      
      {/* 7-Stage Stepper Navigation */}
      <ProgressStepper />

      {/* BEFORE STARTING SESSION */}
      {!hasStartedSession ? (
        <div className="rounded-[32px] bg-white p-8 sm:p-12 border border-warmborder text-center space-y-6 shadow-warm-sm">
          <div className="w-16 h-16 rounded-full bg-mint-100 text-leaf-600 border border-warmborder flex items-center justify-center mx-auto shadow-warm-sm">
            <Users className="w-8 h-8 text-leaf-600" />
          </div>
          <div className="space-y-2 max-w-xl mx-auto">
            <span className="px-3.5 py-1 rounded-full text-xs font-extrabold bg-mint-100 text-leaf-600 border border-warmborder">
              Stage 6 • HR & Culture Fit Interview
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-darkcharcoal-900">
              {companyName} HR & Behavioral Interview
            </h1>
            <p className="text-xs text-darkcharcoal-700 leading-relaxed font-sans">
              This round evaluates your interpersonal communication, career vision, conflict resolution, work preferences, and alignment with {companyName} core values.
            </p>
          </div>

          <div className="pt-4 flex justify-center">
            <button
              type="button"
              onClick={handleStartSession}
              className="px-8 py-3.5 rounded-full bg-leaf-500 hover:bg-leaf-600 text-white font-extrabold text-sm shadow-warm-md hover:scale-[1.02] transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current text-white" />
              <span>Begin Stage 6 HR Interview</span>
            </button>
          </div>
        </div>
      ) : !isFinished ? (

        /* LIVE HR INTERVIEW INTERFACE */
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Left Column: AI Interviewer Avatar Card */}
          <div className="w-full lg:w-1/2 bg-forest-900 border border-forest-600/30 rounded-2xl p-5 shadow-earthy flex flex-col justify-between relative overflow-hidden min-h-[460px]">
            {/* Header Info */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="text-xl">{HR_PERSONA.avatarEmoji}</span>
                <div>
                  <h3 className="text-sm font-bold text-white">{HR_PERSONA.name}</h3>
                  <p className="text-[11px] text-sage-300">{HR_PERSONA.role} @ {companyName}</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-mint-100 text-leaf-800 border-warmborder font-bold">
                Stage 6 HR Screen
              </span>
            </div>

            {/* Avatar Center Animation */}
            <div className="my-auto py-6 flex flex-col items-center justify-center text-center space-y-4 z-10">
              <div className="relative">
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
                    {aiState === 'speaking' ? `${HR_PERSONA.name} speaking aloud...`
                    : aiState === 'listening' ? 'Listening to your response...'
                    : aiState === 'thinking' ? 'Evaluating behavior & preparing question...'
                    : 'Interviewer Ready'}
                  </span>
                </span>
              </div>
            </div>

            {/* STAR Response Method Guide Pill */}
            <div className="mb-2 p-2.5 bg-forest-800/70 border border-forest-600/30 rounded-xl space-y-1 z-10 text-left">
              <div className="flex items-center justify-between text-[11px] font-bold text-sage-200">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-accent-gold" /> STAR Evaluation Standard
                </span>
                <span className="text-[10px] text-accent-gold font-mono">HR Behavioral Model</span>
              </div>
              <p className="text-[10px] text-sage-300 leading-snug">
                Structure your answers with: <strong>Situation</strong> (context), <strong>Task</strong> (challenge), <strong>Action</strong> (what YOU specifically did), and <strong>Result</strong> (impact & metrics).
              </p>
            </div>

            {/* Spoken Question Box */}
            <div className="space-y-2 z-10 mt-auto">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sage-300 font-heading">
                  <MessageSquareText className="w-3.5 h-3.5 text-accent-gold" /> Current HR Question
                </span>
                <span className="text-[10px] text-sage-400">
                  Question {questionIdx + 1} of 8
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-mint-50 border border-warmborder text-xs sm:text-sm leading-relaxed font-serif text-darkcharcoal-900 min-h-[90px] flex items-center justify-center text-center">
                <p>&quot;{currentSpokenQuestion || questionsBank[questionIdx]?.question}&quot;</p>
              </div>
            </div>
          </div>

          {/* Right Column: Candidate Webcam & Live Transcript Controls */}
          <div className="w-full lg:w-1/2 space-y-4">
            
            {/* Webcam Feed Container */}
            <div className="relative rounded-[32px] bg-darkcharcoal-900 aspect-video overflow-hidden border border-warmborder shadow-warm-sm flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-opacity ${videoActive ? 'opacity-100' : 'opacity-0'}`}
              />

              {!videoActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-darkcharcoal-900 text-white/70 text-xs font-semibold">
                  Camera Feed Disabled
                </div>
              )}

              {/* Live Speech Indicator Overlay */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between p-3.5 rounded-2xl bg-white/90 backdrop-blur-md border border-warmborder text-xs text-darkcharcoal-900 shadow-warm-sm">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isAnswering ? 'bg-red-500 animate-ping' : aiState === 'thinking' ? 'bg-amber-500 animate-pulse' : 'bg-leaf-500'}`}></span>
                  <span className="font-bold">
                    {isAnswering 
                      ? 'Recording Your Answer...' 
                      : aiState === 'thinking' 
                      ? 'Evaluating Response...' 
                      : aiState === 'speaking' 
                      ? 'Sarah Speaking...' 
                      : 'Ready for Response'}
                  </span>
                </div>
                {isAnswering && <span className="font-mono text-gold-600 font-bold">{answerDuration}s</span>}
                {aiState === 'thinking' && <Loader2 className="w-4 h-4 animate-spin text-amber-600" />}
              </div>
            </div>

            {/* Answer Control Toolbar */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-warmborder shadow-warm-sm">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMicActive(prev => !prev)}
                  className={`p-3 rounded-full border text-xs font-semibold transition-colors ${micActive ? 'bg-mint-100 text-leaf-700 border-warmborder' : 'bg-[#FDF3F3] text-[#D32F2F] border-[#F0C2C2]'}`}
                  title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
                >
                  {micActive ? <Mic className="w-4 h-4 text-leaf-600" /> : <MicOff className="w-4 h-4 text-[#D32F2F]" />}
                </button>
                <button
                  type="button"
                  onClick={() => setVideoActive(prev => !prev)}
                  className={`p-3 rounded-full border text-xs font-semibold transition-colors ${videoActive ? 'bg-mint-100 text-leaf-700 border-warmborder' : 'bg-[#FDF3F3] text-[#D32F2F] border-[#F0C2C2]'}`}
                  title={videoActive ? 'Disable Video' : 'Enable Video'}
                >
                  {videoActive ? <VideoIcon className="w-4 h-4 text-leaf-600" /> : <VideoOff className="w-4 h-4 text-[#D32F2F]" />}
                </button>
              </div>

              {!isAnswering ? (
                <button
                  type="button"
                  onClick={handleStartAnswer}
                  disabled={aiState === 'speaking' || aiState === 'thinking' || evaluatingFollowup}
                  className="px-6 py-2.5 rounded-full bg-leaf-500 hover:bg-leaf-600 text-white font-extrabold text-xs shadow-warm-md hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {aiState === 'thinking' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Evaluating Response...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      <span>Start Microphone Answer</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleStopAnswer()}
                  className="px-6 py-2.5 rounded-full bg-leaf-600 hover:bg-leaf-700 text-white font-extrabold text-xs shadow-warm-md transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Finish & Submit Answer</span>
                </button>
              )}
            </div>

            {/* Live Audio Transcript Box */}
            <div className="rounded-2xl bg-white p-4 border border-warmborder shadow-warm-sm space-y-2">
              <label className="text-[11px] font-bold text-leaf-600 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-leaf-600" /> Live Spoken Audio Transcript:
              </label>
              <div className="p-3.5 rounded-xl bg-mint-50 border border-warmborder min-h-[90px] text-xs text-darkcharcoal-700 font-sans italic leading-relaxed">
                {liveTranscript || (isAnswering ? 'Listening... Speak naturally about your experience.' : 'Click "Start Microphone Answer" to respond to Sarah.')}
              </div>
            </div>

          </div>

        </div>
      ) : (

        /* STAGE 6 RESULTS SCORECARD */
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-[32px] bg-white p-8 border border-warmborder space-y-6 shadow-warm-sm text-darkcharcoal-900">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-mint-100 border border-warmborder text-leaf-600 text-xs font-bold">
                  <Award className="w-4 h-4 text-leaf-600" /> Stage 7 Completed • HR & Culture Fit
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold font-serif text-darkcharcoal-900">
                  {companyName} HR & Cultural Alignment Scorecard
                </h1>
                <p className="text-xs text-darkcharcoal-700 leading-relaxed font-sans">
                  Evaluated across communication clarity, confidence, STAR response structure, and cultural alignment.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-mint-50 p-5 rounded-2xl border border-warmborder shrink-0">
                <div className="text-center">
                  <div className="text-3xl font-black font-mono text-leaf-600">{hrResult?.score}%</div>
                  <div className="text-[10px] font-semibold text-darkcharcoal-500">HR Confidence</div>
                </div>
                <div className="h-10 w-px bg-warmborder"></div>
                <div className="space-y-1 text-xs font-semibold">
                  <div className="px-3 py-1 rounded-full text-[11px] font-bold bg-mint-100 text-leaf-600 border border-warmborder">
                    Strong Culture Fit
                  </div>
                  <div className="text-[11px] text-darkcharcoal-500">{hrResult?.answersCount} Scenarios Answered</div>
                </div>
              </div>
            </div>

            {/* Advance to Stage 8 Final Evaluation CTA */}
            <div className="flex items-center justify-between pt-6 border-t border-warmborder">
              <button
                type="button"
                onClick={handleRestartHrSession}
                className="px-5 py-2.5 rounded-full bg-white text-leaf-700 hover:bg-mint-100 border border-warmborder text-xs font-bold transition-colors flex items-center gap-2 shadow-warm-sm"
              >
                <RotateCcw className="w-4 h-4 text-leaf-600" />
                <span>Re-run Stage 7 HR Interview (New Questions)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const activeSession = sessionStateRef.current || sessionState;
                  markSessionCompleted(activeSession?.sessionId, activeSession);
                  navigate('/final-report');
                }}
                className="px-7 py-3 rounded-full bg-gradient-to-r from-leaf-600 via-emerald-600 to-teal-700 hover:from-leaf-700 hover:to-teal-800 text-white font-black text-xs shadow-warm-md hover:scale-[1.02] transition-all flex items-center gap-2.5 cursor-pointer"
              >
                <Award className="w-4 h-4 text-amber-300" />
                <span>Generate Whole Placement Report & Certificate (Stage 8)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
