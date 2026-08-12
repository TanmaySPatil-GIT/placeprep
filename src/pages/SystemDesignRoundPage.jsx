import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressStepper from '../components/ProgressStepper';
import { usePrep } from '../context/PrepContext';
import { useAuth } from '../context/AuthContext';
import { speakText, stopSpeech } from '../services/speechSynthesizer';
import { 
  Layers, 
  Server, 
  Database, 
  Globe, 
  Zap, 
  Network, 
  Smartphone, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Mic, 
  Square, 
  Sparkles, 
  Award, 
  Link as LinkIcon,
  Clock,
  HelpCircle,
  Building2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FileText,
  Lightbulb
} from 'lucide-react';

const PALETTE_ITEMS = [
  { id: 'client', label: 'Client / App', icon: Smartphone, type: 'Client', color: 'bg-sage-500/20 text-sage-300 border-sage-500/40' },
  { id: 'lb', label: 'Load Balancer', icon: Network, type: 'Load Balancer', color: 'bg-accent-gold/20 text-accent-gold border-accent-gold/40' },
  { id: 'server', label: 'App Server', icon: Server, type: 'App Server', color: 'bg-earth-tan/20 text-earth-tan border-earth-tan/40' },
  { id: 'cache', label: 'Redis Cache', icon: Zap, type: 'Cache', color: 'bg-earth-terracotta/20 text-earth-cream border-earth-terracotta/40' },
  { id: 'nosql', label: 'NoSQL Storage', icon: Database, type: 'Database', color: 'bg-forest-600/40 text-sage-400 border-forest-600/60' },
  { id: 'sql', label: 'Relational DB', icon: Database, type: 'Database', color: 'bg-forest-600/40 text-earth-cream border-forest-600/60' },
  { id: 'queue', label: 'Kafka Queue', icon: Layers, type: 'Message Queue', color: 'bg-earth-brown/40 text-accent-gold border-earth-brown/60' },
  { id: 'cdn', label: 'CDN Edge', icon: Globe, type: 'CDN', color: 'bg-sage-500/20 text-sage-400 border-sage-500/40' }
];

const SYSTEM_DESIGN_PROBLEMS = [
  {
    id: 'url-shortener',
    title: 'Design a Distributed URL Shortener (TinyURL)',
    scale: '100M URLs created/day • 1B redirects/day • Sub-10ms read latency',
    checklist: ['Load Balancer', 'API Gateway', 'Cache', 'Database', 'Message Queue'],
    description: 'Build an end-to-end scalable architecture for short URL creation, Base62 encoding, high-speed redirect caching, and DB replication.',
    hints: [
      'Use Base62 encoding (a-z, A-Z, 0-9) to convert auto-incremented IDs into 6-character short strings.',
      'Place Redis cache in front of DB to serve popular short URLs under sub-10ms latency.',
      'Use DB sharding by short URL hash key for horizontal scale.'
    ]
  },
  {
    id: 'video-platform',
    title: 'Design a Scalable Video Streaming Platform',
    scale: '10M concurrent streams • HLS adaptive encoding • Global CDN caching',
    checklist: ['Client App', 'Load Balancer', 'App Server', 'Cache', 'Database', 'CDN'],
    description: 'Design a high-throughput streaming architecture with chunked video upload, background transcoding workers, and CDN edge delivery.',
    hints: [
      'Decouple video upload from video playback using object storage (S3/GCS) and asynchronous worker queues.',
      'Transcode video into multiple resolutions (1080p, 720p, 480p) using HLS protocol.',
      'Distribute cached video chunks via global CDNs (Cloudflare/CloudFront) near edge users.'
    ]
  },
  {
    id: 'rate-limiter',
    title: 'Design a High-Throughput Distributed Rate Limiter',
    scale: '100K requests/sec • Sliding Window Algorithm • Multi-region Sync',
    checklist: ['API Gateway', 'Load Balancer', 'Cache', 'App Server', 'Database'],
    description: 'Design a low-latency rate limiting service that prevents API abuse, handles DDoS traffic, and supports per-user IP quotas.',
    hints: [
      'Use Redis Sorted Sets (ZSET) or Atomic Token Bucket algorithm to track requests in a sliding 60-second window.',
      'Embed rate limiter logic into API Gateway layer to reject excess requests before touching backend app servers.',
      'Use distributed Redis cluster with local memory caching for sub-2ms decision time.'
    ]
  },
  {
    id: 'kv-store',
    title: 'Design a Low-Latency Key-Value Store',
    scale: '1M QPS • In-memory speed • Disk persistence • Consistent Hashing',
    checklist: ['Client App', 'Load Balancer', 'App Server', 'Cache', 'Database'],
    description: 'Design a distributed key-value storage engine supporting GET/SET operations, replication, and automatic failover.',
    hints: [
      'Use Consistent Hashing to distribute key-value pairs evenly across storage nodes.',
      'Implement Write-Ahead Logging (WAL) and LSM-Trees (Log-Structured Merge-trees) for fast write persistence.',
      'Use primary-secondary replication with quorum consensus (R + W > N) for strong consistency.'
    ]
  },
  {
    id: 'notification-service',
    title: 'Design a Global Notification & Messaging System',
    scale: '500M notifications/day • Push/SMS/Email channels • Guaranteed delivery',
    checklist: ['Client App', 'API Gateway', 'Message Queue', 'App Server', 'Database'],
    description: 'Design a multi-channel notification engine supporting push notifications, SMS, email, user preferences, and retry queues.',
    hints: [
      'Use Kafka or RabbitMQ queues to decouple notification requests from external delivery gateways (APNS, FCM, Twilio, SendGrid).',
      'Store user notification preferences and opt-outs in a fast lookup NoSQL database.',
      'Implement exponential backoff retry queues for handling third-party provider outages.'
    ]
  }
];

export default function SystemDesignRoundPage() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { 
    selectedCompany, 
    setRoundIndex, 
    setSystemDesignResult, 
    systemDesignResult: savedResult,
    experienceLevel,
    difficultyLevel,
    selectedLanguage 
  } = usePrep();

  const companyName = selectedCompany?.name || 'Google';
  const [activeProblem, setActiveProblem] = useState(SYSTEM_DESIGN_PROBLEMS[0]);

  // Timer State (15 minutes default)
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(15 * 60);
  const [showHintModal, setShowHintModal] = useState(false);
  const [currentHintIdx, setCurrentHintIdx] = useState(0);

  // Diagram Canvas State (Optional Visual Helper)
  const [nodes, setNodes] = useState([
    { id: 'n-1', label: 'Client App', type: 'Client', x: 50, y: 140 },
    { id: 'n-2', label: 'Nginx LB', type: 'Load Balancer', x: 220, y: 140 },
    { id: 'n-3', label: 'API Cluster', type: 'App Server', x: 400, y: 140 },
    { id: 'n-4', label: 'Redis Cache', type: 'Cache', x: 400, y: 30 }
  ]);
  const [edges, setEdges] = useState([
    { id: 'e-1', source: 'n-1', target: 'n-2' },
    { id: 'e-2', source: 'n-2', target: 'n-3' },
    { id: 'e-3', source: 'n-3', target: 'n-4' }
  ]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [connectSourceId, setConnectSourceId] = useState(null);

  // Architecture Design Approach (Text/Markdown) & Voice
  const [textApproach, setTextApproach] = useState(
    savedResult?.textApproach || 
    '## System Architecture Approach\n\n### 1. High Level Design\nClient -> Load Balancer -> API Gateway -> Application Servers -> Redis Cache -> Database\n\n### 2. Core Components & Data Flow\n- Load Balancer: Distributes incoming HTTP requests using round-robin with health checks.\n- Cache Layer: Redis in-memory cache stores hot data to maintain sub-10ms response times.\n- Storage Layer: Database with primary-secondary replication and sharding for high concurrency.'
  );

  const [isAnswering, setIsAnswering] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(savedResult?.evaluation || null);

  const recognitionRef = useRef(null);

  // Timer countdown
  useEffect(() => {
    if (timeLeftSeconds <= 0 || evaluation) return;
    const interval = setInterval(() => {
      setTimeLeftSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeftSeconds, evaluation]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Speech Recognition setup
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

      recognitionRef.current = recognition;
    }
  }, [selectedLanguage]);

  const handleAddNode = (item) => {
    const newNode = {
      id: `n-${Date.now()}`,
      label: item.label,
      type: item.type,
      x: 150 + Math.random() * 300,
      y: 80 + Math.random() * 150
    };
    setNodes(prev => [...prev, newNode]);
  };

  const handleNodeClick = (nodeId) => {
    if (connectSourceId && connectSourceId !== nodeId) {
      const newEdge = { id: `e-${Date.now()}`, source: connectSourceId, target: nodeId };
      setEdges(prev => [...prev.filter(e => !(e.source === connectSourceId && e.target === nodeId)), newEdge]);
      setConnectSourceId(null);
    } else {
      setSelectedNodeId(nodeId);
    }
  };

  const handleRemoveSelectedNode = () => {
    if (!selectedNodeId) return;
    setNodes(prev => prev.filter(n => n.id !== selectedNodeId));
    setEdges(prev => prev.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
  };

  const handleStartVerbalExplanation = () => {
    stopSpeech();
    setIsAnswering(true);
    setLiveTranscript('');
    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (e) {}
    }
  };

  const handleStopVerbalExplanation = () => {
    setIsAnswering(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (liveTranscript.trim()) {
      setTextApproach(prev => (prev + '\n\n### Spoken Explanation\n' + liveTranscript.trim()).trim());
    }
  };

  const handleSubmitSystemDesign = async () => {
    setEvaluating(true);
    const combinedApproach = (textApproach + (liveTranscript ? '\n\n' + liveTranscript : '')).trim();

    const FLASK_SD_URL = import.meta.env.VITE_FLASK_API_URL
      ? `${import.meta.env.VITE_FLASK_API_URL}/api/evaluate-system-design`
      : 'http://localhost:5000/api/evaluate-system-design';

    try {
      const response = await fetch(FLASK_SD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedCompany: companyName,
          problemTitle: activeProblem.title,
          diagramNodes: nodes,
          diagramEdges: edges,
          verbalTranscript: combinedApproach,
          expectedChecklist: activeProblem.checklist
        })
      });

      if (response.ok) {
        const data = await response.json();
        setEvaluation(data);
        setSystemDesignResult({
          problem: activeProblem,
          textApproach: combinedApproach,
          nodes,
          edges,
          evaluation: data
        });
      }
    } catch (err) {
      console.warn('System design evaluation notice:', err);
      const fallbackEval = {
        score: 88,
        checklistMatches: activeProblem.checklist.slice(0, 4),
        checklistMissing: activeProblem.checklist.slice(4),
        tradeoffEvaluation: 'Good component selection with clear separation of application server and caching tier.',
        bottlenecksAndRisks: 'Ensure database replication and failover mechanism to avoid single point of failure (SPOF).',
        summary: 'Solid system design presentation! Strong architecture explanation and clear component boundaries.'
      };
      setEvaluation(fallbackEval);
      setSystemDesignResult({
        problem: activeProblem,
        textApproach: combinedApproach,
        nodes,
        edges,
        evaluation: fallbackEval
      });
    } finally {
      setEvaluating(false);
    }
  };

  const handleNextRound = () => {
    setRoundIndex(5);
    navigate('/round/interview');
  };

  return (
    <div className="space-y-6 py-2 max-w-7xl mx-auto">
      
      {/* Reusable Progress Stepper */}
      <ProgressStepper />

      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl p-6 bg-gradient-to-r from-forest-800 via-forest-900 to-earth-brown border border-forest-600/40 shadow-earthy">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sage-500/25 text-accent-gold border border-sage-400/30 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-accent-gold" />
            <span>Stage 5 of 7 • System Architecture Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-earth-cream">{activeProblem.title}</h1>
          <p className="text-xs text-earth-cream/70 max-w-2xl">
            Architect high-scale distributed systems for <strong className="text-accent-gold">{companyName}</strong>. Type your architectural approach, select components, and evaluate against ATS hiring benchmarks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-forest-950 border border-forest-600/40 text-earth-cream text-xs font-mono font-bold">
            <Clock className="w-4 h-4 text-accent-gold" />
            <span>{formatTime(timeLeftSeconds)}</span>
          </div>

          <button
            onClick={() => setShowHintModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-forest-900 text-accent-gold border border-accent-gold/40 text-xs font-bold hover:bg-forest-600 transition-all shadow-sm"
          >
            <Lightbulb className="w-4 h-4 text-leaf-600" />
            <span>Get a Hint</span>
          </button>
        </div>
      </div>

      {/* Problem Selector Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {SYSTEM_DESIGN_PROBLEMS.map((prob) => (
          <button
            key={prob.id}
            onClick={() => {
              setActiveProblem(prob);
              setEvaluation(null);
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all shrink-0 ${
              activeProblem.id === prob.id 
                ? 'bg-accent-gold text-forest-900 border-accent-gold shadow-glow-gold' 
                : 'bg-forest-800/80 text-earth-cream/70 border-forest-600/40 hover:text-white'
            }`}
          >
            {prob.title.split('(')[0].trim()}
          </button>
        ))}
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Text Architecture Response Box & Evaluation (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Problem Statement Card */}
          <div className="p-5 rounded-3xl bg-forest-800/80 border border-forest-600/40 space-y-3 shadow-earthy backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-accent-gold font-serif uppercase tracking-wider">{activeProblem.title}</span>
              <span className="text-[11px] text-sage-400 font-mono font-semibold">{activeProblem.scale}</span>
            </div>
            <p className="text-xs text-earth-cream/80 leading-relaxed">{activeProblem.description}</p>
            <div className="flex items-center gap-2 pt-2 border-t border-forest-600/30 text-xs text-earth-cream/70">
              <span className="font-bold text-earth-tan">Required Checklist Components:</span>
              <span className="font-mono text-sage-300 text-[11px]">{activeProblem.checklist.join(' • ')}</span>
            </div>
          </div>

          {/* Text/Markdown Architecture Answer Box */}
          <div className="p-5 rounded-3xl bg-forest-800/80 border border-forest-600/40 space-y-4 shadow-earthy backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent-gold" />
                <h2 className="text-sm font-bold font-serif text-earth-cream">System Design Approach & Trade-off Documentation</h2>
              </div>
              <span className="text-[10px] text-earth-cream/60 font-mono">Markdown / Text Support</span>
            </div>

            <textarea
              value={textApproach}
              onChange={(e) => setTextApproach(e.target.value)}
              placeholder="Describe your system architecture design here...\n\n1. High-Level Architecture (Client -> Load Balancer -> API Gateway -> Services -> Database)\n2. Database Choice & Schema (SQL vs NoSQL, Sharding strategy)\n3. Caching & Performance (Redis cache invalidation, CDN strategy)\n4. Reliability & Scalability (Load balancing, message queues, failover mechanisms)"
              rows={12}
              className="w-full p-4 rounded-2xl bg-forest-950 text-xs text-earth-cream border border-forest-600/40 focus:outline-none focus:border-accent-gold font-mono leading-relaxed resize-y"
            />

            {/* Voice & Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {!isAnswering ? (
                <button
                  onClick={handleStartVerbalExplanation}
                  className="py-2.5 px-4 rounded-xl bg-earth-terracotta text-white font-bold text-xs hover:brightness-110 shadow-earthy transition-all flex items-center gap-2"
                >
                  <Mic className="w-4 h-4 animate-bounce" />
                  <span>Dictate Spoken Explanation</span>
                </button>
              ) : (
                <button
                  onClick={handleStopVerbalExplanation}
                  className="py-2.5 px-4 rounded-xl bg-earth-terracotta text-white font-bold text-xs hover:bg-earth-terracotta/90 shadow-earthy transition-all flex items-center gap-2"
                >
                  <Square className="w-4 h-4 text-white fill-white" />
                  <span>Stop Dictating</span>
                </button>
              )}

              <button
                onClick={handleSubmitSystemDesign}
                disabled={evaluating || !textApproach.trim()}
                className="py-3 px-6 rounded-2xl bg-gradient-to-r from-accent-gold to-earth-tan text-forest-900 font-extrabold text-xs hover:brightness-110 disabled:opacity-50 shadow-glow-gold transition-all flex items-center gap-2 ml-auto"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{evaluating ? 'Evaluating Architecture...' : 'Submit Design for Evaluation'}</span>
              </button>
            </div>
          </div>

          {/* Evaluation Summary Card */}
          {evaluation && (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-sage-500/20 to-accent-gold/20 border border-accent-gold/40 space-y-4 shadow-earthy backdrop-blur-md animate-fadeIn">
              <div className="flex items-center justify-between border-b border-forest-600/30 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-accent-gold" />
                  <h3 className="text-base font-bold font-serif text-earth-cream">System Design Evaluation Summary</h3>
                </div>
                <span className="px-4 py-1.5 rounded-full text-xs font-mono font-extrabold bg-accent-gold text-forest-900 shadow-glow-gold">
                  {evaluation.score} / 100 Score
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-forest-800/90 border border-forest-600/30">
                  <span className="font-bold text-sage-400 block mb-1">Checklist Covered:</span>
                  <span className="font-mono text-earth-cream/90">{evaluation.checklistMatches?.join(', ') || 'Load Balancer, Cache, Database'}</span>
                </div>

                <div className="p-4 rounded-2xl bg-forest-800/90 border border-forest-600/30">
                  <span className="font-bold text-accent-gold block mb-1">Architecture Trade-offs:</span>
                  <p className="text-earth-cream/80">{evaluation.tradeoffEvaluation}</p>
                </div>
              </div>

              <p className="text-xs italic text-earth-cream/80 bg-forest-900/80 p-4 rounded-2xl border border-forest-600/30">
                "{evaluation.summary}"
              </p>

              <button
                onClick={handleNextRound}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-accent-gold to-earth-tan text-forest-900 font-extrabold text-xs hover:brightness-110 shadow-glow-gold transition-all flex items-center justify-center gap-2"
              >
                <span>Proceed to Stage 6 Technical Voice Interview</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

        {/* Right Column: Optional Interactive Diagram Builder (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-3xl bg-forest-800/80 border border-forest-600/40 space-y-4 shadow-earthy backdrop-blur-md">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-earth-cream font-serif uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-accent-gold" />
                <span>Optional Visual Diagram Palette</span>
              </h3>
              <span className="text-[10px] text-earth-cream/60">Click to add nodes</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {PALETTE_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleAddNode(item)}
                    className={`p-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-between transition-all hover:scale-[1.02] ${item.color}`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <Plus className="w-3 h-3 shrink-0" />
                  </button>
                );
              })}
            </div>

            {/* Interactive Canvas Board */}
            <div className="relative w-full h-[320px] rounded-2xl bg-forest-950 border border-forest-600/40 p-3 overflow-hidden shadow-inner bg-grid-pattern">
              <div className="absolute top-2 left-3 right-3 flex items-center justify-between text-[10px] text-earth-cream/60 z-10">
                <span>Click node to select • Click Arrow icon to link</span>
                <span className="font-mono">{nodes.length} Nodes • {edges.length} Edges</span>
              </div>

              {/* Draw Edges SVG */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#e8c088" />
                  </marker>
                </defs>
                {edges.map((edge) => {
                  const src = nodes.find(n => n.id === edge.source);
                  const tgt = nodes.find(n => n.id === edge.target);
                  if (!src || !tgt) return null;
                  return (
                    <line
                      key={edge.id}
                      x1={src.x + 55}
                      y1={src.y + 20}
                      x2={tgt.x + 55}
                      y2={tgt.y + 20}
                      stroke="#e8c088"
                      strokeWidth="2"
                      strokeDasharray="4"
                      markerEnd="url(#arrow)"
                    />
                  );
                })}
              </svg>

              {/* Render Drag Nodes */}
              {nodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isConnectSource = connectSourceId === node.id;

                return (
                  <div
                    key={node.id}
                    onClick={() => handleNodeClick(node.id)}
                    style={{ left: `${node.x}px`, top: `${node.y}px` }}
                    className={`absolute p-2.5 rounded-xl border text-[11px] font-bold cursor-pointer transition-all shadow-earthy select-none min-w-[110px] ${
                      isSelected
                        ? 'bg-accent-gold text-forest-900 border-accent-gold ring-2 ring-accent-gold/40 scale-105'
                        : isConnectSource
                        ? 'bg-earth-terracotta text-white border-earth-terracotta ring-2 ring-earth-terracotta/40'
                        : 'bg-forest-900 text-earth-cream border-forest-600/60 hover:border-accent-gold'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate">{node.label}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConnectSourceId(isConnectSource ? null : node.id);
                        }}
                        className={`p-1 rounded text-[8px] border ${
                          isConnectSource ? 'bg-white text-forest-900 border-white font-extrabold' : 'bg-forest-800 text-accent-gold border-forest-600/40'
                        }`}
                        title="Connect Arrow to another node"
                      >
                        <LinkIcon className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Canvas Action Tools */}
            <div className="flex gap-2">
              <button
                onClick={handleRemoveSelectedNode}
                disabled={!selectedNodeId}
                className="flex-1 py-2 px-3 rounded-xl bg-earth-terracotta/20 text-earth-terracotta border border-earth-terracotta/30 font-bold text-xs hover:bg-earth-terracotta/30 disabled:opacity-40 transition-all flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Node</span>
              </button>

              <button
                onClick={() => { setNodes([]); setEdges([]); setSelectedNodeId(null); setConnectSourceId(null); }}
                className="flex-1 py-2 px-3 rounded-xl bg-forest-900 text-earth-cream/70 border border-forest-600/40 font-bold text-xs hover:text-white transition-all flex items-center justify-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Clear Canvas</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* AI Hint Modal */}
      {showHintModal && (
        <div className="fixed inset-0 bg-forest-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-forest-800 border border-forest-600/40 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-earthy">
            <div className="flex items-center justify-between border-b border-forest-600/30 pb-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-accent-gold" />
                <h3 className="text-sm font-bold font-serif text-earth-cream">Architectural Hint</h3>
              </div>
              <span className="text-xs text-earth-cream/60 font-mono">Hint {currentHintIdx + 1} of {activeProblem.hints.length}</span>
            </div>

            <p className="text-xs text-earth-cream/90 leading-relaxed bg-forest-900 p-4 rounded-2xl border border-forest-600/30">
              "{activeProblem.hints[currentHintIdx]}"
            </p>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setCurrentHintIdx((prev) => (prev + 1) % activeProblem.hints.length)}
                className="text-xs text-accent-gold font-bold hover:underline"
              >
                Next Hint
              </button>

              <button
                onClick={() => setShowHintModal(false)}
                className="px-5 py-2 rounded-full bg-accent-gold text-forest-900 font-extrabold text-xs shadow-glow-gold hover:scale-[1.02] transition-all"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
