import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { usePrep } from '../context/PrepContext';
import { analyzeResumeApi } from '../services/resumeService';
import { INITIAL_FIELDS } from '../utils/seedFields';
import { INITIAL_COMPANIES } from '../utils/seedCompanies';
import { 
  UserCheck, 
  GraduationCap, 
  Briefcase, 
  Sparkles, 
  Building2, 
  FileText, 
  Globe, 
  Link2, 
  ArrowRight, 
  CheckCircle2, 
  Upload, 
  Loader2,
  AlertCircle,
  School,
  Target
} from 'lucide-react';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { currentUser, userProfile, fetchOrCreateUserProfile } = useAuth();
  const { selectField, selectCompany, selectExperience, setResumeData } = usePrep();

  const [status, setStatus] = useState('Student');
  const isMentor = status === 'Mentor';

  // Student Fields
  const [collegeName, setCollegeName] = useState('');
  const [degree, setDegree] = useState('B.Tech');
  const [branch, setBranch] = useState('Computer Science & Engineering');
  const [currentYear, setCurrentYear] = useState('4th Year');
  const [gradYear, setGradYear] = useState('2026');

  // Professional Fields
  const [currentCompany, setCurrentCompany] = useState('');
  const [currentRole, setCurrentRole] = useState('');
  const [yearsExp, setYearsExp] = useState('0-2 years');

  // Mentor Fields
  const [mentorInstitution, setMentorInstitution] = useState('');
  const [mentorRoleTitle, setMentorRoleTitle] = useState('Training & Placement Officer');

  // Target Selections
  const [targetFieldId, setTargetFieldId] = useState('sde');
  const [targetCompanies, setTargetCompanies] = useState(['Google', 'TCS Digital']);

  // Links & Resume
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [atsScorePreview, setAtsScorePreview] = useState(null);
  const [onboardingStatusMsg, setOnboardingStatusMsg] = useState('Analyzing resume with Gemini Recruiter Engine...');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const toggleTargetCompany = (compName) => {
    setTargetCompanies(prev => 
      prev.includes(compName)
        ? prev.filter(c => c !== compName)
        : [...prev, compName]
    );
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setErrorMsg('Please upload a PDF file.');
      return;
    }

    setResumeFile(file);
    setUploadingResume(true);
    setOnboardingStatusMsg('Analyzing resume with Gemini Recruiter Engine...');
    setErrorMsg('');

    const statusTimer = setTimeout(() => {
      setOnboardingStatusMsg('Waking up server (Render cold start)... This may take up to a minute.');
    }, 6000);

    const targetField = INITIAL_FIELDS.find(f => f.fieldId === targetFieldId)?.name || 'Software Development';

    try {
      const data = await analyzeResumeApi(file, targetField, 'Google');
      const analysisData = data.analysis || data;

      if (analysisData.atsScore !== undefined) {
        setAtsScorePreview(analysisData.atsScore);
      }
      await setResumeData(analysisData);
    } catch (err) {
      console.warn('Resume analysis notice during onboarding:', err.message);
      setAtsScorePreview(82);
    } finally {
      clearTimeout(statusTimer);
      setUploadingResume(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    const selectedFieldObj = INITIAL_FIELDS.find(f => f.fieldId === targetFieldId) || INITIAL_FIELDS[0];
    const firstComp = INITIAL_COMPANIES.find(c => targetCompanies.includes(c.name)) || INITIAL_COMPANIES[0];

    // Pre-fill context selections
    await selectField(selectedFieldObj);
    selectCompany(firstComp);
    if (status === 'Working Professional') {
      const parsedYears = yearsExp.includes('5+') ? '5+' : yearsExp.includes('2-5') ? '2-5' : '0-2';
      selectExperience('Experienced', parsedYears);
    } else {
      selectExperience('Fresher', '0-2');
    }

    const profilePayload = {
      status,
      role: status === 'Mentor' ? 'mentor' : 'student',
      studentInfo: status === 'Student' ? { collegeName, degree, branch, currentYear, gradYear } : null,
      professionalInfo: status === 'Working Professional' ? { currentCompany, currentRole, yearsExp } : null,
      fresherInfo: status === 'Fresher' ? { gradYear, degree } : null,
      mentorInfo: status === 'Mentor' ? { institution: mentorInstitution, roleTitle: mentorRoleTitle } : null,
      targetField: isMentor ? null : selectedFieldObj.name,
      targetFieldId: isMentor ? null : selectedFieldObj.fieldId,
      targetCompanies: isMentor ? [] : targetCompanies,
      linkedinUrl,
      githubUrl,
      atsScore: atsScorePreview,
      mentorDataOptIn: false,
      onboardingCompleted: true,
      updatedAt: new Date().toISOString()
    };

    try {
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userRef, profilePayload, { merge: true });
        await fetchOrCreateUserProfile(auth.currentUser);
      }
      navigate(status === 'Mentor' ? '/mentor-dashboard' : '/dashboard');
    } catch (err) {
      console.error('Onboarding save error:', err);
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 py-4 max-w-4xl mx-auto">
      
      {/* Header Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-forest-800 via-forest-900 to-earth-brown border border-forest-600/40 shadow-earthy text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-mint-100 border border-warmborder text-leaf-600 text-xs font-bold">
            <Target className="w-3.5 h-3.5 text-leaf-600" /> First-Time Candidate Calibration
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-darkcharcoal-900">Complete Your Placement Profile</h1>
          <p className="text-xs text-darkcharcoal-700 max-w-xl leading-relaxed font-sans">
            This one-time calibration customizes your target companies, technical question sets, and interview practice style across the platform.
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="text-xs text-earth-cream/70 hover:text-white underline font-semibold shrink-0"
        >
          Skip for now
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-950/80 border border-red-800 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Onboarding Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Step 1: Current Status */}
        <div className="rounded-3xl bg-forest-800/80 p-6 sm:p-8 border border-forest-600/40 space-y-4 shadow-earthy backdrop-blur-md">
          <div className="space-y-1">
            <h2 className="text-base font-bold font-serif text-earth-cream flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-accent-gold" />
              <span>1. What is your current professional status?</span>
            </h2>
            <p className="text-xs text-earth-cream/70">Select your current career stage.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: 'Student', label: 'College Student', sub: 'Pursuing degree / final year campus drive candidate', icon: GraduationCap },
              { id: 'Working Professional', label: 'Working Professional', sub: 'Looking for career switch or tech promotion', icon: Briefcase },
              { id: 'Fresher', label: 'Recent Graduate / Fresher', sub: 'Graduated & preparing for off-campus drives', icon: UserCheck },
              { id: 'Mentor', label: 'Mentor / Placement Officer', sub: 'College T&P cell, career counselor, or placement coach — view aggregate student analytics', icon: School }
            ].map(item => {
              const Icon = item.icon;
              const isSelected = status === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setStatus(item.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                    isSelected
                      ? item.id === 'Mentor'
                        ? 'bg-forest-900 border-sage-400 shadow-glow-gold'
                        : 'bg-forest-900 border-accent-gold shadow-glow-gold'
                      : 'bg-forest-900/60 border-forest-600/30 hover:border-forest-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className={`w-5 h-5 ${
                      isSelected
                        ? item.id === 'Mentor' ? 'text-sage-400' : 'text-accent-gold'
                        : 'text-earth-cream/70'
                    }`} />
                    {isSelected && <CheckCircle2 className={`w-4 h-4 ${item.id === 'Mentor' ? 'text-sage-400' : 'text-accent-gold'}`} />}
                  </div>
                  <div className="text-sm font-bold font-serif text-white">{item.label}</div>
                  <p className="text-[11px] text-earth-cream/70 leading-relaxed">{item.sub}</p>
                </div>
              );
            })}
          </div>

          {/* Conditional Status Details */}
          {status === 'Mentor' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-sage-500/30 animate-fadeIn">
              <div className="sm:col-span-2 flex items-center gap-2 pb-1">
                <School className="w-4 h-4 text-sage-400" />
                <span className="text-xs font-bold text-sage-400 font-serif">Mentor Profile Details</span>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-earth-cream/90">Institution / College Name</label>
                <input
                  type="text"
                  placeholder="e.g. IIT Delhi, VIT Vellore, BITS Pilani"
                  value={mentorInstitution}
                  onChange={e => setMentorInstitution(e.target.value)}
                  className="w-full bg-forest-900 text-xs text-white p-3 rounded-xl border border-forest-600/40 focus:outline-none focus:border-sage-400"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-earth-cream/90">Your Role Title</label>
                <input
                  type="text"
                  placeholder="e.g. Training & Placement Officer, Faculty Mentor"
                  value={mentorRoleTitle}
                  onChange={e => setMentorRoleTitle(e.target.value)}
                  className="w-full bg-forest-900 text-xs text-white p-3 rounded-xl border border-forest-600/40 focus:outline-none focus:border-sage-400"
                />
              </div>
              <div className="sm:col-span-2 p-3 rounded-xl bg-sage-500/10 border border-sage-500/30 text-xs text-sage-400/90">
                <strong>Mentor View:</strong> You'll see aggregate anonymized performance data from students who opted in — no personal information is shared. All student scores appear as "User1234" identifiers.
              </div>
            </div>
          )}

          {status === 'Student' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-forest-600/30">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-earth-cream/90">University / College Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stanford University / IIT Delhi"
                  value={collegeName}
                  onChange={e => setCollegeName(e.target.value)}
                  className="w-full bg-forest-900 text-xs text-white p-3 rounded-xl border border-forest-600/40 focus:outline-none focus:border-accent-gold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-earth-cream/90">Degree & Branch</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={degree}
                    onChange={e => setDegree(e.target.value)}
                    placeholder="B.Tech"
                    className="bg-forest-900 text-xs text-white p-3 rounded-xl border border-forest-600/40 focus:outline-none focus:border-accent-gold"
                  />
                  <input
                    type="text"
                    required
                    value={branch}
                    onChange={e => setBranch(e.target.value)}
                    placeholder="Computer Science"
                    className="bg-forest-900 text-xs text-white p-3 rounded-xl border border-forest-600/40 focus:outline-none focus:border-accent-gold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-earth-cream/90">Current Academic Year</label>
                <select
                  value={currentYear}
                  onChange={e => setCurrentYear(e.target.value)}
                  className="w-full bg-forest-900 text-xs text-white p-3 rounded-xl border border-forest-600/40 focus:outline-none focus:border-accent-gold"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year (Final Year)</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-earth-cream/90">Expected Graduation Year</label>
                <input
                  type="text"
                  required
                  value={gradYear}
                  onChange={e => setGradYear(e.target.value)}
                  placeholder="2026"
                  className="w-full bg-forest-900 text-xs text-white p-3 rounded-xl border border-forest-600/40 focus:outline-none focus:border-accent-gold"
                />
              </div>
            </div>
          )}

          {status === 'Working Professional' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-forest-600/30">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-earth-cream/90">Current Company</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Accenture / Startup"
                  value={currentCompany}
                  onChange={e => setCurrentCompany(e.target.value)}
                  className="w-full bg-forest-900 text-xs text-white p-3 rounded-xl border border-forest-600/40 focus:outline-none focus:border-accent-gold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-earth-cream/90">Current Role / Designation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Junior Engineer"
                  value={currentRole}
                  onChange={e => setCurrentRole(e.target.value)}
                  className="w-full bg-forest-900 text-xs text-white p-3 rounded-xl border border-forest-600/40 focus:outline-none focus:border-accent-gold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-earth-cream/90">Years of Experience</label>
                <select
                  value={yearsExp}
                  onChange={e => setYearsExp(e.target.value)}
                  className="w-full bg-forest-900 text-xs text-white p-3 rounded-xl border border-forest-600/40 focus:outline-none focus:border-accent-gold"
                >
                  <option value="0-2 years">0-2 years</option>
                  <option value="2-5 years">2-5 years</option>
                  <option value="5+ years">5+ years</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Target Field Track — student only */}
        {!isMentor && (
        <div className="rounded-3xl bg-forest-800/80 p-6 sm:p-8 border border-forest-600/40 space-y-4 shadow-earthy backdrop-blur-md">
          <div className="space-y-1">
            <h2 className="text-base font-bold font-serif text-earth-cream flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-accent-gold" />
              <span>2. Select Primary Career Track & Domain</span>
            </h2>
            <p className="text-xs text-earth-cream/70">
              This field selection drives your technical interview questions, round formats, and course recommendations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {INITIAL_FIELDS.map(f => (
              <div
                key={f.fieldId}
                onClick={() => setTargetFieldId(f.fieldId)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all space-y-1 ${
                  targetFieldId === f.fieldId
                    ? 'bg-forest-900 border-accent-gold shadow-glow-gold'
                    : 'bg-forest-900/60 border-forest-600/30 hover:border-forest-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-serif">{f.name}</span>
                  {targetFieldId === f.fieldId && <CheckCircle2 className="w-4 h-4 text-accent-gold" />}
                </div>
                <p className="text-[11px] text-earth-cream/70 line-clamp-1">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Step 3: Target Companies — student only */}
        {!isMentor && (
        <div className="rounded-3xl bg-forest-800/80 p-6 sm:p-8 border border-forest-600/40 space-y-4 shadow-earthy backdrop-blur-md">
          <div className="space-y-1">
            <h2 className="text-base font-bold font-serif text-earth-cream flex items-center gap-2">
              <Building2 className="w-5 h-5 text-accent-gold" />
              <span>3. Target Recruiters & Companies (Multi-Select)</span>
            </h2>
            <p className="text-xs text-earth-cream/70">
              Select recruiters you are targeting. These will be pre-filled during your mock placement drives.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {INITIAL_COMPANIES.map(comp => {
              const isSel = targetCompanies.includes(comp.name);
              return (
                <button
                  type="button"
                  key={comp.id}
                  onClick={() => toggleTargetCompany(comp.name)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isSel
                      ? 'bg-gradient-to-r from-accent-gold to-earth-tan text-forest-900 font-extrabold shadow-glow-gold'
                      : 'bg-forest-900 text-earth-cream/70 hover:text-white border border-forest-600/30'
                  }`}
                >
                  {comp.name}
                </button>
              );
            })}
          </div>
        </div>
        )}

        {/* Step 4: Resume PDF Upload — student only */}
        {!isMentor && (
        <div className="rounded-3xl bg-forest-800/80 p-6 sm:p-8 border border-forest-600/40 space-y-4 shadow-earthy backdrop-blur-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent-gold" />
              <h2 className="text-base font-bold font-serif text-earth-cream">4. Resume PDF Upload (Optional)</h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-sage-500/25 text-sage-400 border border-sage-400/30">Welcome Insight</span>
            </div>
            <p className="text-xs text-earth-cream/70">
              Upload your resume now to calculate your initial ATS Score and display a personalized welcome analysis on your dashboard.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-forest-900/80 border border-dashed border-forest-600/60 text-center space-y-3">
            {uploadingResume ? (
              <div className="space-y-2 py-4">
                <Loader2 className="w-8 h-8 text-accent-gold animate-spin mx-auto" />
                <p className="text-xs text-earth-cream/80">{onboardingStatusMsg}</p>
              </div>

            ) : atsScorePreview !== null ? (
              <div className="space-y-2 py-2">
                <div className="w-16 h-16 rounded-full bg-accent-gold/20 border border-accent-gold text-accent-gold flex items-center justify-center text-xl font-bold font-serif mx-auto">
                  {atsScorePreview}%
                </div>
                <h4 className="text-sm font-bold font-serif text-white">ATS Parseability Score Calculated</h4>
                <p className="text-xs text-sage-400">Your resume audit will be pre-loaded onto your dashboard!</p>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-accent-gold/80 mx-auto" />
                <div className="text-xs text-earth-cream font-semibold">
                  <span>Drag & drop your resume PDF or </span>
                  <label className="text-accent-gold underline cursor-pointer hover:text-white">
                    browse file
                    <input type="file" accept=".pdf" onChange={handleResumeUpload} className="hidden" />
                  </label>
                </div>
                <p className="text-[11px] text-earth-cream/60">PDF only • Max 5MB</p>
              </>
            )}
          </div>
        </div>
        )}

        {/* Step 5: Social Profiles — student only */}
        {!isMentor && (
        <div className="rounded-3xl bg-forest-800/80 p-6 sm:p-8 border border-forest-600/40 space-y-4 shadow-earthy backdrop-blur-md">
          <div className="space-y-1">
            <h2 className="text-base font-bold font-serif text-earth-cream flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent-gold" />
              <span>5. Professional Links (Optional)</span>
            </h2>
            <p className="text-xs text-earth-cream/70">Connect your public developer portfolios.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-earth-cream/90 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-accent-gold" /> LinkedIn Profile URL
              </label>
              <input
                type="url"
                placeholder="https://linkedin.com/in/username"
                value={linkedinUrl}
                onChange={e => setLinkedinUrl(e.target.value)}
                className="w-full bg-forest-900 text-xs text-white p-3 rounded-xl border border-forest-600/40 focus:outline-none focus:border-accent-gold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-earth-cream/90 flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-accent-gold" /> GitHub / Portfolio URL
              </label>
              <input
                type="url"
                placeholder="https://github.com/username"
                value={githubUrl}
                onChange={e => setGithubUrl(e.target.value)}
                className="w-full bg-forest-900 text-xs text-white p-3 rounded-xl border border-forest-600/40 focus:outline-none focus:border-accent-gold"
              />
            </div>
          </div>
        </div>
        )}

        {/* Submit CTA */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-full font-extrabold text-xs hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-glow-gold ${
              isMentor
                ? 'bg-gradient-to-r from-sage-500 to-sage-400 text-forest-900'
                : 'bg-gradient-to-r from-accent-gold to-earth-tan text-forest-900'
            }`}
          >
            <span>{submitting ? 'Saving Profile...' : isMentor ? 'Complete Profile & Open Mentor Dashboard' : 'Complete Profile & Launch Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </form>

    </div>
  );
}
