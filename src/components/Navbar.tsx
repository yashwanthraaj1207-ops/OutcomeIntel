import React from 'react';
import {
  GraduationCap,
  Layers,
  Cpu,
  History,
  BarChart3,
  LogOut,
  User,
  Building2,
  Workflow
} from 'lucide-react';
import { AuthenticatedUser } from '../types/authTypes';

interface NavbarProps {
  moduleTitle?: string;
  stepNumber?: number;
  onOpenAIMLModal?: () => void;
  currentUser?: AuthenticatedUser | null;
  onNavigateToHistory?: () => void;
  onNavigateToAnalytics?: () => void;
  onNavigateToModule1?: () => void;
  onLogout?: () => void;
  currentView?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  moduleTitle = 'Module 1: Ingestion & Validation',
  stepNumber = 1,
  onOpenAIMLModal,
  currentUser,
  onNavigateToHistory,
  onNavigateToAnalytics,
  onNavigateToModule1,
  onLogout,
  currentView
}) => {
  const isPipelineView = currentView ? currentView.startsWith('module') : true;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Identity */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onNavigateToModule1}
              className="p-2 bg-indigo-600 rounded-xl shadow-xs hover:bg-indigo-700 active:bg-indigo-800 transition cursor-pointer text-left flex items-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
              title="Return to Pipeline Home"
              aria-label="Return to Pipeline Home"
            >
              <GraduationCap className="h-5 w-5 text-white" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <span
                  onClick={onNavigateToModule1}
                  className="font-bold text-base sm:text-lg text-white tracking-tight cursor-pointer hover:text-indigo-300 transition"
                >
                  OutcomeIntel
                </span>
                {isPipelineView && moduleTitle && (
                  <span className="hidden xl:inline text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/80">
                    {moduleTitle}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-normal truncate max-w-xs hidden sm:block">
                Institutional Academic Intelligence
              </p>
            </div>
          </div>

          {/* Central Navigation Items (Pipeline, History, Analytics) */}
          {currentUser && (
            <nav aria-label="Main Navigation" className="hidden md:flex items-center space-x-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              {onNavigateToModule1 && (
                <button
                  type="button"
                  onClick={onNavigateToModule1}
                  className={`flex items-center space-x-1.5 px-3.5 h-8 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isPipelineView
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Workflow className="h-3.5 w-3.5" />
                  <span>Pipeline</span>
                </button>
              )}

              {onNavigateToHistory && (
                <button
                  type="button"
                  onClick={onNavigateToHistory}
                  className={`flex items-center space-x-1.5 px-3.5 h-8 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    currentView === 'history' || currentView === 'comparison'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <History className="h-3.5 w-3.5" />
                  <span>History</span>
                </button>
              )}

              {onNavigateToAnalytics && (
                <button
                  type="button"
                  onClick={onNavigateToAnalytics}
                  className={`flex items-center space-x-1.5 px-3.5 h-8 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    currentView === 'analytics'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span>Analytics</span>
                </button>
              )}
            </nav>
          )}

          {/* Right Controls: AI/ML Transparency, Stage Indicator, FERPA, User Profile & Logout */}
          <div className="flex items-center space-x-2.5">
            {onOpenAIMLModal && (
              <button
                type="button"
                onClick={onOpenAIMLModal}
                className="hidden lg:inline-flex items-center space-x-1.5 px-2.5 h-8 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
                title="View AI/ML vs Deterministic Engine Boundaries"
              >
                <Cpu className="h-3.5 w-3.5 text-indigo-400" />
                <span>AI/ML Transparency</span>
              </button>
            )}

            {isPipelineView && stepNumber && (
              <div className="hidden sm:flex items-center space-x-1.5 bg-slate-800/70 text-slate-300 border border-slate-700/80 px-2.5 h-8 rounded-lg text-xs font-medium">
                <Layers className="h-3.5 w-3.5 text-indigo-400" />
                <span>Stage {stepNumber} of 8</span>
              </div>
            )}

            <div className="hidden xl:flex items-center space-x-1.5 px-2.5 h-8 rounded-lg border border-slate-800 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>FERPA Protected</span>
            </div>

            {/* User Profile & Logout */}
            {currentUser ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-200 leading-tight">
                    {currentUser.displayName}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    {currentUser.role === 'HOD' ? 'HOD / Administrator' : 'Faculty Instructor'}
                  </span>
                </div>

                <div
                  className="px-2 h-7 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 bg-slate-800 text-slate-300 border border-slate-700"
                  title={currentUser.roleTitle}
                >
                  {currentUser.role === 'HOD' ? (
                    <Building2 className="h-3 w-3 text-amber-400" />
                  ) : (
                    <User className="h-3 w-3 text-indigo-400" />
                  )}
                  <span>{currentUser.role}</span>
                </div>

                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    title="Sign Out"
                    aria-label="Sign Out"
                    className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Mobile Secondary Navigation Row (when authenticated) */}
      {currentUser && (
        <div className="md:hidden flex items-center justify-around bg-slate-950/90 border-t border-slate-800/80 py-1.5 px-2 text-xs font-bold">
          {onNavigateToModule1 && (
            <button
              type="button"
              onClick={onNavigateToModule1}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition ${
                isPipelineView ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Workflow className="h-3.5 w-3.5" />
              <span>Pipeline</span>
            </button>
          )}

          {onNavigateToHistory && (
            <button
              type="button"
              onClick={onNavigateToHistory}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition ${
                currentView === 'history' || currentView === 'comparison'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>History</span>
            </button>
          )}

          {onNavigateToAnalytics && (
            <button
              type="button"
              onClick={onNavigateToAnalytics}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition ${
                currentView === 'analytics'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Analytics</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
