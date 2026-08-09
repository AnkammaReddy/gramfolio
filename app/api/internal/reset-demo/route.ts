// This route is permanently disabled — demo login is turned off for security reasons.
// Do not re-enable without removing the hardcoded secret and demo credentials first.
import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 })
}

export async function POST() {
  return NextResponse.json({ error: "Not found" }, { status: 404 })
}
