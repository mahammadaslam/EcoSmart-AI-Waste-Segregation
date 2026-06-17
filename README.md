# EcoSmart AI

## Project Overview

* **Project Name**: EcoSmart AI – Intelligent Waste Segregation & Recycling Assistant
* **Purpose**: Empower households, educational institutions, businesses, and municipal managers to bridge the gap in waste management of everyday materials in strict alignment with **United Nations Sustainable Development Goal (SDG) 12 (Responsible Consumption and Production)**.
* **Problem Statement**: Standard consumer recycling fails due to cognitive sorting blockages, multi-material composite contamination, and outdated static city rules. "Wishcycling" (tossing unrecyclable objects into recycling bins hoping they get processed) contaminates valid waste streams, leading to over 80% of recyclable materials rotting in regional landfills.
* **Solution**: EcoSmart AI provides a high-fidelity, dual-platform-compatible full-stack web client featuring real-time image computer vision classification, dynamic environmental statistics tracking, customized geographic material recovery center routing, and step-by-step upcycling paths.

---

## Key Features

| Feature | Description |
| :--- | :--- |
| **Secure JWT Authentication** | Dynamic JSON Web Token session management with robust user registrations and login routes. Supports a dedicated standard System Admin role portal for verification. |
| **Cognitive Scanner Integration** | High-precision image visual analyzer supporting live device WebRTC camera capture or simple drag-and-drop uploads. |
| **Object-First Recognition** | Resolves the specific item name (e.g. *Newspaper*, *Plastic Bottle*, *Laptop*, *Banana Peel*) before parsing its primary material category to prevent misclassifications of non-waste subjects. |
| **Fuzzy Waste Category Sorting** | Intelligently maps scanned entities into standard classes: Paper, Plastic, Metal, Glass, E-Waste, Organic/Biodegradable, Hazardous, or Mixed Waste. |
| **Double-Scale Certainty Guard** | Provides strict certainty thresholds. Items classified with confidence rates lower than 60.0% alert the user with feedback requesting structural clarity. |
| **Disposal & Upcycle Guidelines** | Gives human-scanned items specific, step-by-step packaging removal, separation, cleaning (e.g., wash away oils), and processing guidelines. |
| **Geospatial Location Maps** | Leverages interactive geospatial mapping. Computes coordinate distances and sorts municipal material recovery facilities, e-waste hubs, or composting portals. Includes manual fallback fields for locations where Web-IFrame sensor access is sandboxed. |
| **Today's Carbon Metric Ledger** | Automatically estimates dynamic physical indicators: kilograms of $CO_2$ offset, liters of water saved, and landfill volume diverted based on historic aggregates. |
| **Curriculum Learning Center** | Integrated material science portal outlining polymer recycling markings (resin codes 1-7), composting life cycles, and municipal sorting. |
| **Responsive Dual-Themes** | Features high-contrast dark and light modes styled with precise negative spacing, modern typography, and responsive layouts. |

---

## Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend UI Framework** | React 19.x with Vite (v6.x) using TypeScript compiled rules. |
| **Styling & Layout** | Tailwind CSS (v4) engineered with a responsive, desktop-first structure. |
| **Animations** | Transition-driven UI enhancements powered by `motion` (Framer motion React). |
| **Data Visualization** | Dynamic graphs rendered via SVG utilizing `recharts` and `d3`. |
| **Mapping Engine** | Leaflet.js rendering OpenStreetMap coordinates and localized routing nodes. |
| **Backend API** | Node.js with Express server executing modular routes and automated static hosting. |
| **Database Pool** | Dual-mode configuration supporting a persistent MySQL database (using `mysql2/promise`) with a secondary file fallback structure. |

---

## Project Dependencies

| Package | Purpose |
| :--- | :--- |
| `@google/genai` | Multi-material prompt classification processing and vision schema parsing. |
| `express` | Web API endpoint handling and user asset compression routing. |
| `jsonwebtoken` | Token generation and route middleware protection mechanisms. |
| `bcryptjs` | Strong cryptographic hashing protocols for safe authentication storage. |
| `leaflet` | Mapping, tile rendering, center calculations, and routing coordinates. |
| `recharts` / `d3` | Dynamic graphing, multi-interval bars, and active category tracking charts. |
| `mysql2` | High-efficiency connection pooling and query preparation for relational storage. |
| `motion` | Staggered listing entries, card fades, and smooth router transition animations. |

---

## Project Structure

```text
ecosmart-ai/
├── .env.example
├── .gitignore
├── README.md
├── assets/
├── database/
│   ├── local_db/
│   └── schema.sql
├── index.html
├── metadata.json
├── package-lock.json
├── package.json
├── server.ts
├── tsconfig.json
├── vite.config.ts
├── server/
│   ├── config/
│   │   └── db.ts
│   ├── middleware/
│   │   └── auth.ts
│   └── routes/
│       ├── admin.ts
│       ├── auth.ts
│       ├── chats.ts
│       └── scans.ts
└── src/
    ├── App.tsx
    ├── index.css
    ├── main.tsx
    ├── types.ts
    ├── components/
    │   ├── ErrorAlert.tsx
    │   └── Toast.tsx
    ├── pages/
    │   ├── AdminPanel.tsx
    │   ├── AnalyticsDashboard.tsx
    │   ├── Chat.tsx
    │   ├── Dashboard.tsx
    │   ├── LearningCenter.tsx
    │   ├── Login.tsx
    │   ├── NearCenters.tsx
    │   ├── ResponsibleAI.tsx
    │   └── Scanner.tsx
    ├── services/
    │   └── api.ts
    └── utils/
        └── errorHelper.ts
```

---

## Application Workflow

```text
[User Login / Registration]
         │
         ▼
[AI Waste Scanner] ──(WebRTC Capture or Image Upload)──► [Cognitive Multi-Step Recognition]
                                                                        │
                                                                        ▼
                                                         [Object-First Material Classification]
                                                                        │
                                          ┌─────────────────────────────┴─────────────────────────────┐
                                          ▼                                                           ▼
                             [Step-by-Step Upcycling]                                    [Environmental Impact Ledger]
                                          │                                                           │
                                          ▼                                                           ▼
                             [Geospatial Depot Routing]                                  [Live Analytics / History]
```

1. **User Login & Session Initialization**: Secure credentials verification or standard visitor login triggers JSON Web Token issuance. This securely sets up unique workspace records.
2. **WebRTC Web-Camera / File Upload Access**: Initiates the visual ingestion stream. Users can upload image files or authorize webcam feeds to grab discarding candidates.
3. **Cognitive Object Recognition & Category Sorting**: Resolves the precise item name (e.g. *Milk Carton*) to establish material classes (e.g. *Paper*). It guards against unidentifiable or blurry crops under 60.0% certainty.
4. **Segregation & Recycling Recommendation**: Returns tailored preparation guides (e.g. peel labels, flatten carton) and details circular upcycling techniques.
5. **Geospatial Depot Routing**: Extracts geographic markers to load open-source Leaflet coordinates, marking nearby recovery stations matching the material.
6. **Live Analytics Tracking**: Converts historic scan history records into aggregates showing individual green scores and real-time carbon offsets.

---

## Local Development Setup

### Prerequisites
* **Node.js**: `v18.0.0` or higher (LTS recommended).
* **MySQL Server**: Optional (Local JSON flat-file storage defaults as a fallback if SQL services are not bound).

### Installation
1. Clone the project repository and navigate to the directory:
   ```bash
   cd ecosmart-ai
   ```
2. Install the package dependencies:
   ```bash
   npm install
   ```

### Environment Variables
Configure a `.env` file in the project's root folder utilizing the variables described in `.env.example`:
```env
# Server Port Configuration
PORT=3000

# API secret parameters
GEMINI_API_KEY=your_secured_api_key_here
JWT_SECRET=your_jwt_signature_key_here

# Database Configurations (MySQL Connection Pool)
# If left blank, EcoSmart AI automatically falls back to local JSON persistence
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=ecosmart_db
```

### Running Locally in VS Code
1. Open the project root folder within VS Code.
2. Start the integrated dual-mode development server (Express backend + Vite HMR frontend):
   ```bash
   npm run dev
   ```
3. Open **`http://localhost:3000`** in your favorite browser.

### Build Commands
Compile and bundle the production assets cleanly:
```bash
# Triggers both front-end Vite compile and CJS Server bundle optimizations
npm run build
```

---

## Production Deployment

### VPS (Virtual Private Server) Setup
Deploying to an Ubuntu/Debian server using simple Systemd controls:
1. Ensure Node.js and MySQL are active on the instance.
2. Build the production build artifact:
   ```bash
   npm run build
   ```
3. Launch via system controls or process managers:
   ```bash
   node dist/server.cjs
   ```

### Docker Integration
Create a simple `Dockerfile` in the root:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
```

---

## Screens and Modules

| Module / Page | Purpose |
| :--- | :--- |
| **`Login.tsx`** | Coordinates session authentication through JWT checking. |
| **`Dashboard.tsx`** | Visual hub listing dynamic statistics, carbon saving reports, real-time center shortcuts, and recent history logs. |
| **`Scanner.tsx`** | Interactive viewfinder supporting webcam capture, drag-and-drop uploads, classification outputs, and step-by-step recycling details. |
| **`NearCenters.tsx`** | Renders live Map locations, calculates coordinates routes, and lists recovery facility contacts matching categorized waste types. |
| **`AnalyticsDashboard.tsx`** | Evaluates long-term carbon metrics and material streams in real-time. |
| **`LearningCenter.tsx`** | Curates sustainable materials, circular economy tutorials, and guidelines on standard resin structures. |
| **`Chat.tsx`** | Dedicated conversation companion to answer general consumer segregation inquiries. |
| **`ResponsibleAI.tsx`** | Detailed ethical page addressing image classification constraints, model accountability, and data boundaries. |
| **`AdminPanel.tsx`** | Specialized control deck enabling system operators to monitor scans and accounts. |

---

## Future Enhancements
* **OCR Labelling**: Intelligently scan barcode strings during camera capture to fetch commercial packaging compositions.
* **Civic Reporting Integrations**: Direct API reporting links hook municipal managers to community clusters reporting hazardous waste dumps.
* **Offline Model Inference**: Small-footprint visual classification running native compiled targets inside offline browsers.

---

## Developer Information

* **Developer**: Mahammad Aslam
* **Project Title**: EcoSmart AI – Intelligent Waste Segregation & Recycling Assistant
* **Focus Area**: Real-World Solid Waste Auditing and SDG-12 Support

---

## License

Distributed under the **MIT License**. Check the parent repository details for reuse permissions.
