import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, PlusCircle, ShoppingCart, Receipt, LogOut, BarChart3, Image as ImageIcon, MapPin, CheckCircle, Crosshair, Sparkles, AlertTriangle } from 'lucide-react';

const RetailerDashboard = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('inventory');
  const [salesHistory, setSalesHistory] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [aiAlerts, setAiAlerts] = useState([]);

  const [location, setLocation] = useState(null);
  const [isLocationFrozen, setIsLocationFrozen] = useState(false);

  // State to track the retailer's custom price inputs for alerts
  const [alertPriceInputs, setAlertPriceInputs] = useState({});

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('freshsaver_currentUser'));
    if (!user || user.role !== 'retailer') return navigate('/login');
    
    setCurrentUser(user);
    if (user.storeLocation) {
      setLocation(user.storeLocation);
      setIsLocationFrozen(true);
    }

    setSalesHistory(JSON.parse(localStorage.getItem(`sales_${user.email}`)) || []);
    const globalInv = JSON.parse(localStorage.getItem('freshsaver_global_inventory')) || [];
    setInventory(globalInv.filter(item => item.retailerId === user.email)); 
  }, [navigate]);

  // AI Alert System Logic
  useEffect(() => {
    const now = new Date().getTime();
    const alerts = [];
    const newInputs = {};

    inventory.forEach(item => {
      const expiry = new Date(item.productExpiry).getTime();
      const diffHours = (expiry - now) / (1000 * 60 * 60);

      if (diffHours > 0 && diffHours < 24) {
        let discountRate = 0.35; 
        if (diffHours < 6) discountRate = 0.50; 
        
        const suggestedPrice = (item.price * (1 - discountRate)).toFixed(2);
        
        // Alert if current price is higher than suggestion
        if (item.offerPrice > parseFloat(suggestedPrice)) {
          alerts.push({
            ...item,
            suggestedPrice,
            diffHours: Math.floor(diffHours)
          });
          // Pre-fill the input state with the AI suggestion
          newInputs[item.id] = suggestedPrice;
        }
      }
    });

    setAiAlerts(alerts);
    setAlertPriceInputs(newInputs);
  }, [inventory]);

  const saveInventory = (newInv) => {
    setInventory(newInv);
    let globalInv = JSON.parse(localStorage.getItem('freshsaver_global_inventory')) || [];
    globalInv = globalInv.filter(item => item.retailerId !== currentUser.email);
    localStorage.setItem('freshsaver_global_inventory', JSON.stringify([...globalInv, ...newInv]));
  };

  const handleLogout = () => {
    localStorage.removeItem('freshsaver_currentUser');
    navigate('/login');
  };

  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => alert('Could not get GPS. Please allow location permissions.')
      );
    }
  };

  const handleFreezeLocation = () => {
    if (!location) return alert("Detect location first!");
    const updatedUser = { ...currentUser, storeLocation: location };
    setCurrentUser(updatedUser);
    localStorage.setItem('freshsaver_currentUser', JSON.stringify(updatedUser));
    
    const users = JSON.parse(localStorage.getItem('freshsaver_users')) || [];
    const updatedUsers = users.map(u => u.email === currentUser.email ? updatedUser : u);
    localStorage.setItem('freshsaver_users', JSON.stringify(updatedUsers));

    setIsLocationFrozen(true);
    alert("Store Location Frozen Successfully!");
  };

  const [newProduct, setNewProduct] = useState({ 
    name: '', boughtPrice: '', price: '', offerPrice: '', quantity: '', productExpiry: '', offerExpiry: '', tags: '' 
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  useEffect(() => {
    const price = parseFloat(newProduct.price);
    if (!isNaN(price) && price > 0 && newProduct.productExpiry) {
      const now = new Date();
      const expiry = new Date(newProduct.productExpiry);
      if (isNaN(expiry.getTime())) { setAiSuggestion(null); return; }

      const diffHours = (expiry - now) / (1000 * 60 * 60);
      let discountRate = 0.20; 
      if (diffHours < 0) discountRate = 0.70;       
      else if (diffHours < 6) discountRate = 0.50;  
      else if (diffHours < 24) discountRate = 0.35; 
      else if (diffHours < 48) discountRate = 0.25; 

      setAiSuggestion((price * (1 - discountRate)).toFixed(2));
    } else {
      setAiSuggestion(null);
    }
  }, [newProduct.price, newProduct.productExpiry]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageFile(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!isLocationFrozen) return alert("ERROR: Freeze Store Location first!");
    if (!newProduct.offerPrice || isNaN(parseFloat(newProduct.offerPrice))) return alert("Please set a valid Offer Price.");
    if (new Date(newProduct.offerExpiry) > new Date(newProduct.productExpiry)) return alert("Offer Expiry cannot be later than Product Expiry.");

    const newItem = { 
      id: Date.now(), retailerId: currentUser.email, shopName: currentUser.name, lat: location.lat, lng: location.lng,
      name: newProduct.name, boughtPrice: parseFloat(newProduct.boughtPrice), price: parseFloat(newProduct.price), 
      offerPrice: parseFloat(newProduct.offerPrice), quantity: parseInt(newProduct.quantity), 
      productExpiry: newProduct.productExpiry, offerExpiry: newProduct.offerExpiry, 
      tags: newProduct.tags ? newProduct.tags.split(',').map(t => t.trim()) : [],
      imageUrl: imageFile || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80'
    };
    saveInventory([...inventory, newItem]);
    setNewProduct({ name: '', boughtPrice: '', price: '', offerPrice: '', quantity: '', productExpiry: '', offerExpiry: '', tags: '' });
    setImageFile(null);
    setActiveTab('inventory');
  };

  // UPDATED: Vendor decides the price
  const handleVendorPriceUpdate = (productId) => {
    const newPrice = alertPriceInputs[productId];
    
    if (!newPrice || isNaN(parseFloat(newPrice))) {
      return alert("Please enter a valid price.");
    }

    const updatedInv = inventory.map(item => 
      item.id === productId ? { ...item, offerPrice: parseFloat(newPrice) } : item
    );
    saveInventory(updatedInv);
    
    // Remove the alert after update
    setAiAlerts(aiAlerts.filter(a => a.id !== productId));
    alert(`Price updated to ₹${newPrice}!`);
  };

  const [cart, setCart] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [sellQuantity, setSellQuantity] = useState(1);

  const addToCart = () => {
    const product = inventory.find(p => p.id === parseInt(selectedProductId));
    if (!product || sellQuantity > product.quantity) return alert('Not enough stock!');
    const existing = cart.find(item => item.id === product.id);
    if (existing) setCart(cart.map(item => item.id === product.id ? { ...item, sellQty: item.sellQty + parseInt(sellQuantity) } : item));
    else setCart([...cart, { ...product, sellQty: parseInt(sellQuantity) }]);
  };

  const completeSale = () => {
    if (cart.length === 0) return;
    const cartTotal = cart.reduce((total, item) => total + (item.offerPrice * item.sellQty), 0);
    const cartCost = cart.reduce((total, item) => total + (item.boughtPrice * item.sellQty), 0);
    
    const updatedInv = inventory.map(prod => {
      const cartItem = cart.find(item => item.id === prod.id);
      if (cartItem) return { ...prod, quantity: prod.quantity - cartItem.sellQty };
      return prod;
    }).filter(prod => prod.quantity > 0); 

    saveInventory(updatedInv);
    const newBill = { id: 'INV-' + Math.floor(100000 + Math.random() * 900000), date: new Date().toLocaleString(), items: cart, total: cartTotal, profit: cartTotal - cartCost };
    const updatedHistory = [newBill, ...salesHistory];
    setSalesHistory(updatedHistory);
    localStorage.setItem(`sales_${currentUser.email}`, JSON.stringify(updatedHistory));
    setCart([]);
    alert("Sale Complete! Invoice Saved.");
  };

  if (!currentUser) return null; 

  return (
    <div className="min-h-screen bg-[#fdfaf5] flex font-sans text-gray-900">
      <div className="w-64 bg-white shadow-xl border-r border-[#ece8df] flex flex-col justify-between z-10">
        <div>
          <div className="p-6 border-b text-center bg-[#414833] text-white">
            <h2 className="text-2xl font-serif font-bold">FreshSaver</h2>
            <p className="text-xs tracking-widest uppercase mt-2 opacity-80">{currentUser.name}</p>
          </div>
          <nav className="p-4 space-y-2 text-sm font-bold">
            <button onClick={() => setActiveTab('inventory')} className={`w-full flex items-center p-3 rounded-lg ${activeTab === 'inventory' ? 'bg-[#f0eee9] text-[#414833]' : 'text-gray-500 hover:bg-gray-50'}`}><Package className="w-4 h-4 mr-3" /> Inventory</button>
            <button onClick={() => setActiveTab('add')} className={`w-full flex items-center p-3 rounded-lg ${activeTab === 'add' ? 'bg-[#f0eee9] text-[#414833]' : 'text-gray-500 hover:bg-gray-50'}`}><PlusCircle className="w-4 h-4 mr-3" /> Add Product</button>
            <button onClick={() => setActiveTab('pos')} className={`w-full flex items-center p-3 rounded-lg ${activeTab === 'pos' ? 'bg-[#f0eee9] text-[#414833]' : 'text-gray-500 hover:bg-gray-50'}`}><ShoppingCart className="w-4 h-4 mr-3" /> POS System</button>
            <button onClick={() => setActiveTab('analytics')} className={`w-full flex items-center p-3 rounded-lg ${activeTab === 'analytics' ? 'bg-[#f0eee9] text-[#414833]' : 'text-gray-500 hover:bg-gray-50'}`}><BarChart3 className="w-4 h-4 mr-3" /> Analytics & Bills</button>
          </nav>
        </div>

        <div className="p-4 border-t bg-[#f0eee9] m-4 rounded-xl shadow-inner border border-gray-200">
           <h3 className="text-[10px] font-black tracking-widest text-gray-500 mb-3 uppercase">Store GPS Settings</h3>
           {isLocationFrozen ? (
             <div className="bg-green-100 text-green-800 p-2 rounded flex items-center text-xs font-bold mb-3 border border-green-200"><CheckCircle className="w-4 h-4 mr-2" /> Location Frozen</div>
           ) : (
             <div className="bg-red-100 text-red-800 p-2 rounded flex items-center text-xs font-bold mb-3 border border-red-200"><MapPin className="w-4 h-4 mr-2" /> Action Required</div>
           )}
           <div className="space-y-2">
             {!isLocationFrozen && <button onClick={handleDetectLocation} className="w-full flex justify-center items-center bg-white border border-gray-300 text-gray-700 text-xs py-2 rounded font-bold hover:bg-gray-50"><Crosshair className="w-3 h-3 mr-1" /> Detect GPS</button>}
             <button onClick={handleFreezeLocation} disabled={!location || isLocationFrozen} className={`w-full flex justify-center items-center text-xs py-2 rounded font-bold text-white ${!location || isLocationFrozen ? 'bg-gray-300' : 'bg-[#414833] hover:bg-black shadow-md'}`}>{isLocationFrozen ? 'Locked In' : 'Set & Freeze'}</button>
             {isLocationFrozen && <button onClick={() => setIsLocationFrozen(false)} className="w-full text-[10px] text-gray-500 hover:text-red-500 underline mt-1">Update Location</button>}
           </div>
        </div>
        <div className="p-4 border-t">
          <button onClick={handleLogout} className="w-full flex items-center justify-center p-3 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 text-sm"><LogOut className="w-4 h-4 mr-2" /> Logout</button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        
        {/* AI Alerts Section - With Vendor Input */}
        {activeTab === 'inventory' && aiAlerts.length > 0 && (
          <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-xl shadow-sm">
            <div className="flex items-center mb-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
              <h3 className="font-bold text-yellow-800">AI Price Alerts ({aiAlerts.length})</h3>
            </div>
            <p className="text-xs text-yellow-700 mb-3">
              These items are expiring soon. AI suggests a new price, but you have full control to set the final rate.
            </p>
            <div className="space-y-3">
              {aiAlerts.map(alert => (
                <div key={alert.id} className="bg-white p-4 rounded-lg border border-yellow-200">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">{alert.name} <span className="font-normal text-red-600 text-xs ml-2">(Expires in {alert.diffHours}h)</span></p>
                      <p className="text-xs text-gray-500 mt-1">
                        Current Price: <span className="font-bold text-gray-700">₹{alert.offerPrice}</span>
                        <span className="mx-2">|</span>
                        MRP: ₹{alert.price}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <label className="text-[10px] text-gray-500 mb-1">Your Price (₹)</label>
                        <input 
                          type="number" 
                          value={alertPriceInputs[alert.id] || ''} 
                          onChange={(e) => setAlertPriceInputs({...alertPriceInputs, [alert.id]: e.target.value})}
                          className="w-24 border border-gray-300 p-2 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <button 
                        onClick={() => handleVendorPriceUpdate(alert.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm mt-4 md:mt-0"
                      >
                        Update
                      </button>
                      <button 
                        onClick={() => setAiAlerts(aiAlerts.filter(a => a.id !== alert.id))}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-2 rounded-lg text-xs mt-4 md:mt-0"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-100">
                    <Sparkles className="w-3 h-3 inline mr-1" /> AI Suggestion: ₹{alert.suggestedPrice}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div>
            <h1 className="text-3xl font-serif font-bold mb-6">Active Products</h1>
            {inventory.length === 0 ? <p className="text-gray-500">No active products.</p> : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {inventory.map(item => (
                  <div key={item.id} className="bg-white rounded-xl p-4 shadow border border-[#ece8df] flex gap-4">
                    <img src={item.imageUrl} alt={item.name} className="w-20 h-20 object-cover rounded bg-gray-100" />
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{item.name}</h3>
                      <p className="text-sm text-gray-400 line-through">₹{item.price.toFixed(2)}</p>
                      <p className="text-sm font-bold text-green-700">₹{item.offerPrice.toFixed(2)}</p>
                      <p className="text-xs mt-1 font-bold bg-gray-100 inline-block px-2 py-1 rounded">Qty: {item.quantity}</p>
                      <div className="text-[10px] text-gray-500 mt-1 space-y-0.5">
                         <p>Use by: {new Date(item.productExpiry).toLocaleString()}</p>
                         <p>Offer ends: {new Date(item.offerExpiry).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'add' && (
          <div className="max-w-2xl bg-white p-8 rounded-xl shadow border border-[#ece8df]">
            <h1 className="text-2xl font-serif font-bold mb-6">Add Product Offer</h1>
            {!isLocationFrozen ? (
              <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-lg text-center shadow-inner">
                 <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                 <h3 className="font-bold text-lg">Location Required</h3>
                 <p className="text-sm mt-1">Freeze your store location to publish offers.</p>
              </div>
            ) : (
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center bg-gray-50 relative">
                  {imageFile ? <img src={imageFile} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-50" /> : <ImageIcon className="w-10 h-10 text-gray-400 mb-2" />}
                  <p className="text-sm font-bold z-10 text-black bg-white/80 px-4 py-1 rounded-full">Upload JPG/PNG</p>
                  <input type="file" accept="image/png, image/jpeg" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><label className="text-xs font-bold uppercase text-gray-500">Product Name</label><input type="text" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full border p-3 rounded-lg bg-gray-50" /></div>
                  <div><label className="text-xs font-bold uppercase text-gray-500">Bought Price (₹)</label><input type="number" required value={newProduct.boughtPrice} onChange={e => setNewProduct({...newProduct, boughtPrice: e.target.value})} className="w-full border p-3 rounded-lg bg-gray-50" /></div>
                  <div><label className="text-xs font-bold uppercase text-gray-500">MRP (₹)</label><input type="number" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full border p-3 rounded-lg bg-gray-50" /></div>
                  
                  {/* AI Suggestion on Add Page */}
                  <div className="col-span-2">
                    <label className="text-xs font-bold uppercase text-blue-600 flex items-center"><Sparkles className="w-3 h-3 mr-1" /> Your Offer Price (₹)</label>
                    <div className="flex space-x-2">
                      <input type="number" required value={newProduct.offerPrice} onChange={e => setNewProduct({...newProduct, offerPrice: e.target.value})} className="flex-1 border p-3 rounded-lg bg-blue-50 border-blue-200 font-bold" placeholder="Set your price" />
                      {aiSuggestion && <button type="button" onClick={() => setNewProduct({...newProduct, offerPrice: aiSuggestion})} className="bg-blue-100 text-blue-700 px-4 rounded-lg text-xs font-bold border border-blue-200 hover:bg-blue-200 whitespace-nowrap">Use AI: ₹{aiSuggestion}</button>}
                    </div>
                  </div>

                  <div><label className="text-xs font-bold uppercase text-gray-500">Quantity</label><input type="number" required value={newProduct.quantity} onChange={e => setNewProduct({...newProduct, quantity: e.target.value})} className="w-full border p-3 rounded-lg bg-gray-50" /></div>
                  <div><label className="text-xs font-bold uppercase text-red-500">Product Expiry</label><input type="datetime-local" required value={newProduct.productExpiry} onChange={e => setNewProduct({...newProduct, productExpiry: e.target.value})} className="w-full border p-3 rounded-lg bg-red-50 border-red-200" /></div>
                  <div><label className="text-xs font-bold uppercase text-orange-500">Offer Expiry</label><input type="datetime-local" required value={newProduct.offerExpiry} onChange={e => setNewProduct({...newProduct, offerExpiry: e.target.value})} className="w-full border p-3 rounded-lg bg-orange-50 border-orange-200" /></div>
                  <div className="col-span-2"><label className="text-xs font-bold uppercase text-gray-500">Tags</label><input type="text" value={newProduct.tags} onChange={e => setNewProduct({...newProduct, tags: e.target.value})} className="w-full border p-3 rounded-lg bg-gray-50" placeholder="e.g. dairy, organic" /></div>
                </div>
                <button type="submit" className="w-full bg-[#414833] text-white p-4 rounded-lg font-bold uppercase">Publish Offer</button>
              </form>
            )}
          </div>
        )}

        {activeTab === 'pos' && (
          <div className="max-w-2xl bg-white p-8 rounded-xl shadow border border-[#ece8df]">
            <h1 className="text-2xl font-serif font-bold mb-6">Point of Sale</h1>
            <div className="flex space-x-2 mb-6">
              <select className="flex-1 border p-3 rounded-lg bg-gray-50 font-bold" value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}>
                <option value="">Select a product...</option>
                {inventory.map(item => <option key={item.id} value={item.id}>{item.name} (Qty: {item.quantity})</option>)}
              </select>
              <input type="number" min="1" className="w-24 border p-3 rounded-lg bg-gray-50 text-center" value={sellQuantity} onChange={e => setSellQuantity(e.target.value)} />
              <button onClick={addToCart} className="bg-[#414833] text-white px-6 rounded-lg font-bold">Add</button>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-bold mb-4 uppercase text-xs text-gray-500">Current Cart</h3>
              {cart.length === 0 ? <p className="text-gray-400 text-center py-4 text-sm">Cart is empty</p> : (
                <div className="space-y-2">
                  {cart.map((item, idx) => <div key={idx} className="flex justify-between font-bold"><span>{item.sellQty}x {item.name}</span><span>₹{(item.offerPrice * item.sellQty).toFixed(2)}</span></div>)}
                </div>
              )}
              <button onClick={completeSale} disabled={cart.length === 0} className={`w-full p-4 mt-6 rounded-lg font-bold uppercase text-white ${cart.length === 0 ? 'bg-gray-300' : 'bg-[#6b705c]'}`}>Checkout</button>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <h1 className="text-3xl font-serif font-bold mb-6">Analytics & Bills</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow border border-[#ece8df]">
                <p className="text-xs font-bold uppercase text-gray-500 mb-1">Total Revenue</p>
                <h2 className="text-2xl font-bold text-green-700">₹{salesHistory.reduce((acc, bill) => acc + bill.total, 0).toFixed(2)}</h2>
              </div>
              <div className="bg-white p-6 rounded-xl shadow border border-[#ece8df]">
                <p className="text-xs font-bold uppercase text-gray-500 mb-1">Total Profit</p>
                <h2 className="text-2xl font-bold text-[#414833]">₹{salesHistory.reduce((acc, bill) => acc + bill.profit, 0).toFixed(2)}</h2>
              </div>
              <div className="bg-white p-6 rounded-xl shadow border border-[#ece8df]">
                <p className="text-xs font-bold uppercase text-gray-500 mb-1">Transactions</p>
                <h2 className="text-2xl font-bold">{salesHistory.length}</h2>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow border border-[#ece8df] p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Recent Transactions</h3>
                <Receipt className="w-5 h-5 text-gray-400" />
              </div>
              {salesHistory.length === 0 ? (
                <div className="text-center py-10 text-gray-500"><Receipt className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>No sales recorded yet.</p></div>
              ) : (
                <div className="space-y-4">
                  {salesHistory.map(bill => (
                    <div key={bill.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-3 border-b pb-2">
                        <div><span className="font-bold text-gray-800">{bill.id}</span><span className="text-xs text-gray-500 ml-2">{bill.date}</span></div>
                        <div className="text-right"><span className="font-bold text-green-700">₹{bill.total.toFixed(2)}</span><span className="text-xs text-gray-500 block">Profit: ₹{bill.profit.toFixed(2)}</span></div>
                      </div>
                      <div className="space-y-1 text-sm">
                        {bill.items.map((item, idx) => <div key={idx} className="flex justify-between"><span className="text-gray-700">{item.sellQty}x {item.name}</span><span className="text-gray-500">₹{(item.offerPrice * item.sellQty).toFixed(2)}</span></div>)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RetailerDashboard;