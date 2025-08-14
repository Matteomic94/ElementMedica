# 🚀 Guida Deployment su Aruba Cloud

## Panoramica

Questa guida descrive come deployare **Project 2.0 - Sistema Medicina del Lavoro** su Aruba Cloud utilizzando i manifest JPS (Jelastic Packaging Standard) per un deployment automatico completo.

## 📋 Prerequisiti

### Account Aruba Cloud
- Account attivo su [Aruba Cloud](https://www.arubacloud.it/)
- Accesso al pannello di controllo Virtuozzo Application Platform
- Crediti sufficienti per l'ambiente di produzione

### Risorse Minime Consigliate
- **Database PostgreSQL**: 16 cloudlets (2GB RAM)
- **Cache Redis**: 8 cloudlets (1GB RAM)
- **Backend Node.js**: 32 cloudlets (4GB RAM)
- **Load Balancer Nginx**: 16 cloudlets (2GB RAM)
- **Totale**: ~72 cloudlets (9GB RAM)

## 📁 File di Deployment

Il progetto include due manifest per il deployment automatico:

1. **`aruba-deployment.jps`** - Formato JSON
2. **`aruba-deployment.yaml`** - Formato YAML

Entrambi i file contengono la stessa configurazione, scegli il formato che preferisci.

## 🔧 Architettura del Deployment

### Componenti Installati

```
┌─────────────────┐    ┌─────────────────┐
│  Load Balancer  │    │   PostgreSQL    │
│     (Nginx)     │    │    Database     │
│   Port 80/443   │    │    Port 5432    │
└─────────────────┘    └─────────────────┘
         │                       │
         │              ┌─────────────────┐
         │              │      Redis      │
         │              │      Cache      │
         │              │    Port 6379    │
         │              └─────────────────┘
         │                       │
┌─────────────────┐              │
│   Backend API   │──────────────┘
│    (Node.js)    │
│  Port 4001/4003 │
└─────────────────┘
```

### Servizi Configurati

- **API Server**: Porta 4001 (cluster mode con PM2)
- **Proxy Server**: Porta 4003 (gestione CORS e routing)
- **Database**: PostgreSQL 13 con estensioni UUID e pgcrypto
- **Cache**: Redis 7 per sessioni e performance
- **Load Balancer**: Nginx con SSL automatico (Let's Encrypt)

## 🚀 Procedura di Deployment

### Metodo 1: Import da URL (Consigliato)

1. **Accedi al pannello Aruba Cloud**
   - Vai su [https://www.arubacloud.it/](https://www.arubacloud.it/)
   - Accedi al tuo account
   - Seleziona "Virtuozzo Application Platform"

2. **Crea nuovo ambiente**
   - Clicca su "Import"
   - Seleziona "From URL"
   - Inserisci l'URL del manifest:
     ```
     https://raw.githubusercontent.com/your-repo/project-2-0/main/aruba-deployment.jps
     ```

3. **Configura l'ambiente**
   - **Environment Name**: `project-2-0-prod`
   - **Region**: Seleziona la regione preferita
   - **Domain**: Inserisci il tuo dominio (es. `medicina-lavoro.tuodominio.it`)

4. **Avvia l'installazione**
   - Clicca "Install"
   - Attendi il completamento (circa 10-15 minuti)

### Metodo 2: Upload File Locale

1. **Prepara il manifest**
   - Scarica `aruba-deployment.jps` o `aruba-deployment.yaml`
   - Modifica l'URL del repository se necessario

2. **Upload nel pannello**
   - Vai su "Import" → "Upload"
   - Seleziona il file manifest
   - Segui la procedura come nel Metodo 1

## ⚙️ Configurazioni Personalizzate

### Modifica Repository

Se il tuo codice è in un repository privato o diverso, modifica questa riga nel manifest:

```json
"git clone https://github.com/your-repo/project-2-0.git ."
```

Sostituisci con:

```json
"git clone https://github.com/TUO-USERNAME/TUO-REPO.git ."
```

### Variabili d'Ambiente Personalizzate

Puoi aggiungere variabili d'ambiente personalizzate nella sezione `env` del nodo `cp`:

```json
"env": {
  "NODE_ENV": "production",
  "CUSTOM_VAR": "your-value",
  "API_TIMEOUT": "30000"
}
```

### Configurazione SSL Personalizzata

Per utilizzare un certificato SSL personalizzato invece di Let's Encrypt, rimuovi questa sezione:

```json
{
  "installAddon": {
    "id": "letsencrypt-ssl-addon",
    "nodeGroup": "bl",
    "settings": {
      "customDomains": "${globals.APP_DOMAIN}"
    }
  }
}
```

## 📊 Post-Deployment

### Verifica Installazione

1. **Controlla i servizi**
   ```bash
   # Connettiti al nodo backend
   pm2 status
   pm2 logs
   ```

2. **Test endpoint**
   ```bash
   curl https://tuo-dominio.it/health
   curl https://tuo-dominio.it/api/health
   ```

3. **Verifica database**
   ```bash
   # Connettiti al nodo database
   psql -U project_user -d training_platform -c "\dt"
   ```

### Accesso Amministratore

Dopo l'installazione riceverai via email:
- **URL**: `https://tuo-dominio.it`
- **Email Admin**: `admin@tuo-dominio.it`
- **Password**: Generata automaticamente

### Configurazione DNS

Configura il tuo DNS per puntare al load balancer:

```
A     medicina-lavoro.tuodominio.it    95.110.179.125
CNAME www.medicina-lavoro.tuodominio.it medicina-lavoro.tuodominio.it
```

## 🔧 Gestione e Manutenzione

### Monitoraggio

```bash
# Status generale
pm2 status

# Monitoraggio real-time
pm2 monit

# Logs applicazione
pm2 logs api-server
pm2 logs proxy-server

# Logs sistema
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Backup Database

```bash
# Backup completo
pg_dump -U project_user -h localhost training_platform > backup_$(date +%Y%m%d).sql

# Backup con compressione
pg_dump -U project_user -h localhost training_platform | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Aggiornamenti

```bash
# Aggiorna codice
cd /var/www/webroot/ROOT
git pull origin main
npm install
cd backend && npm install

# Aggiorna database
cd backend
npx prisma migrate deploy

# Rebuild frontend
cd ..
npm run build

# Riavvia servizi
pm2 restart all
```

### Scaling

Per aumentare le performance:

1. **Scala il backend**
   - Aumenta i cloudlets del nodo `cp`
   - Aggiungi più istanze PM2

2. **Scala il database**
   - Aumenta i cloudlets del nodo `sqldb`
   - Configura read replicas se necessario

3. **Aggiungi nodi**
   - Duplica il nodo backend per load balancing
   - Configura cluster Redis per alta disponibilità

## 🚨 Troubleshooting

### Problemi Comuni

#### 1. Errore 502 Bad Gateway
```bash
# Verifica status backend
pm2 status

# Riavvia se necessario
pm2 restart all

# Controlla logs
pm2 logs
```

#### 2. Database Connection Error
```bash
# Verifica connessione
psql -U project_user -h localhost -d training_platform

# Controlla variabili ambiente
cat /var/www/webroot/ROOT/.env | grep DATABASE_URL
```

#### 3. SSL Certificate Issues
```bash
# Rinnova certificato Let's Encrypt
certbot renew

# Riavvia Nginx
systemctl restart nginx
```

### Log Files

- **Application**: `/var/www/webroot/ROOT/logs/`
- **Nginx**: `/var/log/nginx/`
- **PostgreSQL**: `/var/log/postgresql/`
- **System**: `/var/log/syslog`

## 📞 Supporto

### Documentazione Aruba
- [Virtuozzo Application Platform Docs](https://www.virtuozzo.com/application-platform-docs/)
- [JPS Packaging Standard](https://docs.jelastic.com/jps/)

### Supporto Tecnico
- **Aruba Cloud**: [Supporto Tecnico](https://www.arubacloud.it/supporto)
- **Project 2.0**: Consulta la documentazione nel repository

## 🔐 Sicurezza

### Best Practices Implementate

- ✅ **SSL/TLS**: Certificati automatici Let's Encrypt
- ✅ **Firewall**: Porte esposte solo quelle necessarie
- ✅ **Headers Security**: Configurati in Nginx
- ✅ **Database**: Accesso limitato alla rete interna
- ✅ **Passwords**: Generate automaticamente e sicure
- ✅ **CORS**: Configurato correttamente
- ✅ **Rate Limiting**: Implementato nel proxy

### Raccomandazioni Post-Deploy

1. **Cambia password admin** al primo accesso
2. **Configura backup automatici** del database
3. **Monitora logs** per attività sospette
4. **Aggiorna regolarmente** dipendenze e sistema
5. **Configura alerting** per downtime

---

**Nota**: Questa guida è specifica per Aruba Cloud. Per altri provider cloud, adatta le configurazioni di rete e DNS di conseguenza.