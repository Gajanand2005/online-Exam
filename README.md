# 📚 Online Exam System

> A complete school-based Online Examination Platform with Role-Based Access Control (Student, Teacher, Principal)

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Node](https://img.shields.io/badge/Node.js-v18+-blue)
![React](https://img.shields.io/badge/React-v19+-blue)
![Database](https://img.shields.io/badge/MongoDB-Atlas-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Live Services

| Service | URL | Status |
|---------|-----|--------|
| Backend API | http://localhost:8000 | ✅ Running |
| Student Portal | http://localhost:5174 | ✅ Running |
| Teacher Portal | http://localhost:5175 | ✅ Running |

## 🎯 Key Features

### 👨‍🎓 Student Portal
- **Simple Login**: No password needed! Just provide name, class, section, roll no
- **Browse Exams**: See all exams available for their class/section
- **Scheduled Papers**: See when each paper opens, with a countdown; entry only during its slot
- **Take Exams**: MCQ interface with Next/Previous, a question palette and a timer kept in sync with the server
- **Auto-Save & Resume**: Every answer is saved as it's clicked; a refresh or lost connection resumes where it left off
- **Auto-Submit**: When time runs out the paper is submitted, even if the tab was closed
- **Secure Questions**: Questions are only sent once the paper opens; the answer key never leaves the server
- **Results & Rank**: Marks, percentage, rank among classmates and a top-10 leaderboard per exam

### 👨‍🏫 Teacher Portal  
- **Fixed Login**: One teacher account; email and password are set in `server/.env` (no sign-up)
- **Create/Edit/Delete Exams**: Class, section, subject, paper start time and duration (fixed slot: everyone's paper ends at start + duration)
- **Manage Questions**: MCQ questions tagged by chapter, filter by chapter; changes save automatically
- **View Results**: Ranked results per exam with average
- **Export**: Download results (with rank) as Excel files

### 🔐 Principal Dashboard
- **View All Results**: Access results from all classes and exams
- **Advanced Filtering**: Filter by class, section, exam, or subject
- **Master Reports**: Export comprehensive institution-wide data
- **Analytics**: View performance trends and statistics

---

## 📝 Table of Contents

- [Features](#-key-features)
- [Technologies](#-technology-stack)
- [Setup](#-quick-setup)
- [Demo Accounts](#-demo-accounts)
- [Workflow](#-complete-workflow)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Database](#-database-schemas)
- [Deployment](#-deployment-guide)
- [Troubleshooting](#-troubleshooting)
- [Documentation](#-documentation-files)

---

## 🚀 Quick Setup (5 minutes)

### Prerequisites
- Node.js v18+
- npm v9+
- MongoDB (Cloud/Local)
- Modern Browser

### Installation

**1. Clone/Navigate to project:**
```bash
cd online-Exam
```

**2. Start Backend:**
```bash
cd server
npm install
cp .env.example .env   # then fill in your own values (incl. teacher/principal logins)
npm start              # also creates/updates the teacher and principal logins
node seed.js --demo    # optional, local/demo DBs only: sample class 10 students, exams and results
# Runs on http://localhost:8000

# With the server running, in another terminal:
npm test               # end-to-end API checks (creates and cleans up its own exam)
```

**3. Start Student App:**
```bash
cd students
npm install
npm run dev
# Runs on http://localhost:5174
```

**4. Start Teacher App:**
```bash
cd Teacher
npm install
npm run dev
# Runs on http://localhost:5175
```

**All running! Open URLs above in your browser.**

---

## 👥 Logins

### Student Login
```
No password needed!
Just enter: Name, Father Name, Class (10), Section (A), Roll No (001)
```

### Teacher and Principal
Fixed accounts, no sign-up. Set them in `server/.env`; the server creates or updates
them every time it starts (passwords need at least 8 characters):
```env
TEACHER_EMAIL=teacher@yourschool.example     # teacher logs in with this email
TEACHER_PASSWORD=...
PRINCIPAL_USERNAME=principal
PRINCIPAL_PASSWORD=...
```
To change a password, edit `.env` and restart the server. After 10 failed logins
from one IP, staff login is blocked for 15 minutes.

---

## 📊 Technology Stack

### Backend
```
✅ Node.js + Express.js
✅ MongoDB (Mongoose ODM)
✅ JWT Authentication
✅ Cloudinary (File Storage)
✅ ExcelJS (Report Generation)
✅ Bcrypt (Password Hashing)
```

### Frontend
```
✅ React 19 + Vite
✅ React Router DOM
✅ Axios (HTTP Client)
✅ Tailwind CSS
✅ Material-UI Components
✅ React Icons
```

---

## 📂 Directory Structure

```
online-Exam/
├── server/                    # Node.js Backend
│   ├── models/               # MongoDB schemas
│   ├── controllers/          # Business logic
│   ├── routes/               # API endpoints
│   ├── middleware/           # Auth & validation
│   ├── utils/                # Helpers
│   ├── config/               # Database config
│   ├── app.js               # Express app
│   ├── seed.js              # Initialize data
│   └── .env                 # Environment variables
│
├── students/                 # React Student App
│   └── src/components/      # UI components
│
├── Teacher/                  # React Teacher App
│   └── src/components/      # UI components
│
└── 📄 Documentation Files
    ├── README.md            # This file
    ├── SETUP_GUIDE.md       # Detailed setup
    ├── TESTING_GUIDE.md     # Test procedures
    └── QUICK_REFERENCE.md   # Developer reference
```

---

## 🌐 API Endpoints

### Auth
```bash
POST /api/auth/student/login       # Student login/register
POST /api/auth/teacher/login       # Teacher login
POST /api/auth/principal/login     # Principal login
```

### Exams
```bash
GET  /api/exams/student            # Get student exams
GET  /api/exams                    # Get all exams
POST /api/exams                    # Create exam
GET  /api/exams/:id                # Get exam details
PUT  /api/exams/:id                # Update exam
DELETE /api/exams/:id              # Delete exam
```

### Questions
```bash
GET  /api/questions/exam/:id       # Get questions
POST /api/questions                # Add question
PUT  /api/questions/:examId/:questionId        # Update (teacher/principal)
DELETE /api/questions/:examId/:questionId      # Delete
# Students can't call these; they receive questions via /api/attempts
```

### Attempts (students)
```bash
POST /api/attempts/:examId/start   # Start or resume: questions (no answer key) + server deadline
PUT  /api/attempts/:examId/answers # Autosave { answers: [{ questionId, selectedOption }] }
```

### Results
```bash
GET  /api/results/leaderboard/:examId  # Ranked results (students: top 10 + own rank, after submitting)
POST /api/results/submit           # Submit exam
GET  /api/results/student          # My results
GET  /api/results/exam/:id         # Exam results
GET  /api/results/export/excel     # Export Excel
```

---

## 🗄️ Database Schemas

**Student**
```javascript
{ name, fatherName, class, section, rollNo, role: "student" }
```

**Teacher**
```javascript
{ username, password (encrypted), name, email, role: "teacher"|"principal" }
```

**Exam**
```javascript
{ title, subject, class, section, duration, totalMarks, createdBy }
```

**Question**
```javascript
{ examId, questionText, options: [{text, isCorrect}], marks }
```

**Result**
```javascript
{ studentId, examId, answers, totalMarks, marksObtained, percentage }
```

---

## 🔐 Security Features

✅ JWT Authentication (7-day expiry)
✅ Password Hashing (Bcrypt)
✅ Role-Based Access Control
✅ CORS Protection
✅ Environment Variables
✅ Input Validation
✅ Error Handling

---

## 📖 Documentation Files

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup instructions
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing checklist
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Developer reference

---

## 🚀 Deployment

### Backend (Heroku/Railway/Render)
```bash
# Set environment variables
# Deploy Node.js app
```

### Frontend (Vercel/Netlify)
```bash
cd students && npm run build  # Build student app
cd ../Teacher && npm run build # Build teacher app
# Deploy dist/ folders
```

---

## 🆘 Troubleshooting

| Issue | Fix |
|-------|-----|
| MongoDB error | Check MONGO_URI in .env |
| API 404 | Verify backend on port 8000 |
| Blank page | Clear browser cache |
| Image upload fails | Check Cloudinary keys |
| Can't create exam | Ensure teacher is logged in |

---

## 📞 Support

- **Setup Issues**: See [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **Testing Help**: See [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- **API Reference**: See [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

---

## 📄 Environment Variables

See `server/.env.example` for the full list with comments.

```env
JWT_SECRET=a-long-random-string
PORT=8000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/online_exam
TEACHER_EMAIL=teacher@yourschool.example
TEACHER_PASSWORD=change-this-password
PRINCIPAL_USERNAME=principal
PRINCIPAL_PASSWORD=change-this-password-too
# optional: CORS_ORIGIN, RATE_LIMIT_PER_MINUTE (default 1000), TRUST_PROXY=1 behind a proxy
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
CLOUDINARY_PROJECT_FOLDER=school_exam_system
```

---

## 🎓 Use Cases

✅ School Examinations
✅ Competitive Exam Practice
✅ Online Assessments
✅ Certifications
✅ Quizzes & Tests

---

## 📝 License

MIT License - See LICENSE file

---

## ⭐ Features Highlight

- ⚡ Real-Time Result Calculation
- 📱 Responsive Design (Mobile/Tablet/Desktop)
- 🔒 Secure JWT Authentication
- 📊 Advanced Analytics & Reporting
- 🖼️ Image Support in Questions
- 📈 Scalable Architecture
- 🌍 Cloud-Ready Deployment

---

**Version**: 1.0.0 | **Status**: ✅ Production Ready | **Last Updated**: Feb 10, 2026

👉 **Get Started**: Read [SETUP_GUIDE.md](./SETUP_GUIDE.md)
2. **Student portal:** `cd students` → `npm install` → `npm run dev`. Set `VITE_API_URL=http://localhost:8000/api` in `.env` if needed.
3. **Teacher portal:** `cd Teacher` → `npm install` → `npm run dev`. Set `VITE_API_URL=http://localhost:8000/api` in `.env` if needed.

Teacher and principal logins come from `server/.env` (see Logins above). Students log in with Name, Father Name, Class, Section, Roll No.

## 🚀 Deploying your own bot <a name = "deployment"></a>

To see an example project on how to deploy your bot, please see my own configuration:

- **Heroku**: https://github.com/kylelobo/Reddit-Bot#deploying_the_bot

## ⛏️ Built Using <a name = "built_using"></a>

- [PRAW](https://praw.readthedocs.io/en/latest/) - Python Reddit API Wrapper
- [Heroku](https://www.heroku.com/) - SaaS hosting platform

## ✍️ Authors <a name = "authors"></a>

- [@kylelobo](https://github.com/kylelobo) - Idea & Initial work

See also the list of [contributors](https://github.com/kylelobo/The-Documentation-Compendium/contributors) who participated in this project.

## 🎉 Acknowledgements <a name = "acknowledgement"></a>

- Hat tip to anyone whose code was used
- Inspiration
- References
