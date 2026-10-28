import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import TecnicosView from './TecnicosView';
import EstadisticasView from './EstadisticasView';
import './App.css';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AdminPanel />} />
      <Route path="/tecnicos" element={<TecnicosView />} />
      <Route path="/estadisticas" element={<EstadisticasView />} />
    </Routes>
  );
}

function AdminPanel() {
  const [instalaciones, setInstalaciones] = useState([]);
  const [loadingWisp, setLoadingWisp] = useState(false);
  const [errorWisp, setErrorWisp] = useState('');

  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [errorTickets, setErrorTickets] = useState('');
  const [paginaActualTickets, setPaginaActualTickets] = useState(1);
  const [ordenCampoTickets, setOrdenCampoTickets] = useState('fechaTicket');
  const [ordenDireccionTickets, setOrdenDireccionTickets] = useState('desc');
  
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

  const consultarTicketsWisp = async () => {
    setLoadingTickets(true);
    setErrorTickets('');
    try {
      const response = await axios.get('https://dashfiber-backend.onrender.com/api/wisphub/tickets');
      if (response.data.success) {
        setTickets(response.data.data);
        setPaginaActualTickets(1); // Reinicia a la página 1 al sincronizar
      }
    } catch (err) {
      setErrorTickets('No se pudo conectar con el servidor backend para los tickets.');
      console.error(err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const ordenarTicketsPor = (campo) => {
    let direccion = 'asc';
    if (ordenCampoTickets === campo && ordenDireccionTickets === 'asc') {
      direccion = 'desc';
    }
    setOrdenCampoTickets(campo);
    setOrdenDireccionTickets(direccion);
    setPaginaActualTickets(1);
  };

  const obtenerFlechaTickets = (campo) => {
    if (ordenCampoTickets !== campo) return ' ↕';
    return ordenDireccionTickets === 'asc' ? ' ▲' : ' ▼';
  };

  const ticketsOrdenados = [...tickets].sort((a, b) => {
    if (!ordenCampoTickets) return 0;
    let valorA = a[ordenCampoTickets] || '';
    let valorB = b[ordenCampoTickets] || '';

    if (typeof valorA === 'string') valorA = valorA.toLowerCase();
    if (typeof valorB === 'string') valorB = valorB.toLowerCase();

    // Invertido: si es 'desc', los valores mayores van primero (-1)
    if (valorA < valorB) return ordenDireccionTickets === 'desc' ? 1 : -1;
    if (valorA > valorB) return ordenDireccionTickets === 'desc' ? -1 : 1;
    return 0;
  });

  const indiceUltimoTicket = paginaActualTickets * 5; // Paginación de 5 en 5
  const indicePrimerTicket = indiceUltimoTicket - 5;
  const ticketsActuales = ticketsOrdenados.slice(indicePrimerTicket, indiceUltimoTicket);
  const totalPaginasTickets = Math.ceil(tickets.length / 5);

  const cambiarPaginaTickets = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginasTickets) {
      setPaginaActualTickets(nuevaPagina);
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

 // Carga inicial y configuración del intervalo de sincronización automática (cada 5 minutos)
  useEffect(() => {
    consultarWispHub();
    consultarTicketsWisp();
    consultarCronograma(filtroFecha); // <--- Usamos filtroFecha para que respete tu selección

    const intervalo = setInterval(() => {
      consultarCronograma(filtroFecha);
    }, 300000); 

    return () => clearInterval(intervalo);
  }, [filtroFecha]);

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

  const enviarTicketAlCronograma = (item) => {
    setNuevaActividad({
      fecha: fechaHoy,
      tipo: 'MANTENIMIENTO',
      zona: item.localidad || '',
      direccion: item.direccion || '',
      nombre_cliente: item.nombre || '',
      telefono: item.telefono || '',
      descripcion: `${item.asunto || 'Soporte técnico'}`,
      asignado_a: '',
      prioridad: 1,
      id_ticket_wisphub: item.id
    });
    setTextoBusquedaCliente(item.nombre || '');
    setEditandoId(null);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  // Como el backend ya devuelve los clientes filtrados y listos, usamos directamente clientesWisp
  const clientesFiltrados = clientesWisp;

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
      descripcion: 'INSTALACION SERVICIO DUO',
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

  const handleCambiarEstadoAdmin = async (idActividad, nuevoEstado) => {
    let nuevaFechaPospuesto = null;
    let comentarioPospuesto = '';

    if (nuevoEstado === 'POSPUESTO') {
      nuevaFechaPospuesto = prompt('Ingrese la nueva fecha (YYYY-MM-DD):', fechaHoy);
      if (!nuevaFechaPospuesto) return;
      comentarioPospuesto = prompt('Ingrese un comentario o motivo del pospuesto:', '') || '';
    }

    try {
      setCronograma((prev) =>
        prev.map((item) =>
          item.id === idActividad 
            ? { ...item, estado: nuevoEstado, ...(nuevaFechaPospuesto ? { fecha: nuevaFechaPospuesto } : {}) } 
            : item
        )
      );

      const payload = { estado: nuevoEstado };
      if (nuevaFechaPospuesto) {
        payload.nuevaFecha = nuevaFechaPospuesto;
        payload.comentario = comentarioPospuesto;
      }

      await axios.put(`https://dashfiber-backend.onrender.com/api/cronograma/${idActividad}/estado`, payload);
      consultarCronograma(filtroFecha);
    } catch (err) {
      console.error("Error al actualizar el estado:", err);
      alert("No se pudo actualizar el estado en el servidor.");
      consultarCronograma(filtroFecha);
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

  const consultarTicketsWispHub = async () => {
    try {
      const response = await axios.get('https://dashfiber-backend.onrender.com/api/wisphub/tickets'); // O la ruta que utilices para listar
      if (response.data && response.data.success) {
        setTicketsWispHub(response.data.data); // O el estado donde guardes los tickets
      }
    } catch (error) {
      console.error("Error al consultar tickets de WispHub:", error);
    }
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
    const nuevaFecha = e.target.value;
    setFiltroFecha(nuevaFecha);
    consultarCronograma(nuevaFecha); // Forzamos la consulta al backend con la fecha seleccionada
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
    const estado = (item.estado || '').toLowerCase();
    const prioridadStr = String(item.prioridad || 0);

    return (
      cliente.includes(texto) ||
      zona.includes(texto) ||
      direccion.includes(texto) ||
      tipo.includes(texto) ||
      descripcion.includes(texto) ||
      asignado.includes(texto) ||
      estado.includes(texto) ||
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

  const cerrarTicketDirecto = async (item) => {
  // Asegúrate de usar la propiedad correcta que trae el ID del ticket (puede ser item.id o item.id_ticket)
  const idTicket = item.id || item.id_ticket_wisphub;
  
  if (!window.confirm(`¿Estás seguro de marcar como REALIZADO y cerrar el ticket de ${item.nombre || 'este cliente'} directamente en WispHub?`)) {
    return;
  }

  try {
    const response = await axios.post('https://dashfiber-backend.onrender.com/api/wisphub/cerrar-ticket', {
      id_ticket_wisphub: idTicket
    });

    if (response.data.success) {
      alert("¡Ticket cerrado con éxito en WispHub!");
      // Aquí recargas la lista de tickets pendientes para que desaparezca el que acabas de cerrar
      consultarTicketsWispHub(); // O la función que uses para refrescar la tabla
    }
  } catch (error) {
    console.error("Error al cerrar el ticket:", error);
    alert("Hubo un error al intentar cerrar el ticket en WispHub.");
  }
};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      
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

          <div style={{ width: '100%', overflowX: 'auto' }}>
            {instalaciones.length === 0 && !loadingWisp ? (
              <div className="empty-state">
                <p>No hay instalaciones pendientes encontradas en este momento.</p>
              </div>
            ) : (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#edf2f7', color: '#2d3748', textAlign: 'left' }}>
                      <th onClick={() => ordenarPor('localidad')} style={{ padding: '12px', cursor: 'pointer', userSelect: 'none' }}>BARRIO {obtenerFlecha('localidad')}</th>
                      <th onClick={() => ordenarPor('direccion')} style={{ padding: '12px', cursor: 'pointer', userSelect: 'none' }}>DIRECCIÓN {obtenerFlecha('direccion')}</th>
                      <th onClick={() => ordenarPor('nombre')} style={{ padding: '12px', cursor: 'pointer', userSelect: 'none' }}>NOMBRE CLIENTE {obtenerFlecha('nombre')}</th>
                      <th onClick={() => ordenarPor('telefono')} style={{ padding: '12px', cursor: 'pointer', userSelect: 'none' }}>TELÉFONO {obtenerFlecha('telefono')}</th>
                      <th onClick={() => ordenarPor('fechaInstalacion')} style={{ padding: '12px', cursor: 'pointer', userSelect: 'none' }}>INSTALACIÓN {obtenerFlecha('fechaInstalacion')}</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>ACCIÓN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instalacionesActuales.map((item, index) => (
                      <tr key={item.id || index} style={{ borderBottom: '1px solid #edf2f7' }}>
                        <td style={{ padding: '12px' }}><span className="badge-barrio">{item.localidad || 'Sin barrio'}</span></td>
                        <td style={{ padding: '12px' }}>📍 {item.direccion || 'Sin dirección'}</td>
                        <td style={{ padding: '12px' }}><b>{item.nombre || 'Sin nombre'}</b></td>
                        <td style={{ padding: '12px' }}><a href={`tel:${item.telefono}`} className="phone-link">📞 {item.telefono || 'Sin teléfono'}</a></td>
                        <td style={{ padding: '12px' }}>⚡ {item.fechaInstalacion}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
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

        {/* SECCIÓN DE TICKETS PENDIENTES - WISPHUB */}
        <div className="card" style={{ width: '100%' }}>
          <div className="header">
            <div>
              <h2 className="title">🎫 Tickets Pendientes - WispHub</h2>
              <p className="subtitle">Panel de control y gestión de tickets de soporte</p>
            </div>
            <button onClick={consultarTicketsWisp} disabled={loadingTickets} className="btn-primary">
              {loadingTickets ? 'Sincronizando...' : '🔄 Sincronizar Tickets'}
            </button>
          </div>

          {errorTickets && <div className="error-banner">{errorTickets}</div>}

          <div style={{ width: '100%', overflowX: 'auto' }}>
            {tickets.length === 0 && !loadingTickets ? (
              <div className="empty-state">
                <p>No hay tickets pendientes encontrados en este momento.</p>
              </div>
            ) : (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
  <thead>
    <tr style={{ background: '#edf2f7', color: '#2d3748', textAlign: 'left' }}>
      <th onClick={() => ordenarTicketsPor('localidad')} style={{ padding: '12px', cursor: 'pointer' }}>BARRIO {obtenerFlechaTickets('localidad')}</th>
      <th onClick={() => ordenarTicketsPor('direccion')} style={{ padding: '12px', cursor: 'pointer' }}>DIRECCIÓN {obtenerFlechaTickets('direccion')}</th>
      <th onClick={() => ordenarTicketsPor('nombre')} style={{ padding: '12px', cursor: 'pointer' }}>NOMBRE CLIENTE {obtenerFlechaTickets('nombre')}</th>
      <th onClick={() => ordenarTicketsPor('telefono')} style={{ padding: '12px', cursor: 'pointer' }}>TELÉFONO {obtenerFlechaTickets('telefono')}</th>
      <th onClick={() => ordenarTicketsPor('fechaTicket')} style={{ padding: '12px', cursor: 'pointer' }}>FECHA {obtenerFlechaTickets('fechaTicket')}</th>
      <th onClick={() => ordenarTicketsPor('asunto')} style={{ padding: '12px', cursor: 'pointer' }}>ASUNTO {obtenerFlechaTickets('asunto')}</th>
      <th style={{ padding: '12px', textAlign: 'center' }}>ACCIONES</th>
    </tr>
  </thead>
  <tbody>
    {ticketsActuales.map((item, index) => (
      <tr key={item.id || index} style={{ borderBottom: '1px solid #edf2f7' }}>
        <td style={{ padding: '12px' }}><span className="badge-barrio">{item.localidad || 'SIN BARRIO'}</span></td>
        <td style={{ padding: '12px' }}>📍 {item.direccion || 'SIN DIRECCIÓN'}</td>
        <td style={{ padding: '12px' }}><b>{item.nombre || 'SIN NOMBRE'}</b></td>
        <td style={{ padding: '12px' }}>📞 <a href={`tel:${item.telefono}`} className="phone-link"> {item.telefono || 'SIN'}</a></td>
        <td style={{ padding: '12px' }}>⚡ {item.fechaTicket}</td>
        <td style={{ padding: '12px' }}>💬 {item.asunto || 'SIN ASUNTO'}</td>
        <td style={{ padding: '12px', textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
            {/* Botón existente para enviar al cronograma */}
            <button 
              onClick={() => enviarTicketAlCronograma(item)}
              title="Enviar Ticket al Cronograma"
              style={{ background: '#3182ce', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
            >
              📥 Enviar
            </button>
            
            {/* Nuevo botón para cerrar directamente */}
            <button 
              onClick={() => cerrarTicketDirecto(item)}
              title="Cerrar ticket directamente como Realizado"
              style={{ background: '#38a169', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
            >
              ✅ Realizado
            </button>
          </div>
        </td>
      </tr>
    ))}
  </tbody>
</table>

                {/* Controles de Paginación */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '0 5px' }}>
                  <span style={{ fontSize: '14px', color: '#718096' }}>Página {paginaActualTickets} de {totalPaginasTickets || 1}</span>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => cambiarPaginaTickets(paginaActualTickets - 1)} disabled={paginaActualTickets === 1} style={{ padding: '8px 16px', backgroundColor: paginaActualTickets === 1 ? '#edf2f7' : '#3182ce', color: paginaActualTickets === 1 ? '#a0aec0' : '#ffffff', border: 'none', borderRadius: '6px', cursor: paginaActualTickets === 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>Anterior</button>
                    <button onClick={() => cambiarPaginaTickets(paginaActualTickets + 1)} disabled={paginaActualTickets === totalPaginasTickets || totalPaginasTickets === 0} style={{ padding: '8px 16px', backgroundColor: (paginaActualTickets === totalPaginasTickets || totalPaginasTickets === 0) ? '#edf2f7' : '#3182ce', color: (paginaActualTickets === totalPaginasTickets || totalPaginasTickets === 0) ? '#a0aec0' : '#ffffff', border: 'none', borderRadius: '6px', cursor: (paginaActualTickets === totalPaginasTickets || totalPaginas === 0) ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>Siguiente</button>
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

          <form onSubmit={handleSubmitCronograma} style={{ background: editandoId ? '#feebc8' : '#f8fafc', border: editandoId ? '2px solid #dd6b20' : '1px solid #e2e8f0', padding: '20px', borderRadius: '8px', marginBottom: '15px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <h4 style={{ margin: '0 0 10px 0', color: editandoId ? '#c05621' : '#2d3748' }}>
                {editandoId ? `✏️ Editando Actividad ID: ${editandoId}` : '➕ Registrar Nueva Actividad'}
              </h4>
            </div>
            
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Fecha</label>
              <input type="date" required value={nuevaActividad.fecha} onChange={e => setNuevaActividad({...nuevaActividad, fecha: e.target.value})} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e0', background: '#fff', fontSize: '12px' }} />
            </div>
            
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Tipo</label>
              <select value={nuevaActividad.tipo} onChange={e => setNuevaActividad({...nuevaActividad, tipo: e.target.value})} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e0', background: '#fff', fontSize: '12px' }}>
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
              <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Prioridad</label>
              <input 
                type="number" 
                placeholder="Ej: 1, 2..." 
                value={nuevaActividad.prioridad} 
                onChange={e => setNuevaActividad({...nuevaActividad, prioridad: parseInt(e.target.value) || 0})} 
                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e0', background: '#fff', fontSize: '12px' }} 
              />
            </div>

            <div style={{ gridColumn: 'span 2', position: 'relative' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#2b6cb0' }}>
                {loadingClientes ? '🔄 Buscando...' : '🔍 Buscar Cliente WispHub'}
              </label>
              <input 
                type="text"
                placeholder="Escribe nombre o zona..."
                value={textoBusquedaCliente}
                onChange={(e) => {
                  setTextoBusquedaCliente(e.target.value);
                  setNuevaActividad({...nuevaActividad, nombre_cliente: e.target.value});
                  setMostrarSugerencias(true);
                }}
                onFocus={() => setMostrarSugerencias(true)}
                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #3182ce', background: '#ebf8ff', fontWeight: 'bold', fontSize: '12px' }}
                autoComplete="off"
              />
              
              {mostrarSugerencias && textoBusquedaCliente.length > 1 && (
                <ul style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  maxHeight: '180px',
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
                    <li style={{ padding: '6px 10px', fontSize: '12px', color: '#718096' }}>Buscando...</li>
                  ) : clientesFiltrados.length > 0 ? (
                    clientesFiltrados.map((cli, idx) => {
                      const nombreCli = cli.nombre || cli.nombre_completo || 'Sin nombre';
                      const zonaCli = cli.localidad || cli.barrio || '';
                      return (
                        <li 
                          key={cli.id || idx}
                          onClick={() => seleccionarClienteWisp(cli)}
                          style={{ padding: '6px 10px', cursor: 'pointer', borderBottom: '1px solid #edf2f7', fontSize: '12px' }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#ebf8ff'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
                        >
                          <b>{nombreCli}</b> {zonaCli ? `- (${zonaCli})` : ''}
                        </li>
                      );
                    })
                  ) : (
                    <li style={{ padding: '6px 10px', fontSize: '12px', color: '#718096' }}>No encontrado</li>
                  )}
                </ul>
              )}
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Nombre Cliente</label>
              <input type="text" placeholder="Nombre completo" required value={nuevaActividad.nombre_cliente} onChange={e => setNuevaActividad({...nuevaActividad, nombre_cliente: e.target.value})} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e0', background: '#fff', fontSize: '12px' }} />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Zona / Barrio</label>
              <input type="text" placeholder="Ej: SEVILLA" required value={nuevaActividad.zona} onChange={e => setNuevaActividad({...nuevaActividad, zona: e.target.value})} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e0', background: '#fff', fontSize: '12px' }} />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Dirección</label>
              <input type="text" placeholder="Dirección" required value={nuevaActividad.direccion} onChange={e => setNuevaActividad({...nuevaActividad, direccion: e.target.value})} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e0', background: '#fff', fontSize: '12px' }} />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Teléfono</label>
              <input type="text" placeholder="Teléfono" value={nuevaActividad.telefono} onChange={e => setNuevaActividad({...nuevaActividad, telefono: e.target.value})} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e0', background: '#fff', fontSize: '12px' }} />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Descripción</label>
              <input type="text" placeholder="Detalles..." value={nuevaActividad.descripcion} onChange={e => setNuevaActividad({...nuevaActividad, descripcion: e.target.value})} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e0', background: '#fff', fontSize: '12px' }} />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Asignado A</label>
              <input type="text" placeholder="Ej: DOUGLAS" required value={nuevaActividad.asignado_a} onChange={e => setNuevaActividad({...nuevaActividad, asignado_a: e.target.value})} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e0', background: '#fff', fontSize: '12px' }} />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              {editandoId && (
                <button type="button" onClick={cancelarEdicion} style={{ background: '#718096', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                  ❌ Cancelar
                </button>
              )}
              <button type="submit" style={{ background: editandoId ? '#dd6b20' : '#3182ce', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                {editandoId ? '💾 Actualizar' : '➕ Registrar'}
              </button>
            </div>
          </form>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px', background: '#f1f5f9', padding: '10px 12px', borderRadius: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', color: '#2d3748' }}>📋 Listado de Actividades Registradas</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ background: '#fff', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #cbd5e0' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a5568' }}>🔍</label>
                <input 
                  type="text" 
                  placeholder="Filtrar tabla..." 
                  value={filtroGeneral} 
                  onChange={(e) => setFiltroGeneral(e.target.value)} 
                  style={{ padding: '3px 4px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '12px', width: '120px' }} 
                />
                {filtroGeneral && (
                  <button onClick={() => setFiltroGeneral('')} style={{ background: '#718096', color: '#fff', border: 'none', padding: '2px 5px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>✕</button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e0' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a5568' }}>Fecha:</label>
                <input 
                  type="date" 
                  value={filtroFecha} 
                  onChange={handleFiltroChange} 
                  style={{ padding: '3px 4px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '12px' }} 
                />
                {filtroFecha && (
                  <button onClick={() => { setFiltroFecha(''); consultarCronograma(''); }} style={{ background: '#e53e3e', color: '#fff', border: 'none', padding: '3px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Limpiar</button>
                )}
              </div>
            </div>
          </div>

          {/* TABLA FLUIDA SIN SCROLL HORIZONTAL */}
          <div style={{ width: '100%', overflowX: 'hidden' }}>
            {cronogramaOrdenado.length === 0 ? (
              <div className="empty-state">
                <p>No se encontraron actividades que coincidan con la búsqueda o el filtro de fecha.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ background: '#00b4d8', color: '#fff', textAlign: 'left' }}>
                    <th onClick={() => ordenarCronogramaPor('prioridad')} style={{ padding: '10px 6px', cursor: 'pointer', width: '7%' }}>PRIORIDAD {obtenerFlechaCronograma('prioridad')}</th>
                    <th onClick={() => ordenarCronogramaPor('estado')} style={{ padding: '10px 6px', cursor: 'pointer', width: '13%' }}>ESTADO {obtenerFlechaCronograma('estado')}</th>
                    <th onClick={() => ordenarCronogramaPor('fecha')} style={{ padding: '10px 6px', cursor: 'pointer', width: '9%' }}>FECHA {obtenerFlechaCronograma('fecha')}</th>
                    <th onClick={() => ordenarCronogramaPor('tipo')} style={{ padding: '10px 6px', cursor: 'pointer', width: '10%' }}>TIPO {obtenerFlechaCronograma('tipo')}</th>
                    <th onClick={() => ordenarCronogramaPor('zona')} style={{ padding: '10px 6px', cursor: 'pointer', width: '9%' }}>ZONA {obtenerFlechaCronograma('zona')}</th>
                    <th onClick={() => ordenarCronogramaPor('direccion')} style={{ padding: '10px 6px', cursor: 'pointer', width: '14%' }}>DIRECCIÓN {obtenerFlechaCronograma('direccion')}</th>
                    <th onClick={() => ordenarCronogramaPor('nombre_cliente')} style={{ padding: '10px 6px', cursor: 'pointer', width: '13%' }}>CLIENTE {obtenerFlechaCronograma('nombre_cliente')}</th>
                    <th onClick={() => ordenarCronogramaPor('descripcion')} style={{ padding: '10px 6px', cursor: 'pointer', width: '11%' }}>DESCRIPCIÓN {obtenerFlechaCronograma('descripcion')}</th>
                    <th onClick={() => ordenarCronogramaPor('asignado_a')} style={{ padding: '10px 6px', cursor: 'pointer', width: '8%' }}>ASIGNADO {obtenerFlechaCronograma('asignado_a')}</th>
                    <th style={{ padding: '10px 6px', textAlign: 'center', width: '10%' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {cronogramaOrdenado.map((item) => {
                    const estadoActual = (item.estado || 'PENDIENTE').toUpperCase();
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #edf2f7', background: editandoId === item.id ? '#feebc8' : 'transparent' }}>
                        <td style={{ padding: '10px 6px', wordBreak: 'break-word' }}>
                          <span style={{ background: '#bee3f8', color: '#2b6cb0', padding: '3px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{item.prioridad || 0}</span>
                        </td>
                        
                        <td style={{ padding: '10px 6px' }}>
                          <select
                            value={estadoActual}
                            onChange={(e) => handleCambiarEstadoAdmin(item.id, e.target.value)}
                            style={{
                              padding: '4px 6px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e0',
                              fontWeight: 'bold',
                              fontSize: '11px',
                              background: 
                                estadoActual === 'REALIZADO' ? '#c6f6d5' : 
                                estadoActual === 'POSPUESTO' ? '#feebc8' : 
                                estadoActual === 'SIN CONTACTO CON CLIENTE' ? '#fed7d7' : '#edf2f7',
                              color: 
                                estadoActual === 'REALIZADO' ? '#22543d' : 
                                estadoActual === 'POSPUESTO' ? '#744210' : 
                                estadoActual === 'SIN CONTACTO CON CLIENTE' ? '#9b2c2c' : '#2d3748',
                              cursor: 'pointer',
                              width: '100%'
                            }}
                          >
                            <option value="PENDIENTE">PENDIENTE</option>
                            <option value="REALIZADO">REALIZADO</option>
                            <option value="SIN CONTACTO CON CLIENTE">SIN CONTACTO CON CLIENTE</option>
                            <option value="POSPUESTO">POSPUESTO</option>
                          </select>
                        </td>

                        <td style={{ padding: '10px 6px', wordBreak: 'break-word' }}>{item.fecha ? item.fecha.split('T')[0] : ''}</td>
                        <td style={{ padding: '10px 6px', wordBreak: 'break-word' }}><b>{item.tipo}</b></td>
                        <td style={{ padding: '10px 6px', wordBreak: 'break-word' }}>
                          <span className="badge-barrio" style={{ fontSize: '11px', display: 'inline-block' }}>{item.zona}</span>
                        </td>
                        <td style={{ padding: '10px 6px', wordBreak: 'break-word' }}>📍 {item.direccion}</td>
                        <td style={{ padding: '10px 6px', wordBreak: 'break-word' }}><b>{item.nombre_cliente}</b></td>
                        <td style={{ padding: '10px 6px', wordBreak: 'break-word', color: '#4a5568' }}>{item.descripcion}</td>
                        <td style={{ padding: '10px 6px', wordBreak: 'break-word' }}>
                          <span className="badge-tecnico" style={{ fontSize: '11px', display: 'inline-block' }}>{item.asignado_a}</span>
                        </td>
                        <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                            <button 
                              onClick={() => iniciarEdicion(item)} 
                              style={{ background: '#d69e2e', color: '#fff', border: 'none', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '10px', width: '100%' }}
                            >
                              ✏️ Editar
                            </button>
                            <button 
                              onClick={() => eliminarActividad(item.id)} 
                              style={{ background: '#e53e3e', color: '#fff', border: 'none', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '10px', width: '100%' }}
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

        </div>

        {/* NAVEGACIÓN INFERIOR (BOTONES AL FINAL DE TODO) */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '10px', paddingBottom: '20px' }}>
          <Link to="/tecnicos" style={{ padding: '10px 20px', background: '#2b6cb0', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            📱 Vista de Técnicos
          </Link>
          <Link to="/estadisticas" style={{ padding: '10px 20px', background: '#319795', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            📊 Ver Panel Estadístico
          </Link>
        </div>

      </div>

    </div>
  );
}