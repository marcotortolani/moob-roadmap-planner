import { useState, useMemo, useCallback } from 'react'
import { getYear, getQuarter, startOfQuarter, endOfQuarter } from 'date-fns'
import type { Product, Status } from '@/lib/types'
import { useProducts } from '@/hooks/queries'
import { useDebounce } from './use-debounce'

export type SortOption = 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc'
export type FilterType =
  | 'search'
  | 'status'
  | 'operator'
  | 'country'
  | 'language'
  | 'year'
  | 'quarter'

export function useProductFiltering() {
  // Fetch products using React Query
  // Use isPending (not isLoading) so the skeleton shows both while auth
  // initializes (query disabled) and during the actual first fetch.
  const { data: products = [], isPending: loading } = useProducts()

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300) // Debounce search for performance
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all')
  const [operatorFilter, setOperatorFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [languageFilter, setLanguageFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState<number | 'all'>(
    new Date().getFullYear(),
  )
  const [quarterFilter, setQuarterFilter] = useState<number | 'all'>(
    getQuarter(new Date()),
  )
  const [sortOption, setSortOption] = useState<SortOption>('date-asc')

  // Extract unique values for filters
  const { uniqueOperators, uniqueCountries, uniqueLanguages, uniqueYears } =
    useMemo(() => {
      const operators = new Set<string>()
      const countries = new Set<string>()
      const languages = new Set<string>()

      products.forEach((p) => {
        operators.add(p.operator)
        countries.add(p.country)
        languages.add(p.language)
      })

      const startYear = 2025
      const currentYear = new Date().getFullYear()
      const endYear = currentYear + 1
      const years: number[] = []
      for (let year = endYear; year >= startYear; year--) {
        years.push(year)
      }

      return {
        uniqueOperators: Array.from(operators).sort(),
        uniqueCountries: Array.from(countries).sort(),
        uniqueLanguages: Array.from(languages).sort(),
        uniqueYears: years,
      }
    }, [products])

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let result = products

    // Filtering
    result = result.filter((p) => {
      const searchMatch =
        debouncedSearchTerm === '' ||
        p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        p.operator.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        p.country.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        p.language.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        p.status.toLowerCase().includes(debouncedSearchTerm.toLowerCase())

      const statusMatch = statusFilter === 'all' || p.status === statusFilter
      const operatorMatch =
        operatorFilter === 'all' || p.operator === operatorFilter
      const countryMatch = countryFilter === 'all' || p.country === countryFilter
      const languageMatch =
        languageFilter === 'all' || p.language === languageFilter

      const dateMatch = () => {
        if (yearFilter === 'all') return true
        const productStartYear = getYear(p.startDate)
        const productEndYear = getYear(p.endDate)

        const yearMatches =
          productStartYear <= yearFilter && productEndYear >= yearFilter
        if (!yearMatches) return false

        if (quarterFilter === 'all') return true

        const quarterStartDate = startOfQuarter(
          new Date(yearFilter, (quarterFilter - 1) * 3),
        )
        const quarterEndDate = endOfQuarter(
          new Date(yearFilter, (quarterFilter - 1) * 3),
        )

        return p.startDate <= quarterEndDate && p.endDate >= quarterStartDate
      }

      return (
        searchMatch &&
        statusMatch &&
        operatorMatch &&
        countryMatch &&
        languageMatch &&
        dateMatch()
      )
    })

    // Sorting
    switch (sortOption) {
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name))
        break
      case 'date-asc':
        result.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
        break
      case 'date-desc':
        result.sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
        break
    }

    return result
  }, [
    products,
    debouncedSearchTerm,
    statusFilter,
    operatorFilter,
    countryFilter,
    languageFilter,
    yearFilter,
    quarterFilter,
    sortOption,
  ])

  // Calculate active filter count
  const activeFilterCount =
    [statusFilter, operatorFilter, countryFilter, languageFilter].filter(
      (f) => f !== 'all',
    ).length +
    (searchTerm ? 1 : 0) +
    (yearFilter !== 'all' ? 1 : 0) +
    (quarterFilter !== 'all' && yearFilter !== 'all' ? 1 : 0)

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchTerm('')
    setStatusFilter('all')
    setOperatorFilter('all')
    setCountryFilter('all')
    setLanguageFilter('all')
    setYearFilter(new Date().getFullYear())
    setQuarterFilter(getQuarter(new Date()))
    setSortOption('date-asc')
  }, [])

  // Remove individual filter
  const removeFilter = useCallback((filter: FilterType) => {
    switch (filter) {
      case 'search':
        setSearchTerm('')
        break
      case 'status':
        setStatusFilter('all')
        break
      case 'operator':
        setOperatorFilter('all')
        break
      case 'country':
        setCountryFilter('all')
        break
      case 'language':
        setLanguageFilter('all')
        break
      case 'year':
        setYearFilter('all')
        break
      case 'quarter':
        setQuarterFilter('all')
        break
    }
  }, [])

  return {
    // Data
    products,
    filteredAndSortedProducts,
    loading,

    // Filter states
    searchTerm,
    statusFilter,
    operatorFilter,
    countryFilter,
    languageFilter,
    yearFilter,
    quarterFilter,
    sortOption,

    // Unique values
    uniqueOperators,
    uniqueCountries,
    uniqueLanguages,
    uniqueYears,

    // Filter count
    activeFilterCount,

    // Setters
    setSearchTerm,
    setStatusFilter,
    setOperatorFilter,
    setCountryFilter,
    setLanguageFilter,
    setYearFilter,
    setQuarterFilter,
    setSortOption,

    // Actions
    clearFilters,
    removeFilter,
  }
}
