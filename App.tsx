
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Hydrant, 
  SessionData, 
  DEFAULT_MAIN_AREA, 
  STATION_ID, 
  WHATSAPP_NUMBER 
} from './types';
import { generatePlusCode } from './utils/plusCode';
import { generateSummaryPDF } from './utils/pdfGenerator';

const App: React.FC = () => {
  const [session, setSession] = useState<SessionData>(() => {
    const saved = localStorage.getItem('hydrant_session');
    if (saved) return JSON.parse(saved);
    return {
      mainAreaLocation: DEFAULT_MAIN_AREA,
      hydrants: [],
      isSetupDone: false
    };
  });

  const [isAdding, setIsAdding] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persist session to local storage
  useEffect(() => {
    localStorage.setItem('hydrant_session', JSON.stringify(session));
  }, [session]);

  const handleStartSession = (area: string) => {
    setSession(prev => ({
      ...prev,
      mainAreaLocation: area || DEFAULT_MAIN_AREA,
      isSetupDone: true
    }));
  };

  const handleClearData = () => {
    if (window.confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      const freshSession = {
        mainAreaLocation: DEFAULT_MAIN_AREA,
        hydrants: [],
        isSetupDone: false
      };
      setSession(freshSession);
      localStorage.removeItem('hydrant_session');
    }
  };

  const startAddingHydrant = () => {
    setLoadingGPS(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoadingGPS(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLoadingGPS(false);
        setIsAdding(true);
      },
      (err) => {
        setLoadingGPS(false);
        setError("Failed to get GPS location. Please ensure location services are enabled.");
        console.error(err);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmitHydrant = () => {
    if (!locationName.trim()) {
      alert("Please enter a proposed location name.");
      return;
    }

    setLoadingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const plusCode = generatePlusCode(latitude, longitude);
        
        const newHydrant: Hydrant = {
          id: Date.now().toString(),
          proposedLocation: locationName,
          latitude,
          longitude,
          plusCode: `${plusCode}, ${session.mainAreaLocation}, Gujranwala, Punjab, Pakistan`,
          timestamp: Date.now()
        };

        setSession(prev => ({
          ...prev,
          hydrants: [...prev.hydrants, newHydrant]
        }));

        // Reset UI
        setIsAdding(false);
        setLocationName('');
        setLoadingGPS(false);

        // Open WhatsApp automatically
        const message = `Hydrant Detail
Station: ${STATION_ID}
Location: ${session.mainAreaLocation}
Longitude and Latitude:
Lat ${latitude.toFixed(6)}°
Long ${longitude.toFixed(6)}°
Plus Code: ${newHydrant.plusCode}
Proposed Hydrant location: ${newHydrant.proposedLocation}
Hydrant type: Pillor`;

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, '_blank');
      },
      (err) => {
        setLoadingGPS(false);
        setError("GPS sync failed at final submission.");
      },
      { enableHighAccuracy: true }
    );
  };

  if (!session.isSetupDone) {
    return (
      <div className="min-h-screen bg-sky-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border-t-8 border-sky-600">
          <div className="text-center mb-6">
            <i className="fas fa-shield-alt text-5xl text-sky-600 mb-4"></i>
            <h1 className="text-2xl font-bold text-gray-800">Field Survey Setup</h1>
            <p className="text-gray-500 mt-2">Station: {STATION_ID}</p>
          </div>
          
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700">Confirm Main Area Location</label>
            <input 
              type="text"
              defaultValue={session.mainAreaLocation}
              id="setup-area"
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-sky-500 outline-none transition-all text-lg"
              placeholder="e.g. Shaheenabad Main Bazar"
            />
            <button 
              onClick={() => {
                const val = (document.getElementById('setup-area') as HTMLInputElement).value;
                handleStartSession(val);
              }}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95 text-lg"
            >
              Start Official Survey
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 max-w-md mx-auto relative shadow-2xl">
      {/* Header */}
      <header className="bg-white border-b-2 border-sky-100 p-6 sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-sky-800">Hydrant Survey</h1>
            <p className="text-sm text-gray-500 font-medium">Station: {STATION_ID} • {session.mainAreaLocation}</p>
          </div>
          <div className="bg-sky-50 text-sky-600 px-3 py-1 rounded-full text-xs font-bold border border-sky-200">
            OFFICIAL USE
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm animate-pulse">
            <i className="fas fa-exclamation-triangle mr-2"></i> {error}
          </div>
        )}

        {/* Action Button */}
        {!isAdding && (
          <button 
            disabled={loadingGPS}
            onClick={startAddingHydrant}
            className={`w-full py-6 rounded-2xl flex flex-col items-center justify-center space-y-2 shadow-xl transition-all active:scale-95 ${loadingGPS ? 'bg-gray-300' : 'bg-sky-600 hover:bg-sky-700'}`}
          >
            {loadingGPS ? (
              <i className="fas fa-spinner fa-spin text-3xl text-white"></i>
            ) : (
              <i className="fas fa-map-marker-alt text-3xl text-white"></i>
            )}
            <span className="text-white font-bold text-lg uppercase tracking-wider">
              {loadingGPS ? 'Capturing GPS...' : 'Add New Hydrant'}
            </span>
          </button>
        )}

        {/* Form Modal-like Overlay */}
        {isAdding && (
          <div className="bg-white rounded-2xl shadow-2xl p-6 border-2 border-sky-200 animate-in slide-in-from-bottom duration-300">
            <h2 className="text-lg font-bold text-sky-800 mb-4 flex items-center">
               <i className="fas fa-plus-circle mr-2 text-sky-600"></i> New Entry Coordinates
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Proposed Location Name</label>
                <input 
                  autoFocus
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full p-4 border-2 border-gray-100 bg-gray-50 rounded-xl focus:bg-white focus:border-sky-500 outline-none transition-all text-lg"
                  placeholder="e.g. Near Main Gate"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="bg-gray-100 text-gray-500 font-bold py-4 rounded-xl active:bg-gray-200"
                >
                  Cancel
                </button>
                <button 
                  disabled={loadingGPS}
                  onClick={handleSubmitHydrant}
                  className="bg-green-600 text-white font-bold py-4 rounded-xl shadow-md active:bg-green-700 flex items-center justify-center"
                >
                  {loadingGPS ? <i className="fas fa-spinner fa-spin"></i> : 'Submit & Send'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* List of Entries */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-bold text-gray-700 uppercase text-xs tracking-widest">Hydrant Registry ({session.hydrants.length})</h3>
            {session.hydrants.length > 0 && (
              <button onClick={handleClearData} className="text-red-500 text-xs font-bold flex items-center">
                <i className="fas fa-trash-alt mr-1"></i> CLEAR ALL
              </button>
            )}
          </div>

          {session.hydrants.length === 0 ? (
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400">
              <i className="fas fa-folder-open text-4xl mb-4 opacity-20"></i>
              <p>No hydrants added yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...session.hydrants].reverse().map((h, idx) => (
                <div key={h.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-sky-50 text-sky-600 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm">
                      #{session.hydrants.length - idx}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{h.proposedLocation}</h4>
                      <p className="text-[10px] text-gray-400 font-mono tracking-tight">
                        {h.latitude.toFixed(5)}, {h.longitude.toFixed(5)}
                      </p>
                    </div>
                  </div>
                  <i className="fas fa-check-circle text-green-500"></i>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Footer */}
      {session.hydrants.length > 0 && (
        <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-6 bg-white/80 backdrop-blur-md border-t border-gray-100">
          <button 
            onClick={() => generateSummaryPDF(session.mainAreaLocation, session.hydrants)}
            className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl shadow-xl flex items-center justify-center space-x-2 active:bg-slate-900 transition-colors"
          >
            <i className="fas fa-file-pdf text-xl"></i>
            <span>Generate Summary PDF</span>
          </button>
        </footer>
      )}
    </div>
  );
};

export default App;
