# 🛒 Savely 

Página: [Click Aquí](https://savely-hhlf.onrender.com)

**Savely** es una aplicación web que permite buscar productos y comparar sus precios entre diferentes cadenas de supermercados de Argentina.

El objetivo del proyecto es facilitar la comparación de precios para que los usuarios puedan identificar las opciones más económicas al momento de realizar sus compras.

## 🚀 Tecnologías utilizadas

- **React:** desarrollo del frontend.
- **Vite:** entorno de desarrollo del frontend.
- **CSS:** diseño y estilos de la interfaz.
- **Node.js:** entorno de ejecución del backend.
- **Express:** servidor y API del backend.
- **Axios:** realización de peticiones HTTP.
- **Precios Claros:** fuente de información de productos y precios.

## 📋 Requisitos previos

Para ejecutar el proyecto de manera local, es necesario tener instalado:

- [Node.js](https://nodejs.org/) (versión 20.19+ o 22.12+).
- npm (incluido con Node.js).
- Git (opcional, para clonar el repositorio).
- Un navegador web actualizado.

Para comprobar que Node.js y npm están instalados correctamente, ejecutar:

```bash
node -v
npm -v
```

## 📥 Instalación del proyecto

### 1. Descargar el repositorio

Clonar el repositorio desde GitHub:

```bash
git clone URL_DEL_REPOSITORIO
```

Ingresar a la carpeta del proyecto:

```bash
cd Savely
```

También se puede descargar el repositorio como archivo ZIP y descomprimirlo.

### 2. Instalar las dependencias

Desde la carpeta principal de Savely, ejecutar:

```bash
npm install
```

Luego, instalar las dependencias del frontend:

```bash
npm --prefix frontend install
```

Esto instalará las librerías necesarias para ejecutar el backend y el frontend.

## 🔑 Configuración de las variables de entorno

El proyecto utiliza un archivo `.env` para configurar el servidor y el acceso a la API de Precios Claros.

**Importante:** cada integrante debe configurar su propio archivo `.env` de manera local.

El repositorio contiene un archivo `.env.example`, que funciona como plantilla y no debe contener claves privadas.

### 1. Crear el archivo .env

Desde la carpeta principal del proyecto, ejecutar:

```bash
cp .env.example .env
```

O copiar manualmente el archivo `.env.example` y renombrar la copia como `.env`.

### 2. Completar la configuración

Abrir el archivo `.env` y completar los siguientes campos:

```dotenv
PORT=3000
PRECIOS_CLAROS_BASE_URL=https://d3e6htiiul5ek9.cloudfront.net/prod
PRECIOS_CLAROS_API_KEY=TU_API_KEY
TIMEOUT_MS=10000
```

**Descripción de las variables:**

| Variable | Descripción |
|---|---|
| `PORT` | Puerto en el que se ejecutará el backend. |
| `PRECIOS_CLAROS_BASE_URL` | Dirección base del servicio de Precios Claros. |
| `PRECIOS_CLAROS_API_KEY` | Clave utilizada para autenticar las peticiones. |
| `TIMEOUT_MS` | Tiempo máximo de espera de una petición, expresado en milisegundos. |

### 3. ¿De dónde obtener la API Key?

Savely utiliza el servicio de [Precios Claros](https://www.preciosclaros.gob.ar/), que permite consultar información de precios de productos de supermercados argentinos.

El backend actual realiza las consultas utilizando una clave enviada mediante el encabezado HTTP `X-Api-Key`.

Para identificar la clave utilizada por el sitio:

1. Ingresar a https://www.preciosclaros.gob.ar/.
2. Abrir las herramientas para desarrolladores del navegador presionando `F12`.
3. Seleccionar la pestaña **Red (Network)**.
4. Realizar una búsqueda de productos desde el sitio.
5. Examinar las solicitudes realizadas al servicio de Precios Claros.
6. Buscar el encabezado `X-Api-Key` dentro de los encabezados de la solicitud (*Request Headers*).
7. Si aparece una clave accesible y su uso está permitido, colocarla en `PRECIOS_CLAROS_API_KEY` dentro del archivo `.env`.

**Aclaración:** este procedimiento permite inspeccionar la clave utilizada por el sitio web, pero no constituye un método oficial para generar claves personales. No se dispone de un portal público de registro de desarrolladores verificado para este servicio. La clave podría cambiar o dejar de funcionar, y se deben respetar las condiciones de uso de Precios Claros.

### 4. Seguridad del archivo .env

El archivo `.env` **no debe subirse a GitHub**, ya que puede contener información sensible.

El archivo `.gitignore` debe incluir:

```gitignore
# Variables de entorno
.env
.env.*
!.env.example

# Dependencias
node_modules/
frontend/node_modules/

# Archivos generados
frontend/dist/

# Archivos del sistema
.DS_Store
```

De esta manera:

- `.env` permanece únicamente en la computadora de cada integrante.
- `.env.example` se mantiene en el repositorio como plantilla.
- Las carpetas `node_modules` no se suben a GitHub.
- Los archivos generados por la compilación del frontend se ignoran.

Si el archivo `.env` ya fue agregado a Git anteriormente, se debe dejar de rastrear mediante:

```bash
git rm --cached .env
```

Luego, guardar el cambio mediante un commit. Si se publicaron credenciales privadas, también será necesario revocarlas o reemplazarlas.

## 💻 Ejecución local

Para ejecutar Savely, es necesario iniciar el backend y el frontend en dos terminales diferentes.

### Terminal 1: Backend

Desde la carpeta principal del proyecto, ejecutar:

```bash
npm run dev
```

Por defecto, el backend estará disponible en:

http://localhost:3000

### Terminal 2: Frontend

Abrir otra terminal en la carpeta principal del proyecto y ejecutar:

```bash
npm run dev:frontend
```

El frontend estará disponible en:

http://localhost:5173

Si el puerto `5173` está ocupado, Vite seleccionará otro puerto disponible, como `5174`.

**Importante:** ambas terminales deben permanecer abiertas mientras se utiliza la aplicación.

## 📁 Estructura del proyecto

```text
Savely/
│
├── backend/
│   ├── config/
│   │   └── cadenas.js
│   ├── routes/
│   │   └── buscar.js
│   ├── services/
│   │   ├── comparador.js
│   │   └── preciosClaros.js
│   └── server.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── style.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 🛍️ Funcionalidades

Savely permite:

- Buscar productos mediante un buscador dinámico.
- Consultar precios provenientes de Precios Claros.
- Comparar precios entre distintas cadenas de supermercados.
- Ordenar los resultados de menor a mayor precio y viceversa.
- Filtrar resultados por supermercado.
- Identificar las opciones más económicas.
- Crear una lista de compras temporal.
- Utilizar la aplicación desde computadoras y dispositivos móviles.

Actualmente, la comparación contempla las cadenas Día, Coto, Carrefour, Jumbo y ChangoMás, según las sucursales configuradas en el backend.

### Almacenamiento de datos

Savely no implementa cuentas de usuario ni utiliza una base de datos.

Las búsquedas y los precios obtenidos no se guardan. La lista de compras se mantiene temporalmente en memoria y se pierde al recargar la página.

### Limitaciones actuales

El backend consulta un conjunto predefinido de sucursales y devuelve un resultado por cadena.

Los productos encontrados pueden tener distintas marcas, cantidades o presentaciones, por lo que es importante comprobar que sean equivalentes antes de comparar sus precios.

Las imágenes de productos se representan mediante ilustraciones de reemplazo.

## 👨‍💻 Integrantes del proyecto

**Curso:** 6.º 3.ª

1. **Esteche Gonzalo**
2. **Minguzzi Noah**
3. **Ponce Ignacio**
4. **Soria Tobias**
5. **Villalba Miguel**

---

**Savely — Proyecto desarrollado por estudiantes de 6.º 3.ª.**
