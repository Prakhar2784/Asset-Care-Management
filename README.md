# AssetCare Pro

A full-stack, multi-tenant IT asset management platform for organizations to track assets, manage breakdown tickets, handle device requests with approval workflows, and administer users — with role-based access and per-tenant plan/feature gating.

## Features

- **Asset Registry & Tracking** — full asset lifecycle: category, department, location, warranty, AMC, and ownership records.
- **Breakdown Tickets** — employees raise repair/service tickets with priority, SLA tracking, attachments, and comments; ticket owners can withdraw pending tickets and confirm resolution once repaired.
- **Device Requests & Approvals** — employees request new devices; routed to HODs/admins for approval, with email + in-app notifications.
- **Role-Based Access Control** — Admin, Super Admin, HOD, IT Support, Manager, and Employee roles, plus granular per-user custom permissions.
- **Multi-Tenant Architecture** — each company gets an isolated database; per-tenant plan (Basic/Pro/Enterprise) with configurable feature flags and usage limits.
- **Enterprise Hub** — warehouse, software license, and AMC contract management for larger organizations.
- **OCR Document Scanning** — Tesseract.js-based client-side OCR for automated invoice/asset data extraction.
- **Audit Logs & Reports** — full activity trail and department/warranty/breakdown reporting.
- **Dark Mode UI** — built with React + MUI v9.

## Tech Stack

- **Frontend:** React, Material UI (MUI v9), React Router, Framer Motion
- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Auth:** JWT-based authentication with role + custom-permission authorization

## Project Structure
