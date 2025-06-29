# Common Issues and Troubleshooting Guide

**Versione:** 1.0  
**Data:** 27 Gennaio 2025  
**Autore:** Team Development

## 📋 Panoramica

Questa guida fornisce soluzioni per i problemi più comuni che possono verificarsi nel Sistema di Gestione Documenti. È organizzata per categoria e livello di gravità per facilitare la risoluzione rapida dei problemi.

## 🚨 Problemi Critici

### Sistema Non Raggiungibile

#### Sintomi
- Impossibile accedere all'applicazione
- Timeout di connessione
- Errore 502/503/504

#### Diagnosi
```bash
# Verifica status servizi
sudo systemctl status document-system
sudo systemctl status nginx
sudo systemctl status postgresql
sudo systemctl status redis

# Verifica porte in ascolto
sudo netstat -tlnp | grep -E ':(3000|3001|3002|5432|6379)'

# Verifica log errori
tail -f /var/log/nginx/error.log
tail -f /var/log/document-system/error.log
```

#### Soluzioni

**1. Riavvio Servizi**
```bash
# Riavvio completo sistema
sudo systemctl restart document-system
sudo systemctl restart nginx

# Verifica status dopo riavvio
sudo systemctl status document-system
```

**2. Verifica Configurazione Nginx**
```bash
# Test configurazione
sudo nginx -t

# Se errori, controlla configurazione
sudo nano /etc/nginx/sites-available/document-system

# Ricarica configurazione
sudo nginx -s reload
```

**3. Verifica Spazio Disco**
```bash
# Controlla spazio disponibile
df -h

# Se disco pieno, pulisci log vecchi
find /var/log -name "*.log" -mtime +7 -delete
find /tmp -type f -mtime +1 -delete
```

### Database Non Disponibile

#### Sintomi
- Errori di connessione database
- Timeout query
- Applicazione non risponde

#### Diagnosi
```bash
# Status PostgreSQL
sudo systemctl status postgresql

# Connessione database
psql -h localhost -U document_user -d document_system -c "SELECT 1;"

# Log PostgreSQL
tail -f /var/log/postgresql/postgresql-*.log

# Connessioni attive
psql -d document_system -c "SELECT count(*) FROM pg_stat_activity;"
```

#### Soluzioni

**1. Riavvio PostgreSQL**
```bash
sudo systemctl restart postgresql
sudo systemctl status postgresql
```

**2. Verifica Configurazione**
```bash
# Controlla postgresql.conf
sudo nano /etc/postgresql/14/main/postgresql.conf

# Verifica pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Ricarica configurazione
sudo systemctl reload postgresql
```

**3. Ottimizzazione Database**
```sql
-- Connetti al database
psql -d document_system

-- Analizza performance
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY total_time DESC LIMIT 10;

-- Vacuum e analyze
VACUUM ANALYZE;

-- Reindex se necessario
REINDEX DATABASE document_system;
```

### Memoria Insufficiente

#### Sintomi
- Applicazione lenta
- Errori "Out of Memory"
- Server non risponde

#### Diagnosi
```bash
# Utilizzo memoria
free -h
top -o %MEM

# Processi che consumano più memoria
ps aux --sort=-%mem | head -10

# Memoria swap
swapon -s
```

#### Soluzioni

**1. Liberare Memoria**
```bash
# Pulisci cache sistema
sudo sync && sudo sysctl vm.drop_caches=3

# Riavvia servizi pesanti
sudo systemctl restart document-system
sudo systemctl restart postgresql
```

**2. Ottimizzazione Configurazione**
```bash
# Riduci worker processes Node.js
# Nel file ecosystem.config.js
instances: 2  # Riduci da 4 a 2

# Ottimizza PostgreSQL
# In postgresql.conf
shared_buffers = 256MB      # Riduci se necessario
work_mem = 4MB             # Riduci da default
maintenance_work_mem = 64MB # Riduci se necessario
```

**3. Aggiungere Swap**
```bash
# Crea file swap da 2GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Rendi permanente
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## ⚠️ Problemi Comuni

### Upload Documenti Fallisce

#### Sintomi
- Upload si blocca al 50-90%
- Errore "File too large"
- Timeout durante upload

#### Diagnosi
```bash
# Verifica spazio disco
df -h /var/uploads

# Verifica permessi cartella upload
ls -la /var/uploads

# Log upload
grep "UPLOAD" /var/log/document-system/app.log | tail -20

# Verifica configurazione Nginx
grep -E "client_max_body_size|proxy_read_timeout" /etc/nginx/sites-available/document-system
```

#### Soluzioni

**1. Aumentare Limiti Upload**
```nginx
# In /etc/nginx/sites-available/document-system
client_max_body_size 50M;
proxy_read_timeout 300s;
proxy_send_timeout 300s;
```

**2. Configurazione Node.js**
```javascript
// Nel server Express
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Timeout multer
const upload = multer({
  dest: '/var/uploads',
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});
```

**3. Verifica Spazio e Permessi**
```bash
# Libera spazio se necessario
sudo find /var/uploads -name "*.tmp" -mtime +1 -delete

# Correggi permessi
sudo chown -R www-data:www-data /var/uploads
sudo chmod -R 755 /var/uploads
```

### Ricerca Non Funziona

#### Sintomi
- Nessun risultato per query valide
- Ricerca molto lenta
- Errori di timeout

#### Diagnosi
```bash
# Verifica indici database
psql -d document_system -c "\di"

# Statistiche ricerca
psql -d document_system -c "
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE tablename IN ('documents', 'document_content');"

# Log query lente
grep "slow query" /var/log/postgresql/postgresql-*.log
```

#### Soluzioni

**1. Ricostruzione Indici**
```sql
-- Connetti al database
psql -d document_system

-- Ricostruisci indici full-text
REINDEX INDEX documents_content_search_idx;
REINDEX INDEX documents_title_search_idx;

-- Aggiorna statistiche
ANALYZE documents;
ANALYZE document_content;
```

**2. Ottimizzazione Query**
```sql
-- Verifica piano di esecuzione
EXPLAIN ANALYZE 
SELECT * FROM documents 
WHERE to_tsvector('italian', title || ' ' || content) @@ plainto_tsquery('italian', 'test');

-- Crea indici mancanti se necessario
CREATE INDEX CONCURRENTLY idx_documents_created_at ON documents(created_at);
CREATE INDEX CONCURRENTLY idx_documents_tenant_id ON documents(tenant_id);
```

**3. Cache Ricerca**
```bash
# Pulisci cache Redis
redis-cli FLUSHDB

# Verifica configurazione cache
redis-cli CONFIG GET maxmemory
redis-cli CONFIG GET maxmemory-policy
```

### Login Non Funziona

#### Sintomi
- Credenziali corrette rifiutate
- Redirect loop
- Sessione scade immediatamente

#### Diagnosi
```bash
# Log autenticazione
grep "AUTH" /var/log/document-system/app.log | tail -20

# Verifica JWT secret
grep "JWT_SECRET" /etc/document-system/.env

# Sessioni Redis
redis-cli KEYS "sess:*" | wc -l

# Verifica database utenti
psql -d document_system -c "SELECT id, email, is_active FROM users WHERE email = 'user@example.com';"
```

#### Soluzioni

**1. Reset Password Utente**
```sql
-- Connetti al database
psql -d document_system

-- Reset password (hash per 'password123')
UPDATE users 
SET password_hash = '$2b$10$rQZ8kJQy5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5'
WHERE email = 'user@example.com';

-- Attiva account se disabilitato
UPDATE users SET is_active = true WHERE email = 'user@example.com';
```

**2. Verifica Configurazione JWT**
```bash
# Controlla variabili ambiente
cat /etc/document-system/.env | grep JWT

# Rigenera JWT secret se necessario
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Riavvia servizio dopo modifica
sudo systemctl restart document-system
```

**3. Pulisci Sessioni**
```bash
# Pulisci tutte le sessioni Redis
redis-cli FLUSHDB

# Riavvia Redis
sudo systemctl restart redis
```

### Performance Lente

#### Sintomi
- Caricamento pagine lento
- Timeout operazioni
- Alta latenza API

#### Diagnosi
```bash
# Monitoraggio risorse
top -p $(pgrep -d',' node)
iotop -o

# Connessioni database
psql -d document_system -c "
SELECT count(*), state 
FROM pg_stat_activity 
GROUP BY state;"

# Cache hit rate
redis-cli INFO stats | grep keyspace

# Log performance
grep "slow" /var/log/document-system/app.log
```

#### Soluzioni

**1. Ottimizzazione Database**
```sql
-- Query lente
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements 
ORDER BY total_time DESC LIMIT 5;

-- Vacuum automatico
SELECT schemaname, tablename, last_vacuum, last_autovacuum
FROM pg_stat_user_tables;

-- Forza vacuum se necessario
VACUUM ANALYZE;
```

**2. Ottimizzazione Cache**
```bash
# Aumenta memoria Redis
# In /etc/redis/redis.conf
maxmemory 512mb
maxmemory-policy allkeys-lru

# Riavvia Redis
sudo systemctl restart redis
```

**3. Ottimizzazione Node.js**
```javascript
// Aumenta worker processes
// In ecosystem.config.js
module.exports = {
  apps: [{
    name: 'document-api',
    script: './dist/server.js',
    instances: 'max', // Usa tutti i core CPU
    exec_mode: 'cluster'
  }]
};
```

## 🔧 Problemi di Configurazione

### SSL/TLS Issues

#### Sintomi
- Certificato scaduto
- Errori SSL nel browser
- Mixed content warnings

#### Diagnosi
```bash
# Verifica certificato
openssl x509 -in /etc/ssl/certs/document-system.crt -text -noout

# Test connessione SSL
openssl s_client -connect yourdomain.com:443

# Verifica configurazione Nginx
nginx -t
```

#### Soluzioni

**1. Rinnovo Certificato Let's Encrypt**
```bash
# Rinnovo manuale
sudo certbot renew --nginx

# Verifica auto-renewal
sudo systemctl status certbot.timer

# Test rinnovo
sudo certbot renew --dry-run
```

**2. Configurazione Nginx SSL**
```nginx
# In /etc/nginx/sites-available/document-system
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    add_header Strict-Transport-Security "max-age=63072000" always;
}
```

### Email Non Inviate

#### Sintomi
- Notifiche email non arrivano
- Errori SMTP nei log
- Reset password non funziona

#### Diagnosi
```bash
# Log email
grep "EMAIL" /var/log/document-system/app.log

# Test connessione SMTP
telnet smtp.gmail.com 587

# Verifica configurazione
grep "SMTP" /etc/document-system/.env
```

#### Soluzioni

**1. Configurazione SMTP**
```bash
# Verifica credenziali in .env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**2. Test Invio Email**
```javascript
// Script test email
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
});

transporter.sendMail({
  from: 'your-email@gmail.com',
  to: 'test@example.com',
  subject: 'Test Email',
  text: 'Test message'
}).then(console.log).catch(console.error);
```

### Backup Falliti

#### Sintomi
- Backup non completati
- Errori di spazio
- File corrotti

#### Diagnosi
```bash
# Log backup
grep "BACKUP" /var/log/document-system/app.log

# Verifica spazio destinazione
df -h /var/backups

# Verifica ultimo backup
ls -la /var/backups/ | head -10

# Test integrità backup
pg_restore --list /var/backups/latest.sql
```

#### Soluzioni

**1. Pulizia Backup Vecchi**
```bash
# Rimuovi backup più vecchi di 30 giorni
find /var/backups -name "*.sql" -mtime +30 -delete
find /var/backups -name "*.tar.gz" -mtime +30 -delete
```

**2. Script Backup Migliorato**
```bash
#!/bin/bash
# /usr/local/bin/backup-system.sh

BACKUP_DIR="/var/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="document_system"

# Backup database
pg_dump $DB_NAME | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Backup files
tar -czf "$BACKUP_DIR/files_$DATE.tar.gz" /var/uploads

# Verifica integrità
if [ $? -eq 0 ]; then
    echo "Backup completed successfully: $DATE"
else
    echo "Backup failed: $DATE" >&2
    exit 1
fi

# Pulizia backup vecchi
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
```

## 🔍 Strumenti di Diagnostica

### Script Diagnostica Automatica

```bash
#!/bin/bash
# /usr/local/bin/system-check.sh

echo "=== Document System Health Check ==="
echo "Date: $(date)"
echo

# Verifica servizi
echo "=== Services Status ==="
for service in document-system nginx postgresql redis; do
    if systemctl is-active --quiet $service; then
        echo "✅ $service: Running"
    else
        echo "❌ $service: Stopped"
    fi
done
echo

# Verifica risorse
echo "=== System Resources ==="
echo "CPU Usage: $(top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1)%"
echo "Memory Usage: $(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')"
echo "Disk Usage: $(df -h / | awk 'NR==2{print $5}')"
echo

# Verifica database
echo "=== Database Status ==="
if psql -d document_system -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ Database: Connected"
    echo "Active Connections: $(psql -d document_system -t -c "SELECT count(*) FROM pg_stat_activity;" | xargs)"
else
    echo "❌ Database: Connection failed"
fi
echo

# Verifica cache
echo "=== Cache Status ==="
if redis-cli ping >/dev/null 2>&1; then
    echo "✅ Redis: Connected"
    echo "Memory Usage: $(redis-cli INFO memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')"
else
    echo "❌ Redis: Connection failed"
fi
echo

# Verifica log errori recenti
echo "=== Recent Errors ==="
ERROR_COUNT=$(grep -c "ERROR" /var/log/document-system/error.log 2>/dev/null || echo "0")
echo "Errors in last 24h: $ERROR_COUNT"
if [ $ERROR_COUNT -gt 0 ]; then
    echo "Latest errors:"
    tail -5 /var/log/document-system/error.log
fi
echo

echo "=== Health Check Complete ==="
```

### Monitoraggio Continuo

```bash
#!/bin/bash
# /usr/local/bin/monitor-system.sh

while true; do
    # CPU e Memoria
    CPU=$(top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1)
    MEM=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    
    # Alert se CPU > 80% o Memoria > 90%
    if (( $(echo "$CPU > 80" | bc -l) )); then
        echo "$(date): HIGH CPU USAGE: ${CPU}%" >> /var/log/alerts.log
    fi
    
    if (( $(echo "$MEM > 90" | bc -l) )); then
        echo "$(date): HIGH MEMORY USAGE: ${MEM}%" >> /var/log/alerts.log
    fi
    
    # Verifica servizi critici
    for service in document-system postgresql redis; do
        if ! systemctl is-active --quiet $service; then
            echo "$(date): SERVICE DOWN: $service" >> /var/log/alerts.log
            # Tentativo riavvio automatico
            systemctl restart $service
        fi
    done
    
    sleep 60
done
```

## 📞 Escalation e Supporto

### Quando Escalare

#### Problemi Critici (Escalation Immediata)
- Sistema completamente inaccessibile > 15 minuti
- Perdita di dati
- Violazioni di sicurezza
- Corruzione database

#### Problemi Gravi (Escalation entro 2 ore)
- Performance degradate > 50%
- Funzionalità principali non disponibili
- Errori diffusi per più utenti

#### Problemi Minori (Escalation entro 24 ore)
- Problemi singoli utenti
- Funzionalità secondarie non disponibili
- Performance leggermente degradate

### Informazioni da Raccogliere

#### Per Ogni Segnalazione
1. **Timestamp** esatto del problema
2. **Utenti coinvolti** (numero e dettagli)
3. **Azioni che hanno scatenato** il problema
4. **Messaggi di errore** esatti
5. **Screenshot** se applicabili
6. **Log rilevanti** (ultimi 30 minuti)

#### Comandi Raccolta Log
```bash
# Crea pacchetto diagnostico
mkdir -p /tmp/diagnostic-$(date +%Y%m%d_%H%M%S)
cd /tmp/diagnostic-$(date +%Y%m%d_%H%M%S)

# Copia log
cp /var/log/document-system/*.log .
cp /var/log/nginx/*.log .
cp /var/log/postgresql/*.log .

# Info sistema
systemctl status document-system > system-status.txt
df -h > disk-usage.txt
free -h > memory-usage.txt
top -bn1 > process-list.txt

# Crea archivio
cd ..
tar -czf diagnostic-$(date +%Y%m%d_%H%M%S).tar.gz diagnostic-$(date +%Y%m%d_%H%M%S)/
```

### Contatti Supporto

#### Livello 1 - Supporto Tecnico
- **Email:** support@yourdomain.com
- **Telefono:** +39 02 1234 5678
- **Orari:** Lun-Ven 9:00-18:00

#### Livello 2 - Supporto Avanzato
- **Email:** advanced-support@yourdomain.com
- **Telefono:** +39 02 1234 5679
- **Orari:** Lun-Ven 8:00-20:00

#### Livello 3 - Emergenze
- **Telefono:** +39 333 123 4567
- **Orari:** 24/7
- **Solo per:** Sistemi down, perdita dati, sicurezza

---

**Precedente:** [Admin Manual](../user/admin-manual.md)  
**Prossimo:** [FAQ](faq.md)  
**Correlato:** [Deployment Guide](../deployment/deployment-guide.md)

---

*Questa guida è aggiornata alla versione 1.0 del sistema. Per problemi non coperti, contatta il supporto tecnico.*