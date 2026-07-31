import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  FaUpload, FaImage, FaCheckCircle, FaTimes, 
  FaUser, FaCalendar, FaSpinner, FaQrcode,
  FaInfoCircle, FaExclamationTriangle
} from 'react-icons/fa';
import { qrService } from '../../services/qrService';
import toast from 'react-hot-toast';

const QRImageScanner = ({ sessionId, onScanComplete }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scannedUser, setScannedUser] = useState(null);
  const [error, setError] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5MB');
      return;
    }

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setScannedUser(null);
    setError(null);
    setTestResult(null);
    
    // ✅ Auto-test après sélection
    setTimeout(() => {
      if (file) {
        handleTestQR(file);
      }
    }, 500);
  };

  const handleTestQR = async (file = selectedImage) => {
    if (!file) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    setIsTesting(true);
    setError(null);
    setTestResult(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Image = reader.result;
          const response = await qrService.testQRScan(base64Image);
          
          if (response.success) {
            setTestResult({
              success: true,
              data: response.data.decoded
            });
            toast.success('✅ QR Code valide !');
          }
        } catch (error) {
          console.error('Error testing QR:', error);
          const errorMsg = error.response?.data?.error || 'QR Code invalide';
          setTestResult({
            success: false,
            error: errorMsg
          });
          toast.error(errorMsg);
        } finally {
          setIsTesting(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error:', error);
      setError('Erreur lors du test');
      setIsTesting(false);
    }
  };

  const handleScanImage = async () => {
    if (!selectedImage) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    if (!sessionId) {
      toast.error('Session non sélectionnée');
      return;
    }

    setScanning(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Image = reader.result;
          
          const response = await qrService.scanQRFromImage(base64Image, sessionId);
          
          if (response.success) {
            setScannedUser(response.data.adherent);
            toast.success(`✅ ${response.data.adherent.first_name} ${response.data.adherent.last_name} pointé !`);
            
            if (onScanComplete) {
              onScanComplete(response.data);
            }
          }
        } catch (error) {
          console.error('Error scanning image:', error);
          const errorMsg = error.response?.data?.error || 'QR Code invalide';
          setError(errorMsg);
          toast.error(errorMsg);
        } finally {
          setScanning(false);
        }
      };
      reader.readAsDataURL(selectedImage);
    } catch (error) {
      console.error('Error:', error);
      setError('Erreur lors du traitement de l\'image');
      setScanning(false);
    }
  };

  const resetScanner = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setScannedUser(null);
    setError(null);
    setTestResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setSelectedImage(file);
        setPreviewUrl(URL.createObjectURL(file));
        setScannedUser(null);
        setError(null);
        setTestResult(null);
        setTimeout(() => handleTestQR(file), 500);
      } else {
        toast.error('Veuillez déposer une image');
      }
    }
  };

  return (
    <div className="bg-white dark:bg-dark-card rounded-2xl shadow-lg overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
          <FaQrcode className="text-purple-500" />
          Scanner QR Code
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Téléchargez l'image du QR Code envoyée par l'adhérent
        </p>

        {/* Zone de drop / upload */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
            previewUrl 
              ? 'border-green-500 bg-green-50 dark:bg-green-900/10' 
              : 'border-gray-300 dark:border-gray-600 hover:border-[#57a1ce]'
          }`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {previewUrl ? (
            <div className="space-y-4">
              <img 
                src={previewUrl} 
                alt="QR Code" 
                className="mx-auto max-h-48 object-contain rounded-lg"
              />
              <div className="flex items-center justify-center gap-3">
                <span className="text-sm text-green-600 dark:text-green-400">
                  ✅ Image chargée
                </span>
                {isTesting && (
                  <FaSpinner className="animate-spin text-blue-500" />
                )}
                {testResult && (
                  <span className={`text-sm ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                    {testResult.success ? '✅ Valide' : '❌ Invalide'}
                  </span>
                )}
                <button
                  onClick={resetScanner}
                  className="text-red-500 hover:text-red-700 transition"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-5xl text-gray-300 dark:text-gray-600">
                <FaImage />
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400">
                  Glissez-déposez l'image ici ou
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[#57a1ce] hover:text-[#3d7fa8] font-medium"
                >
                  cliquez pour parcourir
                </button>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Formats acceptés: PNG, JPG, JPEG (max 5MB)
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>

        {/* Boutons d'action */}
        {previewUrl && !scannedUser && (
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => handleTestQR(selectedImage)}
              disabled={isTesting}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              {isTesting ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Test...
                </>
              ) : (
                <>
                  <FaInfoCircle />
                  Tester
                </>
              )}
            </button>
            <button
              onClick={handleScanImage}
              disabled={scanning || !sessionId}
              className="btn-logo flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {scanning ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Scan...
                </>
              ) : (
                <>
                  <FaUpload />
                  Scanner
                </>
              )}
            </button>
          </div>
        )}

        {/* Résultats */}
        {testResult && !testResult.success && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
          >
            <div className="flex items-start gap-2">
              <FaExclamationTriangle className="text-yellow-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  ⚠️ QR Code non reconnu
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  Assurez-vous que l'image contient un QR Code valide et bien cadré
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {scannedUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center text-green-500 text-xl">
                <FaCheckCircle />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-green-800 dark:text-green-300">
                  ✅ {scannedUser.first_name} {scannedUser.last_name}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {scannedUser.email}
                </p>
              </div>
              <button
                onClick={resetScanner}
                className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
              >
                <FaTimes />
              </button>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
          >
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-dark-secondary rounded-lg">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 text-sm mb-2">
            📝 Instructions :
          </h4>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
            <li>L'adhérent vous envoie son QR Code par message</li>
            <li>Téléchargez l'image reçue</li>
            <li>Le QR Code est automatiquement testé</li>
            <li>Si valide, cliquez sur "Scanner"</li>
            <li>Le pointage est automatique !</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QRImageScanner;