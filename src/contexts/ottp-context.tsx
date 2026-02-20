"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useAccount } from "wagmi";
import { getSubjectByWallet, registerSubject } from "@/lib/data";
import type { Subject } from "@/types/database";

interface OttpContextType {
  subject: Subject | null;
  loading: boolean;
  register: (name: string) => Promise<Subject>;
  refresh: () => Promise<void>;
}

const OttpContext = createContext<OttpContextType>({
  subject: null,
  loading: true,
  register: async () => {
    throw new Error("Not initialized");
  },
  refresh: async () => {},
});

export function useOttp() {
  return useContext(OttpContext);
}

export function OttpProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSubject = useCallback(async () => {
    if (!address) {
      setSubject(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const s = await getSubjectByWallet(address);
      setSubject(s);
    } catch {
      setSubject(null);
    }
    setLoading(false);
  }, [address]);

  useEffect(() => {
    if (isConnected && address) {
      loadSubject();
    } else {
      setSubject(null);
      setLoading(false);
    }
  }, [isConnected, address, loadSubject]);

  const register = useCallback(
    async (name: string) => {
      if (!address) throw new Error("Wallet not connected");
      const s = await registerSubject(address, name);
      setSubject(s);
      return s;
    },
    [address]
  );

  return (
    <OttpContext.Provider
      value={{ subject, loading, register, refresh: loadSubject }}
    >
      {children}
    </OttpContext.Provider>
  );
}
