'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<User | null>;
  signOutUser: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isConfigured: false,
  authError: null,
  signInWithGoogle: async () => null,
  signOutUser: async () => {},
  clearAuthError: () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const configured = isFirebaseConfigured();

  useEffect(() => {
    if (!configured || !auth) {
      setLoading(false);
      return;
    }

    try {
      // Set persistence to local so user stays logged in across refreshes and tab switches
      setPersistence(auth, browserLocalPersistence).catch((err) => {
        console.warn('Could not set auth persistence to browserLocalPersistence:', err);
      });

      const unsubscribe = onAuthStateChanged(
        auth,
        (currentUser) => {
          setUser(currentUser);
          setLoading(false);
        },
        (error) => {
          console.error('Auth state change error:', error);
          setAuthError(error.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error attaching auth state listener:', err);
      setLoading(false);
    }
  }, [configured]);

  const signInWithGoogle = async (): Promise<User | null> => {
    setAuthError(null);
    if (!configured || !auth || !googleProvider) {
      const err = 'Firebase is not yet configured in .env. Please configure your Firebase keys to enable cloud sync.';
      setAuthError(err);
      return null;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      return result.user;
    } catch (error: any) {
      console.error('Google Sign-In failed:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in popup was closed before completing.');
      } else if (error.code === 'auth/unauthorized-domain') {
        setAuthError('This domain is not authorized in Firebase Console -> Authentication -> Settings -> Authorized domains.');
      } else {
        setAuthError(error.message || 'Google Sign-In failed. Please try again.');
      }
      return null;
    }
  };

  const signOutUser = async () => {
    setAuthError(null);
    if (!auth) {
      setUser(null);
      return;
    }

    try {
      await signOut(auth);
      setUser(null);
    } catch (error: any) {
      console.error('Sign-out failed:', error);
      setAuthError(error.message || 'Failed to sign out.');
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isConfigured: configured,
        authError,
        signInWithGoogle,
        signOutUser,
        clearAuthError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
