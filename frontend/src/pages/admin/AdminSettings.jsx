import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaSave, FaTimes, FaUserCog, FaLock, FaBell,
  FaPalette, FaGlobe, FaDatabase, FaShieldAlt,
  FaEnvelope, FaMobile, FaDesktop, FaMoon,
  FaSun, FaToggleOn, FaToggleOff, FaCheck
} from 'react-icons/fa';
import AdminNavbar from '../../components/admin/AdminNavbar';
import AdminSidebar from '../../components/admin/AdminSidebar';
import toast from 'react-hot-toast';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  
  // États des paramètres
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'I-Motion',
    siteEmail: 'admin@imotion.com',
    sitePhone: '+33 1 23 45 67 89',
    timezone: 'Europe/Paris',
    language: 'fr',
    dateFormat: 'DD/MM/YYYY'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    sessionReminders: true,
    achievementAlerts: true,
    systemUpdates: true,
    marketingEmails: false
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    passwordExpiry: 90
  });

  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'light',
    primaryColor: '#4f46e5',
    sidebarCollapsed: false,
    compactMode: false
  });

  const tabs = [
    { id: 'general', label: 'Général', icon: FaGlobe },
    { id: 'notifications', label: 'Notifications', icon: FaBell },
    { id: 'security', label: 'Sécurité', icon: FaShieldAlt },
    { id: 'appearance', label: 'Apparence', icon: FaPalette }
  ];

  const handleSave = (section) => {
    setLoading(true);
    setTimeout(() => {
      toast.success(`Paramètres ${section} sauvegardés !`);
      setLoading(false);
    }, 1000);
  };

  const handleToggle = (setting, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const renderGeneral = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label-custom">Nom du site</label>
          <input
            type="text"
            className="input-logo"
            disabled
            value={generalSettings.siteName}
            onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
          />
        </div>
        <div>
          <label className="label-custom">Email du site</label>
          <input
            type="email"
            className="input-logo"
            disabled
            value={generalSettings.siteEmail}
            onChange={(e) => setGeneralSettings({ ...generalSettings, siteEmail: e.target.value })}
          />
        </div>
        <div>
          <label className="label-custom">Téléphone</label>
          <input
            type="text"
            className="input-logo"
            disabled
            value={generalSettings.sitePhone}
            onChange={(e) => setGeneralSettings({ ...generalSettings, sitePhone: e.target.value })}
          />
        </div>
        <div>
          <label className="label-custom">Fuseau horaire</label>
          <select
            className="input-logo"
            disabled
            value={generalSettings.timezone}
            onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
          >
            <option value="Europe/Paris">Europe/Paris</option>
            <option value="Europe/London">Europe/London</option>
            <option value="America/New_York">America/New_York</option>
            <option value="Asia/Tokyo">Asia/Tokyo</option>
          </select>
        </div>
        <div>
          <label className="label-custom">Langue</label>
          <select
            className="input-logo"
            disabled
            value={generalSettings.language}
            onChange={(e) => setGeneralSettings({ ...generalSettings, language: e.target.value })}
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="de">Deutsch</option>
          </select>
        </div>
        <div>
          <label className="label-custom">Format de date</label>
          <select
            className="input-logo"
            disabled
            value={generalSettings.dateFormat}
            onChange={(e) => setGeneralSettings({ ...generalSettings, dateFormat: e.target.value })}
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-4">
      {Object.entries(notificationSettings).map(([key, value]) => {
        const labels = {
          emailNotifications: 'Notifications par email',
          pushNotifications: 'Notifications push',
          sessionReminders: 'Rappels de séances',
          achievementAlerts: 'Alertes de progression',
          systemUpdates: 'Mises à jour système',
          marketingEmails: 'Emails marketing'
        };
        const icons = {
          emailNotifications: FaEnvelope,
          pushNotifications: FaMobile,
          sessionReminders: FaDesktop,
          achievementAlerts: FaBell,
          systemUpdates: FaDatabase,
          marketingEmails: FaEnvelope
        };
        const Icon = icons[key] || FaBell;
        
        return (
          <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Icon className="text-lg" />
              </div>
              <div>
                <p className="font-medium text-gray-800">{labels[key]}</p>
                <p className="text-sm text-gray-500">
                  {value ? 'Activée' : 'Désactivée'}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleToggle(key, !value)}
              className="text-2xl transition-colors"
            >
              {value ? (
                <FaToggleOn className="text-indigo-600" />
              ) : (
                <FaToggleOff className="text-gray-300" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div>
          <p className="font-medium text-gray-800">Authentification à deux facteurs</p>
          <p className="text-sm text-gray-500">Sécurisez votre compte avec une double vérification</p>
        </div>
        <button
          onClick={() => setSecuritySettings({ ...securitySettings, twoFactorAuth: !securitySettings.twoFactorAuth })}
          className="text-2xl"
        >
          {securitySettings.twoFactorAuth ? (
            <FaToggleOn className="text-indigo-600" />
          ) : (
            <FaToggleOff className="text-gray-300" />
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label-custom">Expiration de session (minutes)</label>
          <input
            type="number"
            className="input-logo"
            disabled
            value={securitySettings.sessionTimeout}
            onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
            min="5"
            max="480"
          />
        </div>
        <div>
          <label className="label-custom">Tentatives de connexion max</label>
          <input
            type="number"
            className="input-logo"
            disabled
            value={securitySettings.maxLoginAttempts}
            onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: parseInt(e.target.value) })}
            min="3"
            max="10"
          />
        </div>
        <div>
          <label className="label-custom">Expiration du mot de passe (jours)</label>
          <input
            type="number"
            className="input-logo"
            disabled
            value={securitySettings.passwordExpiry}
            onChange={(e) => setSecuritySettings({ ...securitySettings, passwordExpiry: parseInt(e.target.value) })}
            min="30"
            max="365"
          />
        </div>
        <div>
          <label className="label-custom">Réinitialiser le mot de passe</label>
          <input
            type="password"
            className="input-logo" 
            disabled
            placeholder="Nouveau mot de passe"
            onChange={(e) => setSecuritySettings({ ...securitySettings, newPassword: e.target.value })}
          />
        </div>
      </div>
    </div>
  );

  const renderAppearance = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div
          className={`p-4 rounded-xl border-2 cursor-pointer transition ${
            appearanceSettings.theme === 'light'
              ? 'border-indigo-600 bg-indigo-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setAppearanceSettings({ ...appearanceSettings, theme: 'light' })}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaSun className="text-yellow-500 text-xl" />
              <span className="font-medium">Clair</span>
            </div>
            {appearanceSettings.theme === 'light' && (
              <FaCheck className="text-indigo-600" />
            )}
          </div>
        </div>
        <div
          className={`p-4 rounded-xl border-2 cursor-pointer transition ${
            appearanceSettings.theme === 'dark'
              ? 'border-indigo-600 bg-indigo-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setAppearanceSettings({ ...appearanceSettings, theme: 'dark' })}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaMoon className="text-indigo-600 text-xl" />
              <span className="font-medium">Sombre</span>
            </div>
            {appearanceSettings.theme === 'dark' && (
              <FaCheck className="text-indigo-600" />
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div>
          <p className="font-medium text-gray-800">Mode compact</p>
          <p className="text-sm text-gray-500">Réduire l'espacement des éléments</p>
        </div>
        <button
          onClick={() => setAppearanceSettings({ ...appearanceSettings, compactMode: !appearanceSettings.compactMode })}
          className="text-2xl"
        >
          {appearanceSettings.compactMode ? (
            <FaToggleOn className="text-indigo-600" />
          ) : (
            <FaToggleOff className="text-gray-300" />
          )}
        </button>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div>
          <p className="font-medium text-gray-800">Sidebar réduite</p>
          <p className="text-sm text-gray-500">Réduire la sidebar par défaut</p>
        </div>
        <button
          onClick={() => setAppearanceSettings({ ...appearanceSettings, sidebarCollapsed: !appearanceSettings.sidebarCollapsed })}
          className="text-2xl"
        >
          {appearanceSettings.sidebarCollapsed ? (
            <FaToggleOn className="text-indigo-600" />
          ) : (
            <FaToggleOff className="text-gray-300" />
          )}
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'general': return renderGeneral();
      case 'notifications': return renderNotifications();
      case 'security': return renderSecurity();
      case 'appearance': return renderAppearance();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  ⚙️ Paramètres
                </h1>
                <p className="text-gray-500 text-sm">Gérez la configuration de l'application</p>
              </div>
              <button
                onClick={() => handleSave(activeTab)}
                disabled={loading}
                className="btn-logo text-sm flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
              >
                <FaSave className="text-sm" />
                {loading ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>

            {/* Onglets */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
                      isActive
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="text-sm" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Contenu */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl p-6 shadow-sm"
            >
              {renderContent()}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminSettings;