import React, { useEffect, useMemo, useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ArrowDownUp, ArrowRight, Check, CheckCircle2, ChevronDown, CircleHelp, Clock3, Heart, Menu, Package, Plus, Search, ShoppingBag, ShoppingCart, SlidersHorizontal, Sparkles, Trash2, TrendingDown, X, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from './supabase';

const CHAINS = [
  { id: 'Dia', display: 'Día', initials: 'D', color: '#ed233d', bg: '#ffecf0' },
  { id: 'Coto', display: 'Coto', initials: 'C', color: '#eb272b', bg: '#fff0f0' },
  { id: 'Carrefour', display: 'Carrefour', initials: 'C', color: '#1571cc', bg: '#eaf3ff' },
  { id: 'Jumbo', display: 'Jumbo', initials: 'J', color: '#2c9f59', bg: '#e8f8ee' },
  { id: 'Changomas', display: 'ChangoMás', initials: 'CM', color: '#f58325', bg: '#fff2e5' },
];
const PRICE = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 });
const money = value => Number.isFinite(value) ? PRICE.format(value) : '—';
const normalize = str => String(str ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const validPrice = row => row?.encontrado && Number.isFinite(Number(row.precio)) && Number(row.precio) > 0;

function Brand({ compact = false }) {
  return <div className="brand"><span className="brand-mark"><svg viewBox="0 0 36 36" fill="none" aria-hidden="true"><path d="M7 23.7L14.4 16.4L19.4 21.4L29 10.8" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /><path d="M22.6 10.7H29.2V17.3" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg></span>{!compact && <span className="brand-name">savely<span>.</span></span>}</div>;
}
function ChainMark({ chain }) { return <span className="chain-mark" style={{ color: chain.color, background: chain.bg }}>{chain.initials}</span> }
function Illustration({ small = false }) { return <div className={'product-visual ' + (small ? 'small' : '')}><ShoppingBag size={small ? 19 : 27} strokeWidth={1.7} /></div> }

export default function App() {
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [selected, setSelected] = useState(CHAINS.map(c => c.id));
  const [sort, setSort] = useState('asc');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [cart, setCart] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem('savely_cart') || '[]'
      );

      if (!Array.isArray(saved)) return [];

      return saved
        .filter(item =>
          item &&
          typeof item.key === 'string' &&
          typeof item.name === 'string' &&
          typeof item.chain === 'string' &&
          Number.isFinite(item.price) &&
          item.price > 0
        )
        .map(item => ({
          key: item.key,
          name: item.name,
          chain: item.chain,
          price: item.price,
          quantity: Number.isInteger(item.quantity)
            ? Math.max(1, Math.min(999, item.quantity))
            : 1,
        }));
    } catch {
      return [];
    }
  });

  const [cartOpen, setCartOpen] = useState(false);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [searched, setSearched] = useState(false);
  const abortRef = useRef(null);
  const searchRef = useRef(null);
  const requestVersion = useRef(0);
  useEffect(() => {
    try {
      localStorage.setItem('savely_cart', JSON.stringify(cart));
    } catch (error) {
      console.error('No se pudo guardar el carrito:', error);
    }
  }, [cart]);

  useEffect(() => {
    let active = true;

    async function updateUser(session) {
      if (!active) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setNickname(currentUser?.user_metadata?.nickname || '');

      if (!currentUser) {
        setAuthLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('id', currentUser.id)
        .single();

      if (!active) return;

      if (!error && data?.nickname) {
        setNickname(data.nickname);
      }

      setAuthLoading(false);
    }

    const { data: subscription } =
      supabase.auth.onAuthStateChange((_event, session) => {
        updateUser(session);
      });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert('No se pudo cerrar sesión. Intentá nuevamente.');
    }
  }


  useEffect(() => { const t = setTimeout(() => setDebounced(query.trim()), 550); return () => clearTimeout(t); }, [query]);
  useEffect(() => {
    const version = ++requestVersion.current;
    abortRef.current?.abort();
    if (debounced.length < 2) { setResult(null); setLoading(false); setError(''); setSearched(false); return; }
    const controller = new AbortController(); abortRef.current = controller;
    setLoading(true); setError(''); setSearched(true);
    fetch(`/buscar?producto=${encodeURIComponent(debounced)}`, { signal: controller.signal })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error || 'No pudimos completar la búsqueda.'); return data; })
      .then(data => { if (version === requestVersion.current) setResult(data); })
      .catch(err => { if (err.name !== 'AbortError' && version === requestVersion.current) { setResult(null); setError('No se pudo conectar con el buscador. Intentá de nuevo.'); } })
      .finally(() => { if (version === requestVersion.current) setLoading(false); });
    return () => controller.abort();
  }, [debounced]);

  const rows = useMemo(() => {
    const entries = Array.isArray(result?.resultados) ? result.resultados : [];
    return entries.filter(r => selected.includes(r.cadena))
      .filter(r => !onlyAvailable || validPrice(r))
      .sort((a, b) => {
        const ap = validPrice(a) ? Number(a.precio) : Infinity, bp = validPrice(b) ? Number(b.precio) : Infinity;
        if (!Number.isFinite(ap) && !Number.isFinite(bp)) return 0;
        if (!Number.isFinite(ap)) return 1; if (!Number.isFinite(bp)) return -1;
        return sort === 'asc' ? ap - bp : bp - ap;
      });
  }, [result, selected, sort, onlyAvailable]);
  const cheapest = useMemo(() => rows.filter(validPrice).reduce((min, r) => !min || Number(r.precio) < Number(min.precio) ? r : min, null), [rows]);
  const availableCount = rows.filter(validPrice).length;
  const toggle = id => setSelected(curr => curr.includes(id) ? curr.filter(c => c !== id) : [...curr, id]);
  const addToCart = row => {
    if (!validPrice(row)) return;

    const item = {
      key: `${row.cadena}-${row.ean || row.nombre}`,
      name: row.nombre || debounced,
      chain: row.cadena,
      price: Number(row.precio),
      quantity: 1,
    };

    setCart(prev =>
      prev.some(product => product.key === item.key)
        ? prev
        : [...prev, item]
    );
  };
  const updateQuantity = (key, change) => {
    setCart(prev =>
      prev.map(item => {
        if (item.key !== key) return item;

        return {
          ...item,
          quantity: Math.max(
            1,
            Math.min(999, item.quantity + change)
          ),
        };
      })
    );
  };

  const downloadTicket = async () => {
    if (cart.length === 0) return;

    // Verificar que el usuario esté autenticado en Supabase.
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      alert('Debés iniciar sesión para descargar el ticket.');
      window.location.href = '/login';
      return;
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const date = new Date();

    const dateText = date.toLocaleString('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    const formatPrice = value =>
      Number(value).toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    // Encabezado
    pdf.setFillColor(124, 58, 237);
    pdf.rect(0, 0, pageWidth, 40, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(26);
    pdf.setTextColor(255, 255, 255);
    pdf.text('savely.', 14, 24);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('LISTA DE COMPRAS', 195, 19, {
      align: 'right',
    });

    pdf.setTextColor(45, 35, 65);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Ticket de compra estimado', 14, 52);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(110, 105, 120);
    pdf.text(`Generado: ${dateText}`, 14, 60);

    // Productos
    const tableRows = cart.map((item, index) => {
      const chain = CHAINS.find(c => c.id === item.chain);

      return [
        String(index + 1),
        item.name,
        String(item.quantity),
        `$ ${formatPrice(item.price)}`,
        chain?.display || item.chain,
        `$ ${formatPrice(item.price * item.quantity)}`,
      ];
    });

    autoTable(pdf, {
      startY: 69,
      head: [[
        'Item',
        'Producto',
        'Cant.',
        'Precio unit.',
        'Supermercado',
        'Subtotal',
      ]],
      body: tableRows,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
        valign: 'middle',
      },
      headStyles: {
        fillColor: [124, 58, 237],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 11, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 14, halign: 'center' },
        3: { cellWidth: 29, halign: 'right' },
        4: { cellWidth: 30 },
        5: { cellWidth: 30, halign: 'right' },
      },
      margin: {
        left: 14,
        right: 14,
        bottom: 20,
      },
    });

    const total = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    let y = pdf.lastAutoTable.finalY + 15;

    // Si el total no entra en la página, crear otra.
    if (y > 265) {
      pdf.addPage();
      y = 25;
    }

    pdf.setDrawColor(220, 210, 240);
    pdf.line(14, y - 7, 196, y - 7);

    pdf.setTextColor(45, 35, 65);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('TOTAL APROXIMADO', 14, y);

    pdf.setTextColor(124, 58, 237);
    pdf.setFontSize(16);
    pdf.text(
      `$ ${formatPrice(total)}`,
      196,
      y,
      { align: 'right' }
    );

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(120, 115, 130);

    const note =
      'Los precios son orientativos y pueden variar ' +
      'segun el supermercado, la sucursal y la fecha. ' +
      'Este documento no es un comprobante fiscal.';

    const noteLines = pdf.splitTextToSize(note, 180);
    pdf.text(noteLines, 14, y + 12);

    // Numeración de páginas
    const pages = pdf.getNumberOfPages();

    for (let i = 1; i <= pages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 145, 160);

      pdf.text(
        `Savely - Pagina ${i} de ${pages}`,
        pageWidth / 2,
        288,
        { align: 'center' }
      );
    }

    pdf.save('Savely_Ticket.pdf');
  };

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const cartUnits = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );
  const showResult = searched && debounced.length >= 2;
  return <>

    <header className="header">
      <div className="container header-inner">
        <Brand />

        <nav className="nav-links">
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#buscar">Explorar precios</a>
        </nav>

        <div className="nav-actions">
          <button
            className="cart-button"
            onClick={() => setCartOpen(true)}
            aria-label={`Abrir lista de compras (${cart.length})`}
          >
            <ShoppingCart size={19} />
            <span>Mi lista</span>
            {cart.length > 0 && (
              <b className="cart-count">{cart.length}</b>
            )}
          </button>

          {!authLoading && (
            user ? (
              <div className="nav-account">
                <span className="nav-greeting">
                  Hola, {nickname || 'usuario'} 😃👍
                </span>

                <button
                  className="nav-logout"
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <div className="nav-account">
                <Link className="nav-login" to="/login">
                  Iniciar sesión
                </Link>

                <Link className="nav-register" to="/registro">
                  Registrarse
                </Link>
              </div>
            )
          )}
        </div>
      </div>
    </header>

    <main>
      <section className="hero container">
        <div className="hero-left">
          <div className="eyebrow">
            <Sparkles size={14} /> COMPRÁ INTELIGENTE, AHORRÁ MÁS</div>
          <h1>Los mejores precios,<br /><span>a un clic de distancia.</span></h1>
          <p>Compará precios de supermercados en un solo lugar y descubrí dónde te conviene comprar. Simple, rápido y sin vueltas.</p>
          <div className="hero-points"><span><CheckCircle2 size={17} /> Gratis y fácil</span><span><CheckCircle2 size={17} /> Precios de referencia</span><span><CheckCircle2 size={17} /> Sin registro</span></div></div><div className="hero-art" aria-hidden="true"><div className="art-orb orb-one" /><div className="art-orb orb-two" /><div className="hero-bag"><ShoppingBag size={81} strokeWidth={1.4} /><span className="bag-check"><Check size={22} /></span></div><div className="float-card saving"><span className="icon-bubble"><TrendingDown size={18} /></span><span><strong>Elegí mejor</strong><small>Compará al instante</small></span></div><div className="float-card stores"><span className="store-bubbles"><i>D</i><i>C</i><i>J</i></span><span><strong>5 supermercados</strong><small>En una sola búsqueda</small></span></div><span className="mini-star star-one">✦</span><span className="mini-star star-two">✳</span></div></section>
      <section className="search-zone" id="buscar"><div className="container"><div className="section-intro"><span className="section-kicker">ENCONTRÁ TU MEJOR PRECIO</span><h2>¿Qué necesitás comprar hoy?</h2><p>Escribí un producto y compará los precios disponibles.</p></div><div className="search-field" ref={searchRef}><Search className="search-leading" size={22} /><input aria-label="Buscar productos" value={query} onChange={e => setQuery(e.target.value)} placeholder="Ej. leche entera, arroz, aceite..." autoComplete="off" />{query && <button className="clear-button" aria-label="Limpiar búsqueda" onClick={() => setQuery('')}><X size={17} /></button>}<button className="search-action" onClick={() => { if (query.trim().length > 1) { setDebounced(query.trim()); searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) } else searchRef.current?.querySelector('input')?.focus() }}><Search size={18} /><span>Buscar precios</span></button></div><div className="suggestions"><span>Probá buscando:</span>{['Leche', 'Arroz', 'Aceite', 'Yerba mate'].map(term => <button key={term} onClick={() => { setQuery(term); setDebounced(term) }}>{term}<ArrowRight size={12} /></button>)}</div></div></section>
      <section className="results-zone container"><div className="results-heading"><div><span className="section-kicker">COMPARADOR DE PRECIOS</span><h2>Compará y elegí mejor <span className="heading-sparkle">✳</span></h2><p>Encontrá la opción que mejor se adapte a tu bolsillo.</p></div><button className="mobile-filter-button" onClick={() => setMobileFilters(v => !v)}><SlidersHorizontal size={17} /> Filtros <ChevronDown size={15} /></button></div><div className="results-grid"><aside className={'filters ' + (mobileFilters ? 'filters-open' : '')}><div className="filter-title"><span><SlidersHorizontal size={18} /> Filtros</span><button onClick={() => { setSelected(CHAINS.map(c => c.id)); setOnlyAvailable(false); setSort('asc') }}>Restablecer</button></div><div className="filter-section"><div className="filter-label">SUPERMERCADOS <span>{selected.length}/{CHAINS.length}</span></div><div className="chain-options">{CHAINS.map(chain => <label className="chain-option" key={chain.id}><input type="checkbox" checked={selected.includes(chain.id)} onChange={() => toggle(chain.id)} /><span className="custom-check"><Check size={12} /></span><ChainMark chain={chain} /><span>{chain.display}</span></label>)}</div></div><div className="filter-section availability"><div className="filter-label">DISPONIBILIDAD</div><label className="switch-row"><span>Solo con precio</span><input type="checkbox" checked={onlyAvailable} onChange={e => setOnlyAvailable(e.target.checked)} /><span className="switch" /></label></div><div className="filter-note"><CircleHelp size={17} /><span>Los precios provienen de la consulta al servicio Precios Claros y pueden variar por sucursal.</span></div></aside><div className="result-content"><div className="result-toolbar"><div className="result-count"><span className="pulse-dot" /><strong>{showResult && !loading && !error ? `${availableCount} ${availableCount === 1 ? 'precio disponible' : 'precios disponibles'}` : 'Resultados de búsqueda'}</strong></div><label className="sort-select">Ordenar por <select value={sort} onChange={e => setSort(e.target.value)}><option value="asc">Menor precio</option><option value="desc">Mayor precio</option></select><ArrowDownUp size={15} /></label></div>
        {loading ? <div className="state-card loading"><div className="spinner" /><h3>Buscando precios...</h3><p>Estamos consultando los supermercados disponibles.</p></div> :
          error ? <div className="state-card"><span className="state-icon error-icon"><X size={25} /></span><h3>Ups, hubo un problema</h3><p>{error}</p><button className="secondary-button" onClick={() => { setDebounced(''); setTimeout(() => setDebounced(query.trim()), 0) }}>Reintentar</button></div> :
            !showResult ? <div className="state-card"><span className="state-icon"><Search size={27} /></span><h3>Tu próxima compra inteligente empieza acá</h3><p>Buscá un producto para ver la comparación de precios entre los supermercados seleccionados.</p><span className="state-decoration">✦</span></div> :
              selected.length === 0 ? <div className="state-card"><span className="state-icon"><SlidersHorizontal size={26} /></span><h3>Elegí un supermercado</h3><p>Seleccioná al menos uno en los filtros para ver resultados.</p></div> :
                rows.length === 0 ? <div className="state-card"><span className="state-icon"><Package size={27} /></span><h3>Sin resultados para mostrar</h3><p>Probá desactivar el filtro de disponibilidad o buscar otro producto.</p></div> :
                  <><div className="table-wrap"><table className="price-table"><thead><tr><th>PRODUCTO</th><th>SUPERMERCADO</th><th className="price-th">PRECIO</th><th className="action-th">LISTA</th></tr></thead><tbody>{rows.map((row, index) => { const chain = CHAINS.find(c => c.id === row.cadena) || { id: row.cadena, display: row.cadena, initials: '?', color: '#777', bg: '#f5f5f5' }; const isBest = validPrice(row) && row === cheapest; const inCart = cart.some(c => c.key === `${row.cadena}-${row.ean || row.nombre}`); return <tr key={`${row.cadena}-${index}`} className={isBest ? 'best-row' : ''}><td><div className="item-cell"><Illustration small /><div><strong>{row.nombre || debounced}</strong><small>{row.encontrado ? [row.marca, row.presentacion].filter(Boolean).join(' · ') || 'Presentación no informada' : 'Sin coincidencias en la consulta'}</small>{isBest && <span className="best-tag"><TrendingDown size={12} /> Menor precio encontrado</span>}</div></div></td><td><div className="supermarket-cell"><ChainMark chain={chain} /><span>{chain.display}</span></div></td><td className="numeric-price">{validPrice(row) ? <strong>{money(Number(row.precio))}</strong> : <span className="unavailable">No disponible</span>}</td><td className="row-action"><button title={inCart ? 'Ya está en tu lista' : 'Agregar a la lista'} aria-label={inCart ? 'Ya está en tu lista' : `Agregar ${row.nombre} a mi lista`} disabled={!validPrice(row) || inCart} className={'add-button ' + (inCart ? 'added' : '')} onClick={() => addToCart(row)}>{inCart ? <Check size={17} /> : <Plus size={18} />}</button></td></tr> })}</tbody></table></div><p className="table-footnote"><CircleHelp size={14} /> Los productos pueden diferir en marca o presentación. Verificá antes de comparar precios directamente.</p></>}
      </div></div></section>
      <section className="how-section" id="como-funciona"><div className="container"><span className="section-kicker">ASÍ DE SIMPLE</span><h2>Ahorrar nunca fue tan fácil</h2><div className="steps"><div className="step"><span className="step-icon"><Search size={26} /></span><span className="step-num">01</span><h3>Buscá un producto</h3><p>Escribí el nombre de lo que necesitás comprar.</p></div><div className="step"><span className="step-icon"><ArrowDownUp size={26} /></span><span className="step-num">02</span><h3>Compará precios</h3><p>Revisá los precios disponibles en distintos supermercados.</p></div><div className="step"><span className="step-icon"><ShoppingCart size={26} /></span><span className="step-num">03</span><h3>Armá tu lista</h3><p>Elegí tus opciones y agregalas a una lista temporal.</p></div></div></div></section>
    </main><footer className="footer"><div className="container footer-main"><div><Brand /><p>Compará mejor. Comprá inteligente.</p></div><div><span>Hecho para simplificar tus compras <Heart size={15} fill="currentColor" /></span><small>Datos consultados mediante Precios Claros. Savely es un proyecto independiente.</small></div></div><div className="container footer-bottom">© {new Date().getFullYear()} Savely. Todos los derechos reservados. <span>Los precios mostrados son orientativos.</span></div></footer>

    {cartOpen && (
      <div
        className="drawer-overlay"
        onMouseDown={e => {
          if (e.target === e.currentTarget) {
            setCartOpen(false);
          }
        }}
      >
        <aside
          className="cart-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Mi lista de compras"
        >
          <div className="drawer-header">
            <div>
              <span className="section-kicker">
                TUS SELECCIONES
              </span>
              <h2>
                Mi lista <span>({cartUnits})</span>
              </h2>
            </div>

            <button
              className="icon-button"
              aria-label="Cerrar lista"
              onClick={() => setCartOpen(false)}
            >
              <X size={22} />
            </button>
          </div>

          <div className="drawer-body">
            {cart.length === 0 ? (
              <div className="cart-empty">
                <span className="state-icon">
                  <ShoppingCart size={28} />
                </span>

                <h3>Tu lista está vacía</h3>
                <p>
                  Agregá productos desde la tabla
                  de comparación.
                </p>
              </div>
            ) : (
              cart.map(item => {
                const chain = CHAINS.find(
                  c => c.id === item.chain
                );

                return (
                  <div className="cart-item" key={item.key}>
                    <Illustration small />

                    <div className="cart-item-info">
                      <strong>{item.name}</strong>

                      <small>
                        {chain?.display || item.chain}
                      </small>

                      <small>
                        Precio unitario: {money(item.price)}
                      </small>

                      <div className="cart-quantity">
                        <button
                          onClick={() =>
                            updateQuantity(item.key, -1)
                          }
                          disabled={item.quantity <= 1}
                          aria-label={`Disminuir cantidad de ${item.name}`}
                        >
                          −
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          onClick={() =>
                            updateQuantity(item.key, 1)
                          }
                          disabled={item.quantity >= 999}
                          aria-label={`Aumentar cantidad de ${item.name}`}
                        >
                          +
                        </button>
                      </div>

                      <b className="cart-subtotal">
                        Subtotal: {money(
                          item.price * item.quantity
                        )}
                      </b>
                    </div>

                    <button
                      className="icon-button"
                      onClick={() =>
                        setCart(prev =>
                          prev.filter(x => x.key !== item.key)
                        )
                      }
                      aria-label={`Quitar ${item.name}`}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="drawer-bottom">
            <div className="total-row">
              <span>Total aproximado</span>
              <strong>{money(cartTotal)}</strong>
            </div>

            <p>
              Los precios son orientativos y pueden variar
              según el supermercado y la sucursal.
              Tu lista se conserva en este navegador.
            </p>

            {cart.length > 0 && (
              <div className="cart-actions">
                <button
                  className="download-ticket"
                  onClick={downloadTicket}
                >
                  Descargar ticket PDF
                </button>

                <button
                  className="remove-all"
                  onClick={() => setCart([])}
                >
                  <Trash2 size={16} />
                  Vaciar carrito
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    )}

  </>;
}
