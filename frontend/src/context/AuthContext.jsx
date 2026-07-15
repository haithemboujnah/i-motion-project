import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
          
          const response = await authService.getCurrentUser();
          if (response.data?.profile) {
            setProfile(response.data.profile);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Tentative de connexion avec:', email);
      
      const response = await authService.login(email, password);
      console.log('Réponse de connexion:', response);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        setUser(user);
        setIsAuthenticated(true);
        
        // Récupérer le profil
        try {
          const profileResponse = await authService.getCurrentUser();
          if (profileResponse.data?.profile) {
            setProfile(profileResponse.data.profile);
          }
        } catch (profileError) {
          console.error('Error fetching profile:', profileError);
        }
        
        return { success: true, user };
      } else {
        return { 
          success: false, 
          error: response.error || 'Erreur de connexion' 
        };
      }
    } catch (error) {
      console.error('Login error details:', error);
      console.error('Error response:', error.response);
      
      let errorMessage = 'Erreur de connexion';
      
      if (error.response) {
        // La requête a été faite et le serveur a répondu avec un code d'erreur
        if (error.response.status === 401) {
          errorMessage = 'Email ou mot de passe incorrect';
        } else if (error.response.status === 429) {
          errorMessage = 'Trop de tentatives, veuillez réessayer dans une minute';
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        } else {
          errorMessage = `Erreur ${error.response.status}: ${error.response.statusText}`;
        }
      } else if (error.request) {
        // La requête a été faite mais pas de réponse
        errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
      } else {
        // Erreur lors de la configuration de la requête
        errorMessage = error.message || 'Erreur inconnue';
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const register = async (userData) => {
    try {
      console.log('Tentative d\'inscription avec:', userData);
      
      const response = await authService.register(userData);
      console.log('Réponse d\'inscription:', response);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        setUser(user);
        setIsAuthenticated(true);
        
        return { success: true, user };
      } else {
        return { 
          success: false, 
          error: response.error || 'Erreur d\'inscription' 
        };
      }
    } catch (error) {
      console.error('Register error details:', error);
      
      let errorMessage = 'Erreur d\'inscription';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
    toast.success('Déconnexion réussie');
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      
      if (response.data.user) {
        const updatedUser = response.data.user;
        setUser(updatedUser);
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const newUser = { ...storedUser, ...updatedUser };
        localStorage.setItem('user', JSON.stringify(newUser));
      }
      
      if (response.data.profile) {
        setProfile(response.data.profile);
      }
      
      return { 
        success: true, 
        user: response.data.user,
        profile: response.data.profile 
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Erreur lors de la mise à jour' 
      };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      await authService.changePassword(passwordData);
      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Erreur lors du changement de mot de passe' 
      };
    }
  };

  const value = {
    user,
    profile,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    setUser,
    setProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;