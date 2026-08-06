# AssetCare Self-Hosted Installation Guide

Welcome to the AssetCare MERN Application self-hosted guide. Follow the simple steps below to run your isolated workspace in less than 2 minutes.

## Prerequisites
- **Docker** and **Docker Compose** installed on your server.
  - Download and install Docker Desktop: https://www.docker.com/products/docker-desktop/

## Quick Start Setup

1. **Prepare Environment Settings**:
   - Duplicate `.env.example` in this directory and rename it to `.env`.
   - Open `.env` and fill in your custom SMTP host, user, and password (so your team gets onboarding email alerts).
   - Change `JWT_SECRET` to a unique secure random password string.

2. **Boot the Application**:
   - Open a terminal or shell command prompt inside this folder.
   - Run the following command:
     ```bash
     docker compose up -d
     ```
   - Docker will automatically pull the pre-compiled images, set up a secure MongoDB instance, configure connections, and start serving the app.

3. **Register Your Company Workspace**:
   - Open your browser and go to: http://localhost:5000
   - Since this is a fresh setup, you will be redirected to the **First-Run Setup Wizard**.
   - Input your company profile slug (e.g. `acme`), your Admin credentials, and the **Commercial License Key** provided to you by your distributor.
   - Click **Launch Workspace** to provision your isolated MERN workspace database.

4. **Start Working**:
   - Log in with your Admin email and password at http://localhost:5000/login to access the dashboard!
