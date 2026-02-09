/**
 * Base email layout component
 * Provides consistent header, footer, and styling for all emails
 */

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface EmailLayoutProps {
  preview: string
  heading: string
  children: React.ReactNode
}

export const EmailLayout: React.FC<EmailLayoutProps> = ({
  preview,
  heading,
  children,
}) => {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={headerHeading}>Roadmap Planner</Heading>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={h1}>{heading}</Heading>
            {children}
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Este es un correo automático de Roadmap Planner.
            </Text>
            <Text style={footerText}>
              Para soporte, contacta a: marco-ext@memoob.com
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles (inline for email compatibility)

const main = {
  backgroundColor: '#F0F8FF',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  padding: '40px 20px',
}

const container = {
  backgroundColor: '#ffffff',
  border: '3px solid #000000',
  borderRadius: '0',
  maxWidth: '600px',
  margin: '0 auto',
  boxShadow: '8px 8px 0 #000000',
}

const header = {
  backgroundColor: '#778899',
  padding: '24px',
  borderBottom: '3px solid #000000',
}

const headerHeading = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  textAlign: 'center' as const,
}

const content = {
  padding: '32px 24px',
}

const h1 = {
  color: '#000000',
  fontSize: '28px',
  fontWeight: 'bold',
  marginTop: '0',
  marginBottom: '24px',
}

const footer = {
  backgroundColor: '#f5f5f5',
  padding: '20px 24px',
  borderTop: '3px solid #000000',
}

const footerText = {
  color: '#666666',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '4px 0',
  textAlign: 'center' as const,
}
