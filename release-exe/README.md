# Asset Care System - Windows Desktop Release

This directory contains the self-hosted, standalone Windows executable distribution of the **Asset Care System**. 

The system runs locally on your PC or server as a desktop application, containing both the React frontend and Node.js backend bundled inside a single `.exe` file.

---

## Quick Start Guide

### Prerequisite: MongoDB
The application requires a MongoDB database to store its data. You can run it either with a local MongoDB database or a cloud-hosted MongoDB database (such as MongoDB Atlas).

- **Option A (Local Database)**: Install and start [MongoDB Community Server](https://www.mongodb.com/try/download/community) on your Windows machine. It runs on `mongodb://localhost:27017` by default.
- **Option B (Cloud Database)**: Register for a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and obtain a connection string URI.

### Steps to Run:
1. Verify that `.env` is present in the same folder as `asset-care-backend.exe`.
2. (Optional) Open the `.env` file in a text editor to update your settings (such as pointing `MONGO_URI` to a remote MongoDB Atlas URI or changing email settings).
3. Double-click `asset-care-backend.exe` to launch the application.
4. A console window will open, and your default web browser will automatically launch to `http://localhost:5000` showing the Asset Care System dashboard.

---

## File Uploads & Data Storage

All media attachments, documents, and uploaded assets are saved directly to a physical folder named `uploads/` created automatically in the same directory as the executable. 

*Do not delete the `uploads/` folder, as it contains all files uploaded via the application.*

---

## Configuration Settings (`.env`)

You can customize the application behavior by modifying values in the `.env` file:

- **`PORT`**: The local port the application listens on (default is `5000`).
- **`MONGO_URI`**: The connection link to your MongoDB database.
- **`SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS`**: SMTP settings to send email notifications for tickets, approvals, and alerts.
