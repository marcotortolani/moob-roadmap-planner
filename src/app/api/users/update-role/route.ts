import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // Get current user
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Get current user data
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role')
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
        { error: 'No tienes permisos para modificar roles' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, newRole } = body

    if (!userId || !newRole) {
      return NextResponse.json(
        { error: 'userId y newRole son requeridos' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['ADMIN', 'USER', 'GUEST', 'BLOCKED'].includes(newRole)) {
      return NextResponse.json(
        { error: 'Rol inválido. Debe ser ADMIN, USER, GUEST o BLOCKED' },
        { status: 400 }
      )
    }

    // Get user to update
    const { data: userToUpdate, error: fetchError } = await supabase
      .from('users')
      .select('auth_user_id')
      .eq('id', userId)
      .single()

    if (fetchError || !userToUpdate) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Prevent changing own role
    if (userToUpdate.auth_user_id === session.user.id) {
      return NextResponse.json(
        { error: 'No puedes modificar tu propio rol' },
        { status: 400 }
      )
    }

    // Update role
    console.log('🔄 [Update Role] Attempting to update:', {
      userId,
      newRole,
      currentUserRole: currentUser.role,
    })

    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()

    console.log('🔄 [Update Role] Update result:', {
      data: updateData,
      error: updateError,
      rowsAffected: updateData?.length || 0,
    })

    if (updateError) {
      console.error('❌ [Update Role] Error updating role:', updateError)
      return NextResponse.json(
        { error: `Error al actualizar el rol: ${updateError.message}` },
        { status: 500 }
      )
    }

    if (!updateData || updateData.length === 0) {
      console.error('❌ [Update Role] No rows were updated')
      return NextResponse.json(
        { error: 'No se pudo actualizar el rol. Verifica los permisos.' },
        { status: 500 }
      )
    }

    console.log('✅ [Update Role] Role updated successfully:', updateData[0])

    return NextResponse.json({
      success: true,
      message: 'Rol actualizado correctamente',
      data: updateData[0],
    })
  } catch (error) {
    console.error('Error updating role:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
