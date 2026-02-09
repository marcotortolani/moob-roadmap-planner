/**
 * Invitation email template
 * Sent when an admin creates an invitation with signup link
 */

import { Button, Hr, Text } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/email-layout'
import { SendInvitationEmailParams } from '../types'

export const InvitationEmail: React.FC<SendInvitationEmailParams> = ({
  role,
  inviteLink,
  inviterName,
  expiresAt,
}) => {
  const roleNames = {
    ADMIN: 'Administrador',
    USER: 'Usuario',
    GUEST: 'Invitado',
  }

  const expirationDate = new Date(expiresAt).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <EmailLayout
      preview={`Has sido invitado a Roadmap Planner como ${roleNames[role]}`}
      heading="Has sido invitado a Roadmap Planner"
    >
      <Text style={text}>
        <strong>{inviterName}</strong> te ha invitado a unirte a Roadmap Planner,
        nuestra plataforma interna para gestionar roadmaps de productos.
      </Text>

      <Text style={text}>
        Has sido asignado el rol de <strong>{roleNames[role]}</strong>.
      </Text>

      <Text style={text}>
        Roadmap Planner te permite:
      </Text>
      <ul style={list}>
        <li style={listItem}>Planificar y organizar productos con fechas y milestones</li>
        <li style={listItem}>Ver roadmaps en formato lista o calendario</li>
        <li style={listItem}>Gestionar productos por operador, país e idioma</li>
        <li style={listItem}>Visualizar estadísticas y progreso en el dashboard</li>
      </ul>

      <Button href={inviteLink} style={button}>
        Completar Registro
      </Button>

      <Hr style={hr} />

      <Text style={warningText}>
        ⚠️ Este enlace expira el <strong>{expirationDate}</strong> (7 días desde hoy).
      </Text>

      <Text style={smallText}>
        Si no solicitaste esta invitación, puedes ignorar este correo de forma segura.
      </Text>
    </EmailLayout>
  )
}

// Styles

const text = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '1.6',
  marginBottom: '16px',
}

const list = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '1.6',
  marginBottom: '24px',
  paddingLeft: '24px',
}

const listItem = {
  marginBottom: '8px',
}

const button = {
  backgroundColor: '#90EE90',
  border: '3px solid #000000',
  borderRadius: '0',
  color: '#000000',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 'bold',
  padding: '14px 32px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  boxShadow: '4px 4px 0 #000000',
  marginTop: '8px',
  marginBottom: '24px',
}

const hr = {
  border: 'none',
  borderTop: '2px solid #e0e0e0',
  margin: '24px 0',
}

const warningText = {
  color: '#d97706',
  fontSize: '14px',
  lineHeight: '1.5',
  marginBottom: '16px',
  backgroundColor: '#fef3c7',
  padding: '12px',
  border: '2px solid #d97706',
}

const smallText = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '1.5',
  marginTop: '16px',
}
