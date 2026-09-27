import React from 'react';
import { Link } from 'react-router-dom';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-desk">
      {/* 56px Identity band */}
      <header className="bg-paper border-b border-rule h-14 shrink-0 flex items-center">
        <div className="w-full max-w-[1200px] px-8 flex items-center justify-between">
          <div className="flex flex-col justify-center">
            <Link
              to="/login"
              className="text-[15px] font-medium text-text leading-tight hover:text-ink transition-colors"
            >
              Recruitment and Assessment Centre
            </Link>
            <span className="text-[13px] text-muted leading-tight">
              Defence Research and Development Organisation
            </span>
          </div>
        </div>
      </header>

      {/* Main container: left-aligned with identity text, top third placement */}
      <main className="flex-1 w-full max-w-[1200px] px-8 pt-12 pb-16">
        <div className="w-full max-w-[400px]">
          {children}
        </div>
      </main>
    </div>
  );
}
