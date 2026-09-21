import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [source, setSource] = useState('Katraj');
  const [destination, setDestination] = useState('Kharadi Gaon');
  const [sourceSuggestions, setSourceSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  
  const [missedBus, setMissedBus] = useState(null);
  const [upcomingBuses, setUpcomingBuses] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [searched, setSearched] = useState(false);
  const [nearbyStops, setNearbyStops] = useState([]);
  const [currentCoords, setCurrentCoords] = useState(null);

  const handleSourceChange = async (val) => {
    setSource(val);
    if (val.length > 0) {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/stops/autocomplete?query=${val}`);
        setSourceSuggestions(res.data.stops || []);
      } catch (err) { console.error(err); }
    } else { setSourceSuggestions([]); }
  };

  const handleDestChange = async (val) => {
    setDestination(val);
    if (val.length > 0) {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/stops/autocomplete?query=${val}`);
        setDestSuggestions(res.data.stops || []);
      } catch (err) { console.error(err); }
    } else { setDestSuggestions([]); }
  };

  useEffect(() => {
    const fetchNearby = async (lat, lon) => {
      setCurrentCoords({ lat, lon });
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/stops/nearby?lat=${lat}&lon=${lon}`);
        setNearbyStops(res.data.nearby_stops || []);
      } catch (err) { console.error(err); }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchNearby(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn("Using default Pune coordinates.", error);
          fetchNearby(18.4529, 73.8567);
        },
        { timeout: 10000 }
      );
    } else {
      fetchNearby(18.4529, 73.8567);
    }
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSourceSuggestions([]);
    setDestSuggestions([]);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/routes/search`, {
        params: { source, destination }
      });
      setMissedBus(res.data.missed_bus);
      setUpcomingBuses(res.data.upcoming_buses || []);
      setRecommendation(res.data.recommendation);
      setSearched(true);
    } catch (err) { console.error("Search error:", err); }
  };

  const openGoogleMapsDirections = (stopName, distanceKm) => {
    const destinationQuery = encodeURIComponent(stopName + ", Pune");
    const travelMode = distanceKm > 1.0 ? "driving" : "walking";
    let mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destinationQuery}&travelmode=${travelMode}`;
    if (currentCoords) {
      mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${currentCoords.lat},${currentCoords.lon}&destination=${destinationQuery}&travelmode=${travelMode}`;
    }
    window.open(mapsUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      <header className="bg-emerald-600 text-white p-4 shadow-md flex justify-between items-center px-8">
        <h1 className="text-xl font-bold">PMPML Smart Transit & Live Tracker</h1>
        <span className="text-sm bg-emerald-700 px-3 py-1 rounded-full">Pune Urban Mobility</span>
      </header>

      <main className="max-w-5xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Search & Autocomplete */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-xl shadow-md relative">
            <h2 className="text-md font-semibold mb-3 text-gray-800">Find Bus Routes</h2>
            <form onSubmit={handleSearch} className="space-y-4">
              
              <div className="relative">
                <label className="block text-xs font-medium text-gray-600 mb-1">Source Stop</label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => handleSourceChange(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                {sourceSuggestions.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-40 overflow-auto">
                    {sourceSuggestions.map((s, idx) => (
                      <li key={idx} onClick={() => { setSource(s); setSourceSuggestions([]); }} className="p-2 text-xs hover:bg-emerald-50 cursor-pointer border-b">
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="relative">
                <label className="block text-xs font-medium text-gray-600 mb-1">Destination Stop</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => handleDestChange(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                {destSuggestions.length > 0 && (
                  <ul className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-40 overflow-auto">
                    {destSuggestions.map((s, idx) => (
                      <li key={idx} onClick={() => { setDestination(s); setDestSuggestions([]); }} className="p-2 text-xs hover:bg-emerald-50 cursor-pointer border-b">
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button type="submit" className="w-full bg-emerald-600 text-white p-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition">
                Search Buses
              </button>
            </form>
          </div>

          {/* Nearby Stops Widget */}
          <div className="bg-white p-5 rounded-xl shadow-md">
            <h3 className="text-md font-semibold text-gray-800 mb-2">📍 Nearby Boarding Stops</h3>
            {nearbyStops.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Loading nearby stops...</p>
            ) : (
              <div className="space-y-2">
                {nearbyStops.map((stop, i) => (
                  <div key={i} className="text-xs p-2 bg-gray-50 border rounded flex justify-between items-center">
                    <span className="font-medium text-gray-700">{stop.stop_name}</span>
                    <span className="text-emerald-600 font-bold">{stop.distance_km} km</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Results & Live Tracker */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-lg font-medium text-gray-700 mb-1">Transit Live Status & Schedules</h3>
          
          {!searched ? (
            <p className="text-gray-400 bg-white p-6 rounded-xl text-center border shadow-sm text-xs italic">
              Click "Search Buses" to view live status and smart recommendations.
            </p>
          ) : (
            <>
              {missedBus && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs shadow-sm">
                  <span className="font-bold text-sm">🚨 Missed Bus Alert:</span>
                  <p className="mt-1">Route #{missedBus.route_no} (<span className="font-semibold">🪧 Board: {missedBus.board_name}</span>) scheduled at <span className="font-semibold">{missedBus.scheduled_time}</span> has <span className="font-semibold">{missedBus.status}</span>.</p>
                </div>
              )}

              {recommendation && (
                <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl text-amber-900 text-xs shadow-md flex flex-col justify-between space-y-3">
                  <div>
                    <span className="font-bold text-sm flex items-center space-x-1">
                      <span>💡</span> <span>Smart Transit Recommendation:</span>
                    </span>
                    <p className="mt-1.5 leading-relaxed text-gray-800 text-sm">{recommendation.text}</p>
                  </div>
                  {recommendation.suggested_stop && (
                    <div className="pt-2 text-right">
                      <button
                        onClick={() => openGoogleMapsDirections(recommendation.suggested_stop, recommendation.distance_km)}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs px-5 py-2.5 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 flex items-center space-x-2 inline-flex"
                      >
                        <span className="text-base">🗺️</span>
                        <span>Navigate to {recommendation.suggested_stop} ({recommendation.distance_km > 1.0 ? 'Cab / Auto' : 'Walking'})</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {upcomingBuses.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-md font-semibold text-gray-800">Next Upcoming Buses</h4>
                  {upcomingBuses.map((bus, idx) => (
                    <div key={bus.id} className="bg-white p-4 border rounded-xl shadow-sm hover:shadow-md transition flex justify-between items-center">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded">
                            Option #{idx + 1} • Route #{bus.route_no}
                          </span>
                          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold px-2 py-0.5 rounded">
                            🪧 Board: {bus.board_name}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-gray-600 space-y-1">
                          <p>🕒 <span className="font-semibold text-gray-700">Arrival:</span> <span className="text-emerald-800 font-bold">{bus.arrival_time}</span></p>
                          <p>📍 <span className="font-semibold text-gray-700">Live Status:</span> <span className="text-blue-700">{bus.live_location}</span></p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-emerald-700">₹{bus.fare}</span>
                        <p className="text-xs text-gray-400">Est. {bus.duration_mins} mins</p>
                        <button className="mt-2 bg-emerald-600 text-white text-xs px-3 py-1.5 rounded font-semibold hover:bg-emerald-700 transition">
                          Book Seat & QR
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

      </main>
    </div>
  );
}

export default App;