FROM node:20-alpine AS client-builder

WORKDIR /app/client

# Copy and install client dependencies
COPY client/package*.json ./
RUN npm ci

# Copy client source
COPY client/ ./

# Build the client app
RUN npm run build

FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    netcat-traditional \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy server files
COPY server/ ./

# Copy the built client from the previous stage
COPY --from=client-builder /app/client/.next ./client/.next
COPY --from=client-builder /app/client/public ./client/public

# Set production environment variables
ENV DEBUG=0
ENV DJANGO_SETTINGS_MODULE=server.settings

# Run database migrations
RUN python manage.py collectstatic --noinput

# Create a script to create superuser
RUN echo '#!/bin/bash\n\
python manage.py migrate\n\
python manage.py shell -c "\
from django.contrib.auth import get_user_model;\
User = get_user_model();\
if not User.objects.filter(username=\"tanakrit\").exists():\
    User.objects.create_superuser(\"tanakrit\", \"tanakrit.mae@dome.tu.ac.th\", \"Tanakrit@superuser\")\
    print(\"Superuser created.\");\
else:\
    print(\"Superuser already exists.\");\
"\n\
exec gunicorn --bind 0.0.0.0:8000 server.wsgi:application\
' > /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expose port for the application
EXPOSE 8000

# Run entrypoint script
CMD ["/app/entrypoint.sh"] 