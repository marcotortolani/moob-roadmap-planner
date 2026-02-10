// src/lib/export.ts

'use client'

import type { Product } from './types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { getLanguageName } from './languages'
import { COUNTRIES } from './countries'

/**
 * Utilities para exportar productos a Excel/CSV
 * Sprint 7.3: Export to Excel/CSV
 *
 * IMPORTANTE: xlsx y file-saver se cargan dinámicamente (lazy load)
 * para evitar aumentar el bundle inicial
 */

interface ExportOptions {
  filename?: string
  includeComments?: boolean
  includeUrls?: boolean
}

/**
 * Preparar datos de productos para exportación
 */
function prepareProductData(
  products: Product[],
  options: ExportOptions = {}
): any[] {
  const { includeComments = true, includeUrls = true } = options

  return products.map((product) => {
    const country = COUNTRIES.find((c) => c.code === product.country)

    const row: any = {
      Nombre: product.name,
      Estado: product.status,
      Operador: product.operator,
      País: country?.name || product.country,
      Idioma: getLanguageName(product.language),
      'Fecha Inicio': format(product.startDate, 'dd/MM/yyyy', { locale: es }),
      'Fecha Fin': format(product.endDate, 'dd/MM/yyyy', { locale: es }),
    }

    if (includeComments && product.comments) {
      row.Comentarios = product.comments
    }

    if (includeUrls) {
      if (product.productiveUrl) {
        row['URL Productiva'] = product.productiveUrl
      }
      if (product.vercelDemoUrl) {
        row['URL Demo'] = product.vercelDemoUrl
      }
      if (product.wpContentProdUrl) {
        row['WP Content Prod'] = product.wpContentProdUrl
      }
      if (product.wpContentTestUrl) {
        row['WP Content Test'] = product.wpContentTestUrl
      }
      if (product.chatbotUrl) {
        row['URL Chatbot'] = product.chatbotUrl
      }
    }

    // Milestones
    if (product.milestones && product.milestones.length > 0) {
      const milestonesText = product.milestones
        .map(
          (m) =>
            `${m.name} (${format(m.startDate, 'dd/MM/yyyy')} - ${format(m.endDate, 'dd/MM/yyyy')}): ${m.status}`
        )
        .join('; ')
      row.Milestones = milestonesText
    }

    // Custom URLs
    if (product.customUrls && product.customUrls.length > 0) {
      const customUrlsText = product.customUrls
        .map((u) => `${u.label}: ${u.url}`)
        .join('; ')
      row['URLs Personalizadas'] = customUrlsText
    }

    // Metadata
    row['Creado Por'] = product.createdBy
    row['Actualizado Por'] = product.updatedBy || '-'
    row['Fecha Creación'] = format(
      product.createdAt || new Date(),
      'dd/MM/yyyy HH:mm',
      { locale: es }
    )
    row['Fecha Actualización'] = product.updatedAt
      ? format(product.updatedAt, 'dd/MM/yyyy HH:mm', { locale: es })
      : '-'

    return row
  })
}

/**
 * Exportar productos a Excel
 */
export async function exportToExcel(
  products: Product[],
  options: ExportOptions = {}
) {
  const { filename = 'roadmap-export' } = options

  try {
    // Lazy load XLSX and file-saver (code splitting)
    const XLSX = await import('xlsx')
    const fileSaverModule = await import('file-saver')
    const saveAs = fileSaverModule.default || fileSaverModule.saveAs

    // Preparar datos
    const data = prepareProductData(products, options)

    // Crear worksheet
    const worksheet = XLSX.utils.json_to_sheet(data)

    // Ajustar anchos de columnas
    const columnWidths = [
      { wch: 30 }, // Nombre
      { wch: 15 }, // Estado
      { wch: 20 }, // Operador
      { wch: 20 }, // País
      { wch: 15 }, // Idioma
      { wch: 12 }, // Fecha Inicio
      { wch: 12 }, // Fecha Fin
    ]

    if (options.includeComments) {
      columnWidths.push({ wch: 40 }) // Comentarios
    }

    if (options.includeUrls) {
      columnWidths.push(
        { wch: 40 }, // URL Productiva
        { wch: 40 }, // URL Demo
        { wch: 40 }, // WP Content Prod
        { wch: 40 }, // WP Content Test
        { wch: 40 }  // URL Chatbot
      )
    }

    columnWidths.push(
      { wch: 50 }, // Milestones
      { wch: 40 }, // URLs Personalizadas
      { wch: 20 }, // Creado Por
      { wch: 20 }, // Actualizado Por
      { wch: 18 }, // Fecha Creación
      { wch: 18 }  // Fecha Actualización
    )

    worksheet['!cols'] = columnWidths

    // Crear workbook
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos')

    // Generar archivo Excel
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    })

    // Descargar archivo
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm')
    saveAs(blob, `${filename}-${timestamp}.xlsx`)

    return { success: true, count: products.length }
  } catch (error) {
    console.error('[Export] Error exporting to Excel:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Exportar productos a CSV
 */
export async function exportToCSV(products: Product[], options: ExportOptions = {}) {
  const { filename = 'roadmap-export' } = options

  try {
    // Lazy load XLSX and file-saver (code splitting)
    const XLSX = await import('xlsx')
    const fileSaverModule = await import('file-saver')
    const saveAs = fileSaverModule.default || fileSaverModule.saveAs

    // Preparar datos
    const data = prepareProductData(products, options)

    // Crear worksheet y convertir a CSV
    const worksheet = XLSX.utils.json_to_sheet(data)
    const csv = XLSX.utils.sheet_to_csv(worksheet)

    // Descargar archivo
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm')
    saveAs(blob, `${filename}-${timestamp}.csv`)

    return { success: true, count: products.length }
  } catch (error) {
    console.error('[Export] Error exporting to CSV:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Generar estadísticas del roadmap para incluir en export
 */
export function generateRoadmapStats(products: Product[]) {
  const statusCounts = products.reduce(
    (acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const operatorCounts = products.reduce(
    (acc, p) => {
      acc[p.operator] = (acc[p.operator] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const countryCounts = products.reduce(
    (acc, p) => {
      const country = COUNTRIES.find((c) => c.code === product.country)
      const countryName = country?.name || p.country
      acc[countryName] = (acc[countryName] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return {
    total: products.length,
    byStatus: statusCounts,
    byOperator: operatorCounts,
    byCountry: countryCounts,
  }
}
