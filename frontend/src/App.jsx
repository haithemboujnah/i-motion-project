import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Pages Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Pages Adhérent
import Dashboard from './pages/adherent/Dashboard';
import Sessions from './pages/adherent/Sessions';
import Performance from './pages/adherent/Performance';
import Programs from './pages/adherent/Programs';
import Gamification from './pages/adherent/Gamification';
import Notifications from './pages/adherent/Notifications';
import Profile from './pages/adherent/Profile';
import Exercises from './pages/adherent/Exercises';

// Pages Coach
import CoachDashboard from './pages/coach/CoachDashboard';
import CoachAdherents from './pages/coach/CoachAdherents';
import CoachAdherentDetail from './pages/coach/CoachAdherentDetail';
import CoachSessions from './pages/coach/CoachSessions';
import CoachPerformance from './pages/coach/CoachPerformance';
import CoachNotifications from './pages/coach/CoachNotifications';
import CoachSessionCreate from './pages/coach/CoachSessionCreate';
import CoachExercises from './pages/coach/CoachExercises';

// Pages Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPrograms from './pages/admin/AdminPrograms';
import AdminGamification from './pages/admin/AdminGamification';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminSupervision from './pages/admin/AdminSupervision';
import AdminSettings from './pages/admin/AdminSettings';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminSessions from './pages/admin/AdminSessions';
import AdminChurn from './pages/admin/AdminChurn';
import AdminAdherentDetail from './pages/admin/AdminAdherentDetail';

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';

import SubscriptionPage from './pages/payment/SubscriptionPage';
import PaymentSuccess from './pages/payment/PaymentSuccess';
import PaymentCancel from './pages/payment/PaymentCancel';
import PaymentHistory from './pages/payment/PaymentHistory';
import ChatbotPage from './pages/ChatbotPage';
import Chatbot from './components/chatbot/Chatbot';
import QRCode from './pages/adherent/QRCode';
import CoachAttendanceHistory from './pages/coach/CoachAttendanceHistory';

import Feedback from './pages/adherent/Feedback';
import AdminFeedback from './pages/admin/AdminFeedback';
import BIDashboard from './pages/admin/BIDashboard';

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#22c55e',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                },
              },
            }}
          />
          <Routes>
            {/* Routes publiques */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Routes Adhérent (par défaut) */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
            <Route path="/performance" element={<ProtectedRoute><Performance /></ProtectedRoute>} />
            <Route path="/programs" element={<ProtectedRoute><Programs /></ProtectedRoute>} />
            <Route path="/exercises" element={<ProtectedRoute><Exercises /></ProtectedRoute>} />
            <Route path="/gamification" element={<ProtectedRoute><Gamification /></ProtectedRoute>} />
            <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>}/>

            {/* Routes Partagées (Notifications et Profile) */}
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* Routes Coach */}
            <Route path="/coach/dashboard" element={<ProtectedRoute allowedRoles={['coach', 'admin']}><CoachDashboard /></ProtectedRoute>} />
            <Route path="/coach/adherents" element={<ProtectedRoute allowedRoles={['coach', 'admin']}><CoachAdherents /></ProtectedRoute>} />
            <Route path="/coach/adherents/:id" element={<ProtectedRoute allowedRoles={['coach', 'admin']}><CoachAdherentDetail /></ProtectedRoute>} />
            <Route path="/coach/sessions" element={<ProtectedRoute allowedRoles={['coach', 'admin']}><CoachSessions /></ProtectedRoute>} />
            <Route path="/coach/performances" element={<ProtectedRoute allowedRoles={['coach', 'admin']}><CoachPerformance /></ProtectedRoute>} />
            <Route path="/coach/notifications" element={<ProtectedRoute allowedRoles={['coach', 'admin']}><CoachNotifications /></ProtectedRoute>} />
            <Route path="/coach/sessions/create" element={<ProtectedRoute allowedRoles={['coach', 'admin']}><CoachSessionCreate  /></ProtectedRoute>} />
            <Route path="/coach/exercises" element={<ProtectedRoute allowedRoles={['coach', 'admin']}><CoachExercises /></ProtectedRoute>} />
            <Route path="/coach/attendance-history" element={<ProtectedRoute allowedRoles={['coach', 'admin']}><CoachAttendanceHistory /></ProtectedRoute>} />
            
            {/* Routes Admin */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/programs" element={<ProtectedRoute allowedRoles={['admin']}><AdminPrograms /></ProtectedRoute>} />
            <Route path="/admin/gamification" element={<ProtectedRoute allowedRoles={['admin']}><AdminGamification /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><AdminAnalytics /></ProtectedRoute>} />
            <Route path="/admin/supervision" element={<ProtectedRoute allowedRoles={['admin']}><AdminSupervision /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} />
            <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={['admin']}><AdminNotifications /></ProtectedRoute>} />
            <Route path="/admin/sessions" element={<ProtectedRoute allowedRoles={['admin']}><AdminSessions /></ProtectedRoute>} />
            <Route path="/admin/churn" element={<ProtectedRoute allowedRoles={['admin']}><AdminChurn /></ProtectedRoute>} />
            <Route path="/admin/adherents/:id" element={<ProtectedRoute allowedRoles={['admin']}><AdminAdherentDetail /></ProtectedRoute>} />
            <Route path="/admin/feedback" element={<ProtectedRoute allowedRoles={['admin']}><AdminFeedback /></ProtectedRoute>} />
            <Route path="/admin/bi-dashboard" element={<ProtectedRoute allowedRoles={['admin']}><BIDashboard  /></ProtectedRoute>} />
            {/* Routes Paiement */}
            <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
            <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
            <Route path="/payment-cancel" element={<ProtectedRoute><PaymentCancel /></ProtectedRoute>} />
            <Route path="/payment/history" element={<ProtectedRoute><PaymentHistory /></ProtectedRoute>} />

            {/* Route Chatbot */}
            <Route path="/chatbot" element={<ProtectedRoute><ChatbotPage /></ProtectedRoute>} />

            {/* Route QR Code */}
            <Route path="/qr-code" element={<ProtectedRoute><QRCode /></ProtectedRoute>} />

            {/* Redirection */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;