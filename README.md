# Asset-Care-Management

A multi-tenant **Enterprise Asset Management (EAM)** platform that digitizes how organizations track assets, process invoices, and manage service requests — featuring an **OCR-powered document-intelligence pipeline** that converts scanned documents into structured data automatically.

Built with a **React** frontend, a **FastAPI** backend, and **MySQL**, secured end-to-end with **JWT authentication** and **role-based access control (RBAC)**.

![Frontend](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=white)
![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)
![Database](https://img.shields.io/badge/Database-MySQL-4479A1?logo=mysql&logoColor=white)
![Auth](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white)

> **Status:** Actively developed. The backend and frontend live in this repository under `backend/` and `frontend/`.

---

## Overview

In many organizations, asset and invoice records are still maintained by hand — data typed in one field at a time, requests tracked over email, and no single source of truth. **Asset-Care-Management** centralizes this into one platform where each tenant organization's data, users, and permissions stay fully isolated, and where document data entry is automated through OCR.

The problem it solves: **turn slow, manual, error-prone asset and document handling into a transparent, digital, workflow-driven system.**

---

## Key Features

### 🏢 Multi-Tenancy
- Fully isolated data, users, and permissions per tenant organization
- Super-Admin panel to onboard tenants, configure custom plans, and control feature gating per organization
- Guided onboarding flow for new tenants

### 📄 Document Intelligence (OCR)
- Automated Optical Character Recognition (OCR) extraction of asset and invoice fields from scanned documents and images
- Extracted data flows directly into asset records and approval workflows, replacing manual data entry

### 🔐 Authentication & Access Control
- JWT-based authentication with password hashing
- Role-based access control (RBAC) with scoped permissions across roles (Super Admin, Admin, HOD, and standard users)
- Input validation on sensitive fields

### 🔁 Workflows & Ticketing
- Device / asset request workflows with approval steps
- Ticket management with resolution tracking
- Real-time notifications to keep requests moving

---

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React                             |
| Backend   | FastAPI (Python)                  |
| Database  | MySQL                             |
| Auth      | JWT (JSON Web Tokens)             |
| Document  | Optical Character Recognition (OCR) |

---

## Architecture

```
                    ┌─────────────────────────────┐
                    │        React Frontend        │
                    │  (Super Admin / Admin / User │
                    │      dashboards & flows)     │
                    └──────────────┬──────────────┘
                                   │  REST API (JWT-secured)
                    ┌──────────────▼──────────────┐
                    │        FastAPI Backend       │
                    │  Auth · RBAC · Tenancy ·     │
                    │  Workflows · OCR pipeline    │
                    └───────┬─────────────┬────────┘
                            │             │
                 ┌──────────▼───┐   ┌─────▼─────────┐
                 │    MySQL      │   │  OCR Engine   │
                 │ (multi-tenant │   │ (document →   │
                 │    schema)    │   │  structured)  │
                 └───────────────┘   └───────────────┘
```

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.10+
- MySQL

> These are the standard setup commands for a FastAPI + React project. Adjust the entry-point (`main:app`) and script names if your files differ.

### 1. Clone
```bash
git clone https://github.com/Prakhar2784/Asset-Care-Management.git
cd Asset-Care-Management
```

### 2. Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

### 4. Environment variables
Create a `.env` file inside `backend/` with your own values:
```env
DATABASE_URL=mysql://<user>:<password>@localhost:3306/assetcare
JWT_SECRET=<your-secret-key>
```

---

## Project Structure

```
Asset-Care-Management/
├── backend/     # FastAPI — API, auth, RBAC, tenancy, OCR pipeline
├── frontend/    # React — dashboards and user flows
├── .gitignore
└── README.md
```

---

## Author

**Prakhar Kedia** — AI/ML Engineer
[GitHub](https://github.com/Prakhar2784) · [LinkedIn](https://www.linkedin.com/in/prakharkedia) · kediaprakhar@gmail.com
