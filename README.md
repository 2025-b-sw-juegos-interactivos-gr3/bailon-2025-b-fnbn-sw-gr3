# bailon-2025-b-fnbn-sw-gr3
Bailon Ninahualpa Fredviner Nathanael fnbn
juegos interactivos

## Ejecutar escena BabylonJS localmente

Se ha agregado un pequeño "playground" local en la carpeta `babylonjs/` para poder probar el script sin depender del Playground online.

### Requisitos
* [Node.js](https://nodejs.org/) instalado (v14+ recomendado)

### Instalación y arranque rápido
Dentro de la carpeta raíz del proyecto (donde está `package.json`):

```powershell
npm install
npm start
```

Esto levantará un servidor local (http-server) y abrirá el navegador apuntando a la escena. Si no se abre automáticamente, visita: <http://127.0.0.1:8080>

### Alternativa sin instalar dependencias (usa npx)
Si no quieres ejecutar `npm install` puedes directamente:

```powershell
npx http-server ./babylonjs -o -c-1
```

### Estructura relevante
```
babylonjs/
	index.html   # HTML con canvas y carga de Babylon desde CDN
	main.js      # Código de la escena (tu script adaptado)
	playground.json (opcional / original)
```

### Modificar la escena
Edita `babylonjs/main.js` y guarda. Luego refresca el navegador para ver los cambios.

### Notas
* Se usan texturas alojadas en el CDN oficial del Playground.
* Si deseas usar texturas locales, colócalas en `babylonjs/` y reemplaza las URLs por rutas relativas (por ejemplo: `./mi-textura.png`).
* `http-server` se configura con `-c-1` para desactivar caché y facilitar ver cambios inmediatamente.

### Entorno Capibara
La escena ahora recrea un hábitat básico para un capibara:
* Terreno amplio con hierba repetida
* Área de agua semitransparente con leve oscilación
* Niebla ligera para sensación húmeda
* Luz hemisférica cálida + luz direccional (sol) con variaciones sutiles
* Roca, tronco caído y árbol reposicionados
* Capibara hecho de primitivas con animación de respiración
* Múltiples árboles generados procedimentalmente (función `createTree`) para poblar el entorno

Puedes ajustar parámetros buscando los comentarios dentro de `main.js` (buscar "Capibara" o "agua").

¡Feliz desarrollo en 3D! 🧊
