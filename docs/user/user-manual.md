# User Manual

**Versione:** 1.0  
**Data:** 27 Gennaio 2025  
**Autore:** Team Development

## 📋 Panoramica

Benvenuto nel Sistema di Gestione Documenti! Questo manuale ti guiderà attraverso tutte le funzionalità disponibili per gestire i tuoi documenti in modo efficiente e sicuro.

## 🚀 Primi Passi

### Accesso al Sistema

1. **Apertura dell'applicazione**
   - Apri il browser web
   - Naviga all'indirizzo fornito dal tuo amministratore
   - Vedrai la schermata di login

2. **Login**
   - Inserisci la tua email
   - Inserisci la password
   - Clicca su "Accedi"
   - Se è la prima volta, potresti dover cambiare la password temporanea

3. **Dashboard principale**
   - Dopo il login, vedrai la dashboard con:
     - Documenti recenti
     - Statistiche di utilizzo
     - Notifiche importanti
     - Accesso rapido alle funzioni principali

### Interfaccia Utente

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] Sistema Gestione Documenti    [🔔] [👤] [⚙️] [🚪]    │
├─────────────────────────────────────────────────────────────┤
│ 📁 Documenti │ 🔍 Ricerca │ 📊 Dashboard │ ⚙️ Impostazioni │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Dashboard                                               │
│  ┌─────────────────┐  ┌─────────────────┐                 │
│  │ Documenti Recenti│  │ Statistiche     │                 │
│  │ • File1.pdf     │  │ 📄 125 documenti│                 │
│  │ • Report.docx   │  │ 📁 15 cartelle  │                 │
│  │ • Contratto.pdf │  │ 💾 2.5 GB usati │                 │
│  └─────────────────┘  └─────────────────┘                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Attività Recenti                                    │   │
│  │ • Mario ha caricato "Budget 2025.xlsx"             │   │
│  │ • Anna ha condiviso "Presentazione.pptx"           │   │
│  │ • Luca ha modificato "Relazione Q4.docx"           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Gestione Documenti

### Caricamento Documenti

#### Metodo 1: Drag & Drop
1. Vai alla sezione "Documenti"
2. Trascina i file dalla tua cartella direttamente nell'area di caricamento
3. I file verranno caricati automaticamente
4. Vedrai una barra di progresso per ogni file

#### Metodo 2: Pulsante Carica
1. Clicca sul pulsante "📤 Carica Documento"
2. Seleziona i file dal tuo computer
3. Aggiungi informazioni opzionali:
   - **Nome:** Nome personalizzato per il documento
   - **Descrizione:** Breve descrizione del contenuto
   - **Cartella:** Seleziona la cartella di destinazione
   - **Tag:** Aggiungi tag per facilitare la ricerca

#### Formati Supportati
- **Documenti:** PDF, DOC, DOCX, TXT, RTF
- **Fogli di calcolo:** XLS, XLSX, CSV
- **Presentazioni:** PPT, PPTX
- **Immagini:** JPG, PNG, GIF, SVG
- **Altri:** ZIP, RAR

#### Limiti di Caricamento
- **Dimensione massima per file:** 10 MB
- **Numero massimo di file simultanei:** 10
- **Spazio totale disponibile:** Varia in base al piano

### Organizzazione con Cartelle

#### Creazione Cartelle
1. Clicca su "📁 Nuova Cartella"
2. Inserisci il nome della cartella
3. Seleziona la cartella padre (opzionale)
4. Clicca "Crea"

#### Struttura Cartelle
```
📁 Documenti Aziendali
├── 📁 Amministrazione
│   ├── 📁 Contratti
│   ├── 📁 Fatture
│   └── 📁 Corrispondenza
├── 📁 Progetti
│   ├── 📁 Progetto Alpha
│   └── 📁 Progetto Beta
└── 📁 Risorse Umane
    ├── 📁 Curriculum
    └── 📁 Formazione
```

#### Spostamento Documenti
1. **Drag & Drop:** Trascina il documento nella cartella desiderata
2. **Menu contestuale:** 
   - Clicca destro sul documento
   - Seleziona "Sposta in..."
   - Scegli la cartella di destinazione

### Visualizzazione Documenti

#### Vista Lista
```
┌─────────────────────────────────────────────────────────────┐
│ Nome                │ Tipo │ Dimensione │ Modificato       │
├─────────────────────────────────────────────────────────────┤
│ 📄 Relazione Q4.pdf │ PDF  │ 2.3 MB     │ 25/01/2025 14:30│
│ 📊 Budget 2025.xlsx │ Excel│ 856 KB     │ 24/01/2025 09:15│
│ 📝 Note riunione.txt│ Testo│ 12 KB      │ 23/01/2025 16:45│
└─────────────────────────────────────────────────────────────┘
```

#### Vista Griglia
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ 📄          │ │ 📊          │ │ 📝          │
│ Relazione   │ │ Budget      │ │ Note        │
│ Q4.pdf      │ │ 2025.xlsx   │ │ riunione.txt│
│ 2.3 MB      │ │ 856 KB      │ │ 12 KB       │
└─────────────┘ └─────────────┘ └─────────────┘
```

#### Anteprima Documenti
- **PDF:** Visualizzazione diretta nel browser
- **Immagini:** Anteprima a dimensione reale
- **Documenti Office:** Anteprima con Google Docs Viewer
- **Testo:** Visualizzazione diretta del contenuto

### Gestione Versioni

#### Caricamento Nuova Versione
1. Clicca sul documento esistente
2. Seleziona "📤 Carica Nuova Versione"
3. Scegli il file aggiornato
4. Aggiungi note sulla versione (opzionale)
5. Clicca "Carica"

#### Cronologia Versioni
```
┌─────────────────────────────────────────────────────────────┐
│ Versioni di "Contratto_Servizi.pdf"                        │
├─────────────────────────────────────────────────────────────┤
│ v3.0 │ 27/01/2025 10:30 │ Mario R. │ Aggiornate clausole │
│ v2.1 │ 25/01/2025 14:15 │ Anna B.  │ Correzioni minori  │
│ v2.0 │ 20/01/2025 09:00 │ Luca M.  │ Revisione completa │
│ v1.0 │ 15/01/2025 16:30 │ Mario R. │ Versione iniziale  │
└─────────────────────────────────────────────────────────────┘
```

#### Ripristino Versione Precedente
1. Apri la cronologia versioni
2. Clicca su "🔄 Ripristina" accanto alla versione desiderata
3. Conferma l'operazione
4. La versione selezionata diventerà la versione corrente

## 🔍 Ricerca Documenti

### Ricerca Semplice
1. Utilizza la barra di ricerca in alto
2. Digita parole chiave:
   - Nome del file
   - Contenuto del documento
   - Tag associati
   - Nome dell'autore
3. Premi Invio o clicca sulla lente di ingrandimento

### Ricerca Avanzata

#### Filtri Disponibili
- **Tipo di file:** PDF, Word, Excel, PowerPoint, Immagini
- **Dimensione:** Piccoli (<1MB), Medi (1-10MB), Grandi (>10MB)
- **Data creazione:** Oggi, Ultima settimana, Ultimo mese, Personalizzato
- **Autore:** Seleziona da lista utenti
- **Cartella:** Cerca solo in cartelle specifiche
- **Tag:** Filtra per tag specifici

#### Operatori di Ricerca
- **"frase esatta"** - Cerca la frase esatta
- **parola1 AND parola2** - Entrambe le parole devono essere presenti
- **parola1 OR parola2** - Almeno una delle parole deve essere presente
- **-parola** - Esclude documenti contenenti questa parola
- **file:pdf** - Cerca solo file PDF
- **author:mario** - Cerca documenti creati da Mario

#### Esempi di Ricerca
```
"contratto servizi" AND 2025
budget OR bilancio -bozza
file:pdf author:anna
tag:importante size:>5MB
```

### Ricerca per Contenuto
Il sistema indicizza automaticamente il contenuto dei documenti:
- **PDF:** Estrae tutto il testo
- **Word/Excel/PowerPoint:** Indicizza contenuto e metadati
- **Immagini:** Utilizza OCR per estrarre testo (se abilitato)

## 🤝 Condivisione Documenti

### Condivisione Interna

#### Condivisione con Utenti
1. Seleziona il documento da condividere
2. Clicca su "🔗 Condividi"
3. Aggiungi utenti:
   - Digita nome o email
   - Seleziona dalla lista
   - Aggiungi più utenti se necessario
4. Imposta permessi:
   - **👁️ Visualizzazione:** Solo lettura
   - **✏️ Modifica:** Può modificare metadati e caricare nuove versioni
   - **🗑️ Eliminazione:** Può eliminare il documento
5. Imposta scadenza (opzionale)
6. Aggiungi messaggio (opzionale)
7. Clicca "Condividi"

#### Condivisione con Gruppi
1. Seleziona "👥 Condividi con Gruppo"
2. Scegli il gruppo dalla lista
3. Imposta permessi per il gruppo
4. Conferma la condivisione

### Link di Condivisione

#### Creazione Link Pubblico
1. Clicca su "🔗 Genera Link"
2. Configura opzioni:
   - **Scadenza:** Data/ora di scadenza
   - **Password:** Protezione con password (opzionale)
   - **Download:** Permetti download del file
   - **Visualizzazioni:** Limite numero di visualizzazioni
3. Copia il link generato
4. Condividi il link tramite email, chat, ecc.

#### Gestione Link Attivi
```
┌─────────────────────────────────────────────────────────────┐
│ Link Attivi                                                 │
├─────────────────────────────────────────────────────────────┤
│ 📄 Relazione_Q4.pdf                                        │
│ 🔗 https://app.com/share/abc123                            │
│ 👁️ 15 visualizzazioni │ ⏰ Scade: 30/01/2025             │
│ [📋 Copia] [⚙️ Modifica] [🗑️ Elimina]                      │
├─────────────────────────────────────────────────────────────┤
│ 📊 Budget_2025.xlsx                                        │
│ 🔗 https://app.com/share/def456                            │
│ 👁️ 3 visualizzazioni │ 🔒 Protetto da password           │
│ [📋 Copia] [⚙️ Modifica] [🗑️ Elimina]                      │
└─────────────────────────────────────────────────────────────┘
```

### Notifiche di Condivisione
Quando qualcuno condivide un documento con te:
1. Ricevi una notifica nell'app
2. Ricevi un'email (se abilitata)
3. Il documento appare nella sezione "📥 Condivisi con me"

## 🏷️ Tag e Metadati

### Gestione Tag

#### Aggiunta Tag
1. Seleziona il documento
2. Clicca su "🏷️ Gestisci Tag"
3. Aggiungi tag esistenti o crea nuovi:
   - Digita il nome del tag
   - Seleziona dalla lista di suggerimenti
   - Premi Invio per confermare
4. Salva le modifiche

#### Tag Predefiniti
- **📋 Categoria:** contratto, fattura, report, presentazione
- **⚡ Priorità:** urgente, importante, normale, bassa
- **📅 Stato:** bozza, revisione, approvato, archiviato
- **🎯 Progetto:** alpha, beta, marketing, vendite

#### Creazione Tag Personalizzati
1. Vai in "⚙️ Impostazioni" → "🏷️ Gestione Tag"
2. Clicca "➕ Nuovo Tag"
3. Inserisci:
   - **Nome:** Nome del tag
   - **Colore:** Scegli un colore identificativo
   - **Descrizione:** Breve descrizione dell'uso
4. Salva il nuovo tag

### Metadati Documenti

#### Informazioni Automatiche
- **Nome file originale**
- **Tipo MIME**
- **Dimensione**
- **Data creazione**
- **Data ultima modifica**
- **Checksum MD5**
- **Autore caricamento**

#### Metadati Personalizzati
1. Apri le proprietà del documento
2. Vai alla sezione "📝 Metadati Personalizzati"
3. Aggiungi campi:
   - **Cliente:** Nome del cliente
   - **Numero contratto:** Riferimento contratto
   - **Scadenza:** Data di scadenza
   - **Valore:** Valore economico
   - **Note:** Note aggiuntive

## ⚙️ Impostazioni Personali

### Profilo Utente

#### Informazioni Personali
1. Vai in "⚙️ Impostazioni" → "👤 Profilo"
2. Modifica informazioni:
   - **Nome**
   - **Cognome**
   - **Email** (solo visualizzazione)
   - **Telefono**
   - **Foto profilo**
3. Salva le modifiche

#### Cambio Password
1. Vai in "🔒 Sicurezza"
2. Clicca "🔑 Cambia Password"
3. Inserisci:
   - Password attuale
   - Nuova password
   - Conferma nuova password
4. La password deve rispettare i criteri:
   - Minimo 8 caratteri
   - Almeno una lettera maiuscola
   - Almeno una lettera minuscola
   - Almeno un numero
   - Almeno un carattere speciale

### Preferenze Interfaccia

#### Tema
- **🌞 Chiaro:** Tema con sfondo bianco
- **🌙 Scuro:** Tema con sfondo scuro
- **🔄 Automatico:** Segue le impostazioni del sistema

#### Lingua
- **🇮🇹 Italiano**
- **🇬🇧 English**
- **🇫🇷 Français**
- **🇩🇪 Deutsch**
- **🇪🇸 Español**

#### Layout Dashboard
1. Vai in "📊 Dashboard" → "⚙️ Personalizza"
2. Trascina i widget per riorganizzarli:
   - **📄 Documenti Recenti**
   - **📊 Statistiche Utilizzo**
   - **📈 Grafici Attività**
   - **📅 Calendario Scadenze**
   - **👥 Attività Team**
3. Ridimensiona i widget trascinando gli angoli
4. Nascondi widget non necessari

### Notifiche

#### Notifiche Email
- **📧 Documenti condivisi:** Quando qualcuno condivide un documento
- **📤 Caricamenti completati:** Conferma caricamento documenti
- **⏰ Scadenze:** Promemoria scadenze documenti
- **👥 Attività team:** Aggiornamenti attività colleghi
- **🔔 Notifiche sistema:** Manutenzioni e aggiornamenti

#### Notifiche Browser
- **🔔 Notifiche push:** Abilita notifiche desktop
- **🔊 Suoni:** Abilita suoni di notifica
- **⏰ Non disturbare:** Imposta orari di silenzio

#### Frequenza Digest
- **📧 Immediato:** Notifica per ogni evento
- **📅 Giornaliero:** Riassunto giornaliero
- **📅 Settimanale:** Riassunto settimanale
- **🔕 Mai:** Disabilita digest email

## 📊 Dashboard e Statistiche

### Widget Dashboard

#### Documenti Recenti
```
┌─────────────────────────────────────────────────────────────┐
│ 📄 Documenti Recenti                              [⚙️]      │
├─────────────────────────────────────────────────────────────┤
│ 📄 Contratto_Servizi_v3.pdf        │ 27/01 10:30 │ 2.3 MB │
│ 📊 Report_Vendite_Q4.xlsx          │ 26/01 14:15 │ 1.8 MB │
│ 📝 Note_Riunione_Board.docx        │ 25/01 09:45 │ 456 KB │
│ 📋 Checklist_Progetto.pdf          │ 24/01 16:20 │ 234 KB │
│ 🖼️ Logo_Aziendale_2025.png         │ 23/01 11:30 │ 89 KB  │
└─────────────────────────────────────────────────────────────┘
```

#### Statistiche Utilizzo
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Statistiche                                    [⚙️]      │
├─────────────────────────────────────────────────────────────┤
│ 📄 Documenti Totali        │ 1,247                          │
│ 📁 Cartelle                │ 89                             │
│ 💾 Spazio Utilizzato       │ 15.6 GB / 50 GB (31%)         │
│ 📤 Caricamenti Oggi        │ 12                             │
│ 👁️ Visualizzazioni Oggi    │ 156                            │
│ 🔗 Link Condivisi Attivi   │ 23                             │
└─────────────────────────────────────────────────────────────┘
```

#### Attività Team
```
┌─────────────────────────────────────────────────────────────┐
│ 👥 Attività Team                                  [⚙️]      │
├─────────────────────────────────────────────────────────────┤
│ 👤 Mario Rossi ha caricato "Budget_2025.xlsx"              │
│    📅 27/01/2025 10:15                                     │
│                                                             │
│ 👤 Anna Bianchi ha condiviso "Presentazione_Q4.pptx"       │
│    📅 27/01/2025 09:30                                     │
│                                                             │
│ 👤 Luca Verdi ha commentato "Relazione_Progetto.pdf"       │
│    📅 26/01/2025 16:45                                     │
└─────────────────────────────────────────────────────────────┘
```

### Report e Analytics

#### Report Utilizzo
1. Vai in "📊 Analytics" → "📈 Report Utilizzo"
2. Seleziona periodo:
   - Ultima settimana
   - Ultimo mese
   - Ultimo trimestre
   - Personalizzato
3. Visualizza metriche:
   - **Documenti caricati per giorno**
   - **Tipi di file più utilizzati**
   - **Utenti più attivi**
   - **Cartelle più popolari**
   - **Picchi di utilizzo**

#### Esportazione Report
1. Configura il report desiderato
2. Clicca "📤 Esporta"
3. Scegli formato:
   - **PDF:** Report formattato
   - **Excel:** Dati per analisi
   - **CSV:** Dati grezzi
4. Il file verrà scaricato automaticamente

## 🔒 Privacy e GDPR

### Gestione Consensi

#### Visualizzazione Consensi
1. Vai in "⚙️ Impostazioni" → "🔒 Privacy"
2. Visualizza stato consensi:
   - **📊 Analytics:** Raccolta dati di utilizzo
   - **📧 Marketing:** Comunicazioni promozionali
   - **🍪 Cookie tecnici:** Necessari per il funzionamento
   - **🍪 Cookie analytics:** Per migliorare l'esperienza

#### Modifica Consensi
1. Clicca sull'interruttore accanto al consenso
2. Conferma la modifica
3. Le modifiche sono immediate

### Diritti GDPR

#### Esportazione Dati
1. Vai in "🔒 Privacy" → "📤 Esporta i Miei Dati"
2. Seleziona dati da esportare:
   - **👤 Dati profilo**
   - **📄 Documenti caricati**
   - **📊 Log attività**
   - **🔗 Link condivisioni**
3. Clicca "📤 Richiedi Esportazione"
4. Riceverai un'email quando l'esportazione è pronta
5. Il file ZIP conterrà tutti i tuoi dati in formato JSON

#### Cancellazione Account
1. Vai in "🔒 Privacy" → "🗑️ Elimina Account"
2. **⚠️ ATTENZIONE:** Questa azione è irreversibile
3. Leggi le conseguenze:
   - Tutti i documenti verranno eliminati
   - Le condivisioni verranno revocate
   - I dati non potranno essere recuperati
4. Digita "ELIMINA" per confermare
5. Inserisci la password
6. Clicca "🗑️ Elimina Definitivamente"

#### Rettifica Dati
1. Vai in "👤 Profilo"
2. Modifica i dati errati
3. Salva le modifiche
4. Per dati che non puoi modificare, contatta l'amministratore

### Audit Trail

#### Visualizzazione Attività
1. Vai in "🔒 Privacy" → "📋 Le Mie Attività"
2. Visualizza cronologia:
   - **📅 Data e ora**
   - **🎯 Azione eseguita**
   - **📄 Documento coinvolto**
   - **🌐 Indirizzo IP**
   - **💻 Browser utilizzato**

#### Filtri Attività
- **📅 Periodo:** Filtra per data
- **🎯 Tipo azione:** Login, caricamento, condivisione, ecc.
- **📄 Documento:** Cerca attività su documento specifico

## 🆘 Supporto e Risoluzione Problemi

### Problemi Comuni

#### Caricamento Fallito
**Sintomi:** Il file non viene caricato o si blocca

**Soluzioni:**
1. Verifica la connessione internet
2. Controlla la dimensione del file (max 10 MB)
3. Verifica il formato file supportato
4. Prova a ricaricare la pagina
5. Svuota la cache del browser

#### Documento Non Visualizzabile
**Sintomi:** Errore nell'apertura del documento

**Soluzioni:**
1. Verifica i permessi di accesso
2. Controlla se il documento è stato eliminato
3. Prova con un browser diverso
4. Disabilita temporaneamente l'antivirus
5. Contatta l'amministratore se il problema persiste

#### Login Non Funziona
**Sintomi:** Impossibile accedere al sistema

**Soluzioni:**
1. Verifica email e password
2. Controlla il blocco CAPS LOCK
3. Prova il reset password
4. Verifica se l'account è attivo
5. Contatta l'amministratore

#### Ricerca Non Trova Documenti
**Sintomi:** La ricerca non restituisce risultati attesi

**Soluzioni:**
1. Verifica l'ortografia delle parole chiave
2. Prova con termini più generici
3. Usa i filtri di ricerca avanzata
4. Controlla i permessi sui documenti
5. Verifica se i documenti sono nella cartella corretta

### Contatti Supporto

#### Supporto Tecnico
- **📧 Email:** support@yourdomain.com
- **📞 Telefono:** +39 02 1234 5678
- **💬 Chat:** Disponibile nell'app (icona 💬 in basso a destra)
- **🕒 Orari:** Lun-Ven 9:00-18:00

#### Supporto Amministrativo
- **📧 Email:** admin@yourdomain.com
- **📞 Telefono:** +39 02 1234 5679
- **🕒 Orari:** Lun-Ven 9:00-17:00

#### Documentazione Online
- **📚 Knowledge Base:** https://help.yourdomain.com
- **🎥 Video Tutorial:** https://tutorials.yourdomain.com
- **❓ FAQ:** https://faq.yourdomain.com

### Segnalazione Bug

#### Come Segnalare un Problema
1. Vai in "❓ Aiuto" → "🐛 Segnala Bug"
2. Compila il form:
   - **📝 Descrizione:** Descrivi il problema dettagliatamente
   - **🔄 Passi per riprodurre:** Come riprodurre il bug
   - **📱 Browser/OS:** Specifica browser e sistema operativo
   - **📸 Screenshot:** Allega screenshot se utili
3. Clicca "📤 Invia Segnalazione"
4. Riceverai un numero di ticket per il follow-up

#### Informazioni Utili da Includere
- **URL della pagina** dove si verifica il problema
- **Messaggio di errore** esatto (se presente)
- **Azioni eseguite** prima che si verificasse il problema
- **Frequenza** del problema (sempre, a volte, una volta)
- **Impatto** sul lavoro (bloccante, fastidioso, minore)

## 📱 App Mobile

### Download e Installazione

#### iOS (iPhone/iPad)
1. Apri l'App Store
2. Cerca "Document Management System"
3. Tocca "Ottieni" per scaricare
4. Apri l'app dopo l'installazione
5. Accedi con le tue credenziali

#### Android
1. Apri Google Play Store
2. Cerca "Document Management System"
3. Tocca "Installa"
4. Apri l'app dopo l'installazione
5. Accedi con le tue credenziali

### Funzionalità Mobile

#### Funzioni Disponibili
- ✅ **Visualizzazione documenti**
- ✅ **Ricerca documenti**
- ✅ **Caricamento foto/documenti**
- ✅ **Condivisione documenti**
- ✅ **Notifiche push**
- ✅ **Accesso offline** (documenti scaricati)
- ✅ **Sincronizzazione automatica**

#### Funzioni Limitate
- ⚠️ **Modifica metadati** (solo visualizzazione)
- ⚠️ **Gestione cartelle** (solo navigazione)
- ⚠️ **Amministrazione** (non disponibile)

#### Utilizzo Offline
1. Scarica documenti per l'accesso offline:
   - Apri il documento
   - Tocca "📥 Scarica per Offline"
2. I documenti offline sono disponibili nella sezione "📱 Offline"
3. Le modifiche verranno sincronizzate alla riconnessione

## 🔄 Aggiornamenti e Novità

### Notifiche Aggiornamenti
Quando sono disponibili nuove funzionalità:
1. Vedrai una notifica nell'app
2. Riceverai un'email informativa
3. Apparirà un banner nella dashboard

### Changelog
Per vedere le novità recenti:
1. Vai in "❓ Aiuto" → "🆕 Novità"
2. Visualizza le ultime funzionalità aggiunte
3. Leggi le note di rilascio dettagliate

### Feedback e Suggerimenti
Per proporre miglioramenti:
1. Vai in "❓ Aiuto" → "💡 Suggerimenti"
2. Descrivi la tua idea
3. Vota i suggerimenti di altri utenti
4. Ricevi aggiornamenti sullo stato delle proposte

---

**Precedente:** [Deployment Guide](../deployment/deployment-guide.md)  
**Prossimo:** [Admin Manual](admin-manual.md)  
**Correlato:** [System Overview](../technical/architecture/system-overview.md)

---

*Per ulteriore assistenza, contatta il supporto tecnico o consulta la documentazione online.*