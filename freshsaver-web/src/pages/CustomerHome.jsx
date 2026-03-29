import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, LogOut, Star, Sparkles, Search } from 'lucide-react';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lat2) return 5.2; 
  const R = 6371; const dLat = (lat2 - lat1) * (Math.PI / 180); const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return (R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)))).toFixed(1);
};

const useCountdown = (targetDate) => {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    if (!targetDate) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;
      if (distance < 0) { setTimeLeft('EXPIRED'); clearInterval(interval); return; }
      const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);
  return timeLeft;
};

// UPDATED: TimerBadge now a full-width bar
const TimerBadge = ({ expiryTime }) => {
  const time = useCountdown(expiryTime);
  if (!expiryTime) return null;
  
  const isExpired = time === 'EXPIRED';
  
  return (
    <div className={`w-full text-center py-2 text-xs font-black tracking-widest flex items-center justify-center rounded-t-xl ${isExpired ? 'bg-red-600 text-white' : 'bg-yellow-400 text-black'}`}>
      <Clock className="w-3 h-3 mr-2" /> OFFER ENDS IN: {time}
    </div>
  );
};

const CustomerHome = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [userLocation, setUserLocation] = useState({ lat: 12.83, lng: 80.13 });
  const [marketplace, setMarketplace] = useState([]);
  const [aiPick, setAiPick] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('freshsaver_currentUser'));
    if (!user || user.role !== 'customer') return navigate('/login');
    setCurrentUser(user);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }));
    }

    const globalInv = JSON.parse(localStorage.getItem('freshsaver_global_inventory')) || [];
    
    // UPDATED: Check offerExpiry first, fallback to expiryTime
    const validItems = globalInv.filter(item => {
      const expiryDateStr = item.offerExpiry || item.expiryTime;
      const isExpired = new Date(expiryDateStr).getTime() < new Date().getTime();
      return item.quantity > 0 && !isExpired;
    });
    
    setMarketplace(validItems);
  }, [navigate]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setAiPick(null);
      return;
    }

    const filteredItems = marketplace.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.shopName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filteredItems.length > 0) {
      const scoredItems = filteredItems.map(item => {
        const discountPct = ((item.price - item.offerPrice) / item.price) * 100;
        const dist = parseFloat(calculateDistance(userLocation.lat, userLocation.lng, item.lat, item.lng));
        const score = discountPct - (dist * 2); 
        return { ...item, score, discountPct, dist };
      });
      const best = scoredItems.sort((a, b) => b.score - a.score)[0];
      setAiPick(best);
    } else {
      setAiPick(null);
    }
  }, [searchQuery, marketplace, userLocation]);

  const displayedItems = searchQuery.trim() 
    ? marketplace.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.shopName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : marketplace;

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-[#fdfaf5] font-sans text-gray-900 pb-20">
      <header className="bg-white border-b border-[#ece8df] py-4 px-8 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center gap-4">
          <div className="flex-shrink-0">
            <h1 className="text-3xl font-serif font-bold uppercase tracking-tight text-[#414833]">FreshSaver</h1>
            <p className="text-xs uppercase tracking-widest text-gray-500 mt-1">Hello, {currentUser.name}</p>
          </div>

          <div className="flex-1 max-w-lg relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search products or shops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border border-[#ece8df] bg-[#fdfaf5] focus:outline-none focus:ring-2 focus:ring-[#414833] focus:border-transparent text-sm transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <span className="text-xs font-bold">✕</span>
              </button>
            )}
          </div>

          <button onClick={() => { localStorage.removeItem('freshsaver_currentUser'); navigate('/login'); }} className="flex-shrink-0 text-sm font-bold text-red-500 flex items-center hover:bg-red-50 px-4 py-2 rounded-full transition-colors">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-10 px-6">
        {searchQuery && aiPick && (
          <div className="mb-12 bg-gradient-to-r from-[#414833] to-[#6b705c] rounded-2xl p-1 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10"><Sparkles className="w-40 h-40 text-white" /></div>
            <div className="bg-[#fdfaf5] rounded-xl p-8 flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className="flex-1">
                <div className="inline-flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase mb-4">
                  <Star className="w-4 h-4 mr-2 fill-current" /> Top Pick for "{searchQuery}"
                </div>
                <h2 className="text-4xl font-serif font-bold mb-2">{aiPick.name}</h2>
                <p className="text-gray-500 mb-6 flex items-center"><MapPin className="w-4 h-4 mr-1"/> {aiPick.shopName} (Only {aiPick.dist} km away)</p>
                <div className="flex items-end space-x-4 mb-6">
                  <span className="text-5xl font-black text-green-700">₹{aiPick.offerPrice}</span>
                  <span className="text-xl text-gray-400 line-through mb-1">₹{aiPick.price}</span>
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded font-bold text-sm mb-2">{Math.round(aiPick.discountPct)}% OFF</span>
                </div>
              </div>
              <div className="w-full md:w-1/3 relative">
                <img src={aiPick.imageUrl} alt={aiPick.name} className="w-full h-64 object-cover rounded-xl shadow-lg border-4 border-white" />
                {/* Updated AI pick timer to use offerExpiry */}
                <div className="absolute top-0 left-0 right-0 mt-2 mx-2">
                    <TimerBadge expiryTime={aiPick.offerExpiry || aiPick.expiryTime} />
                </div>
              </div>
            </div>
          </div>
        )}

        <h2 className="text-2xl font-serif font-bold mb-6 text-[#414833] uppercase tracking-widest">
          {searchQuery ? `Search Results (${displayedItems.length})` : "Live Deals Near You"}
        </h2>
        
        {displayedItems.length === 0 ? (
           <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
             <p className="text-xl font-serif text-gray-500">
               {searchQuery ? `No products found for "${searchQuery}"` : "No active offers available right now."}
             </p>
             <p className="text-sm text-gray-400 mt-2">
               {searchQuery ? "Try a different search term." : "Check back later when retailers upload new stock."}
             </p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayedItems.map(product => {
              const distance = calculateDistance(userLocation.lat, userLocation.lng, product.lat, product.lng);
              const discount = Math.round(((product.price - product.offerPrice) / product.price) * 100);

              return (
                <div key={product.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow border border-[#ece8df] overflow-hidden flex flex-col relative">
                  
                  {/* MOVED: Timer is now above the image */}
                  <TimerBadge expiryTime={product.offerExpiry || product.expiryTime} />
                  
                  <div className="relative h-48 bg-gray-100">
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold leading-tight">{product.name}</h3>
                      <span className="bg-[#414833] text-white text-[10px] font-black px-2 py-1 rounded tracking-widest">{discount}% OFF</span>
                    </div>
                    
                    <p className="text-xs text-gray-500 flex items-center mb-4"><MapPin className="w-3 h-3 mr-1" /> {product.shopName} • {distance} km</p>
                    
                    <div className="mt-auto flex justify-between items-end border-t border-gray-100 pt-4">
                      <div>
                        <p className="text-xs text-gray-400 line-through">₹{product.price.toFixed(2)}</p>
                        <p className="text-2xl font-black text-green-600">₹{product.offerPrice.toFixed(2)}</p>
                      </div>
                      <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${product.lat},${product.lng}`, '_blank')} className="bg-[#f0eee9] hover:bg-[#e4e0d4] text-[#414833] px-4 py-2 rounded-full text-xs font-bold transition-colors">
                        Navigate
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerHome;