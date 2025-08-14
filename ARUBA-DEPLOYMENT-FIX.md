# 🚀 Guida Risoluzione Deployment Aruba Cloud

## 📋 Problema Identificato

Dai log forniti, il problema principale è:

**Errore Prisma P1012**: `the URL must start with the protocol 'postgresql://' or 'postgres://'`

Questo indica che il `DATABASE_URL` nel file `backend/.env` non ha il formato corretto.

## 🔧 Soluzione Automatica

### Passo 1: Accesso SSH ad Aruba Cloud

1. Accedi al **pannello Aruba Cloud**
2. Vai alla sezione **Environment** → **Project 2.0**
3. Clicca su **SSH Access** o **Web SSH**
4. Accedi al terminale del server

### Passo 2: Caricamento Script di Risoluzione

```bash
# Naviga nella directory del progetto
cd /var/www/webroot/ROOT

# Scarica lo script di risoluzione dal repository GitHub
wget https://raw.githubusercontent.com/Matteonic94/ElementMedica/main/aruba-fix-deployment.sh

# Oppure crea il file manualmente (se wget non funziona)
nano aruba-fix-deployment.sh
# Copia il contenuto dello script dal file locale
```

### Passo 3: Esecuzione Script

```bash
# Rendi eseguibile lo script
chmod +x aruba-fix-deployment.sh

# Esegui lo script
./aruba-fix-deployment.sh
```

## 🔍 Risoluzione Manuale (Se lo script non funziona)

### 1. Verifica e Correzione DATABASE_URL

```bash
cd /var/www/webroot/ROOT/backend

# Controlla il contenuto del file .env
cat .env | grep DATABASE_URL

# Se il formato è errato, correggi manualmente
nano .env
```

**Formato corretto DATABASE_URL:**
```
DATABASE_URL="postgresql://username:password@host:port/database_name"
```

**Esempio:**
```
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/medicina_lavoro"
```

### 2. Reinstallazione Dipendenze

```bash
# Backend
cd /var/www/webroot/ROOT/backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd /var/www/webroot/ROOT
rm -rf node_modules package-lock.json
npm install
```

### 3. Configurazione Database

```bash
cd /var/www/webroot/ROOT/backend

# Genera Prisma Client
npx prisma generate

# Applica migrazioni
npx prisma migrate deploy

# Popola database (opzionale)
npx prisma db seed
```

### 4. Build Frontend

```bash
cd /var/www/webroot/ROOT
npm run build
```

### 5. Riavvio Servizi

```bash
# Stop processi esistenti
pm2 stop all
pm2 delete all

# Riavvia Redis
sudo systemctl restart redis

# Avvia API Server
cd /var/www/webroot/ROOT/backend
pm2 start servers/api-server.js --name "api-server" --watch

# Avvia Proxy Server
pm2 start servers/proxy-server.js --name "proxy-server" --watch

# Riavvia Nginx
sudo systemctl restart nginx
```

## 🧪 Test Funzionamento

```bash
# Test API Server
curl http://localhost:4001/health

# Test Proxy Server
curl http://localhost:4003/health

# Verifica stato PM2
pm2 status

# Test applicazione esterna
curl http://env-4956838.it1.eur.aruba.jenv-aruba.cloud/
```

## 📊 Monitoraggio

### Log PM2
```bash
# Tutti i log
pm2 logs

# Log specifici
pm2 logs api-server
pm2 logs proxy-server
```

### Log Nginx
```bash
# Log errori
sudo tail -f /var/log/nginx/error.log

# Log accessi
sudo tail -f /var/log/nginx/access.log
```

### Stato Servizi
```bash
# Redis
sudo systemctl status redis

# Nginx
sudo systemctl status nginx

# Processi Node.js
ps aux | grep node
```

## ⚠️ Problemi Comuni e Soluzioni

### 1. DATABASE_URL ancora errato

**Sintomo**: Errore P1012 persiste

**Soluzione**:
```bash
# Verifica formato esatto
echo $DATABASE_URL

# Correggi manualmente in .env
nano backend/.env
```

### 2. Porte occupate

**Sintomo**: Errore "port already in use"

**Soluzione**:
```bash
# Trova processi sulle porte 4001 e 4003
sudo netstat -tlnp | grep -E ':(4001|4003)'

# Termina processi se necessario
sudo kill -9 <PID>
```

### 3. Permessi file

**Sintomo**: Errori di accesso ai file

**Soluzione**:
```bash
# Correggi permessi
sudo chown -R jelastic:jelastic /var/www/webroot/ROOT
sudo chmod -R 755 /var/www/webroot/ROOT
```

### 4. Redis non disponibile

**Sintomo**: Errori di connessione Redis

**Soluzione**:
```bash
# Installa/avvia Redis
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

## 📞 Supporto

Se i problemi persistono:

1. **Raccogli log completi**:
   ```bash
   pm2 logs > pm2-logs.txt
   sudo tail -100 /var/log/nginx/error.log > nginx-error.txt
   ```

2. **Verifica configurazione**:
   ```bash
   cat backend/.env | grep -v PASSWORD > config-check.txt
   pm2 status > pm2-status.txt
   ```

3. **Condividi informazioni**:
   - Log PM2
   - Log Nginx
   - Configurazione (senza password)
   - Output `pm2 status`

## ✅ Checklist Post-Risoluzione

- [ ] DATABASE_URL ha formato corretto (`postgresql://...`)
- [ ] Dipendenze installate senza errori
- [ ] Prisma Client generato
- [ ] Migrazioni applicate
- [ ] Frontend compilato
- [ ] API Server in esecuzione (porta 4001)
- [ ] Proxy Server in esecuzione (porta 4003)
- [ ] Nginx attivo
- [ ] Redis funzionante
- [ ] Test HTTP 200 su tutti gli endpoint
- [ ] Applicazione accessibile dall'esterno

---

**Nota**: Questo documento è specifico per il deployment su Aruba Cloud del Project 2.0 - Sistema Medicina del Lavoro.