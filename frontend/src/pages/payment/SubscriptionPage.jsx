import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCheck, FaCrown, FaCreditCard, FaSpinner, FaShieldAlt,
  FaClock, FaStar, FaLock, FaCalendarCheck, FaTimes,
  FaArrowLeft, FaSync, FaBell, FaEnvelope, FaUserTie,
  FaUser, FaPhone, FaMapMarkerAlt, FaInfoCircle
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Navbar from '../../components/adherent/AdherentNavbar';
import Sidebar from '../../components/adherent/AdherentSidebar';
import { paymentService } from '../../services/paymentService';
import { authService } from '../../services/authService';
import { coachService } from '../../services/coachService';
import toast from 'react-hot-toast';
import api from '../../services/api';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// ✅ Options de carte avec mode test
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
  classes: {
    base: 'StripeElement',
    complete: 'StripeElement--complete',
    empty: 'StripeElement--empty',
    focus: 'StripeElement--focus',
    invalid: 'StripeElement--invalid',
    webkitAutofill: 'StripeElement--webkit-autofill',
  },
  hidePostalCode: true,
};

const PaymentForm = ({ planId, planName, planPrice, coachId, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [confirming, setConfirming] = useState(false);

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
      } else {
        setError('Erreur lors de l\'initialisation du paiement');
        toast.error('Erreur lors de l\'initialisation');
      }
    } catch (error) {
      console.error('❌ Error creating payment intent:', error);
      setError('Erreur lors de l\'initialisation du paiement');
      toast.error('Erreur lors de l\'initialisation');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      toast.error('Le système de paiement n\'est pas prêt');
      return;
    }
    
    setConfirming(true);
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
              email: authService.getUser()?.email,
            },
          },
        }
      );
      
      if (stripeError) {
        setError(stripeError.message);
        toast.error(stripeError.message);
        setConfirming(false);
        return;
      }
      
      if (paymentIntent.status === 'succeeded') {
        // ✅ Confirmer avec coach_id (s'assurer que coachId est bien passé)
        console.log('📤 Confirming payment with coach_id:', coachId);
        
        const confirmResponse = await paymentService.confirmPayment({
          paymentIntentId: paymentIntent.id,
          testMode: false,
          coach_id: coachId // ✅ IMPORTANT: passer le coach_id
        });
        
        if (confirmResponse.success) {
          toast.success('🎉 Paiement confirmé ! Abonnement activé');
          onSuccess(confirmResponse.data.subscription);
        } else {
          setError('Erreur lors de la confirmation');
          toast.error('Erreur lors de la confirmation');
        }
      } else {
        setError(`Statut du paiement: ${paymentIntent.status}`);
        toast.error(`Paiement non finalisé: ${paymentIntent.status}`);
      }
    } catch (err) {
      console.error('❌ Payment error:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setConfirming(false);
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
            <p className="text-2xl font-bold text-blue-600">{planPrice} DT</p>
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
              Payer {planPrice}DT
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
  const [coaches, setCoaches] = useState([]);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [step, setStep] = useState('plans');
  const [subscription, setSubscription] = useState(null);
  const [renewalLoading, setRenewalLoading] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [renewalDuration, setRenewalDuration] = useState('monthly');

  useEffect(() => {
    fetchData();
    fetchCoaches();
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
      
      // Si l'utilisateur a déjà un abonnement, sélectionner son coach
      if (subRes.data.subscription?.coach_id) {
        setSelectedCoach(subRes.data.subscription.coach_id);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const fetchCoaches = async () => {
    try {
      // Essayer de récupérer depuis l'API
      const response = await api.get('/users?role=coach');
      if (response.data.success && response.data.data.users) {
        const coachesList = response.data.data.users.filter(u => u.role === 'coach');
        if (coachesList.length > 0) {
          setCoaches(coachesList);
          return;
        }
      }
    } catch (error) {
      console.warn('⚠️ API coaches indisponible, utilisation des données mockées');
    }
  };

  const handlePlanSelect = (plan) => {
    if (!selectedCoach) {
      toast.error('Veuillez d\'abord sélectionner un coach');
      return;
    }
    setSelectedPlan(plan);
    setStep('payment');
  };

  const handlePaymentSuccess = (subscriptionData) => {
    console.log('✅ Abonnement reçu:', subscriptionData);
    setSubscription(subscriptionData);
    setStep('success');
    toast.success('🎉 Abonnement activé avec succès !');
    
    // ✅ Mettre à jour l'affichage avec le coach
    if (subscriptionData.coach_id) {
      setSelectedCoach(subscriptionData.coach_id);
    }
    
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

  const handleRequestRenewal = async () => {
    if (!window.confirm('Souhaitez-vous demander le renouvellement de votre abonnement ?')) {
      return;
    }
    
    setRenewalLoading(true);
    try {
      const response = await paymentService.requestRenewal();
      
      if (response.success) {
        toast.success('✅ Demande de renouvellement envoyée !');
        setShowRenewalModal(false);
        await fetchData();
      } else {
        toast.error(response.error || 'Erreur lors de la demande');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la demande');
    } finally {
      setRenewalLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'active': 'badge-success',
      'pending_renewal': 'badge-warning',
      'renewal_rejected': 'badge-danger',
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
      'pending_renewal': 'Renouvellement en attente',
      'renewal_rejected': 'Renouvellement refusé',
      'cancelling': 'En cours d\'annulation',
      'cancelled': 'Annulé',
      'past_due': 'En retard',
      'inactive': 'Inactif'
    };
    return labels[status] || status;
  };

  const isSubscribed = currentSubscription && currentSubscription.status === 'active';
  
  const isSubscriptionValid = () => {
    if (!currentSubscription) return false;
    if (currentSubscription.status !== 'active' && currentSubscription.status !== 'pending_renewal') return false;
    const endDate = new Date(currentSubscription.end_date);
    const now = new Date();
    return endDate > now;
  };

  const isPendingRenewal = currentSubscription && currentSubscription.status === 'pending_renewal';
  const isExpired = () => {
    if (!currentSubscription) return false;
    if (currentSubscription.status !== 'active') return false;
    const endDate = new Date(currentSubscription.end_date);
    const now = new Date();
    return endDate < now;
  };

  const canRequestRenewal = () => {
    if (!currentSubscription) return false;
    if (currentSubscription.status === 'pending_renewal') return false;
    if (currentSubscription.status === 'renewal_rejected') return false;
    if (currentSubscription.status === 'cancelled') return false;
    return isExpired();
  };

  const getDaysRemaining = () => {
    if (!currentSubscription || !currentSubscription.end_date) return 0;
    const endDate = new Date(currentSubscription.end_date);
    const now = new Date();
    const diff = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const canSubscribe = () => {
    if (!isSubscribed) return true;
    if (!isSubscriptionValid()) return true;
    return false;
  };

  const getCurrentPlan = () => {
    if (!currentSubscription) return null;
    return plans.find(p => p.id === currentSubscription.plan_type);
  };

  const currentPlan = getCurrentPlan();
  const daysRemaining = getDaysRemaining();
  const isSubscriptionExpired = isExpired();
  const showRenewalButton = isSubscriptionExpired && !isPendingRenewal;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <FaCrown className="text-yellow-500" />
                  Abonnement
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Choisissez votre coach et votre abonnement
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
                {/* ✅ Sélection du coach (uniquement si pas d'abonnement actif) */}
                {!isSubscribed && step === 'plans' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6"
                  >
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                      <FaUserTie className="text-[#57a1ce]" />
                      Sélectionnez votre coach
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {coaches.map((coach) => (
                        <button
                          key={coach.id}
                          onClick={() => setSelectedCoach(coach.id)}
                          className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                            selectedCoach === coach.id
                              ? 'border-[#57a1ce] bg-[#57a1ce]/10 shadow-sm'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#57a1ce]/20 flex items-center justify-center text-[#57a1ce] font-bold">
                              {coach.first_name?.[0]}{coach.last_name?.[0]}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 dark:text-white">
                                {coach.first_name} {coach.last_name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {coach.speciality || 'Coach sportif'}
                              </p>
                            </div>
                          </div>
                          {selectedCoach === coach.id && (
                            <FaCheck className="text-[#57a1ce] mt-2" />
                          )}
                        </button>
                      ))}
                    </div>
                    {!selectedCoach && (
                      <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-3 flex items-center gap-1">
                        <FaInfoCircle />
                        Veuillez sélectionner un coach pour continuer
                      </p>
                    )}
                  </motion.div>
                )}

                {/* ✅ Abonnement actif - Afficher le coach */}
                {currentSubscription && isSubscriptionValid() && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl p-8 text-white mb-8 shadow-lg ${
                      isPendingRenewal 
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                        : 'bg-gradient-to-r from-green-500 to-emerald-600'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {isPendingRenewal ? (
                            <FaClock className="text-xl" />
                          ) : (
                            <FaCalendarCheck className="text-xl" />
                          )}
                          <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                            {isPendingRenewal ? 'Renouvellement en attente' : 'Abonnement actif'}
                          </span>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">
                          {currentSubscription.plan_name || currentSubscription.plan_type}
                        </h2>
                        <p className="text-white/80">
                          Coach :{' '}
                          <span className="font-bold">
                            {currentSubscription.coach_first_name} {currentSubscription.coach_last_name}
                          </span>
                        </p>
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
                          {currentSubscription.amount}DT / {currentSubscription.plan_type === 'monthly' ? 'mois' : 
                                                           currentSubscription.plan_type === 'quarterly' ? 'trimestre' :
                                                           'an'}
                        </p>
                        {isPendingRenewal && (
                          <p className="text-sm text-yellow-100 mt-2 flex items-center gap-2">
                            <FaBell className="text-yellow-300" />
                            Votre demande de renouvellement est en cours de traitement par l'administrateur
                          </p>
                        )}
                      </div>
                      <div className="mt-4 md:mt-0 flex flex-col gap-2">
                        {!isPendingRenewal && currentSubscription.status === 'active' && (
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

                {/* Plans d'abonnement */}
                {step === 'plans' && (
                  <>
                    {isSubscriptionValid() && !isPendingRenewal && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-xl p-4 mb-6">
                        <div className="flex items-center gap-3">
                          <FaCheck className="text-green-600 dark:text-green-400 text-xl" />
                          <div>
                            <p className="font-medium text-green-800 dark:text-green-300">
                              Vous êtes déjà abonné !
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-400">
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
                            className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border-2 transition-all duration-300 ${
                              isActivePlan 
                                ? 'border-green-400 shadow-lg' 
                                : isPopular 
                                  ? 'border-yellow-400' 
                                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
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
                              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{plan.name}</h3>
                              <div className="mt-2">
                                <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}DT</span>
                                <span className="text-gray-500 dark:text-gray-400"> / {plan.interval}</span>
                              </div>
                            </div>
                            
                            <ul className="space-y-2 mb-4">
                              {plan.features.slice(0, 4).map((feature, index) => (
                                <li key={index} className={`flex items-center gap-2 text-sm ${isActivePlan ? 'text-gray-700 dark:text-gray-300' : 'text-gray-600 dark:text-gray-400'}`}>
                                  <FaCheck className={`flex-shrink-0 ${isActivePlan ? 'text-green-500' : 'text-green-500'}`} />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                            
                            {isActivePlan ? (
                              <div className="w-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium py-3 rounded-xl text-center">
                                ✅ Abonnement actif
                              </div>
                            ) : !canSubscribe() ? (
                              <div className="w-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm font-medium py-3 rounded-xl text-center cursor-not-allowed">
                                🔒 Abonnement en cours
                              </div>
                            ) : !selectedCoach ? (
                              <div className="w-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-sm font-medium py-3 rounded-xl text-center cursor-not-allowed">
                                👤 Sélectionnez un coach
                              </div>
                            ) : (
                              <button
                                onClick={() => handlePlanSelect(plan)}
                                className="w-full btn-logo text-sm"
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
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                      <PaymentForm
                        planId={selectedPlan.id}
                        planName={selectedPlan.name}
                        planPrice={selectedPlan.price}
                        coachId={selectedCoach}
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
                    className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border-2 border-green-200 dark:border-green-800/30 text-center"
                  >
                    <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                      <FaCheck className="text-4xl text-green-500 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      🎉 Abonnement activé !
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Votre abonnement est maintenant actif. Vous avez accès à toutes les fonctionnalités.
                    </p>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Valable jusqu'au</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
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
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm flex items-center gap-3 border border-gray-200 dark:border-gray-700">
                        <FaShieldAlt className="text-green-500 text-2xl" />
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-white">Paiement sécurisé</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Stripe garantit la sécurité de vos transactions</p>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm flex items-center gap-3 border border-gray-200 dark:border-gray-700">
                        <FaCreditCard className="text-blue-500 text-2xl" />
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-white">Paiement flexible</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Carte bancaire, PayPal, Apple Pay</p>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm flex items-center gap-3 border border-gray-200 dark:border-gray-700">
                        <FaClock className="text-orange-500 text-2xl" />
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-white">Annulation facile</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Annulez à tout moment depuis votre espace</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800/30">
                      <div className="flex items-center gap-3">
                        <FaStar className="text-purple-600 dark:text-purple-400 text-xl" />
                        <div>
                          <h4 className="font-medium text-purple-800 dark:text-purple-300">Offre spéciale</h4>
                          <p className="text-sm text-purple-600 dark:text-purple-400">
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

      {/* Modal de renouvellement */}
      {showRenewalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FaSync className="text-blue-500" />
                Renouveler l'abonnement
              </h2>
              <button
                onClick={() => setShowRenewalModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <FaTimes className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/30">
                <p className="text-sm text-red-700 dark:text-red-400">
                  ⚠️ Votre abonnement a expiré le{' '}
                  <strong>{new Date(currentSubscription?.end_date).toLocaleDateString('fr-FR')}</strong>.
                  <br />
                  Renouvelez maintenant pour réactiver votre abonnement.
                </p>
              </div>

              <div>
                <label className="label-custom">Durée du renouvellement</label>
                <select
                  className="input-logo dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={renewalDuration}
                  onChange={(e) => setRenewalDuration(e.target.value)}
                >
                  <option value="monthly">1 mois (60 DT)</option>
                  <option value="quarterly">3 mois (600 DT)</option>
                  <option value="yearly">1 an (2900 DT)</option>
                </select>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/30">
                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                  <FaEnvelope className="text-blue-500" />
                  <span>Vous recevrez une confirmation par email</span>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleRequestRenewal}
                  disabled={renewalLoading}
                  className="flex-1 btn-logo flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {renewalLoading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <FaCheck />
                      Renouveler
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowRenewalModal(false)}
                  className="btn-secondary flex-1"
                  disabled={renewalLoading}
                >
                  Annuler
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPage;