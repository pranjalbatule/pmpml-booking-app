import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [source, setSource] = useState('Akurdi Railway Station');
  const [destination, setDestination] = useState('Nigdi');
  const [sourceSuggestions, setSourceSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  
  const [missedBus, setMissedBus] = useState(null);
  const [upcomingBuses, setUpcomingBuses] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [searched, setSearched] = useState(false);
  const [nearbyStops, setNearbyStops] = useState([]);
  const [currentCoords, setCurrentCoords] = useState(null);

  // Auth & Multi-Account State (using Name)
  const [user, setUser] = useState(null);
  const [savedAccounts, setSavedAccounts] = useState([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [customUpi, setCustomUpi] = useState('');

  // Ticketing & Map State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedBusForBooking, setSelectedBusForBooking] = useState(null);
  const [activeTicket, setActiveTicket] = useState(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [activeBusRoute, setActiveBusRoute] = useState(null);

  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatNameFromEmail = (emailStr) => {
    const namePart = emailStr.split('@')[0];
    return namePart
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  useEffect(() => {
    const storedAccounts = localStorage.getItem('pmpml_accounts');
    if (storedAccounts) {
      try {
        const parsed = JSON.parse(storedAccounts);
        setSavedAccounts(parsed);
        if (parsed.length > 0) setUser(parsed[0]);
      } catch (e) { console.error(e); }
    } else {
      const defaultEmail = 'pranjal.batule@gmail.com';
      const defaultAcc = { email: defaultEmail, name: formatNameFromEmail(defaultEmail) };
      setSavedAccounts([defaultAcc]);
      setUser(defaultAcc);
      localStorage.setItem('pmpml_accounts', JSON.stringify([defaultAcc]));
    }
  }, []);

  const saveAccountToStore = (emailAcc) => {
    const formattedName = formatNameFromEmail(emailAcc);
    const newAcc = { email: emailAcc, name: formattedName };
    const filtered = savedAccounts.filter(a => a.email !== emailAcc);
    const updated = [newAcc, ...filtered];
    
    setSavedAccounts(updated);
    localStorage.setItem('pmpml_accounts', JSON.stringify(updated));
    setUser(newAcc);
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    try {
      const targetEmail = email || 'pranjal.batule@gmail.com';
      saveAccountToStore(targetEmail);
      setAuthModalOpen(false);
      alert(`Successfully logged in as ${formatNameFromEmail(targetEmail)}!`);
    } catch (err) {
      console.error(err);
      alert('Authentication failed.');
    }
  };

  const switchAccount = (accEmail) => {
    const found = savedAccounts.find(a => a.email === accEmail);
    if (found) setUser(found);
  };

  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}m : ${s.toString().padStart(2, '0')}s`;
  };

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
    fetchNearby(18.4529, 73.8567);
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
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
    } catch (err) { console.error(err); }
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

  const initiatePayment = (bus) => {
    setSelectedBusForBooking(bus);
    setPaymentModalOpen(true);
  };

  const confirmOnlinePayment = async () => {
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/tickets/book');
      const customBusTicketId = res.data.ticket_id.replace("METRO", "BUS");
      setActiveTicket({
        ...selectedBusForBooking,
        ticketId: customBusTicketId,
        status: 'PAID',
        bookedAt: new Date().toLocaleTimeString(),
        source,
        destination,
        userName: user ? user.name : 'Guest'
      });
      setPaymentModalOpen(false);
      alert('Online payment successful! PMPML Ticket generated.');
    } catch (e) {
      console.error(e);
    }
  };

  const scanGateAction = async (actionType) => {
    try {
      const endpoint = actionType === 'entry' ? '/api/tickets/scan-entry' : '/api/tickets/scan-exit';
      const res = await axios.post(`http://127.0.0.1:8000${endpoint}?ticket_id=${activeTicket.ticketId}`);
      setActiveTicket(prev => ({
        ...prev,
        status: actionType === 'entry' ? 'CHECKED_IN' : 'COMPLETED'
      }));
      alert(res.data.message);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenLiveMap = (bus) => {
    setActiveBusRoute(bus);
    setMapModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      <header className="bg-emerald-600 text-white p-4 shadow-md flex justify-between items-center px-8">
        <h1 className="text-xl font-bold">PMPML Smart Transit & Ticketing</h1>
        <div className="flex items-center space-x-3">
          <span className="text-sm bg-emerald-700 px-3 py-1 rounded-full hidden sm:inline">Pune Urban Mobility</span>
          
          {user ? (
            <div className="flex items-center space-x-2 bg-emerald-800 px-3 py-1.5 rounded-lg shadow-sm">
              <span className="text-xs">👤</span>
              <select
                value={user.email}
                onChange={(e) => switchAccount(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                {savedAccounts.map((acc, idx) => (
                  <option key={idx} value={acc.email} className="text-gray-800">
                    {acc.name} ({acc.email})
                  </option>
                ))}
              </select>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="text-[10px] bg-emerald-900 px-2 py-0.5 rounded hover:bg-black transition ml-1"
                title="Add Another Account"
              >
                + Add
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="bg-white text-emerald-700 text-xs font-bold px-4 py-1.5 rounded-lg shadow hover:bg-emerald-50 transition"
            >
              Login / Register
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column */}
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

          {/* Active Ticket Pass */}
          {activeTicket && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-300 p-4 rounded-xl shadow-md text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-emerald-900 uppercase">PMPML Digital Pass</span>
                <span className="bg-emerald-600 text-white font-bold px-2 py-0.5 rounded text-[10px]">{activeTicket.status}</span>
              </div>
              <p><span className="font-semibold text-gray-600">ID:</span> <span className="font-mono font-bold text-emerald-800">{activeTicket.ticketId}</span></p>
              <p><span className="font-semibold text-gray-600">Passenger:</span> <span className="font-bold text-gray-800">{activeTicket.userName}</span></p>
              <p><span className="font-semibold text-gray-600">Route:</span> #{activeTicket.route_no} ({activeTicket.source} ➔ {activeTicket.destination})</p>
              
              <div className="pt-2 flex gap-2">
                {activeTicket.status === 'PAID' && (
                  <button onClick={() => scanGateAction('entry')} className="flex-1 bg-blue-600 text-white py-1.5 rounded font-semibold hover:bg-blue-700 transition">
                    Scan Entry Gate 🟢
                  </button>
                )}
                {activeTicket.status === 'CHECKED_IN' && (
                  <button onClick={() => scanGateAction('exit')} className="flex-1 bg-amber-600 text-white py-1.5 rounded font-semibold hover:bg-amber-700 transition">
                    Scan Exit Gate 🔴
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-lg font-medium text-gray-700 mb-1">Transit Live Status & Schedules</h3>
          
          {!searched ? (
            <p className="text-gray-400 bg-white p-6 rounded-xl text-center border shadow-sm text-xs italic">
              Click "Search Buses" to view live schedules and book tickets.
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
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs px-5 py-2.5 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 shadow-lg transition flex items-center space-x-2 inline-flex"
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
                  <h4 className="text-md font-semibold text-gray-800">Next Upcoming Buses (Live Countdown)</h4>
                  {upcomingBuses.map((bus) => (
                    <div key={bus.id} className="bg-white p-4 border rounded-xl shadow-sm flex justify-between items-center">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded">
                            Route #{bus.route_no}
                          </span>
                          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded animate-pulse">
                            ⏱️ Arriving in {formatCountdown(timeLeft)}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-gray-600">📍 Live Status: {bus.live_location}</p>
                        
                        <button
                          onClick={() => handleOpenLiveMap(bus)}
                          className="mt-2 text-xs text-blue-600 font-semibold hover:underline flex items-center space-x-1"
                        >
                          <span>🛰️ Track Live GPS Map</span>
                        </button>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-emerald-700">₹{bus.fare}</span>
                        <button
                          onClick={() => initiatePayment(bus)}
                          className="mt-2 block bg-emerald-600 text-white text-xs px-4 py-2 rounded font-semibold hover:bg-emerald-700 transition shadow"
                        >
                          Book & Pay Online 💳
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

      {/* Enhanced Multi-Option Payment Modal */}
      {paymentModalOpen && selectedBusForBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <h3 className="text-lg font-bold text-gray-800 mb-1">PMPML Secure Checkout</h3>
            <p className="text-xs text-gray-400 mb-4">Choose your preferred payment method</p>
            
            <div className="bg-gray-50 p-3 rounded-xl text-left text-xs space-y-1 mb-4 border">
              <p><span className="font-semibold text-gray-500">Route:</span> #{selectedBusForBooking.route_no} ({source} ➔ {destination})</p>
              <p><span className="font-semibold text-gray-500">Total Fare:</span> <span className="font-bold text-emerald-700 text-sm">₹{selectedBusForBooking.fare}</span></p>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">⚡ Instant UPI Apps</label>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={confirmOnlinePayment} className="p-2 border rounded-xl text-xs font-medium hover:bg-emerald-50 hover:border-emerald-500 transition flex flex-col items-center justify-center">
                    <span className="text-base mb-1">🟢</span> Google Pay
                  </button>
                  <button onClick={confirmOnlinePayment} className="p-2 border rounded-xl text-xs font-medium hover:bg-emerald-50 hover:border-emerald-500 transition flex flex-col items-center justify-center">
                    <span className="text-base mb-1">🟣</span> PhonePe
                  </button>
                  <button onClick={confirmOnlinePayment} className="p-2 border rounded-xl text-xs font-medium hover:bg-emerald-50 hover:border-emerald-500 transition flex flex-col items-center justify-center">
                    <span className="text-base mb-1">🔵</span> Paytm UPI
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Or Enter Any UPI ID (VPA)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customUpi}
                    onChange={(e) => setCustomUpi(e.target.value)}
                    placeholder="e.g. username@oksbi"
                    className="flex-1 p-2 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button onClick={confirmOnlinePayment} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition">
                    Verify & Pay
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">💳 Cards & Net Banking</label>
                <button onClick={confirmOnlinePayment} className="w-full p-2.5 border rounded-xl text-xs font-medium hover:bg-gray-50 transition flex items-center justify-between">
                  <span>Credit / Debit Card (Visa, Master, RuPay)</span>
                  <span className="text-gray-400 font-bold">➔</span>
                </button>
              </div>
            </div>

            <button onClick={() => setPaymentModalOpen(false)} className="w-full bg-gray-200 text-gray-700 py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-300 transition">
              Cancel Checkout
            </button>
          </div>
        </div>
      )}

      {/* Live Map Modal */}
      {mapModalOpen && activeBusRoute && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-bold text-gray-800 flex items-center space-x-2">
                <span>🛰️ Live Bus Tracking: Route #{activeBusRoute.route_no}</span>
              </h3>
              <button onClick={() => setMapModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-900 mb-4">
              <p className="font-semibold text-sm mb-1">Status: {activeBusRoute.live_location}</p>
              <p>Estimated arrival at your stop: <span className="font-bold">{activeBusRoute.arrival_time}</span></p>
            </div>

            <div className="w-full h-64 rounded-xl overflow-hidden border shadow-inner relative">
              <iframe
                title="Live Bus Corridor Map"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(source + " to " + destination + ", Pune")}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
              ></iframe>
            </div>

            <button
              onClick={() => setMapModalOpen(false)}
              className="mt-4 w-full bg-gray-800 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-black transition"
            >
              Close Live Map
            </button>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative">
            <h3 className="text-lg font-bold text-gray-800 mb-2">{isLoginMode ? 'Login to PMPML' : 'Create Account'}</h3>
            <form onSubmit={handleAuthSubmit} className="space-y-3">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded text-sm"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded text-sm"
                required
              />
              <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded text-sm font-semibold hover:bg-emerald-700">
                {isLoginMode ? 'Login' : 'Register'}
              </button>
            </form>
            <p className="mt-4 text-xs text-center text-gray-500 cursor-pointer hover:underline" onClick={() => setIsLoginMode(!isLoginMode)}>
              {isLoginMode ? "Don't have an account? Register" : "Already have an account? Login"}
            </p>
            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;