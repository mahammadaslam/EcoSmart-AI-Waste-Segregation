import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Info, Loader2, Sparkles, Building2, Map, ShieldAlert, Search, RefreshCw, Compass } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { translateError } from '../utils/errorHelper.ts';
import ErrorAlert from '../components/ErrorAlert.tsx';
import { ToastContainer, useToasts } from '../components/Toast.tsx';

interface NearCentersProps {
  darkMode: boolean;
}

interface Center {
  id: number;
  name: string;
  type: string;
  address: string;
  lat: number;
  lon: number;
  distance: number;
  accepts: string[];
}

export default function NearCenters({ darkMode }: NearCentersProps) {
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [displayName, setDisplayName] = useState<string>('Your Location');
  const [isUsingDetectedLocation, setIsUsingDetectedLocation] = useState(false);
  const [isLocationDenied, setIsLocationDenied] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiResults, setApiResults] = useState<Center[]>([]);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'ai' | 'network' | 'camera' | 'location' | 'empty_centers' | 'server' | 'database' | 'generic'>('generic');
  const { toasts, addToast, removeToast } = useToasts();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchRadius, setSearchRadius] = useState<number>(15000); // 15 km in meters

  // Selected center and routing states
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: number } | null>(null);

  // Leaflet map hooks
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  // Custom modern SVG icon styles for map markers
  const customMarkerIcon = L.divIcon({
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

  const userLocationIcon = L.divIcon({
    html: `<div class="relative flex items-center justify-center w-6 h-6">
             <span class="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-blue-400 opacity-75"></span>
             <span class="relative inline-flex rounded-full h-4.5 w-4.5 bg-blue-500 border-2 border-white shadow-md"></span>
           </div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -10],
  });

  // Calculate distance between two coordinates in km using the standard Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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

  // Compose address string from open street map tags
  const getAddress = (tags: any): string => {
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

  // Request browser geolocation coordinates
  const requestLocation = () => {
    setGeoLoading(true);
    setError('');

    if (isLocationDenied) {
      setError('Location access is unavailable. You can still search manually.');
      setErrorType('location');
      setIsUsingDetectedLocation(false);
      addToast('Location access is unavailable. You can still search manually.', 'info');
      setGeoLoading(false);
      return;
    }

    if (!navigator.geolocation) {
      setError('Current location is unavailable in this environment. Please search by city, district, state, or pincode.');
      setErrorType('location');
      setIsUsingDetectedLocation(false);
      addToast('Current location is unavailable in this environment. Please search by city, district, state, or pincode.', 'info');
      setGeoLoading(false);
      return;
    }

    const startQuery = (lat: number, lng: number, label: string) => {
      setCoordinates({ lat, lng });
      setDisplayName(label);
      setIsUsingDetectedLocation(true);
      setGeoLoading(false);
      fetchNearbyCenters(lat, lng, searchRadius);
    };

    const handleGeoError = (err: GeolocationPositionError) => {
      setIsUsingDetectedLocation(false);

      let customMessage = 'Current location is unavailable in this environment. Please search by city, district, state, or pincode.';
      let errTypeVal: typeof errorType = 'location';

      if (err.code === err.PERMISSION_DENIED) {
        customMessage = 'Location access is unavailable. You can still search manually.';
        setIsLocationDenied(true);
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        customMessage = 'Current location is unavailable in this environment. Please search by city, district, state, or pincode.';
      } else if (err.code === err.TIMEOUT) {
        customMessage = 'Current location is unavailable in this environment. Please search by city, district, state, or pincode.';
      }

      setError(customMessage);
      setErrorType(errTypeVal);
      addToast(customMessage, 'info');

      // Fallback to Delhi coordinates to support standard flow normally
      const defaultDelhiCoords = { lat: 28.6139, lng: 77.209 };
      setCoordinates(defaultDelhiCoords);
      setDisplayName('Delhi Metropolitan (Default Grid)');
      setGeoLoading(false);
      fetchNearbyCenters(defaultDelhiCoords.lat, defaultDelhiCoords.lng, searchRadius);
    };

    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          startQuery(pos.coords.latitude, pos.coords.longitude, 'Your Current Location');
        },
        (primaryErr) => {
          try {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                startQuery(pos.coords.latitude, pos.coords.longitude, 'Your Detected Location');
              },
              (fallbackErr) => {
                handleGeoError(fallbackErr);
              },
              { enableHighAccuracy: false, timeout: 10000, maximumAge: 15000 }
            );
          } catch (e) {
            handleGeoError(primaryErr);
          }
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
      );
    } catch (e: any) {
      // restricted or iframe sandbox security exception
      handleGeoError({
        code: 1, // PERMISSION_DENIED
        message: 'Sandbox / restricted environment exception',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      } as GeolocationPositionError);
    }
  };

  // Fetch real centers from OpenStreetMap database using the Overpass QL API
  const fetchNearbyCenters = async (lat: number, lng: number, radiusMeters: number) => {
    setLoading(true);
    setError('');
    setSelectedCenter(null);
    setRouteInfo(null);
    if (routePolylineRef.current && mapRef.current) {
      mapRef.current.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }
    try {
      // Overpass QL Query searching for matching recyclers, waste bins, waste stations
      const query = `[out:json][timeout:25];
(
  node["amenity"="recycling"](around:${radiusMeters}, ${lat}, ${lng});
  way["amenity"="recycling"](around:${radiusMeters}, ${lat}, ${lng});
  node["amenity"="waste_disposal"](around:${radiusMeters}, ${lat}, ${lng});
  way["amenity"="waste_disposal"](around:${radiusMeters}, ${lat}, ${lng});
  node["amenity"="waste_transfer_station"](around:${radiusMeters}, ${lat}, ${lng});
  way["amenity"="waste_transfer_station"](around:${radiusMeters}, ${lat}, ${lng});
);
out tags center;`;

      const encodedQuery = encodeURIComponent(query);
      const url = `https://overpass-api.de/api/interpreter?data=${encodedQuery}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Overpass API responded with HTTP status ${response.status}`);
      }

      const data = await response.json();
      const elements = data.elements || [];

      const mapped: Center[] = elements.map((el: any) => {
        const elLat = el.lat !== undefined ? el.lat : el.center?.lat;
        const elLon = el.lon !== undefined ? el.lon : el.center?.lon;

        const name = el.tags?.name || el.tags?.operator || `Waste Management Unit #${el.id}`;
        
        let type = 'Recycling Center';
        if (el.tags?.amenity === 'waste_disposal') type = 'Waste Disposal Facility';
        if (el.tags?.amenity === 'waste_transfer_station') type = 'Waste Transfer Station';
        if (el.tags?.['recycling_type'] === 'centre') type = 'Circular Recycling Center';

        const distanceKm = calculateDistance(lat, lng, elLat, elLon);

        // Map what items are accepted based on standard tags
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
          address: getAddress(el.tags),
          lat: elLat,
          lon: elLon,
          distance: parseFloat(distanceKm.toFixed(2)),
          accepts,
        };
      });

      // Sort by absolute distance proximity
      mapped.sort((a, b) => a.distance - b.distance);
      setApiResults(mapped);
      if (mapped.length === 0) {
        setError('No recycling centers were found nearby. Try expanding your search area.');
        setErrorType('empty_centers');
        addToast('No recycling centers were found nearby. Try expanding your search area.', 'warning');
      }
    } catch (err: any) {
      console.warn('Overpass API returned an error or timed out. Serving local fallback centers:', err);
      
      // Serve beautiful local mock coordinates matched precisely to the chosen lat & lng
      const backupCenters: Center[] = [
        {
          id: 10001,
          name: 'Municipal SDG Circular Hub',
          type: 'Circular Recycling Center',
          address: `Approx. 0.45 km from search coordinate`,
          lat: lat + 0.0031,
          lon: lng - 0.0018,
          distance: 0.45,
          accepts: ['Paper', 'Glass', 'Plastic', 'Metal']
        },
        {
          id: 10002,
          name: 'Hazardous Materials & E-Waste Station',
          type: 'Waste Disposal Facility',
          address: `Approx. 1.25 km from search coordinate`,
          lat: lat - 0.0049,
          lon: lng + 0.0055,
          distance: 1.25,
          accepts: ['E-Waste', 'Batteries', 'Metal']
        },
        {
          id: 10003,
          name: 'Bio-Organic Composting & Shredding Grid',
          type: 'Waste Disposal Facility',
          address: `Approx. 1.82 km from search coordinate`,
          lat: lat + 0.0075,
          lon: lng - 0.0042,
          distance: 1.82,
          accepts: ['General Recyclables']
        },
        {
          id: 10004,
          name: 'EcoSmart Partner Circular Hub',
          type: 'Circular Recycling Center',
          address: `Approx. 2.40 km from search coordinate`,
          lat: lat - 0.0062,
          lon: lng - 0.0085,
          distance: 2.40,
          accepts: ['Plastic', 'Paper', 'Glass']
        }
      ];

      setApiResults(backupCenters);
      addToast('Overpass Map server is currently busy. Loaded local simulated circular recovery hubs for these coordinates.', 'info');
    } finally {
      setLoading(false);
    }
  };

  // Convert manual query into coordinates using the free Nominatim Geocoding API
  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setGeoLoading(true);
    setError('');
    try {
      // Prioritize India locations but look global. Add a User Agent and English locale
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`;
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'EcoSmartAI-OSM-App',
        },
      });

      if (!response.ok) throw new Error('Search request failed.');

      const data = await response.json();
      if (data && data.length > 0) {
        const topResult = data[0];
        const newCoords = {
          lat: parseFloat(topResult.lat),
          lng: parseFloat(topResult.lon),
        };
        setCoordinates(newCoords);
        setDisplayName(topResult.display_name);
        setIsUsingDetectedLocation(false);
        await fetchNearbyCenters(newCoords.lat, newCoords.lng, searchRadius);
      } else {
        setError('Location details not found. Please try searching by another city, district, state, or pincode.');
        setErrorType('location');
        addToast('No match found. Verify city, state, district, or pincode.', 'warning');
      }
    } catch (err: any) {
      const friendly = translateError(err);
      setError(friendly.message);
      setErrorType(friendly.type);
      addToast(friendly.message, 'error');
    } finally {
      setGeoLoading(false);
    }
  };

  // Request coordinates on initial startup
  useEffect(() => {
    const checkPermissionAndRequest = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          if (result.state === 'denied') {
            setIsLocationDenied(true);
            setIsUsingDetectedLocation(false);
            setError('Location access is unavailable. You can still search manually.');
            setErrorType('location');
            // Fallback to Delhi coordinates to support standard/offline-first flow
            const defaultDelhiCoords = { lat: 28.6139, lng: 77.209 };
            setCoordinates(defaultDelhiCoords);
            setDisplayName('Delhi Metropolitan (Default Grid)');
            fetchNearbyCenters(defaultDelhiCoords.lat, defaultDelhiCoords.lng, searchRadius);
            return;
          }
        }
      } catch (e) {
        // Safe bypass if permissions API is unsupported
      }
      requestLocation();
    };

    checkPermissionAndRequest();
  }, []);

  // Listen for physical position changes dynamically (e.g. mobile movement)
  useEffect(() => {
    if (!navigator.geolocation || isLocationDenied) return;

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 25000,
      maximumAge: 15000,
    };

    let watchId: number;
    try {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const newCoords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          
          setCoordinates((prev) => {
            if (!prev) return newCoords;
            // check distance delta using Haversine
            const deltaKm = calculateDistance(prev.lat, prev.lng, newCoords.lat, newCoords.lng);
            // Only re-fetch if position changes by more than 50 meters
            if (deltaKm > 0.05) {
              setIsUsingDetectedLocation(true);
              setDisplayName('Your Current Location (Updated)');
              fetchNearbyCenters(newCoords.lat, newCoords.lng, searchRadius);
              return newCoords;
            }
            return prev;
          });
        },
        (err) => {
          // Silent fallback without exposing console/UI clutter
        },
        options
      );
    } catch (e) {
      // Safe bypass if watch is restricted
    }

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [searchRadius, isLocationDenied]);

  // Effect to construct, transition, and update the Leaflet Map Container
  useEffect(() => {
    // If DOM target contains map element, initialize Map instance
    if (mapContainerRef.current && !mapRef.current) {
      // Determine optimal tile server depending on system darkMode state
      const tileUrl = darkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      const mapInstance = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: true,
      }).setView([28.6139, 77.209], 13); // Default Delhi bounds

      L.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 20,
      }).addTo(mapInstance);

      markersGroupRef.current = L.layerGroup().addTo(mapInstance);
      mapRef.current = mapInstance;
    }

    // Leaflet requires container resizing checks when iframe layout scales
    const resizeObserver = new ResizeObserver(() => {
      mapRef.current?.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    // Update tile style or cleanup on dark theme shifts
    return () => {
      resizeObserver.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [darkMode]);

  // Synchronize dynamic coordinates state shifts and result markers mapping
  useEffect(() => {
    if (mapRef.current && coordinates) {
      // Position view to updated coordinates
      mapRef.current.setView([coordinates.lat, coordinates.lng], 12);

      if (markersGroupRef.current) {
        markersGroupRef.current.clearLayers();

        // 1. Plot current position marker
        const userMarker = L.marker([coordinates.lat, coordinates.lng], {
          icon: userLocationIcon,
        }).bindPopup(`
          <div style="font-family: inherit; font-size: 11px; padding: 4px;">
            <b style="color: #3b82f6;">Your Current Target Position</b>
            <p style="margin-top: 4px; color: #6b7280; font-size: 10px;">LAT: ${coordinates.lat.toFixed(4)} / LNG: ${coordinates.lng.toFixed(4)}</p>
          </div>
        `);
        markersGroupRef.current.addLayer(userMarker);

        // 2. Plot Overpass API results
        apiResults.forEach((cen) => {
          const popupContent = `
            <div style="font-family: inherit; font-size: 11px; max-width: 180px; padding: 4px;">
              <b style="color: #10B981; font-weight: 800;">${cen.name}</b>
              <p style="color: #1f2937; margin-top: 2px; font-size: 10px;">${cen.type}</p>
              <p style="color: #6b7280; font-size: 9px; line-height: 1.2; margin-top: 2px;">${cen.address}</p>
              <div style="margin-top: 6px; display: flex; gap: 4px;">
                <span style="background-color: #10b98115; color: #10b981; font-size: 8px; font-weight: bold; padding: 1.5px 4px; border-radius: 4px;">${cen.distance} km</span>
                <a href="https://www.google.com/maps/dir/?api=1&origin=${coordinates.lat},${coordinates.lng}&destination=${cen.lat},${cen.lon}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; font-size: 9px; margin-left: auto;">Navigate</a>
              </div>
            </div>
          `;

          const resultMarker = L.marker([cen.lat, cen.lon], {
            icon: customMarkerIcon,
          }).bindPopup(popupContent);
          
          resultMarker.on('click', () => {
            handleSelectCenter(cen);
          });
          
          markersGroupRef.current?.addLayer(resultMarker);
        });
      }
    }
  }, [coordinates, apiResults]);

  // Clean up route polyline on destroy
  useEffect(() => {
    return () => {
      if (routePolylineRef.current && mapRef.current) {
        mapRef.current.removeLayer(routePolylineRef.current);
        routePolylineRef.current = null;
      }
    };
  }, []);

  // Handle radius changes dynamically
  const handleRadiusChange = (newRadiusMeters: number) => {
    setSearchRadius(newRadiusMeters);
    if (coordinates) {
      fetchNearbyCenters(coordinates.lat, coordinates.lng, newRadiusMeters);
    }
  };

  // Select center and draw routing path
  const handleSelectCenter = async (cen: Center) => {
    setSelectedCenter(cen);
    if (!coordinates) return;

    if (mapRef.current) {
      // Center map view on selected center coordinates
      mapRef.current.setView([cen.lat, cen.lon], 13);

      // Reset any active polyline paths layered prior
      if (routePolylineRef.current) {
        mapRef.current.removeLayer(routePolylineRef.current);
        routePolylineRef.current = null;
      }

      try {
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinates.lng},${coordinates.lat};${cen.lon},${cen.lat}?overview=full&geometries=geojson`);
        if (res.ok) {
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates;
            // Map GeoJSON longitude/latitude sequence to Leaflet LatLng standard structure
            const latLngs = coords.map((co: [number, number]) => [co[1], co[0]] as [number, number]);
            
            const polyline = L.polyline(latLngs, {
              color: '#10b981', // emerald-500
              weight: 5,
              opacity: 0.8,
              lineJoin: 'round'
            }).addTo(mapRef.current);

            routePolylineRef.current = polyline;

            const routeDist = (data.routes[0].distance / 1000).toFixed(2);
            const routeDur = Math.round(data.routes[0].duration / 60);
            setRouteInfo({ distance: routeDist, duration: routeDur });

            // Fit boundary frames
            const bounds = L.latLngBounds([coordinates.lat, coordinates.lng], [cen.lat, cen.lon]);
            mapRef.current.fitBounds(bounds, { padding: [50, 50] });
          }
        }
      } catch (err) {
        console.warn('OSRM router request failed, invoking fallback line:', err);
        const polyline = L.polyline([[coordinates.lat, coordinates.lng], [cen.lat, cen.lon]], {
          color: '#10b981',
          weight: 4,
          dashArray: '5, 10',
          opacity: 0.7
        }).addTo(mapRef.current);
        routePolylineRef.current = polyline;
        setRouteInfo({ distance: cen.distance.toFixed(2), duration: Math.round(cen.distance * 2) });
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-8 animate-fadeIn">
      
      {/* Header section metadata */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-natural-primary flex items-center gap-2">
            <Compass className="w-6 h-6 shrink-0 text-natural-primary" />
            Geographic Collection Grids
          </h2>
          <p className={`text-sm mt-1 leading-relaxed ${darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'}`}>
            Locate certified municipal centers, e-waste hubs, and waste management bins using verified OpenStreetMap & Overpass databases.
          </p>
        </div>
        
        {/* Quick actions tracker */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => coordinates && fetchNearbyCenters(coordinates.lat, coordinates.lng, searchRadius)}
            disabled={loading || !coordinates}
            className="bg-natural-primary hover:bg-natural-primary-hover active:scale-98 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shrink-0"
          >
            <Compass className="w-3.5 h-3.5" />
            Search Nearby
          </button>
          
          <button
            onClick={requestLocation}
            disabled={geoLoading || loading}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${geoLoading ? 'animate-spin' : ''}`} />
            Use Current Location
          </button>
        </div>
      </div>

      {/* Manual Search and radius parameters bar */}
      <div className={`p-5 rounded-2xl border ${
        darkMode ? 'bg-natural-dark-card/50 border-natural-dark-border' : 'bg-white border-natural-border shadow-xs'
      }`}>
        <form onSubmit={handleManualSearch} className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-natural-muted shrink-0" />
            <input
              type="text"
              placeholder="Search by City, State, District, or Pincode (e.g., Delhi, Mumbai, 400001)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden ${
                darkMode
                  ? 'bg-natural-dark-bg border-natural-dark-border text-white placeholder-natural-dark-muted'
                  : 'bg-natural-sand border-natural-border text-natural-dark placeholder-natural-muted'
              }`}
            />
          </div>
          
          <div className="md:col-span-4 flex items-center gap-2">
            <span className={`text-xxs font-bold uppercase shrink-0 ${darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'}`}>Radius:</span>
            <select
              value={searchRadius}
              onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
              className={`w-full px-3 py-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden ${
                darkMode
                  ? 'bg-natural-dark-bg border-natural-dark-border text-white'
                  : 'bg-natural-sand border-natural-border text-natural-dark'
              }`}
            >
              <option value={5000}>5 Kilometers (Dense Urban)</option>
              <option value={15000}>15 Kilometers (Standard Grid)</option>
              <option value={30000}>30 Kilometers (Extended Regional)</option>
              <option value={50000}>50 Kilometers (Rural/State Boundary)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={geoLoading || loading || !searchQuery.trim()}
            className="md:col-span-2 bg-natural-primary hover:bg-natural-primary-hover active:scale-98 disabled:opacity-40 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer"
          >
            {geoLoading ? 'Searching...' : 'Search Filter'}
          </button>
        </form>
        
        {/* Dynamic target description & Geolocation Indicators */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-natural-border/10 pt-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className={`text-xxs font-medium ${darkMode ? 'text-natural-dark-muted' : 'text-natural-muted'}`}>
              Evaluating coordinates around: <strong className="text-natural-primary font-bold">{displayName}</strong>
            </span>
          </div>

          {isUsingDetectedLocation ? (
            <div className="flex items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold animate-pulse shrink-0 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              Using your current location
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full text-[10px] font-bold shrink-0 border border-amber-500/20">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              Manual search mode
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* MAP PANEL - Takes 7 columns on desktop */}
        <div className="lg:col-span-7 space-y-4">
          <div className={`p-6 rounded-2xl border flex flex-col justify-between relative overflow-hidden ${
            darkMode ? 'bg-natural-dark-card/40 border-natural-dark-border' : 'bg-white border-natural-border shadow-xs'
          }`}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-2.5 flex items-center z-10 text-natural-primary">
              <Map className="w-4.5 h-4.5 text-natural-primary mr-2" />
              Dynamic Collection Map View
            </h3>

            {/* Spinner Overlay when Geocoding or fetching data */}
            {geoLoading || loading ? (
              <div className="absolute inset-0 bg-black/5 dark:bg-black/30 backdrop-blur-xs flex flex-col items-center justify-center space-y-3 z-30">
                <Loader2 className="w-10 h-10 animate-spin text-natural-primary" />
                <p className="text-xs font-semibold animate-pulse text-natural-primary uppercase tracking-widest">
                  Querying OpenStreetMap Geospatial Indexes...
                </p>
              </div>
            ) : null}

            {/* ERROR ALERTS */}
            {error && (
              <div className="mb-4 z-20">
                <ErrorAlert
                  message={error}
                  type={errorType}
                  onRetry={errorType === 'location' ? requestLocation : () => coordinates && fetchNearbyCenters(coordinates.lat, coordinates.lng, searchRadius)}
                  retryText="Re-verify Grid"
                />
              </div>
            )}

            {/* OpenStreetMap Leaflet Container */}
            <div 
              ref={mapContainerRef} 
              className="h-[385px] w-full rounded-xl overflow-hidden border border-natural-border/20 shadow-md relative z-10"
              id="osm-near-centers-map"
            />

            {/* Map metadata specifications */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xxs text-natural-muted pt-4 mt-3 border-t border-natural-border/20 gap-2 relative z-10">
              <span className="flex items-center">
                <Sparkles className="w-4 h-4 text-emerald-500 mr-1.5 shrink-0" />
                Fully active Leaflet Mapnik vector grids
              </span>
              <span className="font-mono">
                {coordinates ? `COORD: ${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}` : 'Resolving coordinate nodes...'}
              </span>
            </div>
          </div>
        </div>

        {/* CENTERS DIRECTORY LIST - Takes 5 columns on desktop */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-natural-border/20">
            <Building2 className="w-4.5 h-4.5 text-natural-primary shrink-0" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-natural-primary">Centers Directory</h3>
          </div>

          <div className="space-y-4 max-h-[465px] overflow-y-auto pr-1">
            {apiResults.length === 0 ? (
              /* EMPTY ESTATE */
              <div className={`p-8 rounded-2xl border text-center transition ${
                darkMode ? 'bg-natural-dark-card/25 border-natural-dark-border' : 'bg-natural-sand border-natural-border'
              }`}>
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-full w-fit mx-auto mb-3 animate-pulse">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-natural-dark dark:text-natural-dark-text uppercase tracking-wide">No centers mapped nearby</h4>
                <p className="text-xxs text-natural-muted mt-1.5 max-w-xs mx-auto leading-relaxed">
                  No verified recycling elements or waste management facilities are tagged within {searchRadius / 1000}km of {displayName.split(',')[0]}. Try expanding your search radius using the dropdown.
                </p>
                
                {/* Expand recommendation shortcut */}
                <button
                  onClick={() => handleRadiusChange(Math.min(searchRadius + 15000, 50000))}
                  className="mt-4 text-[10px] font-bold text-natural-primary underline hover:text-natural-primary-hover"
                >
                  Expand Search Radius by 15KM
                </button>
              </div>
            ) : (
              apiResults.map((cen) => (
                <div 
                  key={cen.id} 
                  onClick={() => handleSelectCenter(cen)}
                  className={`p-4.5 rounded-xl border space-y-3 transition hover:shadow-md cursor-pointer ${
                    selectedCenter?.id === cen.id
                      ? 'border-emerald-500 bg-emerald-500/5'
                      : darkMode ? 'bg-natural-dark-card border-natural-dark-border' : 'bg-white border-natural-border shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded leading-none">
                        {cen.type}
                      </span>
                      <h4 className="text-xs font-extrabold text-natural-dark dark:text-white mt-1.5 leading-tight">{cen.name}</h4>
                    </div>
                    <span className="text-[10px] font-bold text-natural-primary bg-natural-primary/10 px-2.5 py-1 rounded-lg shrink-0">
                      {cen.distance} km
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-xxs text-natural-muted">
                    <p className="flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span>{cen.address}</span>
                    </p>
                  </div>

                  {selectedCenter?.id === cen.id && routeInfo && (
                    <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-2 rounded-lg text-xxs font-semibold flex justify-between items-center animate-fadeIn">
                      <span>🚗 Driving route: {routeInfo.distance} km</span>
                      <span>⏱️ Est: {routeInfo.duration} mins</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1 pt-1">
                    {cen.accepts.map((acc) => (
                      <span key={acc} className="bg-natural-accent/10 text-natural-accent border border-natural-accent/15 font-bold text-[9px] px-2 py-0.5 rounded uppercase tracking-wide">
                        {acc}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-natural-border/10 flex justify-between items-center text-xxs" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&origin=${coordinates?.lat},${coordinates?.lng}&destination=${cen.lat},${cen.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 font-bold underline flex items-center gap-1 cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Google Maps Directions
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className={`p-5 rounded-2xl border text-xs leading-relaxed transition ${
            darkMode 
              ? 'bg-natural-dark-card/45 border-natural-dark-border text-natural-dark-muted' 
              : 'bg-natural-sand border-natural-border text-natural-muted'
          }`}>
            <p className="font-bold mb-1.5 text-natural-primary flex items-center gap-1">
              <Info className="w-4 h-4 shrink-0" />
              Circular Waste Processing Grid
            </p>
            <p>
              SDG-compliant processing hubs require classification code tags prior to polymer deposits. Recenter grid coordinate values to audit local recycling laws.
            </p>
          </div>
        </div>

      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
