/*
  Warnings:

  - A unique constraint covering the columns `[name,companyId]` on the table `Role` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "person_status" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED', 'PENDING');

-- CreateEnum
CREATE TYPE "role_types" AS ENUM ('EMPLOYEE', 'MANAGER', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'TRAINER', 'SENIOR_TRAINER', 'TRAINER_COORDINATOR', 'EXTERNAL_TRAINER', 'SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'TENANT_ADMIN', 'VIEWER', 'OPERATOR', 'COORDINATOR', 'SUPERVISOR', 'GUEST', 'CONSULTANT', 'AUDITOR');

-- CreateEnum
CREATE TYPE "person_permissions" AS ENUM ('VIEW_EMPLOYEES', 'CREATE_EMPLOYEES', 'EDIT_EMPLOYEES', 'DELETE_EMPLOYEES', 'VIEW_TRAINERS', 'CREATE_TRAINERS', 'EDIT_TRAINERS', 'DELETE_TRAINERS', 'VIEW_USERS', 'CREATE_USERS', 'EDIT_USERS', 'DELETE_USERS', 'VIEW_COURSES', 'CREATE_COURSES', 'EDIT_COURSES', 'DELETE_COURSES', 'MANAGE_ENROLLMENTS', 'CREATE_DOCUMENTS', 'EDIT_DOCUMENTS', 'DELETE_DOCUMENTS', 'DOWNLOAD_DOCUMENTS', 'ADMIN_PANEL', 'SYSTEM_SETTINGS', 'USER_MANAGEMENT', 'ROLE_MANAGEMENT', 'TENANT_MANAGEMENT', 'VIEW_GDPR_DATA', 'EXPORT_GDPR_DATA', 'DELETE_GDPR_DATA', 'MANAGE_CONSENTS', 'VIEW_REPORTS', 'CREATE_REPORTS', 'EXPORT_REPORTS');

-- DropIndex
DROP INDEX "Role_companyId_idx";

-- DropIndex
DROP INDEX "Role_name_key";

-- DropIndex
DROP INDEX "UserRole_userId_roleId_key";

-- CreateTable
CREATE TABLE "persons" (
    "id" TEXT NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "birthDate" DATE,
    "taxCode" VARCHAR(16),
    "vatNumber" VARCHAR(11),
    "residenceAddress" VARCHAR(255),
    "residenceCity" VARCHAR(100),
    "postalCode" VARCHAR(10),
    "province" VARCHAR(2),
    "username" VARCHAR(50),
    "password" VARCHAR(255),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" "person_status" NOT NULL DEFAULT 'ACTIVE',
    "title" VARCHAR(100),
    "hiredDate" DATE,
    "hourlyRate" DECIMAL(10,2),
    "iban" VARCHAR(34),
    "registerCode" VARCHAR(50),
    "certifications" TEXT[],
    "specialties" TEXT[],
    "profileImage" VARCHAR(500),
    "notes" TEXT,
    "lastLogin" TIMESTAMP,
    "failedAttempts" SMALLINT NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP,
    "globalRole" VARCHAR(50),
    "tenantId" TEXT,
    "companyId" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    "deletedAt" TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "gdprConsentDate" TIMESTAMP,
    "gdprConsentVersion" VARCHAR(10),
    "dataRetentionUntil" DATE,

    CONSTRAINT "persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_roles" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "roleType" "role_types" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,
    "validFrom" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" DATE,
    "companyId" TEXT,
    "tenantId" TEXT,
    "departmentId" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,

    CONSTRAINT "person_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "personRoleId" TEXT NOT NULL,
    "permission" "person_permissions" NOT NULL,
    "isGranted" BOOLEAN NOT NULL DEFAULT true,
    "grantedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "persons_email_key" ON "persons"("email");

-- CreateIndex
CREATE UNIQUE INDEX "persons_taxCode_key" ON "persons"("taxCode");

-- CreateIndex
CREATE UNIQUE INDEX "persons_username_key" ON "persons"("username");

-- CreateIndex
CREATE INDEX "persons_email_idx" ON "persons"("email");

-- CreateIndex
CREATE INDEX "persons_username_idx" ON "persons"("username");

-- CreateIndex
CREATE INDEX "persons_companyId_idx" ON "persons"("companyId");

-- CreateIndex
CREATE INDEX "persons_tenantId_idx" ON "persons"("tenantId");

-- CreateIndex
CREATE INDEX "persons_isDeleted_isActive_idx" ON "persons"("isDeleted", "isActive");

-- CreateIndex
CREATE INDEX "persons_createdAt_idx" ON "persons"("createdAt");

-- CreateIndex
CREATE INDEX "person_roles_personId_isActive_idx" ON "person_roles"("personId", "isActive");

-- CreateIndex
CREATE INDEX "person_roles_roleType_idx" ON "person_roles"("roleType");

-- CreateIndex
CREATE INDEX "person_roles_companyId_idx" ON "person_roles"("companyId");

-- CreateIndex
CREATE INDEX "person_roles_tenantId_idx" ON "person_roles"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "person_roles_personId_roleType_companyId_tenantId_key" ON "person_roles"("personId", "roleType", "companyId", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_personRoleId_permission_key" ON "role_permissions"("personRoleId", "permission");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_companyId_key" ON "Role"("name", "companyId");

-- AddForeignKey
ALTER TABLE "persons" ADD CONSTRAINT "persons_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persons" ADD CONSTRAINT "persons_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_roles" ADD CONSTRAINT "person_roles_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_roles" ADD CONSTRAINT "person_roles_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_roles" ADD CONSTRAINT "person_roles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_roles" ADD CONSTRAINT "person_roles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_personRoleId_fkey" FOREIGN KEY ("personRoleId") REFERENCES "person_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_grantedBy_fkey" FOREIGN KEY ("grantedBy") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Data Migration: Transfer data from existing entities to Person
-- 1. Migrate Employee data
INSERT INTO "persons" (
    "id", "firstName", "lastName", "email", "phone", "birthDate", "taxCode", 
    "residenceAddress", "residenceCity", "postalCode", "province", "title", 
    "hiredDate", "profileImage", "notes", "status", 
    "companyId", "createdAt", "updatedAt"
)
SELECT 
    e."id",
    e."first_name",
    e."last_name",
    e."email",
    e."phone",
    e."birth_date",
    e."codice_fiscale",
    e."residence_address",
    e."residence_city",
    e."postal_code",
    e."province",
    e."title",
    e."hired_date",
    e."photo_url",
    e."notes",
    CASE 
        WHEN e."eliminato" = false THEN 'ACTIVE'::"person_status"
        ELSE 'INACTIVE'::"person_status"
    END,
    e."companyId",
    e."created_at",
    e."updated_at"
FROM "Employee" e
WHERE e."id" NOT IN (SELECT "id" FROM "persons");

-- 2. Migrate Trainer data
INSERT INTO "persons" (
    "id", "firstName", "lastName", "email", "phone", "birthDate", "taxCode", 
    "vatNumber", "residenceAddress", "residenceCity", "postalCode", "province", 
    "hourlyRate", "iban", "registerCode", "certifications", "specialties", 
    "notes", "status", "tenantId", "createdAt", "updatedAt"
)
SELECT 
    t."id",
    t."first_name",
    t."last_name",
    t."email",
    t."phone",
    t."birth_date",
    t."tax_code",
    t."vat_number",
    t."residence_address",
    t."residence_city",
    t."postal_code",
    t."province",
    t."tariffa_oraria",
    t."iban",
    t."register_code",
    t."certifications",
    t."specialties",
    t."notes",
    CASE 
        WHEN t."eliminato" = false THEN 'ACTIVE'::"person_status"
        ELSE 'INACTIVE'::"person_status"
    END,
    t."tenantId",
    t."created_at",
    t."updated_at"
FROM "Trainer" t
WHERE t."id" NOT IN (SELECT "id" FROM "persons");

-- 3. Migrate User data (only users not already migrated as Employee or Trainer)
INSERT INTO "persons" (
    "id", "firstName", "lastName", "email", "username", "password", 
    "isActive", "status", "lastLogin", "failedAttempts", "lockedUntil", 
    "globalRole", "tenantId", "createdAt", "updatedAt"
)
SELECT 
    u."id",
    COALESCE(u."firstName", 'Nome'),
    COALESCE(u."lastName", 'Cognome'),
    u."email",
    u."username",
    u."password",
    u."isActive",
    CASE 
        WHEN u."isActive" = true THEN 'ACTIVE'::"person_status"
        ELSE 'INACTIVE'::"person_status"
    END,
    u."lastLogin",
    u."failedAttempts",
    u."lockedUntil",
    u."globalRole",
    u."tenantId",
    u."createdAt",
    u."updatedAt"
FROM "User" u
WHERE u."id" NOT IN (SELECT "id" FROM "persons");

-- 4. Create PersonRole entries for Employees
INSERT INTO "person_roles" (
    "id", "personId", "roleType", "isActive", "isPrimary", "companyId", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid(),
    e."id",
    'EMPLOYEE'::"role_types",
    CASE WHEN e."eliminato" = false THEN true ELSE false END,
    true,
    e."companyId",
    NOW(),
    NOW()
FROM "Employee" e;

-- 5. Create PersonRole entries for Trainers
INSERT INTO "person_roles" (
    "id", "personId", "roleType", "isActive", "isPrimary", "tenantId", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid(),
    t."id",
    CASE 
        WHEN t."register_code" IS NOT NULL THEN 'SENIOR_TRAINER'::"role_types"
        ELSE 'TRAINER'::"role_types"
    END,
    CASE WHEN t."eliminato" = false THEN true ELSE false END,
    true,
    t."tenantId",
    NOW(),
    NOW()
FROM "Trainer" t;

-- 6. Create PersonRole entries for Users based on their existing roles
INSERT INTO "person_roles" (
    "id", "personId", "roleType", "isActive", "isPrimary", "tenantId", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid(),
    u."id",
    CASE 
        WHEN u."globalRole" = 'super_admin' THEN 'SUPER_ADMIN'::"role_types"
        WHEN u."globalRole" = 'admin' THEN 'ADMIN'::"role_types"
        WHEN u."globalRole" = 'company_admin' THEN 'COMPANY_ADMIN'::"role_types"
        WHEN u."globalRole" = 'tenant_admin' THEN 'TENANT_ADMIN'::"role_types"
        ELSE 'VIEWER'::"role_types"
    END,
    u."isActive",
    true,
    u."tenantId",
    NOW(),
    NOW()
FROM "User" u
WHERE u."id" NOT IN (
    SELECT e."id" FROM "Employee" e 
    UNION 
    SELECT t."id" FROM "Trainer" t
);

-- 7. Migrate UserRole relationships to PersonRole
INSERT INTO "person_roles" (
    "id", "personId", "roleType", "isActive", "isPrimary", "companyId", "tenantId", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid(),
    ur."userId",
    CASE 
        WHEN r."name" ILIKE '%admin%' THEN 'ADMIN'::"role_types"
        WHEN r."name" ILIKE '%manager%' THEN 'MANAGER'::"role_types"
        WHEN r."name" ILIKE '%hr%' THEN 'HR_MANAGER'::"role_types"
        WHEN r."name" ILIKE '%trainer%' THEN 'TRAINER'::"role_types"
        ELSE 'EMPLOYEE'::"role_types"
    END,
    ur."isActive",
    false,
    r."companyId",
    r."tenantId",
    ur."assignedAt",
    NOW()
FROM "UserRole" ur
JOIN "Role" r ON ur."roleId" = r."id"
WHERE ur."userId" IN (SELECT "id" FROM "persons");

-- 8. Create basic permissions for migrated roles
-- Admin permissions
INSERT INTO "role_permissions" (
    "id", "personRoleId", "permission", "isGranted", "grantedAt"
)
SELECT 
    gen_random_uuid(),
    pr."id",
    perm.permission,
    true,
    NOW()
FROM "person_roles" pr
CROSS JOIN (
    VALUES 
        ('ADMIN_PANEL'::"person_permissions"),
        ('USER_MANAGEMENT'::"person_permissions"),
        ('ROLE_MANAGEMENT'::"person_permissions"),
        ('VIEW_EMPLOYEES'::"person_permissions"),
        ('CREATE_EMPLOYEES'::"person_permissions"),
        ('EDIT_EMPLOYEES'::"person_permissions"),
        ('VIEW_TRAINERS'::"person_permissions"),
        ('CREATE_TRAINERS'::"person_permissions"),
        ('EDIT_TRAINERS'::"person_permissions"),
        ('VIEW_COURSES'::"person_permissions"),
        ('CREATE_COURSES'::"person_permissions"),
        ('EDIT_COURSES'::"person_permissions")
) AS perm(permission)
WHERE pr."roleType" IN ('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'TENANT_ADMIN');

-- Employee permissions
INSERT INTO "role_permissions" (
    "id", "personRoleId", "permission", "isGranted", "grantedAt"
)
SELECT 
    gen_random_uuid(),
    pr."id",
    perm.permission,
    true,
    NOW()
FROM "person_roles" pr
CROSS JOIN (
    VALUES 
        ('VIEW_COURSES'::"person_permissions"),
        ('VIEW_EMPLOYEES'::"person_permissions")
) AS perm(permission)
WHERE pr."roleType" = 'EMPLOYEE';

-- Trainer permissions
INSERT INTO "role_permissions" (
    "id", "personRoleId", "permission", "isGranted", "grantedAt"
)
SELECT 
    gen_random_uuid(),
    pr."id",
    perm.permission,
    true,
    NOW()
FROM "person_roles" pr
CROSS JOIN (
    VALUES 
        ('VIEW_COURSES'::"person_permissions"),
        ('CREATE_COURSES'::"person_permissions"),
        ('EDIT_COURSES'::"person_permissions"),
        ('MANAGE_ENROLLMENTS'::"person_permissions"),
        ('CREATE_DOCUMENTS'::"person_permissions"),
        ('VIEW_EMPLOYEES'::"person_permissions")
) AS perm(permission)
WHERE pr."roleType" IN ('TRAINER', 'SENIOR_TRAINER', 'TRAINER_COORDINATOR');
