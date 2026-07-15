import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { 
  FaCreditCard, FaShieldAlt, FaLock, FaCheck,
  FaSpinner, FaCrown, FaArrowLeft, FaCalendar
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Sidebar from '../../components/common/Sidebar';
import { paymentService } from '../../services/paymentService';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

// ✅ Initialisation de Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#1e293b',
      fontFamily: 'Inter, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#94a3b8',
      },
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
};

const PaymentForm = ({ planId, planName, planPrice, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);

  useEffect(() => {
    createPaymentIntent();
  }, []);

  const createPaymentIntent = async () => {
    try {
      setLoading(true);
      const response = await paymentService.createPaymentIntent(planId);
      if (response.success) {
        setClientSecret(response.data.clientSecret);
        setPaymentIntentId(response.data.paymentIntentId);
      }
    } catch (error) {
      setError('Erreur lors de l\'initialisation du paiement');
      toast.error('Erreur lors de l\'initialisation');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const cardElement = elements.getElement(CardElement);
    
    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: authService.getUser()?.first_name + ' ' + authService.getUser()?.last_name,
            },
          },
        }
      );
      
      if (stripeError) {
        setError(stripeError.message);
        toast.error(stripeError.message);
        setLoading(false);
        return;
      }
      
      if (paymentIntent.status === 'succeeded') {
        // Confirmer le paiement auprès du backend
        const confirmResponse = await paymentService.confirmPayment(paymentIntent.id);
        if (confirmResponse.success) {
          toast.success('🎉 Paiement confirmé ! Abonnement activé');
          onSuccess(confirmResponse.data.subscription);
        } else {
          setError('Erreur lors de la confirmation');
          toast.error('Erreur lors de la confirmation');
        }
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCardChange = (event) => {
    setCardComplete(event.complete);
    if (event.error) {
      setError(event.error.message);
    } else {
      setError(null);
    }
  };

  if (loading && !clientSecret) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="spinner"></div>
        <p className="ml-3 text-gray-500">Initialisation du paiement...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Montant */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Vous allez payer</p>
            <p className="text-2xl font-bold text-blue-600">{planPrice}€</p>
            <p className="text-xs text-gray-500">pour l'abonnement {planName}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <FaCrown className="text-blue-600 text-2xl" />
          </div>
        </div>
      </div>

      {/* Carte bancaire */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FaCreditCard className="inline mr-2" />
          Informations de la carte
        </label>
        <div className="p-4 border-2 border-gray-200 rounded-xl focus-within:border-blue-500 transition">
          <CardElement 
            options={CARD_ELEMENT_OPTIONS}
            onChange={handleCardChange}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <FaLock className="text-green-500" />
          Paiement sécurisé par Stripe
        </p>
      </div>

      {/* Erreur */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Boutons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!stripe || !clientSecret || !cardComplete || loading}
          className="flex-1 btn-logo flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" />
              Traitement...
            </>
          ) : (
            <>
              <FaLock />
              Payer {planPrice}€
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
          disabled={loading}
        >
          Annuler
        </button>
      </div>

      {/* Sécurité */}
      <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <FaShieldAlt className="text-green-500" />
          Sécurisé
        </span>
        <span>•</span>
        <span>Paiement 100% sécurisé</span>
        <span>•</span>
        <span>Données cryptées</span>
      </div>
    </form>
  );
};

const PaymentPage = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [step, setStep] = useState('plans'); // 'plans' | 'payment' | 'success'
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await paymentService.getPlans();
      setPlans(response.data.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Erreur lors du chargement des plans');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setStep('payment');
  };

  const handlePaymentSuccess = (subscriptionData) => {
    setSubscription(subscriptionData);
    setStep('success');
    toast.success('🎉 Abonnement activé avec succès !');
  };

  const handlePaymentCancel = () => {
    setSelectedPlan(null);
    setStep('plans');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="spinner"></div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              {step !== 'plans' && (
                <button
                  onClick={() => setStep('plans')}
                  className="p-2 hover:bg-gray-200 rounded-lg transition"
                >
                  <FaArrowLeft className="text-gray-600" />
                </button>
              )}
              <h1 className="text-3xl font-display font-bold text-gray-900">
                {step === 'plans' ? '💳 Choisissez votre abonnement' : 
                 step === 'payment' ? '💳 Paiement sécurisé' : 
                 '🎉 Abonnement activé'}
              </h1>
            </div>

            {step === 'plans' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan) => {
                  const isPopular = plan.id === 'yearly';
                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * plans.indexOf(plan) }}
                      className={`bg-white rounded-2xl p-6 shadow-sm border-2 transition-all duration-300 hover:shadow-lg cursor-pointer ${
                        isPopular ? 'border-yellow-400' : 'border-gray-200 hover:border-blue-300'
                      } ${isPopular ? 'relative' : ''}`}
                      onClick={() => handlePlanSelect(plan)}
                    >
                      {isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                          🌟 Populaire
                        </div>
                      )}
                      <div className="text-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
                        <div className="mt-2">
                          <span className="text-4xl font-bold text-gray-900">{plan.price}€</span>
                          <span className="text-gray-500"> / {plan.interval}</span>
                        </div>
                      </div>
                      <ul className="space-y-2 mb-4">
                        {plan.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                            <FaCheck className="text-green-500 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <button className="w-full btn-logo text-sm">
                        S'abonner
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {step === 'payment' && selectedPlan && (
              <Elements stripe={stripePromise}>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <PaymentForm
                    planId={selectedPlan.id}
                    planName={selectedPlan.name}
                    planPrice={selectedPlan.price}
                    onSuccess={handlePaymentSuccess}
                    onCancel={handlePaymentCancel}
                  />
                </div>
              </Elements>
            )}

            {step === 'success' && subscription && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-8 shadow-sm border-2 border-green-200 text-center"
              >
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <FaCheck className="text-4xl text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  🎉 Abonnement activé !
                </h2>
                <p className="text-gray-600 mb-4">
                  Votre abonnement est maintenant actif. Vous avez accès à toutes les fonctionnalités.
                </p>
                <div className="p-4 bg-gray-50 rounded-lg mb-4">
                  <p className="text-sm text-gray-500">Valable jusqu'au</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(subscription.end_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn-logo"
                >
                  Retour au tableau de bord
                </button>
              </motion.div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PaymentPage;