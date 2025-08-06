import { disconnect } from "@wagmi/core";
import { wagmiConfig } from "../components/wallet";
import { tokenManager } from "./token-mananger";

async function logout() {
  tokenManager.clear();
  await disconnect(wagmiConfig);
}

export { logout };
