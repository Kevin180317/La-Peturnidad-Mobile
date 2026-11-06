# Feed vs Comunidad - Especificación Clara 2026

## Problema Actual
Ambas tabs tienen estructura idéntica. Necesitan diferenciación clara de propósito y diseño.

---

## FEED (Contenido Social / Visual)

### Propósito
**Red social de mascotas**: Compartir historias, fotos y actualizaciones de tus mascotas con la comunidad.

### Características
- ✅ **Contenido visual primario** (imágenes OBLIGATORIAS)
- ✅ Posts personales/narrativos
- ✅ Timeline social (newest first)
- ✅ Engagement: likes, comentarios, shares
- ✅ Perfil del usuario como elemento clave

### Estructura Card
```
┌─ [Avatar] Nombre Persona    [Contactar]
├─ "Publicado hace 2 horas"
├─ "Esto es mi mascota en el parque..."
├─ [📸 IMAGEN GRANDE - 60% del card height]
├─ 🏠 Ubicación: Parque Central
├─ #perro #sábado #aventura
└─ 💬 5 comentarios [Ver más]
```

### Diferenciadores Visuales
- **Imagen**: Grande, prominente (64% de altura del card)
- **Avatar**: Pequeño (40px)
- **Tipografía**: Cuerpo narrativo
- **CTA**: "Contactar" (chat directo)
- **Metadata**: ubicación, tags, links
- **Card height**: Dinámico (min 300px)

---

## COMUNIDAD (Anuncios / Textual)

### Propósito
**Tablero comunitario**: Anuncios categorizados, eventos, preguntas y avisos para la comunidad local.

### Características
- ✅ **Contenido textual primario** (imagen OPCIONAL)
- ✅ Anuncios categorizados (4 categorías)
- ✅ Información estructurada
- ✅ Timeline por importancia/categoría
- ✅ Metadatos claros (categoría, fecha)

### Estructura Card
```
┌─ [Avatar] Nombre Persona        [Contactar]
├─ "Hace 3 días"
├─ [BADGE] 🔔 AVISO
├─ "Se busca mascota perdida"
├─ "Recompensa: $50.000. Perdida el 15 de octubre..."
├─ (opcional: foto de la mascota)
└─ 💬 2 comentarios [Ver]
```

### Diferenciadores Visuales
- **Categoria Badge**: PROMINENTE (color codificado)
- **Título**: Bold, grande (h3)
- **Contenido**: Párrafos cortos/estructurados
- **Imagen**: Secundaria (optional, 30% de altura)
- **Avatar**: Pequeño (40px)
- **CTA**: "Contactar" (chat)
- **Card height**: Fijo (min 180px, max 240px - texto condensado)

---

## Comparación Visual

| Aspecto | FEED | COMUNIDAD |
|---------|------|-----------|
| **Imagen** | Obligatoria, grande | Opcional, pequeña |
| **Altura Card** | Dinámico (variable) | Fijo (180-240px) |
| **Orden** | Reciente primero | Por importancia |
| **Categoria** | NO | SÍ (badge prominente) |
| **Avatar size** | 40px | 40px |
| **Tipografía** | Narrativa | Titular + párrafo |
| **Tema** | Visual/personal | Información/acción |
| **Interacción** | Explorar, comentar | Buscar, avisos |
| **User intent** | "Ver mascotas chidas" | "Encontrar mascota perdida" |

---

## Implementación

### FeedTab (Posts Visuales)
```jsx
// Card Feed
<View className="bg-white rounded-2xl overflow-hidden shadow-md">
  {/* Header: Avatar + Nombre + Contactar */}
  <View className="flex-row items-center p-4">
    <Image source={avatar} className="w-10 h-10 rounded-full" />
    <View className="flex-1 ml-3">
      <Text className="font-semibold">{name}</Text>
      <Text className="text-xs gray">{date}</Text>
    </View>
    <ContactButton />
  </View>

  {/* Contenido narrativo */}
  <View className="px-4 pb-3">
    <Text className="text-base leading-6">{post.content}</Text>
  </View>

  {/* IMAGEN GRANDE - focal point */}
  <Image 
    source={post.image_url} 
    className="w-full h-64 bg-gray-200"
  />

  {/* Metadata: ubicación, tags, links */}
  <View className="p-4 border-t border-gray-100">
    <View className="flex-row gap-2 mb-2">
      <Ionicons name="location" />
      <Text className="text-xs">{post.location}</Text>
    </View>
    {post.tags && <View className="flex-row gap-1">{tags}</View>}
  </View>

  {/* Footer: comentarios */}
  <CommentSection />
</View>
```

### ComunidadTab (Anuncios Estructurados)
```jsx
// Card Comunidad
<View className="bg-white rounded-2xl shadow-sm mb-3">
  {/* Header: Avatar + Nombre + Contactar */}
  <View className="flex-row items-center p-4 pb-2">
    <Image source={avatar} className="w-10 h-10 rounded-full" />
    <View className="flex-1 ml-3">
      <Text className="font-semibold">{name}</Text>
      <Text className="text-xs gray">{date}</Text>
    </View>
    <ContactButton />
  </View>

  {/* BADGE PROMINENTE - focal point */}
  <View className="px-4 py-2">
    <View className={`self-start px-3 py-1.5 rounded-full ${categoryColor}`}>
      <Text className="font-semibold text-xs">{category}</Text>
    </View>
  </View>

  {/* Contenido estructurado */}
  <View className="px-4 pb-3">
    <Text className="text-lg font-bold mb-1">{announcement.title}</Text>
    <Text className="text-sm leading-5 text-gray-600">{announcement.content}</Text>
  </View>

  {/* Imagen OPCIONAL - secundaria */}
  {announcement.image_url && (
    <Image 
      source={announcement.image_url} 
      className="w-full h-40 bg-gray-200"
    />
  )}

  {/* Footer: comentarios */}
  <CommentSection />
</View>
```

---

## Beneficios de esta Diferenciación

1. ✅ **User Intent claro**: Usuarios saben qué esperan en cada tab
2. ✅ **Diseño optimizado**: Card heights, layouts específicos
3. ✅ **Información visible**: Diferencia visual inmediata
4. ✅ **Mejor UX**: Menos confusión, más conversión
5. ✅ **Escalable**: Fácil agregar features (likes, shares en Feed)
6. ✅ **Accesibilidad**: Estructura clara para screen readers

---

## Cambios Necesarios

- [ ] FeedTab: Hacer imagen OBLIGATORIA (mostrar placeholder si no)
- [ ] FeedTab: Card height DINÁMICO (min 300px)
- [ ] FeedTab: Agregar metadata (ubicación, tags, links)
- [ ] ComunidadTab: Badge prominente como focal point
- [ ] ComunidadTab: Card height FIJO (180-240px)
- [ ] ComunidadTab: Imagen OPCIONAL (más pequeña)
- [ ] Ambas: Refactorizar para claridad visual
