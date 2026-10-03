# 📋 Backlog - Lucky Tracker

## Próxima Semana (Image Upload Integration)

### ✅ Completado (Esta Semana)
- [x] Auditoría completa de UI/UX (24 pantallas + componentes)
- [x] Corrección de colores de navegación (links de rojo a teal)
- [x] Limpieza de clases de fuente inválidas (font-[Inter_*])
- [x] Redesign de ProfileTab (estilo menu consistente)
- [x] Implementación de subida de imágenes para posts (Feed)

### ⏳ Backlog - Integración de Subida de Imágenes

#### 1. **Emergencia - Mascotas Perdidas** (PRIORITY: HIGH)
- **Archivo:** `app/dashboard.tsx` → `handleReportMissing` / EmergencyTab
- **Tarea:** Implementar subida de foto de mascota perdida a bucket `emergency-alerts`
- **Contexto:** Cuando usuario reporta mascota perdida, debe subir foto a Storage
- **Código necesario:** Similar a `handleCreatePost` pero para emergencies
- **Estimado:** 30 min

#### 2. **Emergencia - Mascotas Encontradas** (PRIORITY: HIGH)
- **Archivo:** `app/dashboard.tsx` → `handleReportFound` / EmergencyTab
- **Tarea:** Implementar subida de foto de mascota encontrada a bucket `found-pets`
- **Contexto:** Cuando usuario marca mascota encontrada, debe subir foto
- **Estimado:** 30 min

#### 3. **Historias de Éxito** (PRIORITY: MEDIUM)
- **Archivo:** `app/historias.tsx` → `handleCreate`
- **Tarea:** Implementar subida de imagen de historia a bucket `success-stories`
- **Contexto:** Las reuniones exitosas pueden tener foto adjunta
- **Estimado:** 30 min

#### 4. **Perfil - Foto de Mascota** (PRIORITY: MEDIUM)
- **Archivo:** `components/dashboard/PetForm.tsx` / PetDetailModal
- **Tarea:** Verificar que subida de foto de mascota funcione correctamente
- **Contexto:** Cuando registras/editas mascota, foto debe ir a Storage
- **Estimado:** 20 min

#### 5. **Validación y Testing** (PRIORITY: HIGH)
- [ ] Probar creación de posts con múltiples imágenes
- [ ] Probar creación de alertas de emergencia con foto
- [ ] Verificar que URLs persistan después de reload
- [ ] Probar visualización de imágenes en feed
- [ ] Validar RLS policies en Storage buckets
- **Estimado:** 1 hora

### 📊 Resumen
- **Total tareas:** 5 + Testing
- **Tiempo estimado:** 2-3 horas
- **Buckets necesarios:** `posts`, `emergency-alerts`, `found-pets`, `success-stories`, `pet-images`
- **Riesgo:** Bajo (patrón idéntico a posts)

---

## Notas Técnicas
- Usar `dashboardService.uploadImage(uri, bucketName)` para todas las subidas
- Siempre guardar URLs públicas en BD, NO URIs locales
- Validar que el bucket exista antes de subir (fallback a `public` si no existe)
- Mostrar toast de error si alguna subida falla

---

**Asignado a:** Developer  
**Target:** Próxima semana  
**Creado:** 2026-10-03
