# AquaControl

Aplicacion full-stack preparada para Vercel con Next.js App Router.

## Desarrollo

```bash
npm install
npm run dev
```

La app queda disponible en `http://localhost:3000`.

## Build

```bash
npm run build
```

## Vercel

Vercel detecta Next.js sin configuracion extra. Para enlazar el proyecto:

```bash
npx vercel link
npx vercel --prod
```

Variables previstas para la siguiente etapa:

- `DATABASE_URL`: conexion a Vercel Postgres o Neon.
- `BLOB_READ_WRITE_TOKEN`: almacenamiento de documentos en Vercel Blob.
- `SESSION_SECRET`: firma de sesiones.

## Estado

La primera version usa datos mock en `src/lib/operations-data.ts` y expone un endpoint inicial en `/api/operations`.
