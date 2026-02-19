# Production Dockerfile for FiXora
# Combine Node.js for Frontend/Server and Python for Backend

# --- Stage 1: Build Frontend ---
FROM node:18-slim AS builder
WORKDIR /app
COPY package*.json ./
COPY frontend/package*.json ./frontend/
RUN npm install
COPY . .
RUN npm run build

# --- Stage 2: Final Runtime ---
FROM node:18-slim
WORKDIR /app

# Install Python and Git
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Backend dependencies
COPY backend/requirements.txt ./backend/
RUN pip3 install --no-cache-dir -r backend/requirements.txt

# Copy built frontend and server files
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app .

# Environments
ENV NODE_ENV=production
ENV PORT=3000

# Expose the combined port
EXPOSE 3000

# Start the combined server
# Note: The server.ts already handles starting main.py
CMD ["npm", "run", "start"]
