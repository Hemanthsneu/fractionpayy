import { NextRequest, NextResponse } from "next/server";
import { getSettlementRoute } from "@/lib/lifi";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const usd = Number(request.nextUrl.searchParams.get("usd") ?? "6");
  const chain = (request.nextUrl.searchParams.get("chain") ?? "optimism") as
    | "optimism"
    | "arbitrum"
    | "polygon";
  const route = await getSettlementRoute(chain, usd);
  if (!route) return NextResponse.json({ available: false }, { status: 200 });
  return NextResponse.json({ available: true, ...route });
}
