# Backlog - Lucky Tracker

> Actualizado 2026-11-03. Estado detallado de lo hecho: `PROGRESS.md` (Fase 11) y `AGENTS.md`.

## Siguiente (esta semana)

### Bloquea el lanzamiento
- [ ] **QA en teléfono con el build nuevo** (APK `preview`): registro con edad y teléfono por país, colonias legibles, editar perfil con teléfono viejo, correo de confirmación a `luckytracker.com.mx`, bandeja sin emoji, límites de texto
- [ ] **Publicar `/policy` y `/terms`** (sábado 2026-11-07) y revisarlas con la lista de `docs/LEGAL_*.md`: ancla `#eliminar-cuenta`, correo en texto plano, domicilio ARCO, proveedores, edad 18
- [ ] **Completar los marcadores** de los textos legales: `[RESPONSABLE]`, `[DOMICILIO]`, `[CORREO]`, `[REGIÓN]`, `[FECHA]`
- [ ] **Corregir el certificado en okhuysen.dev**: el PDF dice "Claude Code in Action" (mayo 2026), la página dice "Claude AI Developer Certification" (2025)
- [ ] **Play Console**: fichas, público objetivo solo adultos (18+), clasificación de contenido (contenido de usuarios y chat), formulario Data safety coherente con la política, URL de eliminación de cuenta
- [ ] **Build `production`** (AAB) cuando todo lo anterior esté probado

### Pruebas pendientes
- [ ] **Push FCM de punta a punta** con el build SDK 58 (necesita un segundo dispositivo; el token ya se registra)
- [ ] Probar en el build nuevo: borrar cuenta, moderación y chats después de la migración B

### Infra (plan free)
- [ ] Respaldo manual semanal (`supabase db dump`) y entrar al panel cada semana: el plan free no tiene respaldos y pausa el proyecto tras ~7 días sin actividad
- [ ] Decidir plan Pro antes de tener clientes reales
- [ ] Reporte de caídas (Sentry) antes de producción

## Después (sin fecha)
- [ ] Migración baseline (#8) para poder recrear la base desde cero
- [ ] Límites de largo en la base de datos (hoy solo `maxLength` en la app)
- [ ] Quitar el paquete `@react-native-picker/picker` (ya no se usa; es nativo, entra con un build) y su mock en `__tests__/app/editar-perfil.test.tsx`
- [ ] Color de avatar determinista por `user_id` (hoy siempre teal)
- [ ] Si alguien te bloqueó, su contenido sigue visible para ti; pets y listas de grupos no se filtran por bloqueo
- [ ] Guardar la fecha de aceptación de términos en el perfil
- [ ] Soporte offline, i18n, analítica, servir `colonias.json` desde API (ver "Baja prioridad" en `PROGRESS.md`)
- [ ] Más países fijos en el selector de teléfono (hoy México, EE. UU./Canadá y otro)

## Decisiones tomadas
- Edad mínima **18 años** (app + trigger `enforce_min_age` + textos legales). Si cambia: `MIN_AGE` en `utils/age.ts`, el trigger y los textos.
- Plan Supabase **free** por ahora.
- Sin emojis en la app ni en notificaciones.
- Los commits y los builds los hace el usuario.

---

## Histórico (2026-10-03): integración de subida de imágenes
> Sin verificar contra el estado actual. La subida se corrigió con `expo-file-system` el 2026-10-30; revisar cada punto antes de retomarlo.

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
