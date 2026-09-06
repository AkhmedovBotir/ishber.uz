import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { CandidateProfile } from '../types';
import { checkCandidatePhone, updateCandidateName } from '../services/api';

interface AuthContextType {
  phone: string;
  profile: CandidateProfile | null;
  loading: boolean;
  checkPhone: (phoneNumber: string) => Promise<CandidateProfile>;
  saveName: (fullName: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [phone, setPhone] = useState<string>(() => {
    return localStorage.getItem('nomzod_phone') || '';
  });
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const checkPhone = useCallback(async (phoneNumber: string): Promise<CandidateProfile> => {
    try {
      setLoading(true);
      const data = await checkCandidatePhone(phoneNumber);
      setProfile(data);
      setPhone(phoneNumber);
      localStorage.setItem('nomzod_phone', phoneNumber);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!phone) return;
    try {
      setLoading(true);
      const data = await checkCandidatePhone(phone);
      setProfile(data);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  }, [phone]);

  const saveName = useCallback(async (fullName: string) => {
    if (!profile?.phone) return;
    const updated = await updateCandidateName(profile.phone, fullName);
    setProfile(updated);
  }, [profile?.phone]);

  const logout = useCallback(() => {
    localStorage.removeItem('nomzod_phone');
    setPhone('');
    setProfile(null);
  }, []);

  useEffect(() => {
    if (phone) {
      checkPhone(phone).catch(() => {
        localStorage.removeItem('nomzod_phone');
        setPhone('');
        setProfile(null);
      });
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        phone,
        profile,
        loading,
        checkPhone,
        saveName,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
