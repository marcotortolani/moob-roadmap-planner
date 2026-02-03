import { format, addDays, subDays, getDay, isAfter, isBefore, isSameDay } from 'date-fns';
import type { Holiday } from './types';

/**
 * Check if a date is a business day (Mon-Fri AND not a holiday)
 */
export function isBusinessDay(date: Date, holidays: Holiday[]): boolean {
  const dayOfWeek = getDay(date);

  // 0 = Sunday, 6 = Saturday
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }

  // Check if date is a holiday
  const dateStr = format(date, 'yyyy-MM-dd');
  return !holidays.some(holiday => format(holiday.date, 'yyyy-MM-dd') === dateStr);
}

/**
 * Add N business days to a start date
 */
export function addBusinessDays(startDate: Date, count: number, holidays: Holiday[]): Date {
  if (count < 0) {
    throw new Error('Count must be non-negative. Use subtractBusinessDays for negative counts.');
  }

  if (count === 0) {
    return startDate;
  }

  let current = new Date(startDate);
  let businessDaysAdded = 0;

  while (businessDaysAdded < count) {
    current = addDays(current, 1);
    if (isBusinessDay(current, holidays)) {
      businessDaysAdded++;
    }
  }

  return current;
}

/**
 * Subtract N business days from an end date
 */
export function subtractBusinessDays(endDate: Date, count: number, holidays: Holiday[]): Date {
  if (count < 0) {
    throw new Error('Count must be non-negative. Use addBusinessDays for negative counts.');
  }

  if (count === 0) {
    return endDate;
  }

  let current = new Date(endDate);
  let businessDaysSubtracted = 0;

  while (businessDaysSubtracted < count) {
    current = subDays(current, 1);
    if (isBusinessDay(current, holidays)) {
      businessDaysSubtracted++;
    }
  }

  return current;
}

/**
 * Count business days between two dates (inclusive)
 */
export function countBusinessDays(startDate: Date, endDate: Date, holidays: Holiday[]): number {
  if (isAfter(startDate, endDate)) {
    return 0;
  }

  let count = 0;
  let current = new Date(startDate);

  while (isBefore(current, endDate) || isSameDay(current, endDate)) {
    if (isBusinessDay(current, holidays)) {
      count++;
    }
    current = addDays(current, 1);
  }

  return count;
}

/**
 * Get next business day from a given date
 */
export function getNextBusinessDay(date: Date, holidays: Holiday[]): Date {
  let current = addDays(date, 1);

  while (!isBusinessDay(current, holidays)) {
    current = addDays(current, 1);
  }

  return current;
}

/**
 * Get previous business day from a given date
 */
export function getPreviousBusinessDay(date: Date, holidays: Holiday[]): Date {
  let current = subDays(date, 1);

  while (!isBusinessDay(current, holidays)) {
    current = subDays(current, 1);
  }

  return current;
}

/**
 * Adjust a date to the nearest business day
 * @param direction 'forward' to get next business day, 'backward' to get previous, 'nearest' for closest
 */
export function adjustDateToBusinessDay(
  date: Date,
  holidays: Holiday[],
  direction: 'forward' | 'backward' | 'nearest' = 'nearest'
): Date {
  if (isBusinessDay(date, holidays)) {
    return date;
  }

  if (direction === 'forward') {
    return getNextBusinessDay(date, holidays);
  }

  if (direction === 'backward') {
    return getPreviousBusinessDay(date, holidays);
  }

  // 'nearest' - compare distances
  const next = getNextBusinessDay(date, holidays);
  const prev = getPreviousBusinessDay(date, holidays);

  const daysToNext = Math.abs(next.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  const daysToPrev = Math.abs(date.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

  return daysToNext <= daysToPrev ? next : prev;
}

/**
 * Get all business days in a date range (inclusive)
 */
export function getBusinessDaysInRange(startDate: Date, endDate: Date, holidays: Holiday[]): Date[] {
  const businessDays: Date[] = [];
  let current = new Date(startDate);

  while (isBefore(current, endDate) || isSameDay(current, endDate)) {
    if (isBusinessDay(current, holidays)) {
      businessDays.push(new Date(current));
    }
    current = addDays(current, 1);
  }

  return businessDays;
}
