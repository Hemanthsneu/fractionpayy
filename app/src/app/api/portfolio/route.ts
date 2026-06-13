import { NextRequest, NextResponse } from "next/server";
import { isAddress, type Address } from "viem";
import { getPortfolio } from "@/lib/portfolio";
import { demoWallets } from "@/lib/deployments";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("address") ?? demoWallets.buyer;
  if (!isAddress(raw)) {
    return NextResponse.json({ error: "invalid address" }, { status: 400 });
  }
  const positions = await getPortfolio(raw as Address);
  const totalUsd = positions.reduce((s, p) => s + p.valueUsd, 0);
  return NextResponse.json({ address: raw, totalUsd, positions });
}
