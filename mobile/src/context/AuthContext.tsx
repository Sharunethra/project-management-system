import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api, setSessionExpiredHandler } from '../api/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  expiredMessage: string | null;
  setExpiredMessage: (msg: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [expiredMessage, setExpiredMessage] = useState<string | null>(null);

  useEffect(() => {
    // Setup session expired handler
    setSessionExpiredHandler(() => {
      setUser(null);
      setToken(null);
      setExpiredMessage('Your session has expired. Please log in again.');
    });

    // Restore authentication state on startup
    const restoreSession = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('pms_jwt_token');
        if (storedToken) {
          setToken(storedToken);
          // Verify with /auth/me
          try {
            const res = await api.get('/auth/me');
            setUser(res.data.user);
            await SecureStore.setItemAsync('pms_user_profile', JSON.stringify(res.data.user));
          } catch (e: any) {
            // Token invalid or expired
            await SecureStore.deleteItemAsync('pms_jwt_token');
            await SecureStore.deleteItemAsync('pms_user_profile');
            setUser(null);
            setToken(null);
            setExpiredMessage('Your session has expired. Please log in again.');
          }
        }
      } catch (err) {
        console.warn('Failed to restore session from SecureStore:', err);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    setExpiredMessage(null);
    const res = await api.post('/auth/login', { email, password });
    const { token: receivedToken, user: receivedUser } = res.data;
    
    // Store securely in Android Keystore / iOS Keychain
    await SecureStore.setItemAsync('pms_jwt_token', receivedToken);
    await SecureStore.setItemAsync('pms_user_profile', JSON.stringify(receivedUser));
    
    setToken(receivedToken);
    setUser(receivedUser);
  };

  const register = async (fullName: string, email: string, password: string) => {
    setExpiredMessage(null);
    const res = await api.post('/auth/register', { fullName, email, password });
    const { token: receivedToken, user: receivedUser } = res.data;

    // Store securely in Android Keystore
    await SecureStore.setItemAsync('pms_jwt_token', receivedToken);
    await SecureStore.setItemAsync('pms_user_profile', JSON.stringify(receivedUser));

    setToken(receivedToken);
    setUser(receivedUser);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Continue even if network fails
    } finally {
      await SecureStore.deleteItemAsync('pms_jwt_token').catch(() => {});
      await SecureStore.deleteItemAsync('pms_user_profile').catch(() => {});
      setUser(null);
      setToken(null);
      setExpiredMessage(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        expiredMessage,
        setExpiredMessage,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
