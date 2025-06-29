import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TemplatesSettingsPage from './Templates';
import UsersTab from './UsersTab';
import RolesTab from './RolesTab';
import ActivityLogsTab from './ActivityLogsTab';
import UserPreferences from './UserPreferences';
import AdminSettings from '../../components/settings/AdminSettings';
import { useAuth } from '../../context/AuthContext';
import { Settings as SettingsIcon } from 'lucide-react';
import TabNavigation from '../../components/shared/TabNavigation';

const Settings: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  
  // Determina quale tab è attivo dalla URL o usa il default
  const getActiveTab = () => {
    if (location.pathname.endsWith('/users')) return 'users';
    if (location.pathname.endsWith('/roles')) return 'roles';
    if (location.pathname.endsWith('/logs')) return 'logs';
    if (location.pathname.endsWith('/templates')) return 'templates';
    return 'general';
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());

  const changeTab = (tabId: string) => {
    setActiveTab(tabId);
    navigate(`/settings${tabId !== 'general' ? `/${tabId}` : ''}`);
  };

  // Crea array di tab basato sui permessi
  const tabs = [
    { id: 'general', label: 'Generali' },
    { id: 'templates', label: 'Templates' },
  ];
  
  // Aggiungi i tab solo se l'utente ha i permessi
  if (hasPermission('users', 'read')) {
    tabs.push({ id: 'users', label: 'Utenti' });
  }
  
  if (hasPermission('roles', 'read')) {
    tabs.push({ id: 'roles', label: 'Ruoli' });
  }
  
  if (hasPermission('logs', 'read')) {
    tabs.push({ id: 'logs', label: 'Log Attività' });
  }

  return (
    <div className="container px-4 mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <SettingsIcon className="mr-2 h-6 w-6" /> 
        Impostazioni
      </h1>

      <div className="bg-white rounded-2xl shadow-sm">
        {/* Tabs - usando TabNavigation */}
        <div className="border-b border-gray-200 p-4">
          <TabNavigation 
            tabs={tabs}
            activeTabId={activeTab}
            onTabChange={changeTab}
          />
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'general' && <UserPreferences />}

          {activeTab === 'templates' && <TemplatesSettingsPage />}
          
          {activeTab === 'users' && hasPermission('users', 'read') && (
            hasPermission('system', 'admin') ? <AdminSettings /> : <UsersTab />
          )}
          
          {activeTab === 'roles' && hasPermission('roles', 'read') && <RolesTab />}
          
          {activeTab === 'logs' && hasPermission('logs', 'read') && <ActivityLogsTab />}
          
          {activeTab !== 'general' && 
           activeTab !== 'templates' && 
           activeTab !== 'users' && 
           activeTab !== 'roles' && 
           activeTab !== 'logs' && (
            <div className="text-center py-6">
              <p className="text-gray-600">Sezione non trovata.</p>
              <button
                onClick={() => changeTab('general')}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Torna alle impostazioni generali
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;