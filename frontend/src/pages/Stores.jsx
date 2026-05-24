import React, { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { getStores, getNearestStores } from "../api";
import StoreCard from "../components/StoreCard";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  MapPin,
  List,
  Map,
  Compass,
  Clock,
  Search,
  Sparkles,
  ToggleLeft,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── Leaflet default icon fix for Vite/React builds ───────────────────────────
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom purple marker for stores
const storeIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Active (selected) store marker — slightly bigger
const activeStoreIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  popupAnchor: [1, -40],
  shadowSize: [41, 41],
});

// Red icon for user location
const userIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// ─── Helper: recenter the Leaflet map imperatively ────────────────────────────
function RecenterMap({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.0 });
    }
  }, [center, zoom, map]);
  return null;
}

// ─── Helper: is store open right now? ─────────────────────────────────────────
function isOpen(openingTime, closingTime) {
  try {
    const parseTime = (str) => {
      const [time, mod] = str.split(" ");
      let [h, m = 0] = time.split(":").map(Number);
      if (mod === "PM" && h !== 12) h += 12;
      if (mod === "AM" && h === 12) h = 0;
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return d;
    };
    const now = new Date();
    return now >= parseTime(openingTime) && now <= parseTime(closingTime);
  } catch {
    return true; // assume open if parse fails
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export const Stores = () => {
  const [stores, setStores] = useState([]);
  const [nearestStores, setNearestStores] = useState([]); // top 3
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([12.9716, 77.5946]); // Default: Bengaluru
  const [mapZoom, setMapZoom] = useState(11);
  const [activeStoreId, setActiveStoreId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [viewMode, setViewMode] = useState("map"); // "map" | "list"
  const [searchQuery, setSearchQuery] = useState("");
  const [openNowOnly, setOpenNowOnly] = useState(false);

  // Load stores on mount (no location yet)
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getStores();
        setStores(data);
      } catch (err) {
        console.error("Failed to load stores:", err);
        toast.error("Could not fetch store locations.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const [locationError, setLocationError] = useState(null);

  // Request geolocation, reload stores with distances, fetch top-3 nearest
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Your browser does not support geolocation. Showing all stores.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationError(null);

        try {
          // Re-fetch all stores with distance pre-calculated by the backend
          const [allStores, topNearest] = await Promise.all([
            getStores(latitude, longitude),
            getNearestStores(latitude, longitude),
          ]);

          setStores(allStores);
          setNearestStores(topNearest);

          // Fly to the nearest store
          if (topNearest.length > 0) {
            setMapCenter([topNearest[0].latitude, topNearest[0].longitude]);
            setMapZoom(13);
            setActiveStoreId(topNearest[0].id);
            toast.success(`Nearest store: ${topNearest[0].name}`);
          }
        } catch (err) {
          console.error("Failed to fetch stores with location:", err);
          toast.error("Failed to locate closest store.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError(
            'Location access was denied. To find your nearest store:\n' +
            '1. Click the lock/info icon in your browser address bar\n' +
            '2. Set Location to "Allow"\n' +
            '3. Click the "Retry" button below'
          );
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationError(
            'Could not detect your location. Please check your device settings and try again.'
          );
        } else {
          setLocationError(
            'Location request timed out. Please try again.'
          );
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleSelectStore = (store) => {
    setActiveStoreId(store.id);
    setMapCenter([store.latitude, store.longitude]);
    setMapZoom(15);
    if (viewMode === "list") setViewMode("map");
  };

  // Filtered & searched list
  const filteredStores = useMemo(() => {
    let result = stores;
    if (openNowOnly) {
      result = result.filter((s) => isOpen(s.opening_time, s.closing_time));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q) ||
          (s.city && s.city.toLowerCase().includes(q))
      );
    }
    return result;
  }, [stores, openNowOnly, searchQuery]);

  if (isLoading) return <LoadingSpinner fullPage />;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 pb-24 md:py-8 space-y-5 animate-fade-in">

      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-savomart-purple/10 pb-5">
        <div>
          <h1 className="font-extrabold text-2xl text-slate-800 tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-savomart-purple" />
            Savomart Store Locator
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Find nearby stores, view opening hours, and get directions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Map / List toggle */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all duration-150 ${
                viewMode === "map"
                  ? "bg-white text-savomart-purple shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Map className="w-3.5 h-3.5" /> Map
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all duration-150 ${
                viewMode === "list"
                  ? "bg-white text-savomart-purple shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
          </div>

          {/* Locate me button */}
          <button
            onClick={handleRequestLocation}
            disabled={isLocating}
            className="flex items-center gap-2 bg-savomart-purple hover:bg-savomart-purple-dark text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all duration-150 disabled:opacity-50"
          >
            <Compass
              className={`w-4 h-4 text-savomart-yellow ${
                isLocating ? "animate-spin" : ""
              }`}
            />
            {isLocating ? "Locating…" : "Find Nearest"}
          </button>
        </div>
      </div>

      {/* ── Nearest Store Banner ───────────────────────────────────── */}
      {nearestStores.length > 0 && (
        <div className="bg-gradient-to-r from-savomart-purple-light/60 to-purple-50 border border-savomart-purple/15 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-savomart-purple shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-savomart-purple-dark mb-2">
                Your 3 Nearest Outlets
              </h4>
              <div className="flex flex-wrap gap-2">
                {nearestStores.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectStore(s)}
                    className="bg-white border border-savomart-purple/20 hover:border-savomart-purple/50 rounded-xl px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:text-savomart-purple transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <MapPin className="w-3 h-3 text-savomart-purple" />
                    {s.name}
                    <span className="text-savomart-purple font-bold ml-0.5">
                      {s.distance} km
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Location Error Banner ──────────────────────────────────── */}
      {locationError && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-700 flex items-center gap-1.5 mb-1">
                📍 Location Access Needed
              </p>
              <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                {locationError}
              </p>
            </div>
            <button
              onClick={handleRequestLocation}
              disabled={isLocating}
              className="shrink-0 bg-savomart-purple hover:bg-savomart-purple-dark text-white text-xs font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-50"
            >
              {isLocating ? 'Locating…' : '🔄 Retry'}
            </button>
          </div>
        </div>
      )}

      {/* ── Map View ──────────────────────────────────────────────── */}
      {viewMode === "map" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-[calc(100vh-300px)] min-h-[500px]">
          {/* Sidebar */}
          <div className="lg:col-span-1 overflow-y-auto space-y-3 pr-1 h-full">
            {/* Search in map mode */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search stores…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-2 text-xs rounded-xl border border-savomart-purple/15 bg-white focus:outline-none focus:ring-2 focus:ring-savomart-purple/30 placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Open Now filter */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => setOpenNowOnly((v) => !v)}
                className={`w-8 h-4.5 rounded-full transition-colors duration-200 relative ${
                  openNowOnly ? "bg-emerald-500" : "bg-slate-200"
                }`}
                style={{ width: "32px", height: "18px" }}
              >
                <span
                  className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform duration-200 ${
                    openNowOnly ? "translate-x-3.5" : "translate-x-0.5"
                  }`}
                  style={{ height: "14px", width: "14px" }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-600">
                Open Now
              </span>
            </label>

            {/* Store cards */}
            {filteredStores.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No stores match your filters.
              </p>
            ) : (
              filteredStores.map((store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  onSelect={() => handleSelectStore(store)}
                  isActive={activeStoreId === store.id}
                />
              ))
            )}
          </div>

          {/* Map panel */}
          <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-savomart-purple/10 shadow-md relative h-full">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              scrollWheelZoom={true}
              className="w-full h-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Store markers */}
              {stores.map((store) => (
                <Marker
                  key={store.id}
                  position={[store.latitude, store.longitude]}
                  icon={activeStoreId === store.id ? activeStoreIcon : storeIcon}
                  eventHandlers={{
                    click: () => {
                      setActiveStoreId(store.id);
                      setMapCenter([store.latitude, store.longitude]);
                      setMapZoom(15);
                    },
                  }}
                >
                  <Popup maxWidth={220}>
                    <div className="p-1 space-y-1.5 text-slate-800">
                      <h5 className="font-bold text-sm text-savomart-purple-dark leading-tight">
                        {store.name}
                      </h5>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        {store.address}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>
                          {store.opening_time} – {store.closing_time}
                        </span>
                      </div>
                      {store.distance !== undefined && (
                        <span className="inline-block bg-savomart-purple text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                          {store.distance} km away
                        </span>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* User location marker */}
              {userLocation && (
                <Marker
                  position={[userLocation.lat, userLocation.lng]}
                  icon={userIcon}
                >
                  <Popup>
                    <span className="font-bold text-xs">📍 You are here</span>
                  </Popup>
                </Marker>
              )}

              <RecenterMap center={mapCenter} zoom={mapZoom} />
            </MapContainer>

            {/* Map overlay: store count */}
            <div className="absolute top-3 right-3 z-[999] bg-white/90 backdrop-blur-sm border border-savomart-purple/15 rounded-xl px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm">
              {stores.length} stores
            </div>
          </div>
        </div>
      )}

      {/* ── List View ─────────────────────────────────────────────── */}
      {viewMode === "list" && (
        <div className="space-y-4">
          {/* Search + filters row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, area, or city…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl border border-savomart-purple/15 bg-white focus:outline-none focus:ring-2 focus:ring-savomart-purple/30 placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none bg-white border border-savomart-purple/15 rounded-xl px-4 py-2.5">
              <div
                onClick={() => setOpenNowOnly((v) => !v)}
                className="relative"
                style={{ width: "32px", height: "18px" }}
              >
                <div
                  className={`w-full h-full rounded-full transition-colors duration-200 ${
                    openNowOnly ? "bg-emerald-500" : "bg-slate-200"
                  }`}
                />
                <span
                  className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform duration-200 ${
                    openNowOnly ? "translate-x-3.5" : "translate-x-0.5"
                  }`}
                  style={{ height: "14px", width: "14px" }}
                />
              </div>
              <span className="text-sm font-semibold text-slate-600">
                Open Now
              </span>
            </label>
          </div>

          {/* Results count */}
          <p className="text-xs text-slate-400 font-medium">
            Showing {filteredStores.length} of {stores.length} stores
            {userLocation && " · sorted by distance"}
          </p>

          {/* Grid of store cards */}
          {filteredStores.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MapPin className="w-10 h-10 text-slate-200 mb-3" />
              <p className="text-sm font-semibold text-slate-400">
                No stores match your search.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setOpenNowOnly(false);
                }}
                className="mt-3 text-xs text-savomart-purple font-bold hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredStores.map((store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  onSelect={() => handleSelectStore(store)}
                  isActive={activeStoreId === store.id}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Stores;
