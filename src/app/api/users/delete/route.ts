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

    // STEP 1: Reassign all products created by this user to the admin
    console.log('📦 [Delete User] Reassigning products created by user...')
    const { data: reassignedProducts, error: reassignProductsError } = await adminSupabase
      .from('products')
      .update({ created_by_id: currentUser.id })
      .eq('created_by_id', userId)
      .select('id')

    if (reassignProductsError) {
      console.error('❌ [Delete User] Error reassigning products:', reassignProductsError)
      return NextResponse.json(
        { error: 'Error al reasignar productos del usuario' },
        { status: 500 }
      )
    }

    console.log(`✅ [Delete User] Reassigned ${reassignedProducts?.length || 0} products`)

    // STEP 2: Clear updatedBy references (will be set to NULL automatically by onDelete: SetNull)
    console.log('🔄 [Delete User] Clearing updatedBy references...')
    const { error: clearUpdatedByError } = await adminSupabase
      .from('products')
      .update({ updated_by_id: null })
      .eq('updated_by_id', userId)

    if (clearUpdatedByError) {
      console.error('❌ [Delete User] Error clearing updatedBy:', clearUpdatedByError)
      // Don't fail the deletion for this, just log it
    }

    // STEP 3: Reassign product history to admin
    console.log('📝 [Delete User] Reassigning product history...')
    const { data: reassignedHistory, error: reassignHistoryError } = await adminSupabase
      .from('product_history')
      .update({ changed_by_id: currentUser.id })
      .eq('changed_by_id', userId)
      .select('id')

    if (reassignHistoryError) {
      console.error('❌ [Delete User] Error reassigning history:', reassignHistoryError)
      return NextResponse.json(
        { error: 'Error al reasignar historial del usuario' },
        { status: 500 }
      )
    }

    console.log(`✅ [Delete User] Reassigned ${reassignedHistory?.length || 0} history entries`)

    // STEP 4: Delete invitations sent by this user (will cascade automatically)
    console.log('📧 [Delete User] Deleting invitations...')
    const { data: deletedInvitations, error: deleteInvitationsError } = await adminSupabase
      .from('invitations')
      .delete()
      .eq('sent_by_id', userId)
      .select('id')

    if (deleteInvitationsError) {
      console.error('❌ [Delete User] Error deleting invitations:', deleteInvitationsError)
      // Don't fail the deletion for this
    } else {
      console.log(`✅ [Delete User] Deleted ${deletedInvitations?.length || 0} invitations`)
    }

    // STEP 5: Delete from public.users table first (using admin client to bypass RLS)
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
