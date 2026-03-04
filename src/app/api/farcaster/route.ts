import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");

  if (!address) {
    return NextResponse.json(
      { error: "address query param required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.NEYNAR_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Neynar API key not configured" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${encodeURIComponent(address.toLowerCase())}`,
      {
        headers: { "x-api-key": apiKey },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Neynar API error", status: res.status },
        { status: 502 }
      );
    }

    const data = await res.json();
    const users = data[address.toLowerCase()];

    if (!users || users.length === 0) {
      return NextResponse.json({ user: null });
    }

    const user = users[0];
    return NextResponse.json({
      user: {
        fid: user.fid,
        username: user.username,
        display_name: user.display_name,
        pfp_url: user.pfp_url,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch from Neynar" },
      { status: 500 }
    );
  }
}
