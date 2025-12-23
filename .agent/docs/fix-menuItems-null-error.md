# Fix: TypeScript Error - menuItems null assignment

## Error Original
```
./src/app/(dashboard)/administracion/modules/[id]/editar/page.tsx:68:13
Type error: Type 'null' is not assignable to type 'string | undefined'.

  66 |             displayOrder: 0,
  67 |             isActive: true,
> 68 |             menuItems: null
     |             ^
  69 |         }
  70 |     })
```

## Problema
El tipo `ModuleCreateRequest` define `menuItems` como `string | undefined`, pero el valor inicial estaba asignado como `null`.

TypeScript es estricto con la diferencia entre `null` y `undefined`:
- `null` es un valor explícito que representa "sin valor"
- `undefined` es la ausencia de valor

## Solución

**Archivo:** `frontend/src/app/(dashboard)/administracion/modules/[id]/editar/page.tsx`

**Cambio realizado:**
```typescript
// Antes (línea 68)
menuItems: null

// Después
menuItems: undefined
```

## Código Completo Corregido

```typescript
const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch
} = useForm<ModuleCreateRequest>({
    defaultValues: {
        name: '',
        code: '',
        description: '',
        icon: '',
        menuPath: '',
        displayOrder: 0,
        isActive: true,
        menuItems: undefined  // ✅ Cambiado de null a undefined
    }
})
```

## ¿Por qué esto importa?

En TypeScript strict mode:
- `string | undefined` acepta strings o undefined
- `string | null` acepta strings o null
- Son tipos diferentes y no intercambiables

Para ser consistente con el tipo definido en la interfaz, debemos usar `undefined`.

## Alternativas Consideradas

1. **Cambiar el tipo a:** `string | null | undefined`
   - Más permisivo pero menos limpio
   
2. **Usar undefined** ✅
   - Solución correcta y consistente con el tipo
   
3. **Usar string vacío:** `''`
   - Podría funcionar pero `undefined` es más semánticamente correcto para "sin valor"

## Estado Final

✅ **Error de compilación resuelto**  
✅ **Consistencia de tipos mantenida**  
✅ **Build debería completarse exitosamente**
