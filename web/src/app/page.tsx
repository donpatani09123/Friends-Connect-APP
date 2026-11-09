'use client';

import React, { useState, useEffect, useRef } from 'react';

// Seed user database matching Vibzz specification
type Role = 'user' | 'org' | 'celebrity' | 'support' | 'admin';

interface UserRecord {
  r: Role;
  n: string;
}

interface Session {
  token: string;
  role: Role;
  phone: string;
  name: string;
  premium: boolean;
}

const SEED_USERS: Record<string, UserRecord> = {
  '9111111111': { r: 'user', n: 'Anita Joseph' },
  '9222222222': { r: 'org', n: 'Marine Drive Events' },
  '9333333333': { r: 'celebrity', n: 'Riya Menon' },
  '9000000001': { r: 'support', n: 'Support Agent' },
  '9000000002': { r: 'admin', n: 'Admin' },
};

const COUNTRY_CODES = ['+91', '+1', '+44', '+971', '+65'];

const PFX: Record<Role, string> = {
  user: 'app',
  org: 'org',
  celebrity: 'celebrity',
  support: 'support',
  admin: 'admin',
};

const NAV_ITEMS: Record<Role, [string, string][]> = {
  user: [
    ['match', 'Voice & Video Match'],
    ['events', 'Events'],
    ['vip', 'Celebrities'],
  ],
  org: [
    ['dash', 'Dashboard'],
    ['studio', 'Event Studio'],
    ['attendees', 'Attendees'],
  ],
  celebrity: [
    ['studio', 'Creator Studio'],
    ['queue', 'Call Queue'],
  ],
  support: [
    ['desk', 'Help Desk'],
  ],
  admin: [
    ['overview', 'Overview'],
    ['users', 'Users'],
    ['approvals', 'Approvals'],
  ],
};

const INITIAL_EVENTS = [
  {
    title: 'Backwater Sunset Jam',
    time: '12 Dec · 6:00 PM',
    venue: 'Fort Kochi Beach',
    org: 'Marine Drive Events',
    prices: [499, 899, 1499],
  },
  {
    title: 'Stand-up Night',
    time: '15 Dec · 8:00 PM',
    venue: 'Lulu Convention, Edappally',
    org: 'Laugh Lab',
    prices: [299, 599, 999],
  },
  {
    title: 'Startup Meetup Kochi',
    time: '20 Dec · 10:00 AM',
    venue: 'Infopark Phase 2',
    org: 'Kerala Startups',
    prices: [0, 250, 500],
  },
];

const TIERS = ['General', 'Silver', 'Gold'];

const CELEBRITIES = [
  {
    name: 'Riya Menon',
    tag: 'Actor',
    caption: 'Behind the scenes from today’s shoot 🎬',
    type: 'Reel',
    rate: 150,
  },
  {
    name: 'Arjun Das',
    tag: 'Musician',
    caption: 'Studio session — new single soon.',
    type: 'Photo',
    rate: 200,
  },
  {
    name: 'Meera Nair',
    tag: 'Athlete',
    caption: 'Morning training, no days off.',
    type: 'Reel',
    rate: 120,
  },
];

export default function VibzzApp() {
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [route, setRoute] = useState<string>('home');
  const [regDb, setRegDb] = useState<Record<string, UserRecord>>(SEED_USERS);

  // Auth inputs
  const [phoneCountry, setPhoneCountry] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupRole, setSignupRole] = useState<Role>('user');
  const [otpValue, setOtpValue] = useState('');

  // Pending OTP state
  const [pendingOtp, setPendingOtp] = useState<{
    phone: string;
    mode: 'login' | 'signup' | 'staff';
    name: string;
    role: Role;
  } | null>(null);

  // UI Modals & Toasts
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [modalType, setModalType] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  // Matchmaking State
  const [isSearching, setIsSearching] = useState(false);
  const [matchMode, setMatchMode] = useState<'Voice' | 'Video'>('Voice');
  const [activeCall, setActiveCall] = useState<{
    name: string;
    type: 'Voice' | 'Video';
    duration: number;
    muted: boolean;
    speaker: boolean;
    camOff: boolean;
  } | null>(null);

  // Event Booking Modal State
  const [bookEventIndex, setBookEventIndex] = useState(0);
  const [bookTier, setBookTier] = useState(0);
  const [bookSeats, setBookSeats] = useState(1);

  // Creator availability
  const [creatorOnline, setCreatorOnline] = useState(true);

  // Support Desk state
  const [selectedTicket, setSelectedTicket] = useState(0);
  const [chatMessages, setChatMessages] = useState<Record<number, { text: string; me: boolean }[]>>({
    0: [
      { text: 'Hi, I paid for the Gold ticket but haven’t received the confirmation SMS.', me: false },
      { text: 'Hello Anita! Let me look into your transaction right away.', me: true },
    ],
    1: [
      { text: 'I cannot connect to the voice match room on cellular network.', me: false },
      { text: 'Checking your connection logs now.', me: true },
    ],
    2: [
      { text: 'Requesting refund for the postponed music festival.', me: false },
    ],
  });
  const [replyInput, setReplyInput] = useState('');

  // Admin users state
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userList, setUserList] = useState<[string, string][]>([
    ['Anita Joseph', 'Member'],
    ['Marine Drive Events', 'Organizer'],
    ['Riya Menon', 'Creator'],
    ['Sam Philip', 'Member'],
    ['Support Agent', 'Support'],
  ]);

  // Toast timer
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMsg(null);
    }, 2400);
  };

  // Initialize from localStorage
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('huddle');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.reg) setRegDb(parsed.reg);
        if (parsed.s && parsed.s.role && PFX[parsed.s.role as Role]) {
          const userRole = parsed.s.role as Role;
          setSession(parsed.s);
          const initialHash = window.location.hash.slice(1);
          if (initialHash && !['home', 'login', 'signup', 'staff'].includes(initialHash)) {
            setRoute(initialHash);
          } else {
            setRoute(`${PFX[userRole]}-${NAV_ITEMS[userRole][0][0]}`);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    const handleHash = () => {
      const hash = window.location.hash.slice(1);
      if (hash) setRoute(hash);
    };

    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Save session updates
  const saveSession = (s: Session | null, newReg?: Record<string, UserRecord>) => {
    setSession(s);
    try {
      localStorage.setItem('huddle', JSON.stringify({
        s,
        reg: newReg || regDb,
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const navigateTo = (targetRoute: string) => {
    setAccountMenuOpen(false);
    window.location.hash = targetRoute;
    setRoute(targetRoute);
  };

  // Active call timer
  useEffect(() => {
    if (activeCall) {
      callTimerRef.current = setInterval(() => {
        setActiveCall((prev) => prev ? { ...prev, duration: prev.duration + 1 } : null);
      }, 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [activeCall !== null]);

  // Close menus on outer click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dd')) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  if (!mounted) return null;

  // Sign out handler
  const handleSignOut = () => {
    saveSession(null);
    setAccountMenuOpen(false);
    navigateTo('login');
    showToast('Signed out successfully');
  };

  // OTP handlers
  const handleSendOtp = (mode: 'login' | 'signup' | 'staff') => {
    const p = phoneNumber.replace(/\D/g, '');
    if (p.length < 7) {
      showToast('Enter a valid mobile number');
      return;
    }
    if (mode === 'signup' && !signupName.trim()) {
      showToast('Enter your name');
      return;
    }

    const existing = regDb[p];
    const isStaff = existing && ['support', 'admin'].includes(existing.r);

    if (mode === 'login' && (!existing || isStaff)) {
      showToast('No account found. Please sign up.');
      return;
    }
    if (mode === 'staff' && !isStaff) {
      showToast('Not a staff number');
      return;
    }
    if (mode === 'signup' && existing) {
      showToast('Number already registered. Log in instead.');
      return;
    }

    setPendingOtp({
      phone: p,
      mode,
      name: mode === 'signup' ? signupName.trim() : existing.n,
      role: mode === 'signup' ? signupRole : existing.r,
    });
    setOtpValue('');
    setModalType('otp');
  };

  const handleVerifyOtp = () => {
    if (!/^\d{6}$/.test(otpValue)) {
      showToast('Enter all 6 digits');
      return;
    }
    if (!pendingOtp) return;

    let updatedReg = { ...regDb };
    if (pendingOtp.mode === 'signup') {
      updatedReg[pendingOtp.phone] = { r: pendingOtp.role, n: pendingOtp.name };
      setRegDb(updatedReg);
    }

    const newSession: Session = {
      token: 'tk' + Date.now(),
      role: pendingOtp.role,
      phone: pendingOtp.phone,
      name: pendingOtp.name,
      premium: false,
    };

    saveSession(newSession, updatedReg);
    setModalType(null);
    setPendingOtp(null);
    setPhoneNumber('');
    setSignupName('');

    const defaultRoute = `${PFX[newSession.role]}-${NAV_ITEMS[newSession.role][0][0]}`;
    navigateTo(defaultRoute);
    showToast(`Welcome ${newSession.name}!`);
  };

  // Matchmaking simulation
  const handleStartMatch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setActiveCall({
        name: 'Random Friend (Kochi)',
        type: matchMode,
        duration: 0,
        muted: false,
        speaker: true,
        camOff: false,
      });
    }, 2400);
  };

  // VIP direct call
  const handleVipCall = (celebIndex: number, type: 'Voice' | 'Video') => {
    const celeb = CELEBRITIES[celebIndex];
    if (!session?.premium) {
      setModalType('go_premium');
      return;
    }
    setActiveCall({
      name: celeb.name,
      type,
      duration: 0,
      muted: false,
      speaker: true,
      camOff: false,
    });
  };

  // Booking action
  const handleOpenBooking = (index: number) => {
    setBookEventIndex(index);
    setBookTier(0);
    setBookSeats(1);
    setModalType('booking');
  };

  // Support desk reply
  const handleSendReply = () => {
    if (!replyInput.trim()) return;
    setChatMessages((prev) => ({
      ...prev,
      [selectedTicket]: [
        ...(prev[selectedTicket] || []),
        { text: replyInput.trim(), me: true },
      ],
    }));
    setReplyInput('');
  };

  // --- BRAND LOGO COMPONENT ---
  const BrandLogo = () => (
    <span className="brand cursor-pointer" onClick={() => navigateTo(session ? `${PFX[session.role]}-${NAV_ITEMS[session.role][0][0]}` : 'home')}>
      <svg width="32" height="32" viewBox="0 0 32 32" role="img" aria-label="Vibzz logo">
        <rect width="32" height="32" rx="9" fill="#8b5cf6" />
        <rect x="6" y="11" width="3.6" height="10" rx="1.8" fill="#fff" />
        <rect x="11.5" y="6" width="3.6" height="20" rx="1.8" fill="#fff" />
        <rect x="17" y="9" width="3.6" height="14" rx="1.8" fill="#fff" />
        <rect x="22.5" y="12" width="3.6" height="8" rx="1.8" fill="#fff" />
      </svg>
      Vibzz
    </span>
  );

  // Metric Box helper
  const MetricCard = ({ label, value }: { label: string; value: string }) => (
    <div className="cd">
      <div className="mu text-xs mb-1 font-medium">{label}</div>
      <div className="big">{value}</div>
    </div>
  );

  // -------------------------------------------------------------
  // PUBLIC SCREENS (Not signed in)
  // -------------------------------------------------------------
  if (!session) {
    const PublicHeader = () => (
      <header className="row sp wrap" style={{ padding: '16px 20px', borderBottom: '1px solid var(--ln)' }}>
        <BrandLogo />
        <div className="row">
          <button className="btn g s" onClick={() => navigateTo('login')}>
            Log in
          </button>
          <button className="btn s" onClick={() => navigateTo('signup')}>
            Get started
          </button>
        </div>
      </header>
    );

    const PhoneInput = () => (
      <div className="row">
        <select
          className="in"
          value={phoneCountry}
          onChange={(e) => setPhoneCountry(e.target.value)}
          style={{ width: '92px' }}
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          className="in"
          type="tel"
          inputMode="numeric"
          placeholder="Mobile number"
          maxLength={12}
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
      </div>
    );

    return (
      <div>
        <PublicHeader />

        {/* HOME LANDING */}
        {route === 'home' && (
          <div className="wrap">
            <div className="hero">
              <span className="pill ac">Voice · Events · Creators</span>
              <h1 style={{ marginTop: '18px' }}>
                Real voices.<br /><em>Real connections.</em>
              </h1>
              <p className="mu" style={{ maxWidth: '520px', margin: '0 auto 24px' }}>
                Vibzz lets you meet someone new in a voice or video chat, find events near you, and talk directly with the creators you follow.
              </p>
              <button className="btn" onClick={() => navigateTo('signup')}>
                Create free account
              </button>
            </div>

            <div className="grid">
              {[
                ['Random Voice & Video Match', 'One tap connects you with a friendly person for a live audio/video chat.'],
                ['Local Events', 'Browse and book tickets for cultural gigs and tech events near you.'],
                ['VIP Connect', 'Premium members can call verified celebrities directly.'],
                ['For Organizers', 'Create events, track live ticket sales and check guests in with ease.'],
                ['For Creators', 'Share reels and photos and earn from direct VIP calls.'],
                ['Safe by Design', 'Verified profiles, community guidelines and moderation around the clock.'],
              ].map(([title, desc], i) => (
                <div key={i} className="cd">
                  <h3>{title}</h3>
                  <p className="mu" style={{ margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>

            <div className="row sp" style={{ padding: '40px 0 20px', borderTop: '1px solid var(--ln)', marginTop: '50px' }}>
              <span className="mu">© 2026 Vibzz</span>
              <button className="mu text-xs bg-transparent border-0 cursor-pointer hover:text-slate-100" onClick={() => navigateTo('staff')}>
                Staff Sign In
              </button>
            </div>
          </div>
        )}

        {/* LOGIN SCREEN */}
        {route === 'login' && (
          <div className="auth">
            <div className="cd">
              <h2>Welcome back</h2>
              <p className="mu" style={{ margin: 0 }}>Sign in with your registered mobile number.</p>
              <PhoneInput />
              <button className="btn" onClick={() => handleSendOtp('login')}>
                Send OTP
              </button>
              <p className="mu" style={{ margin: 0, fontSize: '13px' }}>
                New here?{' '}
                <button
                  className="bg-transparent border-0 p-0 font-medium cursor-pointer"
                  style={{ color: 'var(--ac)' }}
                  onClick={() => navigateTo('signup')}
                >
                  Create an account
                </button>
              </p>
              <div className="cd p-3 mt-2" style={{ background: 'rgba(255,255,255,0.02)', fontSize: '12px' }}>
                <b className="block mb-1 text-slate-300">Quick Demo Accounts:</b>
                <div className="flex flex-col gap-1 mu">
                  <div>• Member: <span className="text-slate-200">9111111111</span> (Anita)</div>
                  <div>• Organizer: <span className="text-slate-200">9222222222</span> (Marine Drive)</div>
                  <div>• Creator: <span className="text-slate-200">9333333333</span> (Riya Menon)</div>
                  <div className="text-xs text-purple-400 mt-1">Any 6-digit OTP works (e.g. 123456)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SIGNUP SCREEN */}
        {route === 'signup' && (
          <div className="auth">
            <div className="cd">
              <h2>Create your account</h2>
              <div style={{ display: 'grid', gap: '8px' }}>
                {[
                  ['user', 'Member', 'Meet people, join events, call creators'],
                  ['org', 'Organizer', 'Host events and sell tickets'],
                  ['celebrity', 'Creator', 'Share media and take VIP calls'],
                ].map(([r, title, desc]) => (
                  <div
                    key={r}
                    className={`sel ${signupRole === r ? 'on' : ''}`}
                    onClick={() => setSignupRole(r as Role)}
                  >
                    <b>{title}</b>
                    <div className="mu" style={{ fontSize: '13px' }}>{desc}</div>
                  </div>
                ))}
              </div>
              <input
                className="in"
                placeholder="Full name or organization"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
              />
              <PhoneInput />
              <button className="btn" onClick={() => handleSendOtp('signup')}>
                Send OTP
              </button>
              <p className="mu" style={{ margin: 0, fontSize: '13px' }}>
                Have an account?{' '}
                <button
                  className="bg-transparent border-0 p-0 font-medium cursor-pointer"
                  style={{ color: 'var(--ac)' }}
                  onClick={() => navigateTo('login')}
                >
                  Log in
                </button>
              </p>
            </div>
          </div>
        )}

        {/* STAFF SCREEN */}
        {route === 'staff' && (
          <div className="auth">
            <div className="cd">
              <h2>Staff sign in</h2>
              <p className="mu" style={{ margin: 0 }}>For support agents and platform administrators only.</p>
              <PhoneInput />
              <button className="btn" onClick={() => handleSendOtp('staff')}>
                Send OTP
              </button>
              <div className="cd p-3 mt-2" style={{ background: 'rgba(255,255,255,0.02)', fontSize: '12px' }}>
                <b className="block mb-1 text-slate-300">Staff Credentials:</b>
                <div className="flex flex-col gap-1 mu">
                  <div>• Support Agent: <span className="text-slate-200">9000000001</span></div>
                  <div>• SuperAdmin: <span className="text-slate-200">9000000002</span></div>
                  <div className="text-xs text-purple-400 mt-1">Any 6-digit OTP works</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OTP MODAL */}
        {modalType === 'otp' && pendingOtp && (
          <div className="mod" onClick={(e) => { if (e.target === e.currentTarget) setModalType(null); }}>
            <div className="cd">
              <h3>Verify OTP</h3>
              <p className="mu" style={{ margin: 0 }}>
                Enter the 6-digit code sent to {phoneCountry} {pendingOtp.phone}
              </p>
              <input
                className="in otp"
                inputMode="numeric"
                maxLength={6}
                placeholder="······"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                autoFocus
              />
              <button className="btn" onClick={handleVerifyOtp}>
                Verify &amp; continue
              </button>
              <button className="btn g" onClick={() => setModalType(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* TOAST */}
        {toastMsg && (
          <div id="toast" style={{ display: 'block' }}>
            {toastMsg}
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // AUTHENTICATED APP SHELL
  // -------------------------------------------------------------
  const role = session.role;
  const currentTab = route.split('-')[1] || NAV_ITEMS[role][0][0];

  return (
    <div className="shell">
      {/* SIDEBAR (Sticky on desktop, Bottom nav on mobile) */}
      <nav className="side">
        <div className="lg" style={{ padding: '6px 14px 18px' }}>
          <BrandLogo />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          {NAV_ITEMS[role].map(([id, label]) => {
            const path = `${PFX[role]}-${id}`;
            const isActive = currentTab === id;
            return (
              <a
                key={id}
                href={`#${path}`}
                className={isActive ? 'on' : ''}
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo(path);
                }}
              >
                {label}
              </a>
            );
          })}
        </div>
      </nav>

      {/* MAIN CONTAINER */}
      <div className="min-w-0">
        {/* TOP BAR */}
        <header className="top">
          {role === 'user' ? (
            <>
              <span className="pill">📍 Kochi, IN</span>
              <input
                className="in sr"
                placeholder="Search events, people, creators"
                style={{ maxWidth: '340px' }}
              />
              <span style={{ flex: 1 }} />
              <button
                className="btn g s"
                onClick={() => showToast('No new notifications')}
                title="Notifications"
              >
                🔔
              </button>
              <span className={`pill ${session.premium ? 'ac' : ''}`}>
                {session.premium ? '⭐ Premium' : 'Free'}
              </span>
            </>
          ) : (
            <b style={{ flex: 1, fontSize: '17px' }}>
              {{
                org: 'Organizer Portal',
                celebrity: 'Creator Studio & Control Room',
                support: 'Customer Care Desk',
                admin: 'SuperAdmin Governance',
              }[role]}
            </b>
          )}

          {/* USER PROFILE DROPDOWN */}
          <div className="dd">
            <button
              className="btn g s"
              onClick={() => setAccountMenuOpen(!accountMenuOpen)}
            >
              {session.name || 'Account'} ▾
            </button>
            {accountMenuOpen && (
              <div className="menu" style={{ display: 'block' }}>
                <div className="p-2 border-b border-slate-700/60 text-xs mu">
                  <div>Logged in as:</div>
                  <div className="font-semibold text-slate-200 truncate">{session.name}</div>
                  <div className="capitalize text-purple-400 font-medium">{role}</div>
                </div>
                {role === 'user' && !session.premium && (
                  <button
                    onClick={() => {
                      setAccountMenuOpen(false);
                      setModalType('go_premium');
                    }}
                    style={{ color: 'var(--ac)', fontWeight: 600 }}
                  >
                    ⭐ Upgrade to Premium
                  </button>
                )}
                {role === 'user' && (
                  <button onClick={() => showToast('Settings coming soon')}>
                    Settings
                  </button>
                )}
                <button
                  onClick={handleSignOut}
                  style={{ color: 'var(--dn)' }}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* MAIN BODY VIEWS */}
        <main className="main">
          {/* 1. USER VIEWS */}
          {role === 'user' && currentTab === 'match' && (
            <div className="cd" style={{ textAlign: 'center', maxWidth: '620px', margin: 'auto' }}>
              <h2>Random Matchmaking</h2>
              <p className="mu mb-4">Connect with friendly people live in audio or high-definition video.</p>

              {/* Mode Toggle */}
              <div className="row sp justify-center gap-3 mb-6">
                <button
                  className={`btn s ${matchMode === 'Voice' ? '' : 'g'}`}
                  onClick={() => setMatchMode('Voice')}
                >
                  🎙 Voice Only
                </button>
                <button
                  className={`btn s ${matchMode === 'Video' ? '' : 'g'}`}
                  onClick={() => setMatchMode('Video')}
                >
                  📹 Live Video
                </button>
              </div>

              {/* Radar Component */}
              <div className={`radar ${isSearching ? 'on' : ''}`}>
                <i />
                <i />
                <i />
                <div className="dot">
                  {matchMode === 'Voice' ? '🎙' : '📹'}
                </div>
              </div>

              <p className="mu" style={{ margin: '14px 0' }}>
                {isSearching
                  ? `Looking for an active ${matchMode.toLowerCase()} partner…`
                  : `Tap below to meet someone new in ${matchMode.toLowerCase()} right now.`}
              </p>

              <button
                className="btn"
                disabled={isSearching}
                onClick={handleStartMatch}
              >
                {isSearching ? 'Searching network…' : 'Find a friend'}
              </button>
            </div>
          )}

          {role === 'user' && currentTab === 'events' && (
            <div>
              <div className="row sp mb-4">
                <h2>Events near Kochi</h2>
                <span className="pill ac">GPS: 9.9312° N, 76.2673° E</span>
              </div>
              <div className="grid">
                {INITIAL_EVENTS.map((e, i) => (
                  <div key={i} className="cd">
                    <div className="media">
                      <span className="text-xl">🎟 {e.title}</span>
                    </div>
                    <h3>{e.title}</h3>
                    <div className="mu" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                      📅 {e.time}<br />
                      📍 {e.venue}<br />
                      🎪 Hosted by {e.org}
                    </div>
                    <div className="row sp" style={{ marginTop: '14px' }}>
                      <b>{e.prices[0] ? `from ₹${e.prices[0]}` : 'Free Entry'}</b>
                      <button className="btn s" onClick={() => handleOpenBooking(i)}>
                        Book Ticket
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {role === 'user' && currentTab === 'vip' && (
            <div style={{ maxWidth: '580px', margin: 'auto' }}>
              <div className="row sp mb-4">
                <h2>Celebrity Feed &amp; Direct VIP</h2>
                {session.premium && <span className="pill ac">⭐ VIP Direct Active</span>}
              </div>

              {CELEBRITIES.map((c, i) => (
                <div key={i} className="cd" style={{ marginBottom: '16px' }}>
                  <div className="row sp">
                    <div className="row">
                      <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold">
                        {c.name[0]}
                      </div>
                      <div>
                        <b>{c.name} <span style={{ color: 'var(--ac)' }}>✔</span></b>
                        <div className="text-xs mu">₹{c.rate}/min VIP Rate</div>
                      </div>
                    </div>
                    <span className="pill">{c.tag}</span>
                  </div>

                  <div className="media" style={{ marginTop: '12px' }}>
                    <div className="text-center">
                      <div className="text-2xl mb-1">{c.type === 'Reel' ? '🎬' : '📷'}</div>
                      <div className="text-sm font-semibold">{c.type} Broadcast</div>
                    </div>
                  </div>

                  <p style={{ margin: '0 0 14px', fontSize: '14px' }}>{c.caption}</p>

                  <div className="row">
                    <button
                      className="btn g s"
                      onClick={() => handleVipCall(i, 'Voice')}
                    >
                      📞 Audio Call
                    </button>
                    <button
                      className="btn s"
                      onClick={() => handleVipCall(i, 'Video')}
                    >
                      🎥 Video Call
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. ORGANIZER VIEWS */}
          {role === 'org' && currentTab === 'dash' && (
            <div>
              <h2>Host Dashboard</h2>
              <div className="grid" style={{ marginBottom: '16px' }}>
                <MetricCard label="Active events" value="4" />
                <MetricCard label="Tickets sold" value="1,286" />
                <MetricCard label="Revenue" value="₹6.4L" />
              </div>

              <div className="cd">
                <h3>Revenue Trend (last 7 months)</h3>
                <div className="bars">
                  {[40, 55, 48, 70, 62, 85, 100].map((v, i) => (
                    <div key={i} style={{ height: `${v}%` }} title={`Month ${i + 1}: ${v}%`} />
                  ))}
                </div>
                <div className="row sp mu text-xs mt-3">
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Aug</span>
                  <span>Sep</span>
                  <span>Oct</span>
                  <span>Nov</span>
                </div>
              </div>
            </div>
          )}

          {role === 'org' && currentTab === 'studio' && (
            <div>
              <h2>Event Studio</h2>
              <div className="cd" style={{ display: 'grid', gap: '14px', maxWidth: '640px' }}>
                <input className="in" placeholder="Event title" defaultValue="Kochi Indie Music Fest" />
                <select className="in" defaultValue="Music">
                  <option>Music</option>
                  <option>Comedy</option>
                  <option>Tech &amp; Startup</option>
                  <option>Sports</option>
                </select>
                <div>
                  <div className="text-xs mu mb-1">Banner &amp; Promo Media</div>
                  <input className="in" type="file" multiple accept="image/*,video/*" />
                </div>
                <div className="row">
                  <input className="in" placeholder="Venue / location" defaultValue="Marine Drive Ground, Kochi" />
                  <button className="btn g s" onClick={() => showToast('Location verified via GPS')}>
                    📍 Pick
                  </button>
                </div>
                <div className="row">
                  <input className="in" type="datetime-local" />
                  <input className="in" type="number" placeholder="Total Capacity" defaultValue="500" />
                </div>
                <div>
                  <b className="block mb-2 text-sm">Tier pricing (₹)</b>
                  <div className="row">
                    <input className="in" placeholder="General" defaultValue="499" />
                    <input className="in" placeholder="Silver" defaultValue="899" />
                    <input className="in" placeholder="Gold" defaultValue="1499" />
                  </div>
                </div>
                <button className="btn" onClick={() => showToast('Event submitted for moderation review ✔')}>
                  Publish event
                </button>
              </div>
            </div>
          )}

          {role === 'org' && currentTab === 'attendees' && (
            <div>
              <h2>Attendees &amp; Verification</h2>
              <div className="grid" style={{ marginBottom: '16px' }}>
                <div className="cd" style={{ display: 'grid', gap: '12px' }}>
                  <h3>Check-in scanner</h3>
                  <div className="scan" />
                  <div className="row">
                    <input className="in" placeholder="Ticket code (e.g. HD-1042)" />
                    <button className="btn s" onClick={() => showToast('Ticket checked in ✔')}>
                      Check in
                    </button>
                  </div>
                </div>
                <MetricCard label="Checked in" value="312 / 480" />
              </div>

              <div className="cd" style={{ overflow: 'auto' }}>
                <div className="row sp mb-3">
                  <h3>Tickets Issued</h3>
                  <button className="btn g s" onClick={() => showToast('CSV exported to Downloads')}>
                    Export CSV
                  </button>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Tier</th>
                      <th>Ticket Code</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Anita J.', 'Gold', 'HD-1042', 'In'],
                      ['Sam P.', 'General', 'HD-1043', 'Pending'],
                      ['Leena K.', 'Silver', 'HD-1044', 'In'],
                      ['Rahul M.', 'Gold', 'HD-1045', 'Pending'],
                    ].map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j}>
                            {j === 3 ? (
                              <span className={`pill ${cell === 'In' ? 'ac' : ''}`}>{cell}</span>
                            ) : (
                              cell
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. CREATOR VIEWS */}
          {role === 'celebrity' && currentTab === 'studio' && (
            <div>
              <h2>Creator Studio</h2>
              <div className="cd" style={{ display: 'grid', gap: '14px', maxWidth: '580px' }}>
                <div>
                  <div className="text-xs mu mb-1">Upload Reel or Photo</div>
                  <input className="in" type="file" accept="image/*,video/*" />
                </div>
                <textarea
                  className="in"
                  rows={3}
                  placeholder="Write a caption for your fans…"
                  defaultValue="New soundtrack drops tonight at 9 PM! Connect on VIP call to hear a sneak peek 🎶"
                />
                <select className="in">
                  <option>Visible to everyone</option>
                  <option>Premium members only</option>
                </select>
                <button className="btn" onClick={() => showToast('Posted to your feed ✔')}>
                  Post
                </button>
              </div>
            </div>
          )}

          {role === 'celebrity' && currentTab === 'queue' && (
            <div style={{ maxWidth: '620px' }}>
              <div className="row sp mb-4">
                <h2>VIP Call Requests</h2>
                <div className="row">
                  <span className="mu text-sm">{creatorOnline ? 'Available for calls' : 'Busy'}</span>
                  <button
                    className={`tg ${creatorOnline ? 'on' : ''}`}
                    onClick={() => {
                      setCreatorOnline(!creatorOnline);
                      showToast(creatorOnline ? 'Set status to Busy' : 'Set status to Available');
                    }}
                    title="Toggle VIP availability"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                {creatorOnline ? (
                  [
                    ['Anita Joseph', 'Video', '₹150/min'],
                    ['Rahul S.', 'Audio', '₹90/min'],
                  ].map(([fan, type, rate], i) => (
                    <div key={i} className="cd row sp w">
                      <div>
                        <b>{fan}</b>
                        <div className="mu" style={{ fontSize: '13px' }}>
                          {type} call · {rate}
                        </div>
                      </div>
                      <div className="row">
                        <button
                          className="btn s"
                          onClick={() => {
                            setActiveCall({
                              name: fan,
                              type: type as any,
                              duration: 0,
                              muted: false,
                              speaker: true,
                              camOff: false,
                            });
                          }}
                        >
                          Accept
                        </button>
                        <button
                          className="btn d s"
                          onClick={() => showToast('Call declined')}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="cd mu text-center p-6">
                    You are currently set to busy. Turn on availability to receive incoming fan call requests.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. SUPPORT DESK */}
          {role === 'support' && currentTab === 'desk' && (
            <div>
              <div className="row sp mb-3">
                <h2>Customer Support Help Desk</h2>
                <span className="pill ac">Agent: Active</span>
              </div>

              <div className="desk">
                {/* Tickets list */}
                <div className="cd">
                  <h3 className="mb-3">Open Tickets</h3>
                  {[
                    ['Payment failed', 'Anita J.', 'HD-9812'],
                    ['Cannot connect to call', 'Sam P.', 'HD-9813'],
                    ['Refund request', 'Leena K.', 'HD-9814'],
                  ].map(([title, user, id], i) => (
                    <div
                      key={i}
                      className={`tk ${selectedTicket === i ? 'on' : ''}`}
                      onClick={() => setSelectedTicket(i)}
                    >
                      <b>{title}</b>
                      <div className="mu" style={{ fontSize: '13px' }}>{user} · {id}</div>
                    </div>
                  ))}
                </div>

                {/* Conversation thread */}
                <div className="cd" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="row sp border-b border-slate-700/60 pb-2 mb-3">
                    <h3>{['Payment failed', 'Cannot connect to call', 'Refund request'][selectedTicket]}</h3>
                    <span className="pill">Ticket #{selectedTicket + 1}</span>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto' }} className="pr-1">
                    {(chatMessages[selectedTicket] || []).map((msg, idx) => (
                      <div key={idx} className={`msg ${msg.me ? 'me' : ''}`}>
                        {msg.text}
                      </div>
                    ))}
                  </div>
                  <div className="row mt-3">
                    <input
                      className="in"
                      placeholder="Type a reply to customer…"
                      value={replyInput}
                      onChange={(e) => setReplyInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSendReply(); }}
                    />
                    <button className="btn" onClick={handleSendReply}>
                      Send
                    </button>
                  </div>
                </div>

                {/* Customer card & operator actions */}
                <div className="cd" style={{ display: 'grid', gap: '12px', alignContent: 'start' }}>
                  <h3>{['Anita J.', 'Sam P.', 'Leena K.'][selectedTicket]}</h3>
                  <div className="mu" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                    Member · +91 91111 11111<br />
                    Joined Sep 2026 · Free plan<br />
                    Device: Android 15 (Chrome)
                  </div>
                  <div>
                    <b className="block text-sm mb-1">Recent Call Logs</b>
                    <div className="mu" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                      Voice match · 4m duration<br />
                      Voice match · 11m duration
                    </div>
                  </div>
                  <button className="btn g s" onClick={() => showToast('Session cache cleared')}>
                    Reset Account
                  </button>
                  <button className="btn g s" onClick={() => showToast('Refund credited to wallet')}>
                    Issue Refund
                  </button>
                  <button className="btn d s" onClick={() => showToast('Escalated to SuperAdmin')}>
                    Escalate to Admin
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 5. SUPERADMIN VIEWS */}
          {role === 'admin' && currentTab === 'overview' && (
            <div>
              <h2>System Overview</h2>
              <div className="grid" style={{ marginBottom: '16px' }}>
                <MetricCard label="Active voice sessions" value="248" />
                <MetricCard label="Revenue today" value="₹1.2L" />
                <MetricCard label="Flagged content" value="3" />
              </div>

              <div className="cd">
                <h3 className="mb-3">Flagged Safety Alerts</h3>
                {[
                  'Reel reported by 5 users for policy review',
                  'Abusive language detected in voice match session',
                  'Event listing reported with unverified venue',
                ].map((alert, i) => (
                  <div
                    key={i}
                    className="row sp"
                    style={{ padding: '10px 0', borderBottom: '1px solid var(--ln)' }}
                  >
                    <span>{alert}</span>
                    <button className="btn g s" onClick={() => showToast('Incident opened for review')}>
                      Review
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {role === 'admin' && currentTab === 'users' && (
            <div>
              <h2>User Governance</h2>
              <div className="row w" style={{ marginBottom: '14px' }}>
                <input
                  className="in"
                  placeholder="Search by name or handle…"
                  style={{ maxWidth: '280px' }}
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                />
                <select
                  className="in"
                  style={{ maxWidth: '170px' }}
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  <option value="Member">Member</option>
                  <option value="Organizer">Organizer</option>
                  <option value="Creator">Creator</option>
                  <option value="Support">Support</option>
                </select>
              </div>

              <div className="cd" style={{ overflow: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userList
                      .filter(([n, r]) => {
                        const matchesRole = userRoleFilter === 'all' || r === userRoleFilter;
                        const matchesName = n.toLowerCase().includes(userSearchQuery.toLowerCase());
                        return matchesRole && matchesName;
                      })
                      .map(([name, uRole], i) => (
                        <tr key={i}>
                          <td><b>{name}</b></td>
                          <td><span className="pill">{uRole}</span></td>
                          <td>
                            <div className="row w">
                              <button
                                className="btn g s"
                                onClick={() => showToast(`Voice match restricted for ${name}`)}
                              >
                                Restrict voice
                              </button>
                              <button
                                className="btn g s"
                                onClick={() => showToast(`Account frozen: ${name}`)}
                              >
                                Freeze
                              </button>
                              <button
                                className="btn d s"
                                onClick={() => {
                                  setModalData({ name });
                                  setModalType('ban_user');
                                }}
                              >
                                Ban
                              </button>
                              <button
                                className="btn g s"
                                onClick={() => {
                                  setModalData({ name });
                                  setModalType('audit_user');
                                }}
                              >
                                Audit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {role === 'admin' && currentTab === 'approvals' && (
            <div style={{ maxWidth: '680px' }}>
              <h2>Approvals &amp; KYC Queue</h2>
              <div style={{ display: 'grid', gap: '14px' }}>
                {[
                  ['Kochi Beats Co.', 'Organizer', 'Tax ID & Trade license attached'],
                  ['Arjun Das', 'Creator', 'Official Aadhaar KYC & verified YouTube handle'],
                  ['TechSphere India', 'Organizer', 'Corporate PAN & Infopark registration'],
                ].map(([orgName, type, docs], i) => (
                  <div key={i} className="cd row sp w">
                    <div>
                      <b>{orgName}</b>
                      <div className="mu" style={{ fontSize: '13px' }}>
                        {type} verification · {docs}
                      </div>
                    </div>
                    <div className="row">
                      <button className="btn s" onClick={() => showToast(`Approved ${orgName} ✔`)}>
                        Approve
                      </button>
                      <button className="btn d s" onClick={() => showToast(`Rejected ${orgName}`)}>
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* -------------------------------------------------------------
          FULLSCREEN ACTIVE CALL MODAL (Voice & Video)
      ------------------------------------------------------------- */}
      {activeCall && (
        <div className="call">
          <div className="mu text-sm uppercase tracking-wider">{activeCall.type} Call In Progress</div>
          <div className="big">{activeCall.name}</div>

          {activeCall.type === 'Voice' ? (
            /* Audio visualizer wave */
            <div className="viz">
              {Array.from({ length: 14 }).map((_, i) => (
                <b key={i} style={{ animationDelay: `${i * 0.08}s` }} />
              ))}
            </div>
          ) : (
            /* Interactive Dual Video Stage */
            <div
              className="relative w-full max-w-lg h-72 rounded-2xl overflow-hidden mx-auto border border-purple-500/30 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1b1f26, #0e1217)' }}
            >
              {activeCall.camOff ? (
                <div className="mu flex flex-col items-center">
                  <span className="text-3xl mb-2">📷</span>
                  Camera is turned off
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-purple-600 mx-auto mb-2 flex items-center justify-center text-xl font-bold">
                      {activeCall.name[0]}
                    </div>
                    <div className="text-sm font-semibold">{activeCall.name}</div>
                    <div className="text-xs text-emerald-400">720p HD · 30fps Live Peer</div>
                  </div>
                  {/* Floating selfie PiP */}
                  <div
                    className="absolute bottom-3 right-3 w-28 h-20 rounded-xl border border-purple-400/50 flex items-center justify-center text-xs font-semibold shadow-lg"
                    style={{ background: '#242a35' }}
                  >
                    You (Front)
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Call duration timer */}
          <div className="mu font-mono text-base">
            {String(Math.floor(activeCall.duration / 60)).padStart(2, '0')}:
            {String(activeCall.duration % 60).padStart(2, '0')}
          </div>

          {/* Controls */}
          <div className="row justify-center gap-3">
            <button
              className={`btn g ${activeCall.muted ? 'd' : ''}`}
              onClick={() => {
                setActiveCall({ ...activeCall, muted: !activeCall.muted });
                showToast(activeCall.muted ? 'Microphone unmuted' : 'Microphone muted');
              }}
            >
              {activeCall.muted ? '🎙 Unmute' : '🎙 Mute'}
            </button>

            {activeCall.type === 'Video' && (
              <button
                className="btn g"
                onClick={() => {
                  setActiveCall({ ...activeCall, camOff: !activeCall.camOff });
                  showToast(activeCall.camOff ? 'Camera turned on' : 'Camera turned off');
                }}
              >
                {activeCall.camOff ? '📷 Start Cam' : '📷 Stop Cam'}
              </button>
            )}

            <button
              className={`btn g ${!activeCall.speaker ? 'd' : ''}`}
              onClick={() => {
                setActiveCall({ ...activeCall, speaker: !activeCall.speaker });
                showToast(activeCall.speaker ? 'Speaker disabled' : 'Speaker enabled');
              }}
            >
              🔊 Speaker
            </button>

            <button
              className="btn"
              style={{ background: 'var(--dn)' }}
              onClick={() => {
                setActiveCall(null);
                showToast('Call ended');
              }}
            >
              End Call
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          TICKET BOOKING MODAL
      ------------------------------------------------------------- */}
      {modalType === 'booking' && (
        <div className="mod" onClick={(e) => { if (e.target === e.currentTarget) setModalType(null); }}>
          <div className="cd">
            <h3>{INITIAL_EVENTS[bookEventIndex].title}</h3>
            <div className="mu" style={{ fontSize: '13px' }}>
              {INITIAL_EVENTS[bookEventIndex].time} · {INITIAL_EVENTS[bookEventIndex].venue}
            </div>

            <div className="flex flex-col gap-2 mt-2">
              {TIERS.map((tierName, i) => (
                <div
                  key={i}
                  className={`sel ${bookTier === i ? 'on' : ''}`}
                  onClick={() => setBookTier(i)}
                >
                  <div className="row sp">
                    <b>{tierName}</b>
                    <span>
                      {INITIAL_EVENTS[bookEventIndex].prices[i]
                        ? `₹${INITIAL_EVENTS[bookEventIndex].prices[i]}`
                        : 'Free'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="row sp mt-2">
              <span>Number of Seats</span>
              <div className="row">
                <button
                  className="btn g s"
                  onClick={() => setBookSeats(Math.max(1, bookSeats - 1))}
                >
                  −
                </button>
                <b className="px-2">{bookSeats}</b>
                <button
                  className="btn g s"
                  onClick={() => setBookSeats(Math.min(8, bookSeats + 1))}
                >
                  +
                </button>
              </div>
            </div>

            <button
              className="btn mt-2"
              onClick={() => {
                setModalType(null);
                showToast('Ticket booked successfully 🎉');
              }}
            >
              Confirm · ₹{INITIAL_EVENTS[bookEventIndex].prices[bookTier] * bookSeats}
            </button>
            <button className="btn g" onClick={() => setModalType(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          GO PREMIUM MODAL
      ------------------------------------------------------------- */}
      {modalType === 'go_premium' && (
        <div className="mod" onClick={(e) => { if (e.target === e.currentTarget) setModalType(null); }}>
          <div className="cd">
            <h3>⭐ Upgrade to Premium</h3>
            <p className="mu" style={{ margin: 0 }}>
              Upgrade to Vibzz VIP Premium to unlock direct 1-on-1 audio and video calls with verified creators and celebrities.
            </p>
            <button
              className="btn"
              onClick={() => {
                if (session) {
                  const updated = { ...session, premium: true };
                  saveSession(updated);
                  setModalType(null);
                  showToast('Welcome to Vibzz Premium! ⭐');
                }
              }}
            >
              Upgrade — ₹299/month
            </button>
            <button className="btn g" onClick={() => setModalType(null)}>
              Not now
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          BAN USER CONFIRMATION MODAL
      ------------------------------------------------------------- */}
      {modalType === 'ban_user' && modalData && (
        <div className="mod" onClick={(e) => { if (e.target === e.currentTarget) setModalType(null); }}>
          <div className="cd">
            <h3>Ban {modalData.name}?</h3>
            <p className="mu" style={{ margin: 0 }}>
              This will immediately revoke their authentication tokens and prevent them from signing in.
            </p>
            <button
              className="btn d"
              onClick={() => {
                setUserList((prev) => prev.filter(([n]) => n !== modalData.name));
                setModalType(null);
                showToast(`User ${modalData.name} has been banned.`);
              }}
            >
              Confirm ban
            </button>
            <button className="btn g" onClick={() => setModalType(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          AUDIT LOG MODAL
      ------------------------------------------------------------- */}
      {modalType === 'audit_user' && modalData && (
        <div className="mod" onClick={(e) => { if (e.target === e.currentTarget) setModalType(null); }}>
          <div className="cd">
            <h3>Audit log · {modalData.name}</h3>
            <div className="mu" style={{ fontSize: '13px', lineHeight: '1.8' }}>
              08 Nov 10:12 · Authenticated via OTP<br />
              07 Nov 21:40 · Completed Voice Match (6m session)<br />
              06 Nov 18:05 · Purchased Gold Ticket #HD-1042<br />
              04 Nov 09:30 · Profile verified
            </div>
            <button className="btn g mt-2" onClick={() => setModalType(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMsg && (
        <div id="toast" style={{ display: 'block' }}>
          {toastMsg}
        </div>
      )}
    </div>
  );
}
