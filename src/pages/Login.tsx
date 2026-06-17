import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Loader2, 
  Leaf, 
  ArrowRight, 
  Check, 
  ShieldCheck, 
  Globe, 
  RefreshCw, 
  Award, 
  Info, 
  AlertCircle,
  X,
  LockKeyhole,
  Camera,
  Recycle,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { authService } from '../services/api.js';
import { translateError } from '../utils/errorHelper.ts';

interface LoginProps {
  onLoginSuccess: (token: string, user: any) => void;
  darkMode: boolean;
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description: string;
}

export default function Login({ onLoginSuccess, darkMode }: LoginProps) {
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login');
  
  // Standard fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  
  // Custom user choices
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Recovery views
  const [forgotEmail, setForgotEmail] = useState('');
  
  // Interactive UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Pre-load remembered credentials
  useEffect(() => {
    const saved = localStorage.getItem('ecosmart_remember_email');
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  // Helper: trigger toast
  const addToast = (type: 'success' | 'error' | 'info', title: string, description: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Password Strength Real-time calculations
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: 'Empty', color: 'bg-gray-300 dark:bg-gray-700', criteria: { length: false, upper: false, lower: false, digit: false } };
    
    const criteria = {
      length: pass.length >= 8,
      upper: /[A-Z]/.test(pass),
      lower: /[a-z]/.test(pass),
      digit: /[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)
    };
    
    const metCount = Object.values(criteria).filter(Boolean).length;
    
    if (metCount <= 1) return { score: 1, text: 'Weak', color: 'bg-red-500', criteria };
    if (metCount === 2) return { score: 2, text: 'Fair', color: 'bg-amber-500', criteria };
    if (metCount === 3) return { score: 3, text: 'Good', color: 'bg-emerald-400', criteria };
    return { score: 4, text: 'Strong', color: 'bg-emerald-600', criteria };
  };

  const strength = getPasswordStrength(password);

  // Clear states when view shifts
  useEffect(() => {
    setPassword('');
    setConfirmPassword('');
    setName('');
  }, [view]);

  // Form Submissions
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      addToast('error', 'Required Field', 'Please specify a valid email address.');
      return;
    }

    if (view === 'login') {
      if (!password) {
        addToast('error', 'Required Field', 'Please input your password.');
        return;
      }

      setLoading(true);
      try {
        const data = await authService.login({ email, password });
        
        // Save email if Remember Me is checked
        if (rememberMe) {
          localStorage.setItem('ecosmart_remember_email', email);
        } else {
          localStorage.removeItem('ecosmart_remember_email');
        }

        addToast('success', 'Authenticated Successfully', `Welcome back to EcoSmart AI, ${data.user.name}!`);
        // Slight delay for premium feel and toast visibility
        setTimeout(() => {
          onLoginSuccess(data.token, data.user);
        }, 1000);
      } catch (err: any) {
        const friendly = translateError(err);
        addToast('error', 'Authentication Failed', friendly.message);
      } finally {
        setLoading(false);
      }
    } 
    
    else if (view === 'signup') {
      if (!name) {
        addToast('error', 'Required Field', 'Please enter your full name.');
        return;
      }
      if (!password) {
        addToast('error', 'Required Field', 'Please input a secure password.');
        return;
      }
      if (password !== confirmPassword) {
        addToast('error', 'Passwords Mismatch', 'The password and confirm password fields must match perfectly.');
        return;
      }
      if (!agreeToTerms) {
        addToast('error', 'Terms Required', 'You must agree to our Terms and Conditions to proceed.');
        return;
      }
      if (strength.score < 2) {
        addToast('error', 'Weak Password', 'Please choose a stronger password to align with security guidelines.');
        return;
      }

      setLoading(true);
      try {
        const data = await authService.register({ name, email, password });
        addToast('success', 'Profile Created', 'Your EcoSmart AI account was provisioned securely! Redirecting to setup...');
        setTimeout(() => {
          onLoginSuccess(data.token, data.user);
        }, 1200);
      } catch (err: any) {
        const friendly = translateError(err);
        addToast('error', 'Registration Failed', friendly.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Forgot Password Submission
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      addToast('error', 'Required Field', 'Please input your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const data = await authService.forgotPassword(forgotEmail);
      addToast('success', 'Dispatched Securely', data.message || 'If an account exists, a secure login pass link has been dispatched.');
      setForgotEmail('');
      setTimeout(() => {
        setView('login');
      }, 3000);
    } catch (err: any) {
      const friendly = translateError(err);
      addToast('error', 'Reset Trigger Failed', friendly.message);
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth Popup Trigger with standard PostMessage Event Listeners
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const data = await authService.getGoogleAuthUrl();
      const popup = window.open(
        data.url,
        'google_oauth_popup',
        'width=500,height=650,left=' + (window.innerWidth / 2 - 250) + ',top=' + (window.innerHeight / 2 - 325)
      );

      if (!popup) {
        addToast('error', 'Popup Blocked', 'Please allow popups in your browser layout to sign in with Google credentials.');
        setGoogleLoading(false);
      }
    } catch (err: any) {
      const friendly = translateError(err);
      addToast('error', 'Google Auth Error', friendly.message);
      setGoogleLoading(false);
    }
  };

  // Listening for Google OAuth PostMessage
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const { token, user } = event.data;
        if (token && user) {
          addToast('success', 'Social Login Active', `Successfully logged in via Google securely. Welcome, ${user.name}!`);
          setTimeout(() => {
            onLoginSuccess(token, user);
          }, 1000);
        } else {
          addToast('error', 'Mapping Failed', 'Google profile synchronization is currently unavailable.');
        }
        setGoogleLoading(false);
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [onLoginSuccess]);

  return (
    <div className={`min-h-screen flex transition-colors duration-300 font-sans ${darkMode ? 'bg-natural-dark-bg text-natural-dark-text' : 'bg-gray-50 text-natural-dark'}`}>
      
      {/* 1. TOAST PORTAL COMPONENT */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              layout
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              className={`p-4 rounded-xl border shadow-xl flex items-start gap-3 pointer-events-auto backdrop-blur-md ${
                toast.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/90 dark:border-emerald-800 text-emerald-800 dark:text-emerald-100'
                  : toast.type === 'error'
                    ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/90 dark:border-rose-800 text-rose-800 dark:text-rose-100'
                    : 'bg-blue-50 border-blue-200 dark:bg-slate-900/90 dark:border-slate-800 text-blue-800 dark:text-blue-100'
              }`}
            >
              <div className="mt-0.5">
                {toast.type === 'success' && <ShieldCheck className="w-5 h-5 text-emerald-500" />}
                {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500" />}
                {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold uppercase tracking-wider">{toast.title}</h4>
                <p className="text-xs mt-0.5 opacity-90 leading-relaxed">{toast.description}</p>
              </div>
              <button 
                onClick={() => removeToast(toast.id)}
                className="text-current opacity-60 hover:opacity-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 2. LEFT SIDE PANEL: Premium SaaS Feature Showcase (Desktop Only) */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative overflow-hidden bg-gradient-to-tr from-emerald-950 via-[#0c1310] to-[#121815] border-r border-[#1a2520] p-12 flex-col justify-between z-10">
        {/* Dynamic mesh spheres for luxury UI feel */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-400/5 blur-[100px] pointer-events-none"></div>

        {/* Small header logo badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <span className="text-md font-extrabold tracking-wider text-white">EcoSmart <span className="text-emerald-400">AI</span></span>
            <div className="text-[9px] uppercase tracking-widest text-emerald-500/80 font-semibold leading-none">Circular Assistant Engine</div>
          </div>
        </div>

        {/* Interactive Feature Stack Cards */}
        <div className="my-auto max-w-lg space-y-8">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest bg-emerald-500/10 text-emerald-400 uppercase border border-emerald-500/20">
              <Award className="w-3 h-3" /> UN SDG-12 ALIGNED PLATFORM
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
              AI-Powered Smart Waste Segregation <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-300">for a Sustainable Future</span>
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              EcoSmart AI leverages Gemini Vision and advanced machine learning to identify waste materials, recommend responsible disposal methods, and promote sustainable recycling practices for smarter communities and cleaner environments.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            {/* Feature 1 */}
            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/10 backdrop-blur-sm">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 mt-1">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-200">Real-Time Waste Detection</h4>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">Use Gemini Vision AI to identify biodegradable, recyclable, plastic, metal, glass, paper, and e-waste from uploaded images.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/10 backdrop-blur-sm">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 mt-1">
                <Recycle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-200">Smart Disposal Guidance</h4>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">Receive category-specific recycling and disposal recommendations based on detected waste.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/10 backdrop-blur-sm">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 mt-1">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-200">Sustainability Analytics</h4>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">Monitor environmental impact and waste management performance through intelligent dashboard insights.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info/stats */}
        <div className="flex items-center justify-between border-t border-[#1a2520] pt-6 text-xs text-gray-400">
          <div className="flex items-center gap-1 text-emerald-400 font-medium">
            <Lock className="w-3.5 h-3.5" /> AES-256 Bit Secure Connection
          </div>
          <div>Developed by <span className="text-white font-semibold">Mahammad Aslam</span></div>
        </div>
      </div>

      {/* 3. RIGHT SIDE PANEL: Authentication Workspace */}
      <div className="flex-1 flex flex-col justify-between py-12 px-6 sm:px-12 md:px-20 z-10 relative">
        
        {/* Responsive Logo showing on tablet/mobile screens */}
        <div className="flex lg:hidden items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-natural-primary flex items-center justify-center text-white">
              <Leaf className="w-4.5 h-4.5" />
            </div>
            <span className="font-bold tracking-tight text-md">EcoSmart AI</span>
          </div>
          <p className="text-xxs uppercase tracking-wider opacity-60">SDG 12 Platform</p>
        </div>

        {/* Dynamic Card & Forms */}
        <div className="my-auto w-full max-w-md mx-auto">
          
          {/* Tabs for Login / Signup Switcher */}
          {view !== 'forgot' && (
            <div className="mb-8">
              <div className={`p-1 rounded-xl flex gap-1 border ${darkMode ? 'bg-black/20 border-natural-dark-border' : 'bg-gray-100 border-gray-200'}`}>
                <button
                  onClick={() => setView('login')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all relative ${
                    view === 'login'
                      ? darkMode 
                        ? 'bg-natural-dark-card text-white shadow-md' 
                        : 'bg-white text-natural-dark shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {view === 'login' && (
                    <motion.div 
                      layoutId="activeTabOutline" 
                      className="absolute inset-0 bg-natural-primary/5 dark:bg-emerald-400/5 rounded-lg border border-natural-primary/20 dark:border-emerald-400/20"
                    />
                  )}
                  Sign In
                </button>
                <button
                  onClick={() => setView('signup')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all relative ${
                    view === 'signup'
                      ? darkMode 
                        ? 'bg-natural-dark-card text-white shadow-md' 
                        : 'bg-white text-natural-dark shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {view === 'signup' && (
                    <motion.div 
                      layoutId="activeTabOutline" 
                      className="absolute inset-0 bg-natural-primary/5 dark:bg-emerald-400/5 rounded-lg border border-natural-primary/20 dark:border-emerald-400/20"
                    />
                  )}
                  Create Account
                </button>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* VIEW: FORGOT PASSWORD */}
            {view === 'forgot' ? (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-2xl font-black tracking-tight mb-2">Recover Password</h3>
                  <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Provide your credential email address below. If aligned with active files, we'll dispatch single-sign-on tokens instantly.
                  </p>
                </div>

                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xxs font-bold uppercase tracking-wider mb-2 text-gray-500 dark:text-gray-400">Registered Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        required
                        placeholder="alex@ecosmart.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-natural-primary transition-all font-medium ${
                          darkMode 
                            ? 'bg-[#1b2520] border-natural-dark-border text-white focus:bg-[#1f2c26]' 
                            : 'bg-white border-gray-200 text-natural-dark focus:bg-gray-50'
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-natural-primary hover:bg-natural-primary-hover text-white py-3.5 rounded-xl font-semibold text-xs transition duration-200 shadow-md hover:shadow-emerald-500/10 active:scale-[0.98] flex items-center justify-center cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      'Request Secure SSO Token'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className="w-full py-3 border border-dashed text-xxs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:text-natural-primary rounded-xl transition cursor-pointer"
                  >
                    Back to Log In Screen
                  </button>
                </form>
              </motion.div>
            ) : (
              /* VIEW: SIGN IN OR SIGN UP */
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="space-y-1">
                  <h3 className="text-3xl font-black tracking-tight leading-none text-gray-900 dark:text-white">
                    {view === 'login' ? 'Welcome back' : 'Start your SDG path'}
                  </h3>
                  <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {view === 'login' 
                      ? 'Input your secure credentials to coordinate sorting diagnostics.' 
                      : 'Join the circular solid waste movement and map municipal centers.'}
                  </p>
                </div>

                {/* Secure Continue with Google */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className={`w-full py-3 px-4 border rounded-xl text-xs font-bold uppercase tracking-wide transition-all duration-150 flex items-center justify-center cursor-pointer hover:shadow-md ${
                    darkMode 
                      ? 'bg-[#1b2520] border-natural-dark-border text-white hover:bg-[#202d26]' 
                      : 'bg-white border-gray-200 text-natural-dark hover:bg-gray-50'
                  }`}
                >
                  {googleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-3" />
                  ) : (
                    <svg className="w-4.5 h-4.5 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  Continue with Google
                </button>

                {/* ChatGPT Inspired Styled Separator */}
                <div className="flex items-center gap-3 my-4">
                  <div className={`h-px flex-1 ${darkMode ? 'bg-natural-dark-border' : 'bg-gray-200'}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Or continuous via email
                  </span>
                  <div className={`h-px flex-1 ${darkMode ? 'bg-natural-dark-border' : 'bg-gray-200'}`} />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Signup Specific Name Input */}
                  {view === 'signup' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-2"
                    >
                      <label className="block text-xxs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          required
                          placeholder="Alex Peterson"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-natural-primary transition-all font-medium ${
                            darkMode 
                              ? 'bg-[#1b2520] border-natural-dark-border text-white focus:bg-[#1f2c26]' 
                              : 'bg-white border-gray-200 text-natural-dark focus:bg-gray-50'
                          }`}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Standard Username / Email */}
                  <div className="space-y-2">
                    <label className="block text-xxs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        required
                        placeholder="alex@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-natural-primary transition-all font-medium ${
                          darkMode 
                            ? 'bg-[#1b2520] border-natural-dark-border text-white focus:bg-[#1f2c26]' 
                            : 'bg-white border-gray-200 text-natural-dark focus:bg-gray-50'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Password Entry */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xxs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Security Password</label>
                      {view === 'login' && (
                        <button
                          type="button"
                          onClick={() => setView('forgot')}
                          className="text-xxs text-natural-primary hover:underline font-bold"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full pl-10 pr-10 py-3 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-natural-primary transition-all font-medium ${
                          darkMode 
                            ? 'bg-[#1b2520] border-natural-dark-border text-white focus:bg-[#1f2c26]' 
                            : 'bg-white border-gray-200 text-natural-dark focus:bg-gray-50'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-natural-primary transition-all cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Signup Additional Confirmations */}
                  {view === 'signup' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 pt-1"
                    >
                      {/* Confirm Password */}
                      <div className="space-y-2">
                        <label className="block text-xxs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Confirm Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full pl-10 pr-10 py-3 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-natural-primary transition-all font-medium ${
                              darkMode 
                                ? 'bg-[#1b2520] border-natural-dark-border text-white focus:bg-[#1f2c26]' 
                                : 'bg-white border-gray-200 text-natural-dark focus:bg-gray-50'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-natural-primary transition-all cursor-pointer"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                          </button>
                        </div>
                        {confirmPassword && password !== confirmPassword && (
                          <p className="text-[10px] text-rose-500 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Password entries are not matching.
                          </p>
                        )}
                      </div>

                      {/* Password strength UI */}
                      <div className="p-3.5 rounded-xl border border-dashed text-xs tracking-tight space-y-2 dark:border-natural-dark-border dark:bg-black/10 bg-gray-50/50">
                        <div className="flex items-center justify-between">
                          <span className="text-xxs font-bold uppercase text-gray-500 dark:text-gray-400">Password Strength:</span>
                          <span className={`text-xxs font-bold uppercase px-2 py-0.5 rounded-full ${
                            strength.score === 1 
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200'
                              : strength.score === 2
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200'
                                : strength.score === 3
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-100'
                                  : 'bg-emerald-500 text-white'
                          }`}>
                            {strength.text}
                          </span>
                        </div>
                        
                        {/* Interactive gauge color bar */}
                        <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden flex gap-1">
                          <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 1 ? strength.color : 'w-0'}`} style={{ width: `${Math.max(15, strength.score * 25)}%` }}></div>
                        </div>

                        {/* Criteria metrics checklists */}
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 text-[10px]">
                          <div className={`flex items-center gap-1.5 ${strength.criteria.length ? 'text-emerald-500 font-medium' : 'text-gray-400'}`}>
                            {strength.criteria.length ? <Check className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-gray-700" />}
                            At least 8 letters
                          </div>
                          <div className={`flex items-center gap-1.5 ${strength.criteria.upper ? 'text-emerald-500 font-medium' : 'text-gray-400'}`}>
                            {strength.criteria.upper ? <Check className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-gray-700" />}
                            Uppercase letter
                          </div>
                          <div className={`flex items-center gap-1.5 ${strength.criteria.lower ? 'text-emerald-500 font-medium' : 'text-gray-400'}`}>
                            {strength.criteria.lower ? <Check className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-gray-700" />}
                            Lowercase letter
                          </div>
                          <div className={`flex items-center gap-1.5 ${strength.criteria.digit ? 'text-emerald-500 font-medium' : 'text-gray-400'}`}>
                            {strength.criteria.digit ? <Check className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-gray-700" />}
                            Number / Special
                          </div>
                        </div>
                      </div>

                      {/* Terms and Conditions Toggle */}
                      <label className="flex items-start gap-2.5 group cursor-pointer text-xs leading-relaxed select-none">
                        <input
                          type="checkbox"
                          checked={agreeToTerms}
                          onChange={(e) => setAgreeToTerms(e.target.checked)}
                          className="mt-0.5 rounded border-gray-300 dark:border-natural-dark-border text-natural-primary focus:ring-natural-primary"
                        />
                        <span className={darkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-600 group-hover:text-gray-800'}>
                          I hereby agree to the <span className="text-natural-primary font-bold hover:underline">Terms of Service</span> and <span className="text-natural-primary font-bold hover:underline">Privacy Policy</span>, aligning actions with local SDG regulatory recycling objectives.
                        </span>
                      </label>
                    </motion.div>
                  )}

                  {/* Login Remember Me selection */}
                  {view === 'login' && (
                    <div className="flex items-center justify-between py-1">
                      <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-gray-300 dark:border-natural-dark-border text-natural-primary focus:ring-natural-primary cursor-pointer"
                        />
                        Remember my email
                      </label>
                    </div>
                  )}

                  {/* Submit Call-to-action */}
                  <button
                    type="submit"
                    disabled={loading || (view === 'signup' && (!agreeToTerms || strength.score < 2 || password !== confirmPassword))}
                    className={`w-full text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-emerald-500/10 active:scale-[0.98] flex items-center justify-center cursor-pointer ${
                      view === 'signup' && (!agreeToTerms || strength.score < 2 || password !== confirmPassword)
                        ? 'bg-gray-400 dark:bg-gray-800 text-gray-300 cursor-not-allowed opacity-50 shadow-none'
                        : 'bg-natural-primary hover:bg-natural-primary-hover shadow-lg'
                    }`}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <span className="flex items-center gap-2">
                        {view === 'login' ? 'Authenticate Session' : 'Provision Green Profile'}
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </button>

                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Amazon/Notion Style Trust Compliance Badges */}
          <div className="mt-10 border-t border-dashed border-gray-200 dark:border-natural-dark-border pt-6 text-center space-y-4">
            <div className="flex justify-center items-center gap-6 text-[10px] text-gray-400 dark:text-gray-500">
              <span className="flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> AES-256 SSL Encryption
              </span>
              <span className="flex items-center gap-1 font-medium">
                <LockKeyhole className="w-3.5 h-3.5 text-emerald-500" /> SOC-2 Compliant Vault
              </span>
            </div>
            
            <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed max-w-xs mx-auto">
              Our servers store and analyze waste images to calculate circular rate analytics strictly under privacy compliance models. Photos are stripped of tracking metadata on uploads.
            </p>
          </div>



        </div>

        {/* Small bottom Copyright / details panel */}
        <div className="text-center pt-8 text-[10px] text-gray-400 dark:text-gray-500">
          &copy; {new Date().getFullYear()} EcoSmart AI. Incorporating SDG 12 frameworks. All rights reserved.
        </div>
      </div>

    </div>
  );
}
