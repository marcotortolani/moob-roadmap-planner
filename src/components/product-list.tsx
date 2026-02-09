import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import type { Product } from '@/lib/types'
import { ProductCard } from './product-card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { startOfQuarter, endOfQuarter, getYear } from 'date-fns'

// Animation variants for product cards
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
}

interface ProductListProps {
  products: Product[]
  yearFilter: number | 'all'
  quarterFilter: number | 'all'
}

export const ProductList = memo(function ProductList({
  products,
  yearFilter,
  quarterFilter,
}: ProductListProps) {
  // Memoize expensive year/quarter grouping calculations
  const productsByYear = useMemo(() => {
    if (yearFilter !== 'all') return null
    const byYear: Record<string, Record<string, Product[]>> = {}

    products.forEach((product) => {
      const startYear = getYear(product.startDate)
      const endYear = getYear(product.endDate)

      for (let year = startYear; year <= endYear; year++) {
        if (!byYear[year]) {
          byYear[year] = { 1: [], 2: [], 3: [], 4: [] }
        }

        for (let q = 1; q <= 4; q++) {
          const quarterStartDate = startOfQuarter(new Date(year, (q - 1) * 3))
          const quarterEndDate = endOfQuarter(new Date(year, (q - 1) * 3))

          if (
            product.startDate <= quarterEndDate &&
            product.endDate >= quarterStartDate
          ) {
            if (!byYear[year][q].some((p) => p.id === product.id)) {
              byYear[year][q].push(product)
            }
          }
        }
      }
    })

    return byYear
  }, [products, yearFilter])

  const productsByQuarter = useMemo(() => {
    if (yearFilter === 'all' || quarterFilter !== 'all') return null
    const byQuarter: Record<string, Product[]> = { 1: [], 2: [], 3: [], 4: [] }

    products.forEach((product) => {
      for (let q = 1; q <= 4; q++) {
        const quarterStartDate = startOfQuarter(
          new Date(yearFilter as number, (q - 1) * 3),
        )
        const quarterEndDate = endOfQuarter(
          new Date(yearFilter as number, (q - 1) * 3),
        )

        if (
          product.startDate <= quarterEndDate &&
          product.endDate >= quarterStartDate
        ) {
          byQuarter[q].push(product)
        }
      }
    })

    return byQuarter
  }, [products, yearFilter, quarterFilter])

  if (products.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center border-3 border-dashed border-black shadow-neo-md p-8">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight font-headline uppercase">
            No tienes productos
          </h3>
          <p className="text-sm text-muted-foreground">
            Comienza creando un nuevo producto para ver tu roadmap.
          </p>
        </div>
      </div>
    )
  }

  if (productsByYear) {
    const sortedYears = Object.keys(productsByYear).sort(
      (a, b) => parseInt(b) - parseInt(a),
    )

    return (
      <Accordion
        type="multiple"
        defaultValue={sortedYears}
        className="w-full space-y-6 pr-1"
      >
        {sortedYears.map((year) => {
          const quarters = productsByYear[year]
          const yearHasProducts = Object.values(quarters).some(
            (p) => p.length > 0,
          )
          if (!yearHasProducts) return null

          return (
            <AccordionItem key={year} value={year} className="border-none">
              <AccordionTrigger className="text-2xl font-bold font-headline px-4 pr-6 py-3 hover:no-underline">
                {year}
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <Accordion
                  type="multiple"
                  defaultValue={['1', '2', '3', '4']}
                  className="w-full space-y-4"
                >
                  {Object.entries(quarters).map(
                    ([quarter, quarterProducts]) => {
                      if (quarterProducts.length === 0) return null
                      return (
                        <AccordionItem
                          key={`${year}-q${quarter}`}
                          value={quarter}
                          className="border-3 border-black mb-2"
                        >
                          <AccordionTrigger className="px-4 py-3 text-lg font-headline uppercase">
                            Q{quarter}
                          </AccordionTrigger>
                          <AccordionContent className="p-4 pr-6 pt-4">
                            <motion.div
                              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                              variants={containerVariants}
                              initial="hidden"
                              animate="visible"
                            >
                              {quarterProducts.map((product) => (
                                <motion.div
                                  key={product.id}
                                  variants={cardVariants}
                                >
                                  <ProductCard product={product} />
                                </motion.div>
                              ))}
                            </motion.div>
                          </AccordionContent>
                        </AccordionItem>
                      )
                    },
                  )}
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    )
  }

  if (productsByQuarter) {
    return (
      <Accordion
        type="multiple"
        defaultValue={['1', '2', '3', '4']}
        className="w-full space-y-4 pr-1"
      >
        {Object.entries(productsByQuarter).map(([quarter, quarterProducts]) => {
          if (quarterProducts.length === 0) return null
          return (
            <AccordionItem key={quarter} value={quarter} className="border-3">
              <AccordionTrigger className="px-4 py-3 text-lg font-headline hover:no-underline">
                Q{quarter}
              </AccordionTrigger>
              <AccordionContent className="p-4 pr-6 pt-4">
                <motion.div
                  className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {quarterProducts.map((product) => (
                    <motion.div key={product.id} variants={cardVariants}>
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </motion.div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    )
  }

  const isDefaultView =
    typeof yearFilter === 'number' && typeof quarterFilter === 'number'

  return (
    <div className="space-y-4 pb-4">
      {isDefaultView && (
        <h2 className="text-xl font-bold font-headline">
          {yearFilter} / Q{quarterFilter}
        </h2>
      )}
      <motion.div
        className="h-full grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pr-1"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {products.map((product) => (
          <motion.div
            key={product.id}
            variants={cardVariants}
            className=" h-full"
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
})
