# 🚀 Camp-X (College Companion Platform)

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Google_Gemini-AI-4285F4?logo=google&logoColor=white" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/Firebase-Auth_%26_Firestore-FFCA28?logo=firebase&logoColor=black" alt="Firebase" />
</p>

Camp-X is an all-in-one college companion web platform engineered to centralize student resources, streamline grievance redressal, facilitate academic sharing, and supercharge campus assistance with an integrated AI copilot.

---

## 📑 Table of Contents

- [Features](#-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Frontend Setup](#1-frontend-setup)
  - [Backend Setup](#2-backend-setup)
  - [Environment Variables](#environment-variables)
- [Available Scripts](#-available-scripts)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Developer](#-developer)

---

## ✨ Features

### 🎓 Student & Academic Hub
- **Academia Central & Digital Notes**: Curated repositories of study material, subject notes, syllabus guides, and lecture references.
- **Previous Year Questions (PYQ)**: Organized repository of past examination papers categorized by course and semester.
- **Attendance Tracker**: Visual tracking tool with progress bars to keep attendance above requisite thresholds.
- **Lost & Found Portal**: Campus-wide board to report lost items and claim found personal belongings.
- **Campus Notice & Updates**: Real-time notifications for official college announcements, circulars, and event schedules.
- **Resume Analyzer**: Tool designed to inspect and critique student resumes for internships and campus placements.
- **Handwriting Tools**: Digital utilities designed to assist student assignment preparation.

### 📢 Campus Grievance System
- **Campus Complaints**: Comprehensive portal for raising maintenance, academic, and administrative tickets.
- **Multi-Level Tracking**: Real-time status indicators (Pending, In Progress, Resolved) with email notifications powered by EmailJS & Nodemailer.

### 🤖 CampX Assist (AI Chatbot & Knowledge Assistant)
- **AI-Powered Assistance**: Integrated Gemini-backed assistant answering campus FAQs, policies, locations, and procedures.
- **Dual-Mode Intelligence**: Fast local rule-based intent parsing combined with LLM fallbacks for conversational questions.
- **Escalation Flow**: Direct ticket creation for unresolved user inquiries when human intervention is needed.

### 🛡️ Admin Governance Dashboard
- **Ticket Management**: Dedicated dashboard for college authorities to review, categorize, and resolve student complaints.
- **User Administration**: Role-based access controls (RBAC) to manage student and administrator accounts.
- **Analytics & Trends**: Visual charts for ticket turnaround times and department issue hotspots.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend UI** | React 19, TypeScript, Vite, React Router 7 |
| **Styling & Animation** | Modern Glassmorphism CSS, Framer Motion, Spline 3D Runtime, Lucide Icons |
| **Backend API** | Node.js, Express.js |
| **Databases & Auth** | MongoDB (Mongoose), Firebase Authentication & Cloud Firestore |
| **AI Integration** | Google Gemini API (gemini-2.5-flash) |
| **Email & Notifications** | EmailJS (client-side), Nodemailer (server-side) |
| **Hosting & Deploy** | Vercel (Frontend), Render (Backend) |

---

## 📂 Project Directory Structure

```plaintext
camp-x/
├── backend/                  # Express REST API & AI microservice
│   ├── routes/               # API route definitions
│   │   └── chatbot.js        # Chatbot endpoints & query handler
│   ├── services/             # Core business logic & integrations
│   │   ├── aiService.js      # Google Gemini API integration
│   │   └── notificationService.js # Nodemailer email delivery
│   ├── server.js             # Express application entry point & DB models
│   ├── package.json          # Backend dependencies & scripts
│   └── .env.example          # Sample backend environment configuration
│
├── public/                   # Static assets, videos, and preview media
├── src/                      # React frontend source code
│   ├── assets/               # Local icons and card illustrations
│   │   └── cards/            # Dashboard card graphics
│   ├── components/           # Reusable UI components
│   │   ├── ChatbotWidget.tsx # Floating CampX Assist chatbot
│   │   ├── FloatingOrbs.tsx  # Ambient background motion graphics
│   │   └── VideoBackground.tsx # Hero video player
│   ├── hooks/                # Custom React lifecycle and animation hooks
│   │   ├── useParticleTrail.ts
│   │   ├── useScrollReveal.ts
│   │   ├── useTilt.ts
│   │   └── useTypewriter.ts
│   ├── pages/                # Application routes & views
│   │   ├── AcademiaCentral.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminUsers.tsx
│   │   ├── Attendance.tsx
│   │   ├── CampusComplaint.tsx
│   │   ├── CollegeUpdates.tsx
│   │   ├── ForgotPassword.tsx
│   │   ├── Handwriting.tsx
│   │   ├── Home.tsx
│   │   ├── Intro.tsx
│   │   ├── Login.tsx
│   │   ├── LostAndFound.tsx
│   │   ├── Notes.tsx
│   │   ├── PYQ.tsx
│   │   ├── ResetPassword.tsx
│   │   ├── ResumeAnalyzer.tsx
│   │   ├── SignUp.tsx
│   │   └── SupportQueries.tsx
│   ├── utils/                # API clients, Firebase config & helpers
│   │   ├── apiClient.ts      # Axios/fetch wrappers with fallback logic
│   │   ├── chatbotApi.ts     # Client handler for AI assistant
│   │   ├── emailService.ts   # Client-side EmailJS integration
│   │   └── firebase.ts       # Firebase SDK initialization
│   ├── App.tsx               # Root route switcher & layout wrapper
│   ├── main.tsx              # React DOM entry point
│   └── index.css             # Global stylesheet & design tokens
│
├── .gitignore                # Git exclusions
├── package.json              # Frontend dependencies & build commands
├── render.yaml               # Render blueprint configuration
├── tsconfig.json             # TypeScript root compiler configuration
├── vercel.json               # Vercel deployment rewrites
└── vite.config.ts            # Vite bundler configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **yarn**
- **MongoDB**: A running local instance or MongoDB Atlas cluster connection string
- **Firebase Project**: Configured for Web with Email/Password Authentication
- **Google Gemini API Key**: For AI assistant capabilities

---

### 1. Frontend Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Nischaybahl/Camp-X.git
   cd Camp-X
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

### 2. Backend Setup

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure backend `.env`:**
   Create a `.env` file in `backend/`:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   GEMINI_API_KEY=your_gemini_api_key
   ADMIN_EMAIL=your_admin_email@example.com
   EMAIL_USER=your_nodemailer_email@example.com
   EMAIL_PASS=your_email_app_password
   CLIENT_URL=http://localhost:5173
   ```

4. **Start backend server:**
   ```bash
   npm run dev
   ```
   Backend will launch on `http://localhost:5000`.

---

## 📜 Available Scripts

### Root (Frontend)
- `npm run dev`: Starts Vite local development server.
- `npm run build`: Compiles TypeScript and runs production build.
- `npm run lint`: Runs ESLint over project files.
- `npm run preview`: Previews built production artifacts locally.

### Backend
- `npm run dev` / `npm start`: Starts Node.js Express server.

---

## 🌐 Deployment

- **Frontend**: Pre-configured for **Vercel** with single-page app (SPA) rewrites in `vercel.json`.
- **Backend**: Configured for **Render** via `render.yaml` with continuous deployment from the main branch.

---

## 👨‍💻 Developer & Credits

Crafted with ❤️ by **[Nischay Bahl](https://github.com/Nischaybahl)**.
