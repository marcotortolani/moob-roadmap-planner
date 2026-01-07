// src/app/(main)/page.tsx

'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { getYear, getQuarter, startOfQuarter, endOfQuarter } from 'date-fns';

import { ProductList } from '@/components/product-list';
import { ProductCalendar } from '@/components/product-calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { Product, Status, MilestoneStatus } from '@/lib/types';
import { STATUS_OPTIONS } from '@/lib/constants';
import { getProductsFromStorage } from '@/lib/actions';

type SortOption = 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc';

// Variantes de animación para el slide
const slideVariants = {
  enterFromRight: {
    x: '100%',
    opacity: 0,
  },
  enterFromLeft: {
    x: '-100%',
    opacity: 0,
  },
  center: {
    x: 0,
    opacity: 1,
  },
  exitToRight: {
    x: '100%',
    opacity: 0,
  },
  exitToLeft: {
    x: '-100%',
    opacity: 0,
  },
};

const slideTransition: Transition = {
  type: 'tween',
  ease: [0.4, 0, 0.2, 1],
  duration: 0.4,
};

function ProductsData({ view }: { view: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [previousView, setPreviousView] = useState(view);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [operatorFilter, setOperatorFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState<number | 'all'>(new Date().getFullYear());
  const [quarterFilter, setQuarterFilter] = useState<number | 'all'>(getQuarter(new Date()));
  const [sortOption, setSortOption] = useState<SortOption>('date-asc');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Determinar dirección del swipe
  const direction = useMemo(() => {
    if (previousView === 'list' && view === 'calendar') return 1;
    if (previousView === 'calendar' && view === 'list') return -1;
    return 0;
  }, [view, previousView]);

    // Determinar las animaciones según la transición
    const getAnimationProps = (currentView: string) => {
      const goingToCalendar = previousView === 'list' && currentView === 'calendar';
      const goingToList = previousView === 'calendar' && currentView === 'list';
  
      if (currentView === 'list') {
        // Lista siempre entra desde la izquierda y sale hacia la izquierda
        return {
          initial: goingToList ? 'enterFromLeft' : 'center',
          animate: 'center',
          exit: 'exitToLeft',
        };
      } else {
        // Calendario siempre entra desde la derecha y sale hacia la derecha
        return {
          initial: goingToCalendar ? 'enterFromRight' : 'center',
          animate: 'center',
          exit: 'exitToRight',
        };
      }
    };

  useEffect(() => {
    setPreviousView(view);
  }, [view]);

  const fetchProducts = () => {
    setLoading(true);
    if (typeof window !== 'undefined') {
      const storedProducts = getProductsFromStorage();
      setProducts(storedProducts);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
    window.addEventListener('storage', fetchProducts);
    return () => {
      window.removeEventListener('storage', fetchProducts);
    };
  }, []);

  const { uniqueOperators, uniqueCountries, uniqueLanguages, uniqueYears } = useMemo(() => {
    const operators = new Set<string>();
    const countries = new Set<string>();
    const languages = new Set<string>();
    
    products.forEach(p => {
      operators.add(p.operator);
      countries.add(p.country);
      languages.add(p.language);
    });
    
    const startYear = 2025;
    const currentYear = new Date().getFullYear();
    const endYear = currentYear + 1;
    const years: number[] = [];
    for (let year = endYear; year >= startYear; year--) {
      years.push(year);
    }

    return {
      uniqueOperators: Array.from(operators).sort(),
      uniqueCountries: Array.from(countries).sort(),
      uniqueLanguages: Array.from(languages).sort(),
      uniqueYears: years,
    };
  }, [products]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = products;

    // Filtering
    result = result.filter(p => {
      const searchMatch =
        searchTerm === '' ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.language.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.status.toLowerCase().includes(searchTerm.toLowerCase());

      const statusMatch = statusFilter === 'all' || p.status === statusFilter;
      const operatorMatch = operatorFilter === 'all' || p.operator === operatorFilter;
      const countryMatch = countryFilter === 'all' || p.country === countryFilter;
      const languageMatch = languageFilter === 'all' || p.language === languageFilter;

      const dateMatch = () => {
          if (yearFilter === 'all') return true;
          const productStartYear = getYear(p.startDate);
          const productEndYear = getYear(p.endDate);
          
          const yearMatches = productStartYear <= yearFilter && productEndYear >= yearFilter;
          if (!yearMatches) return false;

          if (quarterFilter === 'all') return true;
          
          const quarterStartDate = startOfQuarter(new Date(yearFilter, (quarterFilter - 1) * 3));
          const quarterEndDate = endOfQuarter(new Date(yearFilter, (quarterFilter - 1) * 3));

          return p.startDate <= quarterEndDate && p.endDate >= quarterStartDate;
      }

      return searchMatch && statusMatch && operatorMatch && countryMatch && languageMatch && dateMatch();
    });

    // Sorting
    switch (sortOption) {
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'date-asc':
        result.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
        break;
      case 'date-desc':
        result.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
        break;
    }

    return result;
  }, [products, searchTerm, statusFilter, operatorFilter, countryFilter, languageFilter, yearFilter, quarterFilter, sortOption]);

  const activeFilterCount = [statusFilter, operatorFilter, countryFilter, languageFilter].filter(f => f !== 'all').length + (searchTerm ? 1 : 0) + (yearFilter !== 'all' ? 1 : 0) + (quarterFilter !== 'all' && yearFilter !== 'all' ? 1 : 0);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setOperatorFilter('all');
    setCountryFilter('all');
    setLanguageFilter('all');
    setYearFilter(new Date().getFullYear());
    setQuarterFilter(getQuarter(new Date()));
    setSortOption('date-asc');
  }

  const removeFilter = (filter: 'search' |'status' | 'operator' | 'country' | 'language' | 'year' | 'quarter') => {
    switch (filter) {
        case 'search': setSearchTerm(''); break;
        case 'status': setStatusFilter('all'); break;
        case 'operator': setOperatorFilter('all'); break;
        case 'country': setCountryFilter('all'); break;
        case 'language': setLanguageFilter('all'); break;
        case 'year': setYearFilter('all'); break;
        case 'quarter': setQuarterFilter('all'); break;
    }
  }

  if (loading) {
    return <ViewSkeleton />;
  }
  
  const FilterControls = () => (
     <div className="grid grid-cols-1 gap-4">
        <h4 className="text-lg font-semibold">Filtros</h4>
         <div className="grid grid-cols-2 gap-2">
          <Select value={yearFilter.toString()} onValueChange={(value) => setYearFilter(value === 'all' ? 'all' : Number(value))}>
              <SelectTrigger>
                {yearFilter === 'all' ? 'Año' : <SelectValue />}
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
              </SelectContent>
          </Select>
          <Select value={quarterFilter.toString()} onValueChange={(value) => setQuarterFilter(value === 'all' ? 'all' : Number(value))} disabled={yearFilter === 'all'}>
              <SelectTrigger>
                {quarterFilter === 'all' ? 'Quarter' : <SelectValue />}
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="1">Q1</SelectItem>
                  <SelectItem value="2">Q2</SelectItem>
                  <SelectItem value="3">Q3</SelectItem>
                  <SelectItem value="4">Q4</SelectItem>
              </SelectContent>
          </Select>
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as Status | 'all')}>
            <SelectTrigger>
                {statusFilter === 'all' ? 'Estado' : <SelectValue />}
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
        </Select>
        <Select value={operatorFilter} onValueChange={setOperatorFilter}>
            <SelectTrigger>
                {operatorFilter === 'all' ? 'Operador' : <SelectValue />}
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {uniqueOperators.map(op => <SelectItem key={op} value={op}>{op}</SelectItem>)}
            </SelectContent>
        </Select>
        <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger>
                {countryFilter === 'all' ? 'País' : <SelectValue />}
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {uniqueCountries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
        </Select>
        <Select value={languageFilter} onValueChange={setLanguageFilter}>
            <SelectTrigger>
                {languageFilter === 'all' ? 'Idioma' : <SelectValue />}
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {uniqueLanguages.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
        </Select>
        <Separator />
        <h4 className="text-lg font-semibold">Ordenar</h4>
        <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
            <SelectTrigger><SelectValue placeholder="Ordenar por" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="date-asc">Más antiguos</SelectItem>
                <SelectItem value="date-desc">Más nuevos</SelectItem>
                <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
                <SelectItem value="name-desc">Nombre (Z-A)</SelectItem>
            </SelectContent>
        </Select>
     </div>
  );

  return (
    <div className="flex flex-col gap-4 h-full min-h-screen">
      
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={view}
            variants={slideVariants}
            {...getAnimationProps(view)}
            transition={slideTransition}
            className="h-full"
          >
            {view === 'list' && (
         <div className="space-y-2 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col sm:flex-row gap-2">
                 <div className="relative flex-1 lg:flex-none xl:max-w-full xl:min-w-[200px] 2xl:min-w-[300px] 2xl:max-w-[400px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar producto..."
                        className="pl-8 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Desktop filters */}
                <div className="hidden lg:flex flex-row gap-2">
                    <Select value={yearFilter.toString()} onValueChange={(value) => setYearFilter(value === 'all' ? 'all' : Number(value))}>
                        <SelectTrigger className="w-28">
                          {yearFilter === 'all' ? 'Año' : <SelectValue />}
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {uniqueYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select value={quarterFilter.toString()} onValueChange={(value) => setQuarterFilter(value === 'all' ? 'all' : Number(value))} disabled={yearFilter === 'all'}>
                        <SelectTrigger className="w-24">
                          {quarterFilter === 'all' ? 'Quarter' : <SelectValue/>}
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="1">Q1</SelectItem>
                            <SelectItem value="2">Q2</SelectItem>
                            <SelectItem value="3">Q3</SelectItem>
                            <SelectItem value="4">Q4</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as Status | 'all')}>
                        <SelectTrigger>
                           {statusFilter === 'all' ? 'Estado' : <SelectValue />}
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={operatorFilter} onValueChange={setOperatorFilter}>
                        <SelectTrigger>
                          {operatorFilter === 'all' ? 'Operador' : <SelectValue />}
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {uniqueOperators.map(op => <SelectItem key={op} value={op}>{op}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select value={countryFilter} onValueChange={setCountryFilter}>
                        <SelectTrigger>
                           {countryFilter === 'all' ? 'País' : <SelectValue />}
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {uniqueCountries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={languageFilter} onValueChange={setLanguageFilter}>
                        <SelectTrigger>
                           {languageFilter === 'all' ? 'Idioma' : <SelectValue />}
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {uniqueLanguages.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                
                {/* Mobile filter trigger */}
                <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
                    <SheetTrigger asChild>
                         <Button variant="outline" className="lg:hidden relative">
                            <Filter className="mr-2 h-4 w-4" />
                            Filtros
                            {activeFilterCount > 0 && (
                                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0">{activeFilterCount}</Badge>
                            )}
                        </Button>
                    </SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>Filtros y Ordenamiento</SheetTitle>
                        </SheetHeader>
                        <div className="py-4">
                            <FilterControls />
                        </div>
                    </SheetContent>
                </Sheet>
               
                <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                    <SelectTrigger className="hidden lg:flex lg:max-w-[200px]"><SelectValue placeholder="Ordenar por" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="date-asc">Más antiguos</SelectItem>
                        <SelectItem value="date-desc">Más nuevos</SelectItem>
                        <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Nombre (Z-A)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             {activeFilterCount > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">Filtros activos:</span>
                    {searchTerm && (
                        <Badge variant="secondary">
                            Búsqueda: {searchTerm}
                            <button onClick={() => removeFilter('search')} className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"><X className="h-3 w-3" /></button>
                        </Badge>
                    )}
                    {yearFilter !== 'all' && (
                        <Badge variant="secondary">
                            Año: {yearFilter}
                            <button onClick={() => removeFilter('year')} className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"><X className="h-3 w-3" /></button>
                        </Badge>
                    )}
                    {quarterFilter !== 'all' && yearFilter !== 'all' && (
                        <Badge variant="secondary">
                            Quarter: Q{quarterFilter}
                            <button onClick={() => removeFilter('quarter')} className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"><X className="h-3 w-3" /></button>
                        </Badge>
                    )}
                    {statusFilter !== 'all' && (
                        <Badge variant="secondary">
                            Estado: {STATUS_OPTIONS.find(o => o.value === statusFilter)?.label}
                            <button onClick={() => removeFilter('status')} className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"><X className="h-3 w-3" /></button>
                        </Badge>
                    )}
                     {operatorFilter !== 'all' && (
                        <Badge variant="secondary">
                            Operador: {operatorFilter}
                            <button onClick={() => removeFilter('operator')} className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"><X className="h-3 w-3" /></button>
                        </Badge>
                    )}
                     {countryFilter !== 'all' && (
                        <Badge variant="secondary">
                            País: {countryFilter}
                            <button onClick={() => removeFilter('country')} className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"><X className="h-3 w-3" /></button>
                        </Badge>
                    )}
                     {languageFilter !== 'all' && (
                        <Badge variant="secondary">
                            Idioma: {languageFilter}
                            <button onClick={() => removeFilter('language')} className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"><X className="h-3 w-3" /></button>
                        </Badge>
                    )}
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-sm text-destructive hover:text-destructive">
                        Limpiar todo
                    </Button>
                </div>
            )}
             <div className="text-sm text-muted-foreground">
                Mostrando {filteredAndSortedProducts.length} de {products.length} productos.
            </div>
        </div>
      )}
          </motion.div>
        </AnimatePresence>
      
      {/* Contenedor con animación de slide */}
      <div className="relative flex-1 overflow-hidden">
      <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={view}
            variants={slideVariants}
            {...getAnimationProps(view)}
            transition={slideTransition}
            className="h-full"
          >
            {view === 'calendar' ? (
              <ProductCalendar products={filteredAndSortedProducts} />
            ) : (
              <ProductList
                products={filteredAndSortedProducts}
                yearFilter={yearFilter}
                quarterFilter={quarterFilter}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function ViewSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-4 rounded-lg border p-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                    </div>
                </div>
            ))}
        </div>
    )
}

function HomePageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') || 'list';

  useEffect(() => {
    const savedView = localStorage.getItem('productView');
    const currentViewInParams = searchParams.get('view');

    if (savedView && savedView !== currentViewInParams) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('view', savedView);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [searchParams, router, pathname]);

  return <ProductsData view={currentView} />;
}

export default function HomePage() {
  return (
    <Suspense fallback={<ViewSkeleton />}>
      <HomePageContent />
    </Suspense>
  );
}


// 'use client';

// import { Suspense, useState, useEffect, useMemo } from 'react';
// import { useSearchParams } from 'next/navigation';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { Input } from '@/components/ui/input';
// import { Search, Filter, X } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
// import { Separator } from '@/components/ui/separator';
// import { getYear, getQuarter, startOfQuarter, endOfQuarter } from 'date-fns';

// import { ProductList } from '@/components/product-list';
// import { ProductCalendar } from '@/components/product-calendar';
// import { Skeleton } from '@/components/ui/skeleton';
// import { Product, Status, MilestoneStatus } from '@/lib/types';
// import { STATUS_OPTIONS } from '@/lib/constants';
// import { getProductsFromStorage } from '@/lib/actions';

// type SortOption = 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc';

// function ProductsData({ view }: { view: string }) {
//   const [products, setProducts] = useState<Product[]>([]);
//   const [loading, setLoading] = useState(true);
  
//   const [searchTerm, setSearchTerm] = useState('');
//   const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
//   const [operatorFilter, setOperatorFilter] = useState('all');
//   const [countryFilter, setCountryFilter] = useState('all');
//   const [languageFilter, setLanguageFilter] = useState('all');
//   const [yearFilter, setYearFilter] = useState<number | 'all'>(new Date().getFullYear());
//   const [quarterFilter, setQuarterFilter] = useState<number | 'all'>(getQuarter(new Date()));
//   const [sortOption, setSortOption] = useState<SortOption>('date-asc');
//   const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

//   const fetchProducts = () => {
//     setLoading(true);
//     if (typeof window !== 'undefined') {
//       const storedProducts = getProductsFromStorage();
//       setProducts(storedProducts);
//     }
//     setLoading(false);
//   };

//   useEffect(() => {
//     fetchProducts();
//     window.addEventListener('storage', fetchProducts);
//     return () => {
//       window.removeEventListener('storage', fetchProducts);
//     };
//   }, []);

//   const { uniqueOperators, uniqueCountries, uniqueLanguages, uniqueYears } = useMemo(() => {
//     const operators = new Set<string>();
//     const countries = new Set<string>();
//     const languages = new Set<string>();
    
//     products.forEach(p => {
//       operators.add(p.operator);
//       countries.add(p.country);
//       languages.add(p.language);
//     });
    
//     const startYear = 2025;
//     const currentYear = new Date().getFullYear();
//     const endYear = currentYear + 1;
//     const years: number[] = [];
//     for (let year = endYear; year >= startYear; year--) {
//       years.push(year);
//     }

//     return {
//       uniqueOperators: Array.from(operators).sort(),
//       uniqueCountries: Array.from(countries).sort(),
//       uniqueLanguages: Array.from(languages).sort(),
//       uniqueYears: years,
//     };
//   }, [products]);

//   const filteredAndSortedProducts = useMemo(() => {
//     let result = products;

//     // Filtering
//     result = result.filter(p => {
//       const searchMatch =
//         searchTerm === '' ||
//         p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         p.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         p.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         p.language.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         p.status.toLowerCase().includes(searchTerm.toLowerCase());

//       const statusMatch = statusFilter === 'all' || p.status === statusFilter;
//       const operatorMatch = operatorFilter === 'all' || p.operator === operatorFilter;
//       const countryMatch = countryFilter === 'all' || p.country === countryFilter;
//       const languageMatch = languageFilter === 'all' || p.language === languageFilter;

//       const dateMatch = () => {
//           if (yearFilter === 'all') return true;
//           const productStartYear = getYear(p.startDate);
//           const productEndYear = getYear(p.endDate);
          
//           const yearMatches = productStartYear <= yearFilter && productEndYear >= yearFilter;
//           if (!yearMatches) return false;

//           if (quarterFilter === 'all') return true;
          
//           const quarterStartDate = startOfQuarter(new Date(yearFilter, (quarterFilter - 1) * 3));
//           const quarterEndDate = endOfQuarter(new Date(yearFilter, (quarterFilter - 1) * 3));

//           // Check if product interval overlaps with quarter interval
//           return p.startDate <= quarterEndDate && p.endDate >= quarterStartDate;
//       }


//       return searchMatch && statusMatch && operatorMatch && countryMatch && languageMatch && dateMatch();
//     });

//     // Sorting
//     switch (sortOption) {
//       case 'name-asc':
//         result.sort((a, b) => a.name.localeCompare(b.name));
//         break;
//       case 'name-desc':
//         result.sort((a, b) => b.name.localeCompare(a.name));
//         break;
//       case 'date-asc':
//         result.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
//         break;
//       case 'date-desc':
//         result.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
//         break;
//     }

//     return result;
//   }, [products, searchTerm, statusFilter, operatorFilter, countryFilter, languageFilter, yearFilter, quarterFilter, sortOption]);

//   const activeFilterCount = [statusFilter, operatorFilter, countryFilter, languageFilter].filter(f => f !== 'all').length + (searchTerm ? 1 : 0) + (yearFilter !== 'all' ? 1 : 0) + (quarterFilter !== 'all' && yearFilter !== 'all' ? 1 : 0);

//   const clearFilters = () => {
//     setSearchTerm('');
//     setStatusFilter('all');
//     setOperatorFilter('all');
//     setCountryFilter('all');
//     setLanguageFilter('all');
//     setYearFilter(new Date().getFullYear());
//     setQuarterFilter(getQuarter(new Date()));
//     setSortOption('date-asc');
//   }

//   const removeFilter = (filter: 'search' |'status' | 'operator' | 'country' | 'language' | 'year' | 'quarter') => {
//     switch (filter) {
//         case 'search': setSearchTerm(''); break;
//         case 'status': setStatusFilter('all'); break;
//         case 'operator': setOperatorFilter('all'); break;
//         case 'country': setCountryFilter('all'); break;
//         case 'language': setLanguageFilter('all'); break;
//         case 'year': setYearFilter('all'); break;
//         case 'quarter': setQuarterFilter('all'); break;
//     }
//   }


//   if (loading) {
//     return <ViewSkeleton />;
//   }
  
//   const FilterControls = () => (
//      <div className="grid grid-cols-1 gap-4">
//         <h4 className="text-lg font-semibold">Filtros</h4>
//          <div className="grid grid-cols-2 gap-2">
//           <Select value={yearFilter.toString()} onValueChange={(value) => setYearFilter(value === 'all' ? 'all' : Number(value))}>
//               <SelectTrigger>
//                 {yearFilter === 'all' ? 'Año' : <SelectValue />}
//               </SelectTrigger>
//               <SelectContent>
//                   <SelectItem value="all">Todos</SelectItem>
//                   {uniqueYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
//               </SelectContent>
//           </Select>
//           <Select value={quarterFilter.toString()} onValueChange={(value) => setQuarterFilter(value === 'all' ? 'all' : Number(value))} disabled={yearFilter === 'all'}>
//               <SelectTrigger>
//                 {quarterFilter === 'all' ? 'Quarter' : <SelectValue />}
//               </SelectTrigger>
//               <SelectContent>
//                   <SelectItem value="all">Todos</SelectItem>
//                   <SelectItem value="1">Q1</SelectItem>
//                   <SelectItem value="2">Q2</SelectItem>
//                   <SelectItem value="3">Q3</SelectItem>
//                   <SelectItem value="4">Q4</SelectItem>
//               </SelectContent>
//           </Select>
//         </div>
//         <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as Status | 'all')}>
//             <SelectTrigger>
//                 {statusFilter === 'all' ? 'Estado' : <SelectValue />}
//             </SelectTrigger>
//             <SelectContent>
//                 <SelectItem value="all">Todos</SelectItem>
//                 {STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
//             </SelectContent>
//         </Select>
//         <Select value={operatorFilter} onValueChange={setOperatorFilter}>
//             <SelectTrigger>
//                 {operatorFilter === 'all' ? 'Operador' : <SelectValue />}
//             </SelectTrigger>
//             <SelectContent>
//                 <SelectItem value="all">Todos</SelectItem>
//                 {uniqueOperators.map(op => <SelectItem key={op} value={op}>{op}</SelectItem>)}
//             </SelectContent>
//         </Select>
//         <Select value={countryFilter} onValueChange={setCountryFilter}>
//             <SelectTrigger>
//                 {countryFilter === 'all' ? 'País' : <SelectValue />}
//             </SelectTrigger>
//             <SelectContent>
//                 <SelectItem value="all">Todos</SelectItem>
//                 {uniqueCountries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
//             </SelectContent>
//         </Select>
//         <Select value={languageFilter} onValueChange={setLanguageFilter}>
//             <SelectTrigger>
//                 {languageFilter === 'all' ? 'Idioma' : <SelectValue />}
//             </SelectTrigger>
//             <SelectContent>
//                 <SelectItem value="all">Todos</SelectItem>
//                 {uniqueLanguages.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
//             </SelectContent>
//         </Select>
//         <Separator />
//         <h4 className="text-lg font-semibold">Ordenar</h4>
//         <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
//             <SelectTrigger><SelectValue placeholder="Ordenar por" /></SelectTrigger>
//             <SelectContent>
//                 <SelectItem value="date-asc">Más antiguos</SelectItem>
//                 <SelectItem value="date-desc">Más nuevos</SelectItem>
//                 <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
//                 <SelectItem value="name-desc">Nombre (Z-A)</SelectItem>
//             </SelectContent>
//         </Select>
//      </div>
//   );

//   return (
//     <div className="flex flex-col gap-4 h-full">
//       {view === 'list' && (
//          <div className="space-y-2 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
//             <div className="flex flex-col sm:flex-row gap-2">
//                  <div className="relative flex-1 lg:flex-none xl:max-w-full xl:min-w-[200px] 2xl:min-w-[300px] 2xl:max-w-[400px]">
//                     <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
//                     <Input
//                         placeholder="Buscar producto..."
//                         className="pl-8 w-full"
//                         value={searchTerm}
//                         onChange={(e) => setSearchTerm(e.target.value)}
//                     />
//                 </div>

//                 {/* Desktop filters */}
//                 <div className="hidden lg:flex flex-row gap-2">
//                     <Select value={yearFilter.toString()} onValueChange={(value) => setYearFilter(value === 'all' ? 'all' : Number(value))}>
//                         <SelectTrigger className="w-28">
//                           {yearFilter === 'all' ? 'Año' : <SelectValue />}
//                         </SelectTrigger>
//                         <SelectContent>
//                             <SelectItem value="all">Todos</SelectItem>
//                             {uniqueYears.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
//                         </SelectContent>
//                     </Select>
//                      <Select value={quarterFilter.toString()} onValueChange={(value) => setQuarterFilter(value === 'all' ? 'all' : Number(value))} disabled={yearFilter === 'all'}>
//                         <SelectTrigger className="w-24">
//                           {quarterFilter === 'all' ? 'Quarter' : <SelectValue/>}
//                         </SelectTrigger>
//                         <SelectContent>
//                             <SelectItem value="all">Todos</SelectItem>
//                             <SelectItem value="1">Q1</SelectItem>
//                             <SelectItem value="2">Q2</SelectItem>
//                             <SelectItem value="3">Q3</SelectItem>
//                             <SelectItem value="4">Q4</SelectItem>
//                         </SelectContent>
//                     </Select>
//                     <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as Status | 'all')}>
//                         <SelectTrigger>
//                            {statusFilter === 'all' ? 'Estado' : <SelectValue />}
//                         </SelectTrigger>
//                         <SelectContent>
//                             <SelectItem value="all">Todos</SelectItem>
//                             {STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
//                         </SelectContent>
//                     </Select>
//                     <Select value={operatorFilter} onValueChange={setOperatorFilter}>
//                         <SelectTrigger>
//                           {operatorFilter === 'all' ? 'Operador' : <SelectValue />}
//                         </SelectTrigger>
//                         <SelectContent>
//                             <SelectItem value="all">Todos</SelectItem>
//                             {uniqueOperators.map(op => <SelectItem key={op} value={op}>{op}</SelectItem>)}
//                         </SelectContent>
//                     </Select>
//                      <Select value={countryFilter} onValueChange={setCountryFilter}>
//                         <SelectTrigger>
//                            {countryFilter === 'all' ? 'País' : <SelectValue />}
//                         </SelectTrigger>
//                         <SelectContent>
//                             <SelectItem value="all">Todos</SelectItem>
//                             {uniqueCountries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
//                         </SelectContent>
//                     </Select>
//                     <Select value={languageFilter} onValueChange={setLanguageFilter}>
//                         <SelectTrigger>
//                            {languageFilter === 'all' ? 'Idioma' : <SelectValue />}
//                         </SelectTrigger>
//                         <SelectContent>
//                             <SelectItem value="all">Todos</SelectItem>
//                             {uniqueLanguages.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
//                         </SelectContent>
//                     </Select>
//                 </div>
                
//                 {/* Mobile filter trigger */}
//                 <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
//                     <SheetTrigger asChild>
//                          <Button variant="outline" className="lg:hidden relative">
//                             <Filter className="mr-2 h-4 w-4" />
//                             Filtros
//                             {activeFilterCount > 0 && (
//                                 <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0">{activeFilterCount}</Badge>
//                             )}
//                         </Button>
//                     </SheetTrigger>
//                     <SheetContent>
//                         <SheetHeader>
//                             <SheetTitle>Filtros y Ordenamiento</SheetTitle>
//                         </SheetHeader>
//                         <div className="py-4">
//                             <FilterControls />
//                         </div>
//                     </SheetContent>
//                 </Sheet>
               
//                 <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
//                     <SelectTrigger className="hidden lg:flex lg:max-w-[200px]"><SelectValue placeholder="Ordenar por" /></SelectTrigger>
//                     <SelectContent>
//                         <SelectItem value="date-asc">Más antiguos</SelectItem>
//                         <SelectItem value="date-desc">Más nuevos</SelectItem>
//                         <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
//                         <SelectItem value="name-desc">Nombre (Z-A)</SelectItem>
//                     </SelectContent>
//                 </Select>
//             </div>
//              {activeFilterCount > 0 && (
//                 <div className="flex flex-wrap items-center gap-2">
//                     <span className="text-sm font-medium">Filtros activos:</span>
//                     {searchTerm && (
//                         <Badge variant="secondary">
//                             Búsqueda: {searchTerm}
//                             <button onClick={() => removeFilter('search')} className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"><X className="h-3 w-3" /></button>
//                         </Badge>
//                     )}
//                     {yearFilter !== 'all' && (
//                         <Badge variant="secondary">
//                             Año: {yearFilter}
//                             <button onClick={() => removeFilter('year')} className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"><X className="h-3 w-3" /></button>
//                         </Badge>
//                     )}
//                     {quarterFilter !== 'all' && yearFilter !== 'all' && (
//                         <Badge variant="secondary">
//                             Quarter: Q{quarterFilter}
//                             <button onClick={() => removeFilter('quarter')} className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"><X className="h-3 w-3" /></button>
//                         </Badge>
//                     )}
//                     {statusFilter !== 'all' && (
//                         <Badge variant="secondary">
//                             Estado: {STATUS_OPTIONS.find(o => o.value === statusFilter)?.label}
//                             <button onClick={() => removeFilter('status')} className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"><X className="h-3 w-3" /></button>
//                         </Badge>
//                     )}
//                      {operatorFilter !== 'all' && (
//                         <Badge variant="secondary">
//                             Operador: {operatorFilter}
//                             <button onClick={() => removeFilter('operator')} className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"><X className="h-3 w-3" /></button>
//                         </Badge>
//                     )}
//                      {countryFilter !== 'all' && (
//                         <Badge variant="secondary">
//                             País: {countryFilter}
//                             <button onClick={() => removeFilter('country')} className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"><X className="h-3 w-3" /></button>
//                         </Badge>
//                     )}
//                      {languageFilter !== 'all' && (
//                         <Badge variant="secondary">
//                             Idioma: {languageFilter}
//                             <button onClick={() => removeFilter('language')} className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"><X className="h-3 w-3" /></button>
//                         </Badge>
//                     )}
//                     <Button variant="ghost" size="sm" onClick={clearFilters} className="text-sm text-destructive hover:text-destructive">
//                         Limpiar todo
//                     </Button>
//                 </div>
//             )}
//              <div className="text-sm text-muted-foreground">
//                 Mostrando {filteredAndSortedProducts.length} de {products.length} productos.
//             </div>
//         </div>
//       )}
//       {view === 'calendar' ? (
//         <ProductCalendar products={filteredAndSortedProducts} />
//       ) : (
//         <ProductList
//           products={filteredAndSortedProducts}
//           yearFilter={yearFilter}
//           quarterFilter={quarterFilter}
//         />
//       )}
//     </div>
//   );
// }


// function ViewSkeleton() {
//     return (
//         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
//             {[...Array(8)].map((_, i) => (
//                 <div key={i} className="space-y-4 rounded-lg border p-4">
//                     <Skeleton className="h-6 w-3/4" />
//                     <Skeleton className="h-4 w-1/2" />
//                     <div className="space-y-2">
//                         <Skeleton className="h-4 w-full" />
//                         <Skeleton className="h-4 w-5/6" />
//                     </div>
//                 </div>
//             ))}
//         </div>
//     )
// }

// function HomePageContent() {
//   const searchParams = useSearchParams();
//   const currentView = searchParams.get('view') || 'list';

//   return <ProductsData view={currentView} />;
// }


// export default function HomePage() {
//   return (
//     <Suspense fallback={<ViewSkeleton />}>
//       <HomePageContent />
//     </Suspense>
//   );
// }
