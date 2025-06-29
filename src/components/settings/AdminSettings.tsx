/**
 * Admin Settings Component
 * Week 14 Implementation - Administrative System Configuration
 */

import React, { useState } from 'react';
import { Shield, Server, Database, Clock, AlertTriangle, Download, Upload, RotateCcw, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

interface AdminSettingsProps {
  className?: string;
}

const BACKUP_FREQUENCIES = [
  { value: 'daily', label: 'Giornaliero', description: 'Backup automatico ogni giorno alle 02:00' },
  { value: 'weekly', label: 'Settimanale', description: 'Backup automatico ogni domenica alle 02:00' },
  { value: 'monthly', label: 'Mensile', description: 'Backup automatico il primo giorno del mese' },
  { value: 'manual', label: 'Manuale', description: 'Solo backup manuali' }
];

const RETENTION_PERIODS = [
  { value: '7', label: '7 giorni' },
  { value: '30', label: '30 giorni' },
  { value: '90', label: '90 giorni' },
  { value: '365', label: '1 anno' },
  { value: 'unlimited', label: 'Illimitato' }
];

const LOG_LEVELS = [
  { value: 'error', label: 'Error', description: 'Solo errori critici' },
  { value: 'warn', label: 'Warning', description: 'Errori e avvisi' },
  { value: 'info', label: 'Info', description: 'Informazioni generali' },
  { value: 'debug', label: 'Debug', description: 'Informazioni dettagliate per debug' }
];

const AdminSettings: React.FC<AdminSettingsProps> = ({ className = '' }) => {
  const { user, hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('system');
  const [hasChanges, setHasChanges] = useState(false);
  
  // Mock settings state - in a real app, this would come from an API
  const [settings, setSettings] = useState({
    system: {
      siteName: 'Sistema Gestionale',
      siteDescription: 'Piattaforma di gestione aziendale',
      adminEmail: 'admin@example.com',
      timezone: 'Europe/Rome',
      language: 'it',
      maintenanceMode: false,
      debugMode: false,
      logLevel: 'info',
      maxFileSize: '10',
      sessionTimeout: '30'
    },
    features: {
      userRegistration: true,
      emailVerification: true,
      twoFactorAuth: false,
      apiAccess: true,
      fileUploads: true,
      notifications: true,
      analytics: true,
      backups: true
    },
    backup: {
      enabled: true,
      frequency: 'daily',
      retention: '30',
      location: 'local',
      compression: true,
      encryption: true
    },
    security: {
      passwordMinLength: '8',
      passwordRequireSpecial: true,
      passwordRequireNumbers: true,
      passwordRequireUppercase: true,
      maxLoginAttempts: '5',
      lockoutDuration: '15',
      sessionSecurity: true,
      ipWhitelist: '',
      corsOrigins: ''
    }
  });

  // Check if user has admin permissions
  if (!hasPermission('system', 'admin')) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <Shield className="w-4 h-4" />
            <AlertDescription>
              Non hai i permessi necessari per accedere alle impostazioni amministrative.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const handleSettingChange = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, make API call here
      // await apiClient.put('/api/admin/settings', settings);
      
      setHasChanges(false);
      toast.success('Impostazioni salvate con successo');
    } catch (error) {
      toast.error('Errore nel salvataggio delle impostazioni');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = async () => {
    if (!confirm('Sei sicuro di voler ripristinare tutte le impostazioni ai valori predefiniti?')) {
      return;
    }
    
    setLoading(true);
    try {
      // Reset to default values
      // In a real app, this would call an API endpoint
      toast.success('Impostazioni ripristinate ai valori predefiniti');
      setHasChanges(false);
    } catch (error) {
      toast.error('Errore nel ripristino delle impostazioni');
    } finally {
      setLoading(false);
    }
  };

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Impostazioni esportate con successo');
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = JSON.parse(e.target?.result as string);
        setSettings(importedSettings);
        setHasChanges(true);
        toast.success('Impostazioni importate con successo');
      } catch (error) {
        toast.error('Errore nell\'importazione delle impostazioni');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleMaintenanceToggle = async (enabled: boolean) => {
    if (enabled) {
      const confirmed = confirm(
        'Attivare la modalità manutenzione? Tutti gli utenti (eccetto gli amministratori) non potranno accedere al sistema.'
      );
      if (!confirmed) return;
    }
    
    handleSettingChange('system', 'maintenanceMode', enabled);
    
    if (enabled) {
      toast.warning('Modalità manutenzione attivata');
    } else {
      toast.success('Modalità manutenzione disattivata');
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Impostazioni Amministrative
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configura le impostazioni di sistema e le funzionalità avanzate.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportSettings}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Esporta
          </Button>
          
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleImportSettings}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Importa
            </Button>
          </div>
          
          <Button
            onClick={handleResetSettings}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          
          {hasChanges && (
            <Button
              onClick={handleSaveSettings}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salva Modifiche
            </Button>
          )}
        </div>
      </div>

      {/* Changes Alert */}
      {hasChanges && (
        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            Hai modifiche non salvate. Ricorda di salvare le impostazioni prima di uscire.
          </AlertDescription>
        </Alert>
      )}

      {/* Maintenance Mode Alert */}
      {settings.system.maintenanceMode && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            <strong>Modalità Manutenzione Attiva:</strong> Il sistema è attualmente in manutenzione. Solo gli amministratori possono accedere.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            <span className="hidden sm:inline">Sistema</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Funzionalità</span>
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Backup</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Sicurezza</span>
          </TabsTrigger>
        </TabsList>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                Configurazione Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Nome Sito</Label>
                  <Input
                    id="siteName"
                    value={settings.system.siteName}
                    onChange={(e) => handleSettingChange('system', 'siteName', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Email Amministratore</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={settings.system.adminEmail}
                    onChange={(e) => handleSettingChange('system', 'adminEmail', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Descrizione Sito</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.system.siteDescription}
                  onChange={(e) => handleSettingChange('system', 'siteDescription', e.target.value)}
                  rows={3}
                />
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Fuso Orario</Label>
                  <Select
                    value={settings.system.timezone}
                    onValueChange={(value) => handleSettingChange('system', 'timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Rome">Europa/Roma</SelectItem>
                      <SelectItem value="Europe/London">Europa/Londra</SelectItem>
                      <SelectItem value="America/New_York">America/New York</SelectItem>
                      <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Livello Log</Label>
                  <Select
                    value={settings.system.logLevel}
                    onValueChange={(value) => handleSettingChange('system', 'logLevel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOG_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <div className="flex flex-col">
                            <span>{level.label}</span>
                            <span className="text-xs text-gray-500">{level.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Modalità Manutenzione</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Disabilita l'accesso al sistema per tutti gli utenti eccetto gli amministratori
                    </p>
                  </div>
                  <Switch
                    checked={settings.system.maintenanceMode}
                    onCheckedChange={handleMaintenanceToggle}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Modalità Debug</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Abilita informazioni di debug dettagliate (solo per sviluppo)
                    </p>
                  </div>
                  <Switch
                    checked={settings.system.debugMode}
                    onCheckedChange={(checked) => handleSettingChange('system', 'debugMode', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feature Toggles */}
        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Gestione Funzionalità
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(settings.features).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <div>
                    <Label className="text-base font-medium capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getFeatureDescription(key)}
                    </p>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) => handleSettingChange('features', key, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup Settings */}
        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Configurazione Backup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Backup Automatici</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Abilita i backup automatici del database e dei file
                  </p>
                </div>
                <Switch
                  checked={settings.backup.enabled}
                  onCheckedChange={(checked) => handleSettingChange('backup', 'enabled', checked)}
                />
              </div>
              
              {settings.backup.enabled && (
                <div className="space-y-4 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
                  <div className="space-y-2">
                    <Label>Frequenza Backup</Label>
                    <Select
                      value={settings.backup.frequency}
                      onValueChange={(value) => handleSettingChange('backup', 'frequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BACKUP_FREQUENCIES.map((freq) => (
                          <SelectItem key={freq.value} value={freq.value}>
                            <div className="flex flex-col">
                              <span>{freq.label}</span>
                              <span className="text-xs text-gray-500">{freq.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Periodo di Conservazione</Label>
                    <Select
                      value={settings.backup.retention}
                      onValueChange={(value) => handleSettingChange('backup', 'retention', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RETENTION_PERIODS.map((period) => (
                          <SelectItem key={period.value} value={period.value}>
                            {period.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Compressione</Label>
                      <Switch
                        checked={settings.backup.compression}
                        onCheckedChange={(checked) => handleSettingChange('backup', 'compression', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label>Crittografia</Label>
                      <Switch
                        checked={settings.backup.encryption}
                        onCheckedChange={(checked) => handleSettingChange('backup', 'encryption', checked)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Impostazioni Sicurezza
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Policy Password</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Lunghezza Minima</Label>
                    <Input
                      type="number"
                      min="6"
                      max="32"
                      value={settings.security.passwordMinLength}
                      onChange={(e) => handleSettingChange('security', 'passwordMinLength', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tentativi Login Max</Label>
                    <Input
                      type="number"
                      min="3"
                      max="10"
                      value={settings.security.maxLoginAttempts}
                      onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Richiedi Caratteri Speciali</Label>
                    <Switch
                      checked={settings.security.passwordRequireSpecial}
                      onCheckedChange={(checked) => handleSettingChange('security', 'passwordRequireSpecial', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Richiedi Numeri</Label>
                    <Switch
                      checked={settings.security.passwordRequireNumbers}
                      onCheckedChange={(checked) => handleSettingChange('security', 'passwordRequireNumbers', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Richiedi Maiuscole</Label>
                    <Switch
                      checked={settings.security.passwordRequireUppercase}
                      onCheckedChange={(checked) => handleSettingChange('security', 'passwordRequireUppercase', checked)}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Sicurezza Sessioni</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sicurezza Sessioni Avanzata</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Abilita controlli di sicurezza aggiuntivi per le sessioni utente
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.sessionSecurity}
                    onCheckedChange={(checked) => handleSettingChange('security', 'sessionSecurity', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant={settings.system.maintenanceMode ? 'destructive' : 'default'}>
                {settings.system.maintenanceMode ? 'Manutenzione' : 'Operativo'}
              </Badge>
              <span>Stato Sistema</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={settings.backup.enabled ? 'default' : 'secondary'}>
                {settings.backup.enabled ? 'Attivi' : 'Disattivi'}
              </Badge>
              <span>Backup</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {Object.values(settings.features).filter(Boolean).length}/{Object.keys(settings.features).length}
              </Badge>
              <span>Funzionalità Attive</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {settings.system.logLevel.toUpperCase()}
              </Badge>
              <span>Livello Log</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper function to get feature descriptions
function getFeatureDescription(key: string): string {
  const descriptions: Record<string, string> = {
    userRegistration: 'Permetti la registrazione di nuovi utenti',
    emailVerification: 'Richiedi verifica email per nuovi account',
    twoFactorAuth: 'Abilita autenticazione a due fattori',
    apiAccess: 'Permetti accesso tramite API',
    fileUploads: 'Abilita caricamento file',
    notifications: 'Sistema di notifiche',
    analytics: 'Raccolta dati analitici',
    backups: 'Sistema di backup automatico'
  };
  
  return descriptions[key] || 'Funzionalità del sistema';
}

export default AdminSettings;