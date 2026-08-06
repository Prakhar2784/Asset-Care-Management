# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Serve using Node backend
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./backend/
RUN npm install --prefix backend --omit=dev
COPY backend/ ./backend/
# Copy the built frontend static assets into the frontend/dist directory relative to the backend
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

WORKDIR /app/backend
EXPOSE 5000
ENV NODE_ENV=production
ENV PORT=5000
CMD ["node", "server.js"]
