-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "codice_ateco" TEXT,
    "iban" TEXT,
    "pec" TEXT,
    "sdi" TEXT,
    "cap" TEXT,
    "citta" TEXT,
    "codice_fiscale" TEXT,
    "mail" TEXT,
    "note" TEXT,
    "persona_riferimento" TEXT,
    "piva" TEXT,
    "provincia" TEXT,
    "ragione_sociale" TEXT NOT NULL,
    "sede_azienda" TEXT,
    "telefono" TEXT,
    "eliminato" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" TEXT,
    "slug" TEXT,
    "domain" TEXT,
    "settings" JSONB DEFAULT '{}',
    "subscription_plan" TEXT NOT NULL DEFAULT 'basic',
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "title" TEXT,
    "status" TEXT,
    "hired_date" TIMESTAMP(3),
    "companyId" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "birth_date" TIMESTAMP(3),
    "codice_fiscale" TEXT NOT NULL,
    "notes" TEXT,
    "postal_code" TEXT,
    "province" TEXT,
    "residence_address" TEXT,
    "residence_city" TEXT,
    "photo_url" TEXT,
    "eliminato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "duration" TEXT,
    "status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "certifications" TEXT,
    "code" TEXT,
    "contents" TEXT,
    "maxPeople" INTEGER,
    "pricePerPerson" DOUBLE PRECISION,
    "regulation" TEXT,
    "renewalDuration" TEXT,
    "validityYears" INTEGER,
    "tenantId" TEXT,
    "eliminato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseSchedule" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "max_participants" INTEGER,
    "status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT,
    "notes" TEXT,
    "trainerId" TEXT,
    "delivery_mode" TEXT,
    "attendance" JSONB,
    "hasAttestati" BOOLEAN NOT NULL DEFAULT false,
    "eliminato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CourseSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseEnrollment" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "eliminato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CourseEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trainer" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "birth_date" TIMESTAMP(3),
    "certifications" TEXT[],
    "iban" TEXT,
    "notes" TEXT,
    "postal_code" TEXT,
    "province" TEXT,
    "register_code" TEXT,
    "residence_address" TEXT,
    "residence_city" TEXT,
    "tax_code" TEXT,
    "vat_number" TEXT,
    "specialties" TEXT[],
    "tariffa_oraria" DOUBLE PRECISION,
    "tenantId" TEXT,
    "eliminato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Trainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseSession" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "start" TEXT NOT NULL,
    "end" TEXT NOT NULL,
    "trainerId" TEXT,
    "coTrainerId" TEXT,
    "eliminato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CourseSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleCompany" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "eliminato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ScheduleCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attestato" (
    "id" TEXT NOT NULL,
    "scheduledCourseId" TEXT NOT NULL,
    "partecipanteId" TEXT NOT NULL,
    "nomeFile" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "dataGenerazione" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "numeroProgressivo" INTEGER NOT NULL,
    "annoProgressivo" INTEGER NOT NULL,
    "eliminato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Attestato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateLink" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "content" TEXT,
    "footer" TEXT,
    "header" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "logoPosition" TEXT,
    "fileFormat" TEXT,
    "googleDocsUrl" TEXT,
    "logoImage" TEXT,
    "companyId" TEXT,
    "eliminato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TemplateLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LetteraIncarico" (
    "id" TEXT NOT NULL,
    "scheduledCourseId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "nomeFile" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "dataGenerazione" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "numeroProgressivo" INTEGER NOT NULL,
    "annoProgressivo" INTEGER NOT NULL,
    "eliminato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LetteraIncarico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroPresenze" (
    "id" TEXT NOT NULL,
    "scheduledCourseId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "nomeFile" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "dataGenerazione" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "numeroProgressivo" INTEGER NOT NULL,
    "annoProgressivo" INTEGER NOT NULL,
    "formatoreId" TEXT NOT NULL,
    "eliminato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RegistroPresenze_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroPresenzePartecipante" (
    "id" TEXT NOT NULL,
    "registroId" TEXT NOT NULL,
    "partecipanteId" TEXT NOT NULL,
    "eliminato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RegistroPresenzePartecipante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Preventivo" (
    "id" TEXT NOT NULL,
    "scheduledCourseId" TEXT NOT NULL,
    "nomeFile" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "dataGenerazione" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "numeroProgressivo" INTEGER NOT NULL,
    "annoProgressivo" INTEGER NOT NULL,
    "eliminato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Preventivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreventivoPartecipante" (
    "id" TEXT NOT NULL,
    "preventivoId" TEXT NOT NULL,
    "partecipanteId" TEXT NOT NULL,
    "eliminato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PreventivoPartecipante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreventivoAzienda" (
    "id" TEXT NOT NULL,
    "preventivoId" TEXT NOT NULL,
    "aziendaId" TEXT NOT NULL,
    "eliminato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PreventivoAzienda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fattura" (
    "id" TEXT NOT NULL,
    "scheduledCourseId" TEXT NOT NULL,
    "nomeFile" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "dataGenerazione" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "numeroProgressivo" INTEGER NOT NULL,
    "annoProgressivo" INTEGER NOT NULL,
    "eliminato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Fattura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FatturaAzienda" (
    "id" TEXT NOT NULL,
    "fatturaId" TEXT NOT NULL,
    "aziendaId" TEXT NOT NULL,
    "eliminato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FatturaAzienda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "profileImage" TEXT,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "companyId" TEXT,
    "tenantId" TEXT,
    "globalRole" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eliminato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "description" TEXT,
    "permissions" JSONB,
    "isSystemRole" BOOLEAN NOT NULL DEFAULT false,
    "companyId" TEXT,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eliminato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eliminato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eliminato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestDocument" (
    "id" TEXT NOT NULL,
    "scheduledCourseId" TEXT NOT NULL,
    "trainerId" TEXT,
    "nomeFile" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "dataGenerazione" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "numeroProgressivo" INTEGER NOT NULL,
    "annoProgressivo" INTEGER NOT NULL,
    "stato" TEXT NOT NULL DEFAULT 'generato',
    "tipologia" TEXT NOT NULL DEFAULT 'test',
    "punteggio" DOUBLE PRECISION,
    "durata" INTEGER,
    "note" TEXT,
    "dataTest" TIMESTAMP(3),
    "sogliaSuperamento" DOUBLE PRECISION,
    "eliminato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TestDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestPartecipante" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "partecipanteId" TEXT NOT NULL,
    "punteggio" DOUBLE PRECISION,
    "stato" TEXT NOT NULL DEFAULT 'da completare',
    "note" TEXT,
    "dataConsegna" TIMESTAMP(3),
    "tempoImpiegato" INTEGER,
    "eliminato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TestPartecipante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "deviceInfo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "eliminato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "eliminato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GdprAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "dataAccessed" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eliminato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "GdprAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consentType" TEXT NOT NULL,
    "consentGiven" BOOLEAN NOT NULL,
    "consentVersion" TEXT,
    "givenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawnAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "eliminato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "deviceInfo" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eliminato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "billing_plan" TEXT NOT NULL DEFAULT 'basic',
    "max_users" INTEGER NOT NULL DEFAULT 50,
    "max_companies" INTEGER NOT NULL DEFAULT 10,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "eliminato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_configurations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "config_key" TEXT NOT NULL,
    "config_value" JSONB,
    "config_type" TEXT NOT NULL DEFAULT 'general',
    "is_encrypted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "eliminato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tenant_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enhanced_user_roles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "role_type" TEXT NOT NULL,
    "role_scope" TEXT NOT NULL DEFAULT 'tenant',
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "company_id" TEXT,
    "department_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "assigned_by" TEXT,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "eliminato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "enhanced_user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_usage" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "usage_type" TEXT NOT NULL,
    "usage_value" INTEGER NOT NULL DEFAULT 0,
    "usage_limit" INTEGER,
    "billing_period" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "eliminato" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tenant_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PermissionToRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Company_domain_key" ON "Company"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_codice_fiscale_key" ON "Employee"("codice_fiscale");

-- CreateIndex
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CourseEnrollment_scheduleId_employeeId_key" ON "CourseEnrollment"("scheduleId", "employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "LetteraIncarico_scheduledCourseId_trainerId_key" ON "LetteraIncarico"("scheduledCourseId", "trainerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_companyId_key" ON "Role"("name", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_sessionToken_key" ON "UserSession"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_domain_key" ON "tenants"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_configurations_tenant_id_config_key_key" ON "tenant_configurations"("tenant_id", "config_key");

-- CreateIndex
CREATE UNIQUE INDEX "enhanced_user_roles_user_id_tenant_id_role_type_company_id_key" ON "enhanced_user_roles"("user_id", "tenant_id", "role_type", "company_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_usage_tenant_id_usage_type_billing_period_key" ON "tenant_usage"("tenant_id", "usage_type", "billing_period");

-- CreateIndex
CREATE UNIQUE INDEX "_PermissionToRole_AB_unique" ON "_PermissionToRole"("A", "B");

-- CreateIndex
CREATE INDEX "_PermissionToRole_B_index" ON "_PermissionToRole"("B");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSchedule" ADD CONSTRAINT "CourseSchedule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSchedule" ADD CONSTRAINT "CourseSchedule_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSchedule" ADD CONSTRAINT "CourseSchedule_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "CourseSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trainer" ADD CONSTRAINT "Trainer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSession" ADD CONSTRAINT "CourseSession_coTrainerId_fkey" FOREIGN KEY ("coTrainerId") REFERENCES "Trainer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSession" ADD CONSTRAINT "CourseSession_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "CourseSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSession" ADD CONSTRAINT "CourseSession_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleCompany" ADD CONSTRAINT "ScheduleCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleCompany" ADD CONSTRAINT "ScheduleCompany_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "CourseSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attestato" ADD CONSTRAINT "Attestato_partecipanteId_fkey" FOREIGN KEY ("partecipanteId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attestato" ADD CONSTRAINT "Attestato_scheduledCourseId_fkey" FOREIGN KEY ("scheduledCourseId") REFERENCES "CourseSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateLink" ADD CONSTRAINT "TemplateLink_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LetteraIncarico" ADD CONSTRAINT "LetteraIncarico_scheduledCourseId_fkey" FOREIGN KEY ("scheduledCourseId") REFERENCES "CourseSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LetteraIncarico" ADD CONSTRAINT "LetteraIncarico_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroPresenze" ADD CONSTRAINT "RegistroPresenze_formatoreId_fkey" FOREIGN KEY ("formatoreId") REFERENCES "Trainer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroPresenze" ADD CONSTRAINT "RegistroPresenze_scheduledCourseId_fkey" FOREIGN KEY ("scheduledCourseId") REFERENCES "CourseSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroPresenze" ADD CONSTRAINT "RegistroPresenze_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CourseSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroPresenzePartecipante" ADD CONSTRAINT "RegistroPresenzePartecipante_partecipanteId_fkey" FOREIGN KEY ("partecipanteId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroPresenzePartecipante" ADD CONSTRAINT "RegistroPresenzePartecipante_registroId_fkey" FOREIGN KEY ("registroId") REFERENCES "RegistroPresenze"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preventivo" ADD CONSTRAINT "Preventivo_scheduledCourseId_fkey" FOREIGN KEY ("scheduledCourseId") REFERENCES "CourseSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreventivoPartecipante" ADD CONSTRAINT "PreventivoPartecipante_partecipanteId_fkey" FOREIGN KEY ("partecipanteId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreventivoPartecipante" ADD CONSTRAINT "PreventivoPartecipante_preventivoId_fkey" FOREIGN KEY ("preventivoId") REFERENCES "Preventivo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreventivoAzienda" ADD CONSTRAINT "PreventivoAzienda_aziendaId_fkey" FOREIGN KEY ("aziendaId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreventivoAzienda" ADD CONSTRAINT "PreventivoAzienda_preventivoId_fkey" FOREIGN KEY ("preventivoId") REFERENCES "Preventivo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fattura" ADD CONSTRAINT "Fattura_scheduledCourseId_fkey" FOREIGN KEY ("scheduledCourseId") REFERENCES "CourseSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FatturaAzienda" ADD CONSTRAINT "FatturaAzienda_aziendaId_fkey" FOREIGN KEY ("aziendaId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FatturaAzienda" ADD CONSTRAINT "FatturaAzienda_fatturaId_fkey" FOREIGN KEY ("fatturaId") REFERENCES "Fattura"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestDocument" ADD CONSTRAINT "TestDocument_scheduledCourseId_fkey" FOREIGN KEY ("scheduledCourseId") REFERENCES "CourseSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestDocument" ADD CONSTRAINT "TestDocument_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestPartecipante" ADD CONSTRAINT "TestPartecipante_partecipanteId_fkey" FOREIGN KEY ("partecipanteId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestPartecipante" ADD CONSTRAINT "TestPartecipante_testId_fkey" FOREIGN KEY ("testId") REFERENCES "TestDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GdprAuditLog" ADD CONSTRAINT "GdprAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_configurations" ADD CONSTRAINT "tenant_configurations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enhanced_user_roles" ADD CONSTRAINT "enhanced_user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enhanced_user_roles" ADD CONSTRAINT "enhanced_user_roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enhanced_user_roles" ADD CONSTRAINT "enhanced_user_roles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enhanced_user_roles" ADD CONSTRAINT "enhanced_user_roles_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_usage" ADD CONSTRAINT "tenant_usage_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
