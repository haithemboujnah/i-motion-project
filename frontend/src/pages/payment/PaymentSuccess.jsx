import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Envoyer sessionId au backend pour confirmer le paiement
    if (sessionId) {
      console.log('✅ Paiement réussi - Session ID:', sessionId);
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
        <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Paiement réussi ! 🎉
        </h1>
        <p className="text-gray-600 mb-4">
          Votre abonnement a été activé avec succès.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-logo"
        >
          Retour au tableau de bord
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;