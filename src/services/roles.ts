import { createService } from './serviceFactory';
import { Role, RoleCreateDTO, RoleUpdateDTO, Permission } from '../types';
import { apiGet } from './api';

const baseService = createService<Role, RoleCreateDTO, RoleUpdateDTO>('/roles');

// Estendi il servizio con metodi specifici
const rolesService = baseService.extend({
  getPermissions: async (): Promise<Permission[]> => {
    return apiGet<Permission[]>('/permissions');
  }
});

export const getRoles = rolesService.getAll;
export const getRoleById = rolesService.getById;
export const createRole = rolesService.create;
export const updateRole = rolesService.update;
export const deleteRole = rolesService.delete;
export const getPermissions = rolesService.getPermissions;

export default {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getPermissions
}; 