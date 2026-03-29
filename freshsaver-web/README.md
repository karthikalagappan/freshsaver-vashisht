# 🌱 FreshSaver (DealDrop)
**Hyper-Local Retail Tech: Turning Expiring Products into Real-Time Opportunities.**

> ## 🏆 Official Vashisht 3.0 Submission Links
> 
> 🔴 **Demo Video:** (https://drive.google.com/drive/folders/1Gg7id0P8hSathkKDzQ8JlKFnDcsqroVj?usp=sharing)
> *(Note to Judges: Please watch the demo video to see the full multi-user synchronization and platform workflow in action!)*
> 
> 🟢 **Live Application:** (https://freshsaver-vashisht.vercel.app/)

---

## 🚀 Project Overview 
**Domain:** RetailTech  

**FreshSaver** is a hyper-local, real-time web platform designed to reduce food and retail product waste by connecting vendors with nearby consumers. In many retail environments, products nearing their expiry date often go unsold, resulting in massive financial loss for businesses and severe environmental waste. 

FreshSaver solves this by enabling retailers to instantly list near-expiry products at dynamically discounted prices, while allowing customers to discover, track, and reserve them before they go to waste. By combining **location-based discovery**, **real-time urgency indicators**, and **modern web technologies**, FreshSaver creates a sustainable ecosystem that benefits both businesses and consumers.

---

## 🎯 The Problem
Despite advancements in global supply chain systems, massive amounts of perishable goods are wasted at the hyper-local level due to:
1. **Lack of Visibility:** No real-time tracking of surplus or near-expiry inventory at the local store level.
2. **Consumer Disconnect:** Nearby customers remain completely unaware of massive discounts sitting just blocks away.
3. **Financial Drain:** Retailers take a 100% total loss on expired items rather than recovering partial revenue through targeted discounts.

---

## 💡 Our Solution & Core Features
FreshSaver provides a technology-driven marketplace that bridges the gap between surplus supply and local demand. 

* 📍 **Location-Based Discovery:** Displays nearby discounted products based on user radius and proximity.
* ⏱️ **Time-Decay Pricing & Urgency:** Live countdown timers and stock availability bars drive quick purchasing decisions.
* 💸 **Automated Discount Strategy:** Encourages faster sales of near-expiry items rather than incurring a complete loss.
* 📱 **Responsive Dual-Interface:** Seamlessly optimized workflows for both Retailers (inventory management) and Customers (discovery and reservation).

---

## 🔄 Platform Workflow

### 🏪 Retailer Flow
1. The retailer logs into the secure dashboard.
2. Adds product details (name, base price, quantity, and exact expiry time).
3. The system calculates and applies a discounted pricing strategy.
4. The product is instantly pushed live to the local marketplace.

### 🛒 Customer Flow
1. The customer accesses the platform and views available products in a dynamic, location-filtered feed.
2. Observes key urgency metrics: Discounted price, time remaining before expiry, and stock availability.
3. The customer reserves the product and navigates to the store to complete the purchase.

---

## 🏗️ System Architecture

To deliver a flawless UI/UX presentation and guarantee zero server latency during the hackathon evaluation, we built FreshSaver using a **Serverless Client-Side Prototype** model, with a clear roadmap for full-stack production.

### 🛠️ Phase 1: Hackathon Prototype (Current State)
* **Frontend Framework:** React.js (via Vite for lightning-fast compilation)
* **Routing:** `react-router-dom` (HashRouter configured for static deployment)
* **Data Persistence:** Browser `localStorage` (Cross-tab synchronization for real-time demonstration without backend delay)
* **Deployment:** Vercel (CI/CD Integrated)

> **🧑‍⚖️ Note to Judges:** To test the application locally on your device, please open the live Vercel link, log in as a Retailer, add a product, and then log in as a Customer in a new tab to view your newly created inventory!

### 🌍 Phase 2: Production Architecture (Planned)
* **Frontend:** React / Next.js
* **API Layer:** Node.js / Express.js
* **Database:** MongoDB / Firebase (NoSQL for unstructured inventory scaling)
* **Real-Time Sync:** WebSockets / Socket.io

---

## 📊 Feasibility & Business Model

* **💰 Economic Feasibility:** Low initial operational expenses utilizing serverless architecture. Revenue opportunities through small transaction commissions or premium retailer subscriptions.
* **🧑‍🤝‍🧑 Operational Feasibility:** Simple onboarding process requiring zero technical expertise for local shop owners.
* **📈 Scalability:** The NoSQL-planned database structure allows for easy geographic expansion from single neighborhoods to city-wide integration.

---

## 🤖 Future Scope: AI/ML Integration
To transition FreshSaver from a static marketplace to an intelligent platform, our roadmap includes:
* **🧠 Demand Prediction:** Predicting localized product demand using Linear Regression models.
* **💸 Dynamic Pricing:** Algorithmically adjusting discount rates in real-time based on foot traffic and remaining shelf life.
* **📍 Smart Recommendations:** Collaborative Filtering to suggest relevant products to regular users based on purchase history.
* **⏱️ Expiry Risk Prediction:** Logistic Regression models to notify retailers of inventory at high risk of remaining unsold.

---

## 🏃‍♂️ How to Run Locally

**Prerequisites:** Node.js (v16+) and Git.

```bash
# 1. Clone the repository
git clone (https://github.com/karthikalagappan/freshsaver-vashisht.git)

# 2. Navigate into the directory
cd freshsaver-vashisht

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev