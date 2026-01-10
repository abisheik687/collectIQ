# Docker Deployment Guide

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 8GB RAM minimum
- 20GB free disk space

---

## Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd collectIQ
```

### 2. Environment Setup

Copy environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp ml-models/.env.example ml-models/.env
```

### 3. Start All Services

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database (port 5432)
- Redis cache (port 6379)
- ML API (port 8000)
- Backend API (port 5000)
- Frontend UI (port 3000)

### 4. Access Application

**Frontend**: http://localhost:3000  
**Backend API**: http://localhost:5000/api  
**ML API**: http://localhost:8000

**Demo Credentials**:
- Enterprise: `admin@enterprise.com` / `admin123`
- DCA: `dca@agency.com` / `dca123`

---

## Service Details

### PostgreSQL

- **Image**: postgres:16-alpine
- **Port**: 5432
- **Database**: collectiq
- **User**: postgres
- **Password**: postgres (change in production!)

**Data Persistence**: `postgres_data` volume

### Redis

- **Image**: redis:7-alpine
- **Port**: 6379
- **Use**: Caching, session storage

### ML API

- **Build**: `./ml-models/Dockerfile`
- **Port**: 8000
- **Dependencies**: Python 3.10, scikit-learn, Flask

**Health Check**: http://localhost:8000/health

### Backend API

- **Build**: `./backend/Dockerfile`
- **Port**: 5000
- **Dependencies**: Node.js 18, Express, Sequelize

**Health Check**: http://localhost:5000/api/health

### Frontend

- **Build**: `./frontend/Dockerfile`
- **Port**: 3000 (mapped to 80 in container)
- **Server**: Nginx

---

## Management Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f ml-api
docker-compose logs -f frontend
```

### Stop Services

```bash
docker-compose down
```

### Stop and Remove Volumes

```bash
docker-compose down -v
```

### Restart Service

```bash
docker-compose restart backend
```

### Rebuild Image

```bash
docker-compose build backend
docker-compose up -d backend
```

---

## Database Management

### Access PostgreSQL

```bash
docker-compose exec postgres psql -U postgres -d collectiq
```

### Backup Database

```bash
docker-compose exec postgres pg_dump -U postgres collectiq > backup.sql
```

### Restore Database

```bash
docker-compose exec -T postgres psql -U postgres collectiq < backup.sql
```

### Reset Database

```bash
docker-compose down -v
docker-compose up -d
```

---

## ML Model Training

Models are trained automatically on first startup. To retrain:

```bash
docker-compose exec ml-api python training/train_model.py
docker-compose restart ml-api
```

---

## Troubleshooting

### Port Already in Use

Error: `Bind for 0.0.0.0:5000 failed: port is already allocated`

**Solution**: Change port in `docker-compose.yml`:

```yaml
ports:
  - "5001:5000"  # Changed from 5000:5000
```

### Database Connection Failed

**Check**:
1. PostgreSQL container is running: `docker-compose ps`
2. Database credentials match in backend/.env
3. Wait for database to be ready (check health status)

### ML API Not Responding

**Check**:
1. Model files exist: `docker-compose exec ml-api ls models/`
2. Training completed: `docker-compose logs ml-api | grep "Model saved"`
3. Restart: `docker-compose restart ml-api`

### Frontend Build Errors

**Check**:
1. Node.js version compatibility
2. Dependencies installed correctly
3. Rebuild: `docker-compose build --no-cache frontend`

---

## Production Considerations

### Security

1. **Change default passwords**:
   - PostgreSQL: Update `POSTGRES_PASSWORD` in docker-compose.yml
   - JWT Secret: Update `JWT_SECRET` in backend/.env

2. **Use secrets management**:
   - Docker Secrets
   - Environment variable encryption
   - External secrets providers (AWS Secrets Manager, etc.)

3. **Network isolation**:
   - Use internal networks for service communication
   - Only expose frontend and reverse proxy publicly

### Performance

1. **Resource limits**:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          memory: 1G
```

2. **Replicas** (requires Docker Swarm):

```yaml
services:
  backend:
    deploy:
      replicas: 3
```

3. **Health checks**: Already configured in docker-compose.yml

### Monitoring

Add monitoring services:

```yaml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
  
  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
```

---

## Alternative: Build Individual Services

### Backend Only

```bash
cd backend
docker build -t collectiq-backend .
docker run -p 5000:5000 --env-file .env collectiq-backend
```

### Frontend Only

```bash
cd frontend
docker build -t collectiq-frontend .
docker run -p 3000:80 collectiq-frontend
```

### ML API Only

```bash
cd ml-models
docker build -t collectiq-ml-api .
docker run -p 8000:8000 collectiq-ml-api
```

---

## Next Steps

- See [Kubernetes Deployment](./kubernetes.md) for production k8s setup
- See [API Documentation](../api/README.md) for API usage
- See [User Manuals](../user-manuals/) for application usage

---

For support, create an issue on GitHub or contact the development team.
