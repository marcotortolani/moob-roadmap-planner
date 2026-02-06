'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Package,
  PackageCheck,
  PackageX,
  ClipboardCheck,
  Search,
  Filter,
  X,
  TrendingUp,
  Clock,
  Target,
  Zap,
} from 'lucide-react'
import { useProducts } from '@/hooks/queries'
import { ProductsByStatusChart } from '@/components/charts/products-by-status-chart'
import { ProductsByCountryChart } from '@/components/charts/products-by-country-chart'
import { TimelineChart } from '@/components/charts/timeline-chart'
import { OperatorPieChart } from '@/components/charts/operator-pie-chart'
import { MilestoneProgressChart } from '@/components/charts/milestone-progress-chart'
import { BurndownChart } from '@/components/charts/burndown-chart'
import { ActivityHeatmap } from '@/components/charts/activity-heatmap'
import { VelocityChart } from '@/components/charts/velocity-chart'
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { getYear, startOfQuarter, endOfQuarter } from 'date-fns'

// Animation variants for stagger effect
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
}

export default function DashboardPage() {
  // Use React Query (same cache as main page) instead of localStorage
  const { data: allProducts = [], isLoading: loading } = useProducts()

  const [searchTerm, setSearchTerm] = useState('')
  const [languageFilter, setLanguageFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all')
  const [quarterFilter, setQuarterFilter] = useState<number | 'all'>('all')
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)

  const { uniqueLanguages, uniqueYears } = useMemo(() => {
    const languages = new Set<string>()

    allProducts.forEach((p) => {
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
      uniqueLanguages: Array.from(languages).sort(),
      uniqueYears: years,
    }
  }, [allProducts])

  const filteredProducts = useMemo(() => {
    let result = allProducts

    result = result.filter((p) => {
      const searchMatch =
        searchTerm === '' ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.language.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.status.toLowerCase().includes(searchTerm.toLowerCase())

      const languageMatch = languageFilter === 'all' || p.language === languageFilter

      const dateMatch = () => {
        if (yearFilter === 'all') return true
        const productStartYear = getYear(p.startDate)
        const productEndYear = getYear(p.endDate)

        const yearMatches =
          productStartYear <= yearFilter && productEndYear >= yearFilter
        if (!yearMatches) return false

        if (quarterFilter === 'all') return true

        const quarterStartDate = startOfQuarter(
          new Date(yearFilter, (quarterFilter - 1) * 3)
        )
        const quarterEndDate = endOfQuarter(
          new Date(yearFilter, (quarterFilter - 1) * 3)
        )

        return p.startDate <= quarterEndDate && p.endDate >= quarterStartDate
      }
      return searchMatch && languageMatch && dateMatch()
    })

    return result
  }, [allProducts, searchTerm, languageFilter, yearFilter, quarterFilter])

  // Use the new dashboard metrics hook
  const metrics = useDashboardMetrics(filteredProducts)

  const activeFilterCount =
    [languageFilter].filter((f) => f !== 'all').length +
    (searchTerm ? 1 : 0) +
    (yearFilter !== 'all' ? 1 : 0) +
    (quarterFilter !== 'all' && yearFilter !== 'all' ? 1 : 0)

  const clearFilters = () => {
    setSearchTerm('')
    setLanguageFilter('all')
    setYearFilter('all')
    setQuarterFilter('all')
  }

  const removeFilter = (
    filter: 'search' | 'language' | 'year' | 'quarter'
  ) => {
    switch (filter) {
      case 'search':
        setSearchTerm('')
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
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">Cargando...</div>
    )
  }

  const FilterControls = () => (
    <div className="grid grid-cols-1 gap-4">
      <h4 className="text-lg font-semibold">Filtros del Dashboard</h4>
      <div className="grid grid-cols-2 gap-2">
        <Select
          value={yearFilter.toString()}
          onValueChange={(value) =>
            setYearFilter(value === 'all' ? 'all' : Number(value))
          }
        >
          <SelectTrigger className="neo-button" style={{ borderRadius: 0 }}>
            {yearFilter === 'all' ? 'Año' : <SelectValue />}
          </SelectTrigger>
          <SelectContent className="neo-card border-2 border-black" style={{ borderRadius: 0 }}>
            <SelectItem value="all">Todos</SelectItem>
            {uniqueYears.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={quarterFilter.toString()}
          onValueChange={(value) =>
            setQuarterFilter(value === 'all' ? 'all' : Number(value))
          }
          disabled={yearFilter === 'all'}
        >
          <SelectTrigger className="neo-button" style={{ borderRadius: 0 }}>
            {quarterFilter === 'all' ? 'Quarter' : <SelectValue />}
          </SelectTrigger>
          <SelectContent className="neo-card border-2 border-black" style={{ borderRadius: 0 }}>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="1">Q1</SelectItem>
            <SelectItem value="2">Q2</SelectItem>
            <SelectItem value="3">Q3</SelectItem>
            <SelectItem value="4">Q4</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Select value={languageFilter} onValueChange={setLanguageFilter}>
        <SelectTrigger className="neo-button" style={{ borderRadius: 0 }}>
          {languageFilter === 'all' ? 'Idioma' : <SelectValue />}
        </SelectTrigger>
        <SelectContent className="neo-card border-2 border-black" style={{ borderRadius: 0 }}>
          <SelectItem value="all">Todos</SelectItem>
          {uniqueLanguages.map((l) => (
            <SelectItem key={l} value={l}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Filters Section */}
      <div className="space-y-2 p-4 border-3 border-black bg-white shadow-neo-md" style={{ borderRadius: 0 }}>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 lg:flex-none xl:max-w-full xl:min-w-[200px] 2xl:min-w-[300px] 2xl:max-w-[400px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en dashboard..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="hidden lg:flex flex-row gap-2">
            <Select
              value={yearFilter.toString()}
              onValueChange={(value) =>
                setYearFilter(value === 'all' ? 'all' : Number(value))
              }
            >
              <SelectTrigger className="w-28 neo-button" style={{ borderRadius: 0 }}>
                {yearFilter === 'all' ? 'Año' : <SelectValue />}
              </SelectTrigger>
              <SelectContent className="neo-card border-2 border-black" style={{ borderRadius: 0 }}>
                <SelectItem value="all">Todos</SelectItem>
                {uniqueYears.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={quarterFilter.toString()}
              onValueChange={(value) =>
                setQuarterFilter(value === 'all' ? 'all' : Number(value))
              }
              disabled={yearFilter === 'all'}
            >
              <SelectTrigger className="w-24 neo-button" style={{ borderRadius: 0 }}>
                {quarterFilter === 'all' ? 'Quarter' : <SelectValue />}
              </SelectTrigger>
              <SelectContent className="neo-card border-2 border-black" style={{ borderRadius: 0 }}>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="1">Q1</SelectItem>
                <SelectItem value="2">Q2</SelectItem>
                <SelectItem value="3">Q3</SelectItem>
                <SelectItem value="4">Q4</SelectItem>
              </SelectContent>
            </Select>
            <Select value={languageFilter} onValueChange={setLanguageFilter}>
              <SelectTrigger className="neo-button" style={{ borderRadius: 0 }}>
                {languageFilter === 'all' ? 'Idioma' : <SelectValue />}
              </SelectTrigger>
              <SelectContent className="neo-card border-2 border-black" style={{ borderRadius: 0 }}>
                <SelectItem value="all">Todos</SelectItem>
                {uniqueLanguages.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden relative">
                <Filter className="mr-2 h-4 w-4" />
                Filtros
                {activeFilterCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filtros del Dashboard</SheetTitle>
              </SheetHeader>
              <div className="py-4">
                <FilterControls />
              </div>
            </SheetContent>
          </Sheet>
        </div>
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-sm font-medium">Filtros activos:</span>
            {searchTerm && (
              <Badge variant="secondary">
                Búsqueda: {searchTerm}
                <button
                  onClick={() => removeFilter('search')}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {yearFilter !== 'all' && (
              <Badge variant="secondary">
                Año: {yearFilter}
                <button
                  onClick={() => removeFilter('year')}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {quarterFilter !== 'all' && yearFilter !== 'all' && (
              <Badge variant="secondary">
                Q{quarterFilter}
                <button
                  onClick={() => removeFilter('quarter')}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {languageFilter !== 'all' && (
              <Badge variant="secondary">
                Idioma: {languageFilter}
                <button
                  onClick={() => removeFilter('language')}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-sm text-destructive hover:text-destructive"
            >
              Limpiar todo
            </Button>
          </div>
        )}
      </div>

      {/* Primary KPI Cards */}
      <motion.div
        className="grid gap-4 grid-cols-2 lg:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={cardVariants}>
          <Card className="neo-card" style={{ borderRadius: 0 }}>
          <CardHeader className="pb-2 md:pb-6 border-b-2 border-black">
            <div className="flex flex-col items-start gap-2 md:flex-row md:items-end md:justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-bold uppercase">Total</CardTitle>
              </div>
              <div className="text-2xl font-bold md:hidden">
                {metrics.totalProducts}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="hidden text-2xl font-bold md:block">
              {metrics.totalProducts}
            </div>
          </CardContent>
        </Card>
        </motion.div>
        <motion.div variants={cardVariants}>
          <Card className="neo-card" style={{ borderRadius: 0 }}>
            <CardHeader className="pb-2 md:pb-6 border-b-2 border-black">
              <div className="flex flex-col items-start gap-2 md:flex-row md:items-end md:justify-between">
                <div className="flex items-center gap-2">
                  <PackageX className="h-4 w-4 text-red-500" />
                  <CardTitle className="text-sm font-bold uppercase">En Progreso</CardTitle>
                </div>
                <div className="text-2xl font-bold md:hidden">
                  {metrics.inProgressCount}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="hidden text-2xl font-bold md:block">
                {metrics.inProgressCount}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={cardVariants}>
          <Card className="neo-card" style={{ borderRadius: 0 }}>
            <CardHeader className="pb-2 md:pb-6 border-b-2 border-black">
              <div className="flex flex-col items-start gap-2 md:flex-row md:items-end md:justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-yellow-500" />
                  <CardTitle className="text-sm font-bold uppercase">En Demo</CardTitle>
                </div>
                <div className="text-2xl font-bold md:hidden">
                  {metrics.demoOkCount}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="hidden text-2xl font-bold md:block">
                {metrics.demoOkCount}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={cardVariants}>
          <Card className="neo-card" style={{ borderRadius: 0 }}>
            <CardHeader className="pb-2 md:pb-6 border-b-2 border-black">
              <div className="flex flex-col items-start gap-2 md:flex-row md:items-end md:justify-between">
                <div className="flex items-center gap-2">
                  <PackageCheck className="h-4 w-4 text-green-500" />
                  <CardTitle className="text-sm font-bold uppercase">
                    En Producción
                  </CardTitle>
                </div>
                <div className="text-2xl font-bold md:hidden">
                  {metrics.liveCount}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="hidden text-2xl font-bold md:block">
                {metrics.liveCount}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* New Advanced KPI Cards */}
      <motion.div
        className="grid gap-4 grid-cols-2 lg:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={cardVariants}>
          <Card className="neo-card" style={{ borderRadius: 0 }}>
          <CardHeader className="pb-2 md:pb-6 border-b-2 border-black">
            <div className="flex flex-col items-start gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <CardTitle className="text-sm font-bold uppercase">
                  Tasa de Completación
                </CardTitle>
              </div>
              <div className="text-2xl font-bold">
                {metrics.completionRate.toFixed(1)}%
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {metrics.liveCount + metrics.demoOkCount} de{' '}
              {metrics.totalProducts} completados
            </p>
          </CardContent>
        </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="neo-card" style={{ borderRadius: 0 }}>
            <CardHeader className="pb-2 md:pb-6 border-b-2 border-black">
              <div className="flex flex-col items-start gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <CardTitle className="text-sm font-bold uppercase">
                    Duración Promedio
                  </CardTitle>
                </div>
                <div className="text-2xl font-bold">
                  {Math.round(metrics.averageDuration)} días
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Desde inicio a fin de proyecto
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="neo-card" style={{ borderRadius: 0 }}>
            <CardHeader className="pb-2 md:pb-6 border-b-2 border-black">
              <div className="flex flex-col items-start gap-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  <CardTitle className="text-sm font-bold uppercase">Hitos Completados</CardTitle>
                </div>
                <div className="text-2xl font-bold">
                  {metrics.milestoneCompletionRate.toFixed(1)}%
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Progreso general de hitos
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={cardVariants}>
          <Card className="neo-card" style={{ borderRadius: 0 }}>
            <CardHeader className="pb-2 md:pb-6 border-b-2 border-black">
              <div className="flex flex-col items-start gap-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <CardTitle className="text-sm font-bold uppercase">
                    Productividad Trimestral
                  </CardTitle>
                </div>
                <div className="text-2xl font-bold">
                  {metrics.teamProductivityScore.toFixed(1)}%
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Completados vs planificados en Q actual
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Timeline Health Cards */}
      <div className="grid gap-4 grid-cols-3">
        <Card className="neo-card" style={{ borderRadius: 0 }}>
          <CardHeader className="pb-2 border-b-2 border-black">
            <CardTitle className="text-sm font-bold uppercase">A Tiempo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.timelineHealth.onTime}
            </div>
            <p className="text-xs text-muted-foreground">Proyectos en curso</p>
          </CardContent>
        </Card>
        <Card className="neo-card" style={{ borderRadius: 0 }}>
          <CardHeader className="pb-2 border-b-2 border-black">
            <CardTitle className="text-sm font-bold uppercase text-red-600">
              Retrasados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics.timelineHealth.delayed}
            </div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>
        <Card className="neo-card" style={{ borderRadius: 0 }}>
          <CardHeader className="pb-2 border-b-2 border-black">
            <CardTitle className="text-sm font-bold uppercase">Próximos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics.timelineHealth.upcoming}
            </div>
            <p className="text-xs text-muted-foreground">Por iniciar</p>
          </CardContent>
        </Card>
      </div>

      {/* Existing Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="neo-card" style={{ borderRadius: 0 }}>
          <CardHeader className="border-b-2 border-black">
            <CardTitle className="font-bold uppercase">Productos por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductsByStatusChart products={filteredProducts} />
          </CardContent>
        </Card>
        <Card className="neo-card" style={{ borderRadius: 0 }}>
          <CardHeader className="border-b-2 border-black">
            <CardTitle className="font-bold uppercase">Productos por País</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductsByCountryChart products={filteredProducts} />
          </CardContent>
        </Card>
      </div>

      {/* New Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <TimelineChart products={filteredProducts} limit={10} />
        <OperatorPieChart products={filteredProducts} />
      </div>

      {/* New Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        <MilestoneProgressChart products={filteredProducts} />
        <BurndownChart products={filteredProducts} />
      </div>

      {/* New Charts Row 3 */}
      <div className="grid gap-4 md:grid-cols-2">
        <ActivityHeatmap products={filteredProducts} monthsToShow={3} />
        <VelocityChart
          products={filteredProducts}
          weeklyData={metrics.weeklyThroughput}
        />
      </div>
    </div>
  )
}
