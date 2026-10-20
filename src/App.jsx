import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
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
    <span className="text-xs font-mono font-bold text-rust-600">Loading Module...</span>
  </div>
);

function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 bg-peach-50 rounded-3xl border border-warmborder shadow-warm-md space-y-5 max-w-lg mx-auto my-8 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-rust-100 border border-warmborder flex items-center justify-center text-rust-500 shadow-warm-sm">
        <Loader2 className="w-8 h-8 text-rust-500 animate-spin" />
      </div>
      <div className="space-y-1.5">
        <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-rust-600 bg-rust-100 px-3 py-1 rounded-full">Error 404</span>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-warmtext-900">Module Not Found</h2>
        <p className="text-xs text-warmtext-600 max-w-sm">
          The requested round or page doesn't exist. Select a valid placement round from your dashboard or return home.
        </p>
      </div>
      <div className="flex items-center gap-3 pt-2">
        <a href="/dashboard" className="px-5 py-2.5 rounded-full bg-rust-500 hover:bg-rust-600 text-white font-bold text-xs shadow-glow-rust transition-all">
          Go to Dashboard
        </a>
        <a href="/" className="px-5 py-2.5 rounded-full bg-white hover:bg-peach-100 text-warmtext-900 font-bold text-xs border border-warmborder shadow-warm-sm transition-all">
          Return Home
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PrepProvider>
          <Router>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<Layout />}>
                  {/* Public Landing & Auth Routes */}
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
                  <Route path="report" element={<Navigate to="/final-report" replace />} />
                  <Route path="recommendations" element={<ProtectedRoute><RecommendationsPage /></ProtectedRoute>} />
                  <Route path="mentor-dashboard" element={<ProtectedRoute><MentorDashboardPage /></ProtectedRoute>} />

                  {/* Backward-Compatible Route Aliases */}
                  <Route path="aptitude-round" element={<Navigate to="/round/aptitude" replace />} />
                  <Route path="technical-mcq-round" element={<Navigate to="/round/tech-mcq" replace />} />
                  <Route path="dsa-round" element={<Navigate to="/round/dsa" replace />} />
                  <Route path="system-design-round" element={<Navigate to="/round/system-design" replace />} />
                  <Route path="interview-round" element={<Navigate to="/round/interview" replace />} />
                  <Route path="hr-interview-round" element={<Navigate to="/round/hr-interview" replace />} />

                  {/* Catch-All 404 Route */}
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </Suspense>
          </Router>
        </PrepProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
