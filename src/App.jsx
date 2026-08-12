import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PrepProvider } from './context/PrepContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import { Loader2 } from 'lucide-react';

// Lazy-loaded page components for fast initial bundle loading
const LandingPage = lazy(() => import('./pages/LandingPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const SelectFieldPage = lazy(() => import('./pages/SelectFieldPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CompaniesPage = lazy(() => import('./pages/CompaniesPage'));
const ResumePage = lazy(() => import('./pages/ResumePage'));
const AptitudeRoundPage = lazy(() => import('./pages/AptitudeRoundPage'));
const TechnicalMcqRoundPage = lazy(() => import('./pages/TechnicalMcqRoundPage'));
const DsaRoundPage = lazy(() => import('./pages/DsaRoundPage'));
const SystemDesignRoundPage = lazy(() => import('./pages/SystemDesignRoundPage'));
const InterviewRoundPage = lazy(() => import('./pages/InterviewRoundPage'));
const HrInterviewRoundPage = lazy(() => import('./pages/HrInterviewRoundPage'));
const NegotiationRoundPage = lazy(() => import('./pages/NegotiationRoundPage'));
const ResultsPage = lazy(() => import('./pages/ResultsPage'));
const FinalReportPage = lazy(() => import('./pages/FinalReportPage'));
const RecommendationsPage = lazy(() => import('./pages/RecommendationsPage'));
const MentorDashboardPage = lazy(() => import('./pages/MentorDashboardPage'));

const PageFallback = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-earth-cream">
    <Loader2 className="w-8 h-8 text-accent-gold animate-spin" />
    <span className="text-xs font-mono font-bold text-accent-gold">Loading Page Component...</span>
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PrepProvider>
          <Router>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<LandingPage />} />
                  <Route path="onboarding" element={<OnboardingPage />} />
                  <Route path="select-field" element={<SelectFieldPage />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="companies" element={<CompaniesPage />} />
                  <Route path="resume" element={<ResumePage />} />
                  <Route path="round/aptitude" element={<AptitudeRoundPage />} />
                  <Route path="round/tech-mcq" element={<TechnicalMcqRoundPage />} />
                  <Route path="round/dsa" element={<DsaRoundPage />} />
                  <Route path="round/system-design" element={<SystemDesignRoundPage />} />
                  <Route path="round/interview" element={<InterviewRoundPage />} />
                  <Route path="round/hr-interview" element={<HrInterviewRoundPage />} />
                  <Route path="round/negotiation" element={<NegotiationRoundPage />} />
                  <Route path="results" element={<ResultsPage />} />
                  <Route path="final-report" element={<FinalReportPage />} />
                  <Route path="recommendations" element={<RecommendationsPage />} />
                  <Route path="mentor-dashboard" element={<MentorDashboardPage />} />
                </Route>
              </Routes>
            </Suspense>
          </Router>
        </PrepProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
