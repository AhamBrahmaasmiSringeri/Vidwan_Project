import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  Calendar, 
  Users, 
  BookOpen, 
  Compass, 
  LogOut, 
  Shield, 
  UserCheck 
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);

  const navItems = [
    { path: '/', name: 'Calendar Dashboard', icon: Calendar },
    { path: '/programs', name: 'Manage Programs', icon: BookOpen },
    { path: '/vidwans', name: 'Vidwan Registry', icon: Users },
    { path: '/availability', name: 'Availability Search', icon: Compass },
  ];

  return (
    <aside className="w-64 bg-white border-r border-cream-border flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-cream-border bg-cream/40">
        <h1 className="text-lg font-bold text-teak font-serif tracking-wide leading-tight">
          Aham Brahmaasmi Foundation®
        </h1>
        <p className="text-[10px] text-saffron font-medium uppercase tracking-wider mt-1">
          (A Unit of Dakshinamnaya Sri Sharada Peetham, Sringeri)
        </p>
        <span className="text-[10px] text-teak-muted font-sans block mt-0.5">
          Camp Scheduling System
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-saffron text-white shadow-sm'
                    : 'text-teak-light hover:bg-cream-dark hover:text-teak'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Session Footer */}
      <div className="p-4 border-t border-cream-border bg-cream/20">
        <div className="flex flex-col gap-2 p-3 bg-cream/50 rounded-lg border border-cream-border/50">
          <div className="flex items-center gap-2">
            {user?.role === 'Super Admin' ? (
              <Shield className="w-4 h-4 text-saffron" />
            ) : (
              <UserCheck className="w-4 h-4 text-forest" />
            )}
            <span className="text-xs font-semibold text-teak truncate max-w-[150px]">
              {user?.role === 'Super Admin' ? 'Super Admin' : user?.name}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              user?.role === 'Super Admin' 
                ? 'bg-saffron-soft text-saffron-dark border border-saffron/20' 
                : 'bg-forest-soft text-forest border border-forest/20'
            }`}>
              {user?.role}
            </span>
            <button
              onClick={logout}
              className="text-teak-muted hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
