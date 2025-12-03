import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import React, { createContext, useContext, useState } from 'react';

interface ConfirmationContextType {
  confirmation: FirebaseAuthTypes.ConfirmationResult | null;
  setConfirmation: (confirmation: FirebaseAuthTypes.ConfirmationResult | null) => void;
  phoneNumber: string | null;
  setPhoneNumber: (phoneNumber: string | null) => void;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export function ConfirmationProvider({ children }: { children: React.ReactNode }) {
  const [confirmation, setConfirmation] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

  return (
    <ConfirmationContext.Provider value={{ confirmation, setConfirmation, phoneNumber, setPhoneNumber }}>
      {children}
    </ConfirmationContext.Provider>
  );
}

export function useConfirmation() {
  const context = useContext(ConfirmationContext);
  if (context === undefined) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
}
