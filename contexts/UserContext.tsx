'use client';

import { createContext, useContext, useState, ReactNode, useCallback,useEffect } from 'react';

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
  logout: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [userMetadata, setUserMetadata] = useState<any>(null);
  const [didToken, setDidToken] = useState<string>('');
  const [publicAddress, setPublicAddress] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    const storedDidToken = localStorage.getItem('didToken') || '';
    const storedPublicAddress = localStorage.getItem('publicAddress') || '';
    const storedUserMetadata = localStorage.getItem('userMetadata');
    
    setDidToken(storedDidToken);
    setPublicAddress(storedPublicAddress);
    if (storedUserMetadata) {
      setUserMetadata(JSON.parse(storedUserMetadata))
    }
    setIsInitialized(true);
  }, []);

  const isAuthenticated = Boolean(userMetadata);

  const logout = useCallback(() => {
    setUserMetadata(null);
    localStorage.removeItem('userMetadata');
    localStorage.removeItem('didToken');
    localStorage.removeItem('publicAddress');
    storageDidToken('');
    storagePublicAddress('');
  }, []);

  const storagePublicAddress = (address: string) => {
    localStorage.setItem('publicAddress', address);
    setPublicAddress(address);
  };

  const storageDidToken = (token: string) => {
    localStorage.setItem('didToken', token);
    setDidToken(token);
  };
  
  const setUserMetadataWithStorage = (metadata: any) => {
    localStorage.setItem('userMetadata', JSON.stringify(metadata))
    setUserMetadata(metadata);
  }

  return (
    <UserContext.Provider value={{
      userMetadata,
      setUserMetadata : setUserMetadataWithStorage,
      didToken,
      setDidToken : storageDidToken,
      publicAddress,
      setPublicAddress : storagePublicAddress,
      isAuthenticated,
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
