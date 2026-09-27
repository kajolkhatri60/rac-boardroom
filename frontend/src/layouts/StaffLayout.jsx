import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useServerHealth } from '../lib/useServerHealth';
import { getUser, clearAuth } from '../lib/auth';
import Banner from '../components/ui/Banner';

export default function StaffLayout({
  children,
  role = 'admin', // 'admin' | 'board'
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const isServerReachable = useServerHealth();

  const user = getUser();
  const userName = user?.full_name || (role === 'board' ? 'Dr. K. S. Rao' : 'Dr. A. Rao');
  const userRole = user?.role
    ? user.role === 'admin'
      ? 'Admin'
      : user.role === 'board'
      ? 'Board member'
      : user.role
    : role === 'board'
    ? 'Board member'
    : 'Admin';

  const handleSignOut = () => {
    clearAuth();
    navigate('/login');
  };

  const adminNav = [
    { label: 'Dashboard', href: '/admin', exact: true },
    { label: 'Advertisements', href: '/admin/advertisements', prefix: '/admin/advertisements' },
    { label: 'Applications', href: '/admin/applications', prefix: '/admin/applications' },
    { label: 'Interviews', href: '/admin/interviews', prefix: '/admin/interviews' },
    { label: 'Board members', href: '/admin/board-members', prefix: '/admin/board-members' },
  ];

  const boardNav = [
    { label: 'My interviews', href: '/board', prefix: '/board' },
  ];

  const navItems = role === 'board' ? boardNav : adminNav;

  const isItemActive = (item) => {
    if (item.exact) {
      return location.pathname === item.href;
    }
    if (item.prefix) {
      return location.pathname === item.href || location.pathname.startsWith(`${item.prefix}/`);
    }
    return location.pathname === item.href;
  };

  return (
    <div className="min-h-screen flex flex-col bg-desk">
      {/* 56px Identity band - Fixed margin & padding to prevent cutoff at 1024px/1280px */}
      <header className="bg-paper border-b border-rule h-14 shrink-0 flex items-center">
        <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex flex-col justify-center min-w-0">
            <Link
              to={role === 'board' ? '/board' : '/admin'}
              className="text-sm sm:text-[15px] font-medium text-text leading-tight hover:text-ink transition-colors truncate"
            >
              Recruitment and Assessment Centre
            </Link>
            <span className="text-xs sm:text-[13px] text-muted leading-tight truncate">
              Defence Research and Development Organisation
            </span>
          </div>

          {/* Right identity elements: separate elements, not joined with dots */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm shrink-0">
            <span className="font-medium text-text truncate max-w-[140px] sm:max-w-none">{userName}</span>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-desk text-muted border border-rule">
              {userRole}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-xs font-medium text-ink hover:text-ink-strong cursor-pointer underline transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* 44px Navigation bar */}
      <nav
        aria-label="Staff navigation"
        className="bg-ink h-11 shrink-0 flex items-stretch px-4 sm:px-8"
      >
        <div className="w-full max-w-[1200px] mx-auto flex items-stretch gap-4 sm:gap-6 overflow-x-auto">
          {navItems.map((item) => {
            const active = isItemActive(item);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center text-sm transition-colors border-b-[3px] select-none whitespace-nowrap ${
                  active
                    ? 'border-white text-white font-medium'
                    : 'border-transparent text-white/80 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-8 py-8">
        {!isServerReachable && (
          <Banner
            variant="warn"
            message="The server is not reachable. Changes can't be saved until it is back."
            className="mb-6"
          />
        )}
        {children}
      </main>
    </div>
  );
}
