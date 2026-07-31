import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { FaDownload, FaSync, FaClock, FaCheckCircle, FaCopy, FaShare } from 'react-icons/fa';
import { qrService } from '../../services/qrService';
import toast from 'react-hot-toast';

const QRCodeDisplay = () => {
  const [qrImage, setQrImage] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [token, setToken] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const qrRef = useRef(null);

  useEffect(() => {
    generateQR();
    fetchHistory();
  }, []);

  const generateQR = async () => {
    setLoading(true);
    try {
      const response = await qrService.generateQR();
      setQrImage(response.data.qrImage);
      setQrData({
        userId: response.data.userId,
        token: response.data.token,
        timestamp: new Date().toISOString()
      });
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

  // ✅ Télécharger le QR Code en PNG
  const downloadQR = () => {
    if (!qrImage) return;
    
    // Créer un lien de téléchargement
    const link = document.createElement('a');
    link.download = `qr-code-imotion-${new Date().toISOString().split('T')[0]}.png`;
    link.href = qrImage;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR Code téléchargé en PNG !');
  };

  // ✅ Copier l'image dans le presse-papier
  const copyQRToClipboard = async () => {
    if (!qrImage) return;
    
    try {
      const response = await fetch(qrImage);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      toast.success('QR Code copié dans le presse-papier !');
    } catch (error) {
      console.error('Error copying QR:', error);
      toast.error('Erreur lors de la copie');
    }
  };

  // ✅ Partager le QR Code
  const shareQR = async () => {
    if (!qrImage) return;
    
    try {
      const response = await fetch(qrImage);
      const blob = await response.blob();
      const file = new File([blob], 'qr-code-imotion.png', { type: 'image/png' });
      
      if (navigator.share) {
        await navigator.share({
          title: 'Mon QR Code I-Motion',
          text: 'Présentez ce QR Code à votre coach !',
          files: [file]
        });
        toast.success('QR Code partagé !');
      } else {
        // Fallback: copier le lien
        const link = document.createElement('a');
        link.download = 'qr-code-imotion.png';
        link.href = qrImage;
        link.click();
        toast.success('QR Code téléchargé !');
      }
    } catch (error) {
      console.error('Error sharing QR:', error);
      // Si partage annulé, on ne fait rien
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 text-center">
          🎫 Mon QR Code
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
          Téléchargez votre QR Code et envoyez-le à votre coach pour le pointage
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div ref={qrRef} className="bg-white p-6 rounded-xl shadow-lg border-2 border-[#57a1ce]/20">
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

            {/* ✅ Informations du QR Code */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">📱 Code unique:</span> {token?.substring(0, 8)}...
              </p>
              {expiresAt && (
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2 mt-1">
                  <FaClock className="text-[#57a1ce]" />
                  <span>Expire le : {formatDate(expiresAt)}</span>
                </p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                ⚠️ Ce QR Code est valable 7 jours
              </p>
            </div>

            {/* ✅ Boutons d'action */}
            <div className="flex flex-wrap gap-3 mt-6 justify-center">
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
                <FaDownload /> Télécharger PNG
              </button>
              <button
                onClick={copyQRToClipboard}
                className="btn-secondary text-sm flex items-center gap-2"
                disabled={!qrImage}
              >
                <FaCopy /> Copier
              </button>
              <button
                onClick={shareQR}
                className="btn-secondary text-sm flex items-center gap-2"
                disabled={!qrImage}
              >
                <FaShare /> Partager
              </button>
            </div>

            {/* ✅ Instructions */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 w-full">
              <h4 className="font-semibold text-blue-800 dark:text-blue-300 text-sm flex items-center gap-2">
                📋 Comment utiliser votre QR Code ?
              </h4>
              <ol className="mt-2 text-sm text-blue-700 dark:text-blue-400 space-y-1 list-decimal list-inside">
                <li>Téléchargez votre QR Code en PNG</li>
                <li>Envoyez-le à votre coach par message</li>
                <li>Le coach scannera l'image pour valider votre présence</li>
              </ol>
            </div>
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
                    {item.date} à {item.time}
                  </p>
                  <p className="text-xs text-gray-400">
                    Coach: {item.coach_first_name} {item.coach_last_name}
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
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            Aucun pointage effectué
          </p>
        )}
      </div>
    </div>
  );
};

export default QRCodeDisplay;