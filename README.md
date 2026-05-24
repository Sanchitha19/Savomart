# Savomart Loyalty Companion Web App (savomart-sde-intern-task-2026)

Welcome to the **Savomart Loyalty Companion Web App**, a premium loyalty dashboard designed for **Savomart**, an Indian grocery chain. This full-stack application features a FastAPI backend backed by SQLite and an interactive, visually stunning React & Tailwind CSS frontend.

---

## 🎨 Brand Design Identity
We strictly enforce Savomart's premium color scheme across the application:
- **Primary Purple**: `#782B90`
- **Primary Yellow**: `#FFF200`
- **Dark Purple**: `#4A1A5C`
- **Light Purple**: `#F3E8F7`
- **White**: `#FFFFFF`
- **Dark**: `#1A1A1A`
- **Base Background**: `#F8F4FA` (Very light purple tint)
- **Typography**: `Plus Jakarta Sans` Google Font

---

## 🚀 Key Features

### 1. Frictionless OTP Authentication Sandbox
- Simulates SMS verification with standard 6-digit OTP codes.
- Requests print the OTP directly to the terminal stdout logs and a developer sandbox box on the login screen for instantaneous access.
- Auto-registers phone numbers that are not currently in the database to guarantee fluid user onboarding.
- Pre-filled buttons for 3 seeded demo accounts (Silver, Gold, and Platinum tiers).

### 2. Digital Loyalty Pass Card & Barcode
- Renders an interactive club card styled to match the customer's active tier (Silver, Gold, or Platinum).
- Displays a custom, dynamic HTML-drawn barcode representing their membership ID (derived from their phone number) for cashier scanning.
- Visual progress bar calculating the exact points required to rank up to the next member tier.

### 3. Store Locator Map (Leaflet Integration)
- Interactive map detailing Savomart retail locations.
- Requests browser Geolocation coordinates.
- Integrates geodesic distance calculation via FastAPI (`/api/stores/nearest`), highlighting the closest branch with kilometers distance.
- Map recenters with smooth animation and opens tooltips when "Locate Store" or map markers are clicked.

### 4. Smart Savings Catalog (Offers)
- Active deals arranged by category filters (All, Groceries, Dairy, Bakery, Beverages, Personal Care).
- Custom store-specific promotions selector, enabling users to view deals for a specific store or all stores.
- Micro-modal overlay revealing scanned code and promotional barcodes for cashier validation.

### 5. Support Desk with Excel logging
- Multi-category support ticket submissions (Points Issue, Coupon Issue, Store Issue, App Issue, Other).
- Pre-fills forms automatically if user profiles are active.
- Saves request log records to the local SQLite database and synchronously appends them to a Microsoft Excel file `support_requests.xlsx` using `openpyxl`.
- Tracks submission status (Open, InProgress, Resolved) with a green checkmark indicating successful Excel compilation.

---

## 🌐 Live Demo

Note: The backend is hosted on Render free tier.
Free tier services spin down after 15 minutes of
inactivity. The first request after inactivity may
take 30-60 seconds to respond. Please wait for the
initial load — subsequent requests will be fast.

---

## 📂 Folder Structure

```
savomart-sde-intern-task-2026/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── auth.py
│   ├── seed.py
│   ├── requirements.txt
│   └── routers/
│       ├── auth.py
│       ├── users.py
│       ├── offers.py
│       ├── stores.py
│       └── support.py
├── frontend/
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   ├── index.html
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── api.js
│   │   ├── main.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Offers.jsx
│   │   │   ├── Stores.jsx
│   │   │   └── Support.jsx
│   │   └── components/
│   │       ├── Navbar.jsx
│   │       ├── BottomNav.jsx
│   │       ├── PointsCard.jsx
│   │       ├── OfferCard.jsx
│   │       ├── StoreCard.jsx
│   │       └── LoadingSpinner.jsx
└── README.md
```

---

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
   *Note: If you run under Python 3.13 and get errors, run `pip install --upgrade sqlalchemy` to pull the latest 3.13 compatible library.*
3. Seed the database (creates database schema and seeds initial demo data):
   ```bash
   python seed.py
   ```
4. Launch the FastAPI server:
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```
5. Check backend health by visiting `http://localhost:8000/health` or browse Swagger API docs at `http://localhost:8000/docs`.

### Frontend Setup
1. Open another terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install JavaScript packages:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Access the web app in your browser at `http://localhost:3000`.

---

## 🧪 Demo Login Credentials
For testing different membership tiers, request an OTP using one of the pre-filled demo accounts on the login screen, then copy the 6-digit simulation code displayed directly in the box:

- **Priya Sharma** (Gold Tier): `9999999999`
- **Rahul Mehta** (Silver Tier): `8888888888`
- **Anita Patel** (Platinum Tier): `7777777777`
- *Or bypass OTP check entirely with the code:* `123456`.
