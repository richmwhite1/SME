"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import SignalReceivedToast from "./SignalReceivedToast";

interface SignalMessage {
  id: string;
  points: number;
  reason?: string;
}

interface SignalContextType {
  showSignal: (points: number, reason?: string) => void;
}

const SignalContext = createContext<SignalContextType | undefined>(undefined);

export function SignalProvider({ children }: { children: ReactNode }) {
  const [signals, setSignals] = useState<SignalMessage[]>([]);

  const showSignal = (points: number, reason?: string) => {
    const id = Math.random().toString(36).substring(7);
    setSignals((prev) => [...prev, { id, points, reason }]);
  };

  const removeSignal = (id: string) => {
    setSignals((prev) => prev.filter((signal) => signal.id !== id));
  };

  return (
    <SignalContext.Provider value={{ showSignal }}>
      {children}
      {signals.map((signal) => (
        <SignalReceivedToast
          key={signal.id}
          points={signal.points}
          reason={signal.reason}
          onClose={() => removeSignal(signal.id)}
        />
      ))}
    </SignalContext.Provider>
  );
}

export function useSignal() {
  const context = useContext(SignalContext);
  if (!context) {
    throw new Error("useSignal must be used within SignalProvider");
  }
  return context;
}



