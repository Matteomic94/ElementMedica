# 🚀 Project 2.0 - Deployment Guide

## Deployment Automatico su Aruba Cloud

Questo progetto include manifest JPS per il deployment automatico su **Aruba Cloud** utilizzando la piattaforma Virtuozzo.

### 📁 File di Deployment

| File | Formato | Descrizione |
|------|---------|-------------|
| `aruba-deployment.jps` | JSON | Manifest JPS in formato JSON |
| `aruba-deployment.yaml` | YAML | Manifest JPS in formato YAML |
| `docs/deployment/aruba-cloud-deployment.md` | Markdown | Guida completa al deployment |

### 🚀 Quick Start

#### Opzione 1: Import da URL
1. Accedi al pannello Aruba Cloud
2. Vai su **Import** → **From URL**
3. Inserisci: `https://raw.githubusercontent.com/your-repo/project-2-0/main/aruba-deployment.jps`
4. Configura dominio e avvia l'installazione

#### Opzione 2: Upload File
1. Scarica `aruba-deployment.jps` o `aruba-deployment.yaml`
2. Accedi al pannello Aruba Cloud
3. Vai su **Import** → **Upload**
4. Seleziona il file e procedi con l'installazione

### 🏗️ Architettura Deployata

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

### 📊 Risorse Allocate

| Componente | Cloudlets | RAM | Descrizione |
|------------|-----------|-----|-------------|
| PostgreSQL | 16 | 2GB | Database principale |
| Redis | 8 | 1GB | Cache e sessioni |
| Node.js Backend | 32 | 4GB | API Server + Proxy |
| Nginx Load Balancer | 16 | 2GB | Reverse proxy + SSL |
| **Totale** | **72** | **9GB** | |

### 🔧 Servizi Configurati

- ✅ **API Server**: Porta 4001 (cluster mode con PM2)
- ✅ **Proxy Server**: Porta 4003 (CORS e routing)
- ✅ **Database**: PostgreSQL 13 con estensioni UUID
- ✅ **Cache**: Redis 7 per performance
- ✅ **SSL**: Certificati automatici Let's Encrypt
- ✅ **Monitoring**: PM2 con logs centralizzati
- ✅ **Security**: Headers di sicurezza configurati

### 🎯 Caratteristiche del Sistema

#### Backend
- 🔐 **Autenticazione**: JWT + Session management
- 👥 **Gestione Utenti**: Sistema ruoli avanzato
- 🏢 **Multi-tenant**: Gestione aziende e sedi
- 📚 **Corsi**: Sistema formazione completo
- 📄 **Documenti**: Upload e gestione file
- 🛡️ **GDPR**: Conformità completa implementata
- 📊 **Audit Trail**: Tracciamento completo azioni

#### Frontend
- ⚛️ **React 18**: Con TypeScript
- 🎨 **UI Moderna**: Componenti responsive
- 📱 **Mobile-First**: Design adattivo
- 🔍 **Ricerca Avanzata**: Filtri e ordinamento
- 📊 **Dashboard**: Visualizzazioni dati
- 🌙 **Dark Mode**: Supporto tema scuro

#### Sicurezza
- 🔒 **HTTPS**: SSL automatico
- 🛡️ **CORS**: Configurazione sicura
- 🚫 **Rate Limiting**: Protezione DDoS
- 🔐 **Encryption**: Dati sensibili crittografati
- 📝 **Audit Logs**: Tracciamento accessi

### 📋 Credenziali Post-Deploy

Dopo l'installazione riceverai via email:
- **URL Applicazione**: `https://tuo-dominio.it`
- **Email Admin**: `admin@tuo-dominio.it`
- **Password Admin**: Generata automaticamente
- **Database**: Credenziali per accesso diretto

### 🔧 Gestione Post-Deploy

#### Monitoraggio
```bash
# Status servizi
pm2 status

# Logs real-time
pm2 logs

# Monitoraggio risorse
pm2 monit
```

#### Backup Database
```bash
# Backup giornaliero
pg_dump -U project_user training_platform > backup_$(date +%Y%m%d).sql
```

#### Aggiornamenti
```bash
# Aggiorna codice
git pull origin main
npm install && cd backend && npm install

# Aggiorna database
npx prisma migrate deploy

# Rebuild e restart
npm run build && pm2 restart all
```

### 📚 Documentazione Completa

Per informazioni dettagliate, consulta:
- 📖 [Guida Deployment Aruba Cloud](docs/deployment/aruba-cloud-deployment.md)
- 🏗️ [Architettura Sistema](docs/technical/architecture/)
- 🔧 [Configurazione Backend](docs/technical/api/)
- 🎨 [Documentazione Frontend](docs/technical/frontend/)
- 🛡️ [Sicurezza e GDPR](docs/technical/security/)

### 🆘 Supporto

#### Troubleshooting Rapido

| Problema | Soluzione |
|----------|----------|
| 502 Bad Gateway | `pm2 restart all` |
| Database Error | Verifica `DATABASE_URL` in `.env` |
| SSL Issues | `certbot renew && systemctl restart nginx` |
| Performance | Aumenta cloudlets o aggiungi nodi |

#### Contatti
- 📧 **Supporto Tecnico**: Consulta documentazione repository
- 🌐 **Aruba Cloud**: [Supporto ufficiale](https://www.arubacloud.it/supporto)
- 📖 **Virtuozzo Docs**: [Documentazione piattaforma](https://www.virtuozzo.com/application-platform-docs/)

### 🔄 Versioning

- **v1.0.0**: Release iniziale con deployment automatico
- **Compatibilità**: Aruba Cloud Virtuozzo Platform
- **Node.js**: 20.x LTS
- **PostgreSQL**: 13.x
- **Redis**: 7.x

---

**🎉 Pronto per il deployment!** Scegli il metodo che preferisci e in pochi minuti avrai il tuo sistema completo online su Aruba Cloud.

> **Nota**: Assicurati di avere crediti sufficienti sul tuo account Aruba Cloud prima di iniziare il deployment. Il costo stimato è di circa 70-80 cloudlets per un ambiente di produzione completo.