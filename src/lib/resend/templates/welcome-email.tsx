/**
 * Welcome email template
 * Sent after a user completes signup successfully
 */

import { Button, Text } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/email-layout'
import { SendWelcomeEmailParams } from '../types'

export const WelcomeEmail: React.FC<SendWelcomeEmailParams> = ({
  firstName,
  role,
}) => {
  const roleNames = {
    ADMIN: 'Administrador',
    USER: 'Usuario',
    GUEST: 'Invitado',
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://roadmap-planner.vercel.app'

  return (
    <EmailLayout
      preview="¡Bienvenido a Roadmap Planner! Tu cuenta está lista"
      heading={`¡Bienvenido, ${firstName}!`}
    >
      <Text style={text}>
        Tu cuenta en Roadmap Planner ha sido creada exitosamente con el rol de{' '}
        <strong>{roleNames[role]}</strong>.
      </Text>

      <Text style={text}>
        Ahora puedes acceder a todas las funcionalidades de la plataforma:
      </Text>

      <div style={featureBox}>
        <Text style={featureTitle}>📋 Ver Roadmaps</Text>
        <Text style={featureDescription}>
          Visualiza todos los productos en vista de lista o calendario, con
          filtros por operador, país, idioma y estado.
        </Text>
      </div>

      <div style={featureBox}>
        <Text style={featureTitle}>✏️ Crear y Gestionar Productos</Text>
        <Text style={featureDescription}>
          Crea productos con fechas de inicio/fin, milestones, URLs (demo,
          productivo, contenido WordPress, chatbot) y más.
        </Text>
      </div>

      <div style={featureBox}>
        <Text style={featureTitle}>📊 Dashboard de Estadísticas</Text>
        <Text style={featureDescription}>
          Analiza el progreso de tus productos con gráficos y métricas en tiempo
          real.
        </Text>
      </div>

      <div style={featureBox}>
        <Text style={featureTitle}>👤 Personalizar Perfil</Text>
        <Text style={featureDescription}>
          Actualiza tu información personal, foto de perfil y preferencias.
        </Text>
      </div>

      <Button href={appUrl} style={button}>
        Ir a Roadmap Planner
      </Button>

      <Text style={helpText}>
        Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos a
        marco-ext@memoob.com
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

const featureBox = {
  backgroundColor: '#f9fafb',
  border: '2px solid #e5e7eb',
  padding: '16px',
  marginBottom: '16px',
}

const featureTitle = {
  color: '#000000',
  fontSize: '16px',
  fontWeight: 'bold',
  marginBottom: '8px',
  marginTop: '0',
}

const featureDescription = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
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

const helpText = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '1.5',
  marginTop: '24px',
}
