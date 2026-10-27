# 🛒 Savely 

Página: [Click Aquí](https://savely-hhlf.onrender.com)

**Página web:** [Acceder a Savely](https://savely-hhlf.onrender.com)

**Repositorio:** [GitHub - Savely](https://github.com/Goqla/Savely)

**Savely** es una aplicación web que permite buscar productos y comparar sus precios entre diferentes cadenas de supermercados de Argentina.

El objetivo del proyecto es facilitar la comparación de precios para que los usuarios puedan identificar las opciones más económicas al momento de realizar sus compras.

## 🚀 Tecnologías utilizadas

### Frontend

- **React:** desarrollo de la interfaz de usuario.
- **Vite:** entorno de desarrollo y compilación del frontend.
- **CSS:** diseño y estilos de la interfaz.
- **React Router:** navegación entre las páginas de inicio, registro y login.
- **Supabase JS:** comunicación con el sistema de autenticación y la base de datos.

### Backend

- **Node.js:** entorno de ejecución del servidor.
- **Express:** servidor y API del backend.
- **Axios:** realización de peticiones HTTP.
- **Precios Claros:** fuente de información de productos y precios.

### Base de datos y alojamiento

- **Supabase:** autenticación de usuarios y base de datos PostgreSQL.
- **Render:** alojamiento de la aplicación web.
- **GitHub:** repositorio del código fuente.

## 📋 Requisitos previos

Para ejecutar el proyecto de manera local, es necesario tener instalado:

- [Node.js](https://nodejs.org/) (versión 20.19+ o 22.12+).
- npm (incluido con Node.js).
- Git (opcional, para clonar el repositorio).
- Un navegador web actualizado.
- Una cuenta de [Supabase](https://supabase.com/).

Para comprobar que Node.js y npm están instalados correctamente:

```bash
node -v
npm -v
```

## 📥 Instalación del proyecto

### 1. Descargar el repositorio

Clonar el repositorio desde GitHub:

```bash
git clone https://github.com/Goqla/Savely.git
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

## 🗄️ Configuración de Supabase

Savely utiliza Supabase para gestionar el registro, inicio de sesión y almacenamiento de información básica de sus usuarios.

**Importante:** cada integrante puede crear su propio proyecto de Supabase para realizar pruebas locales. Si se desea utilizar una misma base de datos compartida, todos deberán utilizar las credenciales públicas del mismo proyecto.

### 1. Crear un proyecto en Supabase

1. Ingresar a [Supabase Dashboard](https://supabase.com/dashboard).
2. Iniciar sesión o crear una cuenta.
3. Seleccionar **New Project**.
4. Elegir una organización.
5. Completar los siguientes datos:
   - **Project Name:** Savely.
   - **Database Password:** establecer una contraseña segura.
   - **Region:** seleccionar una región cercana.
6. Presionar **Create new project**.

Supabase creará automáticamente una base de datos PostgreSQL y habilitará su servicio de autenticación.

**Nota:** guardar la contraseña de la base de datos en un lugar seguro. No es necesario colocarla en el frontend ni en los archivos `.env` de Savely.

### 2. Configurar la autenticación

Dentro del proyecto de Supabase:

1. Ingresar a **Authentication**.
2. Buscar **Sign In / Providers** o **Providers**, según la versión del panel.
3. Seleccionar **Email**.
4. Habilitar el registro de usuarios por correo electrónico.
5. Desactivar la opción **Confirm Email**.
6. Guardar los cambios.

De esta manera, los usuarios podrán registrarse utilizando un correo electrónico y una contraseña sin necesidad de verificar su dirección de correo.

**Importante:** desactivar la verificación de correo facilita las pruebas del proyecto, pero reduce la seguridad de las cuentas. Para un sistema de producción se recomienda habilitarla.

### 3. Crear la tabla de perfiles

Supabase Auth almacena automáticamente las cuentas de los usuarios en su sistema de autenticación.

Sin embargo, Savely necesita guardar el nombre o apodo elegido durante el registro para mostrarlo en la barra de navegación.

Para esto, se debe crear una tabla llamada `profiles`.

Dentro de Supabase:

1. Ingresar a **SQL Editor**.
2. Seleccionar **New query**.
3. Copiar y pegar el siguiente código SQL.
4. Presionar **Run** para ejecutarlo.

```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY
        REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL
        CHECK (char_length(trim(nickname)) BETWEEN 2 AND 30),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cada usuario lee su perfil"
ON public.profiles
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = id);

CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, nickname)
    VALUES (
        NEW.id,
        trim(NEW.raw_user_meta_data ->> 'nickname')
    );

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
```

**Este código debe ejecutarse una sola vez en cada proyecto nuevo de Supabase.**

Si la tabla, función o trigger ya existen, no es necesario volver a ejecutarlo.

### 4. ¿Qué hace el código SQL?

El código realiza las siguientes acciones:

- Crea la tabla `profiles` para almacenar los apodos de los usuarios.
- Relaciona cada perfil con su cuenta de Supabase Auth mediante un identificador único (UUID).
- Activa **Row Level Security (RLS)** para proteger los datos.
- Permite que cada usuario autenticado consulte únicamente su propio perfil.
- Crea un trigger que registra automáticamente el apodo cuando se crea una cuenta.
- Elimina el perfil automáticamente si se elimina su cuenta asociada.

La base de datos queda organizada de la siguiente manera:

**Sistema de autenticación: `auth.users`**

Administrado automáticamente por Supabase. Contiene la información necesaria para autenticar las cuentas.

**Tabla de perfiles: `public.profiles`**

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | Identificador único relacionado con el usuario. |
| `nickname` | TEXT | Nombre o apodo elegido durante el registro. |
| `created_at` | TIMESTAMPTZ | Fecha y hora de creación del perfil. |

Las contraseñas no se guardan manualmente en `profiles`. Su gestión está a cargo de Supabase Auth.

### 5. Obtener las credenciales de Supabase

Dentro del proyecto:

1. Ingresar a **Project Settings**.
2. Buscar el apartado **API Keys**, o abrir la sección **Connect** del proyecto.
3. Obtener los siguientes valores:

**Project URL**

```text
https://TU_PROYECTO.supabase.co
```

**Publishable Key**

```text
sb_publishable_TU_CLAVE
```

Estos valores se utilizarán en el frontend para conectar Savely con Supabase.

**Advertencia:** no utilizar la clave `service_role` ni las claves secretas de Supabase en el frontend. Únicamente debe utilizarse la clave pública (*publishable key*).

## 🔑 Configuración de variables de entorno

Savely utiliza dos archivos de configuración diferentes:

- **`.env`**, ubicado en la raíz del proyecto, para configurar el backend y la API de Precios Claros.
- **`frontend/.env`**, ubicado dentro de la carpeta del frontend, para configurar la conexión con Supabase.

Cada integrante debe completar estos archivos en su computadora.

### 1. Configurar las variables del backend

Desde la carpeta principal, ejecutar:

```bash
cp .env.example .env
```

Abrir el archivo `.env` y completar:

```dotenv
PORT=3000
PRECIOS_CLAROS_BASE_URL=https://d3e6htiiul5ek9.cloudfront.net/prod
PRECIOS_CLAROS_API_KEY=TU_API_KEY
TIMEOUT_MS=10000
```

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor Express. |
| `PRECIOS_CLAROS_BASE_URL` | URL base del servicio de Precios Claros. |
| `PRECIOS_CLAROS_API_KEY` | Clave utilizada para realizar consultas. |
| `TIMEOUT_MS` | Tiempo máximo de espera de una petición. |

### 2. ¿De dónde obtener la API Key de Precios Claros?

Savely utiliza el servicio de [Precios Claros](https://www.preciosclaros.gob.ar/) para consultar precios de productos en supermercados argentinos.

El backend realiza las consultas utilizando una clave enviada mediante el encabezado HTTP `X-Api-Key`.

Para identificar la clave utilizada por el sitio:

1. Ingresar a https://www.preciosclaros.gob.ar/.
2. Abrir las herramientas para desarrolladores del navegador utilizando `F12`.
3. Seleccionar la pestaña **Red (Network)**.
4. Realizar una búsqueda de productos desde el sitio.
5. Examinar las solicitudes realizadas al servicio de Precios Claros.
6. Buscar el encabezado `X-Api-Key` en **Request Headers**.
7. Si aparece una clave accesible y su utilización está permitida, colocarla en `PRECIOS_CLAROS_API_KEY`.

**Aclaración:** este procedimiento no representa un método oficial para generar claves personales. La disponibilidad y validez de la clave pueden cambiar y se deben respetar las condiciones de uso del servicio.

### 3. Configurar las variables del frontend

Dentro de la carpeta `frontend`, crear un archivo llamado `.env`.

También se puede copiar la plantilla si existe:

```bash
cp frontend/.env.example frontend/.env
```

Completar el archivo `frontend/.env` con:

```dotenv
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=TU_PUBLISHABLE_KEY
```

Reemplazar los valores de ejemplo con los obtenidos desde Supabase.

| Variable | Descripción |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto de Supabase. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave pública para conectar React con Supabase. |

El prefijo `VITE_` permite que Vite utilice estas variables desde el frontend.

**Importante:** las variables `VITE_` son visibles en el navegador después de compilar la aplicación. No se deben guardar contraseñas ni claves secretas en ellas.

### 4. Archivos .env.example

El repositorio debe incluir archivos de ejemplo para que cada integrante conozca qué variables necesita configurar.

**Archivo `.env.example` (raíz del proyecto):**

```dotenv
PORT=3000
PRECIOS_CLAROS_BASE_URL=https://d3e6htiiul5ek9.cloudfront.net/prod
PRECIOS_CLAROS_API_KEY=
TIMEOUT_MS=10000
```

**Archivo `frontend/.env.example`:**

```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Estos archivos deben subirse a GitHub y no deben contener credenciales privadas.

### 5. Seguridad de las variables de entorno

Los archivos `.env` no deben subirse al repositorio.

El archivo `.gitignore` debe incluir al menos:

```gitignore
.env
.env.*
!.env.example

node_modules/
**/node_modules/

dist/
**/dist/

*.log
```

De esta forma:

- Los archivos `.env` permanecerán en cada computadora.
- Los archivos `.env.example` se compartirán mediante GitHub.
- Las dependencias y archivos generados no se subirán al repositorio.

Si un archivo `.env` ya fue agregado a Git anteriormente, se debe dejar de rastrear mediante:

```bash
git rm --cached .env
```

Para el archivo del frontend:

```bash
git rm --cached frontend/.env
```

Esto no elimina los archivos locales, solamente deja de rastrearlos en Git.

Si alguna credencial privada fue publicada anteriormente, será necesario reemplazarla.

## ☁️ Configuración de variables en Render

Savely se encuentra alojado en Render, que ejecuta el backend Express y sirve el frontend compilado de React.

Para que la aplicación publicada funcione correctamente, es necesario configurar las variables de entorno del servidor.

### 1. Acceder al servicio

1. Ingresar a [Render Dashboard](https://dashboard.render.com/).
2. Seleccionar el Web Service de Savely.
3. Abrir la sección **Environment**.
4. Presionar **Add Environment Variable**.

### 2. Agregar las variables necesarias

Configurar los siguientes valores:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PRECIOS_CLAROS_BASE_URL` | `https://d3e6htiiul5ek9.cloudfront.net/prod` |
| `PRECIOS_CLAROS_API_KEY` | Clave de Precios Claros |
| `TIMEOUT_MS` | `10000` |
| `VITE_SUPABASE_URL` | URL del proyecto de Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave pública de Supabase |

No es necesario configurar manualmente `PORT` si Express utiliza el puerto proporcionado por Render mediante `process.env.PORT`.

### 3. Guardar y desplegar

Una vez completadas las variables:

1. Guardar los cambios.
2. Seleccionar **Save, rebuild, and deploy**.
3. Esperar a que Render compile y publique la nueva versión.

**Importante:** las variables que comienzan por `VITE_` deben estar disponibles durante la compilación del frontend. Por eso, cuando se modifican, es necesario realizar una nueva compilación.

### 4. Configurar las direcciones de autenticación en Supabase

En Supabase:

1. Ingresar a **Authentication → URL Configuration**.
2. Establecer **Site URL**:

```text
https://savely-hhlf.onrender.com
```

3. Agregar las siguientes direcciones en **Redirect URLs**, si se van a utilizar redirecciones de autenticación:

```text
https://savely-hhlf.onrender.com/**
http://localhost:5173/**
http://localhost:5174/**
```

Esto facilita el uso de flujos de autenticación basados en redirecciones, por ejemplo si posteriormente se habilita la recuperación de contraseñas o la confirmación del correo.

Para el inicio de sesión actual mediante email y contraseña, sin confirmación de correo, las redirecciones no son necesarias.

## 💻 Ejecución local

Para ejecutar Savely se necesitan dos terminales abiertas al mismo tiempo.

Antes de iniciar, comprobar que los archivos `.env` estén configurados correctamente.

### Terminal 1: Backend

Desde la carpeta principal del proyecto:

```bash
npm run dev
```

El backend estará disponible, por defecto, en:

http://localhost:3000

### Terminal 2: Frontend

Abrir otra terminal en la carpeta principal:

```bash
npm run dev:frontend
```

El frontend estará disponible en:

http://localhost:5173

Si ese puerto está ocupado, Vite seleccionará otro disponible, como `5174`.

**Importante:** ambas terminales deben permanecer abiertas mientras se utiliza la aplicación.

## 👤 Funcionamiento del sistema de cuentas

Savely permite utilizar el comparador de precios sin necesidad de registrarse.

Sin embargo, los usuarios también pueden crear una cuenta utilizando:

- Nombre o apodo.
- Correo electrónico.
- Contraseña.

### Registro de usuarios

1. El usuario ingresa a `/registro`.
2. Completa el formulario de registro.
3. React envía los datos a Supabase Auth.
4. Supabase crea la cuenta en `auth.users`.
5. Un trigger de PostgreSQL crea automáticamente el perfil en `public.profiles`.
6. Se inicia la sesión del usuario.
7. La NavBar muestra el mensaje **Hola, (apodo)**.

### Inicio de sesión

1. El usuario ingresa a `/login`.
2. Introduce su correo y contraseña.
3. Supabase Auth verifica las credenciales.
4. Si son correctas, se inicia la sesión.
5. React consulta el perfil correspondiente en la tabla `profiles`.
6. La barra de navegación muestra el apodo.

### Persistencia de sesión

Supabase permite mantener la sesión iniciada aunque se cierre y vuelva a abrir el navegador.

La sesión finaliza cuando el usuario utiliza la opción **Cerrar sesión**, cuando la sesión deja de ser válida o cuando se eliminan los datos locales de autenticación.

### Seguridad

- Las contraseñas son gestionadas por Supabase Auth.
- El frontend utiliza únicamente la clave pública de Supabase.
- La tabla `profiles` tiene activado Row Level Security.
- Cada usuario puede consultar únicamente su propio perfil.
- El frontend no necesita acceso directo a las credenciales administrativas de la base de datos.

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
│   │   ├── AuthPage.jsx
│   │   ├── main.jsx
│   │   ├── style.css
│   │   └── supabase.js
│   ├── .env
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

**Nota:** los archivos `.env` se muestran para explicar su ubicación, pero no deben estar incluidos en el repositorio de GitHub.

## 🛍️ Funcionalidades

Savely permite:

- Buscar productos mediante un buscador dinámico.
- Consultar precios provenientes de Precios Claros.
- Comparar precios entre distintas cadenas de supermercados.
- Ordenar los resultados de menor a mayor precio y viceversa.
- Filtrar resultados por supermercado.
- Identificar las opciones más económicas.
- Crear una lista de compras temporal.
- Registrarse mediante correo, contraseña y apodo.
- Iniciar y cerrar sesión.
- Mantener la sesión iniciada entre visitas.
- Mostrar un saludo personalizado en la barra de navegación.
- Utilizar el comparador sin necesidad de tener una cuenta.
- Acceder desde computadoras y dispositivos móviles.

Actualmente, la comparación contempla las cadenas Día, Coto, Carrefour, Jumbo y ChangoMás, según las sucursales configuradas en el backend.

### Almacenamiento de datos

Savely utiliza Supabase únicamente para almacenar y gestionar las cuentas de sus usuarios.

Se almacenan los datos necesarios para la autenticación y el apodo correspondiente a cada cuenta.

**No se almacenan:**

- Historiales de búsqueda.
- Precios consultados.
- Productos encontrados.
- Listas de compras.
- Información adicional sobre los hábitos de compra.

La lista de compras se mantiene temporalmente en memoria y desaparece al recargar la página.

### Limitaciones actuales

El backend consulta un conjunto predefinido de sucursales y devuelve un resultado por cadena.

Los productos encontrados pueden tener distintas marcas, cantidades o presentaciones, por lo que es importante comprobar que sean equivalentes antes de comparar sus precios.

Las imágenes de productos se representan mediante ilustraciones de reemplazo.

El sistema de cuentas es independiente del comparador de precios y actualmente no ofrece funcionalidades adicionales exclusivas para usuarios registrados.

## 👨‍💻 Integrantes del proyecto

**Curso:** 6.º 3.ª

Integrantes ordenados alfabéticamente por apellido:

1. **Esteche Gonzalo**
2. **Minguzzi Noah**
3. **Ponce Ignacio**
4. **Soria Tobias**
5. **Villalba Miguel**

---

**Savely — Proyecto desarrollado por estudiantes de 6.º 3.ª.**
