require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const buscarRouter = require('./routes/buscar');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// La compilación de React se sirve desde el mismo proceso de Express (Render).
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
} else {
  app.get('/', (_req, res) => res.json({ servicio: 'Savely', estado: 'activo' }));
}

app.use('/buscar', buscarRouter);

if (fs.existsSync(frontendDist)) {
  app.get('/{*splat}', (_req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
}

function iniciar() {
  return new Promise((resolve) => {
    const server = app.listen(PORT, () => {
      console.log(`Backend corriendo en http://localhost:${PORT}`);
      resolve(server);
    });
  });
}




if (require.main === module) {
  iniciar();
}

module.exports = { app, iniciar };
