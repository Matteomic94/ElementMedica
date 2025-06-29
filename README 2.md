# Training Course Management Application

Questa applicazione React gestisce corsi di formazione, aziende, dipendenti e formatori con un sistema completo di autenticazione e autorizzazione.

## Struttura del Progetto

L'applicazione è organizzata in modo modulare per facilitare la manutenzione e la comprensione:

```
src/
├── components/      # Componenti UI riutilizzabili (Button, Dialog, etc.)
├── context/         # Context providers (Auth, AppState)
├── hooks/           # Custom hooks (useFetch, useSelection, useFilterSearch)
├── pages/           # Pagine dell'applicazione
│   ├── settings/    # Pagine di impostazioni (utenti, ruoli, log attività)
├── services/        # Servizi API per comunicare con il backend
├── types/           # Definizioni dei tipi TypeScript
├── utils/           # Utility functions
├── App.tsx          # Componente principale dell'applicazione
└── index.tsx        # Entry point
```

## Caratteristiche Principali

- **Gestione Corsi**: Creazione e gestione di corsi di formazione
- **Gestione Aziende**: Registrazione e gestione di aziende clienti
- **Gestione Dipendenti**: Tracciamento dei dipendenti e della loro partecipazione ai corsi
- **Gestione Formatori**: Assegnazione di formatori ai corsi
- **Sistema di Autenticazione**: Login/logout con JWT
- **Controllo Accessi Basato su Ruoli**: Permessi differenziati per ruolo
- **Logging Attività**: Registrazione di tutte le operazioni degli utenti

## Sistema Multi-account con Permessi Differenziati

L'applicazione implementa un sistema completo di autenticazione e autorizzazione:

- **Utenti**: Accesso con username/email e password
- **Ruoli**: Admin, Manager, User con permessi differenti
- **Permessi**: Controllo fine-grained su risorse/azioni specifiche
- **Logging**: Tracciamento di tutte le attività degli utenti nel sistema

### Gestione Utenti e Permessi

La sezione impostazioni consente la gestione completa di:
- **Utenti**: Creazione, modifica e disattivazione di account utente
- **Ruoli**: Definizione di ruoli con set specifici di permessi
- **Log Attività**: Visualizzazione e filtraggio delle attività degli utenti

Per maggiori dettagli sulla struttura del sistema di autenticazione e autorizzazione, consulta la [documentazione specifica](/src/README.md).

## Guida per le IA Assistant

Questa sezione è dedicata a informazioni specifiche per le IA che potrebbero analizzare questo codebase.

### Pattern e Convenzioni

1. **Factory Pattern nei Servizi API**: 
   - Tutti i servizi API utilizzano il pattern factory implementato in `services/serviceFactory.ts`
   - Ogni nuova entità dovrebbe utilizzare questo factory per mantenere la consistenza
   - Esempio: vedi `services/courses.ts`, `services/companies.ts`, etc.

2. **Componenti UI Standardizzati**:
   - Usa componenti condivisi da `components/` anziché crearne di nuovi
   - I bottoni utilizzano il componente `Button` con stile pill-shaped di default
   - Le dialog/modal utilizzano il componente `Dialog`

3. **Custom Hooks**:
   - Per operazioni di rete, usa `useFetch` anziché chiamate dirette ai servizi
   - Per gestire selezioni di elementi, usa `useSelection`
   - Per ricerca e filtri, usa `useFilterSearch`

4. **Navigation e Tabs**:
   - Le navigazioni a tab utilizzano il componente `TabNavigation` con stile pill 
   - Vedi esempi in `pages/settings/` e `pages/courses/`

5. **Autenticazione e Autorizzazione**:
   - Utilizza `useAuth()` hook per accedere alle funzionalità di autenticazione
   - Usa `hasPermission(resource, action)` per verificare i permessi
   - Proteggi le route con `ProtectedRoute` passando resource e action

### Evitare Errori Comuni

1. **NON creare nuovi servizi HTTP personalizzati**
   - Usa sempre i servizi presenti in `services/` che utilizzano il factory pattern
   - Se è necessaria una nuova funzionalità, estendi il servizio esistente usando `.extend()`

2. **NON duplicare componenti UI**
   - Prima di creare un nuovo componente, verifica se esiste già un componente simile

3. **NON mischiare stili e layout**
   - Usa `PageHeader` per mantenere consistenza tra le pagine
   - Segui le convenzioni di stile esistenti

4. **NON modificare il pattern di servizio API**
   - Mantieni la struttura esistente per retrocompatibilità

5. **NON bypassare il sistema di autorizzazione**
   - Usa sempre `hasPermission()` per verificare i permessi
   - Proteggi tutte le route con `ProtectedRoute` e i permessi appropriati

### Entità Principali

- **Courses**: Corsi di formazione (titolo, durata, validità)
- **Companies**: Aziende clienti
- **Employees**: Dipendenti delle aziende che partecipano ai corsi
- **Trainers**: Formatori che gestiscono i corsi
- **Users**: Utenti del sistema con ruoli e permessi
- **Roles**: Ruoli con permessi associati
- **Permissions**: Definizioni dei permessi per risorsa e azione

### Note sui Servizi API

Tutti i servizi API seguono lo stesso pattern:
- `getAll()` - Recupera tutte le entità (con possibili filtri)
- `getById(id)` - Recupera una singola entità
- `create(data)` - Crea una nuova entità
- `update(id, data)` - Aggiorna un'entità esistente
- `delete(id)` - Elimina un'entità
- `deleteMultiple(ids)` - Elimina più entità contemporaneamente

Per estendere un servizio con metodi specifici, usa il metodo `.extend()`:

```typescript
const customService = baseService.extend({
  customMethod: async () => { /* implementazione */ }
});
``` 