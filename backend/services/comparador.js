const { CADENAS } = require('../config/cadenas');
const { buscarProductoEnCadena } = require('./preciosClaros');

async function compararPrecios(producto) {
  const busquedas = CADENAS.map(c =>
    buscarProductoEnCadena(producto, c.sucursales, c.nombre)
  );

  const resultados = await Promise.allSettled(busquedas);

  const resultadosFinales = resultados.map(r => {
    if (r.status === 'fulfilled') return r.value;
    return {
      cadena: '?',
      encontrado: false,
      motivo: `error interno: ${r.reason?.message || 'desconocido'}`,
    };
  });

  const encontrados = resultadosFinales.filter(r => r.encontrado);

  let masBarato = null;
  if (encontrados.length > 0) {
    masBarato = encontrados.reduce((min, r) => (r.precio < min.precio ? r : min), encontrados[0]);
  }

  return {
    producto_buscado: producto,
    resultados: resultadosFinales,
    mas_barato: masBarato
      ? { cadena: masBarato.cadena, precio: masBarato.precio }
      : null,
  };
}

module.exports = { compararPrecios };
