'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// Define a type for the user metadata
interface UserMetadata {
  email?: string;
  // Add other user properties you expect
  [key: string]: any;
}

interface UserContextType {
  userMetadata: UserMetadata | null;
  setUserMetadata: (metadata: UserMetadata | null) => void;
  isAuthenticated: boolean;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userMetadata, setUserMetadata] = useState<UserMetadata | null>(null);
  
  // Compute isAuthenticated based on userMetadata existence
  const isAuthenticated = Boolean(userMetadata);

  // Logout function to clear user data
  const logout = useCallback(() => {
    setUserMetadata(null);
    // You might want to add other cleanup here
    // For example, clearing localStorage, cookies, etc.
  }, []);

  return (
    <UserContext.Provider 
      value={{ 
        userMetadata, 
        setUserMetadata, 
        isAuthenticated,
        logout 
      }}
    >
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
