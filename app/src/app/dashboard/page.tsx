import { WalletGate } from "@/components/Gate";
import { DashboardClient } from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

export default function Dashboard() {
  return (
    <WalletGate subtitle="Connect a wallet to open your tokenized portfolio — holdings, yield, and one-tap spending.">
      <DashboardClient />
    </WalletGate>
  );
}
