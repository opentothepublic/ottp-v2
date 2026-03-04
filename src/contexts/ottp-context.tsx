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
import { shortenAddress } from "@/lib/utils";
import type { Subject } from "@/types/database";

interface OttpContextType {
  subject: Subject | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const OttpContext = createContext<OttpContextType>({
  subject: null,
  loading: true,
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
      let s = await getSubjectByWallet(address);
      if (!s) {
        // Auto-register: look up Farcaster first
        let name = shortenAddress(address);
        let fcData: Record<string, unknown> | null = null;

        try {
          const res = await fetch(`/api/farcaster?address=${address}`);
          const data = await res.json();
          if (res.ok && data.user) {
            name = data.user.display_name || data.user.username || name;
            fcData = data.user;
          }
        } catch {
          // FC lookup failed, continue with address as name
        }

        const metadata: Record<string, unknown> = {};
        if (fcData) metadata.farcaster = fcData;

        s = await registerSubject(address, name, metadata);
      }
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

  return (
    <OttpContext.Provider
      value={{ subject, loading, refresh: loadSubject }}
    >
      {children}
    </OttpContext.Provider>
  );
}
