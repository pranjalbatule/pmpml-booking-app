import { useState } from 'react';
import { searchRoutes } from './services/api';

function App() {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!source || !destination) return;
    
    setLoading(true);
    try {
      const data = await searchRoutes(source, destination);
      setRoutes(data.routes || []);
      setSearched(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="bg-emerald-600 text-white shadow-md py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">🚌 PMPML Smart Transit & Booking</h1>
        <span className="text-sm bg-emerald-700 px-3 py-1 rounded-full">Pune Urban Mobility</span>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Find Direct Bus Routes</h2>
        
        {/* Search Form */}
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Source Stop</label>
            <input 
              type="text" 
              placeholder="e.g., Swargate" 
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Destination Stop</label>
            <input 
              type="text" 
              placeholder="e.g., Hinjewadi" 
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <div className="md:col-span-2">
            <button 
              type="submit" 
              className="w-full bg-emerald-600 text-white font-semibold py-2.5 rounded-lg hover:bg-emerald-700 transition duration-200 shadow-md"
            >
              {loading ? 'Searching Routes...' : 'Search Buses'}
            </button>
          </div>
        </form>

        {/* Results Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-3">Available Buses</h3>
          {searched && routes.length === 0 && (
            <p className="text-gray-500 bg-gray-50 p-4 rounded-lg text-center border">No direct buses found for this route.</p>
          )}

          <div className="space-y-3">
            {routes.map((route) => (
              <div key={route.id} className="p-4 border rounded-lg shadow-sm bg-emerald-50/40 flex justify-between items-center">
                <div>
                  <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded">Route #{route.route_no}</span>
                  <h4 className="font-semibold text-gray-800 mt-2">{route.source_stop} ➔ {route.destination_stop}</h4>
                  <p className="text-sm text-gray-500">Estimated Duration: {route.duration_mins} mins</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-emerald-700">₹{route.fare}</span>
                  <br />
                  <button className="mt-2 bg-emerald-600 text-white text-xs px-3 py-1.5 rounded hover:bg-emerald-700 transition">
                    Book Seat
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;