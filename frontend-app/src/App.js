import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import TecnicosView from './TecnicosView';
import EstadisticasView from './EstadisticasView';
import './App.css';

export default function App() {
  return (
    <Routes>
      {/* Ruta 1: El Panel de Administración (Página Principal) */}
      <Route path="/" element={<AdminPanel />} />

      {/* Ruta 2: La página independiente para los Técnicos (Ej: http://localhost:3000/tecnicos) */}
      <Route path="/tecnicos" element={<TecnicosView />} />
      <Route path="/estadisticas" element={<EstadisticasView />} />
    </Routes>
  );
}

function AdminPanel() {
  const [instalaciones, setInstalaciones] = useState([]);
  const [loadingWisp, setLoadingWisp] = useState(false);
  const [errorWisp, setErrorWisp] = useState('');
  
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 5;
  
  const [ordenCampo, setOrdenCampo] = useState('fechaInstalacion');
  const [ordenDireccion, setOrdenDireccion] = useState('asc');
  
  const fechaHoy = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const [clientesWisp, setClientesWisp] = useState([]); 
  const [loadingClientes, setLoadingClientes] = useState(false);
  
  const [textoBusquedaCliente, setTextoBusquedaCliente] = useState('');
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  const [cronograma, setCronograma] = useState([]);
  const [filtroFecha, setFiltroFecha] = useState(fechaHoy); 
  const [filtroGeneral, setFiltroGeneral] = useState(''); 
  const [editandoId, setEditandoId] = useState(null);

  const [ordenCampoCronograma, setOrdenCampoCronograma] = useState(null);
  const [ordenDireccionCronograma, setOrdenDireccionCronograma] = useState('asc');

  const [nuevaActividad, setNuevaActividad] = useState({
    fecha: fechaHoy,
    tipo: 'INSTALACION',
    zona: '',
    direccion: '',
    nombre_cliente: '',
    telefono: '',
    descripcion: '',
    asignado_a: '',
    prioridad: 0
  });

  const consultarWispHub = async () => {
    setLoadingWisp(true);
    setErrorWisp('');
    try {
      const response = await axios.get('https://dashfiber-backend.onrender.com/api/wisphub/instalaciones');
      if (response.data.success) {
        setInstalaciones(response.data.data);
        setPaginaActual(1);
        setOrdenCampo('fechaInstalacion');
        setOrdenDireccion('asc');
      }
    } catch (err) {
      setErrorWisp('No se pudo conectar con el servidor backend para WispHub.');
      console.error(err);
    } finally {
      setLoadingWisp(false);
    }
  };

  const consultarCronograma = async (fechaFiltro = '') => {
    try {
      const url = fechaFiltro 
        ? `https://dashfiber-backend.onrender.com/api/cronograma?fecha=${fechaFiltro}` 
        : 'https://dashfiber-backend.onrender.com/api/cronograma';
      const response = await axios.get(url);
      if (response.data.success) {
        setCronograma(response.data.data);
      }
    } catch (err) {
      console.error("Error al consultar cronograma:", err);
    }
  };

  useEffect(() => {
    consultarWispHub();
    consultarCronograma(fechaHoy);
  }, [fechaHoy]);

  useEffect(() => {
    if (textoBusquedaCliente.trim().length < 2) {
      setClientesWisp([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoadingClientes(true);
      try {
        const response = await axios.get(`https://dashfiber-backend.onrender.com/api/wisphub/clientes?q=${encodeURIComponent(textoBusquedaCliente)}`);
        const listaClientes = response.data.data || response.data.clientes || response.data;
        
        if (Array.isArray(listaClientes)) {
          setClientesWisp(listaClientes);
        } else {
          setClientesWisp([]);
        }
      } catch (err) {
        console.error('Error buscando clientes en WispHub:', err);
      } finally {
        setLoadingClientes(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [textoBusquedaCliente]);

  const clientesFiltrados = clientesWisp.filter(cli => {
    const nombre = (cli.nombre || cli.nombre_completo || '').toLowerCase();
    const zona = (cli.localidad || cli.barrio || '').toLowerCase();
    const query = textoBusquedaCliente.toLowerCase();
    return nombre.includes(query) || zona.includes(query);
  });

  const seleccionarClienteWisp = (clienteEncontrado) => {
    const nombreCli = clienteEncontrado.nombre || clienteEncontrado.nombre_completo || '';
    
    setNuevaActividad(prev => ({
      ...prev,
      nombre_cliente: nombreCli,
      zona: clienteEncontrado.localidad || clienteEncontrado.barrio || '',
      direccion: clienteEncontrado.direccion || '',
      telefono: clienteEncontrado.telefono || clienteEncontrado.celular || ''
    }));

    setTextoBusquedaCliente(nombreCli);
    setMostrarSugerencias(false);
  };

  const enviarInstalacionAlCronograma = (item) => {
    const nombreCli = item.nombre || item.nombre_completo || '';
    setNuevaActividad({
      fecha: fechaHoy,
      tipo: 'INSTALACION',
      zona: item.localidad || item.barrio || '',
      direccion: item.direccion || '',
      nombre_cliente: nombreCli,
      telefono: item.telefono || '',
      descripcion: 'Instalación pendiente WispHub',
      asignado_a: item.tecnico || '',
      prioridad: 0
    });
    setTextoBusquedaCliente(nombreCli);
    setEditandoId(null);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleSubmitCronograma = async (e) => {
    e.preventDefault();
    try {
      if (editandoId) {
        const response = await axios.put(`https://dashfiber-backend.onrender.com/api/cronograma/${editandoId}`, nuevaActividad);
        if (response.data.success) {
          alert('Actividad actualizada correctamente');
          setEditandoId(null);
        }
      } else {
        const response = await axios.post('https://dashfiber-backend.onrender.com/api/cronograma', nuevaActividad);
        if (response.data.success) {
          alert('Actividad registrada correctamente');
        }
      }

      setNuevaActividad({
        fecha: fechaHoy,
        tipo: 'INSTALACION',
        zona: '',
        direccion: '',
        nombre_cliente: '',
        telefono: '',
        descripcion: '',
        asignado_a: '',
        prioridad: 0
      });
      setTextoBusquedaCliente('');
      consultarCronograma(filtroFecha);
    } catch (err) {
      alert('Error al guardar los cambios');
      console.error(err);
    }
  };

  const iniciarEdicion = (item) => {
    setEditandoId(item.id);
    setNuevaActividad({
      fecha: item.fecha ? item.fecha.split('T')[0] : fechaHoy,
      tipo: item.tipo,
      zona: item.zona,
      direccion: item.direccion,
      nombre_cliente: item.nombre_cliente,
      telefono: item.telefono || '',
      descripcion: item.descripcion || '',
      asignado_a: item.asignado_a,
      prioridad: item.prioridad || 0
    });
    setTextoBusquedaCliente(item.nombre_cliente || '');
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setNuevaActividad({
      fecha: fechaHoy,
      tipo: 'INSTALACION',
      zona: '',
      direccion: '',
      nombre_cliente: '',
      telefono: '',
      descripcion: '',
      asignado_a: '',
      prioridad: 0
    });
    setTextoBusquedaCliente('');
  };

  const eliminarActividad = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este registro del cronograma?')) {
      try {
        const response = await axios.delete(`https://dashfiber-backend.onrender.com/api/cronograma/${id}`);
        if (response.data.success) {
          alert('Actividad eliminada');
          consultarCronograma(filtroFecha);
        }
      } catch (err) {
        alert('Error al eliminar');
        console.error(err);
      }
    }
  };

  const handleFiltroChange = (e) => {
    const fecha = e.target.value;
    setFiltroFecha(fecha);
    consultarCronograma(fecha);
  };

  const ordenarPor = (campo) => {
    let direccion = 'asc';
    if (ordenCampo === campo && ordenDireccion === 'asc') {
      direccion = 'desc';
    }
    setOrdenCampo(campo);
    setOrdenDireccion(direccion);
    setPaginaActual(1);
  };

  const instalacionesOrdenadas = [...instalaciones].sort((a, b) => {
    if (!ordenCampo) return 0;
    let valorA = a[ordenCampo] || '';
    let valorB = b[ordenCampo] || '';

    if (ordenCampo === 'fechaInstalacion') {
      const parsearFecha = (str) => {
        if (!str || str === 'Por programar') return 0;
        const partes = str.split(' ');
        if (partes.length < 2) return 0;
        const [dia, mes, anio] = partes[0].split('/');
        const [hora, min, seg] = partes[1].split(':');
        return new Date(anio, mes - 1, dia, hora, min, seg).getTime();
      };

      const tiempoA = parsearFecha(valorA);
      const tiempoB = parsearFecha(valorB);
      return ordenDireccion === 'asc' ? tiempoA - tiempoB : tiempoB - tiempoA;
    }

    if (typeof valorA === 'string') valorA = valorA.toLowerCase();
    if (typeof valorB === 'string') valorB = valorB.toLowerCase();
    if (valorA < valorB) return ordenDireccion === 'asc' ? -1 : 1;
    if (valorA > valorB) return ordenDireccion === 'asc' ? 1 : -1;
    return 0;
  });

  const indiceUltimoElemento = paginaActual * elementosPorPagina;
  const indicePrimerElemento = indiceUltimoElemento - elementosPorPagina;
  const instalacionesActuales = instalacionesOrdenadas.slice(indicePrimerElemento, indiceUltimoElemento);
  const totalPaginas = Math.ceil(instalaciones.length / elementosPorPagina);

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  const obtenerFlecha = (campo) => {
    if (ordenCampo !== campo) return ' ↕';
    return ordenDireccion === 'asc' ? ' ▲' : ' ▼';
  };

  const ordenarCronogramaPor = (campo) => {
    let direccion = 'asc';
    if (ordenCampoCronograma === campo && ordenDireccionCronograma === 'asc') {
      direccion = 'desc';
    }
    setOrdenCampoCronograma(campo);
    setOrdenDireccionCronograma(direccion);
  };

  const obtenerFlechaCronograma = (campo) => {
    if (ordenCampoCronograma !== campo) return ' ↕';
    return ordenDireccionCronograma === 'asc' ? ' ▲' : ' ▼';
  };

  const cronogramaFiltrado = cronograma.filter((item) => {
    const texto = filtroGeneral.toLowerCase();
    const cliente = (item.nombre_cliente || '').toLowerCase();
    const zona = (item.zona || '').toLowerCase();
    const direccion = (item.direccion || '').toLowerCase();
    const tipo = (item.tipo || '').toLowerCase();
    const descripcion = (item.descripcion || '').toLowerCase();
    const asignado = (item.asignado_a || '').toLowerCase();
    const telefono = (item.telefono || '').toLowerCase();
    const prioridadStr = String(item.prioridad || 0);

    return (
      cliente.includes(texto) ||
      zona.includes(texto) ||
      direccion.includes(texto) ||
      tipo.includes(texto) ||
      descripcion.includes(texto) ||
      asignado.includes(texto) ||
      telefono.includes(texto) ||
      prioridadStr.includes(texto)
    );
  });

  const cronogramaOrdenado = [...cronogramaFiltrado].sort((a, b) => {
    if (!ordenCampoCronograma) return 0;
    let valorA = a[ordenCampoCronograma];
    let valorB = b[ordenCampoCronograma];

    if (ordenCampoCronograma === 'prioridad') {
      valorA = Number(valorA) || 0;
      valorB = Number(valorB) || 0;
      return ordenDireccionCronograma === 'asc' ? valorA - valorB : valorB - valorA;
    }

    if (typeof valorA === 'string') valorA = valorA.toLowerCase();
    if (typeof valorB === 'string') valorB = valorB.toLowerCase();
    if (valorA < valorB) return ordenDireccionCronograma === 'asc' ? -1 : 1;
    if (valorA > valorB) return ordenDireccionCronograma === 'asc' ? 1 : -1;
    return 0;
  });

  return (
          
      <div className="container" style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1400px', margin: '0 auto', gap: '30px', padding: '20px' }}>
      
           {/* SECCIÓN 1: INSTALACIONES WISPHUB */}
      <div className="card" style={{ width: '100%' }}>
        <div className="header">
          <div>
            <h2 className="title">🚀 Instalaciones Pendientes - WispHub</h2>
            <p className="subtitle">Panel de control y sincronización de instalaciones en terreno</p>
          </div>
          <button onClick={consultarWispHub} disabled={loadingWisp} className="btn-primary">
            {loadingWisp ? 'Sincronizando...' : '🔄 Sincronizar Instalaciones'}
          </button>
        </div>

        {errorWisp && <div className="error-banner">{errorWisp}</div>}

        <div className="table-container">
          {instalaciones.length === 0 && !loadingWisp ? (
            <div className="empty-state">
              <p>No hay instalaciones pendientes encontradas en este momento.</p>
            </div>
          ) : (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th onClick={() => ordenarPor('localidad')} style={{ cursor: 'pointer', userSelect: 'none' }}>BARRIO {obtenerFlecha('localidad')}</th>
                    <th onClick={() => ordenarPor('direccion')} style={{ cursor: 'pointer', userSelect: 'none' }}>DIRECCIÓN {obtenerFlecha('direccion')}</th>
                    <th onClick={() => ordenarPor('nombre')} style={{ cursor: 'pointer', userSelect: 'none' }}>NOMBRE CLIENTE {obtenerFlecha('nombre')}</th>
                    <th onClick={() => ordenarPor('telefono')} style={{ cursor: 'pointer', userSelect: 'none' }}>TELÉFONO {obtenerFlecha('telefono')}</th>
                    <th onClick={() => ordenarPor('fechaInstalacion')} style={{ cursor: 'pointer', userSelect: 'none' }}>INSTALACIÓN {obtenerFlecha('fechaInstalacion')}</th>
                    <th onClick={() => ordenarPor('tecnico')} style={{ cursor: 'pointer', userSelect: 'none' }}>TÉCNICO WISP {obtenerFlecha('tecnico')}</th>
                    <th style={{ textAlign: 'center' }}>ACCIÓN</th>
                  </tr>
                </thead>
                <tbody>
                  {instalacionesActuales.map((item, index) => (
                    <tr key={item.id || index}>
                      <td><span className="badge-barrio">{item.localidad || 'Sin barrio'}</span></td>
                      <td>📍 {item.direccion || 'Sin dirección'}</td>
                      <td><b>{item.nombre || 'Sin nombre'}</b></td>
                      <td><a href={`tel:${item.telefono}`} className="phone-link">📞 {item.telefono || 'Sin teléfono'}</a></td>
                      <td>⚡ {item.fechaInstalacion}</td>
                      <td><span className="badge-tecnico">{item.tecnico || 'Por asignar'}</span></td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          onClick={() => enviarInstalacionAlCronograma(item)}
                          title="Enviar al Cronograma"
                          style={{ background: '#3182ce', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                        >
                          📥 Enviar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '0 5px' }}>
                <span style={{ fontSize: '14px', color: '#718096' }}>Página {paginaActual} de {totalPaginas || 1}</span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => cambiarPagina(paginaActual - 1)} disabled={paginaActual === 1} style={{ padding: '8px 16px', backgroundColor: paginaActual === 1 ? '#edf2f7' : '#3182ce', color: paginaActual === 1 ? '#a0aec0' : '#ffffff', border: 'none', borderRadius: '6px', cursor: paginaActual === 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>Anterior</button>
                  <button onClick={() => cambiarPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas || totalPaginas === 0} style={{ padding: '8px 16px', backgroundColor: (paginaActual === totalPaginas || totalPaginas === 0) ? '#edf2f7' : '#3182ce', color: (paginaActual === totalPaginas || totalPaginas === 0) ? '#a0aec0' : '#ffffff', border: 'none', borderRadius: '6px', cursor: (paginaActual === totalPaginas || totalPaginas === 0) ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>Siguiente</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* SECCIÓN 2: CRONOGRAMA DE ACTIVIDADES Y MANTENIMIENTOS */}
      <div className="card" style={{ width: '100%' }}>
        
        <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 className="title">📅 Cronograma de Actividades y Mantenimientos</h2>
            <p className="subtitle">Gestión y registro operativo almacenado en Base de Datos</p>
          </div>
        </div>

        <form onSubmit={handleSubmitCronograma} style={{ background: editandoId ? '#feebc8' : '#f8fafc', border: editandoId ? '2px solid #dd6b20' : '1px solid #e2e8f0', padding: '20px', borderRadius: '8px', marginBottom: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <h4 style={{ margin: '0 0 10px 0', color: editandoId ? '#c05621' : '#2d3748' }}>
              {editandoId ? `✏️ Editando Actividad ID: ${editandoId}` : '➕ Registrar Nueva Actividad'}
            </h4>
          </div>
          
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Fecha</label>
            <input type="date" required value={nuevaActividad.fecha} onChange={e => setNuevaActividad({...nuevaActividad, fecha: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', background: '#fff' }} />
          </div>
          
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Tipo</label>
            <select value={nuevaActividad.tipo} onChange={e => setNuevaActividad({...nuevaActividad, tipo: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', background: '#fff' }}>
              <option value="INSTALACION">INSTALACION</option>
              <option value="MANTENIMIENTO">MANTENIMIENTO</option>
              <option value="REPETIDOR">REPETIDOR</option>
              <option value="DESINSTALACION">DESINSTALACION</option>
              <option value="INSTALACION PUNTO">INSTALACION PUNTO</option>
              <option value="ACOMETIDA">ACOMETIDA</option>
              <option value="TRASLADO">TRASLADO</option>
              <option value="CAMBIO DE PLAN">CAMBIO DE PLAN</option>
              <option value="CAMBIO DE EQUIPO">CAMBIO DE EQUIPO</option>
              <option value="CAMBIO DE TITULAR">CAMBIO DE TITULAR</option>
              <option value="REUBICACION">REUBICACION</option>
              <option value="VIABILIDAD">VIABILIDAD</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Prioridad (Nivel numérico)</label>
            <input 
              type="number" 
              placeholder="Ej: 1, 2, 3..." 
              value={nuevaActividad.prioridad} 
              onChange={e => setNuevaActividad({...nuevaActividad, prioridad: parseInt(e.target.value) || 0})} 
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', background: '#fff' }} 
            />
          </div>

          <div style={{ gridColumn: 'span 2', position: 'relative' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#2b6cb0' }}>
              {loadingClientes ? '🔄 Buscando clientes globalmente...' : '🔍 Buscar Cliente en WispHub (Escribe para filtrar)'}
            </label>
            <input 
              type="text"
              placeholder="Escribe el nombre o zona del cliente..."
              value={textoBusquedaCliente}
              onChange={(e) => {
                setTextoBusquedaCliente(e.target.value);
                setNuevaActividad({...nuevaActividad, nombre_cliente: e.target.value});
                setMostrarSugerencias(true);
              }}
              onFocus={() => setMostrarSugerencias(true)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #3182ce', background: '#ebf8ff', fontWeight: 'bold' }}
              autoComplete="off"
            />
            
            {mostrarSugerencias && textoBusquedaCliente.length > 1 && (
              <ul style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                maxHeight: '200px',
                overflowY: 'auto',
                backgroundColor: '#fff',
                border: '1px solid #cbd5e0',
                borderRadius: '0 0 4px 4px',
                listStyle: 'none',
                padding: 0,
                margin: 0,
                zIndex: 1000,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                {loadingClientes ? (
                  <li style={{ padding: '8px 12px', fontSize: '13px', color: '#718096' }}>Buscando en WispHub...</li>
                ) : clientesFiltrados.length > 0 ? (
                  clientesFiltrados.map((cli, idx) => {
                    const nombreCli = cli.nombre || cli.nombre_completo || 'Sin nombre';
                    const zonaCli = cli.localidad || cli.barrio || '';
                    return (
                      <li 
                        key={cli.id || idx}
                        onClick={() => seleccionarClienteWisp(cli)}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #edf2f7',
                          fontSize: '13px'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#ebf8ff'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
                      >
                        <b>{nombreCli}</b> {zonaCli ? `- (${zonaCli})` : ''}
                      </li>
                    );
                  })
                ) : (
                  <li style={{ padding: '8px 12px', fontSize: '13px', color: '#718096' }}>
                    No se encontraron clientes coincidentes
                  </li>
                )}
              </ul>
            )}
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Nombre Cliente</label>
            <input type="text" placeholder="Nombre completo" required value={nuevaActividad.nombre_cliente} onChange={e => setNuevaActividad({...nuevaActividad, nombre_cliente: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', background: '#fff' }} />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Zona / Barrio</label>
            <input type="text" placeholder="Ej: SEVILLA REAL" required value={nuevaActividad.zona} onChange={e => setNuevaActividad({...nuevaActividad, zona: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', background: '#fff' }} />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Dirección</label>
            <input type="text" placeholder="Dirección cliente" required value={nuevaActividad.direccion} onChange={e => setNuevaActividad({...nuevaActividad, direccion: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', background: '#fff' }} />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Teléfono</label>
            <input type="text" placeholder="Teléfono" value={nuevaActividad.telefono} onChange={e => setNuevaActividad({...nuevaActividad, telefono: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', background: '#fff' }} />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Descripción</label>
            <input type="text" placeholder="Ej: FALLA DE INTERNET" value={nuevaActividad.descripcion} onChange={e => setNuevaActividad({...nuevaActividad, descripcion: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', background: '#fff' }} />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Asignado A</label>
            <input type="text" placeholder="Ej: DOUGLAS / TODOS" required value={nuevaActividad.asignado_a} onChange={e => setNuevaActividad({...nuevaActividad, asignado_a: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', background: '#fff' }} />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            {editandoId && (
              <button type="button" onClick={cancelarEdicion} style={{ background: '#718096', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                ❌ Cancelar
              </button>
            )}
            <button type="submit" className="btn-primary" style={{ background: editandoId ? '#dd6b20' : '#3182ce' }}>
              {editandoId ? '💾 Actualizar Actividad' : '➕ Registrar en Cronograma'}
            </button>
          </div>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '15px', background: '#f1f5f9', padding: '12px 15px', borderRadius: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#2d3748' }}>📋 Listado de Actividades Registradas</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            
            <div style={{ background: '#fff', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e0' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>🔍 Buscar:</label>
              <input 
                type="text" 
                placeholder="Filtrar en tabla..." 
                value={filtroGeneral} 
                onChange={(e) => setFiltroGeneral(e.target.value)} 
                style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e0', background: '#fff' }} 
              />
              {filtroGeneral && (
                <button 
                  onClick={() => setFiltroGeneral('')} 
                  style={{ background: '#718096', color: '#fff', border: 'none', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                >
                  ✕
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e0' }}>
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>Filtrar por Fecha:</label>
              <input 
                type="date" 
                value={filtroFecha} 
                onChange={handleFiltroChange} 
                style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e0', background: '#fff' }} 
              />
              {filtroFecha && (
                <button 
                  onClick={() => { setFiltroFecha(''); consultarCronograma(''); }} 
                  style={{ background: '#e53e3e', color: '#fff', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                >
                  Limpiar
                </button>
              )}
            </div>

          </div>
        </div>

        <div className="table-container">
          {cronogramaOrdenado.length === 0 ? (
            <div className="empty-state">
              <p>No se encontraron actividades que coincidan con la búsqueda o el filtro de fecha.</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr style={{ background: '#00b4d8', color: '#fff' }}>
                  <th onClick={() => ordenarCronogramaPor('prioridad')} style={{ cursor: 'pointer', userSelect: 'none' }}>PRIORIDAD {obtenerFlechaCronograma('prioridad')}</th>
                  <th onClick={() => ordenarCronogramaPor('fecha')} style={{ cursor: 'pointer', userSelect: 'none' }}>FECHA {obtenerFlechaCronograma('fecha')}</th>
                  <th onClick={() => ordenarCronogramaPor('tipo')} style={{ cursor: 'pointer', userSelect: 'none' }}>TIPO {obtenerFlechaCronograma('tipo')}</th>
                  <th onClick={() => ordenarCronogramaPor('zona')} style={{ cursor: 'pointer', userSelect: 'none' }}>ZONA {obtenerFlechaCronograma('zona')}</th>
                  <th onClick={() => ordenarCronogramaPor('direccion')} style={{ cursor: 'pointer', userSelect: 'none' }}>DIRECCIÓN {obtenerFlechaCronograma('direccion')}</th>
                  <th onClick={() => ordenarCronogramaPor('nombre_cliente')} style={{ cursor: 'pointer', userSelect: 'none' }}>NOMBRE CLIENTE {obtenerFlechaCronograma('nombre_cliente')}</th>
                  <th onClick={() => ordenarCronogramaPor('telefono')} style={{ cursor: 'pointer', userSelect: 'none' }}>TELÉFONO {obtenerFlechaCronograma('telefono')}</th>
                  <th onClick={() => ordenarCronogramaPor('descripcion')} style={{ cursor: 'pointer', userSelect: 'none' }}>DESCRIPCIÓN {obtenerFlechaCronograma('descripcion')}</th>
                  <th onClick={() => ordenarCronogramaPor('asignado_a')} style={{ cursor: 'pointer', userSelect: 'none' }}>ASIGNADO A {obtenerFlechaCronograma('asignado_a')}</th>
                  <th style={{ textAlign: 'center' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {cronogramaOrdenado.map((item) => (
                  <tr key={item.id} style={{ background: editandoId === item.id ? '#feebc8' : 'transparent' }}>
                    <td><span style={{ background: '#bee3f8', color: '#2b6cb0', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>{item.prioridad || 0}</span></td>
                    <td>{item.fecha ? item.fecha.split('T')[0] : ''}</td>
                    <td><b>{item.tipo}</b></td>
                    <td><span className="badge-barrio">{item.zona}</span></td>
                    <td>📍 {item.direccion}</td>
                    <td><b>{item.nombre_cliente}</b></td>
                    <td>
                      <a href={`tel:${item.telefono}`} className="phone-link">📞 {item.telefono || 'N/A'}</a>
                    </td>
                    <td>{item.descripcion}</td>
                    <td><span className="badge-tecnico">{item.asignado_a}</span></td>
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button 
                        onClick={() => iniciarEdicion(item)} 
                        title="Editar"
                        style={{ background: '#d69e2e', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '6px', fontWeight: 'bold' }}
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => eliminarActividad(item.id)} 
                        title="Eliminar"
                        style={{ background: '#e53e3e', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
       {/* Botón de acceso rápido hacia la página de estadísticas */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <Link to="/estadisticas" style={{ background: '#2b6cb0', color: '#fff', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📊 Ver Panel Estadístico
        </Link>
        <Link to="/tecnicos" style={{ background: '#4a5568', color: '#fff', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🛠️ Vista de Técnicos
        </Link>
      </div>
    </div>
  );
}