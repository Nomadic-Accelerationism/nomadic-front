'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

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

  const isAuthenticated = Boolean(userMetadata);

  const logout = useCallback(() => {
    setUserMetadata(null);
    setDidToken('');
    setPublicAddress('');
    // Add any other cleanup you need here
    // For example: localStorage.clear();
  }, []);

  return (
    <UserContext.Provider value={{
      userMetadata,
      setUserMetadata,
      didToken,
      setDidToken,
      publicAddress,
      setPublicAddress,
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
