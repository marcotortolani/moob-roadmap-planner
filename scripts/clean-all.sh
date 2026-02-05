#!/bin/bash

echo "🧹 Limpieza completa del proyecto..."
echo ""

# 1. Detener servidor Next.js
echo "1️⃣ Deteniendo servidor Next.js..."
pkill -f "next dev" 2>/dev/null || echo "   No hay servidor corriendo"
sleep 1

# 2. Limpiar cache de Next.js
echo "2️⃣ Limpiando cache de Next.js..."
rm -rf .next
echo "   ✅ Cache .next eliminado"

# 3. Limpiar cache de node_modules
echo "3️⃣ Limpiando cache de node_modules..."
rm -rf node_modules/.cache
echo "   ✅ Cache node_modules eliminado"

# 4. Limpiar cache de Turbopack
echo "4️⃣ Limpiando cache de Turbopack..."
rm -rf node_modules/.cache/turbopack
echo "   ✅ Cache Turbopack eliminado"

# 5. Limpiar cache de TypeScript
echo "5️⃣ Limpiando cache de TypeScript..."
rm -rf .tsbuildinfo
echo "   ✅ Cache TypeScript eliminado"

# 6. Limpiar build artifacts
echo "6️⃣ Limpiando build artifacts..."
rm -rf dist
rm -rf out
echo "   ✅ Build artifacts eliminados"

echo ""
echo "✅ Limpieza completada!"
echo ""
echo "🚀 Para iniciar el servidor limpio:"
echo "   npm run dev           (con Turbopack)"
echo "   npm run dev:no-turbo  (sin Turbopack, más estable)"
echo ""
echo "💡 Si el problema persiste:"
echo "   1. Abre DevTools → Application → Clear site data"
echo "   2. Cierra todas las pestañas del sitio"
echo "   3. Vuelve a iniciar el servidor"
echo ""
