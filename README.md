# GuitarsLA — Frontend React + TypeScript

## Instalación y ejecución

### Requisitos

- Node.js 20 o superior y npm.
- El backend [GuitarsLA-Backend](../GuitarsLA-Backend) configurado y ejecutándose en el puerto `3008`.

### Instalar dependencias

Desde esta carpeta:

```powershell
cd "C:\Users\Abraham RG\GuitarsLA-ts\GuitarsLA-ts"
npm install
```

El frontend no necesita credenciales propias. Las peticiones `/api` se envían mediante el proxy de Vite a `http://localhost:3008`.

### Arrancar el servidor de desarrollo

```powershell
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173).

### Validar el frontend

```powershell
npm run build
npm run lint
```

### Flujo completo

1. Inicia PostgreSQL y el backend siguiendo las instrucciones de [GuitarsLA-Backend/README.md](../GuitarsLA-Backend/README.md).
2. En esta carpeta ejecuta `npm run dev`.
3. Abre `http://localhost:5173`.
4. El catálogo se carga desde `GET /api/guitars`; el formulario registra guitarras mediante `POST /api/guitars`.

---


## 1. Visión General del Proyecto

### Nombre y propósito

**GuitarsLA** es una aplicación de comercio electrónico (e-commerce) de página única (SPA) desarrollada con React y TypeScript. Su propósito es presentar un catálogo de guitarras eléctricas y permitir al usuario gestionar un carrito de compras interactivo, con persistencia de datos en el navegador entre sesiones.

**Problema que resuelve:** Permite consultar un catálogo servido por la API, registrar nuevas guitarras y gestionar un carrito — agregar artículos, controlar cantidades (mínimo 1, máximo 5 por producto), eliminar productos individuales, vaciar el carrito y consultar el total a pagar. El catálogo se guarda en PostgreSQL y el carrito se persiste en `localStorage`.

### Funcionalidades principales

- Carrito de compras interactivo accesible desde el encabezado (hover)
- Agregar guitarras al carrito (con límite máximo de 5 unidades por ítem)
- Incrementar / decrementar cantidad por producto
- Eliminar productos individuales del carrito
- Vaciar completamente el carrito
- Cálculo automático del total a pagar
- Persistencia del carrito en `localStorage` (sobrevive recargas de página)
- Diseño responsivo adaptado a móvil, tablet y escritorio

### Capturas de pantalla

![Vista principal del catálogo de guitarras](ReadmeImg/Screenshot%202026-10-13%20at%2010-22-53%20Guitarsla-ts.png)


## 2. Ficha Técnica y Tecnologías

### Lenguajes

| Lenguaje | Versión | Nivel de tipado |
|---|---|---|
| TypeScript | `~6.0.2` | Estricto — `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` activados |
| JavaScript (ES) | ES2023 (target del compilador) | Inferencia de tipos + tipos explicitos en props e interfaces |
| JSX / TSX | React JSX transform | Sintaxis declarativa de componentes |

> El proyecto utiliza TypeScript con configuracion estricta. Los tipos globales se declaran en `src/types.d.ts` como tipos ambientales, disponibles en todo el proyecto sin necesidad de importarlos explícitamente.

### Librerías UI & Framework

| Tecnología | Versión | Uso |
|---|---|---|
| React | `^19.2.8` | Librería principal de UI — componentes, hooks, renderizado |
| React DOM | `^19.2.8` | Montaje de la aplicación en el DOM (`createRoot`) |
| Bootstrap (CSS) | `5.2.3` (embebido en `index.css`) | Sistema de grillas, utilidades de espaciado, tipografía y componentes base |
| CSS Personalizado | — | Estilos propios del carrito, header animado y customización de Bootstrap |

> Bootstrap **no se importa como paquete npm**; su CSS compilado esta integrado directamente en `src/index.css`, lo que elimina dependencias externas de estilos y reduce el bundle final.

### Entorno y Tooling

| Herramienta | Versión | Rol |
|---|---|---|
| **Vite** | `^8.3.0` | Bundler y servidor de desarrollo (HMR ultrarrápido) |
| **@vitejs/plugin-react** | `^6.1.1` | Integración de React con Vite (Fast Refresh + JSX transform) |
| **npm** | (gestor de paquetes del sistema) | Instalación y gestión de dependencias |
| **ESLint** | `^10.10.0` | Linting estático del código |
| **eslint-plugin-react-hooks** | `^7.1.1` | Reglas de linting específicas para hooks de React |
| **typescript-eslint** | `^8.69.0` | Integración de TypeScript con ESLint |

### Dependencias Clave

| Dependencia | Tipo | Función |
|---|---|---|
| `react` | Producción | Motor de renderizado, sistema de hooks y Virtual DOM |
| `react-dom` | Producción | Interfaz para montar React en el DOM del navegador |
| `@types/react` | Desarrollo | Definiciones de tipos TypeScript para React |
| `@types/react-dom` | Desarrollo | Definiciones de tipos TypeScript para React DOM |
| `@types/node` | Desarrollo | Tipos de Node.js para el entorno de Vite |

> **Sin librerias externas de enrutamiento, cliente HTTP ni gestión de estado global.** La aplicación usa `fetch` para comunicarse con el backend; la lógica del carrito se encapsula en un Custom Hook y el catálogo se obtiene desde PostgreSQL mediante la API.



## 3. Arquitectura e Implementación en React

### 3.1 Hooks Nativos Utilizados

#### `useState`

Se utiliza en el Custom Hook `useCart` para gestionar dos estados locales:

```typescript
// src/hooks/useCart.ts

// Estado del catalogo de guitarras (datos estáticos, no mutable desde la UI)
const [data] = useState(db);

// Estado del carrito  se inicializa con la función lazy initializer
const [cart, setCart] = useState(initialCart);
```

**Decisión de diseño  Lazy Initializer:**
El estado `cart` utiliza una función (`initialCart`) como argumento de `useState` en lugar de un valor directo. Esto es un patrón de **lazy initialization**: React solo ejecuta `initialCart()` en el primer renderizado, evitando que `localStorage.getItem()` se llame en cada re-render. La función también incorpora manejo de errores con `try/catch` para proteger contra datos corruptos en `localStorage`.

```typescript
const initialCart = () => {
    const localStorageCart = localStorage.getItem('cart');
    try {
        const parsed = localStorageCart ? JSON.parse(localStorageCart) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Error al leer el carrito de localStorage:", error);
        localStorage.removeItem('cart');
        return [];
    }
}
```

---

#### `useEffect`

Se utiliza para sincronizar el estado del carrito con `localStorage` cada vez que el carrito cambia:

```typescript
// src/hooks/useCart.ts

useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
}, [cart]); // Se ejecuta SOLO cuando `cart` cambia
```

**Justificación:** Este efecto actúa como un **observador de sincronización** (efecto secundario puro). Cada vez que el estado `cart` se actualiza por agregar, eliminar o modificar productos React ejecuta este efecto y persiste el nuevo estado serializado en `localStorage`. El array de dependencias `[cart]` garantiza que el efecto no se ejecute innecesariamente.

---

#### `useMemo`

Se utiliza para calcular valores derivados del carrito de forma optimizada:

```typescript
// src/hooks/useCart.ts

// Derivado booleano: ¿está el carrito vacío?
const isEmpty = useMemo(() => cart.length === 0, [cart]);

// Derivado numérico: total acumulado de todos los ítems
const cartTotal = useMemo(
    () => cart.reduce((total, item) => total + (item.quantity * item.price), 0),
    [cart]
);
```

**Justificación:** Tanto `isEmpty` como `cartTotal` son valores **derivados** del estado `cart`. Sin `useMemo`, estos cálculos se reejecutarían en cada renderizado del componente padre, incluso si `cart` no cambió. Al memoizarlos, React solo recalcula cuando `cart` cambia, lo que optimiza el rendimiento.

---

#### Hooks no utilizados en este proyecto y por qué

| Hook | Motivo de ausencia |
|---|---|
| `useRef` | No se requiere manipulación directa del DOM ni persistencia de valores entre renders sin causar re-render |
| `useCallback` | Las funciones del hook son locales y no se pasan a componentes hijos memorizados con `React.memo` |
| `useContext` / `useReducer` | El estado es simple y lineal; un Custom Hook centralizado es suficiente sin necesidad de Context API |

---

### 3.2 Custom Hooks (Hooks Personalizados)

#### `useCart` — `src/hooks/useCart.ts`

**Propósito:** Encapsula **toda la lógica de negocio del carrito de compras** en un módulo reutilizable y desacoplado de los componentes de UI.

**Lógica encapsulada:**

| Responsabilidad | Descripción |
|---|---|
| Inicialización con persistencia | Lee el carrito desde `localStorage` al montar la aplicación |
| Sincronización automática | Guarda el carrito en `localStorage` en cada cambio vía `useEffect` |
| Agregar producto | Verifica si existe; si existe, incrementa cantidad (máx. 5); si no, agrega con `quantity: 1` |
| Decrementar cantidad | Reduce en 1 la cantidad de un ítem respetando el mínimo de 1 unidad |
| Incrementar cantidad | Aumenta en 1 la cantidad de un ítem respetando el máximo de 5 unidades |
| Eliminar producto | Filtra el ítem del carrito por `id` |
| Vaciar carrito | Reinicia el estado a un array vacío |
| Calcular totales | Computa `isEmpty` y `cartTotal` con `useMemo` |

**Constantes de negocio:**
```typescript
const MIN_ITEMS = 1; // Unidades mínimas por ítem
const MAX_ITEMS = 5; // Unidades máximas por ítem
```

**Valores y métodos expuestos (API del hook):**

```typescript
return {
    data,            // Guitar[]     — Catálogo completo de guitarras
    cart,            // CartItem[]   — Ítems actuales en el carrito
    addToCart,       // (item: Guitar) => void
    decreaseQuantity,// (id: number) => void
    increaseQuantity,// (id: number) => void
    removeFromCart,  // (id: number) => void
    clearCart,       // () => void
    isEmpty,         // boolean      — true si el carrito no tiene ítems
    cartTotal,       // number       — suma total del precio x cantidad
}
```

**Dónde se consume:**

```typescript
// src/App.tsx — único punto de consumo
const { cart, data, addToCart, decreaseQuantity,
        increaseQuantity, removeFromCart, clearCart,
        isEmpty, cartTotal } = useCart();
```

**Beneficio del patrón Custom Hook:** Si en el futuro se reemplaza `localStorage` por una API REST o un gestor de estado global, solo se modifica `useCart.ts` — ningún componente de presentación necesita cambios.

---

### 3.3 Estructura de Componentes

#### Árbol de componentes

```
App (componente inteligente / contenedor)
├── Header (componente de presentación con comportamiento)
└── Guitar (componente presentacional puro)
```

#### Componentes Inteligentes (Smart / Container)

| Componente | Archivo | Responsabilidad |
|---|---|---|
| `App` | `src/App.tsx` | Punto de entrada de la aplicación. Consume `useCart`, coordina el estado y distribuye props hacia los componentes hijos. No contiene lógica de negocio propia. |

```tsx
// App.tsx — actúa como orquestador de estado
function App() {
    const { cart, data, addToCart, ... } = useCart(); // consume el hook

    return (
        <>
            <Header cart={cart} ... />
            <main>
                {data.map(guitar => (
                    <Guitar guitar={guitar} addToCart={addToCart} />
                ))}
            </main>
        </>
    )
}
```

#### Componentes Presentacionales (Dumb / Presentational)

| Componente | Archivo | Responsabilidad |
|---|---|---|
| `Header` | `src/components/Header.tsx` | Renderiza el encabezado con logo y el carrito interactivo. Recibe todos sus datos y callbacks por props. No gestiona estado propio. |
| `Guitar` | `src/components/Guitar.tsx` | Renderiza la tarjeta de un producto (imagen, nombre, descripción, precio, botón). Completamente stateless. |

#### Tipado de Props

Los tipos de props están definidos globalmente en `src/types.d.ts` como tipos ambientales (sin `export`), lo que los hace disponibles en todos los archivos `.tsx` sin importaciones:

```typescript
// src/types.d.ts

type Guitar = {
    id: number;
    name: string;
    image: string;
    description: string;
    price: number;
}

type CartItem = Guitar & {
    quantity: number;    // Composición por intersección de tipos
}

type GuitarProps = {
    guitar: Guitar;
    addToCart: (item: Guitar) => void;
}

type CartProp = {
    cart: CartItem[];
    decreaseQuantity: (item: number) => void;
    increaseQuantity: (item: number) => void;
    removeFromCart: (item: number) => void;
    clearCart: () => void;
    isEmpty: boolean;
    cartTotal: number;
}
```

**Patrones de tipado utilizados:**
- **Intersección de tipos (`&`):** `CartItem = Guitar & { quantity: number }` — reutiliza el tipo base y agrega campos sin duplicar código.
- **Tipos de función explícitos:** Todos los callbacks están tipados con firmas completas `(param: tipo) => void`.
- **Tipos ambientales (`.d.ts`):** Evita imports repetitivos en cada componente, manteniendo el código limpio.

---

## 4. Patrones, Estado y Persistencia

### Estrategia de Manejo de Estado

El proyecto utiliza **estado local con Custom Hook** como única estrategia de gestión de estado:

| Nivel | Mecanismo | Ubicación |
|---|---|---|
| Estado local del carrito | `useState` dentro de `useCart` | `src/hooks/useCart.ts` |
| Estado del catálogo | `useState` con datos estáticos | `src/hooks/useCart.ts` |
| Valores derivados | `useMemo` | `src/hooks/useCart.ts` |
| Distribución a UI | Props drilling (un nivel) | `App.tsx` → `Header.tsx` / `Guitar.tsx` |

No se utiliza Context API ni gestores externos (Redux, Zustand, Jotai) ya que la profundidad del árbol de componentes es de un solo nivel, lo que hace que el prop drilling sea completamente aceptable y más eficiente que introducir un sistema de contexto.

### Persistencia en el Navegador

| Mecanismo | Clave | Qué persiste |
|---|---|---|
| `localStorage` | `'cart'` | Array de `CartItem[]` serializado como JSON |

**Flujo de persistencia:**

```
[Usuario agrega producto]
        ↓
  setCart(nuevoCarrito)
        ↓
  React re-renderiza
        ↓
  useEffect detecta cambio en [cart]
        ↓
  localStorage.setItem('cart', JSON.stringify(cart))
        ↓
  [El carrito sobrevive recargas de página]
```

**Recuperación al iniciar:**

```
[Usuario abre la app / recarga]
        ↓
  useState(initialCart)  ← lazy initializer
        ↓
  localStorage.getItem('cart')
        ↓
  JSON.parse() con try/catch
        ↓
  Validación: ¿es Array? → retorna datos o [] en caso de corrupción
```

### Manejo de Estados Asíncronos

El catálogo se carga de forma asíncrona desde `GET /api/guitars` y el formulario registra datos mediante `POST /api/guitars`. Los estados de carga y error se gestionan en `App.tsx`, mientras que el carrito continúa persistiendo sus datos en `localStorage`.

Sin embargo, la arquitectura del Custom Hook está preparada para incorporar estos estados sin modificar los componentes:

| Estado | Implementación futura sugerida |
|---|---|
| `loading` | `useState<boolean>(false)` — activar antes del fetch, desactivar al completar |
| `error` | `useState<string \| null>(null)` — capturar en bloque `catch` |
| `empty` | Ya implementado: `isEmpty` derivado con `useMemo` |
| `success` | Implícito cuando `cart.length > 0` y `!loading` y `!error` |



### Paso 1  Clonar el repositorio

```bash
https://github.com/karinadiosdado/GuitarsLA-ts.git
cd GuitarsLA-ts
```


### Paso 2  Instalar dependencias

```bash
npm install
```

Esto instalará todas las dependencias listadas en `package.json`, incluyendo React 19, Vite 8, TypeScript 6 y las herramientas de desarrollo.

### Paso 3  Variables de entorno

Este proyecto **no requiere variables de entorno** en su estado actual. No existe archivo `.env` necesario para el entorno de desarrollo local.


### Paso 4  Ejecutar el entorno de desarrollo

```bash
npm run dev
```

Vite iniciará el servidor de desarrollo con Hot Module Replacement (HMR). La aplicación estará disponible en:

```
http://localhost:5173
```


### Resumen de scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo con HMR |
| `npm run build` | Compila TypeScript y genera el bundle de producción |
| `npm run preview` | Sirve el bundle de producción localmente |
| `npm run lint` | Ejecuta ESLint sobre todo el código fuente |
| `npm start` | Alias de `npm run dev` |

---

## Estructura del Proyecto

```
GuitarsLA-ts/
├── public/
│   └── img/                    # Imágenes estáticas (guitarras, logo, header)
├── src/
│   ├── components/
│   │   ├── Guitar.tsx          # Componente presentacional — tarjeta de producto
│   │   └── Header.tsx          # Componente presentacional — encabezado + carrito
│   ├── data/
│   │   └── db.ts               # Catálogo estático de 12 guitarras (Guitar[])
│   ├── hooks/
│   │   └── useCart.ts          # Custom Hook — toda la lógica del carrito
│   ├── App.tsx                 # Componente raíz — orquestador de estado
│   ├── App.css                 # Estilos específicos del componente App
│   ├── index.css               # Estilos globales + Bootstrap 5.2.3 embebido
│   ├── main.tsx                # Punto de entrada — monta React en el DOM
│   └── types.d.ts              # Declaraciones de tipos globales (Guitar, CartItem, Props)
├── index.html                  # HTML base — punto de entrada para Vite
├── vite.config.ts              # Configuración de Vite + plugin de React
├── tsconfig.json               # Configuración base de TypeScript
├── tsconfig.app.json           # Configuración TypeScript para el código fuente
├── tsconfig.node.json          # Configuración TypeScript para scripts de Node
├── eslint.config.js            # Configuración de ESLint
├── package.json                # Dependencias y scripts del proyecto
└── README.md                   # Documentación técnica del proyecto
```

---

GuitarsLA — Desarrollado con React 19 + TypeScript 6 + Vite 8
