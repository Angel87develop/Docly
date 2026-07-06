
# Docly

> Una biblioteca moderna para organizar y leer documentos locales.

Docly es una aplicación web diseñada para gestionar, organizar y leer documentos personales como **PDF**, **EPUB** y **TXT** desde una interfaz rápida, limpia e intuitiva.

Su objetivo es ofrecer una experiencia sencilla para administrar una biblioteca personal, con soporte para carpetas, filtros, progreso de lectura y almacenamiento local.

---

## Características

- Importación de archivos locales.
- Biblioteca visual basada en tarjetas.
- Organización mediante carpetas.
- Filtros por estado, etiquetas y ordenación.
- Lector integrado para PDF, EPUB y TXT.
- Persistencia mediante IndexedDB.
- Soporte opcional para carpetas locales mediante la File System Access API.

---

## Tecnologías

| Tecnología | Descripción |
|------------|-------------|
| React + TypeScript | Desarrollo de la interfaz |
| Vite | Entorno de desarrollo y compilación |
| Zustand | Gestión del estado |
| React Router | Navegación |
| PDF.js | Renderizado de documentos PDF |
| EPUB.js | Lectura de archivos EPUB |
| IndexedDB | Persistencia de datos |

---

## Requisitos

- Node.js **18** o superior
- npm

---

## Instalación

Clona el repositorio:

```bash
git clone <url-del-repositorio>
```

Accede al proyecto:

```bash
cd docly
```

Instala las dependencias:

```bash
npm install
```

Inicia el servidor de desarrollo:

```bash
npm run dev
```

La aplicación estará disponible en:

```
http://localhost:5173
```

---

## Scripts

```bash
npm run dev      # Desarrollo
npm run build    # Producción
npm run preview  # Vista previa
npm run lint     # Linter
```

---

## Uso

1. Abre la aplicación.
2. Importa uno o varios documentos.
3. Organízalos en carpetas.
4. Filtra o busca documentos según tus necesidades.
5. Abre cualquier archivo para comenzar a leer.

---

## Estructura del proyecto

```text
src/
├── components/
├── features/
├── pages/
├── services/
├── store/
├── types/
└── ...
```

---

## Notas

- Algunas funciones requieren un navegador compatible con la **File System Access API**.
- La experiencia de lectura depende del formato del documento.
- Toda la información se almacena localmente mediante IndexedDB.

---

## Estado

**En desarrollo activo.**

Docly ya ofrece una experiencia sólida para organizar y leer documentos locales, y continuará incorporando nuevas funciones enfocadas en mejorar la organización, el rendimiento y la experiencia de usuario.
