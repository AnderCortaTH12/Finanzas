# Finanzas Familiares 💶

PWA minimalista de finanzas personales para uso familiar. Funciona offline, se
instala en el iPhone desde Safari y guarda todos los datos en el propio
dispositivo (IndexedDB) — sin backend ni cuentas.

## Stack

- **React + Vite + TypeScript**
- **Tailwind CSS** — diseño limpio mobile-first
- **Dexie.js** — almacenamiento local (IndexedDB)
- **Recharts** — gráficos
- **vite-plugin-pwa** — instalable y offline-first
- **Finnhub** — precios de activos (Fase 2)

## Requisitos

- [Node.js](https://nodejs.org) 18 o superior.

## Instalación y desarrollo

```bash
npm install        # instala dependencias
npm run dev        # arranca el servidor de desarrollo (http://localhost:5173)
```

Para probar en el iPhone durante el desarrollo, ambos dispositivos deben estar en
la misma red WiFi; arranca con `npm run dev -- --host` y abre la IP que muestra.

## Variables de entorno

Copia `.env.example` a `.env` y rellena tu clave de Finnhub (necesaria a partir de
la Fase 2):

```
VITE_FINNHUB_API_KEY=tu_clave_aqui
```

Consigue una clave gratis en https://finnhub.io/register

## Build de producción

```bash
npm run build      # genera /dist
npm run preview    # sirve /dist localmente para comprobar
```

## Estructura

```
src/
  app/         # App, rutas, contexto global (usuario activo, tema)
  db/          # Dexie: esquema y datos semilla
  models/      # modelos TypeScript
  features/    # cada dominio: expenses, categories, assets, prices, ...
  components/  # UI compartida (ui/) y layout (layout/)
  lib/         # utilidades (dinero en céntimos, fechas)
  styles/      # Tailwind + estilos globales
```

## Iconos de la PWA

Los iconos y el favicon se generan a partir de `public/logo.svg`:

```bash
npm run generate-pwa-assets
```

## Fases

- [x] **Fase 1** — Gastos: registro rápido, categorías, gráficos y comparativa mensual.
- [x] **Fase 2** — Activos y precios (Finnhub) con refresco cada 6 h.
- [x] **Fase 3** — Perfiles familiares con PIN de 4 dígitos.
- [x] **Fase 4** — Recibos recurrentes (con avisos) y presupuestos por categoría.
- [x] **Fase 5** — Modo oscuro, animaciones, icono/splash y despliegue.

---

## Desplegar gratis en Vercel (con GitHub)

### 1. Sube el proyecto a GitHub

```bash
git init
git add .
git commit -m "Finanzas Familiares"
```

Crea un repositorio nuevo en https://github.com/new (puede ser privado) y sigue
las instrucciones que te da GitHub para enlazarlo, normalmente:

```bash
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git branch -M main
git push -u origin main
```

### 2. Conéctalo a Vercel

1. Entra en https://vercel.com y regístrate con tu cuenta de GitHub.
2. Pulsa **Add New… → Project**.
3. Elige tu repositorio y pulsa **Import**.
4. Vercel detecta Vite automáticamente. No cambies nada del build.
5. En **Environment Variables** añade tu clave de Finnhub:
   - Name: `VITE_FINNHUB_API_KEY`
   - Value: tu clave
6. Pulsa **Deploy**. En ~1 minuto tendrás una URL tipo
   `https://tu-proyecto.vercel.app`.

Cada vez que hagas `git push`, Vercel vuelve a desplegar solo.

---

## Instalar en el iPhone (pantalla de inicio)

1. Abre la URL de Vercel en **Safari** (tiene que ser Safari, no Chrome).
2. Pulsa el botón **Compartir** (el cuadrado con la flecha hacia arriba).
3. Baja y pulsa **Añadir a pantalla de inicio**.
4. Confirma el nombre (“Finanzas”) y pulsa **Añadir**.

Aparecerá el icono en la pantalla de inicio y se abrirá a pantalla completa, como
una app nativa. Al estar desplegada con HTTPS, funciona offline y guarda los datos
en el propio iPhone.

> Los datos de cada dispositivo son independientes (no hay sincronización): lo que
> registres en el iPhone vive en el iPhone.
