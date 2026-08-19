import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PrepProvider } from './context/PrepContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { Loader2 } from 'lucide-react';

// Lazy-loaded page components for fast initial bundle loading
const LandingPage = lazy(() => import('./pages/LandingPage'));
const SignInPage = lazy(() => import('./pages/SignInPage'));
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
  <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 text-warmtext-700">
    <Loader2 className="w-8 h-8 text-rust-500 animate-spin" />
    <span className="text-xs font-mono font-bold text-rust-600">Loading Diagnostic Module...</span>
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
                  {/* Public Routes */}
                  <Route index element={<LandingPage />} />
                  <Route path="signin" element={<SignInPage />} />

                  {/* Protected Functional Routes */}
                  <Route path="onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
                  <Route path="select-field" element={<ProtectedRoute><SelectFieldPage /></ProtectedRoute>} />
                  <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                  <Route path="companies" element={<ProtectedRoute><CompaniesPage /></ProtectedRoute>} />
                  <Route path="resume" element={<ProtectedRoute><ResumePage /></ProtectedRoute>} />
                  <Route path="round/aptitude" element={<ProtectedRoute><AptitudeRoundPage /></ProtectedRoute>} />
                  <Route path="round/tech-mcq" element={<ProtectedRoute><TechnicalMcqRoundPage /></ProtectedRoute>} />
                  <Route path="round/dsa" element={<ProtectedRoute><DsaRoundPage /></ProtectedRoute>} />
                  <Route path="round/system-design" element={<ProtectedRoute><SystemDesignRoundPage /></ProtectedRoute>} />
                  <Route path="round/interview" element={<ProtectedRoute><InterviewRoundPage /></ProtectedRoute>} />
                  <Route path="round/hr-interview" element={<ProtectedRoute><HrInterviewRoundPage /></ProtectedRoute>} />
                  <Route path="round/negotiation" element={<ProtectedRoute><NegotiationRoundPage /></ProtectedRoute>} />
                  <Route path="results" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
                  <Route path="final-report" element={<ProtectedRoute><FinalReportPage /></ProtectedRoute>} />
                  <Route path="recommendations" element={<ProtectedRoute><RecommendationsPage /></ProtectedRoute>} />
                  <Route path="mentor-dashboard" element={<ProtectedRoute><MentorDashboardPage /></ProtectedRoute>} />
                </Route>
              </Routes>
            </Suspense>
          </Router>
        </PrepProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
