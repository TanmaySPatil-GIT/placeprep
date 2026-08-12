import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressStepper from '../components/ProgressStepper';
import { usePrep } from '../context/PrepContext';
import { useAuth } from '../context/AuthContext';
import { speakText, stopSpeech, isTTSSupported } from '../services/speechSynthesizer';
import { 
  Building2, 
  DollarSign, 
  Sparkles, 
  Award, 
  Volume2, 
  VolumeX, 
  Mic, 
  Square, 
  Send, 
  ArrowRight,
  TrendingUp,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Bot,
  Brain,
  Loader2
} from 'lucide-react';

export default function NegotiationRoundPage() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { 
    selectedCompany, 
    setRoundIndex, 
    setNegotiationResult, 
    negotiationResult: savedResult,
    experienceLevel,
    experienceYears,
    difficultyLevel,
    selectedLanguage 
  } = usePrep();

  const companyName = selectedCompany?.name || 'Google';
  const targetField = userProfile?.targetField || 'Software Development';

  // Initial Mock Offer Details
  const initialOffer = experienceLevel === 'Experienced' ? {
    base: '₹28.5 LPA',
    signingBonus: '₹4.0 LPA',
    equity: '$55,000 RSUs / 4 yrs',
    remoteDays: '2 Days Remote / WFH'
  } : {
    base: '₹18.5 LPA',
    signingBonus: '₹2.0 LPA',
    equity: '$35,000 RSUs / 4 yrs',
    remoteDays: '2 Days Remote / WFH'
  };

  const [offerDetails, setOfferDetails] = useState(initialOffer);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentSpokenText, setCurrentSpokenText] = useState('');
  const [aiState, setAiState] = useState('idle'); // 'speaking' | 'listening' | 'thinking' | 'idle'
  const [ttsMuted, setTtsMuted] = useState(false);

  // Speech Recognition & Inputs
  const [isAnswering, setIsAnswering] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [manualText, setManualText] = useState('');
  const [evaluation, setEvaluation] = useState(null);

  const recognitionRef = useRef(null);

  // Web Speech API STT Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US'; // Speech-to-Text locked to English

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript.trim()) {
          setLiveTranscript(prev => (prev + ' ' + finalTranscript).trim());
        }
      };

      recognition.onerror = (e) => {
        console.warn('Speech recognition notice:', e.error);
      };

      recognitionRef.current = recognition;
    }
  }, [selectedLanguage]);

  const triggerAISpeech = (text) => {
    if (ttsMuted || !text) {
      setAiState('idle');
      return;
    }
    setAiState('speaking');
    speakText({
      text,
      langCode: selectedLanguage?.code || 'en-US',
      pitch: 1.1,
      onStart: () => setAiState('speaking'),
      onEnd: () => setAiState('idle'),
      onError: () => setAiState('idle')
    });
  };

  const handleStartSession = () => {
    setHasStarted(true);
    const openingOfferGreeting = `Congratulations! On behalf of ${companyName}, we are thrilled to extend an official job offer for the ${targetField} position! Our compensation package is ${offerDetails.base} base salary, ${offerDetails.signingBonus} joining bonus, plus ${offerDetails.equity}. How do you feel about this offer?`;
    
    setCurrentSpokenText(openingOfferGreeting);
    setConversationHistory([{ role: 'interviewer', text: openingOfferGreeting }]);
    triggerAISpeech(openingOfferGreeting);
  };

  const handleStartAnswer = () => {
    stopSpeech();
    setIsAnswering(true);
    setLiveTranscript('');
    setAiState('listening');
    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (e) {}
    }
  };

  const handleStopAndSubmit = async (overrideInput) => {
    setIsAnswering(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    const userInput = overrideInput || liveTranscript.trim() || manualText.trim() || 'I would like to discuss a small adjustment to the base salary and signing bonus based on market benchmarks.';
    setManualText('');
    setLiveTranscript('');

    setAiState('thinking');

    const updatedHistory = [...conversationHistory, { role: 'candidate', text: userInput }];
    setConversationHistory(updatedHistory);

    const nextExchangeCount = exchangeCount + 1;
    setExchangeCount(nextExchangeCount);

    const FLASK_NEGOTIATION_URL = import.meta.env.VITE_FLASK_API_URL
      ? `${import.meta.env.VITE_FLASK_API_URL}/api/negotiation-response`
      : 'http://localhost:5000/api/negotiation-response';

    try {
      const response = await fetch(FLASK_NEGOTIATION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedCompany: companyName,
          targetField,
          experienceLevel,
          difficultyLevel,
          exchangeCount: nextExchangeCount,
          offerDetails,
          conversationHistory: updatedHistory,
          selectedLanguage: selectedLanguage?.name || 'English'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const hrReply = data.hrResponse || "Thank you for sharing your thoughts. We can offer a +₹1.0 LPA signing bonus boost.";
        
        setCurrentSpokenText(hrReply);
        setConversationHistory([...updatedHistory, { role: 'interviewer', text: hrReply }]);

        if (data.updatedOffer) {
          setOfferDetails(prev => ({ ...prev, ...data.updatedOffer }));
        }

        if (data.isComplete || nextExchangeCount >= 3) {
          setIsComplete(true);
          const evalData = data.evaluation || {
            score: 85,
            anchoringQuality: 'Strong initial anchor referencing industry standards',
            justificationScore: 'Well-justified with project scope & competing offer',
            professionalism: 'Polite, professional, and collaborative tone',
            overAskingRisk: 'Low Risk',
            summary: 'Great negotiation performance! Secured an upgraded signing bonus while preserving recruiter trust.'
          };

          setEvaluation(evalData);
          setNegotiationResult({
            initialOffer,
            finalOffer: data.updatedOffer || offerDetails,
            evaluation: evalData,
            history: [...updatedHistory, { role: 'interviewer', text: hrReply }]
          });
        }

        triggerAISpeech(hrReply);
      }
    } catch (err) {
      console.warn('Negotiation endpoint notice:', err);
      const fallbackReply = `Thank you for bringing this up. We value your skills and can adjust the signing bonus to ₹3.0 LPA to help welcome you to ${companyName}.`;
      setCurrentSpokenText(fallbackReply);
      setConversationHistory([...updatedHistory, { role: 'interviewer', text: fallbackReply }]);
      triggerAISpeech(fallbackReply);
      
      if (nextExchangeCount >= 3) {
        setIsComplete(true);
      }
    } finally {
      if (aiState !== 'speaking') setAiState('idle');
    }
  };

  const handleFinishAndNavigateReport = () => {
    stopSpeech();
    setRoundIndex(6);
    navigate('/final-report');
  };

  return (
    <div className="space-y-4 py-2">
      
      {/* Reusable Progress Stepper */}
      <ProgressStepper />

      {/* Main Container */}
      <div className="rounded-3xl bg-forest-800/90 border border-forest-600/40 p-6 space-y-6 shadow-earthy backdrop-blur-md">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-forest-600/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-accent-gold/20 border border-accent-gold/40 text-accent-gold">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif text-earth-cream">Offer Negotiation Practice Stage</h1>
              <p className="text-xs text-earth-cream/70">Practice real-world compensation discussions with {companyName} Talent Acquisition</p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-earth-tan/20 text-accent-gold border border-earth-tan/30">
            Exchange {exchangeCount} / 3 Max
          </span>
        </div>

        {/* Top Active Offer Banner */}
        <div className="p-5 rounded-2xl bg-forest-900/90 border border-forest-600/40 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold font-serif text-accent-gold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Current Recruiter Job Offer Card</span>
            </h2>
            <span className="text-[10px] text-earth-cream/60">{companyName} {targetField} ({experienceLevel})</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-forest-800 border border-forest-600/30">
              <span className="text-[10px] text-earth-cream/60 block">Base Salary</span>
              <strong className="text-sm text-sage-400 font-mono">{offerDetails.base}</strong>
            </div>

            <div className="p-3 rounded-xl bg-forest-800 border border-forest-600/30">
              <span className="text-[10px] text-earth-cream/60 block">Signing Bonus</span>
              <strong className="text-sm text-accent-gold font-mono">{offerDetails.signingBonus}</strong>
            </div>

            <div className="p-3 rounded-xl bg-forest-800 border border-forest-600/30">
              <span className="text-[10px] text-earth-cream/60 block">Equity / RSUs</span>
              <strong className="text-sm text-earth-cream font-mono">{offerDetails.equity}</strong>
            </div>

            <div className="p-3 rounded-xl bg-forest-800 border border-forest-600/30">
              <span className="text-[10px] text-earth-cream/60 block">Flexibility</span>
              <strong className="text-sm text-earth-tan font-mono">{offerDetails.remoteDays}</strong>
            </div>
          </div>
        </div>

        {/* Start Button Overlay if Not Started */}
        {!hasStarted ? (
          <div className="py-10 text-center space-y-4">
            <p className="text-sm text-earth-cream/80 max-w-lg mx-mx-auto">
              Ready to test your salary negotiation skills? The hiring manager will present the initial job offer. Practice anchoring, citing market standards, and asking for bonus/equity adjustments.
            </p>
            <button
              onClick={handleStartSession}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-accent-gold to-earth-tan text-forest-900 font-extrabold text-sm hover:brightness-110 shadow-glow-gold transition-all flex items-center gap-2 mx-auto"
            >
              <DollarSign className="w-5 h-5" />
              <span>Begin Negotiation Session</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left AI Presence & Audio Captions (5 cols) */}
            <div className="lg:col-span-5 rounded-2xl bg-forest-900/80 border border-forest-600/30 p-5 space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-forest-600/30 pb-2">
                <span className="text-xs font-bold text-earth-cream flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-accent-gold" />
                  <span>HR Lead Recruiter</span>
                </span>

                <button
                  onClick={() => {
                    setTtsMuted(!ttsMuted);
                    if (!ttsMuted) stopSpeech();
                  }}
                  className={`p-2 rounded-full text-xs border ${
                    ttsMuted ? 'bg-earth-terracotta/20 text-earth-terracotta border-earth-terracotta/40' : 'bg-forest-800 text-accent-gold border-forest-600/40'
                  }`}
                >
                  {ttsMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* AI Visualizer */}
              <div className="py-4 flex flex-col items-center justify-center text-center space-y-3">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                  aiState === 'speaking' ? 'bg-gradient-to-r from-accent-gold/40 to-sage-400/40 animate-ping ring-4 ring-accent-gold/50'
                  : aiState === 'listening' ? 'bg-earth-terracotta/30 animate-pulse ring-4 ring-earth-terracotta/40'
                  : aiState === 'thinking' ? 'bg-forest-600/50 animate-spin border-2 border-dashed border-accent-gold'
                  : 'bg-forest-800 border border-forest-600/40'
                }`}>
                  <div className="w-16 h-16 rounded-full bg-forest-900 flex items-center justify-center">
                    {aiState === 'thinking' ? <Loader2 className="w-7 h-7 text-accent-gold animate-spin" /> : <Bot className="w-7 h-7 text-accent-gold" />}
                  </div>
                </div>

                <span className="text-xs font-bold text-earth-cream">
                  {aiState === 'speaking' ? 'HR Recruiter speaking aloud...' : aiState === 'listening' ? 'Listening to your counter-offer...' : aiState === 'thinking' ? 'Evaluating budget band & counter-offer...' : 'Recruiter Ready'}
                </span>
              </div>

              {/* Spoken Caption Card */}
              <div className="p-3.5 rounded-xl bg-forest-800 border border-forest-600/30 text-xs text-earth-cream/90 italic leading-relaxed">
                "{currentSpokenText}"
              </div>
            </div>

            {/* Right Candidate Spoken / Text Input Panel (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-4 rounded-2xl bg-forest-900/80 border border-forest-600/30 space-y-3">
                <h3 className="text-xs font-bold text-accent-gold font-serif flex items-center gap-1.5">
                  <Mic className="w-4 h-4" />
                  <span>State Your Counter-Offer / Negotiation Response</span>
                </h3>

                {/* Voice Record Button Controls */}
                <div className="flex items-center gap-3">
                  {!isAnswering ? (
                    <button
                      onClick={handleStartAnswer}
                      disabled={isComplete}
                      className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-earth-terracotta to-earth-tan text-white font-extrabold text-xs hover:brightness-110 shadow-earthy transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Mic className="w-4 h-4 animate-bounce" />
                      <span>Hold Microphone & Speak Counter-Offer</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStopAndSubmit()}
                      className="flex-1 py-3 px-4 rounded-xl bg-earth-terracotta text-white font-extrabold text-xs hover:bg-earth-terracotta/90 shadow-earthy transition-all flex items-center justify-center gap-2"
                    >
                      <Square className="w-4 h-4 text-white fill-white" />
                      <span>Stop & Send Spoken Response</span>
                    </button>
                  )}
                </div>

                {liveTranscript && (
                  <div className="p-3 rounded-xl bg-forest-800 border border-sage-500/30 text-xs text-sage-300">
                    <strong className="block text-[10px] text-accent-gold">Live Speech Recognition:</strong>
                    "{liveTranscript}"
                  </div>
                )}

                {/* Manual Text Fallback Input */}
                <div className="space-y-2 pt-2 border-t border-forest-600/30">
                  <label className="text-[11px] font-semibold text-earth-cream/70">Or Type Your Counter-Offer:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      disabled={isComplete}
                      placeholder="e.g., Based on market benchmarks for SDE-2, I was hoping we could meet at ₹20 LPA base or add a joining bonus."
                      className="flex-1 px-3 py-2 rounded-xl bg-forest-800 text-xs text-earth-cream border border-forest-600/40 focus:outline-none focus:border-accent-gold disabled:opacity-50"
                    />
                    <button
                      onClick={() => handleStopAndSubmit(manualText)}
                      disabled={!manualText.trim() || isComplete}
                      className="px-4 py-2 rounded-xl bg-accent-gold text-forest-900 font-extrabold text-xs hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Complete Wrap Up Card */}
              {isComplete && (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-sage-500/20 to-accent-gold/20 border border-accent-gold/40 space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-accent-gold" />
                    <h4 className="text-sm font-bold font-serif text-earth-cream">Negotiation Session Complete!</h4>
                  </div>

                  {evaluation && (
                    <div className="space-y-2 text-xs text-earth-cream/90">
                      <p><strong>Negotiation Score:</strong> <span className="text-accent-gold font-bold font-mono">{evaluation.score}/100</span></p>
                      <p><strong>Recruiter Summary:</strong> {evaluation.summary}</p>
                    </div>
                  )}

                  <button
                    onClick={handleFinishAndNavigateReport}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-gold to-earth-tan text-forest-900 font-extrabold text-xs hover:brightness-110 shadow-glow-gold transition-all flex items-center justify-center gap-2"
                  >
                    <span>View Final Diagnostic Report</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
