import { ConnectButton, darkTheme, getDefaultWallets, RainbowKitProvider, useConnectModal } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getPublicClient } from '@wagmi/core';
import { el } from '@webtaku/el';
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  createConfig,
  http,
  WagmiProvider
} from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import '../../src/components/wallet.css';

declare const APP_NAME: string;
declare const WALLET_CONNECT_PROJECT_ID: string;

const queryClient = new QueryClient();

// wagmi + rainbowkit 최신 설정
const { connectors } = getDefaultWallets({
  appName: APP_NAME,
  projectId: WALLET_CONNECT_PROJECT_ID,
});

const chain = process.env.NODE_ENV === 'production' ? base : baseSepolia;

const config = createConfig({
  chains: [chain],
  transports: {
    [chain.id]: http(), // RPC를 설정
  } as any,
  connectors,
  ssr: false, // (선택) SSR 사용하지 않을 경우
});

let openWalletConnectModal: () => void;

function ConnectModalController() {
  const { openConnectModal } = useConnectModal();

  useEffect(() => {
    openWalletConnectModal = () => {
      if (openConnectModal) openConnectModal();
    };
  }, [openConnectModal]);

  return null;
}

function createRainbowKit() {
  const container = el();
  createRoot(container).render(
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider theme={darkTheme()}>
          <ConnectModalController />
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
  return container;
}

function createConnectButton() {
  const container = el();
  createRoot(container).render(
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider theme={darkTheme()}>
          <ConnectButton />
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
  return container;
}
const publicClient = getPublicClient(config, { chainId: chain.id });

export {
  createConnectButton, createRainbowKit,
  openWalletConnectModal, publicClient, config as wagmiConfig
};

