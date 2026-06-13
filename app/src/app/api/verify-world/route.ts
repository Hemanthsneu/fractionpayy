/**
 * World ID proof verification (Track B: proof of personhood).
 * Verifies the IDKit proof server-side against the World developer portal.
 * Sybil resistance: the action `verify-human` is max_verifications=1, so the
 * same human's nullifier_hash can pass exactly once.
 */
import { NextRequest, NextResponse } from "next/server";

const APP_ID = process.env.NEXT_PUBLIC_WORLD_APP_ID ?? "";
const ACTION = process.env.NEXT_PUBLIC_WORLD_ACTION_ID ?? "verify-human";

export async function POST(request: NextRequest) {
  const { proof, merkle_root, nullifier_hash, verification_level } = await request
    .json()
    .catch(() => ({}));

  if (!proof || !nullifier_hash) {
    return NextResponse.json({ ok: false, error: "missing proof" }, { status: 400 });
  }

  const res = await fetch(`https://developer.worldcoin.org/api/v2/verify/${APP_ID}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      proof,
      merkle_root,
      nullifier_hash,
      verification_level,
      action: ACTION,
    }),
  });

  const data = await res.json();
  if (res.ok) {
    return NextResponse.json({ ok: true, nullifier_hash, verification_level });
  }
  // already_verified means this human already passed — still a valid human.
  if (data?.code === "max_verifications_reached" || data?.code === "already_verified") {
    return NextResponse.json({ ok: true, alreadyVerified: true, nullifier_hash });
  }
  return NextResponse.json({ ok: false, error: data?.code ?? "verify_failed", detail: data }, {
    status: 400,
  });
}
