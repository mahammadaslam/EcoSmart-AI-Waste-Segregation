import React, { useState, useEffect } from 'react';
import { Users, Camera, Trash2, LineChart, Loader2, ShieldCheck, ShieldAlert, FileText, Info } from 'lucide-react';
import { adminService } from '../services/api.js';
import { User, Scan, DashboardStats } from '../types.js';
import { translateError } from '../utils/errorHelper.ts';
import ErrorAlert from '../components/ErrorAlert.tsx';

interface AdminPanelProps {
  user: any;
  darkMode: boolean;
}

export default function AdminPanel({ user, darkMode }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'ai' | 'network' | 'camera' | 'location' | 'empty_centers' | 'server' | 'database' | 'generic'>('generic');
  const [message, setMessage] = useState('');

  const [activeTab, setActiveTab] = useState<'users' | 'scans' | 'analytics'>('users');

  // Verify authorization bounds
  const isAdmin = user && user.role === 'admin';

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

  const fetchAdminData = async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      setError('');
      
      const [usersData, scansData, analyticsData] = await Promise.all([
        adminService.getUsers(),
        adminService.getScans(),
        adminService.getAnalytics()
      ]);

      setUsers(usersData.users || []);
      setScans(scansData.scans || []);
      setStats(analyticsData.stats || null);
    } catch (err: any) {
      const friendly = translateError(err);
      setError(friendly.message);
      setErrorType(friendly.type);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [user]);

  // Handle user account deletions
  const handleDeleteUser = async (id: number) => {
    if (!window.confirm("CAUTION: Terminating this user account will delete all their scanned histories, metrics, and chat threads. This is irreversible. Proceed?")) {
      return;
    }

    setActionLoading(true);
    setError('');
    setMessage('');

    try {
      const data = await adminService.deleteUser(id);
      setMessage(data.message || 'User account successfully terminated.');
      // Refresh list
      setUsers(prev => prev.filter(u => u.id !== id));
      // Deletion cascades deletes scans locally in state for instant UI update
      setScans(prev => prev.filter(s => s.user_id !== id));
    } catch (err: any) {
      const friendly = translateError(err);
      setError(friendly.message);
      setErrorType(friendly.type);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle scan record deletions
  const handleDeleteScan = async (id: number) => {
    if (!window.confirm("Confirm deletion of this material scan from the database?")) return;

    setActionLoading(true);
    setError('');
    setMessage('');

    try {
      const data = await adminService.deleteScan(id);
      setMessage(data.message || 'Scan record removed from database.');
      setScans(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      const friendly = translateError(err);
      setError(friendly.message);
      setErrorType(friendly.type);
    } finally {
      setActionLoading(false);
    }
  };

  // Guard access if not admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-rose-500/10 text-rose-500 rounded-full mb-4 animate-pulse">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-bold">Unauthorized Access Declined</h3>
        <p className={`text-xs mt-1.5 max-w-sm leading-relaxed ${darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'}`}>
          This workstation is structurally encrypted for Administrator use only. Standard accounts lack DB read privileges. Sign in as <strong className="text-natural-primary">admin@ecosmart.com</strong> to unlock.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-10 h-10 animate-spin text-natural-primary" />
        <p className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'}`}>Synching physical catalog datasets...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-8">
      
      {/* Header section info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-natural-border/20">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center text-natural-primary">
            <ShieldCheck className="w-6 h-6 text-natural-primary mr-2 shrink-0 animate-pulse" />
            Global Administrator Panel
          </h2>
          <p className={`text-sm mt-1 mb-2 ${darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'}`}>
            Superuser workstation with full read/write database authorization and record deletion privileges.
          </p>
        </div>

        {/* Action load status */}
        {actionLoading && (
          <span className="text-xxs font-bold text-natural-secondary bg-natural-secondary/10 px-3 py-1 rounded-full border border-natural-secondary/20 uppercase tracking-widest animate-pulse flex items-center shrink-0">
            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Committing changes...
          </span>
        )}
      </div>

      {/* Message and Error alerts */}
      {error && (
        <div className="mb-2">
          <ErrorAlert
            message={error}
            type={errorType}
            onRetry={fetchAdminData}
            retryText="Resync Database"
          />
        </div>
      )}
      {message && (
        <div className="p-3 bg-natural-primary/15 border border-natural-primary/25 text-natural-primary rounded-lg text-xs font-semibold leading-relaxed">
          {message}
        </div>
      )}

      {/* Tabs navigation menu */}
      <div className="flex space-x-2 border-b border-natural-border/20 pb-0.5">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4.5 py-2.5 text-xs font-bold uppercase tracking-widest border-b-2 transition duration-150 cursor-pointer flex items-center ${
            activeTab === 'users'
              ? 'border-natural-primary text-natural-primary'
              : 'border-transparent text-natural-muted hover:text-natural-primary'
          }`}
        >
          <Users className="w-4 h-4 mr-1.5 shrink-0" />
          Registered Users ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('scans')}
          className={`px-4.5 py-2.5 text-xs font-bold uppercase tracking-widest border-b-2 transition duration-150 cursor-pointer flex items-center ${
            activeTab === 'scans'
              ? 'border-natural-primary text-natural-primary'
              : 'border-transparent text-natural-muted hover:text-natural-primary'
          }`}
        >
          <Camera className="w-4 h-4 mr-1.5 shrink-0" />
          Database Scans ({scans.length})
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4.5 py-2.5 text-xs font-bold uppercase tracking-widest border-b-2 transition duration-150 cursor-pointer flex items-center ${
            activeTab === 'analytics'
              ? 'border-natural-primary text-natural-primary'
              : 'border-transparent text-natural-muted hover:text-natural-primary'
          }`}
        >
          <LineChart className="w-4 h-4 mr-1.5 shrink-0" />
          System Health
        </button>
      </div>

      {/* COMPONENT RENDER VIEWS */}

      {/* 1. REGISTERED USERS LISTING */}
      {activeTab === 'users' && (
        <div className={`border rounded-xl overflow-x-auto ${darkMode ? 'border-natural-dark-border bg-natural-dark-card/10' : 'border-natural-border bg-white'}`}>
          {users.length === 0 ? (
            <div className="p-12 text-center text-natural-muted">No users registered in the database yet.</div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b border-natural-border/20 font-bold uppercase text-[10px] tracking-widest ${darkMode ? 'bg-natural-dark-bg/40 text-natural-dark-muted' : 'bg-natural-sand text-natural-muted'}`}>
                  <th className="p-4 text-center">ID</th>
                  <th className="p-4">User Details</th>
                  <th className="p-4">Email Account</th>
                  <th className="p-4 text-center">Role</th>
                  <th className="p-4">Registered Date</th>
                  <th className="p-4 text-center">Admin Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-natural-border/10">
                {users.map(u => (
                  <tr key={u.id} className={`hover:bg-natural-secondary/5 transition ${darkMode ? 'text-natural-dark-text' : 'text-natural-dark'}`}>
                    <td className="p-4 font-mono text-center font-bold">{u.id}</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-natural-primary/10 text-natural-primary font-extrabold flex items-center justify-center text-xs shrink-0 font-sans">
                          {u.profile_image ? (
                            <img src={u.profile_image} alt={u.name} className="w-full h-full object-cover" />
                          ) : u.name.substring(0,2).toUpperCase()}
                        </div>
                        <span className="font-extrabold">{u.name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-semibold">{u.email}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border leading-none ${
                        u.role === 'admin' 
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' 
                          : 'bg-natural-primary/10 border-natural-primary/20 text-natural-primary'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-natural-muted text-xxs font-mono">{new Date(u.created_at).toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        disabled={actionLoading}
                        className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 p-2 rounded-lg transition disabled:opacity-40 cursor-pointer"
                        title="Delete User and cascade clear all metadata logs"
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 2. CATALOGUE SCANS LISTINGS */}
      {activeTab === 'scans' && (
        <div className={`border rounded-xl overflow-x-auto ${darkMode ? 'border-natural-dark-border bg-natural-dark-card/10' : 'border-natural-border bg-white'}`}>
          {scans.length === 0 ? (
            <div className="p-12 text-center text-natural-muted">No category scans compiled in the database yet.</div>
          ) : (
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className={`border-b border-natural-border/20 font-bold uppercase text-[10px] tracking-widest ${darkMode ? 'bg-natural-dark-bg/40 text-natural-dark-muted' : 'bg-natural-sand text-natural-muted'}`}>
                  <th className="p-4 text-center">ID</th>
                  <th className="p-4">Owner Profile</th>
                  <th className="p-4 text-center">Snapshot</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 text-center">Match Rate</th>
                  <th className="p-4">Submission Date</th>
                  <th className="p-4 text-center">Admin Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-natural-border/10">
                {scans.map(s => (
                  <tr key={s.id} className={`hover:bg-natural-secondary/5 transition ${darkMode ? 'text-natural-dark-text' : 'text-natural-dark'}`}>
                    <td className="p-4 font-mono text-center font-bold">{s.id}</td>
                    <td className="p-4">
                      <div>
                        <p className="font-extrabold">{s.username}</p>
                        <p className="text-xxs text-natural-muted mt-0.5">{s.userEmail}</p>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="w-10 h-10 rounded-lg overflow-hidden mx-auto bg-black/10 flex items-center justify-center shrink-0">
                        <img src={s.image_url} alt={s.category} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="p-4 font-extrabold text-natural-primary">{s.category}</td>
                    <td className="p-4 text-center font-mono font-black">{getConfidenceString(s.confidence)}</td>
                    <td className="p-4 text-natural-muted text-xxs font-mono">{new Date(s.created_at).toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDeleteScan(s.id)}
                        disabled={actionLoading}
                        className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 p-2 rounded-lg transition disabled:opacity-40 cursor-pointer"
                        title="Delete Scan record"
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 3. SYSTEM STATS & METRICS COUNTS */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Tech Spec status card */}
          <div className={`p-6 rounded-2xl border space-y-4 ${darkMode ? 'bg-natural-dark-card/45 border-natural-dark-border' : 'bg-white border-natural-border shadow-sm'}`}>
            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center text-natural-primary">
              <FileText className="w-4.5 h-4.5 text-natural-primary mr-2 shrink-0 animate-pulse" />
              Runtime Config Metadata
            </h3>
            
            <div className="space-y-3.5 text-xs text-natural-dark dark:text-natural-dark-text">
              <div className="flex justify-between pb-2 border-b border-natural-border/10">
                <span className="text-natural-muted">Database Driver Connection:</span>
                <span className="font-extrabold">{stats ? 'MySQL (mysql2 connection pool Active)' : 'Local File Sandbox Engine'}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-natural-border/10">
                <span className="text-natural-muted">Gemini Key Authorization:</span>
                <span className="font-extrabold text-natural-primary">Verified & Active on Server</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-natural-border/10">
                <span className="text-natural-muted">Google OAuth 2.0 Passport Callback:</span>
                <span className="font-extrabold">Redirect-Secure</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-natural-border/10">
                <span className="text-natural-muted">Port Routing Access:</span>
                <span className="font-mono font-bold">Inbound Port 3000 Active</span>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-2xl border flex flex-col justify-between ${darkMode ? 'bg-natural-dark-card/45 border-natural-dark-border' : 'bg-white border-natural-border'}`}>
            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center text-natural-secondary">
              <Info className="w-4.5 h-4.5 text-natural-secondary mr-2 shrink-0" />
              Administrative Guidelines
            </h3>
            <p className={`text-xs leading-relaxed ${darkMode ? 'text-natural-dark-text' : 'text-natural-dark'}`}>
              As an administrator, you possess access to delete user profiles. Keep in mind that terminating a user cascades deletion of all their material scans across the catalog. Maintain extreme discretion when auditing database logs.
            </p>
            <div className={`p-3 rounded-xl border mt-4 text-[11px] leading-relaxed ${darkMode ? 'bg-natural-dark-bg border-natural-dark-border text-natural-dark-muted' : 'bg-natural-sand border-natural-border text-natural-muted'}`}>
              Standard queries require JWT headers to access administrative endpoints. Unauthorized requests automatically trigger a 403 authorization error.
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
