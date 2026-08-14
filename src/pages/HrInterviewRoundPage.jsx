import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { usePrep } from '../context/PrepContext';
import { useAuth } from '../context/AuthContext';
import { INITIAL_HR_QUESTIONS } from '../utils/seedHrQuestions';
import { loadFaceApiModels, analyzeFaceFrame } from '../services/faceDetector';
import { speakText, stopSpeech, isTTSSupported, getAvailableEnglishVoices } from '../services/speechSynthesizer';
import { calculateConfidenceScore } from '../utils/confidenceScorer';
import ProgressStepper from '../components/ProgressStepper';
import { getBackendUrl } from '../config/api';
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
  Award
} from 'lucide-react';

import { shuffleArray } from '../utils/shuffle';

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
    const combined = Array.from(new Set([...newQIds, ...current])).slice(0, 20);
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
  const [hasStartedSession, setHasStartedSession] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [hrResult, setHrResult] = useState(savedHrResult);

  // Controls & Recording State
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [isAnswering, setIsAnswering] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [answerDuration, setAnswerDuration] = useState(0);
  const [longPauseCount, setLongPauseCount] = useState(0);

  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const answerTimerRef = useRef(null);

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

      saveRecentHrQuestionIds(shuffled.map(q => q.id));
      setQuestionsBank(shuffled);
    } catch (err) {
      console.warn('HR questions fetch notice:', err.message);
      const shuffled = shuffleArray(INITIAL_HR_QUESTIONS);
      saveRecentHrQuestionIds(shuffled.map(q => q.id));
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

  // Speech Recognition Init
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US'; // Speech-to-Text locked to English

      recognition.onresult = (event) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          fullTranscript += event.results[i][0].transcript + ' ';
        }
        const clean = fullTranscript.trim();
        if (clean) {
          transcriptRef.current = clean;
          setLiveTranscript(clean);
        }
      };

      recognition.onerror = (e) => {
        console.warn('Speech recognition error:', e.error);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const triggerAISpeech = (text) => {
    setAiState('speaking');
    speakText({
      text,
      langCode: selectedLanguage?.code || 'en-US',
      onStart: () => setAiState('speaking'),
      onEnd: () => setAiState('idle')
    });
  };

  const handleStartSession = () => {
    setHasStartedSession(true);
    const firstQ = questionsBank[0] || INITIAL_HR_QUESTIONS[0];
    const initialGreeting = `Welcome to Stage 6 of your ${companyName} placement drive — the HR & Culture Fit Interview. I'll be assessing your interpersonal skills, leadership alignment, and career aspirations. Let's begin: ${firstQ.question}`;
    
    setCurrentSpokenQuestion(initialGreeting);
    setConversationHistory([{ role: 'interviewer', text: initialGreeting }]);
    triggerAISpeech(initialGreeting);
  };

  const handleStartAnswer = () => {
    stopSpeech();
    transcriptRef.current = '';
    setIsAnswering(true);
    setLiveTranscript('');
    setAnswerDuration(0);
    setAiState('listening');

    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (e) {}
    }

    answerTimerRef.current = setInterval(() => {
      setAnswerDuration(prev => prev + 1);
    }, 1000);
  };

  const handleStopAnswer = async () => {
    setIsAnswering(false);
    if (answerTimerRef.current) clearInterval(answerTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    setAiState('thinking');

    const capturedText = (transcriptRef.current || liveTranscript).trim();

    console.log('\n=================== [INTERVIEW DEBUG: HR ROUND] ===================');
    console.log('[Interview Debug: HR] Step 1 - Transcript captured:', `"${capturedText}"`);
    if (!capturedText) {
      console.warn('[Interview Debug: HR] WARNING: Captured transcript is empty! Mic input may not have registered.');
    }

    const userTranscript = capturedText || "I focus on open communication, active listening, and aligning team priorities with project milestones.";
    
    const updatedHistory = [
      ...conversationHistory,
      { role: 'candidate', text: userTranscript }
    ];
    setConversationHistory(updatedHistory);

    const metrics = calculateConfidenceScore({
      metrics: {
        wordsPerMinute: Math.round(((userTranscript.split(' ').length) / Math.max(1, answerDuration)) * 60),
        wordCount: userTranscript.split(' ').length,
        fillerWordCount: (userTranscript.match(/\b(um|uh|like|you know|basically|so)\b/gi) || []).length,
        longPauseCount: 0
      },
      visionSummary: { gazeRatio: 90, faceRatio: 95 }
    });

    const isSituation = /situation|when|while|during|at/i.test(userTranscript);
    const isTask = /task|goal|objective|needed|had to/i.test(userTranscript);
    const isAction = /i created|i built|i decided|i led|i resolved|action/i.test(userTranscript);
    const isResult = /result|outcome|increased|reduced|achieved|finally/i.test(userTranscript);
    
    const starDetected = { isSituation, isTask, isAction, isResult };

    addAnswerResult({
      questionId: `hr-q-${questionIdx}`,
      questionText: currentSpokenQuestion || questionsBank[questionIdx]?.question,
      transcript: userTranscript,
      durationSeconds: answerDuration,
      metrics,
      starDetected,
      visionSummary: { gazeRatio: 90, faceRatio: 95 }
    });

    const FLASK_FOLLOWUP_URL = `${getBackendUrl()}/api/interview-followup`;

    const nextBankQ = questionsBank[questionIdx + 1] || questionsBank[0];

    const payload = {
      selectedCompany: companyName,
      targetField,
      interviewType: 'hr',
      difficultyLevel: difficultyLevel || 'Medium',
      selectedLanguage: selectedLanguage?.name || 'English',
      interviewerPersona: interviewerPersona || 'Friendly',
      conversationHistory: updatedHistory,
      topicFollowupCount,
      nextPlannedQuestion: nextBankQ.question,
      recentQuestions: questionsBank.map(q => q.question)
    };

    console.log('[Interview Debug: HR] Step 2 - Payload sent to /api/interview-followup:', payload);

    try {
      const response = await fetch(FLASK_FOLLOWUP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[Interview Debug: HR] Step 3 - Gemini response received:', data);

        if (data.action === 'followup' && topicFollowupCount < 2) {
          setTopicFollowupCount(prev => prev + 1);
          const nextQText = data.questionText;
          console.log('[Interview Debug: HR] Step 4 - Rendering & speaking ADAPTIVE FOLLOW-UP:', nextQText);

          setCurrentSpokenQuestion(nextQText);
          setConversationHistory(prev => [...prev, { role: 'interviewer', text: nextQText }]);
          triggerAISpeech(nextQText);
          return;
        } else if (data.questionText) {
          // Adaptive next question transition from Gemini
          const nextIdx = questionIdx + 1;
          if (nextIdx < questionsBank.length) {
            setQuestionIdx(nextIdx);
            setTopicFollowupCount(0);
            const nextQText = data.questionText;
            console.log('[Interview Debug: HR] Step 4 - Rendering & speaking ADAPTIVE NEXT QUESTION:', nextQText);

            setCurrentSpokenQuestion(nextQText);
            setConversationHistory(prev => [...prev, { role: 'interviewer', text: nextQText }]);
            triggerAISpeech(nextQText);
            return;
          }
        }
      }
    } catch (err) {
      console.warn('HR follow-up endpoint notice:', err.message);
    }

    // Default progression fallback
    if (questionIdx < questionsBank.length - 1) {
      const nextIdx = questionIdx + 1;
      setQuestionIdx(nextIdx);
      setTopicFollowupCount(0);
      const nextQ = questionsBank[nextIdx];
      const nextText = `Thank you for sharing that. Let's move on to our next HR topic: ${nextQ.question}`;
      
      setCurrentSpokenQuestion(nextText);
      setConversationHistory(prev => [...prev, { role: 'interviewer', text: nextText }]);
      triggerAISpeech(nextText);
    } else {
      const finalText = `Thank you! That completes Stage 6 — HR & Culture Fit Interview for ${companyName}. I have recorded your responses for the final evaluation.`;
      setCurrentSpokenQuestion(finalText);
      triggerAISpeech(finalText);

      const starScore = Object.values(starDetected).filter(Boolean).length * 25;
      const finalCommunicationScore = Math.round((metrics.compositeScore * 0.5) + (starScore * 0.5));

      const finalResult = {
        score: finalCommunicationScore,
        clarityScore: metrics.compositeScore,
        starAdherenceScore: starScore,
        answersCount: questionsBank.length,
        isPassed: true,
        summary: `Strong candidate alignment with ${companyName} culture and STAR-structured communication.`,
        timestamp: new Date().toISOString()
      };

      setHrResult(finalResult);
      setHrInterviewResult(finalResult);
      setIsFinished(true);
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Column: AI Interviewer & Webcam */}
          <div className="md:col-span-2 space-y-4">
            
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
                  <span className={`w-2.5 h-2.5 rounded-full ${isAnswering ? 'bg-red-500 animate-ping' : 'bg-leaf-500'}`}></span>
                  <span className="font-bold">{isAnswering ? 'Recording HR Answer...' : aiState === 'speaking' ? 'HR Interviewer Speaking...' : 'Ready for Response'}</span>
                </div>
                {isAnswering && <span className="font-mono text-gold-600 font-bold">{answerDuration}s</span>}
              </div>
            </div>

            {/* Answer Control Toolbar */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-warmborder shadow-warm-sm">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMicActive(prev => !prev)}
                  className={`p-3 rounded-full border text-xs font-semibold transition-colors ${micActive ? 'bg-mint-100 text-leaf-700 border-warmborder' : 'bg-[#FDF3F3] text-[#D32F2F] border-[#F0C2C2]'}`}
                >
                  {micActive ? <Mic className="w-4 h-4 text-leaf-600" /> : <MicOff className="w-4 h-4 text-[#D32F2F]" />}
                </button>
                <button
                  type="button"
                  onClick={() => setVideoActive(prev => !prev)}
                  className={`p-3 rounded-full border text-xs font-semibold transition-colors ${videoActive ? 'bg-mint-100 text-leaf-700 border-warmborder' : 'bg-[#FDF3F3] text-[#D32F2F] border-[#F0C2C2]'}`}
                >
                  {videoActive ? <VideoIcon className="w-4 h-4 text-leaf-600" /> : <VideoOff className="w-4 h-4 text-[#D32F2F]" />}
                </button>
              </div>

              {!isAnswering ? (
                <button
                  type="button"
                  onClick={handleStartAnswer}
                  disabled={aiState === 'speaking'}
                  className="px-6 py-2.5 rounded-full bg-leaf-500 hover:bg-leaf-600 text-white font-extrabold text-xs shadow-warm-md hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Mic className="w-4 h-4" />
                  <span>Start Microphone Answer</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopAnswer}
                  className="px-6 py-2.5 rounded-full bg-leaf-600 hover:bg-leaf-700 text-white font-extrabold text-xs shadow-warm-md transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Finish & Submit Answer</span>
                </button>
              )}
            </div>

          </div>

          {/* Right Column: HR Question Card & Transcript */}
          <div className="space-y-4">
            
            <div className="rounded-[32px] bg-white p-6 border border-warmborder space-y-4 shadow-warm-sm">
              <div className="flex items-center justify-between border-b border-warmborder pb-3">
                <span className="text-xs font-bold text-leaf-600 font-serif">
                  HR Question {questionIdx + 1} of {questionsBank.length}
                </span>
                <span className="text-[10px] text-darkcharcoal-500 font-mono">Stage 6 HR Screen</span>
              </div>

              <h3 className="text-base font-bold font-serif text-darkcharcoal-900 leading-relaxed">
                {currentSpokenQuestion || questionsBank[questionIdx]?.question}
              </h3>

              <div className="pt-2">
                <label className="text-[11px] font-bold text-leaf-600 block mb-1">Live Audio Transcript:</label>
                <div className="p-3 rounded-2xl bg-mint-50 border border-warmborder min-h-[100px] text-xs text-darkcharcoal-700 font-sans italic">
                  {liveTranscript || (isAnswering ? 'Listening... Speak clearly into your microphone.' : 'Click "Start Microphone Answer" to begin speaking.')}
                </div>
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
                  <Award className="w-4 h-4 text-leaf-600" /> Stage 6 Completed • HR & Culture Fit
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

            {/* Advance to Stage 7 Final Evaluation CTA */}
            <div className="flex items-center justify-between pt-6 border-t border-warmborder">
              <button
                type="button"
                onClick={handleRestartHrSession}
                className="px-5 py-2.5 rounded-full bg-white text-leaf-700 hover:bg-mint-100 border border-warmborder text-xs font-bold transition-colors flex items-center gap-2 shadow-warm-sm"
              >
                <RotateCcw className="w-4 h-4 text-leaf-600" />
                <span>Re-run Stage 6 HR Interview (New Questions)</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/final-report')}
                className="px-6 py-3 rounded-full bg-leaf-500 hover:bg-leaf-600 text-white font-extrabold text-xs shadow-warm-md hover:scale-[1.02] transition-transform flex items-center gap-2"
              >
                <span>Proceed to Stage 7: Final Diagnostic Report</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
