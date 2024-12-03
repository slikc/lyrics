// proxy request to POST localhost:3001/stream json {id: "track_id"}
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { id } = await request.json();

  const response = await fetch("http://localhost:3001/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });

  if (!response.ok) {
    return NextResponse.json({ success: false, error: response.statusText });
  }

  const data = await response.json();

  return NextResponse.json({ success: true, ...data });
}
