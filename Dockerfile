FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install dependencies first (for caching)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend source code
COPY backend/ .

# Run the FastAPI app using Uvicorn
# Railway provides the PORT environment variable dynamically
CMD uvicorn main:app --host 0.0.0.0 --port $PORT
