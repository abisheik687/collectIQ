FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Train model if not exists
RUN python training/train_model.py || true

# Expose port
EXPOSE 8000

# Run with gunicorn for production (Render uses $PORT variable)
# Falls back to python api.py if gunicorn command fails (for local dev)
CMD gunicorn --bind 0.0.0.0:${PORT:-8000} --workers 2 --threads 4 --timeout 120 api:app || python api.py
