# 📋 Regole del Progetto

## 🎯 Principi Fondamentali

### 🚫 Regole Assolute

1. **Ordine e Manutenibilità**: Codice sempre ordinato e manutenibile
2. **No Mock Data**: Mai dati fittizi in produzione
3. **Comunicazione Italiana**: Sempre in italiano (eccetto codice e standard internazionali)
4. **Planning Operativo**: Ogni operazione significativa richiede planning in `/docs/10_project_managemnt`
5. **Conformità GDPR**: Rispetto normative privacy obbligatorio
6. **Architettura Tre Server**: API (4001), Documents (4002), Proxy (4003)
7. **Documentazione Aggiornata**: Mantenere `/docs` sempre sincronizzato
8. **Componenti Riutilizzabili**: Solo componenti standardizzati
9. **Design Moderno**: Standard design system obbligatori
10. **Stack Tecnologico**: Solo tecnologie approvate

## 🏗️ Architettura Sistema

### 🚫 Regole Assolute Architettura
- **NON modificare porte** dei server
- **NON bypassare proxy** per comunicazioni
- **NON alterare responsabilità** dei server
- **NON ignorare separazione** dei concern

### Tre Server Obbligatori

#### 1. API Server (Porta 4001)
**Responsabilità**:
- Validazione e sanitizzazione dati input
- Gestione autenticazione e autorizzazione
- Business logic e regole applicative
- Gestione sessioni utente
- Interfaccia con database PostgreSQL
- Logging operazioni e audit trail

**Endpoint Principali**:
- `/api/auth/*` - Autenticazione OAuth
- `/api/employees/*` - Gestione dipendenti
- `/api/documents/*` - Metadati documenti
- `/api/admin/*` - Funzioni amministrative

#### 2. Documents Server (Porta 4002)
**Responsabilità**:
- Generazione documenti PDF
- Template management
- Storage temporaneo documenti
- Conversione formati
- Ottimizzazione file

**Endpoint Principali**:
- `/generate/*` - Generazione documenti
- `/templates/*` - Gestione template
- `/download/*` - Download sicuro

#### 3. Proxy Server (Porta 4003)
**Responsabilità**:
- Routing richieste ai server appropriati
- Gestione CORS e headers sicurezza
- Rate limiting e throttling
- Load balancing interno
- Caching strategico
- Monitoring e health checks

### Flusso Comunicazione
```
Client → Proxy (4003) → API Server (4001) ↔ Database
                    → Documents Server (4002)
```

## 🔐 Gestione Autorizzazione e Accesso

### 🚫 Regole Assolute Sicurezza
- **NON loggare dati personali** in plain text
- **NON bypassare controlli** autorizzazione
- **NON hardcodare credenziali** nel codice
- **NON ignorare validazione** input utente
- **NON esporre informazioni** sensibili in errori

### Sistema Autenticazione

#### OAuth 2.0 + PKCE
```typescript
// ✅ Flusso autenticazione corretto
const authConfig = {
  clientId: process.env.OAUTH_CLIENT_ID,
  redirectUri: process.env.OAUTH_REDIRECT_URI,
  scope: 'openid profile email',
  responseType: 'code',
  codeChallenge: generatePKCEChallenge(),
  codeChallengeMethod: 'S256'
};
```

#### Gestione Sessioni
- **JWT tokens** per autenticazione
- **Refresh tokens** per rinnovo automatico
- **Session timeout** configurabile
- **Logout sicuro** con invalidazione token

#### Controlli Autorizzazione
```typescript
// ✅ Middleware autorizzazione
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Token mancante' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token non valido' });
  }
};

// ✅ Controllo ruoli
const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accesso negato' });
    }
    next();
  };
};
```

### Conformità GDPR

#### Regole Assolute GDPR
- **Controllo consenso** prima di processare dati
- **Minimizzazione dati** - solo necessari
- **Diritto cancellazione** implementato
- **Portabilità dati** garantita
- **Notifica breach** entro 72h

#### Pattern Corretti
```typescript
// ✅ Logging GDPR-compliant
logger.info('Utente autenticato', { 
  userId: user.id, // OK - identificatore
  action: 'login',
  timestamp: new Date().toISOString()
  // NON loggare email, nome, dati personali
});

// ✅ Gestione consenso
const processPersonalData = async (userId: string, data: any) => {
  const consent = await checkUserConsent(userId, 'data_processing');
  if (!consent.granted) {
    throw new Error('Consenso richiesto per processare dati');
  }
  // Processa dati solo se consenso valido
};
```

## 🛠️ Stack Tecnologico

### 🚫 Regole Assolute Stack
- **Solo ES Modules** (no CommonJS)
- **Solo Tailwind CSS** (no CSS custom)
- **TypeScript obbligatorio** (no JavaScript)
- **Next.js 14+** per frontend
- **Node.js LTS** per backend
- **PostgreSQL** come database

### Tecnologie Approvate

#### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **State Management**: React Context + Custom Hooks
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Fetch API nativo
- **Testing**: Jest + React Testing Library

#### Backend
- **Runtime**: Node.js LTS
- **Framework**: Express.js
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT + OAuth 2.0
- **Validation**: Zod
- **Testing**: Jest + Supertest

### Pattern di Sviluppo

#### 1. Container/Presentational Pattern
```typescript
// ✅ Container Component
const EmployeeListContainer: React.FC = () => {
  const { employees, loading, error } = useEmployees();
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <EmployeeList employees={employees} />;
};

// ✅ Presentational Component
const EmployeeList: React.FC<{ employees: Employee[] }> = ({ employees }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {employees.map(employee => (
      <EmployeeCard key={employee.id} employee={employee} />
    ))}
  </div>
);
```

#### 2. Factory Pattern per Servizi API
```typescript
// ✅ API Service Factory
class ApiServiceFactory {
  static createEmployeeService(): EmployeeService {
    return new EmployeeServiceAdapter({
      baseUrl: process.env.NEXT_PUBLIC_API_URL,
      timeout: 10000
    });
  }
}
```

#### 3. Custom Hooks Pattern
```typescript
// ✅ Custom Hook
const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await employeeService.getAll();
        setEmployees(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmployees();
  }, []);
  
  return { employees, loading, error };
};
```

## 🗣️ Comunicazione Obbligatoria

### 🚫 Regole Assolute
- **SEMPRE in italiano**: Documentazione, commenti, commit, issue, planning
- **Eccezioni**: Codice sorgente, librerie esterne, standard internazionali

### Esempi
```typescript
// ✅ Corretto
const fetchUserData = async (userId: string) => {
  // Recupera i dati dell'utente dal database
  return await userService.getById(userId);
};

// ❌ Sbagliato
const fetchUserData = async (userId: string) => {
  // Fetch user data from database
  return await userService.getById(userId);
};
```

## 📋 Planning Operativo Obbligatorio

### 🚫 Regole Assolute
- **SEMPRE planning** per operazioni significative
- **NON implementare** senza planning approvato
- **Struttura obbligatoria** in `/docs/10_project_managemnt/`

### Struttura File
```
N_nome_operazione/
├── ANALISI_PROBLEMA.md      # Analisi dettagliata
├── PLANNING_DETTAGLIATO.md  # Piano implementazione
├── IMPLEMENTAZIONE.md       # Documentazione sviluppo
└── RISULTATI.md             # Risultati e metriche
```

### Operazioni che Richiedono Planning
- Nuove funzionalità
- Modifiche architetturali
- Integrazioni esterne
- Refactoring maggiori
- Aggiornamenti dipendenze critiche
- Modifiche database/schema
- Security updates

## 📚 Aggiornamento Documentazione Obbligatorio

### 🚫 Regole Assolute
- **SEMPRE aggiornare** contestualmente alle modifiche
- **NON deploy** senza documentazione sincronizzata
- **Aggiornamento nello stesso commit**

### Mapping Modifiche → Documentazione
| Tipo Modifica | Documentazione |
|---------------|----------------|
| API Changes | `/docs/6_BACKEND/api-reference.md` |
| UI Components | `/docs/5_FRONTEND/components.md` |
| Database Schema | `/docs/6_BACKEND/database-schema.md` |
| Deployment | `/docs/4_DEPLOYMENT/` |
| Architecture | `/docs/2_ARCHITECTURE/` |
| User Features | `/docs/1_USER/user-guide.md` |

### Checklist
- [ ] File rilevanti aggiornati
- [ ] Esempi di codice verificati
- [ ] Link e riferimenti controllati
- [ ] Date e versioni aggiornate

## 🧩 Componenti Riutilizzabili Obbligatori

### 🚫 Regole Assolute
- **NON duplicare** componenti esistenti
- **NON modificare shared** senza analisi impatto
- **Solo Tailwind CSS** per styling
- **Accessibilità obbligatoria** (WCAG 2.1 AA)
- **Props tipizzate** TypeScript
- **Mobile-first responsive**

### Gerarchia
```
src/components/
├── shared/ui/          # Button, Input, Modal, Card, Table
├── shared/layout/      # Header, Sidebar, Footer, Container
├── shared/forms/       # FormField, FormGroup, FormValidation
├── business/           # employee/, document/, auth/
└── pages/              # dashboard/, employees/, documents/
```

### Standard Componenti
```typescript
// ✅ Props tipizzate
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

// ✅ Solo Tailwind CSS
const Button: React.FC<ButtonProps> = ({ variant, size, children }) => {
  const baseClasses = 'font-medium rounded-md focus:outline-none focus:ring-2';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300'
  };
  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </button>
  );
};
```

## 🎨 Standard Design Moderno ed Elegante

### 🚫 Regole Assolute
- **SEMPRE design system** definito
- **Solo colori approvati**
- **Layout responsive** obbligatorio
- **Accessibilità WCAG 2.1 AA**
- **Spacing standardizzato**
- **Font approvati**

### Palette Colori
```css
/* Primari */
--primary-500: #3b82f6;  /* Principale */
--primary-600: #2563eb;  /* Hover */
--primary-700: #1d4ed8;  /* Active */

/* Neutri */
--gray-50: #f9fafb;      /* Sfondo pagina */
--gray-100: #f3f4f6;     /* Sfondo card */
--gray-500: #6b7280;     /* Testo secondario */
--gray-900: #111827;     /* Testo principale */

/* Stato */
--success-500: #10b981;  /* Successo */
--warning-500: #f59e0b;  /* Attenzione */
--error-500: #ef4444;    /* Errore */
```

### Typography
```css
/* Headings */
.heading-1 { @apply text-4xl font-bold; }    /* 36px */
.heading-2 { @apply text-3xl font-semibold; } /* 30px */
.heading-3 { @apply text-2xl font-semibold; } /* 24px */

/* Body */
.text-base { @apply text-base leading-normal; }   /* 16px */
.text-small { @apply text-sm leading-normal; }    /* 14px */
```

### Spacing (basato su 4px)
```css
--space-2: 0.5rem;   /* 8px  */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
```

```tsx
// ✅ Corretto
const Card = () => (
  <div className="p-6 mb-4 space-y-4">
    <h3 className="mb-2">Titolo</h3>
    <p className="mb-4">Contenuto</p>
  </div>
);
```

### Componenti UI Standard
```tsx
// Button
const Button: React.FC<ButtonProps> = ({ variant, children, ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 transition-colors duration-200';
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300'
  };
  return (
    <button className={`${baseClasses} ${variants[variant]}`} {...props}>
      {children}
    </button>
  );
};

// Card
const Card: React.FC<CardProps> = ({ children }) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
    {children}
  </div>
);
```

### Animazioni
```css
/* Durate */
--duration-fast: 150ms;     /* Hover, focus */
--duration-normal: 200ms;   /* Standard */
--duration-slow: 300ms;     /* Modal */
```

```tsx
// ✅ Esempi approvati
const HoverCard = () => (
  <div className="transition-all duration-200 hover:shadow-lg">
    Content
  </div>
);

const LoadingSpinner = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
);
```

### Accessibilità (WCAG 2.1 AA)
- **Contrasto**: Testo normale 4.5:1, UI 3:1
- **Focus states**: `focus:outline-none focus:ring-2 focus:ring-primary-500`
- **Keyboard navigation**: Tab order logico, Escape per modal

### Responsive Mobile-First
```css
/* Breakpoints */
sm: 640px, md: 768px, lg: 1024px, xl: 1280px
```

```tsx
// ✅ Pattern responsive
const ResponsiveGrid = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {items.map(item => <Card key={item.id} {...item} />)}
  </div>
);
```

### Checklist Design
- [ ] Colori approvati
- [ ] Spacing standardizzato
- [ ] Focus states implementati
- [ ] Responsive testato
- [ ] Accessibilità verificata
- [ ] Performance controllata

## 📁 Struttura del Progetto

### 🚫 Regole Assolute Struttura
- **NON modificare struttura principale** delle directory
- **NON alterare organizzazione** componenti condivisi
- **NON spostare file configurazione** principali
- **NON modificare struttura backend** (tre server)

### Organizzazione Directory
```
project/
├── backend/                    # Backend Node.js
│   ├── src/
│   │   ├── api/               # API Server (4001)
│   │   ├── documents/         # Documents Server (4002)
│   │   └── proxy/             # Proxy Server (4003)
│   └── prisma/                # Schema DB e migrazioni
├── src/                       # Frontend React/Next.js
│   ├── app/                   # Next.js App Router
│   ├── components/
│   │   └── shared/            # Componenti standardizzati
│   ├── services/api/          # Layer API centralizzato
│   ├── hooks/                 # Custom React hooks
│   ├── context/               # Context providers
│   └── types/                 # Definizioni TypeScript
├── docs_new/                  # Documentazione progetto
│   └── 10_NEW_PROJECTS/       # Planning operativi
└── .trae/rules/               # Regole del progetto
```

## 🏷️ Convenzioni di Nomenclatura

### 🚫 Regole Assolute Nomenclatura
- **NON utilizzare nomi generici** (es. "utils.ts", "helpers.ts")
- **NON mixare convenzioni** nello stesso contesto
- **NON omettere prefissi standard** ("use" per hook, "handle" per eventi)

### Convenzioni per Tipo
| Tipo | Convenzione | Esempio |
|------|-------------|----------|
| Componenti React | `PascalCase.tsx` | `EmployeeForm.tsx` |
| Hook personalizzati | `useNomeHook.ts` | `useEmployees.ts` |
| Servizi API | `nomeServiceAdapter.ts` | `employeeServiceAdapter.ts` |
| Utility | `camelCase.ts` | `dateUtils.ts` |
| Test | `NomeFile.test.tsx` | `Button.test.tsx` |

### Prefissi Semantici
| Prefisso | Uso | Esempio |
|----------|-----|----------|
| `is`, `has`, `should` | Boolean | `isActive`, `hasPermission` |
| `on` | Event props | `onClick`, `onSubmit` |
| `handle` | Event handlers | `handleSubmit` |
| `get` | Retrieval methods | `getEmployees` |
| `use` | Custom hooks | `useAuth` |

## 🚨 Anti-Pattern da Evitare

### 🚫 Regole Assolute Anti-Pattern
1. **NON utilizzare any in TypeScript** senza giustificazione documentata
2. **NON creare componenti monolitici** oltre 200 righe
3. **NON implementare logica business** nei componenti UI
4. **NON utilizzare useEffect** per data fetching semplice
5. **NON ignorare gestione errori** nelle chiamate API
6. **NON hardcodare valori** di configurazione
7. **NON utilizzare inline styles** invece di Tailwind
8. **NON creare hook** che violano le regole React
9. **NON bypassare validazione** input utente
10. **NON loggare dati sensibili** in plain text

## ✅ Checklist di Verifica

### Prima del Commit
- [ ] Codice segue convenzioni nomenclatura
- [ ] Nessun dato sensibile in plain text
- [ ] Gestione errori implementata
- [ ] TypeScript senza errori
- [ ] Test passano
- [ ] Documentazione aggiornata
- [ ] Conformità GDPR verificata
- [ ] Pattern architetturali rispettati

### Prima del Deploy
- [ ] Server su porte corrette (4001, 4002, 4003)
- [ ] Proxy routing funzionante
- [ ] Autenticazione OAuth operativa
- [ ] Database migrazioni applicate
- [ ] Backup configurato
- [ ] Monitoring attivo
- [ ] Logs configurati correttamente

## 📚 Riferimenti Documentazione

- **Architettura**: `/docs_new/2_ARCHITECTURE/`
- **Sviluppo**: `/docs_new/3_DEVELOPMENT/`
- **Frontend**: `/docs_new/5_FRONTEND/`
- **Backend**: `/docs_new/6_BACKEND/`
- **Planning**: `/docs_new/10_NEW_PROJECTS/`
- **Regole**: `/.trae/rules/`

---

**Nota**: Questo documento è la fonte di verità per tutte le regole del progetto. In caso di conflitto con altre documentazioni, questo documento ha precedenza.