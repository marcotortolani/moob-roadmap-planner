// src/components/header.tsx
'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  PlusCircle,
  LogOut,
  LayoutDashboard,
  Home,
  Menu,
  User,
  Mail,
} from 'lucide-react'
import { Logo } from '@/components/icons/logo'
import { ViewSwitcher } from './view-switcher'
import ProductForm from './product-form'
import { useAuth } from '@/context/auth-context'
import { usePermissionChecks } from '@/lib/rbac/hooks'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePathname, useRouter } from 'next/navigation'

export function Header() {
  const { user, logout } = useAuth()
  const { canCreateInvitations, canCreateProducts } = usePermissionChecks()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/login')
    setMobileMenuOpen(false)
  }

  const handleNavigation = (path: string) => {
    router.push(path)
    setMobileMenuOpen(false)
  }

  const isMainPage = pathname === '/'

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b-[2px] border-black bg-white px-4 sm:px-6 shadow-[0_6px_0px_0px_#000000]">
      <Link
        href="/"
        className="flex items-center gap-2 mr-auto group"
        aria-label="Ir al inicio"
      >
        <Logo
          className="h-6 w-6 group-hover:rotate-180 group-hover:scale-125 transition-all duration-500 ease-in-out"
          style={{ color: '#0052CC' }}
          aria-hidden="true"
        />
        <h1
          className="font-bold text-lg md:text-xl"
          style={{ fontWeight: 800 }}
        >
          Roadmap Planner
        </h1>
      </Link>
      <nav
        className="flex items-center justify-end gap-2 sm:gap-4"
        role="navigation"
        aria-label="Navegación principal"
      >
        {user && isMainPage && <ViewSwitcher />}

        {user && (
          <>
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-2">
              {!isMainPage && (
                <Button
                  asChild
                  variant="default"
                  size="sm"
                  className="rounded-sm"
                >
                  <Link href="/" aria-current={isMainPage ? 'page' : undefined}>
                    <Home className="h-4 w-4 mr-2" aria-hidden="true" />
                    Inicio
                  </Link>
                </Button>
              )}
              <Button
                asChild
                variant={pathname === '/dashboard' ? 'noShadow' : 'default'}
                size="sm"
                className={
                  pathname === '/dashboard'
                    ? 'translate-x-[4px] translate-y-[4px] shadow-none hover:translate-x-[4px] hover:translate-y-[4px] rounded-sm'
                    : 'rounded-sm'
                }
              >
                <Link
                  href="/dashboard"
                  aria-current={pathname === '/dashboard' ? 'page' : undefined}
                >
                  <LayoutDashboard
                    className="h-4 w-4 mr-2"
                    aria-hidden="true"
                  />
                  Dashboard
                </Link>
              </Button>
              {canCreateInvitations && (
                <Button
                  asChild
                  variant={pathname === '/invitations' ? 'noShadow' : 'default'}
                  size="sm"
                  className={
                    pathname === '/invitations'
                      ? 'translate-x-[4px] translate-y-[4px] shadow-none hover:translate-x-[4px] hover:translate-y-[4px] rounded-sm'
                      : 'rounded-sm'
                  }
                >
                  <Link
                    href="/invitations"
                    aria-current={
                      pathname === '/invitations' ? 'page' : undefined
                    }
                  >
                    <Mail className="h-4 w-4 mr-2" aria-hidden="true" />
                    Invitaciones
                  </Link>
                </Button>
              )}
              {canCreateProducts && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      aria-label="Crear nuevo producto"
                      size="sm"
                      variant="default"
                      className="shadow-[4px_4px_0px_0px_#000000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none rounded-sm"
                      style={{
                        backgroundColor: 'oklch(67.47% .1725 259.61)',
                        color: 'white',
                      }}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                      Nuevo Producto
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    className="w-full sm:max-w-3xl overflow-y-auto"
                    aria-label="Formulario de nuevo producto"
                  >
                    <SheetTitle className="sr-only">
                      Crear nuevo producto
                    </SheetTitle>
                    <SheetDescription className="sr-only">
                      Formulario para agregar un nuevo producto al roadmap
                    </SheetDescription>
                    <ProductForm />
                  </SheetContent>
                </Sheet>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="default"
                    className="relative h-8 w-8"
                    aria-label={`Menú de usuario: ${user.name}`}
                  >
                    <Avatar className="h-8 w-8" style={{ borderRadius: 0 }}>
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback style={{ borderRadius: 0 }}>
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="border-3 border-black shadow-[6px_6px_0px_0px_#000000]"
                  style={{ borderRadius: 0 }}
                >
                  <DropdownMenuLabel className="font-bold">
                    Mi Cuenta
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator
                    className="bg-black"
                    style={{ height: '2px' }}
                  />
                  <DropdownMenuItem
                    onClick={() => router.push('/profile')}
                    className="hover:bg-gray-100"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="hover:bg-gray-100"
                  >
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
                  <Button
                    variant="default"
                    size="icon"
                    aria-label="Abrir menú de navegación"
                  >
                    <Menu className="h-6 w-6" aria-hidden="true" />
                    <span className="sr-only">Menú</span>
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-3/4 border-l-[3px] border-black"
                  aria-label="Menú de navegación móvil"
                >
                  <SheetTitle className="sr-only">
                    Menú de navegación
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    Navegación principal y opciones de usuario
                  </SheetDescription>
                  <div className="flex flex-col h-full">
                    <div className="p-4 border-b-[3px] border-black">
                      <div className="flex items-center gap-3">
                        <Avatar
                          className="h-10 w-10 border-2 border-black"
                          style={{ borderRadius: 0 }}
                        >
                          <AvatarImage src={user.avatarUrl} alt={user.name} />
                          <AvatarFallback style={{ borderRadius: 0 }}>
                            {user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold">{user.name}</p>
                          <p className="text-xs" style={{ color: '#2A2A2A' }}>
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <nav
                      className="flex-1 py-4 px-2 space-y-2"
                      aria-label="Navegación móvil"
                    >
                      {!isMainPage && (
                        <Button
                          variant="default"
                          className="w-full justify-start"
                          onClick={() => handleNavigation('/')}
                          aria-current={isMainPage ? 'page' : undefined}
                        >
                          <Home className="mr-2 h-4 w-4" aria-hidden="true" />
                          Inicio
                        </Button>
                      )}
                      <Button
                        variant={
                          pathname === '/dashboard' ? 'noShadow' : 'default'
                        }
                        className={
                          pathname === '/dashboard'
                            ? 'w-full justify-start translate-x-[4px] translate-y-[4px] shadow-none hover:translate-x-[4px] hover:translate-y-[4px]'
                            : 'w-full justify-start'
                        }
                        onClick={() => handleNavigation('/dashboard')}
                        aria-current={
                          pathname === '/dashboard' ? 'page' : undefined
                        }
                      >
                        <LayoutDashboard
                          className="mr-2 h-4 w-4"
                          aria-hidden="true"
                        />
                        Dashboard
                      </Button>
                      {canCreateInvitations && (
                        <Button
                          variant={
                            pathname === '/invitations' ? 'noShadow' : 'default'
                          }
                          className={
                            pathname === '/invitations'
                              ? 'w-full justify-start translate-x-[4px] translate-y-[4px] shadow-none hover:translate-x-[4px] hover:translate-y-[4px]'
                              : 'w-full justify-start'
                          }
                          onClick={() => handleNavigation('/invitations')}
                          aria-current={
                            pathname === '/invitations' ? 'page' : undefined
                          }
                        >
                          <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                          Invitaciones
                        </Button>
                      )}
                      <Button
                        variant="default"
                        className="w-full justify-start"
                        onClick={() => handleNavigation('/profile')}
                        aria-current={
                          pathname === '/profile' ? 'page' : undefined
                        }
                      >
                        <User className="mr-2 h-4 w-4" aria-hidden="true" />
                        Perfil
                      </Button>
                      {canCreateProducts && (
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button
                              variant="default"
                              className="w-full justify-start shadow-[4px_4px_0px_0px_#000000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none"
                              style={{
                                backgroundColor: 'oklch(67.47% .1725 259.61)',
                                color: 'white',
                              }}
                            >
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Nuevo Producto
                            </Button>
                          </SheetTrigger>
                          <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
                            <SheetTitle className="sr-only">
                              Crear nuevo producto
                            </SheetTitle>
                            <SheetDescription className="sr-only">
                              Formulario para agregar un nuevo producto al
                              roadmap
                            </SheetDescription>
                            <ProductForm />
                          </SheetContent>
                        </Sheet>
                      )}
                    </nav>

                    <div className="mt-auto p-4 border-t-[3px] border-black">
                      <Button
                        variant="destructive"
                        className="w-full justify-start"
                        onClick={handleLogout}
                      >
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
  )
}
