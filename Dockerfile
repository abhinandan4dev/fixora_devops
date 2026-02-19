# --- Stage 1: Build Frontend ---
FROM node:18-slim AS builder
WORKDIR /app

# Install build essentials for native modules (like better-sqlite3)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
# Use legacy-peer-deps to ignore conflicts during build
RUN npm install --legacy-peer-deps

COPY . .
# Explicitly target the frontend directory for the build to avoid "index.html not found"
RUN npx vite build frontend

# --- Stage 2: Final Runtime ---
FROM node:18-slim
WORKDIR /app

# Install Python, Pip, and Git
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY backend/requirements.txt ./backend/
RUN pip3 install --no-cache-dir --break-system-packages -r backend/requirements.txt

# Copy build artifacts and source
COPY --from=builder /app .

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "run", "start"]
