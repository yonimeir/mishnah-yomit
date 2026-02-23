import { Outlet, NavLink } from 'react-router-dom';
import { BookOpen, Home, Plus, Search } from 'lucide-react';

export default function Layout() {
  return (
    <div className="min-h-dvh flex flex-col bg-parchment-100">
      {/* Header */}
      <header className="bg-primary-700 text-white shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-gold-400" />
            <h1 className="text-xl font-bold">לימוד יומי</h1>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="bg-white border-t border-parchment-300 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-2xl mx-auto flex">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-3 text-sm transition-colors ${
                isActive ? 'text-primary-700 font-bold' : 'text-gray-500'
              }`
            }
          >
            <Home className="w-5 h-5 mb-1" />
            ראשי
          </NavLink>
          <NavLink
            to="/free"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-3 text-sm transition-colors ${
                isActive ? 'text-primary-700 font-bold' : 'text-gray-500'
              }`
            }
          >
            <Search className="w-5 h-5 mb-1" />
            לימוד חופשי
          </NavLink>
          <NavLink
            to="/new-plan"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-3 text-sm transition-colors ${
                isActive ? 'text-primary-700 font-bold' : 'text-gray-500'
              }`
            }
          >
            <Plus className="w-5 h-5 mb-1" />
            תוכנית חדשה
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
