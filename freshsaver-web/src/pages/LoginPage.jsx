import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, User, Mail, Lock, UserPlus, ArrowRight, MousePointerClick, AlertCircle } from 'lucide-react';

const COLS = 3;          // sprite columns
const ROWS = 2;          // sprite rows
const FRAMES = COLS * ROWS;
const SPRITE_URL = '/basket-360.png'; // Updated filename as requested

const LoginPage = () => {
  const navigate = useNavigate();
  const [isRetailer, setIsRetailer] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // 3D Parallax & Frame State
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [frameIndex, setFrameIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const rightPaneRef = useRef(null);
  const draggingRef = useRef(false);
  const rafRef = useRef(0);

  // Preload the sprite so first paint is instant
  useEffect(() => {
    const img = new Image();
    img.src = SPRITE_URL;
    img.onload = () => setLoaded(true);
  }, []);

  // Background size and position for arbitrary grid
  const bg = useMemo(() => {
    const col = frameIndex % COLS;
    const row = Math.floor(frameIndex / COLS);
    const posX = (COLS > 1 ? (col / (COLS - 1)) * 100 : 0);
    const posY = (ROWS > 1 ? (row / (ROWS - 1)) * 100 : 0);
    return {
      size: `${COLS * 100}% ${ROWS * 100}%`,
      position: `${posX}% ${posY}%`,
    };
  }, [frameIndex]);

  const updateFromClientX = (clientX) => {
    const el = rightPaneRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const ratio = rect.width ? x / rect.width : 0;
    const next = Math.min(FRAMES - 1, Math.max(0, Math.floor(ratio * FRAMES)));
    setFrameIndex(next);
  };

  const scheduleMove = (clientX, clientY) => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      updateFromClientX(clientX);
      // light parallax
      const px = (clientX / window.innerWidth - 0.5) * 30;
      const py = (clientY / window.innerHeight - 0.5) * 30;
      setCursor({ x: px, y: py });
    });
  };

  const onPointerDown = (e) => {
    draggingRef.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    scheduleMove(e.clientX, e.clientY);
  };
  const onPointerMove = (e) => {
    if (!draggingRef.current) return;
    scheduleMove(e.clientX, e.clientY);
  };
  const onPointerUp = (e) => {
    draggingRef.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const users = JSON.parse(localStorage.getItem('freshsaver_users')) || [];
    const role = isRetailer ? 'retailer' : 'customer';

    if (isLogin) {
      const user = users.find(u => u.email === email && u.password === password && u.role === role);
      if (user) {
        localStorage.setItem('freshsaver_currentUser', JSON.stringify(user));
        navigate(isRetailer ? '/retailer-dashboard' : '/customer-home');
      } else {
        setError('Invalid email, password, or account type.');
      }
    } else {
      if (users.find(u => u.email === email)) {
        return setError('An account with this email already exists!');
      }
      const newUser = { email, password, role, name };
      users.push(newUser);
      localStorage.setItem('freshsaver_users', JSON.stringify(users));
      localStorage.setItem('freshsaver_currentUser', JSON.stringify(newUser));
      navigate(isRetailer ? '/retailer-dashboard' : '/customer-home');
    }
  };

  // Keyboard access: left/right step frames
  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') setFrameIndex(i => Math.max(0, i - 1));
    if (e.key === 'ArrowRight') setFrameIndex(i => Math.min(FRAMES - 1, i + 1));
  };

  return (
    <div className="min-h-screen flex bg-[#fdfaf5] text-[#3e3d3b] font-serif overflow-hidden">
      {/* LEFT SIDE: Form */}
      <div className="w-full lg:w-5/12 p-8 md:p-16 flex flex-col justify-center z-10 bg-[#fdfaf5] shadow-2xl relative">
        <div className="max-w-md w-full mx-auto">
          <h1 className="text-4xl font-bold tracking-tight mb-2 uppercase">
            Fresh<span className="text-[#6b705c]">Saver</span>
          </h1>
          <p className="text-[#7f7d75] mb-10 font-sans tracking-widest text-sm uppercase">
            Curated Living: Art to Nourish
          </p>

          <div className="flex bg-[#f0eee9] p-1 rounded-full mb-6 font-sans">
            <button
              onClick={() => { setIsRetailer(false); setError(''); }}
              className={`flex-1 flex justify-center items-center py-2.5 rounded-full transition-all text-sm font-bold ${!isRetailer ? 'bg-white shadow-md text-[#5f6c42]' : 'text-gray-500'}`}
            >
              <User className="w-4 h-4 mr-2" /> Customer
            </button>
            <button
              onClick={() => { setIsRetailer(true); setError(''); }}
              className={`flex-1 flex justify-center items-center py-2.5 rounded-full transition-all text-sm font-bold ${isRetailer ? 'bg-white shadow-md text-[#886a4a]' : 'text-gray-500'}`}
            >
              <Store className="w-4 h-4 mr-2" /> Retailer
            </button>
          </div>

          <h2 className="text-2xl font-bold mb-6">{isLogin ? 'Welcome Back' : 'Create an Account'}</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 font-sans text-sm rounded-lg flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 font-sans">
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                  {isRetailer ? 'Shop Name' : 'Full Name'}
                </label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#f0eee9] border-none rounded-lg focus:ring-2 focus:ring-[#6b705c] outline-none"
                    placeholder={isRetailer ? "My Fresh Store" : "John Doe"}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#f0eee9] border-none rounded-lg focus:ring-2 focus:ring-[#6b705c] outline-none"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#f0eee9] border-none rounded-lg focus:ring-2 focus:ring-[#6b705c] outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 mt-2 rounded-full font-bold text-white transition-all bg-[#414833] hover:bg-[#283618] flex justify-center items-center tracking-widest text-sm uppercase"
            >
              {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </form>

          <div className="mt-6 text-center font-sans text-sm text-gray-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="font-bold text-[#6b705c] hover:text-black underline"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: FULL-BLEED Sprite-Based 360 Viewer */}
      <div
        ref={rightPaneRef}
        className="hidden lg:flex w-7/12 relative items-center justify-center overflow-hidden bg-black z-0"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        role="img"
        aria-label="Interactive 360° basket"
        tabIndex={0}
        style={{ touchAction: 'none' }} // allow horizontal drag without browser gestures
      >
        {/* Dynamic Frame Viewer */}
        <div
          className="min-w-full min-h-full transform origin-center"
          style={{
            aspectRatio: '3 / 2',                // lock viewport ratio
            backgroundImage: `url('${SPRITE_URL}')`,
            backgroundSize: bg.size,             // "300% 200%" for 3x2
            backgroundPosition: bg.position,     // e.g., "50% 100%"
            transform: `scale(1.05) translate(${cursor.x}px, ${cursor.y}px)`,
            transition: 'none',
            willChange: 'transform, background-position' // remove if not needed
          }}
        />

        {/* Shadow Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none z-10" />

        {/* Overlay */}
        <div className="absolute z-20 flex flex-col items-center bottom-12">
          <div className="bg-white/90 backdrop-blur text-[#414833] p-4 rounded-full shadow-2xl mb-4 border border-white/40">
            <MousePointerClick className="w-6 h-6 animate-bounce" />
          </div>
          <p className="text-white font-black tracking-[0.2em] mb-1 drop-shadow-lg text-lg">
            YOUR INTERACTIVE BASKET
          </p>
          <p className="text-white/80 font-sans text-xs tracking-widest uppercase drop-shadow-md">
            Drag horizontally to view 360°
          </p>
        </div>

        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center text-white/80 text-sm">
            Loading…
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;