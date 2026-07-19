<div align="center">

# 🏢 Asset Care Management

**A multi-tenant Enterprise Asset Management (EAM) platform with OCR-powered document intelligence**

<p>
  <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white" alt="JWT" />
  <img src="https://img.shields.io/badge/Status-Active_Development-6366f1?style=flat-square" alt="Status" />
</p>

</div>

## 📖 Overview

**Asset Care Management** modernizes how organizations track assets, process invoices, and manage service requests. Manual, error-prone document handling is replaced with a transparent, digital, workflow-driven system: scanned documents pass through an **automated OCR pipeline** that extracts asset and invoice fields directly into structured records — no manual data entry.

Each organization (tenant) operates in **complete isolation** with its own data, users, and permissions, managed from a central Super-Admin panel.

## ✨ Key Features

- 🏬 **Multi-Tenant Architecture** — fully isolated data, users & permissions per organization, with Super-Admin tenant onboarding and feature management
- 📄 **OCR Document Intelligence** — automated extraction of asset & invoice fields from scanned documents, flowing straight into structured records
- 🔐 **Role-Based Access Control (RBAC)** — scoped permissions across Super Admin, Admin, HOD, and standard user roles
- 🔁 **Approval Workflows** — device/asset request flows with multi-step approvals and full tracking
- 🎫 **Real-Time Ticketing** — service request and ticket management with live status and notifications

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React (dashboards & role-based views) |
| **Backend** | FastAPI (Python) |
| **Database** | MongoDB |
| **Auth** | JWT + Role-Based Access Control |
| **Intelligence** | OCR pipeline for document data extraction |

## 📁 Project Structure

```
Asset-Care-Management/
├── backend/          # FastAPI services, OCR pipeline, auth & tenant logic
├── frontend/         # React app — dashboards, workflows, ticketing UI
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js **v18+**
- Python **3.10+**
- MongoDB (local or Atlas)

### 1️⃣ Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 2️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 3️⃣ Configuration

Create a `.env` file inside `backend/` with your MongoDB connection string and JWT secrets:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

## 👥 Roles & Permissions

| Role | Capabilities |
|------|-------------|
| **Super Admin** | Tenant onboarding, feature management, platform-wide control |
| **Admin** | Organization-level asset, user & workflow management |
| **HOD** | Departmental approvals and request oversight |
| **User** | Raise requests, track tickets, view assigned assets |

## 👤 Author

**Prakhar Kedia** — B.Tech CSE (AI), Bennett University

[![GitHub](https://img.shields.io/badge/GitHub-Prakhar2784-181717?style=flat-square&logo=github)](https://github.com/Prakhar2784)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-prakharkedia-0A66C2?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/prakharkedia/)

---

<div align="center">⭐ If you find this project interesting, consider giving it a star!</div>
