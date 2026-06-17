import React from 'react';
import { ShieldAlert, RefreshCw, AlertCircle, WifiOff, CameraOff, MapPin, Server, Database } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  type?: 'ai' | 'network' | 'camera' | 'location' | 'empty_centers' | 'server' | 'database' | 'generic';
  onRetry?: () => void;
  retryText?: string;
}

export default function ErrorAlert({ message, type = 'generic', onRetry, retryText = 'Try Again' }: ErrorAlertProps) {
  // Map type of error into a gorgeous, relevant, user-friendly icon
  const getIcon = () => {
    switch (type) {
      case 'network':
        return <WifiOff className="w-5 h-5 text-amber-500 animate-pulse" />;
      case 'camera':
        return <CameraOff className="w-5 h-5 text-rose-500" />;
      case 'location':
        return <MapPin className="w-5 h-5 text-amber-500" />;
      case 'server':
        return <Server className="w-5 h-5 text-rose-500" />;
      case 'database':
        return <Database className="w-5 h-5 text-rose-500" />;
      case 'ai':
        return <AlertCircle className="w-5 h-5 text-emerald-500 animate-pulse" />;
      default:
        return <ShieldAlert className="w-5 h-5 text-rose-500" />;
    }
  };

  // Determine elegant light/dark styling border colors matching our design palette
  const getCardStyle = () => {
    switch (type) {
      case 'ai':
      case 'location':
      case 'network':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400';
      default:
        return 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400';
    }
  };

  return (
    <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${getCardStyle()} animate-fadeIn`}>
      <div className="flex items-start sm:items-center space-x-3">
        <div className="shrink-0 mt-0.5 sm:mt-0 p-1.5 bg-white/20 dark:bg-black/20 rounded-lg">
          {getIcon()}
        </div>
        <div>
          <p className="text-xs font-bold font-sans leading-tight">System Alert</p>
          <p className="text-[11px] leading-relaxed opacity-95 font-medium mt-0.5">{message}</p>
        </div>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="self-end sm:self-center shrink-0 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 dark:bg-black/20 dark:hover:bg-black/30 text-current text-[10px] font-black uppercase tracking-wider py-1.5 px-3 rounded-lg transition duration-150 cursor-pointer active:scale-95"
        >
          <RefreshCw className="w-3 h-3 text-current" />
          {retryText}
        </button>
      )}
    </div>
  );
}
