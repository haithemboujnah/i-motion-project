import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaDownload, FaSync, FaClock, FaCheckCircle } from 'react-icons/fa';
import Navbar from '../../components/adherent/AdherentNavbar';
import Sidebar from '../../components/adherent/AdherentSidebar';
import { qrService } from '../../services/qrService';
import toast from 'react-hot-toast';

const QRCode = () => {
  const [qrImage, setQrImage] = useState(null);
  const [token, setToken] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    generateQR();
    fetchHistory();
  }, []);

  const generateQR = async () => {
    setLoading(true);
    try {
      const response = await qrService.generateQR();
      setQrImage(response.data.qrImage);
      setToken(response.data.token);
      setExpiresAt(response.data.expires_at);
      toast.success('QR Code généré avec succès !');
    } catch (error) {
      console.error('Error generating QR:', error);
      toast.error('Erreur lors de la génération du QR Code');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await qrService.getHistory(10);
      setHistory(response.data.history || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const downloadQR = () => {
    if (!qrImage) return;
    const link = document.createElement('a');
    link.download = 'qr-code-imotion.png';
    link.href = qrImage;
    link.click();
    toast.success('QR Code téléchargé !');
  };

  // ✅ Fonction de formatage de date
  const formatDate = (date) => {
    if (!date) return 'Date inconnue';
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ✅ Fonction de formatage de date courte
  const formatDateShort = (date) => {
    if (!date) return 'Date inconnue';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // ✅ Fonction de formatage d'heure
  const formatTime = (time) => {
    if (!time) return 'Heure inconnue';
    return time.substring(0, 5);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-primary">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-6">
              🎫 Mon QR Code
            </h1>

            {/* QR Code */}
            <div className="bg-white dark:bg-dark-card rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 text-center">
                🎫 Mon QR Code
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
                Présentez ce QR Code à votre coach pour pointer votre présence
              </p>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="spinner"></div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="bg-white p-4 rounded-xl shadow-lg">
                    {qrImage ? (
                      <img 
                        src={qrImage} 
                        alt="QR Code" 
                        className="w-64 h-64 object-contain"
                      />
                    ) : (
                      <div className="w-64 h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400">Génération...</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={generateQR}
                      className="btn-secondary text-sm flex items-center gap-2"
                    >
                      <FaSync /> Régénérer
                    </button>
                    <button
                      onClick={downloadQR}
                      className="btn-logo text-sm flex items-center gap-2"
                      disabled={!qrImage}
                    >
                      <FaDownload /> Télécharger
                    </button>
                  </div>

                  {expiresAt && (
                    <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <FaClock />
                      <span>Expire le : {formatDate(expiresAt)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Historique des pointages */}
            <div className="bg-white dark:bg-dark-card rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                📋 Historique des pointages
              </h3>
              {history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-secondary rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {item.type || 'Séance'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          📅 {formatDateShort(item.date)} à {formatTime(item.time)}
                        </p>
                        <p className="text-xs text-gray-400">
                          👤 Coach: {item.coach_first_name} {item.coach_last_name}
                        </p>
                      </div>
                      <span className="badge-success">
                        <FaCheckCircle className="inline mr-1" />
                        Présent
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucun pointage effectué
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Présentez votre QR Code à votre coach pour pointer
                  </p>
                </div>
              )}
            </div>

            {/* Informations utiles */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-800 dark:text-blue-300 text-sm flex items-center gap-2">
                💡 Comment utiliser votre QR Code ?
              </h4>
              <ul className="mt-2 text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                <li>Téléchargez votre QR Code en PNG</li>
                <li>Présentez-le à votre coach avant la séance</li>
                <li>Le coach scannera le QR Code pour valider votre présence</li>
                <li>Vous recevrez une confirmation de pointage</li>
              </ul>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default QRCode;