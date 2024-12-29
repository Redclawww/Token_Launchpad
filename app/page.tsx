"use client";
import { TokenLaunchpadCreator } from "@/components/token-launchpad-creator";
import React, { FC, useMemo } from "react";
import {
  ConnectionProvider,
  useWallet,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
// Default styles that can be overridden by your app
import "@solana/wallet-adapter-react-ui/styles.css";

export default function Home() {
  return (
    <ConnectionProvider endpoint={"https://api.devnet.solana.com"}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
         {/* <div className="flex items-center justify-center gap-5 pt-10">
         <WalletMultiButton />
         <WalletDisconnectButton />
         </div> */}
          <main className="  px-4 py-8 h-full w-full">
            <LaunchpadContent />
          </main>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}


const LaunchpadContent = () => {
  const { connected } = useWallet();

  return (
    <div>
      <div className="flex items-center justify-center gap-5 pt-10">
        <WalletMultiButton />
        <WalletDisconnectButton />
      </div>
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Solana Token Launchpad
        </h1>
        {connected ? (
          <TokenLaunchpadCreator />
        ) : (
          <div className="text-center mt-8 text-gray-600">
            Please connect your wallet to use the Token Launchpad
          </div>
        )}
      </main>
    </div>
  );
};

