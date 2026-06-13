import { NextRequest, NextResponse } from "next/server";
import { getExecutionReference } from "@/lib/uniswap";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const usd = Number(request.nextUrl.searchParams.get("usd") ?? "6");
  const ref = await getExecutionReference(usd);
  if (!ref) return NextResponse.json({ available: false }, { status: 200 });
  return NextResponse.json({ available: true, ...ref });
}
