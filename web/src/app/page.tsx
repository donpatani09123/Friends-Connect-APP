'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Star, 
  Headphones, 
  ShieldAlert, 
  PhoneCall, 
  MapPin, 
  Radio, 
  Mic, 
  MicOff, 
  PhoneOff, 
  FastForward, 
  PlusCircle, 
  CheckCircle, 
  Lock, 
  Ticket, 
  Sparkles, 
  Search, 
  AlertTriangle, 
  Video, 
  VideoOff, 
  Camera, 
  RefreshCw, 
  EyeOff,
  LogOut,
  KeyRound,
  Smartphone,
  ShieldCheck,
  User as UserIcon,
  Building2,
  Sparkle
} from 'lucide-react';

// Roles matching platform specifications
type RoleType = 'NORMAL' | 'ORGANIZATION' | 'CELEBRITY' | 'SUPPORT' | 'SUPERADMIN';
type CallMode = 'AUDIO' | 'VIDEO';

interface EventItem {
  id: string;
  title: string;
  category: string;
  venueName: string;
  distanceKm: number;
  ticketPrice: number;
  totalCapacity: number;
  bookedSeats: number;
  startTime: string;
}

interface CelebrityPost {
  id: string;
  celebName: string;
  mediaType: 'IMAGE' | 'VIDEO';
  mediaUrl: string;
  caption: string;
  likesCount: number;
  createdAt: string;
}

interface PlatformUser {
  id: string;
  phone: string;
  email?: string;
  role: RoleType;
  tier: 'FREE' | 'PREMIUM_VIP';
  name: string;
  isBlocked: boolean;
}

// Pre-seeded system accounts for authentication & quick sign-in
const DEMO_ACCOUNTS: PlatformUser[] = [
  {
    id: 'usr-1',
    name: 'Alex River',
    phone: '+19876543210',
    email: 'alex@friends.app',
    role: 'NORMAL',
    tier: 'FREE',
    isBlocked: false
  },
  {
    id: 'usr-4',
    name: 'RedBull Events & Productions',
    phone: '+10000000003',
    email: 'events@redbull.com',
    role: 'ORGANIZATION',
    tier: 'PREMIUM_VIP',
    isBlocked: false
  },
  {
    id: 'usr-3',
    name: 'Elena Rostova (Singer & Artist)',
    phone: '+10000000002',
    email: 'elena@celebrity.vip',
    role: 'CELEBRITY',
    tier: 'PREMIUM_VIP',
    isBlocked: false
  },
  {
    id: 'usr-5',
    name: 'Sarah - Customer Care Desk',
    phone: '+10000000001',
    email: 'support@friends.app',
    role: 'SUPPORT',
    tier: 'PREMIUM_VIP',
    isBlocked: false
  },
  {
    id: 'usr-admin',
    name: 'Root System Administrator',
    phone: '+10000000000',
    email: 'admin@friends.app',
    role: 'SUPERADMIN',
    tier: 'PREMIUM_VIP',
    isBlocked: false
  }
];

export default function PlatformDashboard() {
  // Session & Authentication State
  const [currentUser, setCurrentUser] = useState<PlatformUser | null>(null);
  const [isSessionRestored, setIsSessionRestored] = useState<boolean>(false);

  // Sign In Form States
  const [authMethod, setAuthMethod] = useState<'OTP' | 'PASSWORD'>('OTP');
  const [authPhone, setAuthPhone] = useState<string>('+19876543210');
  const [authOtpCode, setAuthOtpCode] = useState<string>('');
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [authUsername, setAuthUsername] = useState<string>('alex@friends.app');
  const [authPassword, setAuthPassword] = useState<string>('password123');
  const [selectedSignupRole, setSelectedSignupRole] = useState<RoleType>('NORMAL');
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);

  // Matchmaking State (Audio vs Video)
  const [callMode, setCallMode] = useState<CallMode>('VIDEO');
  const [matchingState, setMatchingState] = useState<'IDLE' | 'SEARCHING' | 'CONNECTED'>('IDLE');
  const [currentPartner, setCurrentPartner] = useState<string>('Maya Lin (San Francisco)');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);
  const [isFrontCamera, setIsFrontCamera] = useState<boolean>(true);
  const [isSafetyBlurred, setIsSafetyBlurred] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<number>(0);

  // Events State
  const [searchRadius, setSearchRadius] = useState<number>(25);
  const [eventsList, setEventsList] = useState<EventItem[]>([
    {
      id: 'event-001',
      title: 'Neon Nights: Electronic Music Fest 2026',
      category: 'Music & Concerts',
      venueName: 'The Midway SF (900 Marin St)',
      distanceKm: 1.4,
      ticketPrice: 35.0,
      totalCapacity: 500,
      bookedSeats: 142,
      startTime: 'Saturday, 8:00 PM'
    },
    {
      id: 'event-002',
      title: 'Tech & Friends Networking Mixer',
      category: 'Networking',
      venueName: 'Salesforce Park Rooftop',
      distanceKm: 2.8,
      ticketPrice: 0.0,
      totalCapacity: 150,
      bookedSeats: 89,
      startTime: 'Tomorrow, 6:30 PM'
    }
  ]);
  const [selectedEventForBooking, setSelectedEventForBooking] = useState<EventItem | null>(null);
  const [bookingPass, setBookingPass] = useState<string | null>(null);

  // Organization New Event Form State
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventCategory, setNewEventCategory] = useState('Music & Concerts');
  const [newEventVenue, setNewEventVenue] = useState('');
  const [newEventPrice, setNewEventPrice] = useState('25');
  const [newEventCapacity, setNewEventCapacity] = useState('200');

  // Celebrity Hub State
  const [userTier, setUserTier] = useState<'FREE' | 'PREMIUM_VIP'>('FREE');
  const [showVipModal, setShowVipModal] = useState(false);
  const [celebVideoCallActive, setCelebVideoCallActive] = useState<string | null>(null);
  const [celebLiveFanConnectActive, setCelebLiveFanConnectActive] = useState<boolean>(true);
  const [celebPosts, setCelebPosts] = useState<CelebrityPost[]>([
    {
      id: 'post-1',
      celebName: 'Elena Rostova',
      mediaType: 'IMAGE',
      mediaUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
      caption: 'Backstage vibes right before tonight’s acoustic performance! 🎸✨',
      likesCount: 12480,
      createdAt: '2 hours ago'
    },
    {
      id: 'post-2',
      celebName: 'Elena Rostova',
      mediaType: 'VIDEO',
      mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      caption: 'Exclusive rehearsal clip for upcoming summer world tour! 🎥🔥',
      likesCount: 28900,
      createdAt: 'Yesterday'
    }
  ]);

  // Support Care State
  const [supportConnected, setSupportConnected] = useState(false);

  // SuperAdmin User Management State
  const [usersList, setUsersList] = useState<PlatformUser[]>(DEMO_ACCOUNTS);

  // 1. Session Persistence: Check localStorage on initial load
  // If user refreshes or presses back/forward, they stay logged in!
  useEffect(() => {
    try {
      const stored = localStorage.getItem('friends_connect_session_user');
      if (stored) {
        const parsed: PlatformUser = JSON.parse(stored);
        setCurrentUser(parsed);
        setUserTier(parsed.tier);
      }
    } catch (e) {
      console.error('Failed to load session from localStorage', e);
    } finally {
      setIsSessionRestored(true);
    }
  }, []);

  // 2. Call timer simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (matchingState === 'CONNECTED') {
      interval = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [matchingState]);

  // Auth Action Handlers
  const loginUser = (user: PlatformUser) => {
    setCurrentUser(user);
    setUserTier(user.tier);
    localStorage.setItem('friends_connect_session_user', JSON.stringify(user));
    setAuthErrorMessage(null);
  };

  const handleSignOut = () => {
    localStorage.removeItem('friends_connect_session_user');
    setCurrentUser(null);
    setIsOtpSent(false);
    setAuthOtpCode('');
    setMatchingState('IDLE');
    setCelebVideoCallActive(null);
    setSupportConnected(false);
  };

  const handleOtpLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOtpSent) {
      // Simulate sending OTP
      setIsOtpSent(true);
      setAuthOtpCode('123456'); // Dev auto-fill
      return;
    }

    if (authOtpCode.trim() !== '123456') {
      setAuthErrorMessage('Invalid OTP code. Please enter 123456.');
      return;
    }

    // Match existing account or create new one with chosen role
    const existing = DEMO_ACCOUNTS.find(u => u.phone === authPhone.trim());
    if (existing) {
      loginUser(existing);
    } else {
      const newUser: PlatformUser = {
        id: `usr-${Date.now()}`,
        name: `User ${authPhone.slice(-4)}`,
        phone: authPhone.trim(),
        role: selectedSignupRole,
        tier: selectedSignupRole === 'NORMAL' ? 'FREE' : 'PREMIUM_VIP',
        isBlocked: false
      };
      loginUser(newUser);
    }
  };

  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const existing = DEMO_ACCOUNTS.find(
      u => (u.email && u.email.toLowerCase() === authUsername.trim().toLowerCase()) || u.phone === authUsername.trim()
    );

    if (existing) {
      loginUser(existing);
    } else {
      const newUser: PlatformUser = {
        id: `usr-${Date.now()}`,
        name: authUsername.split('@')[0] || 'User',
        phone: '+19870000000',
        email: authUsername.trim(),
        role: selectedSignupRole,
        tier: selectedSignupRole === 'NORMAL' ? 'FREE' : 'PREMIUM_VIP',
        isBlocked: false
      };
      loginUser(newUser);
    }
  };

  // Matchmaking Handlers
  const handleStartSearch = () => {
    setIsSafetyBlurred(false);
    setMatchingState('SEARCHING');
    setTimeout(() => {
      setMatchingState('CONNECTED');
    }, 2500);
  };

  const handleNextFriend = () => {
    setIsSafetyBlurred(false);
    setMatchingState('SEARCHING');
    setTimeout(() => {
      setCurrentPartner(prev => prev.includes('Alex') ? 'Maya Lin (San Francisco)' : 'Alex River (San Francisco)');
      setMatchingState('CONNECTED');
    }, 1500);
  };

  // Organization Event Handlers
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle || !newEventVenue) return;
    const item: EventItem = {
      id: `event-${Date.now()}`,
      title: newEventTitle,
      category: newEventCategory,
      venueName: newEventVenue,
      distanceKm: 0.5,
      ticketPrice: parseFloat(newEventPrice) || 0,
      totalCapacity: parseInt(newEventCapacity) || 100,
      bookedSeats: 0,
      startTime: 'This Weekend, 7:00 PM'
    };
    setEventsList([item, ...eventsList]);
    setNewEventTitle('');
    setNewEventVenue('');
    alert('Event successfully published to nearby users!');
  };

  const toggleUserBlock = (userId: string) => {
    setUsersList(prev => prev.map(u => u.id === userId ? { ...u, isBlocked: !u.isBlocked } : u));
  };

  // Prevent flash before session is verified from localStorage
  if (!isSessionRestored) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // =========================================================================
  // VIEW A: AUTHENTICATION / LOGIN SCREEN (When User is NOT signed in)
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6">
        {/* Brand Header */}
        <header className="max-w-6xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Friends & Events Platform
              </h1>
              <p className="text-xs text-slate-400">Secure Identity & Role-Gated Portal</p>
            </div>
          </div>
          <span className="text-xs bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1 rounded-full">
            🔒 Authentication Required
          </span>
        </header>

        {/* Center Auth Card */}
        <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto py-8">
          {/* Left Column: Interactive Sign In Form */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-white">Sign In to Your Account</h2>
              <p className="text-xs text-slate-400 mt-1">
                You will only have access to features explicitly permitted for your account role.
              </p>
            </div>

            {/* Auth Method Selector */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6">
              <button
                onClick={() => { setAuthMethod('OTP'); setAuthErrorMessage(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center space-x-2 transition ${
                  authMethod === 'OTP' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Mobile Number & OTP</span>
              </button>
              <button
                onClick={() => { setAuthMethod('PASSWORD'); setAuthErrorMessage(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center space-x-2 transition ${
                  authMethod === 'PASSWORD' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>Username & Password</span>
              </button>
            </div>

            {authErrorMessage && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                {authErrorMessage}
              </div>
            )}

            {/* Form A: Mobile OTP */}
            {authMethod === 'OTP' && (
              <form onSubmit={handleOtpLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mobile Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    disabled={isOtpSent}
                    placeholder="+1XXXXXXXXXX"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                  />
                </div>

                {isOtpSent && (
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold text-slate-300">6-Digit Verification Code</label>
                      <span className="text-[11px] text-cyan-400 font-bold">Dev Code: 123456</span>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={authOtpCode}
                      onChange={(e) => setAuthOtpCode(e.target.value)}
                      placeholder="123456"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono tracking-widest text-center focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                )}

                {!isOtpSent && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Account Type (For New Registrations)</label>
                    <select
                      value={selectedSignupRole}
                      onChange={(e) => setSelectedSignupRole(e.target.value as RoleType)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="NORMAL">Normal User (Social Connect & Events)</option>
                      <option value="ORGANIZATION">Organization Account (Event Host)</option>
                      <option value="CELEBRITY">Celebrity Account (VIP Creator)</option>
                      <option value="SUPPORT">Customer Care Desk</option>
                      <option value="SUPERADMIN">Super Admin</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 text-sm transition mt-2"
                >
                  {isOtpSent ? 'Verify OTP & Enter' : 'Send SMS Verification Code'}
                </button>

                {isOtpSent && (
                  <button
                    type="button"
                    onClick={() => { setIsOtpSent(false); setAuthOtpCode(''); }}
                    className="w-full py-2 text-xs text-slate-400 hover:text-white transition"
                  >
                    Change Phone Number
                  </button>
                )}
              </form>
            )}

            {/* Form B: Username & Password */}
            {authMethod === 'PASSWORD' && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Username or Email</label>
                  <input
                    type="text"
                    required
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    placeholder="name@friends.app"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 text-sm transition mt-2"
                >
                  Sign In With Password
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Fast 1-Click Role Logins */}
          <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Quick Demo Sign-In</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Click any profile below to instantly log in as that specific user role. Once logged in, switching is blocked until you explicitly sign out.
              </p>

              <div className="space-y-2.5">
                {DEMO_ACCOUNTS.map(demoUser => (
                  <button
                    key={demoUser.id}
                    onClick={() => loginUser(demoUser)}
                    className="w-full p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 flex items-center justify-between text-left transition group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                        demoUser.role === 'NORMAL' ? 'bg-indigo-500/20 text-indigo-400' :
                        demoUser.role === 'ORGANIZATION' ? 'bg-cyan-500/20 text-cyan-400' :
                        demoUser.role === 'CELEBRITY' ? 'bg-amber-500/20 text-amber-400' :
                        demoUser.role === 'SUPPORT' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-rose-500/20 text-rose-400'
                      }`}>
                        {demoUser.role === 'NORMAL' && <UserIcon className="w-4 h-4" />}
                        {demoUser.role === 'ORGANIZATION' && <Building2 className="w-4 h-4" />}
                        {demoUser.role === 'CELEBRITY' && <Star className="w-4 h-4" />}
                        {demoUser.role === 'SUPPORT' && <Headphones className="w-4 h-4" />}
                        {demoUser.role === 'SUPERADMIN' && <ShieldAlert className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition">{demoUser.name}</p>
                        <p className="text-[10px] text-slate-500">{demoUser.phone}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      {demoUser.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 mt-6">
              🛡️ <strong>Session Guard:</strong> Your session will be stored in your browser. Navigating back or reloading will not log you out.
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-500 py-4 border-t border-slate-900">
          Friends App Multi-Platform Ecosystem • Android Native • iOS Native • Web Portals • WebRTC Engine
        </footer>
      </div>
    );
  }

  // =========================================================================
  // VIEW B: AUTHENTICATED USER PORTAL (Strictly locked to currentUser.role)
  // =========================================================================
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navbar: Role Switcher REMOVED. Replaced with User Identity Badge & Sign Out Button */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Friends & Events Platform
            </h1>
            <p className="text-xs text-slate-400">
              {currentUser.role === 'NORMAL' && 'Normal User Experience • Random Matchmaking & Local Events'}
              {currentUser.role === 'ORGANIZATION' && 'Organization Portal • Host & Manage Company Events'}
              {currentUser.role === 'CELEBRITY' && 'Celebrity Creator Hub • Fan Interactions & VIP Calling'}
              {currentUser.role === 'SUPPORT' && 'Customer Care Console • Live Inquiries & Voice Routing'}
              {currentUser.role === 'SUPERADMIN' && 'Super Admin Governance • User Moderation & Platform Metrics'}
            </p>
          </div>
        </div>

        {/* User Badge & Sign Out Button */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2.5 bg-slate-800/90 px-3.5 py-1.5 rounded-xl border border-slate-700/80">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
              currentUser.role === 'NORMAL' ? 'bg-indigo-600 text-white' :
              currentUser.role === 'ORGANIZATION' ? 'bg-cyan-500 text-slate-950' :
              currentUser.role === 'CELEBRITY' ? 'bg-amber-400 text-slate-950' :
              currentUser.role === 'SUPPORT' ? 'bg-emerald-500 text-slate-950' :
              'bg-rose-500 text-white'
            }`}>
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-white leading-tight">{currentUser.name}</p>
              <div className="flex items-center space-x-1.5">
                <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                  currentUser.role === 'NORMAL' ? 'text-indigo-400 bg-indigo-500/10' :
                  currentUser.role === 'ORGANIZATION' ? 'text-cyan-400 bg-cyan-500/10' :
                  currentUser.role === 'CELEBRITY' ? 'text-amber-400 bg-amber-500/10' :
                  currentUser.role === 'SUPPORT' ? 'text-emerald-400 bg-emerald-500/10' :
                  'text-rose-400 bg-rose-500/10'
                }`}>
                  {currentUser.role}
                </span>
                {currentUser.tier === 'PREMIUM_VIP' && (
                  <span className="text-[9px] font-bold text-amber-400">★ VIP</span>
                )}
              </div>
            </div>
          </div>

          {/* Explicit Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-rose-600/80 hover:text-white text-slate-300 border border-slate-700/80 flex items-center space-x-1.5 transition shadow"
            title="Sign out of this account"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area - Strictly Filtered to currentUser.role */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {/* ========================================================================= */}
        {/* 1. NORMAL USER VIEW */}
        {/* ========================================================================= */}
        {currentUser.role === 'NORMAL' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Random Video & Audio Matching */}
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {callMode === 'VIDEO' ? <Video className="w-5 h-5 text-cyan-400" /> : <Radio className="w-5 h-5 text-indigo-400" />}
                    <h2 className="text-lg font-bold text-white">
                      {callMode === 'VIDEO' ? 'Random Video Connect' : 'Random Audio Connect'}
                    </h2>
                  </div>
                  <span className="flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                    58 Online
                  </span>
                </div>

                {/* Mode Selector Pill */}
                {matchingState === 'IDLE' && (
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-4">
                    <button
                      onClick={() => setCallMode('VIDEO')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition ${
                        callMode === 'VIDEO' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Live Video</span>
                    </button>
                    <button
                      onClick={() => setCallMode('AUDIO')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition ${
                        callMode === 'AUDIO' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>Audio Only</span>
                    </button>
                  </div>
                )}

                {/* Active Video Screen / Radar Stage */}
                <div className="h-72 rounded-xl bg-slate-950 border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center">
                  {matchingState === 'SEARCHING' && (
                    <>
                      <div className={`absolute w-36 h-36 rounded-full animate-ping ${callMode === 'VIDEO' ? 'bg-cyan-500/20' : 'bg-indigo-500/20'}`}></div>
                      <div className={`absolute w-24 h-24 rounded-full animate-pulse ${callMode === 'VIDEO' ? 'bg-cyan-500/40' : 'bg-indigo-500/40'}`}></div>
                      {callMode === 'VIDEO' ? <Video className="w-8 h-8 text-cyan-400 animate-spin" /> : <Radio className="w-8 h-8 text-indigo-400 animate-spin" />}
                      <p className="text-sm font-semibold text-white mt-4 z-10">
                        Finding an online {callMode === 'VIDEO' ? 'video' : 'voice'} friend...
                      </p>
                    </>
                  )}

                  {matchingState === 'CONNECTED' && callMode === 'VIDEO' && (
                    <div className="w-full h-full relative flex flex-col justify-between p-3">
                      {/* Remote Video Stream Simulation */}
                      {!isSafetyBlurred ? (
                        <div className="w-full h-full rounded-lg bg-slate-900 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
                          <div className="w-16 h-16 rounded-full bg-indigo-600/40 flex items-center justify-center mb-2">
                            <Users className="w-8 h-8 text-cyan-300" />
                          </div>
                          <p className="text-sm font-bold text-white">{currentPartner}</p>
                          <p className="text-[11px] text-cyan-400">WebRTC Full-Duplex Video (720p 30fps)</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-1">
                            Duration: {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
                          </p>
                        </div>
                      ) : (
                        <div className="w-full h-full rounded-lg bg-black/90 flex flex-col items-center justify-center p-4 text-center">
                          <EyeOff className="w-10 h-10 text-rose-500 mb-2" />
                          <p className="text-xs font-bold text-white">Video Feed Blurred by User</p>
                          <p className="text-[10px] text-slate-400 mt-1">Safety incident logged to SuperAdmin moderation desk</p>
                        </div>
                      )}

                      {/* Floating PiP Local Self-View (Top Right) */}
                      <div className="absolute top-4 right-4 w-24 h-32 rounded-lg bg-slate-800/90 border-2 border-cyan-400 flex flex-col items-center justify-center shadow-2xl backdrop-blur z-20">
                        {!isVideoMuted ? (
                          <>
                            <Camera className="w-5 h-5 text-cyan-300 mb-1" />
                            <span className="text-[9px] font-bold text-white">You (Self)</span>
                            <span className="text-[8px] text-slate-400">{isFrontCamera ? 'Front Cam' : 'Rear Cam'}</span>
                          </>
                        ) : (
                          <span className="text-[9px] font-bold text-rose-400">Cam Off</span>
                        )}
                      </div>
                    </div>
                  )}

                  {matchingState === 'CONNECTED' && callMode === 'AUDIO' && (
                    <div className="text-center z-10 animate-fade-in">
                      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 p-1 mb-3">
                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                          <Users className="w-8 h-8 text-cyan-400" />
                        </div>
                      </div>
                      <h3 className="font-bold text-white text-base">{currentPartner}</h3>
                      <p className="text-xs text-cyan-400 mt-0.5">Live WebRTC Audio Active</p>
                      <p className="text-xs text-slate-400 font-mono mt-2">
                        Duration: {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
                      </p>
                    </div>
                  )}

                  {matchingState === 'IDLE' && (
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
                        {callMode === 'VIDEO' ? <Video className="w-7 h-7 text-cyan-400" /> : <PhoneCall className="w-7 h-7 text-indigo-400" />}
                      </div>
                      <p className="text-sm font-medium text-slate-300">
                        {callMode === 'VIDEO' ? 'Ready for Random Video Match?' : 'Ready for Random Audio Match?'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Free 1-on-1 instant connection</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="mt-6 pt-4 border-t border-slate-800">
                {matchingState === 'IDLE' && (
                  <button
                    onClick={handleStartSearch}
                    className={`w-full py-3.5 font-bold rounded-xl shadow-lg transition flex items-center justify-center space-x-2 ${
                      callMode === 'VIDEO'
                        ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-slate-950 shadow-cyan-500/20'
                        : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-indigo-600/20'
                    }`}
                  >
                    {callMode === 'VIDEO' ? <Video className="w-4 h-4" /> : <Radio className="w-4 h-4" />}
                    <span>{callMode === 'VIDEO' ? 'Start Random Video Match' : 'Start Random Audio Match'}</span>
                  </button>
                )}

                {matchingState === 'SEARCHING' && (
                  <button
                    onClick={() => setMatchingState('IDLE')}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition"
                  >
                    Cancel Search
                  </button>
                )}

                {matchingState === 'CONNECTED' && (
                  <div className="flex items-center space-x-2">
                    {/* Mic Mute */}
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`p-3 rounded-xl border transition ${
                        isMuted ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                      title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
                    >
                      {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    {/* Camera Flip (Video mode only) */}
                    {callMode === 'VIDEO' && (
                      <button
                        onClick={() => setIsFrontCamera(!isFrontCamera)}
                        className="p-3 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl hover:text-white transition"
                        title="Flip Camera"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}

                    {/* Video Mute (Blank track) */}
                    {callMode === 'VIDEO' && (
                      <button
                        onClick={() => setIsVideoMuted(!isVideoMuted)}
                        className={`p-3 rounded-xl border transition ${
                          isVideoMuted ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                        title={isVideoMuted ? 'Turn Cam On' : 'Turn Cam Off'}
                      >
                        {isVideoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                      </button>
                    )}

                    {/* Next Friend */}
                    <button
                      onClick={handleNextFriend}
                      className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center space-x-1.5 transition text-xs"
                    >
                      <FastForward className="w-4 h-4" />
                      <span>Next Friend</span>
                    </button>

                    {/* Safety Blur & Report */}
                    {callMode === 'VIDEO' && (
                      <button
                        onClick={() => setIsSafetyBlurred(!isSafetyBlurred)}
                        className="p-3 bg-slate-800 hover:bg-rose-900/40 text-rose-400 border border-slate-700 rounded-xl transition"
                        title="Report & Blur Stream"
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                    )}

                    {/* End Call */}
                    <button
                      onClick={() => setMatchingState('IDLE')}
                      className="p-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition"
                      title="End Call"
                    >
                      <PhoneOff className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Middle: Geo-Location Events Feed */}
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-lg font-bold text-white">Events Near You</h2>
                </div>
                <span className="text-xs text-slate-400">San Francisco, CA</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Discover & book events hosted by verified companies within your search radius.
              </p>

              {/* Radius Filter */}
              <div className="mb-4 bg-slate-950/40 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-300">Radius: <strong className="text-white">{searchRadius} km</strong></span>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(Number(e.target.value))}
                  className="w-32 accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Event Cards */}
              <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                {eventsList
                  .filter(e => e.distanceKm <= searchRadius)
                  .map(event => (
                    <div key={event.id} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 hover:border-slate-700 transition">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {event.category}
                        </span>
                        <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                          {event.distanceKm} km away
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-sm mb-1">{event.title}</h4>
                      <p className="text-xs text-slate-400 flex items-center mb-1">
                        <MapPin className="w-3 h-3 mr-1 text-slate-500" /> {event.venueName}
                      </p>
                      <p className="text-xs text-slate-400 mb-3">📅 {event.startTime}</p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                        <div>
                          <p className="text-sm font-extrabold text-white">
                            {event.ticketPrice === 0 ? 'FREE' : `$${event.ticketPrice.toFixed(2)}`}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {event.totalCapacity - event.bookedSeats} seats left
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedEventForBooking(event);
                            setBookingPass(`PASS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
                          }}
                          className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-lg transition"
                        >
                          Book Ticket
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Right: Celebrity Hub & VIP Video Calls */}
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-amber-400" />
                  <h2 className="text-lg font-bold text-white">Celebrity Video Hub</h2>
                </div>
                <button
                  onClick={() => setUserTier(userTier === 'FREE' ? 'PREMIUM_VIP' : 'FREE')}
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md border transition ${
                    userTier === 'PREMIUM_VIP'
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {userTier === 'PREMIUM_VIP' ? '★ VIP ACTIVE' : 'FREE TIER (Click to Toggle)'}
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Watch star media feeds, join Celebrity Live Fan Video hours, or initiate 1-on-1 VIP video calls.
              </p>

              {/* Celebrity Live Fan Connect Pool Banner */}
              {celebLiveFanConnectActive && (
                <div className="mb-4 bg-gradient-to-r from-cyan-950/60 to-slate-900 p-3 rounded-xl border border-cyan-500/30">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-1.5 animate-pulse"></span>
                      CELEB LIVE FAN VIDEO
                    </span>
                    <span className="text-[10px] text-slate-400">3 min / fan</span>
                  </div>
                  <p className="text-xs font-bold text-white">Elena Rostova is taking Random Video Calls!</p>
                  <button
                    onClick={() => {
                      if (userTier === 'PREMIUM_VIP') {
                        setCelebVideoCallActive('Elena Rostova (Random Fan Connect Live)');
                      } else {
                        setShowVipModal(true);
                      }
                    }}
                    className="mt-2 w-full py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition"
                  >
                    Join Live Video Pool
                  </button>
                </div>
              )}

              {/* Celebrity Feed Items */}
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                {celebPosts.map(post => (
                  <div key={post.id} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center font-bold text-white text-xs">
                          {post.celebName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1">
                            <span className="font-bold text-white text-xs">{post.celebName}</span>
                            <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                          </div>
                          <span className="text-[10px] text-slate-500">{post.createdAt}</span>
                        </div>
                      </div>

                      {/* VIP Video Call Button */}
                      <button
                        onClick={() => {
                          if (userTier === 'PREMIUM_VIP') {
                            setCelebVideoCallActive(post.celebName);
                          } else {
                            setShowVipModal(true);
                          }
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center space-x-1.5 transition ${
                          userTier === 'PREMIUM_VIP'
                            ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                            : 'bg-slate-800 text-slate-300 hover:border-slate-600 border border-slate-700'
                        }`}
                      >
                        {userTier === 'PREMIUM_VIP' ? (
                          <>
                            <Video className="w-3 h-3" />
                            <span>VIP Video</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 text-amber-400" />
                            <span>Unlock Video</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="h-36 rounded-lg bg-slate-900 border border-slate-800/60 overflow-hidden relative flex items-center justify-center">
                      <img src={post.mediaUrl} alt={post.caption} className="w-full h-full object-cover" />
                      {post.mediaType === 'VIDEO' && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white text-xs font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur">
                            ▶ Video Stream
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-2.5">{post.caption}</p>
                    <p className="text-[11px] text-slate-500 mt-1">❤️ {post.likesCount.toLocaleString()} likes</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. ORGANIZATION PORTAL VIEW */}
        {/* ========================================================================= */}
        {currentUser.role === 'ORGANIZATION' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Host New Event Form */}
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center space-x-2 mb-4">
                <PlusCircle className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-white">Host New Event</h2>
              </div>
              <p className="text-xs text-slate-400 mb-6">
                Broadcast your company event to all nearby users based on geographic coordinates.
              </p>

              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Event Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Summer Music Carnival"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={newEventCategory}
                    onChange={(e) => setNewEventCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Music & Concerts">Music & Concerts</option>
                    <option value="Tech & Networking">Tech & Networking</option>
                    <option value="Sports & Fitness">Sports & Fitness</option>
                    <option value="Arts & Culture">Arts & Culture</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Venue Address / Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Moscone Center, San Francisco"
                    value={newEventVenue}
                    onChange={(e) => setNewEventVenue(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Ticket Price ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={newEventPrice}
                      onChange={(e) => setNewEventPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Total Capacity</label>
                    <input
                      type="number"
                      min="10"
                      value={newEventCapacity}
                      onChange={(e) => setNewEventCapacity(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition mt-2"
                >
                  Publish Event
                </button>
              </form>
            </div>

            {/* Managed Events & Analytics */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-2">Hosted Events & Live Ticket Sales</h2>
              <p className="text-xs text-slate-400 mb-6">Real-time attendee capacity and revenue breakdown.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <p className="text-xs text-slate-400">Total Hosted Events</p>
                  <p className="text-2xl font-bold text-white mt-1">{eventsList.length}</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <p className="text-xs text-slate-400">Tickets Booked</p>
                  <p className="text-2xl font-bold text-cyan-400 mt-1">231 Passes</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <p className="text-xs text-slate-400">Total Gross Sales</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">$4,970.00</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/80 text-xs text-slate-400 uppercase border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Event Title</th>
                      <th className="px-4 py-3">Venue</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Capacity</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {eventsList.map(e => (
                      <tr key={e.id} className="hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-semibold text-white">{e.title}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{e.venueName}</td>
                        <td className="px-4 py-3 font-bold text-white">{e.ticketPrice === 0 ? 'FREE' : `$${e.ticketPrice}`}</td>
                        <td className="px-4 py-3">{e.bookedSeats} / {e.totalCapacity}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            PUBLISHED
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. CELEBRITY PORTAL VIEW */}
        {/* ========================================================================= */}
        {currentUser.role === 'CELEBRITY' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-300">
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h2 className="text-lg font-bold text-white">{currentUser.name}</h2>
                    <CheckCircle className="w-4 h-4 text-cyan-400" />
                  </div>
                  <p className="text-xs text-slate-400">Verified Celebrity Creator • VIP Video Enabled</p>
                </div>
              </div>
              
              {/* Toggle Live Fan Connect Session */}
              <button
                onClick={() => setCelebLiveFanConnectActive(!celebLiveFanConnectActive)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                  celebLiveFanConnectActive
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>{celebLiveFanConnectActive ? 'Fan Connect LIVE (Active)' : 'Start Fan Connect Session'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Media Upload */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                <h3 className="font-bold text-white text-sm mb-3">Publish New Media Post</h3>
                <div className="border-2 border-dashed border-slate-800 rounded-xl p-6 text-center hover:border-slate-700 transition cursor-pointer mb-3">
                  <Star className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-300 font-medium">Click or Drag & Drop Photos or Videos</p>
                  <p className="text-[10px] text-slate-500 mt-1">Supports MP4, MOV, JPEG, PNG (Adaptive HLS)</p>
                </div>
                <input
                  type="text"
                  placeholder="Write a caption for your fans..."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white mb-3 focus:outline-none"
                />
                <button className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition">
                  Post to Celebrity Feed
                </button>
              </div>

              {/* VIP Call Revenue Breakdown */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm mb-3">VIP Calls & Fan Interactions</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs p-3 bg-slate-900 rounded-lg">
                      <span className="text-slate-400">Total VIP 1-on-1 Calls</span>
                      <strong className="text-white">142 Completed</strong>
                    </div>
                    <div className="flex justify-between items-center text-xs p-3 bg-slate-900 rounded-lg">
                      <span className="text-slate-400">Total Video Talk Time</span>
                      <strong className="text-white">486 Minutes</strong>
                    </div>
                    <div className="flex justify-between items-center text-xs p-3 bg-slate-900 rounded-lg">
                      <span className="text-slate-400">Creator Earnings (USD)</span>
                      <strong className="text-emerald-400">$3,645.00</strong>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs mt-4">
                  🔒 VIP Security: Only fans with an active Premium VIP subscription can request live video calls.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. CUSTOMER CARE SUPPORT VIEW */}
        {/* ========================================================================= */}
        {currentUser.role === 'SUPPORT' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                  <Headphones className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Customer Care Operator Console</h2>
                  <p className="text-xs text-slate-400">Handling live voice & chat inquiries from Users, Celebrities & Organizations</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold">
                Agent Status: ONLINE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Incoming Call Simulation */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                <h3 className="font-bold text-white text-sm mb-3">Live Support Call Queue</h3>
                {!supportConnected ? (
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white">Alex River (+19876543210)</span>
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">NORMAL USER</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">Topic: "Question regarding electronic music festival pass QR code verification"</p>
                    <button
                      onClick={() => setSupportConnected(true)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center space-x-2"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Accept Voice Call</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-2 text-emerald-400">
                      <Headphones className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-white text-sm">Active Support Call in Progress</h4>
                    <p className="text-xs text-emerald-400 mt-1">WebRTC 2-Way Voice Stream Active with Alex River</p>
                    <button
                      onClick={() => setSupportConnected(false)}
                      className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition"
                    >
                      Disconnect Call
                    </button>
                  </div>
                )}
              </div>

              {/* Support Policies & Tools */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                <h3 className="font-bold text-white text-sm">Quick Agent Resolution Actions</h3>
                <button className="w-full text-left text-xs p-3 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300 border border-slate-800">
                  🎟️ Resend Event Booking Confirmation SMS
                </button>
                <button className="w-full text-left text-xs p-3 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300 border border-slate-800">
                  🛡️ Escalate User Abuse Report to SuperAdmin
                </button>
                <button className="w-full text-left text-xs p-3 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300 border border-slate-800">
                  ⭐ Assist Celebrity Account Verification Request
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. SUPER ADMIN VIEW */}
        {/* ========================================================================= */}
        {currentUser.role === 'SUPERADMIN' && (
          <div className="space-y-6">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
                <p className="text-xs text-slate-400">Total Registered Users</p>
                <p className="text-2xl font-bold text-white mt-1">{usersList.length} Accounts</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
                <p className="text-xs text-slate-400">Active Live Video Calls</p>
                <p className="text-2xl font-bold text-cyan-400 mt-1">18 Streams</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
                <p className="text-xs text-slate-400">Published Events</p>
                <p className="text-2xl font-bold text-indigo-400 mt-1">{eventsList.length} Active</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
                <p className="text-xs text-slate-400">Platform Gross Volume</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">$12,480.00</p>
              </div>
            </div>

            {/* User Governance Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Platform Governance & User Moderation</h2>
                  <p className="text-xs text-slate-400">SuperAdmin controls to block, rate-limit, and verify platform participants.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/80 text-xs text-slate-400 uppercase border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">User Name</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Tier</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Admin Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {usersList.map(user => (
                      <tr key={user.id} className="hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-semibold text-white">{user.name}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{user.phone}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-indigo-300 border border-slate-700">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold ${user.tier === 'PREMIUM_VIP' ? 'text-amber-400' : 'text-slate-400'}`}>
                            {user.tier}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {user.isBlocked ? (
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                              BLOCKED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              ACTIVE
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleUserBlock(user.id)}
                            className={`px-3 py-1 rounded text-xs font-bold transition ${
                              user.isBlocked
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : 'bg-red-600/80 hover:bg-red-600 text-white'
                            }`}
                          >
                            {user.isBlocked ? 'Unblock User' : 'Block / Ban'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Ticket Booking Confirmation Modal */}
      {selectedEventForBooking && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">🎉 Ticket Booking Confirmed!</h3>
            <p className="text-xs text-slate-400 mb-4">{selectedEventForBooking.title}</p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center mb-4">
              <p className="text-xs text-slate-400">Digital Pass Verification Code</p>
              <p className="text-xl font-mono font-black text-cyan-400 mt-1">{bookingPass}</p>
              <div className="w-28 h-28 bg-white mx-auto mt-3 p-2 rounded-lg flex items-center justify-center text-slate-950 font-mono text-[9px] font-bold">
                [ QR CODE PASS ]
              </div>
            </div>
            <button
              onClick={() => setSelectedEventForBooking(null)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* VIP Paywall Modal */}
      {showVipModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">🔒 Exclusive VIP Video Feature</h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Direct 1-on-1 video calls with verified celebrities and access to the Celebrity Random Fan Connect pool is restricted to <strong>Premium VIP</strong> subscribers. Upgrade now!
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setUserTier('PREMIUM_VIP');
                  setShowVipModal(false);
                }}
                className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20"
              >
                Upgrade to VIP ($9.99/mo)
              </button>
              <button
                onClick={() => setShowVipModal(false)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Celebrity Video Call Connected Modal */}
      {celebVideoCallActive && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-3 animate-pulse">
              <Video className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-white text-base">VIP Video Call Connected</h3>
            <p className="text-xs text-cyan-400 mt-1">Live WebRTC Session with {celebVideoCallActive}</p>
            <button
              onClick={() => setCelebVideoCallActive(null)}
              className="mt-6 w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition"
            >
              End VIP Video Call
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
