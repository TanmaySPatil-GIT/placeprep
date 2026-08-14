import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Sparkles, ChevronRight } from 'lucide-react';

const TOP_COMPANIES = [
  { id: 'google', name: 'Google', category: 'Tech Giant', logoText: 'G' },
  { id: 'amazon', name: 'Amazon', category: 'Cloud & Tech', logoText: 'A' },
  { id: 'microsoft', name: 'Microsoft', category: 'Enterprise Tech', logoText: 'M' },
  { id: 'tcs', name: 'TCS', category: 'IT Services', logoText: 'TCS' },
  { id: 'infosys', name: 'Infosys', category: 'IT Services', logoText: 'INF' },
  { id: 'accenture', name: 'Accenture', category: 'Consulting', logoText: 'ACN' },
  { id: 'deloitte', name: 'Deloitte', category: 'Consulting', logoText: 'D' },
  { id: 'capgemini', name: 'Capgemini', category: 'IT Consulting', logoText: 'CAP' },
  { id: 'wipro', name: 'Wipro', category: 'IT Services', logoText: 'W' }
];

export default function TopCompaniesSection() {
  const navigate = useNavigate();

  return (
    <section className="space-y-6 max-w-7xl mx-auto my-12">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8D9CE]/20 pb-4">
        <div className="space-y-1 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rust-500/30 border border-rust-400/40 text-[#FFF9F4] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-dustyrose-200" /> Recruiter Tracks
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#FFF9F4] tracking-tight">
            Top Companies Hiring
          </h2>
          <p className="text-xs text-[#E8D9CE] font-sans">
            Authentic recruitment tracks benchmarked against enterprise selection standards
          </p>
        </div>

        <button
          onClick={() => navigate('/companies')}
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#E8D9CE] hover:text-[#FFF9F4] transition-colors self-start sm:self-auto"
        >
          <span>Explore All 20+ Companies</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Grid of Monochrome Typographic Company Name Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
        {TOP_COMPANIES.map((company) => (
          <div
            key={company.id}
            onClick={() => navigate('/companies')}
            className="group relative p-4 rounded-xl bg-peach-card border border-warmborder/80 hover:border-rust-500/60 shadow-warm-xs hover:shadow-warm-md flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 hover:-translate-y-1 min-h-[95px]"
          >
            {/* Typographic Monogram Logo Badge */}
            <div className="w-9 h-9 rounded-lg bg-peach-50 border border-warmborder text-warmtext-700 font-mono font-black text-sm flex items-center justify-center grayscale group-hover:grayscale-0 group-hover:bg-rust-100 group-hover:text-rust-700 transition-all">
              {company.logoText}
            </div>

            {/* Clean Typographic Company Name */}
            <span className="font-heading font-extrabold text-xs text-warmtext-900 group-hover:text-rust-500 transition-colors mt-2 leading-none">
              {company.name}
            </span>
            <span className="text-[9px] text-warmtext-500 font-sans mt-1 line-clamp-1 opacity-75">
              {company.category}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
