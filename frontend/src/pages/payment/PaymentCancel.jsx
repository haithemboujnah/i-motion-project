import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimesCircle } from 'react-icons/fa';

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
        <FaTimesCircle className="text-6xl text-yellow-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Paiement annulé
        </h1>
        <p className="text-gray-600 mb-4">
          Vous pouvez réessayer quand vous voulez.
        </p>
        <button
          onClick={() => navigate('/subscription')}
          className="btn-logo"
        >
          Retour aux abonnements
        </button>
      </div>
    </div>
  );
};

export default PaymentCancel;