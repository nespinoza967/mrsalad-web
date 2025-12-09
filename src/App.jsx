//VERSION 1.0 Por Nicolas Espinoza

import { useState, useEffect } from 'react';
import './App.css';

// --- CONSTANTES Y UTILIDADES ---

// Asegúrate de que la imagen esté en la carpeta 'public'
const LOGO_URL = '/mrsaladlogo.jpg'; 

// Formatear minutos decimales a HH:MM (Ej: 2.5 -> 02:30)
const formatDecimalTime = (decimalMinutes) => {
  if (!decimalMinutes || isNaN(decimalMinutes)) return "00:00";
  const mins = Math.floor(decimalMinutes);
  const secs = Math.round((decimalMinutes - mins) * 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Formatear segundos a MM:SS (Para el KDS)
const formatKDS = (segundos) => {
  if (segundos === undefined || segundos === null) return "--:--";
  const absSec = Math.abs(Math.floor(segundos));
  const mins = Math.floor(absSec / 60);
  const segs = absSec % 60;
  return `${mins.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
};

// Formatear moneda (Pesos Chilenos)
const formatMoney = (value) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
};

// Helper para parsear y formatear números sin símbolo de moneda
const safeNumber = (v) => {
    if (v === undefined || v === null) return 0;
    const s = String(v).replace(/[^0-9.,-]/g, '').replace(',', '.');
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
};

const formatNumber = (v) => {
    const n = safeNumber(v);
    try { return n.toLocaleString('es-CL'); } catch (e) { return String(n); }
};

// Componente de Notificación (Toast)
function Toast({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);
    
    const bgColor = type === 'error' ? '#d90429' : '#2a9d8f';
    return (
        <div style={{
            position: 'fixed', bottom: '20px', right: '20px', 
            backgroundColor: bgColor, color: 'white', 
            padding: '15px 25px', borderRadius: '8px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 9999,
            fontWeight: 'bold', animation: 'fadeIn 0.3s', fontSize: '1.1rem'
        }}>
            {message}
        </div>
    );
}

// ==================================================================
// 1. PANTALLA DE LOGIN
// ==================================================================
function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('https://mrsalad-api.onrender.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message);
        return;
      }
      // data contiene: { message, token, username, role, nombre, id }
      onLoginSuccess(data);
    } catch (err) {
      setError('No se pudo conectar al servidor. Revise que el backend esté corriendo.');
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <img src={LOGO_URL} alt="Mr. Salad Logo" className="login-logo" />
        <h2>Iniciar Sesión</h2>
        {error && <p className="login-error">{error}</p>}
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Usuario</label>
            <input 
              className="login-input" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="Ingrese su usuario"
            />
          </div>
          <div className="input-group">
            <label>Contraseña</label>
            <input 
              className="login-input" 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Ingrese su contraseña"
            />
          </div>
          <button type="submit" className="login-button">Acceder</button>
        </form>
      </div>
    </div>
  );
}


// ==================================================================
// 2. COMPONENTES DEL ADMINISTRADOR
// ==================================================================

// --- Admin: Reportes Financieros (ESTILO BOLETA) ---
function AdminReportes() {
    const [ventas, setVentas] = useState([]);
    const [gastos, setGastos] = useState([]);
    // Filtros de fecha
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Carga inicial de datos
    useEffect(() => {
        fetch('https://mrsalad-api.onrender.com/api/reportes/ventas').then(r => r.json()).then(setVentas).catch(console.error);
        fetch('https://mrsalad-api.onrender.com/api/gastos').then(r => r.json()).then(setGastos).catch(console.error);
    }, []);

    const handlePrintPDF = () => {
        window.print();
    };

    // Lógica de filtrado
    const filterByDate = (item) => {
        if (!startDate || !endDate) return true;
        const date = new Date(item.fecha);
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59); // Incluir todo el día final
        return date >= start && date <= end;
    };

    const filteredVentas = ventas.filter(filterByDate);
    const filteredGastos = gastos.filter(filterByDate);

    // Cálculos de Totales
    const totalVentas = filteredVentas.reduce((sum, v) => sum + Number(v.total_ventas), 0);
    const totalGastos = filteredGastos.reduce((sum, g) => sum + Number(g.monto), 0);
    const utilidad = totalVentas - totalGastos;

    return (
        <div className="admin-section report-container">
            <div className="report-header" style={{marginBottom: '30px'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <h2>Reporte Financiero Consolidado</h2>
                    <div className="no-print">
                        <button className="btn-primary" onClick={handlePrintPDF}>🖨️ Imprimir / PDF</button>
                    </div>
                </div>
                
                {/* Filtros (No se imprimen) */}
                <div className="no-print" style={{margin: '20px 0', padding: '15px', background: '#f0f0f0', borderRadius: '8px'}}>
                    <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                        <label>Desde:</label>
                        <input type="date" className="login-input" style={{width:'auto'}} value={startDate} onChange={e=>setStartDate(e.target.value)}/>
                        <label>Hasta:</label>
                        <input type="date" className="login-input" style={{width:'auto'}} value={endDate} onChange={e=>setEndDate(e.target.value)}/>
                        <button className="btn-small" onClick={()=>{setStartDate('');setEndDate('')}}>Limpiar</button>
                    </div>
                </div>

                <p style={{color: '#666'}}>
                    Fecha de emisión: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                    <br/>
                    Período: {startDate ? startDate : 'Histórico'} al {endDate ? endDate : 'Hoy'}
                </p>
                <hr />
            </div>

            {/* Contenedor con clase para impresión (CSS) */}
            <div className="report-sheet">
                
                {/* --- SECCIÓN 1: INGRESOS (VENTAS) --- */}
                <div className="report-section">
                    <h3 style={{color: '#2a9d8f', borderBottom: '2px solid #2a9d8f', paddingBottom: '5px'}}>1. Ingresos por Ventas</h3>
                    <table className="inventario-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th style={{textAlign: 'center'}}>Cantidad Pedidos</th>
                                <th style={{textAlign: 'right'}}>Total Venta</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVentas.length === 0 ? (
                                <tr><td colSpan="3" style={{textAlign:'center'}}>No hay registros de ventas en este período.</td></tr>
                            ) : (
                                filteredVentas.map((v, i) => (
                                    <tr key={i}>
                                        <td>{v.fecha}</td>
                                        <td style={{textAlign: 'center'}}>{v.cantidad_pedidos}</td>
                                        <td style={{textAlign: 'right'}}>{formatMoney(v.total_ventas)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot>
                            <tr style={{background: '#e6f8f6', fontWeight: 'bold'}}>
                                <td colSpan="2" style={{textAlign: 'right'}}>TOTAL INGRESOS:</td>
                                <td style={{textAlign: 'right', color: '#2a9d8f'}}>{formatMoney(totalVentas)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="dashed-line"></div>

                {/* --- SECCIÓN 2: EGRESOS (GASTOS) --- */}
                <div className="report-section" style={{marginTop: '40px'}}>
                    <h3 style={{color: '#e76f51', borderBottom: '2px solid #e76f51', paddingBottom: '5px'}}>2. Egresos (Gastos Operativos)</h3>
                    <table className="inventario-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Concepto</th>
                                <th>Documento</th>
                                <th style={{textAlign: 'right'}}>Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredGastos.length === 0 ? (
                                <tr><td colSpan="4" style={{textAlign:'center'}}>No hay gastos registrados en este período.</td></tr>
                            ) : (
                                filteredGastos.map((g, i) => (
                                    <tr key={i}>
                                        <td>{new Date(g.fecha).toLocaleDateString()}</td>
                                        <td>{g.descripcion}</td>
                                        <td>{g.tipo_documento} {g.numero_documento}</td>
                                        <td style={{textAlign: 'right'}}>{formatMoney(g.monto)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot>
                            <tr style={{background: '#fff5f5', fontWeight: 'bold'}}>
                                <td colSpan="3" style={{textAlign: 'right'}}>TOTAL EGRESOS:</td>
                                <td style={{textAlign: 'right', color: '#e76f51'}}>{formatMoney(totalGastos)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="double-line"></div>

                {/* --- RESUMEN FINAL --- */}
                <div style={{marginTop: '40px', background: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #eee', pageBreakInside: 'avoid'}}>
                    <h3 style={{marginTop: 0}}>Resumen Financiero</h3>
                    <div style={{display: 'flex', justifyContent: 'flex-end', flexDirection: 'column', alignItems: 'flex-end'}}>
                        <div style={{display: 'flex', width: '300px', justifyContent: 'space-between', marginBottom: '10px'}}>
                            <span>(+) Total Ventas:</span>
                            <strong>{formatMoney(totalVentas)}</strong>
                        </div>
                        <div style={{display: 'flex', width: '300px', justifyContent: 'space-between', marginBottom: '10px', color: '#e76f51'}}>
                            <span>(-) Total Gastos:</span>
                            <strong>{formatMoney(totalGastos)}</strong>
                        </div>
                        <div style={{width: '100%', borderTop: '2px solid #ccc', margin: '10px 0', maxWidth: '300px'}}></div>
                        <div style={{display: 'flex', width: '300px', justifyContent: 'space-between', fontSize: '1.5rem'}}>
                            <span>Utilidad Neta:</span>
                            <strong style={{color: utilidad >= 0 ? '#2a9d8f' : '#e76f51'}}>{formatMoney(utilidad)}</strong>
                        </div>
                    </div>
                </div>
                
                <div className="report-signature">
                    <p>__________________________</p>
                    <p>Firma Responsable</p>
                </div>
            </div>
        </div>
    )
}

// --- Admin: Gastos ---
function AdminGastos() {
    const [gastos, setGastos] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newGasto, setNewGasto] = useState({tipo:'Boleta', numero:'', monto:'', descripcion:''});

    const loadGastos = () => fetch('https://mrsalad-api.onrender.com/api/gastos').then(r=>r.json()).then(setGastos).catch(console.error);
    useEffect(() => { loadGastos(); }, []);

    const saveGasto = async () => {
        if(!newGasto.monto) return alert("Falta el monto");
        await fetch('http://localhost:3001/api/gastos', { 
            method: 'POST', headers:{'Content-Type':'application/json'}, 
            body: JSON.stringify(newGasto) 
        });
        setShowModal(false); 
        loadGastos();
        setNewGasto({tipo:'Boleta', numero:'', monto:'', descripcion:''});
    };

    return (
        <div className="admin-section">
            <div className="inventario-header">
                <h2>Registro de Gastos</h2>
                <button className="add-new-button" onClick={()=>setShowModal(true)}>+ Registrar Gasto</button>
            </div>
            <div style={{maxHeight:'400px', overflowY:'auto'}}>
                <table className="inventario-table">
                    <thead><tr><th>Fecha</th><th>Tipo</th><th>Doc #</th><th>Descripción</th><th>Monto</th></tr></thead>
                    <tbody>
                        {gastos.length === 0 ? <tr><td colSpan="5">No hay gastos registrados</td></tr> : 
                        gastos.map((g,i)=><tr key={i}><td>{new Date(g.fecha).toLocaleDateString()}</td><td>{g.tipo_documento}</td><td>{g.numero_documento}</td><td>{g.descripcion}</td><td>{formatMoney(g.monto)}</td></tr>)}
                    </tbody>
                </table>
            </div>
            {showModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h3>Nuevo Gasto</h3>
                        <div className="input-row">
                            <select className="login-input" value={newGasto.tipo} onChange={e=>setNewGasto({...newGasto, tipo:e.target.value})}>
                                <option>Boleta</option><option>Factura</option>
                            </select>
                            <input className="login-input" placeholder="N° Documento" value={newGasto.numero} onChange={e=>setNewGasto({...newGasto, numero:e.target.value})} />
                        </div>
                        <input className="login-input" type="number" placeholder="Monto Total ($)" value={newGasto.monto} onChange={e=>setNewGasto({...newGasto, monto:e.target.value})} />
                        <input className="login-input" placeholder="Descripción / Proveedor" value={newGasto.descripcion} onChange={e=>setNewGasto({...newGasto, descripcion:e.target.value})} />
                        <div className="modal-actions">
                            <button className="cancel-button" onClick={()=>setShowModal(false)}>Cancelar</button>
                            <button className="confirm-button" onClick={saveGasto}>Guardar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Admin: Productos (Con Receta) ---
function AdminProductos({ inventario }) {
  const [productos, setProductos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [prodActual, setProdActual] = useState({ id: null, nombre: '', precio: '', tiempo: '' });
  const [receta, setReceta] = useState([]); 
  const [ingSelect, setIngSelect] = useState('');
  const [cantSelect, setCantSelect] = useState('');

  const loadProductos = () => {
      fetch('https://mrsalad-api.onrender.com/api/productos').then(r => r.json()).then(setProductos).catch(console.error);
  };
  useEffect(() => { loadProductos(); }, []);

  const openModal = (p = null) => {
      if(p) {
          setProdActual({ id: p.id, nombre: p.nombre, precio: p.precio, tiempo: p.tiempo_preparacion_min });
          const ingredientesSeguros = Array.isArray(p.ingredientes) ? p.ingredientes : [];
          setReceta(ingredientesSeguros.map(i => ({ id: i.id, nombre: i.nombre, cantidad: i.cantidad, unidad: i.unidad })));
      } else {
          setProdActual({ id: null, nombre: '', precio: '', tiempo: '' });
          setReceta([]);
      }
      setShowModal(true);
  };

  const addIngrediente = () => {
      const ing = inventario.find(i => i.id === parseInt(ingSelect));
      if (!ing) return alert("Seleccione ingrediente");
      setReceta([...receta, { id: ing.id, nombre: ing.nombre, cantidad: parseFloat(cantSelect), unidad: ing.unidad }]);
      setIngSelect(''); setCantSelect('');
  };
  
  const removeIngredienteReceta = (idx) => setReceta(receta.filter((_, i) => i !== idx));

  const handleSave = async () => {
      if (!prodActual.nombre || !prodActual.precio) return alert("Faltan datos");
      const method = prodActual.id ? 'PUT' : 'POST';
      const url = prodActual.id ? `https://mrsalad-api.onrender.com/api/productos/${prodActual.id}` : 'http://localhost:3001/api/productos';
      try {
          const res = await fetch(url, {
              method: method, headers: {'Content-Type':'application/json'},
              body: JSON.stringify({ ...prodActual, receta })
          });
          if (res.ok) {
              alert(prodActual.id ? "Actualizado" : "Creado");
              setShowModal(false); loadProductos();
          } else alert("Error al guardar");
      } catch (e) { console.error(e); }
  };
  
  const toggleEstado = async (p) => {
      await fetch(`https://mrsalad-api.onrender.com/api/productos/${p.id}/estado`, {
          method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ activo: !p.activo_pos })
      });
      loadProductos();
  };
  
  const handleDelete = async (id) => {
      if(!confirm("¿Eliminar permanentemente este producto?")) return;
      await fetch(`https://mrsalad-api.onrender.com/api/productos/${id}`, { method: 'DELETE' });
      loadProductos();
  };

  return (
      <div className="admin-section">
          <div className="inventario-header"><h2>Productos ({productos.length})</h2><button className="add-new-button" onClick={()=>openModal()}>+ Nuevo Producto</button></div>
          <div style={{overflowX:'auto', maxHeight: '500px'}}>
              <table className="inventario-table">
                  <thead><tr><th>Nombre</th><th>Precio</th><th>Receta (Ingredientes)</th><th>Estado</th><th>Acciones</th></tr></thead>
                  <tbody>
                      {productos.map(p => (
                          <tr key={p.id} style={{opacity: p.activo_pos ? 1 : 0.6}}>
                              <td>{p.nombre}</td><td>{formatMoney(p.precio)}</td>
                              <td><small>{Array.isArray(p.ingredientes) ? p.ingredientes.map(i=>`${i.nombre} (${i.cantidad} ${i.unidad})`).join(', ') : 'Sin receta'}</small></td>
                              <td><button onClick={() => toggleEstado(p)} className="btn-small" style={{background: p.activo_pos ? '#e6f8f6' : '#ccc', color: p.activo_pos ? '#2a9d8f' : '#555'}}>{p.activo_pos ? 'ACTIVO' : 'OCULTO'}</button></td>
                              <td className="action-cell">
                                  <button className="btn-small" onClick={() => openModal(p)}>Editar</button>
                                  <button className="btn-small" style={{background:'#fbecec', color:'red'}} onClick={() => handleDelete(p.id)}>X</button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
          {showModal && (
              <div className="modal-backdrop">
                  <div className="modal-content" style={{maxWidth:'600px', maxHeight:'90vh', overflowY:'auto'}}>
                      <h3>{prodActual.id?'Editar':'Nuevo'} Producto</h3>
                      <input className="login-input" placeholder="Nombre" value={prodActual.nombre} onChange={e=>setProdActual({...prodActual, nombre:e.target.value})} />
                      <div className="input-row">
                          <input className="login-input" type="number" placeholder="Precio ($)" value={prodActual.precio} onChange={e=>setProdActual({...prodActual, precio:e.target.value})} />
                          <input className="login-input" type="number" placeholder="Tiempo Prep (min)" value={prodActual.tiempo} onChange={e=>setProdActual({...prodActual, tiempo:e.target.value})} />
                      </div>
                      <hr style={{margin:'15px 0', borderTop:'1px solid #eee'}}/>
                      <h4>Armar Receta</h4>
                      <div className="input-row" style={{alignItems:'center'}}>
                          <select className="login-input" value={ingSelect} onChange={e=>setIngSelect(e.target.value)} style={{flex:2}}>
                              <option value="">Seleccionar Ingrediente...</option>
                              {inventario.map(i => <option key={i.id} value={i.id}>{i.nombre} ({i.unidad})</option>)}
                          </select>
                          <input className="login-input" style={{width:'80px'}} type="number" placeholder="Cant." value={cantSelect} onChange={e=>setCantSelect(e.target.value)} />
                          <button className="btn-primary" style={{padding:'10px 15px'}} onClick={addIngrediente}>+</button>
                      </div>
                      <ul style={{margin:'10px 0', background:'#f9f9f9', padding:'10px', borderRadius:'5px', maxHeight:'150px', overflowY:'auto'}}>
                          {receta.map((r,i)=><li key={i} style={{display:'flex', justifyContent:'space-between'}}><span>{r.nombre}: {r.cantidad} {r.unidad}</span><button onClick={()=>removeIngredienteReceta(i)} style={{color:'red', border:'none', cursor:'pointer'}}>x</button></li>)}
                      </ul>
                      <div className="modal-actions">
                          <button className="cancel-button" onClick={()=>setShowModal(false)}>Cancelar</button>
                          <button className="confirm-button" onClick={handleSave}>Guardar</button>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );
}

// --- Admin: Caja (CON COLUMNAS AGREGADAS) ---
function AdminCaja({ currentUser }) {
    const [caja, setCaja] = useState(null);
    const [historial, setHistorial] = useState([]);
    const [showDetalle, setShowDetalle] = useState(false);
    const [detalleCaja, setDetalleCaja] = useState(null);
    const [showAbrir, setShowAbrir] = useState(false);
    const [montoApertura, setMontoApertura] = useState('');
    const [usuarios, setUsuarios] = useState([]);
    const [cocinerosSelect, setCocinerosSelect] = useState([]);

    const loadData = () => {
        fetch('https://mrsalad-api.onrender.com/api/caja/estado').then(r=>r.json()).then(setCaja).catch(()=>setCaja(null));
        fetch('https://mrsalad-api.onrender.com/api/caja/historial').then(r=>r.json()).then(setHistorial).catch(console.error);
    };
    
    useEffect(() => { 
        loadData(); 
        fetch('https://mrsalad-api.onrender.com/api/usuarios').then(r=>r.json()).then(setUsuarios); 
    }, []);

    const handleAbrir = async () => {
        await fetch('https://mrsalad-api.onrender.com/api/caja/abrir', {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ usuario_id: currentUser.id, monto_apertura: montoApertura, cocineros_ids: cocinerosSelect })
        });
        setShowAbrir(false); loadData();
    };
    const handleCerrar = async () => {
        const montoCierre = prompt("Ingrese monto total efectivo en caja:");
        if(!montoCierre) return;
        await fetch('https://mrsalad-api.onrender.com/api/caja/cerrar', {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ caja_id: caja.id, monto_cierre_real: montoCierre })
        });
        loadData(); alert("Caja Cerrada");
    };

    const openDetalleCaja = async (id) => {
        try {
            const res = await fetch(`https://mrsalad-api.onrender.com/api/caja/${id}/detalle`);
            if (!res.ok) throw new Error('No encontrado');
            const data = await res.json();
            setDetalleCaja(data);
            setShowDetalle(true);
        } catch (e) { alert('No se pudo cargar detalle de la caja'); console.error(e); }
    };

    return (
        <div className="admin-section">
            <h2>Gestión de Caja</h2>
            <div className="caja-container">
                <div className="caja-main">
                    <div style={{padding:'20px', background:caja?'#e6f8f6':'#fff5f5', borderRadius:'8px', border:'1px solid #ddd'}}>
                        <h3>Estado: {caja ? '🟢 ABIERTA' : '🔴 CERRADA'}</h3>
                        {caja ? (
                            <div>
                                <p><strong>Apertura:</strong> {formatMoney(caja.monto_apertura)}</p>
                                <p><strong>Ventas:</strong> {formatMoney(caja.monto_ventas_sistema)}</p>
                                <p><strong>Total Esperado:</strong> {formatMoney(Number(caja.monto_apertura)+Number(caja.monto_ventas_sistema))}</p>
                                <button className="btn-small" style={{background:'#d90429', color:'white', width:'100%', marginTop:'10px'}} onClick={handleCerrar}>CERRAR TURNO</button>
                            </div>
                        ) : <button className="confirm-button" onClick={()=>setShowAbrir(true)}>ABRIR TURNO</button>}
                    </div>
                </div>
                <aside className="caja-side">
                    <h3>Historial</h3>
                    <div style={{maxHeight:'300px', overflowY:'auto'}}>
                        <table className="caja-table">
                            <thead><tr><th>Fecha</th><th>Tienda</th><th>Estado</th><th>Ventas</th><th>Cajero</th><th>Cocina</th></tr></thead>
                                    <tbody>
                                        {historial.map(h => (
                                            <tr key={h.id} onClick={() => openDetalleCaja(h.id)} style={{cursor:'pointer'}} className={h.estado==='abierta'?'caja-row-abierta':'caja-row-cerrada'}>
                                                <td>{new Date(h.fecha_apertura).toLocaleDateString()} {new Date(h.fecha_apertura).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}<br/>
                                                    {h.fecha_cierre ? new Date(h.fecha_cierre).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : '...'}
                                                </td>
                                                <td>Sucursal Central</td>
                                                <td><span className={`caja-badge ${h.estado}`}>{h.estado.toUpperCase()}</span></td>
                                                <td>{formatMoney(h.monto_ventas_sistema)}</td>
                                                <td>{h.cajero_nombre}</td>
                                                <td><small>{h.cocineros_nombres || '-'}</small></td>
                                            </tr>
                                        ))}
                                    </tbody>
                        </table>
                    </div>
                </aside>

                        {/* Detalle modal */}
                        {showDetalle && detalleCaja && (
                            <div className="modal-backdrop">
                                <div className="modal-content" style={{maxWidth:'800px', maxHeight:'80vh', overflowY:'auto'}}>
                                    <h3>Detalle Turno - Caja #{detalleCaja.caja.id}</h3>
                                    <p><strong>Apertura:</strong> {formatMoney(detalleCaja.caja.monto_apertura)} • <strong>Cajero:</strong> {detalleCaja.caja.cajero_nombre}</p>
                                    <p><strong>Cocineros:</strong> {detalleCaja.caja.cocineros_nombres || '-'}</p>
                                    <p><strong>Ventas registradas:</strong> {detalleCaja.ventas.length} • <strong>Total sistema:</strong> {formatMoney(detalleCaja.caja.monto_ventas_sistema)}</p>
                                    <hr/>
                                    <h4>Ventas</h4>
                                    {detalleCaja.ventas.length === 0 ? <p>No hay ventas en este turno.</p> : (
                                        <table className="inventario-table">
                                            <thead><tr><th>Fecha</th><th>Método</th><th style={{textAlign:'right'}}>Total</th></tr></thead>
                                            <tbody>
                                                {detalleCaja.ventas.map((v,i) => (
                                                    <tr key={i}><td>{new Date(v.created_at || v.fecha_venta || Date.now()).toLocaleString()}</td><td>{v.metodo_pago}</td><td style={{textAlign:'right'}}>{formatMoney(v.total)}</td></tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}

                                    <h4 style={{marginTop:'15px'}}>Gastos</h4>
                                    {detalleCaja.gastos.length === 0 ? <p>No hay gastos en este turno.</p> : (
                                        <table className="inventario-table">
                                            <thead><tr><th>Fecha</th><th>Tipo</th><th style={{textAlign:'right'}}>Monto</th><th>Descripción</th></tr></thead>
                                            <tbody>
                                                {detalleCaja.gastos.map((g,i) => (
                                                    <tr key={i}><td>{new Date(g.fecha).toLocaleString()}</td><td>{g.tipo_documento}</td><td style={{textAlign:'right'}}>{formatMoney(g.monto)}</td><td>{g.descripcion}</td></tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}

                                    <div className="modal-actions"><button className="cancel-button" onClick={()=>{setShowDetalle(false); setDetalleCaja(null);}}>Cerrar</button></div>
                                </div>
                            </div>
                        )}
            </div>
            {showAbrir && (
                <div className="modal-backdrop"><div className="modal-content">
                    <h3>Abrir Turno</h3>
                    <input className="login-input" type="number" placeholder="Monto Inicial" onChange={e=>setMontoApertura(e.target.value)}/>
                    <h4>Asistencia Cocina</h4>
                    <div style={{maxHeight:'150px',overflowY:'auto', border:'1px solid #eee', padding:'5px'}}>
                        {usuarios.filter(u=>u.role==='cocinero').map(c=><div key={c.id} style={{padding:'5px'}}><input type="checkbox" onChange={e=>{if(e.target.checked) setCocinerosSelect([...cocinerosSelect,c.id]); else setCocinerosSelect(cocinerosSelect.filter(id=>id!==c.id))}}/> {c.nombre_completo}</div>)}
                        {usuarios.filter(u=>u.role==='cocinero').length === 0 && <p style={{color:'#999'}}>No hay cocineros registrados.</p>}
                    </div>
                    <div className="modal-actions"><button className="cancel-button" onClick={()=>setShowAbrir(false)}>Cancelar</button><button className="confirm-button" onClick={handleAbrir}>Abrir</button></div>
                </div></div>
            )}
        </div>
    );
}

// --- Admin: Usuarios ---
function AdminUsuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [nuevoUser, setNuevoUser] = useState({ role: 'cajero', nombre_completo: '', username: '', password: '', rut: '', telefono: '', contacto_emergencia: '' });

    const loadUsers = () => fetch('https://mrsalad-api.onrender.com/api/usuarios').then(r=>r.json()).then(setUsuarios);
    useEffect(() => { loadUsers(); }, []);

    const handleSave = async () => {
        if(!nuevoUser.nombre_completo || !nuevoUser.rut) return alert("Faltan datos obligatorios");
        await fetch('https://mrsalad-api.onrender.com/api/usuarios', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(nuevoUser) });
        setShowModal(false); loadUsers(); 
        setNuevoUser({ role: 'cajero', nombre_completo: '', username: '', password: '', rut: '', telefono: '', contacto_emergencia: '' });
    };

    const handleDelete = async (id) => { 
        if(confirm("¿Eliminar usuario?")) { 
            await fetch(`api/usuarios/${id}`, {method:'DELETE'}); 
            loadUsers(); 
        }
    };

    return (
        <div className="admin-section">
            <div className="inventario-header"><h2>Usuarios</h2><button className="add-new-button" onClick={()=>setShowModal(true)}>+ Usuario</button></div>
            <div style={{maxHeight:'400px', overflowY:'auto'}}>
                <table className="inventario-table">
                    <thead><tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>RUT</th><th>Acciones</th></tr></thead>
                    <tbody>
                        {usuarios.map(u => (
                            <tr key={u.id}>
                                <td>{u.nombre_completo}</td>
                                <td>{u.username || '-'}</td>
                                <td>{u.role}</td>
                                <td>{u.rut}</td>
                                <td><button className="btn-small" style={{color:'red'}} onClick={()=>handleDelete(u.id)}>X</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {showModal && (
                <div className="modal-backdrop">
                    <div className="modal-content" style={{maxWidth:'500px', maxHeight:'90vh', overflowY:'auto'}}>
                        <h3>Nuevo Usuario</h3>
                        <div className="input-group">
                            <label>Rol</label>
                            <select className="login-input" value={nuevoUser.role} onChange={e=>setNuevoUser({...nuevoUser, role:e.target.value})}>
                                <option value="cajero">Cajero (Acceso a POS)</option>
                                <option value="cocinero">Cocinero (Asistencia)</option>
                                <option value="admin">Administrador (Acceso Total)</option>
                            </select>
                        </div>
                        <div className="input-group"><label>Nombre Completo</label><input className="login-input" value={nuevoUser.nombre_completo} onChange={e=>setNuevoUser({...nuevoUser, nombre_completo:e.target.value})} /></div>
                        <div className="input-row">
                            <div className="input-group"><label>RUT</label><input className="login-input" value={nuevoUser.rut} onChange={e=>setNuevoUser({...nuevoUser, rut:e.target.value})} /></div>
                            <div className="input-group"><label>Teléfono</label><input className="login-input" value={nuevoUser.telefono} onChange={e=>setNuevoUser({...nuevoUser, telefono:e.target.value})} /></div>
                        </div>
                        <div className="input-group"><label>Contacto Emergencia</label><input className="login-input" value={nuevoUser.contacto_emergencia} onChange={e=>setNuevoUser({...nuevoUser, contacto_emergencia:e.target.value})} /></div>
                        {nuevoUser.role !== 'cocinero' && (
                            <>
                                <hr style={{margin:'10px 0'}}/>
                                <div className="input-row">
                                    <div className="input-group"><label>Usuario</label><input className="login-input" value={nuevoUser.username} onChange={e=>setNuevoUser({...nuevoUser, username:e.target.value})} /></div>
                                    <div className="input-group"><label>Contraseña</label><input className="login-input" type="password" value={nuevoUser.password} onChange={e=>setNuevoUser({...nuevoUser, password:e.target.value})} /></div>
                                </div>
                            </>
                        )}
                        <div className="modal-actions">
                            <button className="cancel-button" onClick={()=>setShowModal(false)}>Cancelar</button>
                            <button className="confirm-button" onClick={handleSave}>Guardar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function AdminPanelContent({ inventario, currentUser }) {
  const [activeTab, setActiveTab] = useState(currentUser.role === 'cajero' ? 'caja' : 'reportes');
  const renderContent = () => {
      switch(activeTab) {
          case 'reportes': return <AdminReportes />;
          case 'productos': return <AdminProductos inventario={inventario} />;
          case 'caja': return <AdminCaja currentUser={currentUser} />;
          case 'gastos': return <AdminGastos />;
          case 'usuarios': return <AdminUsuarios />;
          default: return null;
      }
  };
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header"><h3>{currentUser.role === 'admin' ? 'Panel Admin' : 'Gestión Caja'}</h3></div>
        <ul className="admin-menu">
          {/* Menú adaptativo por rol */}
          {(currentUser.role === 'admin' || currentUser.role === 'cajero') && (
              <>
                <li className={activeTab==='caja'?'active':''} onClick={()=>setActiveTab('caja')}>💰 Caja</li>
                <li className={activeTab==='reportes'?'active':''} onClick={()=>setActiveTab('reportes')}>📊 Reportes</li>
                <li className={activeTab==='gastos'?'active':''} onClick={()=>setActiveTab('gastos')}>🧾 Gastos</li>
              </>
          )}
          {currentUser.role === 'admin' && (
              <>
                <li className={activeTab==='productos'?'active':''} onClick={()=>setActiveTab('productos')}>🍔 Productos</li>
                <li className={activeTab==='usuarios'?'active':''} onClick={()=>setActiveTab('usuarios')}>👥 Usuarios</li>
              </>
          )}
        </ul>
      </aside>
      <section className="admin-main-content">{renderContent()}</section>
    </div>
  );
}

// ==================================================================
// 3. DASHBOARD (Ventas Reales y Stock)
// ==================================================================
function DashboardContent({ inventario, favorites = [] }) {
  const [ventas, setVentas] = useState(0);
    const [topWeek, setTopWeek] = useState([]);
  
  // Polling para actualizar las ventas cada 3 segundos
  useEffect(() => {
      const fetchVentas = () => {
        fetch('https://mrsalad-api.onrender.com/api/caja/estado')
            .then(r=>r.json())
            .then(data => { if(data) setVentas(data.monto_ventas_sistema); })
            .catch(()=>setVentas(0));
      };
      fetchVentas();
      const interval = setInterval(fetchVentas, 3000);
      return () => clearInterval(interval);
  }, []);

    // Cargar top productos semana
    useEffect(() => {
            fetch('https://mrsalad-api.onrender.com/api/reportes/top-productos-semana').then(r => r.json()).then(setTopWeek).catch(console.error);
    }, []);

  const safeInv = Array.isArray(inventario) ? inventario : [];
    const favObjs = Array.isArray(favorites) ? favorites : [];
    // Convierte valores a número de forma segura (maneja strings con comas, símbolos, etc.)
    const toNumber = (v) => {
        if (v === undefined || v === null) return 0;
        const s = String(v).replace(/[^0-9.,-]/g, '').replace(',', '.');
        const n = parseFloat(s);
        return isNaN(n) ? 0 : n;
    };

    const stockCritico = safeInv.filter(item => toNumber(item.stock_actual) <= toNumber(item.stock_minimo));
  
  return (
    <main className="dashboard-content">
      <div className="widget sales-graph">
          <h2>Ventas Turno Actual</h2>
          <div style={{fontSize:'3rem', textAlign:'center', color:'#2a9d8f', fontWeight:'bold'}}>{formatMoney(ventas)}</div>
          <p style={{textAlign:'center', color:'#888'}}>Se actualiza automáticamente</p>
      </div>
      <div className="widget stock-table">
        <h2>Alertas Stock ({stockCritico.length})</h2>
        <table><thead><tr><th>Producto</th><th>Stock</th></tr></thead><tbody>
                    {stockCritico.map(item => (
                        <tr key={item.id} className="critical-row">
                            <td>{item.nombre}</td>
                            <td>{formatNumber(item.stock_actual)} {item.unidad}</td>
                        </tr>
                    ))}
        </tbody></table>
      </div>
      {/* Favoritos: mostrar semicirculos con porcentaje */}
      <div className="widget favorites-row">
          <div className="favorites-widget">
              <h2>Ingredientes Favoritos</h2>
              <div className="favorites-grid">
                  {favObjs.length === 0 && <div style={{color:'#666'}}>No hay favoritos marcados.</div>}
                  {favObjs.map(f => {
                      const item = safeInv.find(x => x.id === f.id);
                      if(!item) return null;
                      const actual = toNumber(item.stock_actual);
                      const baseline = (f && f.baseline) ? Number(f.baseline) : (toNumber(item.stock_minimo) || 1);
                      let pct = baseline > 0 ? (actual / baseline) * 100 : 0;
                      if (pct < 0) pct = 0;
                      // cap display at 100% as requested
                      const displayPct = Math.min(100, Math.round(pct));
                      return (
                          <div key={f.id} className="fav-item">
                              <div className="semi-wrap" style={{"--p": `${displayPct}%`}}>
                                  <div className="circle" style={{"--p": `${displayPct}%`}} />
                              </div>
                              <div className="fav-label"><strong>{item.nombre}</strong><br/><small>{Math.round(pct)}%</small></div>
                          </div>
                      )
                  })}
              </div>
          </div>

          <div className="top-products-widget">
              <h2>Top vendidos (Semana)</h2>
              <div className="top-products-list">
                  {topWeek.length === 0 ? <div style={{color:'#666'}}>No hay datos de esta semana.</div> : (
                      <ol>
                        {topWeek.map((p,i) => <li key={i}><strong>{p.nombre}</strong> — {p.cantidad_vendida}</li>)}
                      </ol>
                  )}
              </div>
          </div>
      </div>
    </main>
  );
}

// ==================================================================
// 4. INVENTARIO (CRUD COMPLETO)
// ==================================================================
// --- INVENTARIO (FIX: Comparación de Stock Segura) ---
function InventarioContent({ inventario, setInventario, favorites = [], onToggleFavorite = () => {} }) {
  const [showModal, setShowModal] = useState(false);
  const [itemActual, setItemActual] = useState(null);
  
  const handleAddNew = () => { setItemActual({ nombre: '', stock_actual: 0, stock_minimo: 10, unidad: 'kg' }); setShowModal(true); };
  const handleEdit = (item) => { setItemActual(item); setShowModal(true); };

  const handleSave = async () => {
      const method = itemActual.id ? 'PUT' : 'POST';
      const url = itemActual.id ? `https://mrsalad-api.onrender.com/api/inventario/${itemActual.id}` : 'http://localhost:3001/api/inventario';
      const payload = { nombre: itemActual.nombre, stockActual: parseFloat(itemActual.stock_actual), stockMinimo: parseFloat(itemActual.stock_minimo), unidad: itemActual.unidad };
      try {
          const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          if(res.ok) {
             const newData = await (await fetch('http://localhost:3001/api/inventario')).json();
             setInventario(newData); setShowModal(false);
          }
      } catch (e) { alert("Error"); }
  };

  const handleDelete = async (id) => {
      if(prompt("Clave Admin:") !== "1231") return alert("Clave incorrecta");
      await fetch(`http://localhost:3001/api/inventario/${id}`, { method: 'DELETE' });
      setInventario(inventario.filter(i => i.id !== id));
  };

  // Función auxiliar para verificar stock de forma segura
  const esCritico = (actual, minimo) => {
      const a = parseFloat(actual);
      const m = parseFloat(minimo);
      if(isNaN(a) || isNaN(m)) return false;
      return a <= m;
  };

  const safeInv = Array.isArray(inventario) ? inventario : [];

  return (
      <main className="inventario-container">
          <div className="inventario-header"><h2>Inventario ({safeInv.length})</h2><button className="add-new-button" onClick={handleAddNew}>+ Nuevo</button></div>
          <table className="inventario-table"><thead><tr><th>★</th><th>Nombre</th><th>Stock</th><th>Mín</th><th>Uni</th><th>Acciones</th></tr></thead><tbody>
              {safeInv.map(i => {
                  const isFav = favorites.includes(i.id);
                  return (
                  <tr key={i.id} className={esCritico(i.stock_actual, i.stock_minimo) ? 'critical-row' : ''}>
                      <td style={{width: '40px', textAlign: 'center'}}>
                        <button className={`fav-star ${isFav ? 'fav' : ''}`} onClick={() => onToggleFavorite(i.id)} title={isFav ? 'Quitar favorito' : 'Marcar favorito'}>
                          {isFav ? '★' : '☆'}
                        </button>
                      </td>
                      <td>{i.nombre}</td>
                      <td>{formatNumber(i.stock_actual)}</td>
                      <td>{formatNumber(i.stock_minimo)}</td>
                      <td>{i.unidad}</td>
                      <td className="action-cell"><button className="btn-small" onClick={() => handleEdit(i)}>Edit</button><button className="btn-small" style={{background:'#fbecec', color:'red'}} onClick={() => handleDelete(i.id)}>X</button></td>
                  </tr>
                  )
              })}
          </tbody></table>
          {showModal && <div className="modal-backdrop"><div className="modal-content"><h2>{itemActual.id ? 'Editar' : 'Nuevo'}</h2><input className="login-input" value={itemActual.nombre} onChange={e => setItemActual({...itemActual, nombre: e.target.value})} placeholder="Nombre"/><div className="input-row"><input className="login-input" type="number" value={itemActual.stock_actual} onChange={e => setItemActual({...itemActual, stock_actual: e.target.value})} placeholder="Actual" /><input className="login-input" type="number" value={itemActual.stock_minimo} onChange={e => setItemActual({...itemActual, stock_minimo: e.target.value})} placeholder="Mínimo" /><input className="login-input" value={itemActual.unidad} onChange={e => setItemActual({...itemActual, unidad: e.target.value})} placeholder="Unidad" /></div><div className="modal-actions"><button className="cancel-button" onClick={() => setShowModal(false)}>Cancelar</button><button className="confirm-button" onClick={handleSave}>Guardar</button></div></div></div>}
      </main>
  )
}
// ==================================================================
// 5. POS (TERMINAL - TIEMPO DECIMAL ARREGLADO)
// ==================================================================
function TerminalPedidosContent({ onConfirmarPedido, cart, setCart, stage, setStage, onHoldPedido, pedidosEnEspera, onRetrievePedido, pedidosCocina }) {
    const [productos, setProductos] = useState([]);
    
    useEffect(() => { 
        fetch('https://mrsalad-api.onrender.com/api/productos').then(r => r.json()).then(setProductos).catch(console.error); 
    }, []);

    const paymentOptions = ['Efectivo', 'Tarjeta', 'Sodexo'];
    const [total, setTotal] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [montoPagado, setMontoPagado] = useState(0);
    const [vuelto, setVuelto] = useState(0);
    const [totalTiempo, setTotalTiempo] = useState(0);

    useEffect(() => { 
        setTotal(cart.reduce((sum, i) => sum + (i.precio * i.cantidad), 0));
        setTotalTiempo(cart.reduce((sum, i) => sum + ((parseFloat(i.tiempo_preparacion_min) || 5) * i.cantidad), 0));
    }, [cart]);

    const addToCart = (prod) => setCart(prev => { const exist = prev.find(i => i.id === prod.id); return exist ? prev.map(i => i.id === prod.id ? {...i, cantidad: i.cantidad + 1} : i) : [...prev, {...prod, cantidad: 1}]; });
    const handleQty = (id, delta) => setCart(prev => prev.map(i => i.id === id ? { ...i, cantidad: Math.max(0, i.cantidad + delta) } : i).filter(i => i.cantidad > 0));
    const handleRemove = (id) => setCart(prev => prev.filter(i => i.id !== id));

    const handlePaymentSelect = (m) => { setPaymentMethod(m); if(m==='Efectivo') {setMontoPagado(total); setVuelto(0); setStage('efectivo_vuelto');} else setStage('confirmar_pago'); };

    const handleConfirmarPago = () => {
        onConfirmarPedido({ items: cart, total, paymentMethod, totalTiempo });
        setCart([]); setTotal(0); setPaymentMethod(null); setStage('pedido');
    };
    const productosActivos = productos.filter(p => p.activo_pos);

    // Filtrar cola de cocina
    const colaEsperaCocina = pedidosCocina ? pedidosCocina.filter(p => p.estado_cocina === 'en_espera') : [];

    return (
        <main className="terminal-container">
            <div className="product-grid">
                {productosActivos.map(p => (
                    <button key={p.id} className="product-item" onClick={() => addToCart(p)}>
                        <span className="product-name">{p.nombre}</span><span className="product-price">{formatMoney(p.precio)}</span>
                    </button>
                ))}
                
                {/* TABLA: COLA DE COCINA */}
                {colaEsperaCocina.length > 0 && (
                    <div className="hold-list cola-cocina peligro">
                        <h3 className="kds-header peligro">⏳ Cola Cocina ({colaEsperaCocina.length})</h3>
                        {colaEsperaCocina.map(p => (
                            <div key={p.id} className="hold-row">
                                <strong>#{p.id}</strong> - {formatDecimalTime(p.totalTiempo)} min
                            </div>
                        ))}
                    </div>
                )}

                {pedidosEnEspera.length > 0 && (
                    <div className="hold-list espera">
                        <h3 className="kds-header espera">⏸️ En Espera (Caja) ({pedidosEnEspera.length})</h3>
                        {pedidosEnEspera.map(p => <button key={p.id} className="hold-item-button" onClick={() => onRetrievePedido(p.id)}>#{p.id.toString().slice(-4)} ({p.items.length})</button>)}
                    </div>
                )}
            </div>
            <div className="ticket-display">
                {stage === 'pedido' && (<><h2>Ticket ({formatDecimalTime(totalTiempo)} min)</h2><div className="ticket-items">{cart.map(i => <div key={i.id} className="ticket-item"><button className="btn-small" style={{background:'#fbecec',color:'red',marginRight:'5px'}} onClick={() => handleRemove(i.id)}>X</button><div style={{flex:1}}><span>{i.nombre}</span><br/><small>{formatMoney(i.precio*i.cantidad)}</small></div><div className="quantity-control"><button onClick={() => handleQty(i.id, -1)}>-</button>{i.cantidad}<button onClick={() => handleQty(i.id, 1)}>+</button></div></div>)}</div><div className="ticket-summary">Total: {formatMoney(total)}<button className="hold-button" onClick={() => onHoldPedido(cart)}>Queue</button><button className="confirm-button" onClick={() => cart.length>0 ? setStage('pago') : alert("Vacío")}>Pagar</button></div></>)}
                {stage === 'pago' && (<><h2>Pago</h2><div className="payment-options">{paymentOptions.map(m => <button key={m} className="payment-button" onClick={() => handlePaymentSelect(m)}>{m}</button>)}</div><button className="cancel-button" onClick={() => setStage('pedido')}>Volver</button></>)}
                {stage === 'efectivo_vuelto' && (<><h2>Efectivo</h2><div className="efectivo-details"><p>Total: <strong>{formatMoney(total)}</strong></p><label>Pago:</label><input type="number" className="monto-pagado-input" value={montoPagado} onChange={e => {const v=parseInt(e.target.value)||0; setMontoPagado(v); setVuelto(v>=total?v-total:0);}} /><div className="efectivo-vuelto">Vuelto: {formatMoney(vuelto)}</div></div><button className="confirm-button" disabled={montoPagado<total} onClick={handleConfirmarPago}>Confirmar</button><button className="cancel-button" onClick={() => setStage('pago')}>Volver</button></>)}
                {stage === 'confirmar_pago' && (<><h2>Confirmar</h2><p>Total: <strong>{formatMoney(total)}</strong></p><p>Método: <strong>{paymentMethod}</strong></p><button className="confirm-button" onClick={handleConfirmarPago}>Confirmar</button><button className="cancel-button" onClick={() => setStage('pago')}>Volver</button></>)}
            </div>
        </main>
    );
}

// ==================================================================
// 6. KDS (COCINA - COMPLETO CON HISTORIAL)
// ==================================================================
function PanelCocinaContent({ pedidosEnCocina, pedidosCompletados, onCompletarPedido, onEliminarPedido }) {
  const [now, setNow] = useState(Date.now());
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [keyInput, setKeyInput] = useState('');
    const [selectedToDelete, setSelectedToDelete] = useState(null);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  
  const cols = { nuevos: [], advertencia: [], peligro: [] };

  // FILTRO: Solo mostrar pedidos activos (NO en espera)
  const activos = pedidosEnCocina ? pedidosEnCocina.filter(p => p.estado_cocina !== 'en_espera') : [];

  activos.forEach(p => {
    const createdAt = p.createdAt ? parseInt(p.createdAt) : now;
    const totalSec = p.totalTiempo * 60;
    const elapsed = (now - createdAt) / 1000;
    const remaining = totalSec - elapsed;
    const percent = remaining / totalSec;
    
    const pData = { ...p, timer: formatKDS(remaining), isLate: remaining < 0, statusColor: 'normal' };
    
    if (remaining < 0) { pData.statusColor = 'danger'; cols.peligro.push(pData); }
    else if (percent <= 0.25) { pData.statusColor = 'danger'; cols.peligro.push(pData); }
    else if (percent <= 0.50) { pData.statusColor = 'warning'; cols.advertencia.push(pData); }
    else { cols.nuevos.push(pData); }
  });

  const renderCard = (p, done=false) => (
      <div key={p.id} className={`pedido-card ${done?'completado':p.statusColor}`}>
          <div className="pedido-header"><h3>#{p.id.toString().slice(-4)}</h3>{done?'✔':(p.isLate?<span className="pedido-timer atraso">Atraso: {p.timer}</span>:<span className="pedido-timer">{p.timer}</span>)}</div>
          <ul>{p.items && p.items.map((i,x) => <li key={x}><strong>{i.cantidad}x</strong> {i.nombre}</li>)}</ul>
          {!done && <div className="kds-button-container"><button className="kds-complete-btn" onClick={() => onCompletarPedido(p.id)}>Listo</button><button className="kds-delete-btn" onClick={() => { setSelectedToDelete(p.id); setKeyInput(''); setShowKeyModal(true); }}>X</button></div>}
      </div>
  );

    return (
        <main className="cocina-container">
            <div className="cocina-columna"><h2 className="kds-header nuevos">Nuevos</h2><div className="pedidos-list">{cols.nuevos.map(p=>renderCard(p))}</div></div>
            <div className="cocina-columna"><h2 className="kds-header advertencia">Advertencia</h2><div className="pedidos-list">{cols.advertencia.map(p=>renderCard(p))}</div></div>
            <div className="cocina-columna"><h2 className="kds-header peligro">Peligro</h2><div className="pedidos-list">{cols.peligro.map(p=>renderCard(p))}</div></div>
            <div className="cocina-columna"><h2 className="kds-header completados">Completados</h2><div className="pedidos-list">{pedidosCompletados.map(p=>renderCard(p, true))}</div></div>
            {showKeyModal && (
                <div className="modal-backdrop">
                    <div className="modal-content" style={{maxWidth:'420px'}}>
                        <h3>Cancelar Pedido</h3>
                        <p>Ingrese la clave para confirmar la anulación del pedido.</p>
                        <input className="login-input" type="password" value={keyInput} onChange={e=>setKeyInput(e.target.value)} placeholder="Clave" />
                        <div style={{display:'flex', gap:'10px', marginTop:'12px'}}>
                            <button className="cancel-button" onClick={() => { setShowKeyModal(false); setSelectedToDelete(null); setKeyInput(''); }}>Cancelar</button>
                            <button className="confirm-button" onClick={() => {
                                if (keyInput === '1231') {
                                    onEliminarPedido(selectedToDelete);
                                    setShowKeyModal(false); setSelectedToDelete(null); setKeyInput('');
                                } else { alert('Clave incorrecta'); }
                            }}>Confirmar</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

// ==================================================================
// 7. APP PRINCIPAL
// ==================================================================
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [inventario, setInventario] = useState([]);
    const [favorites, setFavorites] = useState(() => {
            try {
                const raw = JSON.parse(localStorage.getItem('mrsalad_fav_ingredientes') || '[]');
                // Legacy support: if array of ids, convert to objects with null baseline
                if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] !== 'object') {
                    return raw.map(id => ({ id, baseline: null }));
                }
                return Array.isArray(raw) ? raw : [];
            } catch (e) { return []; }
    });
  const [pedidosEnCocina, setPedidosEnCocina] = useState([]);
  const [pedidosCompletados, setPedidosCompletados] = useState([]); 
  const [cart, setCart] = useState([]);
  const [stage, setStage] = useState('pedido');
  const [pedidosEnEspera, setPedidosEnEspera] = useState([]);
  const [toast, setToast] = useState(null); // Estado para Popup

  // 1. RECUPERAR SESIÓN (PERSISTENCIA)
  useEffect(() => {
    const savedUser = localStorage.getItem('mrsalad_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
  }, []);

  const refreshData = () => {
      fetch('https://mrsalad-api.onrender.com/api/inventario').then(r=>r.json()).then(d=>setInventario(Array.isArray(d)?d:[])).catch(console.error);
      // Cargar KDS y aplicar límite por columna (max 5). El resto pasa a "en espera"
      fetch('https://mrsalad-api.onrender.com/api/kds/pendientes').then(r=>r.json()).then(data => {
          try {
              const now = Date.now();
              const items = Array.isArray(data) ? data.slice().sort((a,b) => (a.createdAt||0) - (b.createdAt||0)) : [];

              const nuevos = [];
              const advertencia = [];
              const peligro = [];

              items.forEach(p => {
                  const createdAt = p.createdAt ? Number(p.createdAt) : now;
                  const totalSec = (p.totalTiempo || 1) * 60;
                  const elapsed = (now - createdAt) / 1000;
                  const remaining = totalSec - elapsed;
                  const percent = totalSec > 0 ? remaining / totalSec : 0;

                  if (remaining < 0 || percent <= 0.25) peligro.push({ ...p });
                  else if (percent <= 0.50) advertencia.push({ ...p });
                  else nuevos.push({ ...p });
              });

              // Separar overflow por columna (más de 5 -> pasar a en_espera)
              const overflow = [];
              if (nuevos.length > 5) overflow.push(...nuevos.splice(5));
              if (advertencia.length > 5) overflow.push(...advertencia.splice(5));
              if (peligro.length > 5) overflow.push(...peligro.splice(5));

              // Marcar los overflow como en_espera
              const enEspera = overflow.map(p => ({ ...p, estado_cocina: 'en_espera' }));

              // Active = concatenar por orden de prioridad: peligro, advertencia, nuevos (mantener orden)
              const active = [...nuevos, ...advertencia, ...peligro];

              setPedidosEnCocina(active);
              setPedidosEnEspera(enEspera);
          } catch (e) { console.error(e); setPedidosEnCocina(Array.isArray(data)?data:[]); }
      }).catch(console.error);
      fetch('https://mrsalad-api.onrender.com/api/kds/completados').then(r=>r.json()).then(setPedidosCompletados).catch(console.error);
  };

  const toggleFavorite = (id) => {
      setFavorites(prev => {
          const exists = prev.find(f => f.id === id);
          let next;
          if (exists) {
              next = prev.filter(f => f.id !== id);
          } else {
              // set baseline to current stock at the moment of marking
              const item = inventario.find(x => x.id === id);
              const baseline = item ? Number(item.stock_actual) || 0 : 0;
              next = [...prev, { id, baseline }];
          }
          try { localStorage.setItem('mrsalad_fav_ingredientes', JSON.stringify(next)); } catch(e) {}
          return next;
      });
  };

  // If there are favorites without baseline (legacy), set baseline when inventario loads
  useEffect(() => {
      if (!Array.isArray(inventario) || inventario.length === 0) return;
      let updated = false;
      const next = favorites.map(f => {
          if ((f.baseline === null || f.baseline === undefined) && inventario) {
              const item = inventario.find(i => i.id === f.id);
              if (item) { updated = true; return { ...f, baseline: Number(item.stock_actual) || 0 }; }
          }
          return f;
      });
      if (updated) {
          setFavorites(next);
          try { localStorage.setItem('mrsalad_fav_ingredientes', JSON.stringify(next)); } catch(e) {}
      }
  }, [inventario]);

  useEffect(() => {
      if (isLoggedIn) {
          refreshData();
          const i = setInterval(refreshData, 5000);
          return () => clearInterval(i);
      }
  }, [isLoggedIn]);

  // 2. LOGIN CON PERSISTENCIA
  const handleLoginSuccess = (user) => {
      localStorage.setItem('mrsalad_user', JSON.stringify(user));
      setCurrentUser(user);
      setIsLoggedIn(true);
  };

  // 3. LOGOUT
  const handleLogout = () => {
      if(confirm("¿Cerrar sesión?")) {
          localStorage.removeItem('mrsalad_user');
          setIsLoggedIn(false);
          setCurrentUser(null);
          setCart([]);
          setStage('pedido');
      }
  };

  const handleConfirmarPedido = async (p) => {
      try {
          const res = await fetch('https://mrsalad-api.onrender.com/api/pedidos', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({...p, usuarioId: currentUser.id}) });
          const data = await res.json();
          if(res.ok) {
             setToast({ message: `✅ ${data.message} (ID: ${data.pedidoId})`, type: 'success' });
             refreshData(); 
             // No navegar automáticamente a Cocina (KDS) después de generar venta
          } else {
             setToast({ message: `⛔ ${data.message}`, type: 'error' });
          }
      } catch(e) { alert("Error de conexión"); }
  };

  const handleCompletarKDS = async (id) => {
      await fetch(`https://mrsalad-api.onrender.com/api/kds/${id}/completar`, { method: 'PUT' });
      // Remover del array activo
      const pedido = pedidosEnCocina.find(p => p.id === id);
      if (pedido) {
          setPedidosEnCocina(prev => prev.filter(p => p.id !== id));
          setPedidosCompletados(prev => [pedido, ...prev]);
      }

      // Promover el siguiente pedido en espera (FIFO) al instante
      setPedidosEnEspera(prevEspera => {
          if (!Array.isArray(prevEspera) || prevEspera.length === 0) return prevEspera;
          const [next, ...rest] = prevEspera;
          const promoted = { ...next, estado_cocina: undefined, createdAt: Date.now() };
          setPedidosEnCocina(prevActive => [promoted, ...prevActive]);
          return rest;
      });

      // Actualizar datos remotos/refresh por si hay cambios en backend
      refreshData();
  };
  
  const handleEliminarKDS = async (id) => { await fetch(`https://mrsalad-api.onrender.com/api/kds/${id}`, { method: 'DELETE' }); refreshData(); };
  
  const handleNav = (view) => {
      if(currentView === 'terminal' && cart.length > 0 && !confirm("¿Salir? Se perderá el pedido actual.")) return;
      setCart([]); setStage('pedido'); setCurrentView(view); setIsMenuOpen(false);
  };

  if (!isLoggedIn) return <LoginScreen onLoginSuccess={handleLoginSuccess} />;

  return (
    <div className="app-root">
      {/* TOAST POPUP */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <nav className="navbar">
        <div className="navbar-logo" onClick={() => handleNav('dashboard')}>
           <img src={LOGO_URL} alt="Mr Salad" /> <span>Mr. Salad</span>
        </div>
        <button className={`navbar-toggle ${isMenuOpen?'open':''}`} onClick={() => setIsMenuOpen(!isMenuOpen)}><div className="hamburger"></div></button>
        <ul className={`navbar-menu ${isMenuOpen?'open':''}`}>
            <li onClick={() => handleNav('terminal')}>Ventas</li>
            <li onClick={() => handleNav('cocina')}>Pedidos Cocina</li>
            <li onClick={() => handleNav('inventario')}>Inventario</li>
            {(currentUser.role === 'admin' || currentUser.role === 'cajero') && 
                <li onClick={() => handleNav('admin')} className="nav-admin">
                    {currentUser.role === 'admin' ? 'Admin' : 'Gestión'}
                </li>
            }
            <li onClick={handleLogout} style={{color: '#d90429', cursor: 'pointer', fontWeight: 'bold', marginLeft: '15px'}}>Salir</li>
        </ul>
      </nav>
      <div className="main-view-container">
        {currentView === 'dashboard' && <DashboardContent inventario={inventario} favorites={favorites} />}
        {currentView === 'terminal' && <TerminalPedidosContent onConfirmarPedido={handleConfirmarPedido} cart={cart} setCart={setCart} stage={stage} setStage={setStage} onHoldPedido={(c)=>{setPedidosEnEspera([...pedidosEnEspera, {id:Date.now(), items:c}]); setCart([]); setStage('pedido');}} pedidosEnEspera={pedidosEnEspera} onRetrievePedido={(id)=>{const p=pedidosEnEspera.find(x=>x.id===id); setCart(p.items); setPedidosEnEspera(pedidosEnEspera.filter(x=>x.id!==id));}} pedidosCocina={pedidosEnCocina} />}
        {currentView === 'cocina' && <PanelCocinaContent pedidosEnCocina={pedidosEnCocina} pedidosCompletados={pedidosCompletados} onCompletarPedido={handleCompletarKDS} onEliminarPedido={handleEliminarKDS} />}
        {currentView === 'inventario' && <InventarioContent inventario={inventario} setInventario={setInventario} favorites={favorites.map(f=>f.id)} onToggleFavorite={toggleFavorite} />}
        {currentView === 'admin' && <AdminPanelContent inventario={inventario} currentUser={currentUser} />}
      </div>
    </div>
  );
}

export default App;
