'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { AuthService } from '@/services/auth-service';

// Define a type for the user metadata
interface UserMetadata {
  email?: string;
  // Add other user properties you expect
  [key: string]: any;
}

interface UserContextType {
  userMetadata: any;
  setUserMetadata: (metadata: any) => void;
  didToken: string;
  setDidToken: (token: string) => void;
  publicAddress: string;
  setPublicAddress: (address: string) => void;
  isAuthenticated: boolean;
  /** False until localStorage session has been read on the client. */
  isInitialized: boolean;
  logout: () => void;
}

export const UserContext = createContext<UserContextType>({
  userMetadata: null,
  setUserMetadata: () => {},
  didToken: '',
  setDidToken: () => {},
  publicAddress: '',
  setPublicAddress: () => {},
  isAuthenticated: false,
  isInitialized: false,
  logout: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [userMetadata, setUserMetadata] = useState<any>(null);
  const [didToken, setDidTokenState] = useState<string>(AuthService.getToken());
  const [publicAddress, setPublicAddress] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    const storedDidToken = localStorage.getItem('didToken') || '';
    const storedPublicAddress = localStorage.getItem('publicAddress') || '';
    const storedUserMetadata = localStorage.getItem('userMetadata');
    
    setDidTokenState(storedDidToken);
    setPublicAddress(storedPublicAddress);
    
    try {
      if (storedUserMetadata) {
        const parsedMetadata = JSON.parse(storedUserMetadata);
        if (parsedMetadata) setUserMetadata(parsedMetadata);
      }
    } catch (error) {
      console.warn('Failed to parse stored user metadata:', error);
      localStorage.removeItem('userMetadata'); // Clear invalid data
    }
    
    setIsInitialized(true);
  }, []);

  const isAuthenticated = Boolean(userMetadata && didToken);

  const logout = useCallback(() => {
    try {
      // Clear state
      setUserMetadata(null);
      setDidTokenState('');
      setPublicAddress('');
      
      // Clear storage
      AuthService.removeToken();
      localStorage.removeItem('userMetadata');
      localStorage.removeItem('publicAddress');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const storagePublicAddress = (address: string) => {
    localStorage.setItem('publicAddress', address);
    setPublicAddress(address);
  };

  const setDidToken = useCallback((token: string) => {
    AuthService.setToken(token);
    setDidTokenState(token);
  }, []);
  
  const setUserMetadataWithStorage = (metadata: any) => {
    localStorage.setItem('userMetadata', JSON.stringify(metadata))
    setUserMetadata(metadata);
  }

  return (
    <UserContext.Provider value={{
      userMetadata,
      setUserMetadata : setUserMetadataWithStorage,
      didToken,
      setDidToken,
      publicAddress,
      setPublicAddress : storagePublicAddress,
      isAuthenticated,
      isInitialized,
      logout,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
