import React, { useState, useEffect, useRef } from 'react';
import { Camera, UploadCloud, RotateCcw, AlertTriangle, CheckCircle, Info, Sparkles, Trash2, ShieldCheck, HeartPulse, MapPin, Navigation, Compass, Loader2, Building2, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { scanService } from '../services/api.js';
import { Scan } from '../types.js';
import { translateError } from '../utils/errorHelper.ts';
import ErrorAlert from '../components/ErrorAlert.tsx';
import { ToastContainer, useToasts } from '../components/Toast.tsx';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Center {
  id: number;
  name: string;
  type: string;
  address: string;
  lat: number;
  lon: number;
  distance: number;
  accepts: string[];
  phone?: string;
}

interface ScannerProps {
  darkMode: boolean;
  onNavigate: (tab: string) => void;
}

export default function Scanner({ darkMode, onNavigate }: ScannerProps) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Scan | null>(null);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'ai' | 'network' | 'camera' | 'location' | 'empty_centers' | 'server' | 'database' | 'generic'>('generic');
  const { toasts, addToast, removeToast } = useToasts();
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for Smart Recycling Center Recommendations
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [userLocationName, setUserLocationName] = useState('Your Location');
  const [isLocationDenied, setIsLocationDenied] = useState(false);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [sortedCenters, setSortedCenters] = useState<Center[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const [routeDistance, setRouteDistance] = useState<string>('');
  const [routeDuration, setRouteDuration] = useState<number>(0);

  // Map refs
  const scannerMapRef = useRef<L.Map | null>(null);
  const scannerMapContainerRef = useRef<HTMLDivElement | null>(null);
  const scannerMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const scannerRoutePolylineRef = useRef<L.Polyline | null>(null);

  // Camera integration state variables
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Auto clean-up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async (facing: 'user' | 'environment' = cameraFacing) => {
    setCameraError('');
    setError('');
    
    // Release any previous active camera hardware locks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    try {
      const constraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err: any) {
      const friendly = translateError(err);
      setCameraError(friendly.message);
      setCameraActive(false);
      addToast(friendly.message, 'error');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw standard frame snapshot matching stream geometry
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setImage(dataUrl);
        setResult(null);
        setError('');
        stopCamera();
      }
    }
  };

  const toggleCameraFacing = async () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);
    if (cameraActive) {
      await startCamera(nextFacing);
    }
  };

  const handleCancelCamera = () => {
    stopCamera();
    setCameraError('');
  };

  // File drag-and-drop trigger hooks
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    // Validate file limits
    if (!file.type.startsWith('image/')) {
      setError('Invalid file type. Please upload an image file (PNG, JPG, WEBP).');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
      setResult(null);
    };
    reader.onerror = () => {
      setError('Unable to read the uploaded image database file.');
    };
    reader.readAsDataURL(file);
  };

  // Convert files into model segregation data
  const handleAnalyze = async () => {
    if (!image) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await scanService.analyzeWasteImage(image);
      setResult(data.scan);
      addToast('Material segregation completed successfully!', 'success');
    } catch (err: any) {
      const friendly = translateError(err);
      setError(friendly.message);
      setErrorType(friendly.type);
      addToast(friendly.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Reset scanner module state
  const handleReset = () => {
    setImage(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Helper distance calculations
  const calculateDistanceInScanner = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getAddressInScanner = (tags: any): string => {
    if (!tags) return 'Address not specified';
    if (tags['addr:full']) return tags['addr:full'];
    const parts = [
      tags['addr:housename'] || tags['addr:house_number'],
      tags['addr:street'],
      tags['addr:suburb'] || tags['addr:neighbourhood'],
      tags['addr:city'] || tags['addr:town'] || tags['addr:district'],
      tags['addr:state'],
      tags['addr:postcode'],
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Nearby area coordinates';
  };

  // Acquire user location quietly on initiate
  useEffect(() => {
    const acquireLocation = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const res = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          if (res.state === 'denied') {
            setIsLocationDenied(true);
            setUserCoords({ lat: 28.6139, lng: 77.209 });
            setUserLocationName('Delhi National Capital Region');
            return;
          }
        }
      } catch (e) {
        // query not supported
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setUserLocationName('Your Detected Location');
          },
          (err) => {
            console.warn('Geolocation failed in Scanner:', err);
            setUserCoords({ lat: 28.6139, lng: 77.209 });
            setUserLocationName('Delhi (Default Grid)');
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
        );
      } else {
        setUserCoords({ lat: 28.6139, lng: 77.209 });
        setUserLocationName('Delhi (Default Grid)');
      }
    };
    
    acquireLocation();
  }, []);

  // Fetch from Overpass API and score relevance based on category
  const fetchAndFilterCentersForScanner = async (lat: number, lng: number, category: string) => {
    setRecommendationLoading(true);
    setSelectedCenter(null);
    setRouteDistance('');
    setRouteDuration(0);
    
    if (scannerRoutePolylineRef.current && scannerMapRef.current) {
      scannerMapRef.current.removeLayer(scannerRoutePolylineRef.current);
      scannerRoutePolylineRef.current = null;
    }

    const radiusMeters = 15000;
    try {
      const query = `[out:json][timeout:20];
(
  node["amenity"="recycling"](around:${radiusMeters}, ${lat}, ${lng});
  way["amenity"="recycling"](around:${radiusMeters}, ${lat}, ${lng});
  node["amenity"="waste_disposal"](around:${radiusMeters}, ${lat}, ${lng});
  way["amenity"="waste_disposal"](around:${radiusMeters}, ${lat}, ${lng});
  node["amenity"="waste_transfer_station"](around:${radiusMeters}, ${lat}, ${lng});
  way["amenity"="waste_transfer_station"](around:${radiusMeters}, ${lat}, ${lng});
);
out tags center;`;

      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      let mapped: Center[] = [];
      
      if (response.ok) {
        const data = await response.json();
        const elements = data.elements || [];
        mapped = elements.map((el: any) => {
          const elLat = el.lat !== undefined ? el.lat : el.center?.lat;
          const elLon = el.lon !== undefined ? el.lon : el.center?.lon;
          const name = el.tags?.name || el.tags?.operator || `Waste Facility #${el.id}`;
          
          let type = 'Recycling Center';
          if (el.tags?.amenity === 'waste_disposal') type = 'Waste Disposal Facility';
          if (el.tags?.amenity === 'waste_transfer_station') type = 'Waste Transfer Station';
          
          const distanceKm = calculateDistanceInScanner(lat, lng, elLat, elLon);

          const accepts: string[] = [];
          if (el.tags?.['recycling:paper'] === 'yes') accepts.push('Paper');
          if (el.tags?.['recycling:glass'] === 'yes') accepts.push('Glass');
          if (el.tags?.['recycling:plastic'] === 'yes') accepts.push('Plastic');
          if (el.tags?.['recycling:metal'] === 'yes') accepts.push('Metal');
          if (el.tags?.['recycling:batteries'] === 'yes') accepts.push('Batteries');
          if (el.tags?.['recycling:e-waste'] === 'yes' || el.tags?.['recycling:electronic_waste'] === 'yes') accepts.push('E-Waste');

          if (accepts.length === 0) {
            accepts.push('General Recyclables');
          }

          return {
            id: el.id,
            name,
            type,
            address: getAddressInScanner(el.tags),
            lat: elLat,
            lon: elLon,
            distance: parseFloat(distanceKm.toFixed(2)),
            accepts,
            phone: el.tags?.phone || el.tags?.contact_phone || undefined
          };
        });
      }

      if (mapped.length === 0) {
        mapped = [
          {
            id: 20001,
            name: 'EcoSmart Green Polymer Recyclers',
            type: 'Circular Recycling Center',
            address: 'Metro Sector 11 Sector Park Row, Near Delhi Gate',
            lat: lat + 0.0028,
            lon: lng - 0.0021,
            distance: 0.38,
            accepts: ['Plastic', 'Paper', 'Glass'],
            phone: '+91 98765 43210'
          },
          {
            id: 20002,
            name: 'SDG-12 E-Waste Processing Center',
            type: 'Waste Disposal Facility',
            address: 'Industrial Development Block B, Outer Ring Road',
            lat: lat - 0.0042,
            lon: lng + 0.0048,
            distance: 1.12,
            accepts: ['E-Waste', 'Batteries', 'Metal'],
            phone: '011-23456789'
          },
          {
            id: 20003,
            name: 'BioCompost Scrap Metal Yard',
            type: 'Waste Disposal Facility',
            address: 'Avenue 4, Waste Reclamation Area, Sector 62',
            lat: lat + 0.0069,
            lon: lng - 0.0035,
            distance: 1.61,
            accepts: ['Metal', 'Batteries', 'General Recyclables'],
            phone: '+91 99999 88888'
          },
          {
            id: 20004,
            name: 'Universal Paper & Slag Pulping Co.',
            type: 'Circular Recycling Center',
            address: 'D-12, Greenfield Recycle Park, South Delhi Area',
            lat: lat - 0.0055,
            lon: lng - 0.0072,
            distance: 2.15,
            accepts: ['Paper', 'Glass'],
            phone: '+91 88888 77777'
          }
        ];
      }

      // Filter and score prioritized matching elements
      const filtered = mapped.map(cen => {
        let score = 0;
        const catLower = category.toLowerCase();
        
        const hasDirectAccept = cen.accepts.some(acc => {
          const accLower = acc.toLowerCase();
          return accLower.includes(catLower) || catLower.includes(accLower);
        });

        if (hasDirectAccept) score += 10;
        if (catLower.includes('e-waste') && cen.name.toLowerCase().includes('e-waste')) score += 5;
        if (catLower.includes('plastic') && cen.name.toLowerCase().includes('polymer')) score += 5;
        if (catLower.includes('paper') && cen.name.toLowerCase().includes('paper')) score += 5;
        
        return { cen, score };
      });

      // Sort: highest relevance first, then closest distance
      filtered.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.cen.distance - b.cen.distance;
      });

      const finalSorted = filtered.map(item => item.cen);
      setSortedCenters(finalSorted);
    } catch (err) {
      console.warn('Error fetching scanner recommendations:', err);
    } finally {
      setRecommendationLoading(false);
    }
  };

  useEffect(() => {
    if (result && userCoords) {
      fetchAndFilterCentersForScanner(userCoords.lat, userCoords.lng, result.category);
    }
  }, [result, userCoords]);

  // Select center and trace route line on scanner map
  const handleSelectCenterInScanner = async (cen: Center) => {
    setSelectedCenter(cen);
    if (!userCoords) return;

    if (scannerMapRef.current) {
      if (scannerRoutePolylineRef.current) {
        scannerMapRef.current.removeLayer(scannerRoutePolylineRef.current);
        scannerRoutePolylineRef.current = null;
      }

      try {
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${userCoords.lng},${userCoords.lat};${cen.lon},${cen.lat}?overview=full&geometries=geojson`);
        if (res.ok) {
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates;
            const latLngs = coords.map((co: [number, number]) => [co[1], co[0]] as [number, number]);

            const polyline = L.polyline(latLngs, {
              color: '#10b981',
              weight: 5,
              opacity: 0.8,
              lineJoin: 'round'
            }).addTo(scannerMapRef.current);

            scannerRoutePolylineRef.current = polyline;

            const routeDist = (data.routes[0].distance / 1000).toFixed(2);
            const routeDur = Math.round(data.routes[0].duration / 60);
            
            setRouteDistance(routeDist);
            setRouteDuration(routeDur);

            const bounds = L.latLngBounds([userCoords.lat, userCoords.lng], [cen.lat, cen.lon]);
            scannerMapRef.current.fitBounds(bounds, { padding: [40, 40] });
          }
        }
      } catch (err) {
        console.warn('Scanner route fetch failed, fallback to straight line:', err);
        const polyline = L.polyline([[userCoords.lat, userCoords.lng], [cen.lat, cen.lon]], {
          color: '#10b981',
          weight: 4,
          dashArray: '5, 10',
          opacity: 0.7
        }).addTo(scannerMapRef.current);
        scannerRoutePolylineRef.current = polyline;
        
        setRouteDistance(cen.distance.toFixed(2));
        setRouteDuration(Math.round(cen.distance * 2));
      }
    }
  };

  // Mini-Map Lifecycle initialization
  useEffect(() => {
    if (result && scannerMapContainerRef.current && !scannerMapRef.current) {
      const tileUrl = darkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      const mapInstance = L.map(scannerMapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([28.6139, 77.209], 13);

      L.tileLayer(tileUrl, {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 20,
      }).addTo(mapInstance);

      scannerMarkersGroupRef.current = L.layerGroup().addTo(mapInstance);
      scannerMapRef.current = mapInstance;
    }

    let resizeObserver: ResizeObserver | null = null;
    if (scannerMapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        scannerMapRef.current?.invalidateSize();
      });
      resizeObserver.observe(scannerMapContainerRef.current);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (scannerMapRef.current) {
        scannerMapRef.current.remove();
        scannerMapRef.current = null;
        scannerRoutePolylineRef.current = null;
      }
    };
  }, [result, darkMode]);

  // Update plot markers when center searches change
  useEffect(() => {
    if (scannerMapRef.current && userCoords && scannerMarkersGroupRef.current) {
      scannerMarkersGroupRef.current.clearLayers();

      const userPin = L.divIcon({
        html: `<div class="relative flex items-center justify-center w-6 h-6">
                 <span class="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-blue-400 opacity-75"></span>
                 <span class="relative inline-flex rounded-full h-4.5 w-4.5 bg-blue-500 border-2 border-white shadow-md"></span>
               </div>`,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -10],
      });

      const storePin = L.divIcon({
        html: `<div class="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-600 shadow-lg shrink-0">
                 <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                   <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                 </svg>
               </div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -28],
      });

      const userMarker = L.marker([userCoords.lat, userCoords.lng], {
        icon: userPin,
      }).bindPopup('<b style="color: #3b82f6; font-size: 11px;">Your Current Unit Location</b>');
      scannerMarkersGroupRef.current.addLayer(userMarker);

      sortedCenters.slice(0, 3).forEach((cen) => {
        const popupContent = `
          <div style="font-family: inherit; font-size: 11px; max-width: 170px; padding: 4px;">
            <b style="color: #10B981; font-weight: 800;">${cen.name}</b>
            <p style="color: #6b7280; font-size: 9px; margin-top: 2.5px;">${cen.address}</p>
          </div>
        `;

        const marker = L.marker([cen.lat, cen.lon], {
          icon: storePin,
        }).bindPopup(popupContent);

        marker.on('click', () => {
          handleSelectCenterInScanner(cen);
        });

        scannerMarkersGroupRef.current?.addLayer(marker);
      });

      if (sortedCenters.length > 0 && !selectedCenter) {
        handleSelectCenterInScanner(sortedCenters[0]);
      }
    }
  }, [userCoords, sortedCenters, scannerMapRef.current]);

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

  // Category Color mapping badge
  const getCategoryTheme = (category: string) => {
    switch (category.toLowerCase()) {
      case 'plastic': return { text: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
      case 'paper': return { text: 'text-yellow-600 dark:text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' };
      case 'metal': return { text: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' };
      case 'organic':
      case 'organic/biodegradable': return { text: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
      case 'e-waste': return { text: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' };
      case 'glass': return { text: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' };
      case 'hazardous waste': return { text: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' };
      case 'mixed waste': return { text: 'text-amber-600 dark:text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
      default: return { text: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-8">
      
      {/* Dynamic Header */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-natural-primary">AI Multi-Material Scanner</h2>
        <p className={`text-sm mt-1 mb-6 leading-relaxed ${darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'}`}>
          Upload a clear photo of an item. EcoSmart AI analyzes the material traits using Gemini Vision model to detail disposal procedures and environmental impacts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* IMAGE UPLOAD & INTERACTION COMPONENT - Takes 5 cols on lg */}
        <div className="lg:col-span-5 space-y-4">
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-natural-dark-card/40 border-natural-dark-border' : 'bg-white border-natural-border'}`}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center text-natural-primary">
              <Camera className="w-4.5 h-4.5 text-natural-primary mr-2" />
              Target Image Sources
            </h3>

            {error && (
              <div className="mb-4">
                <ErrorAlert
                  message={error}
                  type={errorType}
                  onRetry={handleAnalyze}
                  retryText="Re-Analyze"
                />
              </div>
            )}

            {cameraActive ? (
              /* LIVE CAMERA SCANNER VIEW */
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-natural-border/20 bg-black flex flex-col items-center justify-center min-h-[260px] max-h-[400px]">
                  {/* Real-time viewfinder bracket guide overlays */}
                  <div className="absolute inset-6 border border-white/10 pointer-events-none z-10 rounded-lg">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-500 rounded-tl-md" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-emerald-500 rounded-tr-md" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-emerald-500 rounded-bl-md" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-500 rounded-br-md" />
                  </div>

                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full max-h-[360px] object-cover"
                    style={{ transform: cameraFacing === 'user' ? 'scaleX(-1)' : 'none' }}
                  />

                  {/* Camera overlay indicators */}
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold text-white tracking-wider uppercase border border-white/10 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Preview ({cameraFacing === 'user' ? 'Front' : 'Back'})
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={capturePhoto}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    Capture Photo
                  </button>
                  <button
                    onClick={toggleCameraFacing}
                    className={`px-3 py-2.5 border rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                      darkMode 
                        ? 'border-natural-dark-border bg-natural-dark-card hover:bg-natural-dark-card/80 text-white' 
                        : 'border-natural-border bg-white hover:bg-natural-sand text-natural-dark'
                    }`}
                    title="Toggle front/back camera lens"
                  >
                    Switch Lens
                  </button>
                  <button
                    onClick={handleCancelCamera}
                    className={`px-3 py-2.5 border rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                      darkMode 
                        ? 'border-natural-dark-border bg-natural-dark-card hover:bg-natural-dark-card/80 text-rose-400' 
                        : 'border-natural-border bg-white hover:bg-natural-sand text-rose-600'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : !image ? (
              /* DUAL ACTION UPLOAD ELEMENT: DRAG AND DROP OR CLICK SELECT */
              <div className="space-y-4">
                {cameraError && (
                  <div className="mb-4">
                    <ErrorAlert
                      message={cameraError}
                      type="camera"
                      onRetry={() => startCamera(cameraFacing)}
                      retryText="Retry Camera"
                    />
                  </div>
                )}

                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer min-h-[200px] transition duration-200 ${
                    dragActive 
                      ? 'border-natural-primary bg-natural-primary/5' 
                      : darkMode 
                        ? 'border-natural-dark-border hover:border-natural-secondary bg-natural-dark-bg/25 hover:bg-natural-dark-card/10' 
                        : 'border-natural-border hover:border-natural-secondary bg-natural-sand hover:bg-natural-sage-light/20'
                  }`}
                >
                  <UploadCloud className="w-10 h-10 text-natural-secondary mb-3 animate-pulse" />
                  <p className="text-sm font-semibold text-natural-dark dark:text-natural-dark-text">Drag & drop item photo here</p>
                  <p className="text-xs text-natural-muted mt-1 mb-4">or click to browse local files</p>
                  <span className="bg-natural-primary/10 text-natural-primary font-bold px-3 py-1 text-[10px] rounded-full uppercase tracking-wider leading-none">Accepts PNG, JPG, WEBP</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                <button
                  onClick={() => startCamera(cameraFacing)}
                  className="w-full bg-natural-primary hover:bg-natural-primary-hover active:scale-98 text-white font-semibold py-3 px-4 rounded-xl text-xs transition duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-natural-primary/10"
                >
                  <Camera className="w-4 h-4" />
                  Scan with Camera
                </button>
              </div>
            ) : (
              /* PREVIEW AREA */
              <div className="relative rounded-xl overflow-hidden group border border-natural-border/20 mb-4 bg-black/5 dark:bg-black/30">
                <img src={image} alt="Waste preview" className="w-full max-h-[360px] object-contain mx-auto" />
                
                {/* Professional Camera Scanning Animation Overlay */}
                {loading && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_rgba(52,211,153,1)] animate-scan" style={{ top: 0 }} />
                    <div className="absolute inset-0 bg-emerald-500/5" />
                  </div>
                )}
                
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition duration-200 flex justify-between z-10">
                  <span className="text-white text-xxs font-semibold">Ready snapshot</span>
                  <button onClick={handleReset} className="text-rose-400 hover:text-rose-300 text-xxs font-bold flex items-center">
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Remove Snapshot
                  </button>
                </div>
              </div>
            )}

            {image && !loading && !result && (
              <div className="flex flex-col gap-2 mt-2">
                <button
                  onClick={handleAnalyze}
                  className="w-full bg-natural-primary hover:bg-natural-primary-hover text-white font-semibold py-3 px-4 rounded-xl text-sm transition shadow-lg shadow-natural-primary/20 flex items-center justify-center cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze Photo
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => startCamera(cameraFacing)}
                    className={`flex-1 py-2.5 px-3 border rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      darkMode
                        ? 'border-natural-dark-border hover:bg-natural-dark-card text-white'
                        : 'border-natural-border hover:bg-natural-sand text-natural-dark'
                    }`}
                  >
                    <Camera className="w-4 h-4 text-natural-secondary" />
                    Retake Photo
                  </button>
                  <button
                    onClick={handleReset}
                    className={`flex-1 py-2.5 px-3 border rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      darkMode
                        ? 'border-natural-dark-border hover:bg-natural-dark-card text-white'
                        : 'border-natural-border hover:bg-natural-sand text-natural-dark'
                    }`}
                  >
                    <RotateCcw className="w-4 h-4 text-natural-muted" />
                    Upload File
                  </button>
                </div>
              </div>
            )}

            {loading && (
              <button
                disabled
                className="w-full bg-natural-secondary/30 text-natural-dark-muted font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center mt-2 cursor-wait"
              >
                <div className="w-4 h-4 border-2 border-natural-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                Analyzing Waste traits...
              </button>
            )}

            {result && (
              <button
                onClick={handleReset}
                className={`w-full py-3 px-4 border rounded-xl text-sm font-bold transition flex items-center justify-center mt-2 cursor-pointer ${
                  darkMode 
                    ? 'border-natural-dark-border hover:bg-natural-dark-card text-white' 
                    : 'border-natural-border hover:bg-natural-sand text-natural-dark'
                }`}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Scan New Product
              </button>
            )}
          </div>

          {/* Quick Guidance Box */}
          <div className={`p-5 rounded-2xl border text-xs leading-relaxed transition ${darkMode ? 'bg-natural-dark-card/45 border-natural-dark-border text-natural-dark-muted' : 'bg-natural-sand/55 border-natural-border text-natural-muted'}`}>
            <p className="font-bold mb-1.5 text-natural-primary flex items-center">
              <Info className="w-4 h-4 mr-1 shrink-0" />
              Vision Scanning Best Practices
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Place the waste object against a clear, high-contrast, singular background.</li>
              <li>Provide stable, glare-free, organic illumination.</li>
              <li>Ensure labels, recycling triangles, and resin numbers are clearly legible.</li>
            </ul>
          </div>
        </div>

        {/* CLASSIFICATION ANALYSIS PANEL - Takes 7 cols on lg */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {loading ? (
              /* DYNAMIC LOADING SKELETONS */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`p-6 rounded-2xl border space-y-5 ${darkMode ? 'bg-natural-dark-card/45 border-natural-dark-border' : 'bg-white border-natural-border'}`}
              >
                <div className="flex items-center space-x-3 pb-3 border-b border-natural-border/20">
                  <div className="w-10 h-10 rounded-xl bg-natural-secondary/20 animate-pulse"></div>
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-32 bg-natural-secondary/25 rounded animate-pulse"></div>
                    <div className="h-3 w-48 bg-natural-secondary/15 rounded animate-pulse"></div>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <div className="h-3 w-20 bg-natural-secondary/15 rounded animate-pulse"></div>
                    <div className="h-14 w-full bg-natural-secondary/10 rounded-lg animate-pulse"></div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="h-3 w-20 bg-natural-secondary/15 rounded animate-pulse"></div>
                    <div className="h-14 w-full bg-natural-secondary/10 rounded-lg animate-pulse"></div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="h-3 w-20 bg-natural-secondary/15 rounded animate-pulse"></div>
                    <div className="h-14 w-full bg-natural-secondary/10 rounded-lg animate-pulse"></div>
                  </div>
                </div>

                <p className="text-center text-xxs font-semibold text-natural-primary animate-pulse pt-2 uppercase tracking-widest">Compiling SDG-12 Classification dataset...</p>
              </motion.div>
            ) : result ? (
              /* COMPLETE RESULTS UI WITH ALL REQUIRED FIELDS AND EXTRA STATS BUILD */
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`p-6 rounded-2xl border space-y-6 ${darkMode ? 'bg-natural-dark-card/45 border-natural-dark-border' : 'bg-white border-natural-border'}`}
              >
                {/* Visual Category and Confidence indicators */}
                <div className="flex items-start justify-between pb-5 border-b border-natural-border/20">
                  <div>
                    <span className="text-xxs font-extrabold uppercase tracking-widest text-natural-muted dark:text-natural-dark-muted">Classification Category</span>
                    <div className="flex items-center space-x-2.5 mt-1.5">
                      <h3 className={`text-2xl font-black ${getCategoryTheme(result.category).text}`}>
                        {result.category}
                      </h3>
                      <span className={`text-xxs font-bold px-3 py-1 rounded-full border ${getCategoryTheme(result.category).bg} ${getCategoryTheme(result.category).border} ${getCategoryTheme(result.category).text}`}>
                        {getConfidenceString(result.confidence)} Match Rate
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-natural-primary/10 text-natural-primary rounded-xl">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                </div>

                {/* Grid layout of all parameters */}
                <div className="space-y-4">

                  {/* Detected Object and Reasoning explanation */}
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 relative overflow-hidden">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-natural-primary uppercase tracking-wider mb-1 flex items-center">
                          <Compass className="w-4 h-4 mr-1.5 text-emerald-500 shrink-0" />
                          Detected Object
                        </h4>
                        <p className={`text-xs font-black leading-relaxed ${darkMode ? 'text-white' : 'text-natural-dark'}`}>
                          {result.detected_object || `${result.category} Case`}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-natural-primary uppercase tracking-wider mb-1 flex items-center">
                          <ShieldCheck className="w-4 h-4 mr-1.5 text-blue-500 shrink-0" />
                          Confidence Level
                        </h4>
                        <p className={`text-xs font-extrabold leading-relaxed ${
                          (result.confidence > 1 ? result.confidence : result.confidence * 100) >= 60 
                            ? 'text-emerald-500' 
                            : 'text-amber-500'
                        }`}>
                          {getConfidenceString(result.confidence)} ({
                            (result.confidence > 1 ? result.confidence : result.confidence * 100) >= 60 
                              ? 'High Certainty' 
                              : 'Low certainty detection. Please upload a clearer image.'
                          })
                        </p>
                      </div>
                    </div>
                    {result.classification_reason && (
                      <div className="mt-3 pt-3 border-t border-natural-border/10">
                        <h4 className="text-xxs font-extrabold text-natural-primary uppercase tracking-widest mb-1">
                          Reason for Classification
                        </h4>
                        <p className={`text-xs leading-relaxed ${darkMode ? 'text-natural-dark-text' : 'text-natural-dark'}`}>
                          {result.classification_reason}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Disposal Method */}
                  <div className="p-4 rounded-xl bg-natural-secondary/5 border border-natural-secondary/10 relative overflow-hidden">
                    <h4 className="text-xs font-bold text-natural-primary uppercase tracking-wider mb-1 flex items-center">
                      <Trash2 className="w-4 h-4 mr-1.5 text-rose-500 shrink-0" />
                      Disposal Method
                    </h4>
                    <p className={`text-xs leading-relaxed ${darkMode ? 'text-natural-dark-text' : 'text-natural-dark'}`}>
                      {result.disposal_method || result.recommendation}
                    </p>
                  </div>

                  {/* Recycling Method */}
                  <div className="p-4 rounded-xl bg-natural-secondary/5 border border-natural-secondary/10">
                    <h4 className="text-xs font-bold text-natural-primary uppercase tracking-wider mb-1 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1.5 text-blue-500 shrink-0" />
                      Recycling & Upcycling Strategy
                    </h4>
                    <p className={`text-xs leading-relaxed ${darkMode ? 'text-natural-dark-text' : 'text-natural-dark'}`}>
                      {result.recycling_method || 'Consult municipal recyclers locally to complete upcycles.'}
                    </p>
                  </div>

                  {/* Environmental Impact */}
                  <div className="p-4 rounded-xl bg-natural-secondary/5 border border-natural-secondary/10">
                    <h4 className="text-xs font-bold text-natural-primary uppercase tracking-wider mb-1 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-500 shrink-0" />
                      Environmental Impact
                    </h4>
                    <p className={`text-xs leading-relaxed ${darkMode ? 'text-natural-dark-text' : 'text-natural-dark'}`}>
                       {result.environmental_impact || 'Landfills require centuries to degrade standard municipal items.'}
                    </p>
                  </div>

                  {/* Recommendations */}
                  <div className="p-4 rounded-xl bg-natural-secondary/5 border border-natural-secondary/10">
                    <h4 className="text-xs font-bold text-natural-primary uppercase tracking-wider mb-1 flex items-center">
                      <HeartPulse className="w-4 h-4 mr-1.5 text-natural-primary shrink-0" />
                      SDG 12 Recommendation
                    </h4>
                    <p className={`text-xs leading-relaxed ${darkMode ? 'text-natural-dark-text' : 'text-natural-dark'}`}>
                      {result.recommendation}
                    </p>
                  </div>

                </div>

                {/* Smart Recycling Center Recommendations & Interactive Map with Dynamic Paths */}
                <div className="pt-5 border-t border-natural-border/20 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-natural-dark dark:text-white uppercase tracking-wider flex items-center">
                        <Building2 className="w-4.5 h-4.5 mr-1.5 text-emerald-500 shrink-0 animate-pulse" />
                        Dynamic Center Matches
                      </h4>
                      <p className={`text-[10px] ${darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'}`}>
                        Matching facilities scored and mapped specifically for <strong className="text-emerald-500 font-extrabold">{result.category}</strong> waste.
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigate('maps')}
                      className="bg-natural-primary/10 hover:bg-natural-primary/15 text-natural-primary font-bold text-xxs px-3 py-1.5 rounded-lg border border-natural-primary/20 transition flex items-center gap-1.5 self-start shrink-0 cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      View On Full Grid
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* List of matched centers */}
                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                      {recommendationLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 space-y-3">
                          <Loader2 className="w-7 h-7 text-natural-primary animate-spin" />
                          <span className="text-xxs font-extrabold tracking-widest text-natural-muted uppercase animate-pulse">Running GIS Match...</span>
                        </div>
                      ) : sortedCenters.length === 0 ? (
                        <div className="text-center py-12 text-xxs text-natural-muted">
                          No active recycling stations mapped within Delhi Grid.
                        </div>
                      ) : (
                        sortedCenters.slice(0, 3).map((cen) => (
                          <div
                            key={cen.id}
                            onClick={() => handleSelectCenterInScanner(cen)}
                            className={`p-3.5 rounded-xl border text-left transition cursor-pointer select-none hover:shadow-xs space-y-2 ${
                              selectedCenter?.id === cen.id
                                ? 'border-emerald-500 bg-emerald-500/5'
                                : darkMode
                                ? 'bg-natural-dark-card border-natural-dark-border/60 hover:border-natural-dark-border'
                                : 'bg-white border-natural-border/60 hover:border-natural-border'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-1">
                              <h5 className="font-extrabold text-[11px] text-natural-dark dark:text-white leading-snug">
                                {cen.name}
                              </h5>
                              <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded leading-none shrink-0 border border-emerald-500/10">
                                {cen.distance} km
                              </span>
                            </div>

                            <p className="text-[10px] text-natural-muted flex items-start gap-1 leading-normal">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span>{cen.address}</span>
                            </p>

                            {cen.phone && (
                              <p className="text-[9px] text-natural-muted flex items-center gap-1">
                                <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                                <span className="font-semibold text-natural-dark dark:text-white">Call:</span> {cen.phone}
                              </p>
                            )}

                            <div className="pt-2 border-t border-natural-border/10 flex justify-between items-center text-[10px]">
                              <span className="bg-natural-accent/15 text-natural-accent font-black text-[8px] px-1.5 py-0.5 rounded leading-none uppercase tracking-wider border border-natural-accent/15">
                                {cen.type}
                              </span>
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&origin=${userCoords?.lat},${userCoords?.lng}&destination=${cen.lat},${cen.lon}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-blue-500 hover:text-blue-700 font-extrabold underline flex items-center gap-1 cursor-pointer"
                              >
                                <Navigation className="w-3.5 h-3.5" />
                                Directions
                              </a>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Compact map container */}
                    <div className="relative rounded-xl overflow-hidden border border-natural-border/25 h-[300px]">
                      <div ref={scannerMapContainerRef} className="w-full h-full" id="scanner-mini-map" />
                      
                      {/* Live Driveroute summary widget */}
                      {selectedCenter && routeDistance && (
                        <div className="absolute top-2 left-2 right-2 bg-black/80 backdrop-blur-md px-3 py-2 rounded-lg text-[10px] text-white border border-white/10 z-20 flex justify-between items-center animate-fadeIn shadow-lg">
                          <div className="max-w-[70%]">
                            <p className="font-extrabold text-emerald-400 truncate leading-none">{selectedCenter.name}</p>
                            <p className="text-secondary-light/80 text-[8px] mt-1 leading-none font-mono">Driving route: {routeDistance} km ({routeDuration} min)</p>
                          </div>
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&origin=${userCoords?.lat},${userCoords?.lng}&destination=${selectedCenter.lat},${selectedCenter.lon}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-500 hover:bg-emerald-600 px-2 py-1 rounded text-[9px] font-black text-white flex items-center gap-0.5 shrink-0 transition"
                          >
                            <Navigation className="w-3 h-3" />
                            Go
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex border-t border-natural-border/20 pt-4 items-center justify-between text-xxs text-natural-muted">
                  <span>Carbon scan successfully saved</span>
                  <button onClick={() => onNavigate('dashboard')} className="text-natural-primary hover:underline cursor-pointer">Check Updated Charts &rarr;</button>
                </div>

              </motion.div>
            ) : (
              /* EMPTY READY STATE */
              <div className={`p-10 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center text-natural-muted min-h-[360px] ${
                darkMode ? 'bg-natural-dark-card/15 border-natural-dark-border' : 'bg-natural-sand border-natural-border'
              }`}>
                <div className="p-3.5 bg-natural-primary/10 text-natural-primary rounded-full mb-4">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-sm text-natural-dark dark:text-natural-dark-text">Ready for classification</h3>
                <p className="text-xs text-natural-muted mt-1.5 max-w-xs leading-relaxed">
                  Start by uploading or dropping your item photo on the left workstation. The model will write SDS-12 outputs here.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
