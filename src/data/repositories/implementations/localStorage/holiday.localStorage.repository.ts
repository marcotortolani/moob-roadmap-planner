import type { IHolidayRepository } from '../../holiday.repository'
import type { Holiday } from '@/lib/types'
import type { ActionResult } from '@/lib/errors'
import {
  success,
  failure,
  NotFoundError,
  StorageError,
  ValidationError,
} from '@/lib/errors'
import { HolidaySchema } from '@/lib/types'
import { format, isSameDay, getYear } from 'date-fns'

/**
 * LocalStorage implementation of Holiday Repository
 */
export class LocalStorageHolidayRepository implements IHolidayRepository {
  private readonly storageKey = 'holidays'

  /**
   * Parse date strings from storage to Date objects
   */
  private parseDateFromStorage(dateString: string | null | undefined): Date | undefined {
    if (!dateString) return undefined
    return new Date(dateString)
  }

  /**
   * Get holidays from localStorage with date parsing
   */
  private getFromStorage(): Holiday[] {
    if (typeof window === 'undefined') return []

    const data = localStorage.getItem(this.storageKey)
    if (!data) return []

    try {
      const parsedData = JSON.parse(data)

      if (Array.isArray(parsedData)) {
        return parsedData.map((item: any) => ({
          ...item,
          date: this.parseDateFromStorage(item.date)!,
        }))
      }

      return []
    } catch (e) {
      console.error('Failed to parse holidays from storage', e)
      return []
    }
  }

  /**
   * Save holidays to localStorage and dispatch storage event
   */
  private saveToStorage(holidays: Holiday[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.storageKey, JSON.stringify(holidays))
    window.dispatchEvent(new Event('storage'))
  }

  async getAll(): Promise<ActionResult<Holiday[]>> {
    try {
      const holidays = this.getFromStorage()
      return success(holidays)
    } catch (error) {
      return failure(
        new StorageError('Failed to get holidays', 'read'),
        'Error al obtener feriados',
      )
    }
  }

  async getById(id: string): Promise<ActionResult<Holiday | null>> {
    try {
      const holidays = this.getFromStorage()
      const holiday = holidays.find((h) => h.id === id)
      return success(holiday || null)
    } catch (error) {
      return failure(
        new StorageError('Failed to get holiday by ID', 'read'),
        'Error al obtener feriado',
      )
    }
  }

  async create(item: Omit<Holiday, 'id'>): Promise<ActionResult<Holiday>> {
    try {
      // Validate data
      const validatedFields = HolidaySchema.safeParse(item)
      if (!validatedFields.success) {
        return failure(
          new ValidationError('holiday', 'Invalid holiday data'),
          'Datos de feriado inválidos',
        )
      }

      const holidays = this.getFromStorage()

      const newHoliday: Holiday = {
        id: crypto.randomUUID(),
        ...validatedFields.data,
      }

      holidays.push(newHoliday)
      this.saveToStorage(holidays)

      return success(newHoliday)
    } catch (error) {
      return failure(
        new StorageError('Failed to create holiday', 'write'),
        'Error al crear feriado',
      )
    }
  }

  async update(
    id: string,
    item: Partial<Holiday>,
  ): Promise<ActionResult<Holiday>> {
    try {
      let holidays = this.getFromStorage()
      const index = holidays.findIndex((h) => h.id === id)

      if (index === -1) {
        return failure(
          new NotFoundError('Holiday', id),
          'Feriado no encontrado',
        )
      }

      holidays[index] = {
        ...holidays[index],
        ...item,
      }

      this.saveToStorage(holidays)
      return success(holidays[index])
    } catch (error) {
      return failure(
        new StorageError('Failed to update holiday', 'write'),
        'Error al actualizar feriado',
      )
    }
  }

  async delete(id: string): Promise<ActionResult<void>> {
    try {
      let holidays = this.getFromStorage()
      const filtered = holidays.filter((h) => h.id !== id)

      if (filtered.length === holidays.length) {
        return failure(
          new NotFoundError('Holiday', id),
          'Feriado no encontrado',
        )
      }

      this.saveToStorage(filtered)
      return success(undefined)
    } catch (error) {
      return failure(
        new StorageError('Failed to delete holiday', 'delete'),
        'Error al eliminar feriado',
      )
    }
  }

  async exists(id: string): Promise<ActionResult<boolean>> {
    try {
      const holidays = this.getFromStorage()
      const exists = holidays.some((h) => h.id === id)
      return success(exists)
    } catch (error) {
      return failure(
        new StorageError('Failed to check holiday existence', 'read'),
        'Error al verificar feriado',
      )
    }
  }

  async getByDateRange(
    start: Date,
    end: Date,
  ): Promise<ActionResult<Holiday[]>> {
    try {
      const holidays = this.getFromStorage()
      const filtered = holidays.filter(
        (h) => h.date >= start && h.date <= end,
      )
      return success(filtered)
    } catch (error) {
      return failure(
        new StorageError('Failed to get holidays by date range', 'read'),
        'Error al obtener feriados por rango de fechas',
      )
    }
  }

  async getByDate(date: Date): Promise<ActionResult<Holiday | null>> {
    try {
      const holidays = this.getFromStorage()
      const holiday = holidays.find((h) => isSameDay(h.date, date))
      return success(holiday || null)
    } catch (error) {
      return failure(
        new StorageError('Failed to get holiday by date', 'read'),
        'Error al obtener feriado por fecha',
      )
    }
  }

  async getByYear(year: number): Promise<ActionResult<Holiday[]>> {
    try {
      const holidays = this.getFromStorage()
      const filtered = holidays.filter((h) => getYear(h.date) === year)
      return success(filtered)
    } catch (error) {
      return failure(
        new StorageError('Failed to get holidays by year', 'read'),
        'Error al obtener feriados por año',
      )
    }
  }

  async isHoliday(date: Date): Promise<ActionResult<boolean>> {
    try {
      const holidays = this.getFromStorage()
      const isHoliday = holidays.some((h) => isSameDay(h.date, date))
      return success(isHoliday)
    } catch (error) {
      return failure(
        new StorageError('Failed to check if date is holiday', 'read'),
        'Error al verificar si es feriado',
      )
    }
  }

  async bulkCreate(
    holidays: Omit<Holiday, 'id'>[],
  ): Promise<ActionResult<Holiday[]>> {
    try {
      const existingHolidays = this.getFromStorage()
      const newHolidays: Holiday[] = holidays.map((h) => ({
        id: crypto.randomUUID(),
        ...h,
      }))

      const allHolidays = [...existingHolidays, ...newHolidays]
      this.saveToStorage(allHolidays)

      return success(newHolidays)
    } catch (error) {
      return failure(
        new StorageError('Failed to bulk create holidays', 'write'),
        'Error al crear feriados en lote',
      )
    }
  }
}
