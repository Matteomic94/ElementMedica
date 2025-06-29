# 📋 PLANNING DETTAGLIATO - Refactoring Completo Sistema

## 🎯 Obiettivo

Refactoring completo e sicuro del sistema per semplificare l'architettura, eliminare duplicazioni e standardizzare la gestione dati mantenendo piena conformità GDPR.

**Data Inizio**: 29 Dicembre 2024  
**Durata Stimata**: 3 settimane  
**Priorità**: CRITICA  

---

## 📊 ANALISI SCHEMA ATTUALE

### Entità Duplicate Identificate

#### 👤 Gestione Persone (CRITICO)
```prisma
// PROBLEMA: Tre entità sovrapposte
model User {           // 302-325: Autenticazione legacy
  id, username, email, password, firstName, lastName
  companyId, tenantId, globalRole
  eliminato Boolean @default(false)  // ❌ Campo soft delete
}

model Employee {       // 37-65: Dipendenti aziendali
  id, first_name, last_name, email, phone
  companyId, codice_fiscale
  eliminato Boolean @default(false)  // ❌ Campo soft delete
}

model Person {         // 475-540: Entità unificata moderna
  id, firstName, lastName, email, phone
  companyId, tenantId, taxCode
  deletedAt DateTime?              // ✅ Soft delete corretto
  isDeleted Boolean @default(false) // ❌ Duplicato
}
```

#### 🔐 Gestione Ruoli (CRITICO)
```prisma
// PROBLEMA: Due sistemi ruoli paralleli
model Role {           // 327-348: Sistema legacy
  id, name, displayName, permissions Json
  companyId, tenantId
  eliminato Boolean @default(false)  // ❌ Campo soft delete
}

model PersonRole {     // 542-567: Sistema moderno
  personId, roleType RoleType
  companyId, tenantId
  // ✅ Nessun campo soft delete (corretto)
}

enum RoleType {        // 675-698: Enum ben definito
  EMPLOYEE, MANAGER, TRAINER, ADMIN, etc.
}
```

### Campi Soft Delete Inconsistenti

| Entità | Campo Soft Delete | Tipo | Status |
|--------|------------------|------|--------|
| User | `eliminato` | Boolean | ❌ Da rimuovere |
| Employee | `eliminato` | Boolean | ❌ Da rimuovere |
| Person | `deletedAt` | DateTime? | ✅ Mantenere |
| Person | `isDeleted` | Boolean | ❌ Da rimuovere |
| Role | `eliminato` | Boolean | ❌ Da rimuovere |
| Company | `eliminato` | Boolean | ❌ Da convertire |
| Course | `eliminato` | Boolean | ❌ Da convertire |

---

## 🗺️ PIANO IMPLEMENTAZIONE

### FASE 1: PREPARAZIONE E BACKUP (Giorni 1-2)

#### Step 1.1: Backup Completo Sistema
```bash
# Backup database
pg_dump -h localhost -U postgres -d database_name > backup_pre_refactoring.sql

# Backup codice
cp -r /Users/matteo.michielon/project\ 2.0 /Users/matteo.michielon/backup_project_pre_refactoring
```

#### Step 1.2: Analisi Dipendenze
- [ ] Mappare tutte le relazioni User → altre entità
- [ ] Mappare tutte le relazioni Employee → altre entità  
- [ ] Identificare query che usano `eliminato` vs `deletedAt`
- [ ] Catalogare file che referenziano Role vs PersonRole

#### Step 1.3: Creazione Test Baseline
```bash
# Test funzionalità critiche prima del refactoring
node test_sistema_completo_baseline.cjs
```

### FASE 2: UNIFICAZIONE ENTITÀ PERSON (Giorni 3-7)

#### Step 2.1: Migrazione Dati User → Person

**Script Migrazione**:
```sql
-- Inserire User mancanti in Person
INSERT INTO persons (
  id, firstName, lastName, email, username, password,
  isActive, lastLogin, globalRole, companyId, tenantId,
  createdAt, updatedAt
)
SELECT 
  u.id, u.firstName, u.lastName, u.email, u.username, u.password,
  u.isActive, u.lastLogin, u.globalRole, u.companyId, u.tenantId,
  u.createdAt, u.updatedAt
FROM "User" u
LEFT JOIN persons p ON u.id = p.id
WHERE p.id IS NULL AND u.eliminato = false;
```

**Aggiornamento Relazioni**:
```sql
-- RefreshToken: personId già corretto ✅
-- UserRole → PersonRole (conversione)
-- UserSession → PersonSession (nuovo)
-- ActivityLog → PersonActivityLog (nuovo)
-- ConsentRecord → PersonConsentRecord (nuovo)
-- GdprAuditLog: userId → personId
```

#### Step 2.2: Migrazione Dati Employee → Person

**Script Migrazione**:
```sql
-- Inserire Employee mancanti in Person
INSERT INTO persons (
  id, firstName, lastName, email, phone, birthDate, taxCode,
  residenceAddress, residenceCity, postalCode, province,
  title, hiredDate, companyId, createdAt, updatedAt
)
SELECT 
  e.id, e.first_name, e.last_name, e.email, e.phone, e.birth_date, e.codice_fiscale,
  e.residence_address, e.residence_city, e.postal_code, e.province,
  e.title, e.hired_date, e.companyId, e.created_at, e.updated_at
FROM "Employee" e
LEFT JOIN persons p ON e.id = p.id
WHERE p.id IS NULL AND e.eliminato = false;
```

**Aggiornamento Relazioni**:
```sql
-- CourseEnrollment: employeeId → personId
-- Attestato: partecipanteId → personId
-- PreventivoPartecipante: partecipanteId → personId
-- RegistroPresenzePartecipante: partecipanteId → personId
-- TestPartecipante: partecipanteId → personId
```

#### Step 2.3: Aggiornamento Schema Prisma

**Rimuovere Entità**:
```prisma
// ❌ RIMUOVERE
model User { ... }
model Employee { ... }

// ✅ MANTENERE E AGGIORNARE
model Person {
  // Rimuovere isDeleted
  // Mantenere solo deletedAt
}
```

**Aggiornare Relazioni**:
```prisma
model CourseEnrollment {
  personId   String  // era employeeId
  person     Person  @relation(fields: [personId], references: [id])
}

model RefreshToken {
  // ✅ Già corretto con personId
}
```

#### Step 2.4: Aggiornamento Codice Backend

**File da Aggiornare**:
- [ ] `auth/middleware.js` - Sostituire User con Person
- [ ] `routes/employees-routes.js` - Sostituire Employee con Person
- [ ] `routes/users-routes.js` - Sostituire User con Person
- [ ] `services/authService.js` - Aggiornare query
- [ ] `controllers/personController.js` - Unificare logica

**Pattern Sostituzione**:
```javascript
// ❌ PRIMA
const user = await prisma.user.findUnique({
  where: { id: userId, eliminato: false }
});

// ✅ DOPO
const person = await prisma.person.findUnique({
  where: { id: personId, deletedAt: null }
});
```

### FASE 3: STANDARDIZZAZIONE SOFT DELETE (Giorni 8-10)

#### Step 3.1: Migrazione Campi Soft Delete

**Script SQL**:
```sql
-- Company: eliminato → deletedAt
ALTER TABLE "Company" ADD COLUMN "deletedAt" TIMESTAMP;
UPDATE "Company" SET "deletedAt" = NOW() WHERE "eliminato" = true;
ALTER TABLE "Company" DROP COLUMN "eliminato";

-- Course: eliminato → deletedAt  
ALTER TABLE "Course" ADD COLUMN "deletedAt" TIMESTAMP;
UPDATE "Course" SET "deletedAt" = NOW() WHERE "eliminato" = true;
ALTER TABLE "Course" DROP COLUMN "eliminato";

-- Person: rimuovere isDeleted
ALTER TABLE persons DROP COLUMN "isDeleted";
```

#### Step 3.2: Aggiornamento Query nel Codice

**Pattern Sostituzione**:
```javascript
// ❌ PRIMA
where: { eliminato: false }
where: { isDeleted: false }

// ✅ DOPO
where: { deletedAt: null }
```

**File da Aggiornare**:
- [ ] `routes/companies-routes.js`
- [ ] `routes/courses-routes.js`
- [ ] `routes/person-routes.js`
- [ ] Tutti i service files
- [ ] Tutti i controller files

### FASE 4: UNIFICAZIONE SISTEMA RUOLI (Giorni 11-14)

#### Step 4.1: Migrazione Role → PersonRole

**Analisi Mapping**:
```sql
-- Verificare Role esistenti
SELECT name, COUNT(*) FROM "Role" GROUP BY name;

-- Mappare a RoleType enum
-- ADMIN → ADMIN
-- MANAGER → MANAGER  
-- USER → EMPLOYEE
-- etc.
```

**Script Migrazione**:
```sql
-- Creare PersonRole da Role esistenti
INSERT INTO person_roles (
  id, personId, roleType, companyId, tenantId, 
  assignedAt, createdAt, updatedAt
)
SELECT 
  gen_random_uuid(),
  ur.userId,
  CASE r.name
    WHEN 'ADMIN' THEN 'ADMIN'::"RoleType"
    WHEN 'MANAGER' THEN 'MANAGER'::"RoleType"
    WHEN 'USER' THEN 'EMPLOYEE'::"RoleType"
    ELSE 'EMPLOYEE'::"RoleType"
  END,
  r.companyId,
  r.tenantId,
  ur.assignedAt,
  NOW(),
  NOW()
FROM "UserRole" ur
JOIN "Role" r ON ur.roleId = r.id
WHERE ur.eliminato = false AND r.eliminato = false;
```

#### Step 4.2: Migrazione Permessi

**Mapping Permission → PersonPermission**:
```sql
-- Analizzare permessi esistenti in Role.permissions (JSON)
-- Mappare a enum PersonPermission
```

#### Step 4.3: Rimozione Entità Legacy

```prisma
// ❌ RIMUOVERE
model Role { ... }
model UserRole { ... }
model Permission { ... }
model EnhancedUserRole { ... }

// ✅ MANTENERE
model PersonRole { ... }
enum RoleType { ... }
enum PersonPermission { ... }
```

#### Step 4.4: Aggiornamento Codice Autorizzazione

**File da Aggiornare**:
- [ ] `auth/middleware.js` - Usare PersonRole
- [ ] `middleware/rbac.js` - Aggiornare logica
- [ ] `services/enhancedRoleService.js` - Sostituire con PersonRoleService

### FASE 5: PULIZIA FILE E DOCUMENTAZIONE (Giorni 15-18)

#### Step 5.1: Rimozione Test Obsoleti

**Test da Rimuovere** (mantenere solo essenziali):
```bash
# Mantenere
test_sistema_completo.cjs
test_login_final_complete.cjs
test_permissions_endpoint.cjs

# Rimuovere (150+ file)
test_login_*.cjs (eccetto finale)
test_authenticate_*.cjs (eccetto essenziali)
test_middleware_*.cjs (eccetto essenziali)
test_verify_*.cjs (eccetto essenziali)
```

#### Step 5.2: Analisi Planning Sistematici

**File da Analizzare**:
- [ ] `backend/PLANNING_SISTEMATICO.md`
- [ ] `backend/PLANNING_SISTEMATICO_RIASSUNTO.md`
- [ ] `docs/10_project_managemnt/6_analisi_login_timeout/PLANNING_SISTEMATICO.md`
- [ ] `docs/10_project_managemnt/6_analisi_login_timeout/PLANNING_SISTEMATICO_RIASSUNTO.md`

**Informazioni da Estrarre**:
- ✅ Errori risolti (authService, courses-routes, etc.)
- ✅ Problemi ricorrenti (schema mismatch, server restart)
- ✅ Best practices (test diretti, documentazione sistematica)
- ✅ Lezioni apprese (field names, relations verification)

#### Step 5.3: Aggiornamento STATO_SISTEMA_FINALE.md

**Sezioni da Aggiornare**:
```markdown
## ✅ PROBLEMI RISOLTI

### 1. 🗄️ SCHEMA PRISMA SEMPLIFICATO
- ✅ Unificazione User/Employee → Person
- ✅ Standardizzazione soft delete → deletedAt
- ✅ Unificazione Role → PersonRole/RoleType

### 2. 🧹 PULIZIA CODICE
- ✅ Rimossi 150+ test obsoleti
- ✅ Consolidata documentazione
- ✅ Aggiornate regole GDPR
```

### FASE 6: AGGIORNAMENTO DOCUMENTAZIONE (Giorni 19-21)

#### Step 6.1: Aggiornamento docs/technical/

**File da Aggiornare**:
- [ ] `docs/technical/database/schema.md` - Nuovo schema
- [ ] `docs/technical/api/api-reference.md` - Nuovi endpoint
- [ ] `docs/technical/architecture/system-overview.md` - Architettura semplificata

#### Step 6.2: Aggiornamento project_rules.md

**Sezioni da Aggiornare**:
```markdown
## 🗄️ Schema Database Standardizzato

### Entità Principale: Person
- ✅ Unica entità per utenti/dipendenti/trainer
- ✅ Soft delete con deletedAt DateTime?
- ✅ Relazioni unificate

### Sistema Ruoli: PersonRole + RoleType
- ✅ Enum RoleType per tipi ruolo
- ✅ PersonPermission per permessi granulari
- ✅ Multi-tenant e multi-company support

### Conformità GDPR
- ✅ Soft delete uniforme per diritto cancellazione
- ✅ Audit trail completo
- ✅ Gestione consensi centralizzata
```

---

## 🧪 PIANO TEST E VERIFICA

### Test Automatizzati per Ogni Fase

#### Fase 1: Test Baseline
```bash
node test_sistema_completo_baseline.cjs
# Verifica: Login, Courses, Companies, Permissions
```

#### Fase 2: Test Migrazione Person
```bash
node test_person_migration.cjs
# Verifica: 
# - Tutti User migrati in Person
# - Tutti Employee migrati in Person
# - Relazioni aggiornate correttamente
# - Nessun dato perso
```

#### Fase 3: Test Soft Delete
```bash
node test_soft_delete_standardization.cjs
# Verifica:
# - Tutte le query usano deletedAt
# - Nessun riferimento a eliminato/isDeleted
# - Funzionalità cancellazione GDPR
```

#### Fase 4: Test Sistema Ruoli
```bash
node test_role_system_unified.cjs
# Verifica:
# - PersonRole funzionante
# - Permessi corretti
# - Autorizzazione endpoint
```

#### Fase 5-6: Test Finale
```bash
node test_sistema_completo_finale.cjs
# Verifica completa tutte le funzionalità
```

### Checklist GDPR per Ogni Fase

- [ ] **Diritto Accesso**: Dati accessibili via API
- [ ] **Diritto Cancellazione**: Soft delete funzionante
- [ ] **Diritto Portabilità**: Export dati completo
- [ ] **Audit Trail**: Log tutte le operazioni
- [ ] **Consensi**: Gestione consensi preservata
- [ ] **Retention**: Policy retention rispettate

---

## 🚨 GESTIONE RISCHI E ROLLBACK

### Piano Rollback per Ogni Fase

#### Rollback Fase 2 (Migrazione Person)
```sql
-- Ripristinare User e Employee
CREATE TABLE "User" AS SELECT * FROM backup_user;
CREATE TABLE "Employee" AS SELECT * FROM backup_employee;

-- Ripristinare relazioni
UPDATE "RefreshToken" SET "userId" = "personId" WHERE "personId" IN (SELECT id FROM backup_user);
```

#### Rollback Fase 3 (Soft Delete)
```sql
-- Ripristinare campi eliminato
ALTER TABLE "Company" ADD COLUMN "eliminato" BOOLEAN DEFAULT false;
UPDATE "Company" SET "eliminato" = true WHERE "deletedAt" IS NOT NULL;
```

#### Rollback Fase 4 (Sistema Ruoli)
```sql
-- Ripristinare Role e UserRole
CREATE TABLE "Role" AS SELECT * FROM backup_role;
CREATE TABLE "UserRole" AS SELECT * FROM backup_user_role;
```

### Monitoraggio Continuo

```bash
# Script monitoraggio durante migrazione
watch -n 30 'psql -d database -c "SELECT COUNT(*) FROM persons; SELECT COUNT(*) FROM person_roles;"'
```

### Punti di Controllo

- [ ] **Checkpoint 1**: Backup completato
- [ ] **Checkpoint 2**: Migrazione Person completata
- [ ] **Checkpoint 3**: Soft delete standardizzato
- [ ] **Checkpoint 4**: Sistema ruoli unificato
- [ ] **Checkpoint 5**: Test finale superato

---

## 📊 METRICHE DI SUCCESSO

### Metriche Tecniche

| Metrica | Prima | Dopo | Target |
|---------|-------|------|--------|
| Entità Person | 3 (User/Employee/Person) | 1 (Person) | ✅ |
| Campi Soft Delete | 3 tipi | 1 (deletedAt) | ✅ |
| Sistema Ruoli | 2 (Role/PersonRole) | 1 (PersonRole) | ✅ |
| File Test | 150+ | <20 | ✅ |
| Documentazione Obsoleta | 50+ file | 0 | ✅ |

### Metriche Qualitative

- [ ] **Manutenibilità**: Codice più semplice e chiaro
- [ ] **Onboarding**: Sviluppatori comprendono architettura in <1 giorno
- [ ] **Performance**: Query più efficienti
- [ ] **GDPR**: Conformità al 100%
- [ ] **Stabilità**: Zero regressioni funzionali

---

## 📅 TIMELINE DETTAGLIATA

### Settimana 1: Preparazione e Migrazione Core
- **Giorni 1-2**: Backup e analisi dipendenze
- **Giorni 3-5**: Migrazione User/Employee → Person
- **Giorni 6-7**: Test e verifica migrazione

### Settimana 2: Standardizzazione e Ruoli
- **Giorni 8-10**: Standardizzazione soft delete
- **Giorni 11-14**: Unificazione sistema ruoli

### Settimana 3: Pulizia e Documentazione
- **Giorni 15-16**: Pulizia file obsoleti
- **Giorni 17-18**: Analisi planning sistematici
- **Giorni 19-21**: Aggiornamento documentazione

---

## 🎯 PROSSIMI PASSI IMMEDIATI

1. **Creare cartella analisi/** con file specifici
2. **Eseguire backup completo sistema**
3. **Creare test baseline per verifica**
4. **Iniziare analisi dipendenze dettagliata**
5. **Preparare script migrazione database**

---

**⚠️ IMPORTANTE**: Ogni step deve essere testato in ambiente di sviluppo prima dell'implementazione. La conformità GDPR deve essere verificata continuamente durante tutto il processo.