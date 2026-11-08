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
  Sparkle,
  Compass,
  Film,
  Flame,
  Clock,
  ArrowRight
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

  // Section Sub-Navigation Tabs
  const [normalActiveTab, setNormalActiveTab] = useState<'CONNECT' | 'EVENTS' | 'CELEBRITIES' | 'SUPPORT'>('CONNECT');
  const [orgActiveTab, setOrgActiveTab] = useState<'MANAGE' | 'CREATE'>('MANAGE');
  const [celebActiveTab, setCelebActiveTab] = useState<'FEED' | 'LIVE_MEET' | 'REVENUE'>('FEED');
  const [adminActiveTab, setAdminActiveTab] = useState<'USERS' | 'ANALYTICS'>('USERS');

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
  const [eventSearchQuery, setEventSearchQuery] = useState<string>('');
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
    },
    {
      id: 'event-003',
      title: 'Bay Area Indie Film Showcase & Director Q&A',
      category: 'Arts & Culture',
      venueName: 'Castro Theatre, San Francisco',
      distanceKm: 4.2,
      ticketPrice: 18.5,
      totalCapacity: 250,
      bookedSeats: 198,
      startTime: 'Friday, 7:00 PM'
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
  const [userFilterRole, setUserFilterRole] = useState<string>('ALL');

  // 1. Session Persistence: Check localStorage on initial load
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
      setIsOtpSent(true);
      setAuthOtpCode('123456');
      return;
    }

    if (authOtpCode.trim() !== '123456') {
      setAuthErrorMessage('Invalid OTP code. Please enter 123456.');
      return;
    }

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
    setOrgActiveTab('MANAGE');
    alert('Event successfully published to nearby users!');
  };

  const toggleUserBlock = (userId: string) => {
    setUsersList(prev => prev.map(u => u.id === userId ? { ...u, isBlocked: !u.isBlocked } : u));
  };

  if (!isSessionRestored) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // =========================================================================
  // VIEW A: AUTHENTICATION SCREEN (When user is signed out)
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6">
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

        <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto py-8">
          {/* Sign In Form */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-black text-white">Sign In to Your Account</h2>
              <p className="text-xs text-slate-400 mt-1">
                You will only have access to features explicitly permitted for your account role.
              </p>
            </div>

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
              </form>
            )}

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

          {/* Quick Demo Logins */}
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

        <footer className="text-center text-xs text-slate-500 py-4 border-t border-slate-900">
          Friends App Multi-Platform Ecosystem • Android Native • iOS Native • Web Portals • WebRTC Engine
        </footer>
      </div>
    );
  }

  // =========================================================================
  // VIEW B: AUTHENTICATED PORTAL (Properly Organized into Dedicated Sections)
  // =========================================================================
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* Top Header */}
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
              {currentUser.role === 'NORMAL' && 'Normal User Workspace'}
              {currentUser.role === 'ORGANIZATION' && 'Organization Event Host Workspace'}
              {currentUser.role === 'CELEBRITY' && 'Celebrity Creator Studio'}
              {currentUser.role === 'SUPPORT' && 'Customer Care Desk Console'}
              {currentUser.role === 'SUPERADMIN' && 'Super Administrator Control Center'}
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

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {/* ========================================================================= */}
        {/* 1. NORMAL USER: PROPER SECTION TABS */}
        {/* ========================================================================= */}
        {currentUser.role === 'NORMAL' && (
          <div className="space-y-6">
            {/* Section Tab Navigation */}
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <button
                onClick={() => setNormalActiveTab('CONNECT')}
                className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center space-x-2 transition ${
                  normalActiveTab === 'CONNECT'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Radio className="w-4 h-4" />
                <span>Random Connect</span>
              </button>
              <button
                onClick={() => setNormalActiveTab('EVENTS')}
                className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center space-x-2 transition ${
                  normalActiveTab === 'EVENTS'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Ticket className="w-4 h-4" />
                <span>Events Near You ({eventsList.length})</span>
              </button>
              <button
                onClick={() => setNormalActiveTab('CELEBRITIES')}
                className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center space-x-2 transition ${
                  normalActiveTab === 'CELEBRITIES'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Star className="w-4 h-4" />
                <span>Celebrity Network</span>
              </button>
              <button
                onClick={() => setNormalActiveTab('SUPPORT')}
                className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center space-x-2 transition ${
                  normalActiveTab === 'SUPPORT'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Headphones className="w-4 h-4" />
                <span>Customer Care</span>
              </button>
            </div>

            {/* TAB 1: RANDOM CONNECT (Full Spacious Stage) */}
            {normalActiveTab === 'CONNECT' && (
              <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                      {callMode === 'VIDEO' ? <Video className="w-5 h-5 text-cyan-400" /> : <Radio className="w-5 h-5 text-indigo-400" />}
                      <span>{callMode === 'VIDEO' ? 'Random Video Connect' : 'Random Audio Connect'}</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Meet random friends online with instant full-duplex WebRTC streaming.
                    </p>
                  </div>

                  <span className="flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
                    58 Friends Online
                  </span>
                </div>

                {/* Mode Selector */}
                {matchingState === 'IDLE' && (
                  <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800 mb-6 max-w-sm mx-auto">
                    <button
                      onClick={() => setCallMode('VIDEO')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center space-x-2 transition ${
                        callMode === 'VIDEO' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Video className="w-4 h-4" />
                      <span>Live Video Match</span>
                    </button>
                    <button
                      onClick={() => setCallMode('AUDIO')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center space-x-2 transition ${
                        callMode === 'AUDIO' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Radio className="w-4 h-4" />
                      <span>Audio Only Match</span>
                    </button>
                  </div>
                )}

                {/* Stage Screen */}
                <div className="h-96 rounded-2xl bg-slate-950 border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center shadow-inner">
                  {matchingState === 'SEARCHING' && (
                    <div className="flex flex-col items-center justify-center">
                      <div className={`absolute w-44 h-44 rounded-full animate-ping ${callMode === 'VIDEO' ? 'bg-cyan-500/20' : 'bg-indigo-500/20'}`}></div>
                      <div className={`absolute w-32 h-32 rounded-full animate-pulse ${callMode === 'VIDEO' ? 'bg-cyan-500/30' : 'bg-indigo-500/30'}`}></div>
                      {callMode === 'VIDEO' ? <Video className="w-10 h-10 text-cyan-400 animate-spin" /> : <Radio className="w-10 h-10 text-indigo-400 animate-spin" />}
                      <p className="text-base font-bold text-white mt-6 z-10">
                        Searching for an online {callMode === 'VIDEO' ? 'video' : 'voice'} partner...
                      </p>
                      <p className="text-xs text-slate-400 mt-1 z-10">Please hold on, pairing you automatically</p>
                    </div>
                  )}

                  {matchingState === 'CONNECTED' && callMode === 'VIDEO' && (
                    <div className="w-full h-full relative flex flex-col justify-between p-4">
                      {!isSafetyBlurred ? (
                        <div className="w-full h-full rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
                          <div className="w-20 h-20 rounded-full bg-indigo-600/40 flex items-center justify-center mb-3 border border-indigo-400/40">
                            <Users className="w-10 h-10 text-cyan-300" />
                          </div>
                          <p className="text-lg font-bold text-white">{currentPartner}</p>
                          <p className="text-xs text-cyan-400 font-medium">WebRTC Full-Duplex Video (720p 30fps)</p>
                          <p className="text-xs text-slate-400 font-mono mt-2 bg-slate-950/80 px-3 py-1 rounded-full border border-slate-800">
                            Duration: {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
                          </p>
                        </div>
                      ) : (
                        <div className="w-full h-full rounded-xl bg-black/95 flex flex-col items-center justify-center p-6 text-center">
                          <EyeOff className="w-12 h-12 text-rose-500 mb-3" />
                          <p className="text-sm font-bold text-white">Video Feed Blurred by User</p>
                          <p className="text-xs text-slate-400 mt-1">Safety incident report dispatched to platform moderation desk</p>
                        </div>
                      )}

                      {/* PiP Self Preview */}
                      <div className="absolute top-6 right-6 w-32 h-44 rounded-xl bg-slate-800/95 border-2 border-cyan-400 flex flex-col items-center justify-center shadow-2xl backdrop-blur z-20">
                        {!isVideoMuted ? (
                          <>
                            <Camera className="w-6 h-6 text-cyan-300 mb-1.5" />
                            <span className="text-[11px] font-bold text-white">You (Self)</span>
                            <span className="text-[9px] text-slate-400">{isFrontCamera ? 'Front Camera' : 'Rear Camera'}</span>
                          </>
                        ) : (
                          <span className="text-xs font-bold text-rose-400">Camera Off</span>
                        )}
                      </div>
                    </div>
                  )}

                  {matchingState === 'CONNECTED' && callMode === 'AUDIO' && (
                    <div className="text-center z-10 animate-fade-in">
                      <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 p-1 mb-4">
                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                          <Users className="w-10 h-10 text-cyan-400" />
                        </div>
                      </div>
                      <h3 className="font-bold text-white text-lg">{currentPartner}</h3>
                      <p className="text-xs text-cyan-400 mt-1">Live WebRTC Audio Active</p>
                      <p className="text-xs text-slate-400 font-mono mt-3 bg-slate-950 px-3 py-1 rounded-full border border-slate-800 inline-block">
                        Duration: {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
                      </p>
                    </div>
                  )}

                  {matchingState === 'IDLE' && (
                    <div className="text-center p-6">
                      <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4 border border-slate-700">
                        {callMode === 'VIDEO' ? <Video className="w-9 h-9 text-cyan-400" /> : <PhoneCall className="w-9 h-9 text-indigo-400" />}
                      </div>
                      <p className="text-base font-bold text-white">
                        {callMode === 'VIDEO' ? 'Ready for Random Video Match?' : 'Ready for Random Audio Match?'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Connect with friendly people globally with one tap. High definition audio and video streams.
                      </p>
                    </div>
                  )}
                </div>

                {/* Control Action Bar */}
                <div className="mt-6 pt-4 border-t border-slate-800">
                  {matchingState === 'IDLE' && (
                    <button
                      onClick={handleStartSearch}
                      className={`w-full py-4 font-black rounded-xl shadow-xl transition flex items-center justify-center space-x-2 text-sm ${
                        callMode === 'VIDEO'
                          ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 text-slate-950 shadow-cyan-500/20'
                          : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 text-white shadow-indigo-600/20'
                      }`}
                    >
                      {callMode === 'VIDEO' ? <Video className="w-5 h-5" /> : <Radio className="w-5 h-5" />}
                      <span>{callMode === 'VIDEO' ? 'Start Random Video Match' : 'Start Random Audio Match'}</span>
                    </button>
                  )}

                  {matchingState === 'SEARCHING' && (
                    <button
                      onClick={() => setMatchingState('IDLE')}
                      className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition text-sm"
                    >
                      Cancel Search
                    </button>
                  )}

                  {matchingState === 'CONNECTED' && (
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`p-3.5 rounded-xl border transition ${
                          isMuted ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                        title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
                      >
                        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </button>

                      {callMode === 'VIDEO' && (
                        <>
                          <button
                            onClick={() => setIsFrontCamera(!isFrontCamera)}
                            className="p-3.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl hover:text-white transition"
                            title="Flip Camera"
                          >
                            <RefreshCw className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setIsVideoMuted(!isVideoMuted)}
                            className={`p-3.5 rounded-xl border transition ${
                              isVideoMuted ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-slate-800 border-slate-700 text-slate-300'
                            }`}
                            title={isVideoMuted ? 'Turn Cam On' : 'Turn Cam Off'}
                          >
                            {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                          </button>
                        </>
                      )}

                      <button
                        onClick={handleNextFriend}
                        className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center space-x-2 transition text-xs"
                      >
                        <FastForward className="w-4 h-4" />
                        <span>Next Friend</span>
                      </button>

                      {callMode === 'VIDEO' && (
                        <button
                          onClick={() => setIsSafetyBlurred(!isSafetyBlurred)}
                          className="p-3.5 bg-slate-800 hover:bg-rose-900/40 text-rose-400 border border-slate-700 rounded-xl transition"
                          title="Report & Blur Stream"
                        >
                          <AlertTriangle className="w-5 h-5" />
                        </button>
                      )}

                      <button
                        onClick={() => setMatchingState('IDLE')}
                        className="p-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition"
                        title="End Call"
                      >
                        <PhoneOff className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: EVENTS NEAR YOU (Spacious Full-Width Section) */}
            {normalActiveTab === 'EVENTS' && (
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                      <MapPin className="w-5 h-5 text-cyan-400" />
                      <span>Events Near You</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Showing published events around San Francisco, CA within your distance filter.
                    </p>
                  </div>

                  <div className="flex items-center space-x-4 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-300 whitespace-nowrap">
                      Radius: <strong className="text-cyan-400">{searchRadius} km</strong>
                    </span>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={searchRadius}
                      onChange={(e) => setSearchRadius(Number(e.target.value))}
                      className="w-36 accent-cyan-400 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Event Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {eventsList
                    .filter(e => e.distanceKm <= searchRadius)
                    .map(event => (
                      <div key={event.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition shadow-xl">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {event.category}
                            </span>
                            <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20">
                              {event.distanceKm} km away
                            </span>
                          </div>

                          <h3 className="text-lg font-bold text-white mb-2 leading-snug">{event.title}</h3>
                          <p className="text-xs text-slate-400 flex items-center mb-1">
                            <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-500 shrink-0" />
                            <span>{event.venueName}</span>
                          </p>
                          <p className="text-xs text-slate-400 mb-4 flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-500 shrink-0" />
                            <span>{event.startTime}</span>
                          </p>
                        </div>

                        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                          <div>
                            <p className="text-lg font-black text-white">
                              {event.ticketPrice === 0 ? 'FREE' : `$${event.ticketPrice.toFixed(2)}`}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {event.totalCapacity - event.bookedSeats} seats remaining
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedEventForBooking(event);
                              setBookingPass(`PASS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
                            }}
                            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl transition shadow"
                          >
                            Book Ticket
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* TAB 3: CELEBRITY NETWORK (Full Spacious Section) */}
            {normalActiveTab === 'CELEBRITIES' && (
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                      <Star className="w-5 h-5 text-amber-400" />
                      <span>Celebrity Creator Network</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Exclusive photos, video stream updates, and face-to-face VIP video sessions.
                    </p>
                  </div>

                  <button
                    onClick={() => setUserTier(userTier === 'FREE' ? 'PREMIUM_VIP' : 'FREE')}
                    className={`text-xs font-black px-4 py-2 rounded-xl border transition ${
                      userTier === 'PREMIUM_VIP'
                        ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 shadow'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {userTier === 'PREMIUM_VIP' ? '★ VIP ACTIVE' : 'FREE TIER (Click to Toggle)'}
                  </button>
                </div>

                {/* Celebrity Live Fan Connect Pool Banner */}
                {celebLiveFanConnectActive && (
                  <div className="bg-gradient-to-r from-cyan-950/70 via-slate-900 to-indigo-950/70 p-5 rounded-2xl border border-cyan-500/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="flex items-center text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-1.5 animate-pulse"></span>
                          LIVE NOW
                        </span>
                        <span className="text-xs text-slate-400">3 Minutes Per Lucky Fan</span>
                      </div>
                      <h3 className="text-base font-bold text-white">Elena Rostova is taking Random Video Calls!</h3>
                      <p className="text-xs text-slate-400">Enter the random fan video pool to meet Elena 1-on-1 on live video.</p>
                    </div>

                    <button
                      onClick={() => {
                        if (userTier === 'PREMIUM_VIP') {
                          setCelebVideoCallActive('Elena Rostova (Random Fan Connect Live)');
                        } else {
                          setShowVipModal(true);
                        }
                      }}
                      className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition shadow whitespace-nowrap"
                    >
                      Join Live Video Pool
                    </button>
                  </div>
                )}

                {/* Posts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {celebPosts.map(post => (
                    <div key={post.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center font-bold text-white text-sm shadow">
                            {post.celebName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-white text-sm">{post.celebName}</span>
                              <CheckCircle className="w-4 h-4 text-cyan-400" />
                            </div>
                            <span className="text-xs text-slate-500">{post.createdAt}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (userTier === 'PREMIUM_VIP') {
                              setCelebVideoCallActive(post.celebName);
                            } else {
                              setShowVipModal(true);
                            }
                          }}
                          className={`px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition ${
                            userTier === 'PREMIUM_VIP'
                              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                              : 'bg-slate-800 text-slate-300 hover:border-slate-600 border border-slate-700'
                          }`}
                        >
                          {userTier === 'PREMIUM_VIP' ? (
                            <>
                              <Video className="w-3.5 h-3.5" />
                              <span>1-on-1 VIP Video</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
                              <span>Unlock VIP Video</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="h-64 rounded-xl bg-slate-950 border border-slate-800/80 overflow-hidden relative flex items-center justify-center">
                        <img src={post.mediaUrl} alt={post.caption} className="w-full h-full object-cover" />
                        {post.mediaType === 'VIDEO' && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="text-white text-xs font-bold bg-white/20 px-4 py-1.5 rounded-full backdrop-blur">
                              ▶ Video Stream
                            </span>
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-slate-200 mt-3">{post.caption}</p>
                      <p className="text-xs text-slate-500 mt-1">❤️ {post.likesCount.toLocaleString()} likes</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: CUSTOMER SUPPORT (Dedicated Section) */}
            {normalActiveTab === 'SUPPORT' && (
              <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
                    <Headphones className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">24/7 Customer Care Desk</h2>
                    <p className="text-xs text-slate-400">Speak directly to an agent regarding tickets, accounts, or safety reports</p>
                  </div>
                </div>

                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 my-6">
                  {!supportConnected ? (
                    <div>
                      <p className="text-sm text-slate-300 mb-4">
                        Our support team is available via live voice audio stream. Click below to connect immediately to an active representative.
                      </p>
                      <button
                        onClick={() => setSupportConnected(true)}
                        className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center space-x-2 text-sm"
                      >
                        <PhoneCall className="w-4 h-4" />
                        <span>Connect to Live Support Specialist</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 animate-pulse">
                        <Headphones className="w-7 h-7" />
                      </div>
                      <h4 className="font-bold text-white text-base">Connected to Support Representative</h4>
                      <p className="text-xs text-emerald-400 mt-1">Live WebRTC Voice Channel Active with Sarah (Customer Care Desk)</p>
                      <button
                        onClick={() => setSupportConnected(false)}
                        className="mt-6 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition"
                      >
                        End Support Call
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. ORGANIZATION PORTAL: PROPER SECTION TABS */}
        {/* ========================================================================= */}
        {currentUser.role === 'ORGANIZATION' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <button
                onClick={() => setOrgActiveTab('MANAGE')}
                className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center space-x-2 transition ${
                  orgActiveTab === 'MANAGE'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Hosted Events & Sales ({eventsList.length})</span>
              </button>
              <button
                onClick={() => setOrgActiveTab('CREATE')}
                className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center space-x-2 transition ${
                  orgActiveTab === 'CREATE'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Publish New Event</span>
              </button>
            </div>

            {orgActiveTab === 'MANAGE' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                    <p className="text-xs text-slate-400">Total Hosted Events</p>
                    <p className="text-3xl font-black text-white mt-1">{eventsList.length}</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                    <p className="text-xs text-slate-400">Total Tickets Booked</p>
                    <p className="text-3xl font-black text-cyan-400 mt-1">429 Passes</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                    <p className="text-xs text-slate-400">Gross Ticket Volume</p>
                    <p className="text-3xl font-black text-emerald-400 mt-1">$8,640.00</p>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl overflow-hidden">
                  <h3 className="text-base font-bold text-white mb-4">Live Event Management & Attendee Capacity</h3>
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
                              <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
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

            {orgActiveTab === 'CREATE' && (
              <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-1">Publish New Company Event</h2>
                <p className="text-xs text-slate-400 mb-6">Broadcast event to all nearby users based on geographic coordinates.</p>

                <form onSubmit={handleCreateEvent} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Event Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Summer Music Carnival"
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                    <select
                      value={newEventCategory}
                      onChange={(e) => setNewEventCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
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
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Ticket Price ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={newEventPrice}
                        onChange={(e) => setNewEventPrice(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Total Capacity</label>
                      <input
                        type="number"
                        min="10"
                        value={newEventCapacity}
                        onChange={(e) => setNewEventCapacity(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition mt-4"
                  >
                    Publish Event to Nearby Users
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. CELEBRITY HUB: PROPER SECTION TABS */}
        {/* ========================================================================= */}
        {currentUser.role === 'CELEBRITY' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <button
                onClick={() => setCelebActiveTab('FEED')}
                className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center space-x-2 transition ${
                  celebActiveTab === 'FEED' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Film className="w-4 h-4" />
                <span>Media Studio & Posts</span>
              </button>
              <button
                onClick={() => setCelebActiveTab('LIVE_MEET')}
                className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center space-x-2 transition ${
                  celebActiveTab === 'LIVE_MEET' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Fan Connect Control Room</span>
              </button>
              <button
                onClick={() => setCelebActiveTab('REVENUE')}
                className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center space-x-2 transition ${
                  celebActiveTab === 'REVENUE' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Star className="w-4 h-4" />
                <span>VIP Earnings & Analytics</span>
              </button>
            </div>

            {celebActiveTab === 'FEED' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                  <h3 className="font-bold text-white text-base mb-3">Publish New Photo / Video Post</h3>
                  <div className="border-2 border-dashed border-slate-800 rounded-xl p-8 text-center hover:border-slate-700 transition cursor-pointer mb-4">
                    <Star className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-300 font-semibold">Click or Drag & Drop Photos or Videos</p>
                    <p className="text-[10px] text-slate-500 mt-1">Supports MP4, MOV, JPEG, PNG (Adaptive HLS)</p>
                  </div>
                  <input
                    type="text"
                    placeholder="Write a caption for your fans..."
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white mb-4 focus:outline-none"
                  />
                  <button className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition">
                    Post to Celebrity Feed
                  </button>
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  <h3 className="font-bold text-white text-base">Your Published Posts</h3>
                  {celebPosts.map(post => (
                    <div key={post.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow">
                      <div className="h-40 rounded-lg overflow-hidden relative mb-2">
                        <img src={post.mediaUrl} alt={post.caption} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-xs text-white font-medium">{post.caption}</p>
                      <p className="text-[10px] text-slate-500 mt-1">❤️ {post.likesCount} likes • {post.createdAt}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {celebActiveTab === 'LIVE_MEET' && (
              <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
                <div className="w-16 h-16 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-white">Live Fan Video Connect Session</h2>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto mb-6">
                  When enabled, you are placed live into the random video queue to meet your VIP fans directly for 3 minutes per interaction.
                </p>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 mb-6 flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">Fan Connect Status</p>
                    <p className="text-xs text-slate-400">{celebLiveFanConnectActive ? 'Actively Receiving Fan Video Calls' : 'Session Stopped'}</p>
                  </div>
                  <button
                    onClick={() => setCelebLiveFanConnectActive(!celebLiveFanConnectActive)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition ${
                      celebLiveFanConnectActive
                        ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {celebLiveFanConnectActive ? 'Session LIVE (Click to Stop)' : 'Start Fan Connect Session'}
                  </button>
                </div>
              </div>
            )}

            {celebActiveTab === 'REVENUE' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                  <p className="text-xs text-slate-400">Total VIP 1-on-1 Calls</p>
                  <p className="text-3xl font-black text-white mt-1">142 Calls</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                  <p className="text-xs text-slate-400">Total Video Talk Time</p>
                  <p className="text-3xl font-black text-cyan-400 mt-1">486 Mins</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                  <p className="text-xs text-slate-400">Creator Earnings (USD)</p>
                  <p className="text-3xl font-black text-emerald-400 mt-1">$3,645.00</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. CUSTOMER CARE OPERATOR CONSOLE */}
        {/* ========================================================================= */}
        {currentUser.role === 'SUPPORT' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Headphones className="w-5 h-5 text-cyan-400" />
                  <span>Customer Care Desk Console</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Handling live voice & chat inquiries from Users, Celebrities & Organizations</p>
              </div>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold">
                Agent Status: ONLINE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                <h3 className="font-bold text-white text-base mb-4">Incoming Support Voice Queue</h3>
                {!supportConnected ? (
                  <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-white">Alex River (+19876543210)</span>
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-bold">NORMAL USER</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">Topic: "Question regarding electronic music festival pass QR code verification"</p>
                    <button
                      onClick={() => setSupportConnected(true)}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center space-x-2 shadow"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Accept Voice Call</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-2 text-emerald-400">
                      <Headphones className="w-7 h-7" />
                    </div>
                    <h4 className="font-bold text-white text-base">Active Support Voice Channel</h4>
                    <p className="text-xs text-emerald-400 mt-1">WebRTC 2-Way Voice Stream Active with Alex River</p>
                    <button
                      onClick={() => setSupportConnected(false)}
                      className="mt-6 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition"
                    >
                      Disconnect Call
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-3">
                <h3 className="font-bold text-white text-base mb-2">Support Operator Tools</h3>
                <button className="w-full text-left text-xs p-3.5 bg-slate-950 hover:bg-slate-800/80 rounded-xl text-slate-300 border border-slate-800 transition">
                  🎟️ Resend Event Booking Pass via SMS
                </button>
                <button className="w-full text-left text-xs p-3.5 bg-slate-950 hover:bg-slate-800/80 rounded-xl text-slate-300 border border-slate-800 transition">
                  🛡️ Escalate User Safety Report to SuperAdmin
                </button>
                <button className="w-full text-left text-xs p-3.5 bg-slate-950 hover:bg-slate-800/80 rounded-xl text-slate-300 border border-slate-800 transition">
                  ⭐ Process Celebrity Verification Badge Application
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. SUPER ADMIN CONTROL CENTER: PROPER SECTION TABS */}
        {/* ========================================================================= */}
        {currentUser.role === 'SUPERADMIN' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <button
                onClick={() => setAdminActiveTab('USERS')}
                className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center space-x-2 transition ${
                  adminActiveTab === 'USERS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>User Governance & Moderation ({usersList.length})</span>
              </button>
              <button
                onClick={() => setAdminActiveTab('ANALYTICS')}
                className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center space-x-2 transition ${
                  adminActiveTab === 'ANALYTICS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Platform Analytics & System Health</span>
              </button>
            </div>

            {adminActiveTab === 'ANALYTICS' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                  <p className="text-xs text-slate-400">Total Registered Users</p>
                  <p className="text-3xl font-black text-white mt-1">{usersList.length} Accounts</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                  <p className="text-xs text-slate-400">Active Live Video Calls</p>
                  <p className="text-3xl font-black text-cyan-400 mt-1">18 Streams</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                  <p className="text-xs text-slate-400">Published Events</p>
                  <p className="text-3xl font-black text-indigo-400 mt-1">{eventsList.length} Active</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                  <p className="text-xs text-slate-400">Gross Platform Volume</p>
                  <p className="text-3xl font-black text-emerald-400 mt-1">$12,480.00</p>
                </div>
              </div>
            )}

            {adminActiveTab === 'USERS' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">Platform User Governance</h3>
                    <p className="text-xs text-slate-400">SuperAdmin controls to block, unblock, and manage permissions.</p>
                  </div>

                  {/* Filter by role */}
                  <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    {['ALL', 'NORMAL', 'ORGANIZATION', 'CELEBRITY', 'SUPPORT'].map(r => (
                      <button
                        key={r}
                        onClick={() => setUserFilterRole(r)}
                        className={`px-3 py-1 text-[11px] font-bold rounded-lg transition ${
                          userFilterRole === r ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
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
                        <th className="px-4 py-3">Moderation Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {usersList
                        .filter(u => userFilterRole === 'ALL' || u.role === userFilterRole)
                        .map(user => (
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
                                <span className="px-2.5 py-1 rounded text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                  BLOCKED
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  ACTIVE
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => toggleUserBlock(user.id)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                                  user.isBlocked
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                    : 'bg-rose-600/80 hover:bg-rose-600 text-white'
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
            )}
          </div>
        )}
      </main>

      {/* Booking Pass Modal */}
      {selectedEventForBooking && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
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

      {/* Celebrity Video Call Modal */}
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
