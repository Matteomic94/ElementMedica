# Week 17 - Production Deployment Guide

## Overview

This guide covers the complete production deployment process for the Document Management System using blue-green deployment strategy with comprehensive monitoring and rollback capabilities.

## 🚀 Quick Start

### Prerequisites

1. **Environment Setup**
   ```bash
   # Copy and configure production environment
   cp .env.production.example .env.production
   # Edit .env.production with your actual values
   ```

2. **SSL Certificates**
   ```bash
   # Place your SSL certificates in the correct locations
   sudo cp yourdomain.com.crt /etc/ssl/certs/
   sudo cp yourdomain.com.key /etc/ssl/private/
   sudo cp yourdomain.com.chain.crt /etc/ssl/certs/
   ```

3. **Docker and Docker Compose**
   ```bash
   # Ensure Docker is running
   docker --version
   docker-compose --version
   ```

## 📋 Deployment Process

### 1. Staging Deployment

```bash
# Deploy to staging environment
./scripts/deploy-staging.sh

# Verify staging deployment
curl -f http://localhost:8080/health
```

### 2. Production Deployment (Blue-Green)

```bash
# Full production deployment with blue-green strategy
./scripts/deploy-production.sh

# The script will:
# - Run pre-deployment checks
# - Build and test the application
# - Create green environment
# - Run migrations and health checks
# - Switch traffic to green
# - Clean up blue environment
```

### 3. Manual Blue-Green Steps (Advanced)

```bash
# Step 1: Create green environment
./scripts/create-green-environment.sh

# Step 2: Verify green environment
./scripts/health-check.sh

# Step 3: Switch traffic to green
./scripts/switch-to-green.sh
```

## 🔧 Configuration Files

### Environment Files

- **`.env.staging`** - Staging environment configuration
- **`.env.production`** - Production environment configuration

### Docker Compose Files

- **`docker-compose.staging.yml`** - Staging services definition
- **`docker-compose.production.yml`** - Production services with blue-green support

### Nginx Configuration

- **`nginx/nginx.conf`** - Load balancer with blue-green routing

### Monitoring Configuration

- **`monitoring/prometheus.yml`** - Metrics collection
- **`monitoring/grafana/`** - Dashboard configuration
- **`monitoring/alertmanager.yml`** - Alert routing and notifications

## 📊 Monitoring and Health Checks

### Health Check Script

```bash
# Run comprehensive health check
./scripts/health-check.sh

# Options:
./scripts/health-check.sh --verbose  # Detailed output
./scripts/health-check.sh --json     # JSON format
./scripts/health-check.sh --quiet    # Silent mode
```

### Monitoring Services

- **Prometheus**: http://localhost:9090 - Metrics collection
- **Grafana**: http://localhost:3000 - Dashboards and visualization
- **Alertmanager**: http://localhost:9093 - Alert management

### Key Metrics to Monitor

1. **System Metrics**
   - CPU usage
   - Memory usage
   - Disk space
   - Network I/O

2. **Application Metrics**
   - Response times
   - Error rates
   - Request throughput
   - Database performance

3. **Business Metrics**
   - User activity
   - Document uploads
   - Authentication events

## 🔄 Rollback Procedures

### Automatic Rollback

The deployment script includes automatic rollback triggers:
- Health check failures
- Performance degradation
- Error rate spikes

### Manual Rollback

```bash
# Emergency rollback to previous version
./scripts/rollback-production.sh

# The script will:
# - Stop current services
# - Restore previous configuration
# - Restore database backup
# - Restart services
# - Verify rollback success
```

## 🛡️ Security Considerations

### SSL/TLS Configuration

- TLS 1.2+ only
- Strong cipher suites
- HSTS headers
- Certificate chain validation

### Security Headers

- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection

### Rate Limiting

- API endpoints: 100 requests/hour per IP
- Authentication: 1 request/second per IP
- File uploads: 10MB max size

## 📈 Performance Optimization

### Caching Strategy

- Redis for session storage
- Nginx for static file caching
- Database query optimization

### Load Balancing

- Nginx upstream configuration
- Health check integration
- Failover mechanisms

### Resource Limits

```yaml
# Example resource limits in docker-compose
resources:
  limits:
    cpus: '2.0'
    memory: 2G
  reservations:
    cpus: '1.0'
    memory: 1G
```

## 🚨 Troubleshooting

### Common Issues

1. **Service Won't Start**
   ```bash
   # Check logs
   docker-compose logs [service_name]
   
   # Check resource usage
   docker stats
   ```

2. **Database Connection Issues**
   ```bash
   # Test database connectivity
   pg_isready -h localhost -p 5432
   
   # Check database logs
   docker-compose logs postgres
   ```

3. **SSL Certificate Issues**
   ```bash
   # Verify certificate
   openssl x509 -in /etc/ssl/certs/yourdomain.com.crt -text -noout
   
   # Test SSL connection
   openssl s_client -connect yourdomain.com:443
   ```

### Log Locations

- Application logs: `backend/logs/`
- Health check logs: `logs/health-check.log`
- Nginx logs: `/var/log/nginx/`
- Docker logs: `docker-compose logs`

## 📞 Emergency Contacts

### Escalation Matrix

1. **Level 1**: Development Team
   - Email: dev@yourdomain.com
   - Slack: #dev-alerts

2. **Level 2**: DevOps Team
   - Email: devops@yourdomain.com
   - Slack: #devops-alerts
   - Phone: +1-XXX-XXX-XXXX

3. **Level 3**: Management
   - Email: management@yourdomain.com
   - Phone: +1-XXX-XXX-XXXX

### Notification Channels

- **Slack**: Real-time alerts
- **Email**: Detailed reports
- **PagerDuty**: Critical incidents
- **SMS**: Emergency notifications

## 📚 Additional Resources

### Documentation

- [Deployment Architecture](docs/deployment/deployment-architecture.md)
- [Deployment Guide](docs/deployment/deployment-guide.md)
- [API Documentation](http://localhost:8888/docs)

### Monitoring Dashboards

- [System Overview](http://localhost:3000/d/system-overview)
- [Application Metrics](http://localhost:3000/d/app-metrics)
- [Blue-Green Status](http://localhost:3000/d/deployment-status)

### Runbooks

- [Service Down](https://docs.yourdomain.com/runbooks/service-down)
- [High Response Time](https://docs.yourdomain.com/runbooks/high-response-time)
- [Database Issues](https://docs.yourdomain.com/runbooks/database-issues)
- [Security Incidents](https://docs.yourdomain.com/runbooks/security-incidents)

## ✅ Deployment Checklist

### Pre-Deployment

- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database backup created
- [ ] Monitoring services running
- [ ] Team notified of deployment

### During Deployment

- [ ] Pre-deployment checks passed
- [ ] Green environment created successfully
- [ ] Health checks passed
- [ ] Performance tests passed
- [ ] Traffic switched to green

### Post-Deployment

- [ ] All services healthy
- [ ] Monitoring alerts configured
- [ ] Performance metrics normal
- [ ] User acceptance testing passed
- [ ] Documentation updated
- [ ] Team notified of completion

## 🔧 Maintenance

### Regular Tasks

- **Daily**: Health check monitoring
- **Weekly**: Performance review
- **Monthly**: Security updates
- **Quarterly**: Disaster recovery testing

### Backup Strategy

- **Database**: Daily automated backups
- **Configuration**: Version controlled
- **Logs**: 30-day retention
- **Metrics**: 90-day retention

---

**Note**: This deployment process follows industry best practices for zero-downtime deployments with comprehensive monitoring and rollback capabilities. Always test in staging before production deployment.