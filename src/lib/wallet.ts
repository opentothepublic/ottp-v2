import { getDefaultConfig } from "connectkit";
import { createConfig, http } from "wagmi";
import { base, mainnet } from "wagmi/chains";

export const config = createConfig(
  getDefaultConfig({
    chains: [base, mainnet],
    transports: {
      [base.id]: http(),
      [mainnet.id]: http(),
    },
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
    appName: "OTTP",
    appDescription: "Open to the Public — open collaboration protocol",
  })
);
