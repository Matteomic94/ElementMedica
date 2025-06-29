/**
 * Versione debug del middleware authenticate con logging dettagliato
 * per identificare dove si blocca
 */

import { PrismaClient } from '@prisma/client';
import JWTService from '../services/jwt-advanced.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Extract token from request headers or cookies
 */
function extractToken(req) {
    console.log('🔍 [MIDDLEWARE DEBUG] Step 1: Extracting token...');
    
    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        console.log('✅ [MIDDLEWARE DEBUG] Token extracted from Authorization header');
        return token;
    }
    
    // Check cookies
    const cookieToken = req.cookies?.accessToken;
    if (cookieToken) {
        console.log('✅ [MIDDLEWARE DEBUG] Token extracted from cookies');
        return cookieToken;
    }
    
    console.log('❌ [MIDDLEWARE DEBUG] No token found');
    return null;
}

/**
 * Authentication middleware with detailed debugging
 */
export function authenticateDebug() {
    return async (req, res, next) => {
        console.log('\n🔍 [MIDDLEWARE DEBUG] ===== AUTHENTICATE START =====');
        console.log(`🔍 [MIDDLEWARE DEBUG] Request: ${req.method} ${req.path}`);
        console.log(`🔍 [MIDDLEWARE DEBUG] Timestamp: ${new Date().toISOString()}`);
        
        try {
            // Step 1: Extract token
            console.log('🔍 [MIDDLEWARE DEBUG] Step 1: Extracting token...');
            const token = extractToken(req);
            
            if (!token) {
                console.log('❌ [MIDDLEWARE DEBUG] No token provided');
                return res.status(401).json({
                    error: 'No token provided',
                    code: 'AUTH_TOKEN_MISSING'
                });
            }
            console.log('✅ [MIDDLEWARE DEBUG] Step 1 completed - Token extracted');
            
            // Step 2: Verify JWT
            console.log('🔍 [MIDDLEWARE DEBUG] Step 2: Verifying JWT...');
            const startJWTVerify = Date.now();
            
            const decoded = await JWTService.verifyAccessToken(token);
            
            const jwtVerifyTime = Date.now() - startJWTVerify;
            console.log(`✅ [MIDDLEWARE DEBUG] Step 2 completed - JWT verified in ${jwtVerifyTime}ms`);
            console.log(`🔍 [MIDDLEWARE DEBUG] Decoded user ID: ${decoded.userId}`);
            
            // Step 3: Find person in database
            console.log('🔍 [MIDDLEWARE DEBUG] Step 3: Finding person in database...');
            const startPersonQuery = Date.now();
            
            const person = await prisma.person.findUnique({
                where: { id: decoded.userId }
            });
            
            const personQueryTime = Date.now() - startPersonQuery;
            console.log(`✅ [MIDDLEWARE DEBUG] Step 3 completed - Person query in ${personQueryTime}ms`);
            
            if (!person) {
                console.log('❌ [MIDDLEWARE DEBUG] Person not found in database');
                return res.status(401).json({
                    error: 'User not found',
                    code: 'AUTH_USER_NOT_FOUND'
                });
            }
            console.log(`🔍 [MIDDLEWARE DEBUG] Person found: ${person.email}`);
            
            // Step 4: Find person roles
            console.log('🔍 [MIDDLEWARE DEBUG] Step 4: Finding person roles...');
            const startRolesQuery = Date.now();
            
            const personRoles = await prisma.personRole.findMany({
                where: { 
                    personId: person.id,
                    isActive: true 
                },
                include: {
                    company: true,
                    tenant: true
                }
            });
            
            const rolesQueryTime = Date.now() - startRolesQuery;
            console.log(`✅ [MIDDLEWARE DEBUG] Step 4 completed - Roles query in ${rolesQueryTime}ms`);
            console.log(`🔍 [MIDDLEWARE DEBUG] Found ${personRoles.length} roles`);
            
            // Step 5: Get company
            console.log('🔍 [MIDDLEWARE DEBUG] Step 5: Getting company...');
            const startCompanyQuery = Date.now();
            
            const company = person?.companyId ? await prisma.company.findUnique({
                where: { id: person.companyId }
            }) : null;
            
            const companyQueryTime = Date.now() - startCompanyQuery;
            console.log(`✅ [MIDDLEWARE DEBUG] Step 5 completed - Company query in ${companyQueryTime}ms`);
            
            // Step 6: Get tenant
            console.log('🔍 [MIDDLEWARE DEBUG] Step 6: Getting tenant...');
            const startTenantQuery = Date.now();
            
            const tenant = person?.tenantId ? await prisma.tenant.findUnique({
                where: { id: person.tenantId }
            }) : null;
            
            const tenantQueryTime = Date.now() - startTenantQuery;
            console.log(`✅ [MIDDLEWARE DEBUG] Step 6 completed - Tenant query in ${tenantQueryTime}ms`);
            
            // Step 7: Check person status
            console.log('🔍 [MIDDLEWARE DEBUG] Step 7: Checking person status...');
            
            if (!person || !person.isActive || person.isDeleted) {
                console.log('❌ [MIDDLEWARE DEBUG] Person inactive or deleted');
                return res.status(401).json({
                    error: 'Person not found or inactive',
                    code: 'AUTH_USER_INACTIVE'
                });
            }
            
            // Check if person is locked
            if (person.lockedUntil && person.lockedUntil > new Date()) {
                console.log('❌ [MIDDLEWARE DEBUG] Person account locked');
                return res.status(423).json({
                    error: 'Account is temporarily locked',
                    code: 'AUTH_ACCOUNT_LOCKED',
                    lockedUntil: person.lockedUntil
                });
            }
            
            console.log('✅ [MIDDLEWARE DEBUG] Step 7 completed - Person status OK');
            
            // Step 8: Update last login (skip for verify endpoint)
            if (!req.path.includes('/verify')) {
                console.log('🔍 [MIDDLEWARE DEBUG] Step 8: Updating last login...');
                const startUpdateQuery = Date.now();
                
                await prisma.person.update({
                    where: { id: person.id },
                    data: { lastLogin: new Date() }
                });
                
                const updateQueryTime = Date.now() - startUpdateQuery;
                console.log(`✅ [MIDDLEWARE DEBUG] Step 8 completed - Last login updated in ${updateQueryTime}ms`);
            } else {
                console.log('🔍 [MIDDLEWARE DEBUG] Step 8: Skipped (verify endpoint)');
            }
            
            // Step 9: Attach user to request
            console.log('🔍 [MIDDLEWARE DEBUG] Step 9: Attaching user to request...');
            
            req.user = {
                id: person.id,
                personId: person.id,
                email: person.email,
                username: person.username,
                taxCode: person.taxCode,
                firstName: person.firstName,
                lastName: person.lastName,
                companyId: person.companyId,
                tenantId: person.tenantId,
                roles: personRoles.map(pr => pr.roleType).filter(Boolean),
                permissions: [], // TODO: implement permissions
                company: company,
                tenant: tenant,
                isVerified: person.isVerified,
                lastLogin: person.lastLogin
            };
            
            console.log('✅ [MIDDLEWARE DEBUG] Step 9 completed - User attached to request');
            console.log('🔍 [MIDDLEWARE DEBUG] ===== AUTHENTICATE SUCCESS =====\n');
            
            next();
            
        } catch (error) {
            console.log('❌ [MIDDLEWARE DEBUG] ===== AUTHENTICATE ERROR =====');
            console.log(`❌ [MIDDLEWARE DEBUG] Error: ${error.message}`);
            console.log(`❌ [MIDDLEWARE DEBUG] Stack: ${error.stack}`);
            console.log('❌ [MIDDLEWARE DEBUG] ===== AUTHENTICATE ERROR END =====\n');
            
            logger.error('Authentication failed', {
                component: 'auth-middleware-debug',
                action: 'authenticate',
                error: error.message,
                stack: error.stack,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            
            if (error.message.includes('jwt expired')) {
                return res.status(401).json({
                    error: 'Token expired',
                    code: 'AUTH_TOKEN_EXPIRED'
                });
            }
            
            return res.status(401).json({
                error: 'Invalid token',
                code: 'AUTH_TOKEN_INVALID'
            });
        }
    };
}