const axios = require('axios');

const BASE_URL = process.env.PRECIOS_CLAROS_BASE_URL || 'https://d3e6htiiul5ek9.cloudfront.net/prod';
const API_KEY = process.env.PRECIOS_CLAROS_API_KEY || 'zIgFou7Gta7g87VFGL9dZ4BEEs19gNYS1SOQZt96';
const TIMEOUT = parseInt(process.env.TIMEOUT_MS || '10000', 10);

const HEADERS = {
  'X-Api-Key': API_KEY,
  Referer: 'https://www.preciosclaros.gob.ar/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Accept: 'application/json, text/plain, */*',
};

async function buscarProductoEnCadena(producto, sucursales, cadena) {
  const sucursalesStr = sucursales.join(',');
  const url = `${BASE_URL}/productos?string=${encodeURIComponent(producto)}&array_sucursales=${sucursalesStr}&offset=0&limit=5&sort=-cant_sucursales_disponible`;

  try {
    const response = await axios.get(url, {
      headers: HEADERS,
      timeout: TIMEOUT,
    });

    const data = response.data;

    if (!data || (!data.productos || data.productos.length === 0) && (!data.agrupables || data.agrupables.length === 0)) {
      return { cadena, encontrado: false, motivo: 'sin resultados' };
    }

    const items = data.productos || [];
    if (items.length === 0) {
      return { cadena, encontrado: false, motivo: 'sin resultados' };
    }

    const primero = items[0];
    const precio = parseFloat(primero.precioMax) || 0;

    return {
      cadena,
      nombre: primero.nombre || '',
      marca: primero.marca || '',
      presentacion: primero.presentacion || '',
      precio,
      encontrado: true,
      ean: primero.id || '',
      fuente: 'Precios Claros API',
    };
  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      return { cadena, encontrado: false, motivo: 'timeout' };
    }
    return { cadena, encontrado: false, motivo: `error: ${err.message}` };
  }
}

module.exports = { buscarProductoEnCadena };
