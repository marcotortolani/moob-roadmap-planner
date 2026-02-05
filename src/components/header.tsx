// src/components/header.tsx
'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { PlusCircle, LogOut, LayoutDashboard, Home, Menu, User, Mail } from 'lucide-react';
import { Logo } from '@/components/icons/logo';
import { ViewSwitcher } from './view-switcher';
import ProductForm from './product-form';
import { useAuth } from '@/context/auth-context';
import { usePermissionChecks } from '@/lib/rbac/hooks';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePathname, useRouter } from 'next/navigation';
import { Separator } from './ui/separator';

export function Header() {
  const { user, logout } = useAuth();
  const { canCreateInvitations, canCreateProducts } = usePermissionChecks();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
    setMobileMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setMobileMenuOpen(false);
  }

  const isMainPage = pathname === '/';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <Link href="/" className="flex items-center gap-2 mr-auto" aria-label="Ir al inicio">
        <Logo className="h-6 w-6 text-primary" aria-hidden="true" />
        <h1 className="font-headline text-lg font-semibold md:text-xl">
          Roadmap Planner
        </h1>
      </Link>
      <nav className="flex items-center justify-end gap-2 sm:gap-4" role="navigation" aria-label="Navegación principal">
        {user && isMainPage && <ViewSwitcher />}

        {user && (
          <>
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-2">
              {!isMainPage && (
                  <Button asChild variant="ghost" size="sm">
                      <Link href="/" aria-current={isMainPage ? 'page' : undefined}>
                          <Home className="h-4 w-4 mr-2" aria-hidden="true" />
                          Inicio
                      </Link>
                  </Button>
              )}
              <Button asChild variant={pathname === '/dashboard' ? 'secondary' : 'ghost'} size="sm">
                  <Link href="/dashboard" aria-current={pathname === '/dashboard' ? 'page' : undefined}>
                      <LayoutDashboard className="h-4 w-4 mr-2" aria-hidden="true" />
                      Dashboard
                  </Link>
              </Button>
              {canCreateInvitations && (
                <Button asChild variant={pathname === '/invitations' ? 'secondary' : 'ghost'} size="sm">
                    <Link href="/invitations" aria-current={pathname === '/invitations' ? 'page' : undefined}>
                        <Mail className="h-4 w-4 mr-2" aria-hidden="true" />
                        Invitaciones
                    </Link>
                </Button>
              )}
              {canCreateProducts && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button aria-label="Crear nuevo producto">
                      <PlusCircle className="h-5 w-5 mr-2" aria-hidden="true" />
                      Nuevo Producto
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="w-full sm:max-w-3xl overflow-y-auto" aria-label="Formulario de nuevo producto">
                    <ProductForm />
                  </SheetContent>
                </Sheet>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full" aria-label={`Menú de usuario: ${user.name}`}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/profile')}>
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Navigation */}
            <div className="lg:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Abrir menú de navegación">
                    <Menu className="h-6 w-6" aria-hidden="true" />
                    <span className="sr-only">Menú</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-3/4" aria-label="Menú de navegación móvil">
                    <div className="flex flex-col h-full">
                         <div className="p-4 border-b">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{user.name}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                            </div>
                        </div>

                        <nav className="flex-1 py-4 px-2 space-y-1" aria-label="Navegación móvil">
                             {!isMainPage && (
                                <Button variant="ghost" className="w-full justify-start" onClick={() => handleNavigation('/')} aria-current={isMainPage ? 'page' : undefined}>
                                    <Home className="mr-2 h-4 w-4" aria-hidden="true" />
                                    Inicio
                                </Button>
                            )}
                            <Button variant={pathname === '/dashboard' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => handleNavigation('/dashboard')} aria-current={pathname === '/dashboard' ? 'page' : undefined}>
                                <LayoutDashboard className="mr-2 h-4 w-4" aria-hidden="true" />
                                Dashboard
                            </Button>
                            {canCreateInvitations && (
                              <Button variant={pathname === '/invitations' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => handleNavigation('/invitations')} aria-current={pathname === '/invitations' ? 'page' : undefined}>
                                  <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                                  Invitaciones
                              </Button>
                            )}
                            <Button variant="ghost" className="w-full justify-start" onClick={() => handleNavigation('/profile')} aria-current={pathname === '/profile' ? 'page' : undefined}>
                                <User className="mr-2 h-4 w-4" aria-hidden="true" />
                                Perfil
                            </Button>
                            {canCreateProducts && (
                              <Sheet>
                                <SheetTrigger asChild>
                                   <Button variant="ghost" className="w-full justify-start">
                                      <PlusCircle className="mr-2 h-4 w-4" />
                                      Nuevo Producto
                                    </Button>
                                </SheetTrigger>
                                <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
                                    <ProductForm />
                                </SheetContent>
                              </Sheet>
                            )}
                        </nav>
                        
                        <div className="mt-auto p-4 border-t">
                            <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Cerrar Sesión
                            </Button>
                        </div>
                    </div>
                </SheetContent>
              </Sheet>
            </div>
          </>
        )}
      </nav>
    </header>
  );
}