import React, { useState, useEffect } from 'react';
import { Role, Permission, RoleCreateDTO, RoleUpdateDTO } from '../../types';
import { getRoles, createRole, updateRole, deleteRole, getPermissions } from '../../services/roles';
import { Plus, Edit, Trash, Users, Shield } from 'lucide-react';

const RolesTab: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);

  // Form state
  const [formData, setFormData] = useState<RoleCreateDTO | RoleUpdateDTO>({
    name: '',
    description: '',
    permissionIds: []
  });

  // Group permissions by resource for better organization
  const groupedPermissions: Record<string, Permission[]> = permissions.reduce((acc, permission) => {
    const { resource } = permission;
    if (!acc[resource]) acc[resource] = [];
    acc[resource].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Fetch roles and permissions
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [rolesData, permissionsData] = await Promise.all([
          getRoles(),
          getPermissions()
        ]);
        setRoles(rolesData);
        setPermissions(permissionsData);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Errore nel caricamento dei ruoli');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePermissionChange = (permissionId: string) => {
    const permissionIds = formData.permissionIds || [];
    const newPermissionIds = permissionIds.includes(permissionId)
      ? permissionIds.filter(id => id !== permissionId)
      : [...permissionIds, permissionId];
    
    setFormData({ ...formData, permissionIds: newPermissionIds });
  };

  const handleResourcePermissions = (resource: string, checked: boolean) => {
    const resourcePermissionIds = permissions
      .filter(p => p.resource === resource)
      .map(p => p.id);
    
    let currentPermissionIds = formData.permissionIds || [];
    
    if (checked) {
      // Aggiungi tutte le autorizzazioni per questa risorsa che non sono già selezionate
      const newIds = resourcePermissionIds.filter(id => !currentPermissionIds.includes(id));
      currentPermissionIds = [...currentPermissionIds, ...newIds];
    } else {
      // Rimuovi tutte le autorizzazioni per questa risorsa
      currentPermissionIds = currentPermissionIds.filter(id => !resourcePermissionIds.includes(id));
    }
    
    setFormData({ ...formData, permissionIds: currentPermissionIds });
  };

  const isResourceFullyChecked = (resource: string): boolean => {
    const resourcePermissionIds = permissions
      .filter(p => p.resource === resource)
      .map(p => p.id);
    
    const selectedPermissionIds = formData.permissionIds || [];
    return resourcePermissionIds.every(id => selectedPermissionIds.includes(id));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permissionIds: []
    });
    setCurrentRole(null);
    setIsEditing(false);
    setIsFormOpen(false);
  };

  const handleEditRole = (role: Role) => {
    setCurrentRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissionIds: role.permissions.map(p => p.id)
    });
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      if (isEditing && currentRole) {
        const updatedRole = await updateRole(currentRole.id, formData);
        setRoles(roles.map(role => role.id === updatedRole.id ? updatedRole : role));
      } else {
        // Casting formData to RoleCreateDTO to ensure name is not undefined
        const createData: RoleCreateDTO = {
          name: formData.name as string,
          description: formData.description,
          permissionIds: formData.permissionIds
        };
        const newRole = await createRole(createData);
        setRoles([...roles, newRole]);
      }
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Errore durante il salvataggio');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo ruolo?')) return;
    
    try {
      await deleteRole(roleId);
      setRoles(roles.filter(role => role.id !== roleId));
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Errore durante l\'eliminazione');
    }
  };

  if (isLoading) {
    return <div className="p-4 flex justify-center">Caricamento...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium text-gray-900">Gestione Ruoli</h2>
        <button 
          onClick={() => { resetForm(); setIsFormOpen(!isFormOpen); }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Ruolo
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {isFormOpen && (
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-medium mb-4">
            {isEditing ? 'Modifica Ruolo' : 'Nuovo Ruolo'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nome Ruolo
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Descrizione
                </label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permessi
                </label>
                <div className="border border-gray-200 rounded-md p-3 max-h-96 overflow-y-auto">
                  {Object.entries(groupedPermissions).map(([resource, perms]) => (
                    <div key={resource} className="mb-4">
                      <div className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          id={`resource-${resource}`}
                          checked={isResourceFullyChecked(resource)}
                          onChange={(e) => handleResourcePermissions(resource, e.target.checked)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                        <label htmlFor={`resource-${resource}`} className="ml-2 text-sm font-medium text-gray-700 capitalize">
                          {resource}
                        </label>
                      </div>
                      <div className="ml-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                        {perms.map(permission => (
                          <div key={permission.id} className="flex items-center">
                            <input
                              type="checkbox"
                              id={permission.id}
                              checked={(formData.permissionIds || []).includes(permission.id)}
                              onChange={() => handlePermissionChange(permission.id)}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                            <label htmlFor={permission.id} className="ml-2 text-sm text-gray-600 capitalize">
                              {permission.action}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                {isEditing ? 'Aggiorna' : 'Salva'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-2xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ruolo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descrizione
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utenti
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Permessi
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {roles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  Nessun ruolo trovato
                </td>
              </tr>
            ) : (
              roles.map(role => (
                <tr key={role.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {role.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {role.description || 'Nessuna descrizione'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-500">
                        {role._count?.users || 0} utenti
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {/* Raggruppa i permessi per risorsa e mostra il numero di permessi per tipo */}
                      {Object.entries(role.permissions.reduce((acc, p) => {
                        if (!acc[p.resource]) acc[p.resource] = 0;
                        acc[p.resource]++;
                        return acc;
                      }, {} as Record<string, number>)).map(([resource, count]) => (
                        <span 
                          key={resource} 
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 capitalize"
                        >
                          <Shield className="w-3 h-3 mr-1" />
                          {resource} ({count})
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditRole(role)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {/* Non permettere l'eliminazione se ci sono utenti associati */}
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      className={`text-red-600 hover:text-red-900 ${role._count && role._count.users > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={role._count && role._count.users > 0}
                      title={role._count && role._count.users > 0 ? 
                        'Impossibile eliminare un ruolo con utenti associati' : 
                        'Elimina ruolo'
                      }
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RolesTab;