
## 📌 Overview

**SwasthyaSetu** (*"Bridge to Healthcare"*) is a production-grade full-stack emergency healthcare coordination platform designed to eliminate critical communication delays during medical emergencies. It bridges patients, voluntary blood donors, hospital administrators, and emergency responders into a unified, real-time ecosystem.

Whether locating the closest hospital with an available ICU bed, mobilizing rare blood types during trauma cases, or dispatching emergency ambulances with live GPS tracking, SwasthyaSetu provides instant, transparent, and verified clinical resource information.

---

## 🌟 Core Features

### 1. 📍 Live Location-Based Hospital & Facility Discovery
- **High-Accuracy Geolocation**: Detects the user's real coordinates via browser GPS with zero hardcoded locations.
- **OpenStreetMap & Overpass API**: Discovers live multi-specialty hospitals, emergency centers, government clinics, and private medical facilities within **10 km, 25 km, or 50 km** radius.
- **Resilient Multi-Tier Failover**: Automatically cascades from Overpass API mirrors to verified regional facilities across major metropolitan regions (Mumbai, Delhi NCR, Bengaluru, Hyderabad, Kolkata, Chennai, Pune).
- **Interactive Leaflet Map**: Real-time pin focusing, distance calculation (Haversine formula), one-click directions routing, and full facility detail dialogs.
- **Unified Network Display**: Clearly distinguishes verified SwasthyaSetu partner institutions (with live bed availability counters) from discovered OSM healthcare facilities.

### 2. 🩸 Voluntary Blood Donor Registry & Search
- **Instant Search & Multi-Filters**: Filter by blood group (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`, or All) and city/area with case-insensitive search.
- **Donor Privacy & Masking**: Sensitive phone numbers and contacts are automatically masked for unauthenticated guest users (`881****46`) and revealed upon verified patient login.
- **Self-Service Donor Portal**: Patients can register as active voluntary donors, update their city/contact preference, toggle availability status, or deregister directly from their personal dashboard.
- **Zero Dummy Data**: Strictly powered by real MongoDB records with dedicated `/api/blood-donors/me` profile management.

### 3. 📊 Real-Time Public Transparency Dashboard
- **Dynamic Resource Aggregates**: Displays live verified counts of connected hospitals, available general beds, ICU beds, stocked blood units, ready ambulances, and 24/7 emergency intake facilities.
- **Interactive Connected Hospitals Modal**: Clicking the **"Connected Hospitals"** metric card opens a dedicated modal displaying exact institution names, addresses, emergency hotlines, and bed availability retrieved live from the database.
- **No Hardcoded Metrics**: Automatically updates as hospitals register, verify, or update clinical inventory.

### 4. 📢 Community Health Campaigns & Outreach Drives
- **Public Outreach Directory**: Browse upcoming vaccination drives, voluntary blood donation camps, free health checkups, and awareness sessions.
- **One-Click Drive Registration**: Logged-in patients can reserve seats and register for upcoming medical camps with real-time attendee tracking.
- **Institution Publishing Portal**: Hospital administrators and verified staff can publish community drives with titles, descriptions, schedules, venue addresses, and category tags.

### 5. 🚨 1-Click SOS Emergency Request & Live Ambulance Tracking
- **Instant Emergency Initiation**: Broadcast emergency requests with triage severity, GPS coordinates, and patient condition notes.
- **Socket.IO Real-Time Dispatch**: Instant multi-room event broadcasting between patients, assigned hospitals, and ambulance drivers.
- **Ambulance Live Tracking**: Real-time driver location updates streamed over authenticated Socket.IO rooms.

### 6. 🤖 CareAI Medical Assistant
- **Symptom Triage & First-Aid Guidance**: Integrated with **Google Gemini 2.5 Flash** for intelligent preliminary symptom checks.
- **Rule-Engine Fallback**: Operates offline via medical triage heuristics if external AI APIs are unreachable.
- **Persistent Disclaimer**: Compliant with digital health regulations; provides clear disclaimers that AI advice does not substitute for emergency medical care.

### 7. 🔐 Role-Based Access Control (RBAC) & Document Locker
- **3 Distinct Portals**: Specialized interfaces for **Patients**, **Hospital Staff**, and **System Administrators**.
- **Digital Medical Document Locker**: Secure cloud locker for storing lab reports, prescriptions, and medical histories.
- **Doctor Appointment Booking**: Real-time slot reservation with hospital medical specialists.

---

## 🏗️ System Architecture

SwasthyaSetu is built on a clean 3-tier, decoupled client-server architecture:

```mermaid
graph TD
    subgraph Frontend ["Frontend (React 19 + Vite + MUI)"]
        UI[Material UI Components]
        Map[Leaflet OpenStreetMap]
        AuthCtx[Auth Context - JWT]
        SocketCtx[Socket.IO Client]
        APIClient[Axios Interceptors]
    end

    subgraph Backend ["Backend (Node.js + Express)"]
        Server[Express App / server.js]
        AuthMw[JWT Auth & RBAC Middleware]
        SecMw[Helmet, Rate Limiter & CORS]
        SocketServer[Socket.IO Event Hub]
        Controllers[Modular Controllers]
    end

    subgraph External ["External Services"]
        OSM[OpenStreetMap / Overpass API]
        Gemini[Google Gemini AI API]
        Nominatim[OSM Nominatim Geocoder]
    end

    subgraph Database ["Database Layer"]
        MongoDB[(MongoDB Database)]
    end

    UI --> AuthCtx
    UI --> APIClient
    UI --> Map
    Map <--> Nominatim
    APIClient <-->|REST API + Bearer Token| Server
    SocketCtx <-->|WebSockets (WSS)| SocketServer
    Server --> SecMw
    SecMw --> AuthMw
    AuthMw --> Controllers
    Controllers <--> MongoDB
    Controllers <--> OSM
    Controllers <--> Gemini
```

---

## 💻 Tech Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19** | Modern component-driven UI library |
| **Build Tool** | **Vite 6** | Ultra-fast HMR and bundle compilation |
| **Component Library** | **Material UI (MUI v9)** | Accessible, responsive design system |
| **Maps & Routing** | **Leaflet & React-Leaflet** | Interactive mapping and route rendering |
| **State Management** | **React Context API** | Global session, auth, and socket states |
| **HTTP Client** | **Axios** | Request/response interceptors with AbortController |
| **Backend Runtime** | **Node.js 18+ / 24+** | High-performance asynchronous JavaScript engine |
| **Backend Framework** | **Express.js 4.x** | Modular REST API routing and middleware pipeline |
| **Database** | **MongoDB & Mongoose 8.x** | Schema validation, spatial 2D indexing, population |
| **Real-time Layer** | **Socket.IO 4.x** | Bi-directional WebSocket events with room auth |
| **Security & Auth** | **JWT, Bcrypt, Helmet** | Token auth, password hashing, HTTP security headers |
| **External AI** | **Google Gemini AI SDK** | Intelligent clinical advice and symptom triage |

---

## 📁 Project Directory Structure

```text
SwasthyaSetu/
├── backend/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection handler
│   │   └── validateEnv.js        # Strict startup environment variable validator
│   ├── controllers/
│   │   ├── authController.js     # User registration, login, profile management
│   │   ├── hospitalController.js # Hospital directory, stats, Overpass proxy
│   │   ├── bloodDonorController.js# Blood donor registry, search, profile API
│   │   ├── campaignController.js # Health campaign publishing and registrations
│   │   ├── doctorController.js   # Doctor management and availability
│   │   ├── appointmentController.js# Patient appointment scheduling
│   │   ├── emergencyController.js# SOS dispatch and status tracking
│   │   └── adminController.js    # Hospital verification and system analytics
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification and role authorization
│   │   ├── securityMiddleware.js # Helmet security headers and rate limiters
│   │   └── loggerMiddleware.js   # HTTP request logging
│   ├── models/
│   │   ├── User.js               # Patient, hospital, admin user schema
│   │   ├── Hospital.js           # Clinical resources, beds, blood inventory
│   │   ├── BloodDonor.js         # Voluntary blood donor schema with indexing
│   │   ├── HealthCampaign.js     # Community outreach drives and attendance
│   │   ├── Doctor.js             # Doctor profiles and departments
│   │   ├── Appointment.js        # Appointment records
│   │   ├── EmergencyRequest.js   # Emergency triage logs
│   │   ├── Ambulance.js          # Ambulance fleet tracking
│   │   └── MedicalDocument.js    # Digital medical locker records
│   ├── routes/                   # Express route definitions
│   ├── sockets/
│   │   └── socketManager.js      # Authenticated Socket.IO event handlers
│   ├── utils/
│   │   ├── geo.js                # Haversine distance utilities
│   │   ├── fallbackData.js       # Verified regional fallback datasets
│   │   └── geminiAI.js           # Gemini AI integration and offline rule engine
│   ├── .env.example              # Backend environment template
│   └── server.js                 # HTTP & Socket.IO server bootstrap
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/             # Patient & Hospital registration forms
│   │   │   ├── hospital/         # Map, Details Modal, Dashboard tabs
│   │   │   ├── Navbar.jsx        # Navigation bar with active route highlighting
│   │   │   ├── CareAIChat.jsx    # Embedded AI clinical triage assistant
│   │   │   └── EmergencyModal.jsx# Instant SOS initiation modal
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # Authentication context & session storage
│   │   │   └── SocketContext.jsx # Socket.IO connection manager
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx   # Platform landing & feature showcase
│   │   │   ├── Login.jsx         # User authentication with client validation
│   │   │   ├── Register.jsx      # Multi-role account onboarding
│   │   │   ├── HospitalSearch.jsx# Real-time GPS & OSM hospital discovery
│   │   │   ├── BloodDirectory.jsx# Voluntary donor directory & filters
│   │   │   ├── PublicDashboard.jsx# Real-time network aggregates & hospital modal
│   │   │   ├── Campaigns.jsx     # Community health drives directory
│   │   │   ├── UserDashboard.jsx # Patient medical locker, appointments, donor hub
│   │   │   ├── HospitalDashboard.jsx# Clinical inventory, bed tracking, staff admin
│   │   │   └── SymptomChecker.jsx# Dedicated clinical symptom assessment tool
│   │   ├── services/
│   │   │   ├── api.js            # Axios client with 401 interceptors
│   │   │   └── osmService.js     # OpenStreetMap, Overpass & Nominatim service
│   │   ├── App.jsx               # Route mapping & layout wrapper
│   │   └── main.jsx              # Application entry point
│   ├── .env.example              # Frontend environment template
│   └── vite.config.js            # Vite configuration
│
└── README.md                     # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or MongoDB Atlas URI
- **Git**

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/yourusername/SwasthyaSetu.git
cd SwasthyaSetu
```

---

### Step 2: Backend Setup & Configuration

1. Navigate to the backend directory:
   ```bash
   cd backend
   npm install
   ```

2. Create a `.env` file in `backend/` by copying the example:
   ```bash
   cp .env.example .env
   ```

3. Configure your environment variables in `backend/.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/swasthya_setu
   JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long
   JWT_EXPIRE=30d
   CLIENT_URL=http://localhost:5173
   GEMINI_API_KEY=your_optional_google_gemini_api_key
   ```

4. Start the backend server:
   ```bash
   npm run dev
   # or
   npm start
   ```
   *The backend will automatically validate environment variables and verify the MongoDB connection on `http://localhost:5000`.*

---

### Step 3: Frontend Setup & Configuration

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```

2. Create a `.env` file in `frontend/` by copying the example:
   ```bash
   cp .env.example .env
   ```

3. Configure your frontend environment variables in `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```

4. Start the Vite development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 📡 API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register a patient user |
| `POST` | `/api/auth/register-hospital` | Public | Register a new hospital institution |
| `POST` | `/api/auth/login` | Public | Authenticate user and receive JWT token |
| `GET` | `/api/auth/profile` | Private | Fetch logged-in user profile |
| `PUT` | `/api/auth/profile` | Private | Update user medical profile & contacts |

### Hospital & Discovery (`/api/hospitals`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/hospitals` | Public | Search verified network hospitals with filters |
| `GET` | `/api/hospitals/nearby-real` | Public | Live Overpass discovery around `lat`, `lng`, `radius` |
| `GET` | `/api/hospitals/stats` | Public | Live public resource aggregates (beds, blood, ICU) |
| `GET` | `/api/hospitals/connected` | Public | List all connected hospitals for dashboard modal |
| `GET` | `/api/hospitals/:id` | Public | Get single hospital details & available doctors |
| `PUT` | `/api/hospitals/resources` | Hospital | Update bed capacities and blood inventory |

### Blood Donors (`/api/blood-donors`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/blood-donors` | Public | Search active donors with `bloodGroup` and `cityArea` |
| `POST` | `/api/blood-donors` | Private | Register or update voluntary donor details |
| `GET` | `/api/blood-donors/me` | Private | Fetch current user's voluntary donor status |
| `PUT` | `/api/blood-donors/me` | Private | Update blood group, city/area, or preference |
| `DELETE`| `/api/blood-donors/me` | Private | Remove voluntary blood donor registration |

### Health Campaigns (`/api/campaigns`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/campaigns` | Public | Get active health campaigns, drives, and camps |
| `POST` | `/api/campaigns` | Hospital / Admin | Publish a new community health drive |
| `POST` | `/api/campaigns/:id/register` | Private | Register logged-in patient for a drive |

### Emergencies & SOS (`/api/emergency`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/emergency` | Private | Broadcast emergency SOS with GPS coordinates |
| `GET` | `/api/emergency/hospital` | Hospital | Get incoming emergencies assigned to hospital |
| `PUT` | `/api/emergency/:id` | Hospital | Update emergency status (`assigned`, `completed`) |

---

## 🔒 Security & Data Integrity Highlights

- **Strict Environment Validation**: Backend enforces valid environment variables (JWT secrets $\ge 32$ chars, MongoDB URI, Port) upon boot, failing fast if insecure.
- **HTTP Security Headers**: Native Helmet-compliant security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, `Content-Security-Policy`).
- **Rate Limiting**: Global request limiting (100 req/min) and strict authentication rate limiting (10 attempts/15 min) to prevent brute-force attacks.
- **Input Sanitization**: Zero Trust input validation, blood group normalization (safely converting URL-decoded `+` characters), and body size restriction (`max 2MB`).
- **Data Privacy**: Automatic contact masking for voluntary blood donors when viewed by unauthenticated users.
- **Password Protection**: Passwords hashed with `bcryptjs` (salt factor 10) and excluded by default via `{ select: false }` in Mongoose schemas.
- **Socket.IO Room Authorization**: WebSocket connections verified via JWT; ambulance GPS tracking restricted to authorized room participants.

---

## 🧪 Testing & Verification

### Build Verification
Verify both frontend and backend without any build errors:

```bash
# Test Frontend Build
cd frontend
npm run build
# Output: ✓ 11,812 modules transformed. built in ~5s (0 errors)

# Test Backend Environment & Startup
cd ../backend
node -e "require('dotenv').config(); const validateEnv = require('./config/validateEnv'); validateEnv(); console.log('OK');"
```

### Full Workflow Tests
1. **Donor Lifecycle**: Register as donor $\to$ Saved in MongoDB $\to$ Filter by blood group in directory $\to$ View masked info as guest $\to$ Unmask on login $\to$ Edit/Deregister from dashboard.
2. **Hospital Discovery**: Detect current GPS location $\to$ Display real nearby facilities on map $\to$ Expand radius (10km / 25km / 50km) $\to$ View facility modal $\to$ Get routing directions.
3. **Health Campaigns**: Browse active drives $\to$ Filter by type $\to$ Register for drive slot $\to$ Hospital publishes new campaign $\to$ Dynamically updates public directory.
4. **Public Dashboard**: Open dashboard $\to$ Inspect live metrics computed from database $\to$ Click "Connected Hospitals" $\to$ Modal displays verified institutions.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/yourusername/SwasthyaSetu/issues).

---
