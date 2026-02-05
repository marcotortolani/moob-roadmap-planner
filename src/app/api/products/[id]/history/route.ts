import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Await params (Next.js 15 requirement)
    const { id } = await params;
    const productId = id;

    console.log('📜 [Product History API] Fetching history for product:', productId);

    // Fetch product history with user information
    const { data: history, error } = await supabase
      .from('product_history')
      .select(
        `
        id,
        change_type,
        field_name,
        old_value,
        new_value,
        changed_at,
        changed_by:users!product_history_changed_by_id_fkey (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `
      )
      .eq('product_id', productId)
      .order('changed_at', { ascending: false });

    if (error) {
      console.error('📜 [Product History API] Error:', error);
      return NextResponse.json(
        { error: `Error al obtener historial: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('📜 [Product History API] Found', history?.length || 0, 'changes');

    return NextResponse.json({
      success: true,
      data: history || [],
    });
  } catch (error) {
    console.error('📜 [Product History API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
