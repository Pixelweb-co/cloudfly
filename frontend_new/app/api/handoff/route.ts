import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface HandoffPayload {
  conversation_id: string;
  target_agent_id: string;
  metadata?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as HandoffPayload;
    // Forward to backend service (ia_scrum_team)
    const backendRes = await fetch(process.env.IA_SCRUM_TEAM_URL + '/handoff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.INTERNAL_API_TOKEN}`,
      },
      body: JSON.stringify(body),
    });
    const data = await backendRes.json();
    if (!backendRes.ok) {
      return NextResponse.json({ detail: data?.detail || 'Error del servicio' }, { status: backendRes.status });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Error interno' }, { status: 500 });
  }
}
