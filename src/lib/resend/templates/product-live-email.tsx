/**
 * Product LIVE notification email template
 * Sent when a product status changes to LIVE (production)
 */

import { Button, Hr, Text } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/email-layout'
import { SendProductLiveEmailParams } from '../types'

interface ProductLiveEmailProps extends Omit<SendProductLiveEmailParams, 'recipients'> {
  recipientName: string
}

export const ProductLiveEmail: React.FC<ProductLiveEmailProps> = ({
  productName,
  productUrl,
  operator,
  country,
  language,
  goLiveDate,
  recipientName,
}) => {
  const formattedDate = new Date(goLiveDate).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <EmailLayout
      preview={`${productName} está ahora en producción`}
      heading="🚀 ¡Nuevo Producto en Producción!"
    >
      <Text style={text}>
        Hola {recipientName},
      </Text>

      <Text style={celebrationText}>
        ¡Tenemos grandes noticias! El producto <strong>{productName}</strong> ha sido
        lanzado a producción exitosamente.
      </Text>

      <div style={detailsBox}>
        <Text style={detailsTitle}>Detalles del Producto</Text>
        <table style={table}>
          <tbody>
            <tr>
              <td style={labelCell}>Producto:</td>
              <td style={valueCell}>{productName}</td>
            </tr>
            <tr>
              <td style={labelCell}>Operador:</td>
              <td style={valueCell}>{operator}</td>
            </tr>
            <tr>
              <td style={labelCell}>País:</td>
              <td style={valueCell}>{country}</td>
            </tr>
            <tr>
              <td style={labelCell}>Idioma:</td>
              <td style={valueCell}>{language}</td>
            </tr>
            <tr>
              <td style={labelCell}>Fecha de lanzamiento:</td>
              <td style={valueCell}>{formattedDate}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {productUrl && (
        <>
          <Text style={text}>
            Puedes visitar el producto en producción usando el siguiente enlace:
          </Text>
          <Button href={productUrl} style={button}>
            Ver Producto en Producción
          </Button>
        </>
      )}

      <Hr style={hr} />

      <Text style={autoText}>
        Este es un correo automático enviado cuando un producto cambia a estado LIVE.
        Para ver más detalles, accede a Roadmap Planner.
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

const celebrationText = {
  color: '#000000',
  fontSize: '18px',
  lineHeight: '1.6',
  marginBottom: '24px',
  backgroundColor: '#d1fae5',
  padding: '16px',
  border: '2px solid #10b981',
}

const detailsBox = {
  backgroundColor: '#ffffff',
  border: '2px solid #e5e7eb',
  padding: '20px',
  marginBottom: '24px',
}

const detailsTitle = {
  color: '#000000',
  fontSize: '18px',
  fontWeight: 'bold',
  marginTop: '0',
  marginBottom: '16px',
}

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const,
}

const labelCell = {
  color: '#666666',
  fontSize: '14px',
  fontWeight: 'bold',
  padding: '8px 12px 8px 0',
  verticalAlign: 'top' as const,
  width: '40%',
}

const valueCell = {
  color: '#000000',
  fontSize: '14px',
  padding: '8px 0',
  verticalAlign: 'top' as const,
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

const autoText = {
  color: '#666666',
  fontSize: '13px',
  lineHeight: '1.5',
  fontStyle: 'italic',
}
