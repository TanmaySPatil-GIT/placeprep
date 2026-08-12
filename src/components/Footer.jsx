import React from 'react';
import { ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-espresso-500 bg-espresso-900 text-peach-50 py-12 mt-20 shadow-warm-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-dustyrose-500" />
              <span className="font-bold font-serif text-lg tracking-tight text-white">
                Place<span className="text-dustyrose-500">Prep</span>
              </span>
            </div>
            <p className="text-xs text-espresso-100 leading-relaxed">
              Comprehensive placement accelerator equipping engineering & IT graduates with real-time DSA coding simulations, mock technical interviews, and instant skill gap analytics.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-dustyrose-400 bg-espresso-500/50 border border-espresso-500 px-3 py-1 rounded-full w-fit font-semibold shadow-warm-sm">
              <span className="w-2 h-2 rounded-full bg-dustyrose-500 animate-ping" />
              <span>Diagnostic System Active & Ready</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold font-serif uppercase tracking-wider text-white mb-3">Prep Rounds</h4>
            <ul className="space-y-2 text-xs text-espresso-100">
              <li><Link to="/round/dsa" className="hover:text-dustyrose-400 transition-colors">DSA Coding Arena</Link></li>
              <li><Link to="/round/interview" className="hover:text-dustyrose-400 transition-colors">Mock Video Interview</Link></li>
              <li><Link to="/companies" className="hover:text-dustyrose-400 transition-colors">Company Specific Sets</Link></li>
              <li><Link to="/results" className="hover:text-dustyrose-400 transition-colors">Skill Diagnostic Reports</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold font-serif uppercase tracking-wider text-white mb-3">Top Companies</h4>
            <ul className="space-y-2 text-xs text-espresso-100">
              <li><Link to="/companies" className="hover:text-white transition-colors">Google & FAANG Prep</Link></li>
              <li><Link to="/companies" className="hover:text-white transition-colors">TCS Digital / NQT</Link></li>
              <li><Link to="/companies" className="hover:text-white transition-colors">Amazon SDE Prep</Link></li>
              <li><Link to="/companies" className="hover:text-white transition-colors">Microsoft Software Track</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold font-serif uppercase tracking-wider text-white mb-3">System Metrics</h4>
            <div className="space-y-2 text-xs text-espresso-100">
              <div className="flex items-center justify-between bg-warmtext-900 p-2.5 rounded-xl border border-espresso-500 shadow-warm-sm">
                <span>Evaluated Submissions</span>
                <span className="font-serif text-rust-400 font-bold">142,890+</span>
              </div>
              <div className="flex items-center justify-between bg-warmtext-900 p-2.5 rounded-xl border border-espresso-500 shadow-warm-sm">
                <span>Placement Rate</span>
                <span className="font-serif text-dustyrose-400 font-bold">94.2%</span>
              </div>
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-espresso-500 flex flex-col sm:flex-row items-center justify-between text-xs text-espresso-100 gap-4">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-dustyrose-500" />
            <span>&copy; {new Date().getFullYear()} PlacePrep Platform Inc. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="hover:text-white cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer">Terms of Service</span>
            <span className="hover:text-white cursor-pointer">Security</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
