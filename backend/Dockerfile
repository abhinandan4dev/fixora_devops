FROM python:3.12-slim

WORKDIR /app

# Install git (required for the AI Agent)
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy and install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . .

# Expose FastAPI port
EXPOSE 8000
# Start the server using the dynamic PORT provided by Railway
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"
