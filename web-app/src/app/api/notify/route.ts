import { NextRequest, NextResponse } from 'next/server';
import pool, { initSchema } from '../../../lib/db';

export async function POST(req: NextRequest) {
  const { email, productId, notes, investmentSize } = await req.json();

  if (!email || !productId) {
    return NextResponse.json({ error: 'email and productId required' }, { status: 400 });
  }

  try {
    await initSchema();
    await pool.query(
      `INSERT INTO peckerheckler.notify_me (email, product_id, notes, investment_size_usd) VALUES ($1, $2, $3, $4)`,
      [email, productId, notes || null, investmentSize || null]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
