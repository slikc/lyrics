import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const auth_details = await auth();

    const response = await fetch(
      `https://api.spotify.com/v1/tracks/${request.nextUrl.searchParams.get(
        "id"
      )}`,
      {
        headers: {
          Authorization: `Bearer ${auth_details.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.log(response.statusText);
      return NextResponse.json({ success: false, error: response.statusText });
    }

    const data = await response.json();

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.log(e);
    return NextResponse.json({ success: false, error: "idk" });
  }
}
