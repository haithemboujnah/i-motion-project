import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCheck, FaCrown, FaCreditCard, FaSpinner, FaShieldAlt,
  FaClock, FaStar, FaLock, FaCalendarCheck
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Navbar from '../../components/adherent/AdherentNavbar';
import Sidebar from '../../components/adherent/AdherentSidebar';
import { paymentService } from '../../services/paymentService';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

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

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

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

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const user = authService.getUser();
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [step, setStep] = useState('plans');
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, subRes, transRes] = await Promise.all([
        paymentService.getPlans(),
        paymentService.getSubscription(),
        paymentService.getTransactions(10)
      ]);
      
      setPlans(plansRes.data.plans || []);
      setCurrentSubscription(subRes.data.subscription || null);
      setTransactions(transRes.data.transactions || []);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      toast.error('Erreur lors du chargement des données');
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
    fetchData();
  };

  const handlePaymentCancel = () => {
    setSelectedPlan(null);
    setStep('plans');
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler votre abonnement ?')) {
      return;
    }
    
    try {
      await paymentService.cancelSubscription();
      toast.success('Abonnement annulé avec succès');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'annulation');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'active': 'badge-success',
      'cancelling': 'badge-warning',
      'cancelled': 'badge-danger',
      'past_due': 'badge-warning',
      'inactive': 'badge-danger'
    };
    return badges[status] || 'badge-info';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'active': 'Actif',
      'cancelling': 'En cours d\'annulation',
      'cancelled': 'Annulé',
      'past_due': 'En retard',
      'inactive': 'Inactif'
    };
    return labels[status] || status;
  };

  // ✅ Vérifier si l'utilisateur a un abonnement actif
  const isSubscribed = currentSubscription && currentSubscription.status === 'active';
  
  // ✅ Vérifier si l'abonnement est encore valide (date de fin)
  const isSubscriptionValid = () => {
    if (!currentSubscription || currentSubscription.status !== 'active') return false;
    const endDate = new Date(currentSubscription.end_date);
    const now = new Date();
    return endDate > now;
  };

  // ✅ Vérifier si l'utilisateur peut s'abonner
  const canSubscribe = () => {
    if (!isSubscribed) return true;
    if (!isSubscriptionValid()) return true;
    return false;
  };

  // ✅ Voir le plan actuel de l'utilisateur
  const getCurrentPlan = () => {
    if (!currentSubscription) return null;
    return plans.find(p => p.id === currentSubscription.plan_type);
  };

  const currentPlan = getCurrentPlan();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-display font-bold text-gray-900 flex items-center gap-3">
                  <FaCrown className="text-yellow-500" />
                  Abonnement
                </h1>
                <p className="text-gray-500 mt-1">
                  Gérez votre abonnement et accédez à toutes les fonctionnalités
                </p>
              </div>
              {currentSubscription && (
                <span className={`badge ${getStatusBadge(currentSubscription.status)}`}>
                  {getStatusLabel(currentSubscription.status)}
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="spinner"></div>
              </div>
            ) : (
              <>
                {/* Abonnement actuel */}
                {currentSubscription && isSubscriptionValid() && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white mb-8 shadow-lg"
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FaCalendarCheck className="text-xl" />
                          <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                            Abonnement actif
                          </span>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">
                          {currentSubscription.plan_type === 'monthly' && 'Abonnement Mensuel'}
                          {currentSubscription.plan_type === 'quarterly' && 'Abonnement Trimestriel'}
                          {currentSubscription.plan_type === 'yearly' && 'Abonnement Annuel'}
                        </h2>
                        <p className="text-white/80">
                          Valable jusqu'au{' '}
                          <span className="font-bold">
                            {new Date(currentSubscription.end_date).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </p>
                        <p className="text-sm text-white/60 mt-2">
                          {currentSubscription.amount}€ / {currentSubscription.plan_type === 'monthly' ? 'mois' : 
                                                           currentSubscription.plan_type === 'quarterly' ? 'trimestre' :
                                                           'an'}
                        </p>
                      </div>
                      <div className="mt-4 md:mt-0 flex gap-3">
                        {currentSubscription.status === 'active' && (
                          <button
                            onClick={handleCancelSubscription}
                            className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white font-medium transition"
                          >
                            Annuler l'abonnement
                          </button>
                        )}
                        <button
                          onClick={() => navigate('/payment/history')}
                          className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white font-medium transition"
                        >
                          Voir historique
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Message si abonnement expiré ou en cours d'annulation */}
                {currentSubscription && !isSubscriptionValid() && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-3">
                      <FaClock className="text-yellow-600 text-xl" />
                      <div>
                        <p className="font-medium text-yellow-800">
                          {currentSubscription.status === 'cancelling' 
                            ? 'Votre abonnement sera résilié à la fin de la période en cours'
                            : 'Votre abonnement a expiré'}
                        </p>
                        <p className="text-sm text-yellow-700">
                          {currentSubscription.status === 'cancelling'
                            ? `Valable jusqu'au ${new Date(currentSubscription.end_date).toLocaleDateString('fr-FR')}`
                            : 'Souscrivez un nouvel abonnement pour continuer à profiter de toutes les fonctionnalités'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Plans d'abonnement - désactivés si abonnement actif */}
                {step === 'plans' && (
                  <>
                    {isSubscriptionValid() && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                        <div className="flex items-center gap-3">
                          <FaCheck className="text-green-600 text-xl" />
                          <div>
                            <p className="font-medium text-green-800">
                              Vous êtes déjà abonné !
                            </p>
                            <p className="text-sm text-green-700">
                              Votre abonnement est actif jusqu'au {new Date(currentSubscription.end_date).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      {plans.map((plan) => {
                        const isPopular = plan.id === 'yearly';
                        const isCurrentPlan = currentPlan && currentPlan.id === plan.id;
                        const isActivePlan = isCurrentPlan && isSubscriptionValid();
                        
                        return (
                          <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * plans.indexOf(plan) }}
                            className={`bg-white rounded-2xl p-6 shadow-sm border-2 transition-all duration-300 ${
                              isActivePlan 
                                ? 'border-green-400 shadow-lg' 
                                : isPopular 
                                  ? 'border-yellow-400' 
                                  : 'border-gray-200 hover:border-blue-300'
                            } ${isPopular ? 'relative' : ''} ${!canSubscribe() && !isActivePlan ? 'opacity-60' : ''}`}
                          >
                            {isPopular && !isActivePlan && (
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                                🌟 Populaire
                              </div>
                            )}
                            
                            {isActivePlan && (
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                                ✅ Actuel
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
                              {plan.features.slice(0, 4).map((feature, index) => (
                                <li key={index} className={`flex items-center gap-2 text-sm ${isActivePlan ? 'text-gray-700' : 'text-gray-600'}`}>
                                  <FaCheck className={`flex-shrink-0 ${isActivePlan ? 'text-green-500' : 'text-green-500'}`} />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                            
                            {isActivePlan ? (
                              <div className="w-full bg-green-100 text-green-700 text-sm font-medium py-3 rounded-xl text-center">
                                ✅ Abonnement actif
                              </div>
                            ) : !canSubscribe() ? (
                              <div className="w-full bg-gray-100 text-gray-500 text-sm font-medium py-3 rounded-xl text-center cursor-not-allowed">
                                🔒 Abonnement en cours
                              </div>
                            ) : (
                              <button
                                onClick={() => handlePlanSelect(plan)}
                                className="w-full btn-logo text-sm"
                                disabled={!canSubscribe()}
                              >
                                S'abonner
                              </button>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Paiement intégré */}
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

                {/* Succès */}
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
                        {new Date(subscription.end_date).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
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

                {/* Sécurité et garantie */}
                {step === 'plans' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
                        <FaShieldAlt className="text-green-500 text-2xl" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">Paiement sécurisé</p>
                          <p className="text-xs text-gray-500">Stripe garantit la sécurité de vos transactions</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
                        <FaCreditCard className="text-blue-500 text-2xl" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">Paiement flexible</p>
                          <p className="text-xs text-gray-500">Carte bancaire, PayPal, Apple Pay</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
                        <FaClock className="text-orange-500 text-2xl" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">Annulation facile</p>
                          <p className="text-xs text-gray-500">Annulez à tout moment depuis votre espace</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                      <div className="flex items-center gap-3">
                        <FaStar className="text-purple-600 text-xl" />
                        <div>
                          <h4 className="font-medium text-purple-800">Offre spéciale</h4>
                          <p className="text-sm text-purple-600">
                            L'abonnement annuel vous offre 2 mois gratuits et un accès prioritaire à toutes les fonctionnalités
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SubscriptionPage;