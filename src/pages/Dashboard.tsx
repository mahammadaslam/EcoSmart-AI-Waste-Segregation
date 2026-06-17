import React, { useState, useEffect } from 'react';
import { 
  Camera, MessageSquare, BookOpen, MapPin, Sparkles, 
  ArrowRight, Shield, Award, Flame, Calendar, Trash2 
} from 'lucide-react';
import { motion } from 'motion/react';
import { scanService } from '../services/api.ts';
import { Scan } from '../types.ts';
import { translateError } from '../utils/errorHelper.ts';
import ErrorAlert from '../components/ErrorAlert.tsx';

interface DashboardProps {
  user: any;
  darkMode: boolean;
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ user, darkMode, onNavigate }: DashboardProps) {
  const [recentScans, setRecentScans] = useState<Scan[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'ai' | 'network' | 'camera' | 'location' | 'empty_centers' | 'server' | 'database' | 'generic'>('generic');

  const fetchScanHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await scanService.getScanHistory();
      const list = data.scans || [];
      setRecentScans(list.slice(0, 5)); // trailing 5 additions for compact recent activity list
      setTotalCount(list.length);
    } catch (err: any) {
      console.warn('Silent scan history acquire failed on Dashboard, using default bounds:', err);
      const friendly = translateError(err);
      setError(friendly.message);
      setErrorType(friendly.type);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScanHistory();
  }, [user]);

  // Color mapping badges for categories
  const getCategoryTheme = (category: string) => {
    switch (category.toLowerCase()) {
      case 'plastic': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'paper': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'metal': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      case 'organic': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'e-waste': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'glass': return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
      default: return 'bg-natural-accent/10 text-natural-accent border-natural-accent/20';
    }
  };

  const getConfidenceString = (val: any) => {
    if (val === undefined || val === null) return '0.0%';
    const num = Number(val);
    if (isNaN(num)) return '0.0%';
    let percentage = num > 1 ? num : num * 100;
    if (percentage > 100) {
      percentage = percentage / 100;
    }
    if (percentage > 100) {
      percentage = 100;
    }
    return `${percentage.toFixed(1)}%`;
  };

  const renderStatCard = (title: string, value: string | number, subtitle: string, colorClass: string, bgClass: string, icon: React.ReactNode) => {
    return (
      <div className={`p-5 rounded-2xl border backdrop-blur-md transition-all duration-300 ${
        darkMode 
          ? 'bg-natural-dark-card/65 border-natural-dark-border hover:border-natural-secondary' 
          : 'bg-white border-natural-border hover:border-natural-secondary shadow-xs'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-[10px] font-black uppercase tracking-wider ${darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'}`}>{title}</span>
          <div className={`p-2 rounded-xl ${bgClass} ${colorClass}`}>
            {icon}
          </div>
        </div>
        <p className="text-2.5xl font-black tracking-tight">{value}</p>
        <p className={`text-[9px] font-bold mt-1 uppercase tracking-widest ${darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'}`}>{subtitle}</p>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 animate-fadeIn">
      
      {/* 1. WELCOME SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 border-natural-border/20">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-natural-primary">EcoSmart AI Workspace</h2>
          <p className={`text-xs mt-1 ${darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'}`}>
            Welcome back, <strong className="text-natural-primary">{user?.name}</strong>. Your workstation is synchronized and active.
          </p>
        </div>
        <button
          onClick={() => onNavigate('scanner')}
          className="bg-natural-primary hover:bg-natural-primary-hover text-white px-5 py-2.5 rounded-xl font-bold text-xxs uppercase tracking-wider select-none transition-all shadow-lg shadow-natural-primary/15 flex items-center justify-center self-start md:self-auto cursor-pointer"
        >
          <Camera className="w-4 h-4 mr-2" />
          Scan Waste Material
        </button>
      </div>

      {error && (
        <ErrorAlert
          message={error}
          type={errorType}
          onRetry={fetchScanHistory}
          retryText="Reconnect Server"
        />
      )}

      {/* 2. SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderStatCard(
          'Accumulated Swaps', 
          totalCount, 
          'Total Scanned count', 
          'text-natural-primary', 
          'bg-natural-primary/10', 
          <Award className="w-4.5 h-4.5" />
        )}
        {renderStatCard(
          'Average Accuracy', 
          '94.8%', 
          'Vision Model index', 
          'text-emerald-500', 
          'bg-emerald-500/10', 
          <Shield className="w-4.5 h-4.5" />
        )}
        {renderStatCard(
          'Carbon Saved', 
          `${(totalCount * 1.8).toFixed(1)} kg`, 
          'CO2 Offset valuation', 
          'text-blue-500', 
          'bg-blue-500/10', 
          <Flame className="w-4.5 h-4.5" />
        )}
        {renderStatCard(
          'Resource tier', 
          totalCount >= 10 ? 'Elite' : totalCount >= 3 ? 'Eco Scout' : 'Novice', 
          'Regional SDG-12 Badge', 
          'text-purple-500', 
          'bg-purple-500/10', 
          <Sparkles className="w-4.5 h-4.5" />
        )}
      </div>

      {/* 3. REFOCUSED COMPACT SYSTEM DYNAMICS (REPLACING THE OLD MARKETING CARD) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
        
        {/* Panel 1: Recent Scan Summary */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between text-left transition duration-300 ${
          darkMode ? 'bg-natural-dark-card/45 border-natural-dark-border' : 'bg-white border-natural-border shadow-xs'
        }`}>
          <div>
            <div className="flex items-center space-x-2 text-blue-500 mb-2">
              <Camera className="w-4 h-4 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-wider">Recent Scan Summary</span>
            </div>
            {recentScans.length > 0 ? (
              <div className="space-y-1 mt-2">
                <p className={`text-xs font-black truncate text-natural-primary`}>
                  {recentScans[0].detected_object || `${recentScans[0].category} Item`}
                </p>
                <p className={`text-[10px] leading-relaxed ${darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'}`}>
                  Classified as <strong className="text-natural-primary uppercase">{recentScans[0].category}</strong> with {getConfidenceString(recentScans[0].confidence)} match rate.
                </p>
              </div>
            ) : (
              <p className={`text-[10px] leading-relaxed mt-2 ${darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'}`}>
                No scan entries recorded yet. Tap the scanner to initiate a material classification stream.
              </p>
            )}
          </div>
          <button 
            onClick={() => onNavigate('scanner')}
            className="text-left text-xxs font-extrabold text-blue-505 hover:underline mt-4 flex items-center gap-1 cursor-pointer text-blue-500"
          >
            Launch Scanner &rarr;
          </button>
        </div>

        {/* Panel 2: Waste Category Statistics */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between text-left transition duration-300 ${
          darkMode ? 'bg-natural-dark-card/45 border-natural-dark-border' : 'bg-white border-natural-border shadow-xs'
        }`}>
          <div>
            <div className="flex items-center space-x-2 text-amber-500 mb-2">
              <Award className="w-4 h-4 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-wider font-mono">Waste Distributions</span>
            </div>
            <div className="mt-2 space-y-2">
              <div className="flex justify-between items-center text-[10px]">
                <span className={darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'}>Aggregate logs:</span>
                <span className="font-extrabold text-natural-primary">{totalCount} items</span>
              </div>
              <div className="w-full bg-slate-500/10 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(12, totalCount * 10))}%` }}
                ></div>
              </div>
              <p className={`text-[9px] ${darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'} leading-tight`}>
                Live tracking distributed over household recycles.
              </p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('analytics')}
            className="text-left text-xxs font-extrabold text-amber-505 hover:underline mt-4 flex items-center gap-1 cursor-pointer text-amber-500"
          >
            View Live Charts &rarr;
          </button>
        </div>

        {/* Panel 3: Today's Environmental Impact Summary */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between text-left transition duration-300 ${
          darkMode ? 'bg-natural-dark-card/45 border-natural-dark-border' : 'bg-white border-natural-border shadow-xs'
        }`}>
          <div>
            <div className="flex items-center space-x-2 text-emerald-500 mb-2">
              <Flame className="w-4 h-4 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-wider font-mono">Environmental Impact</span>
            </div>
            <div className="mt-2 space-y-1">
              <p className={`text-xs font-black ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                {(totalCount * 1.8).toFixed(1)} kg CO₂ Offset
              </p>
              <p className={`text-[9.5px] leading-relaxed ${darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'}`}>
                Conserves we estimate {(totalCount * 5.4).toFixed(1)}L of water and diverts {(totalCount * 0.4).toFixed(1)} kg from standard regional landfill space.
              </p>
            </div>
          </div>
          <span className="text-[9px] font-bold text-emerald-500 mt-4 uppercase tracking-widest">Calculated Live</span>
        </div>

        {/* Panel 4: Nearby Recycling Center Summary */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between text-left transition duration-300 ${
          darkMode ? 'bg-natural-dark-card/45 border-natural-dark-border' : 'bg-white border-natural-border shadow-xs'
        }`}>
          <div>
            <div className="flex items-center space-x-2 text-purple-500 mb-2">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-wider font-mono">Nearest Centers</span>
            </div>
            <div className="mt-2 space-y-1">
              <p className={`text-xs font-black text-purple-500`}>
                Local Depots Map
              </p>
              <p className={`text-[10px] leading-relaxed ${darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'}`}>
                {recentScans.length > 0 
                  ? `Locator optimized to sort and drop your scanned ${recentScans[0].category} packaging safely.`
                  : 'Locate local composting arrays, e-waste centers, and general recycling partner facilities.'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('maps')}
            className="text-left text-xxs font-extrabold hover:underline mt-4 flex items-center gap-1 cursor-pointer text-purple-500"
          >
            Open Locator Map &rarr;
          </button>
        </div>

      </div>

      {/* 4. QUICK ACTIONS & RECENT ACTIVITY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* QUICK ACTIONS PANEL (2 Columns width on large screens) */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="text-xs font-black text-natural-dark dark:text-white uppercase tracking-wider pl-1 font-mono">Quick Actions</h4>
          
          <div className="grid grid-cols-1 gap-3">
            <div 
              onClick={() => onNavigate('scanner')}
              className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition select-none group ${
                darkMode ? 'bg-natural-dark-card/50 border-natural-dark-border hover:border-natural-primary' : 'bg-white border-natural-border hover:border-natural-primary'
              }`}
            >
              <div className="flex items-center space-x-3 text-left">
                <div className="p-2 bg-blue-500/15 text-blue-500 rounded-xl group-hover:scale-105 transition">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-extrabold text-[11px] text-natural-dark dark:text-white">AI Waste Scanner</h5>
                  <p className={`text-[9px] mt-0.5 ${darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'}`}>Upload images & categorize elements</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-natural-muted group-hover:translate-x-1 transition shrink-0" />
            </div>

            <div 
              onClick={() => onNavigate('chat')}
              className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition select-none group ${
                darkMode ? 'bg-natural-dark-card/50 border-natural-dark-border hover:border-natural-primary' : 'bg-white border-natural-border hover:border-natural-primary'
              }`}
            >
              <div className="flex items-center space-x-3 text-left">
                <div className="p-2 bg-purple-500/15 text-purple-500 rounded-xl group-hover:scale-105 transition">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-extrabold text-[11px] text-natural-dark dark:text-white">AI Chat Assistant</h5>
                  <p className={`text-[9px] mt-0.5 ${darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'}`}>Consult custom recycling directives</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-natural-muted group-hover:translate-x-1 transition shrink-0" />
            </div>

            <div 
              onClick={() => onNavigate('maps')}
              className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition select-none group ${
                darkMode ? 'bg-natural-dark-card/50 border-natural-dark-border hover:border-natural-primary' : 'bg-white border-natural-border hover:border-natural-primary'
              }`}
            >
              <div className="flex items-center space-x-3 text-left">
                <div className="p-2 bg-emerald-500/15 text-emerald-500 rounded-xl group-hover:scale-105 transition">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-extrabold text-[11px] text-natural-dark dark:text-white">Recycling Centers Map</h5>
                  <p className={`text-[9px] mt-0.5 ${darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'}`}>Locate depots and driving paths</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-natural-muted group-hover:translate-x-1 transition shrink-0" />
            </div>

            <div 
              onClick={() => onNavigate('learning')}
              className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition select-none group ${
                darkMode ? 'bg-natural-dark-card/50 border-natural-dark-border hover:border-natural-primary' : 'bg-white border-natural-border hover:border-natural-primary'
              }`}
            >
              <div className="flex items-center space-x-3 text-left">
                <div className="p-2 bg-yellow-500/15 text-yellow-500 rounded-xl group-hover:scale-105 transition">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-extrabold text-[11px] text-natural-dark dark:text-white">Waste Learning Center</h5>
                  <p className={`text-[9px] mt-0.5 ${darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'}`}>Browse articles, rules and guides</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-natural-muted group-hover:translate-x-1 transition shrink-0" />
            </div>
          </div>
        </div>

        {/* RECENT ACTIVITY LIST (3 Columns width on large screens) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between pl-1">
            <h4 className="text-xs font-black text-natural-dark dark:text-white uppercase tracking-wider font-mono">Recent Activity</h4>
            <span className="text-[10px] text-natural-primary font-bold uppercase tracking-widest">{recentScans.length} recent uploads</span>
          </div>

          <div className={`p-5 rounded-2xl border min-h-[352px] flex flex-col justify-between ${
            darkMode ? 'bg-natural-dark-card/45 border-natural-dark-border' : 'bg-white border-natural-border'
          }`}>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3 flex-1">
                <div className="w-8 h-8 border-3 border-natural-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] font-black tracking-widest uppercase text-natural-muted">Loading scan streams...</span>
              </div>
            ) : recentScans.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 flex-1">
                <div className="p-3 bg-natural-primary/10 rounded-full text-natural-primary">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-natural-dark dark:text-white">No scans logged</p>
                  <p className={`text-[10px] mt-0.5 max-w-xs mx-auto leading-normal ${darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'}`}>
                    Use the AI Waste Scanner to classify materials. They will be displayed in this feed immediately.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('scanner')}
                  className="bg-natural-primary text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition"
                >
                  Scanner Page
                </button>
              </div>
            ) : (
              <div className="divide-y divide-natural-border/10 dark:divide-natural-dark-border/40 flex-1">
                {recentScans.map((scan) => (
                  <div key={scan.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="flex items-center space-x-3.5 text-left min-w-0">
                      {scan.image_url ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-natural-border/20 dark:border-natural-dark-border/40 shrink-0 bg-natural-sand">
                          <img 
                            src={scan.image_url} 
                            alt={scan.category} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-natural-primary/10 text-natural-primary flex items-center justify-center shrink-0">
                          <Camera className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 font-bold uppercase tracking-wide rounded-md border ${getCategoryTheme(scan.category)}`}>
                            {scan.category}
                          </span>
                          <span className="text-[10px] font-bold text-natural-muted">
                            {getConfidenceString(scan.confidence)} Match
                          </span>
                        </div>
                        <p className={`text-[10px] mt-1 truncate max-w-sm ${darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'}`}>
                          {scan.recommendation || 'Scanned material synchronized'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-natural-muted whitespace-nowrap shrink-0">
                      {new Date(scan.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="pt-3.5 border-t border-natural-border/10 dark:border-natural-dark-border/20 flex justify-between items-center text-xxs">
              <span className={darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'}>Real-time scan logs</span>
              <button 
                onClick={() => onNavigate('scanner')} 
                className="text-natural-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                Scan new product &rarr;
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
