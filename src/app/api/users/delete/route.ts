import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const adminSupabase = createAdminSupabaseClient()

    // Get current user session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Get current admin user data (with id)
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_user_id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Check if user is admin
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar usuarios' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      )
    }

    // Get user to delete
    const { data: userToDelete, error: fetchError } = await supabase
      .from('users')
      .select('id, auth_user_id, email')
      .eq('id', userId)
      .single()

    if (fetchError || !userToDelete) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Prevent self-deletion
    if (userToDelete.auth_user_id === session.user.id) {
      return NextResponse.json(
        { error: 'No puedes eliminarte a ti mismo' },
        { status: 400 }
      )
    }

    console.log('🗑️ [Delete User] Starting deletion process:', {
      userToDelete: userToDelete.email,
      adminId: currentUser.id,
    })

    // ✅ OPTIMIZATION: Execute all independent operations in parallel (Sprint 2.3)
    // These 4 operations don't depend on each other, so we can run them simultaneously
    console.log('⚡ [Delete User] Executing parallel cleanup operations...')
    const [
      reassignProductsResult,
      clearUpdatedByResult,
      reassignHistoryResult,
      deleteInvitationsResult,
    ] = await Promise.all([
      // STEP 1: Reassign products created by user
      adminSupabase
        .from('products')
        .update({ created_by_id: currentUser.id, updated_at: new Date().toISOString() })
        .eq('created_by_id', userId)
        .select('id'),

      // STEP 2: Clear updatedBy references
      adminSupabase
        .from('products')
        .update({ updated_by_id: null, updated_at: new Date().toISOString() })
        .eq('updated_by_id', userId),

      // STEP 3: Reassign product history
      adminSupabase
        .from('product_history')
        .update({ changed_by_id: currentUser.id })
        .eq('changed_by_id', userId)
        .select('id'),

      // STEP 4: Delete invitations sent by user
      adminSupabase
        .from('invitations')
        .delete()
        .eq('sent_by_id', userId)
        .select('id'),
    ])

    // Verify results and handle errors
    if (reassignProductsResult.error) {
      console.error('❌ [Delete User] Error reassigning products:', reassignProductsResult.error)
      return NextResponse.json(
        { error: 'Error al reasignar productos del usuario' },
        { status: 500 }
      )
    }

    if (reassignHistoryResult.error) {
      console.error('❌ [Delete User] Error reassigning history:', reassignHistoryResult.error)
      return NextResponse.json(
        { error: 'Error al reasignar historial del usuario' },
        { status: 500 }
      )
    }

    // Log results (non-critical errors just logged)
    if (clearUpdatedByResult.error) {
      console.error('⚠️ [Delete User] Error clearing updatedBy:', clearUpdatedByResult.error)
    }

    if (deleteInvitationsResult.error) {
      console.error('⚠️ [Delete User] Error deleting invitations:', deleteInvitationsResult.error)
    }

    console.log('✅ [Delete User] Parallel operations completed:', {
      reassignedProducts: reassignProductsResult.data?.length || 0,
      reassignedHistory: reassignHistoryResult.data?.length || 0,
      deletedInvitations: deleteInvitationsResult.data?.length || 0,
    })

    // STEP 5: Delete from public.users (MUST run after parallel operations complete)
    console.log('👤 [Delete User] Deleting from public.users...')
    const { error: publicDeleteError } = await adminSupabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (publicDeleteError) {
      console.error('❌ [Delete User] Error deleting from public.users:', publicDeleteError)
      return NextResponse.json(
        { error: `Error al eliminar usuario de la base de datos: ${publicDeleteError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ [Delete User] Deleted from public.users')

    // STEP 6: Delete from auth.users
    console.log('🔐 [Delete User] Deleting from auth.users...')
    const { error: authDeleteError } = await adminSupabase.auth.admin.deleteUser(
      userToDelete.auth_user_id
    )

    if (authDeleteError) {
      console.error('❌ [Delete User] Error deleting from auth.users:', authDeleteError)
      // User is already deleted from public.users, so just log the warning
      console.warn('⚠️ [Delete User] User deleted from public.users but not from auth.users')
    } else {
      console.log('✅ [Delete User] Deleted from auth.users')
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado correctamente',
    })
  } catch (error) {
    console.error('❌ [Delete User] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
