import { NextResponse } from "next/server";

// AI-generated content library — ready-to-use Bulgarian posts
// Used by the social media manager to pre-populate the library
export async function GET() {
  return NextResponse.json({ status: "ok", message: "Content library served from page component." });
}
