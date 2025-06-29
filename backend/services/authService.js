import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

class AuthService {
  /**
   * Trova una persona per login (email, username o codice fiscale)
   */
  async findPersonForLogin(identifier) {
    try {
      // Cerca per email, username o codice fiscale
      const person = await prisma.person.findFirst({
        where: {
          OR: [
            { email: identifier },
            { username: identifier },
            { taxCode: identifier }
          ],
          isActive: true,
          isDeleted: false
        },
        include: {
          personRoles: {
            where: { isActive: true },
            include: {
              company: true,
              tenant: true
            }
          },
          company: true,
          tenant: true
        }
      });

      return person;
    } catch (error) {
      logger.error('Error finding person for login:', { error: error.message, identifier });
      throw error;
    }
  }

  /**
   * Verifica le credenziali di login
   */
  async verifyCredentials(identifier, password) {
    try {
      const person = await this.findPersonForLogin(identifier);
      
      if (!person) {
        return { success: false, error: 'Person not found' };
      }

      if (!person.password) {
        return { success: false, error: 'No password set for this person' };
      }

      const isValidPassword = await bcrypt.compare(password, person.password);
      
      if (!isValidPassword) {
        return { success: false, error: 'Invalid password' };
      }

      return { success: true, person };
    } catch (error) {
      logger.error('Error verifying credentials:', { error: error.message });
      throw error;
    }
  }

  /**
   * Genera i token JWT per una persona
   */
  generateTokens(person, rememberMe = false) {
    try {
      const roles = person.personRoles.map(pr => pr.roleType);
      
      const tokenPayload = {
        userId: person.id,
        personId: person.id,
        email: person.email,
        username: person.username,
        taxCode: person.taxCode,
        companyId: person.companyId,
        tenantId: person.tenantId,
        roles
      };

      const accessTokenExpiry = rememberMe ? '7d' : '1h';
      const refreshTokenExpiry = rememberMe ? '30d' : '7d';

      const accessToken = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET,
        { 
          expiresIn: accessTokenExpiry,
          issuer: 'training-platform',
          audience: 'training-platform-users'
        }
      );

      const refreshToken = jwt.sign(
        { personId: person.id },
        process.env.JWT_REFRESH_SECRET,
        { 
          expiresIn: refreshTokenExpiry,
          issuer: 'training-platform',
          audience: 'training-platform-users'
        }
      );

      return {
        accessToken,
        refreshToken,
        expiresIn: rememberMe ? 7 * 24 * 60 * 60 : 60 * 60 // seconds
      };
    } catch (error) {
      logger.error('Error generating tokens:', { error: error.message });
      throw error;
    }
  }

  /**
   * Aggiorna l'ultimo accesso
   */
  async updateLastLogin(personId) {
    try {
      await prisma.person.update({
        where: { id: personId },
        data: { lastLogin: new Date() }
      });
    } catch (error) {
      logger.error('Error updating last login:', { error: error.message, personId });
      throw error;
    }
  }

  /**
   * Salva il refresh token
   */
  async saveRefreshToken(token, personId, expiresAt, userAgent, ipAddress) {
    try {
      // Elimina i vecchi token scaduti o per questa persona
      await prisma.refreshToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { personId: personId } // Elimina i vecchi token per questa persona
          ]
        }
      });

      // Crea il nuovo token usando i campi corretti del schema
      await prisma.refreshToken.create({
        data: {
          token,
          personId: personId, // Ora usa personId invece di userId
          expiresAt,
          deviceInfo: {
            userAgent: userAgent || 'Unknown',
            ipAddress: ipAddress || 'Unknown'
          }
        }
      });
      
      logger.info('Refresh token saved successfully', { personId });
    } catch (error) {
      logger.error('Error saving refresh token:', { error: error.message });
      throw error;
    }
  }

  /**
   * Verifica se una persona ha un ruolo specifico
   */
  hasRole(person, roleType) {
    return person.personRoles.some(pr => pr.roleType === roleType && pr.isActive);
  }

  /**
   * Ottiene tutti i ruoli di una persona
   */
  getPersonRoles(person) {
    return person.personRoles
      .filter(pr => pr.isActive)
      .map(pr => pr.roleType);
  }
}

export default new AuthService();