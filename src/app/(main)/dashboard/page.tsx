// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, PackageCheck, PackageX, ClipboardCheck, Search, Filter, X } from 'lucide-react';
import { Product, Status } from '@/lib/types';
import { getProductsFromStorage } from '@/lib/actions';
import { ProductsByStatusChart } from '@/components/charts/products-by-status-chart';
import { ProductsByCountryChart } from '@/components/charts/products-by-country-chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { getYear, getQuarter, startOfQuarter, endOfQuarter } from 'date-fns';
import { STATUS_OPTIONS } from '@/lib/constants';

type SortOption = 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc';


export default function DashboardPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all');
  const [quarterFilter, setQuarterFilter] = useState<number | 'all'>('all');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const fetchProducts = () => {
    setLoading(true);
    const storedProducts = getProductsFromStorage();
    setAllProducts(storedProducts);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
    window.addEventListener('storage', fetchProducts);
    return () => {
      window.removeEventListener('storage', fetchProducts);
    };
  }, []);

  const { uniqueLanguages, uniqueYears } = useMemo(() => {
    const languages = new Set<string>();
    
    allProducts.forEach(p => {
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
      uniqueLanguages: Array.from(languages).sort(),
      uniqueYears: years,
    };
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    let result = allProducts;

    result = result.filter(p => {
      const searchMatch =
        searchTerm === '' ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.language.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.status.toLowerCase().includes(searchTerm.toLowerCase());

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
      return searchMatch && languageMatch && dateMatch();
    });

    return result;
  }, [allProducts, searchTerm, languageFilter, yearFilter, quarterFilter]);


  const stats = useMemo(() => {
    const totalProducts = filteredProducts.length;
    const liveProducts = filteredProducts.filter((p) => p.status === 'LIVE').length;
    const inProgressProducts = filteredProducts.filter(
      (p) => p.status === 'IN_PROGRESS'
    ).length;
    const demoOkProducts = filteredProducts.filter(
      (p) => p.status === 'DEMO_OK'
    ).length;
    return { totalProducts, liveProducts, inProgressProducts, demoOkProducts };
  }, [filteredProducts]);

  const activeFilterCount = [languageFilter].filter(f => f !== 'all').length + (searchTerm ? 1 : 0) + (yearFilter !== 'all' ? 1 : 0) + (quarterFilter !== 'all' && yearFilter !== 'all' ? 1 : 0);

  const clearFilters = () => {
    setSearchTerm('');
    setLanguageFilter('all');
    setYearFilter('all');
    setQuarterFilter('all');
  }

  const removeFilter = (filter: 'search' | 'language' | 'year' | 'quarter') => {
    switch (filter) {
        case 'search': setSearchTerm(''); break;
        case 'language': setLanguageFilter('all'); break;
        case 'year': setYearFilter('all'); break;
        case 'quarter': setQuarterFilter('all'); break;
    }
  }


  if (loading) {
     return <div className="flex h-full items-center justify-center">Cargando...</div>
  }
  
  const FilterControls = () => (
     <div className="grid grid-cols-1 gap-4">
        <h4 className="text-lg font-semibold">Filtros del Dashboard</h4>
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
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
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
                        Q{quarterFilter}
                        <button onClick={() => removeFilter('quarter')} className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"><X className="h-3 w-3" /></button>
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
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 md:pb-6">
            <div className="flex flex-col items-start gap-2 md:flex-row md:items-end md:justify-between">
                <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium">Total</CardTitle>
                </div>
                <div className="text-2xl font-bold md:hidden">{stats.totalProducts}</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="hidden text-2xl font-bold md:block">{stats.totalProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 md:pb-6">
            <div className="flex flex-col items-start gap-2 md:flex-row md:items-end md:justify-between">
                <div className="flex items-center gap-2">
                    <PackageX className="h-4 w-4 text-red-500" />
                    <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
                </div>
                <div className="text-2xl font-bold md:hidden">{stats.inProgressProducts}</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="hidden text-2xl font-bold md:block">{stats.inProgressProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 md:pb-6">
            <div className="flex flex-col items-start gap-2 md:flex-row md:items-end md:justify-between">
                <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-yellow-500" />
                    <CardTitle className="text-sm font-medium">En Demo</CardTitle>
                </div>
                <div className="text-2xl font-bold md:hidden">{stats.demoOkProducts}</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="hidden text-2xl font-bold md:block">{stats.demoOkProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 md:pb-6">
            <div className="flex flex-col items-start gap-2 md:flex-row md:items-end md:justify-between">
                <div className="flex items-center gap-2">
                    <PackageCheck className="h-4 w-4 text-green-500" />
                    <CardTitle className="text-sm font-medium">En Producción</CardTitle>
                </div>
                <div className="text-2xl font-bold md:hidden">{stats.liveProducts}</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="hidden text-2xl font-bold md:block">{stats.liveProducts}</div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Productos por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductsByStatusChart products={filteredProducts} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Productos por País</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductsByCountryChart products={filteredProducts} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
