#!/bin/bash

echo "🔧 Reparando problemas de desarrollo..."
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

# 5. Verificar integridad de node_modules
echo "5️⃣ Verificando node_modules..."
if [ ! -d "node_modules" ]; then
  echo "   ⚠️  node_modules no existe, instalando..."
  npm install
else
  echo "   ✅ node_modules OK"
fi

echo ""
echo "✅ Reparación completada!"
echo ""
echo "🚀 Para iniciar el servidor:"
echo "   npm run dev           (con Turbopack)"
echo "   npm run dev:no-turbo  (sin Turbopack, más estable)"
echo ""
