import { NextResponse } from "next/server"
import { SBI_CASHBACK_REFERRAL } from "@/lib/referrals"

/** 302 to SBI e-apply with a hash-free URL in the Location header. */
export function GET() {
  return NextResponse.redirect(SBI_CASHBACK_REFERRAL.url, 302)
}
