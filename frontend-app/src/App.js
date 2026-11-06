import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import TecnicosView from './components/TecnicosView';
import EstadisticasView from './components/EstadisticasView';
import InstalacionesTable from './components/InstalacionesTable';
import TicketsTable from './components/TicketsTable';
import CronogramaSection from './components/CronogramaSection';
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
        setPaginaActualTickets(1);
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

    if (ordenCampoTickets === 'fechaTicket') {
      const parsearFechaTicket = (str) => {
        if (!str || str === 'SIN' || str === 'POR PROGRAMAR') return 0;
        const partes = str.split(' ');
        const fechaPartes = partes[0].split(/[-/]/);
        if (fechaPartes.length < 3) return 0;
        const [dia, mes, anio] = fechaPartes;
        const horaPartes = partes[1] ? partes[1].split(':') : [0, 0, 0];
        return new Date(anio, mes - 1, dia, horaPartes[0], horaPartes[1], horaPartes[2] || 0).getTime();
      };

      const tiempoA = parsearFechaTicket(valorA);
      const tiempoB = parsearFechaTicket(valorB);

      return ordenDireccionTickets === 'desc' ? tiempoB - tiempoA : tiempoA - tiempoB;
    }

    if (typeof valorA === 'string') valorA = valorA.toLowerCase();
    if (typeof valorB === 'string') valorB = valorB.toLowerCase();

    if (valorA < valorB) return ordenDireccionTickets === 'desc' ? 1 : -1;
    if (valorA > valorB) return ordenDireccionTickets === 'desc' ? -1 : 1;
    return 0;
  });

  const indiceUltimoTicket = paginaActualTickets * 5;
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

  useEffect(() => {
    consultarWispHub();
    consultarTicketsWisp();
    consultarCronograma(filtroFecha);

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

  const cerrarTicketDirecto = async (item) => {
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
        consultarTicketsWisp();
      }
    } catch (error) {
      console.error("Error al cerrar el ticket:", error);
      alert("Hubo un error al intentar cerrar el ticket en WispHub.");
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
    consultarCronograma(nuevaFecha);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1400px', margin: '0 auto', gap: '30px', padding: '20px' }}>
        
        {/* TABLA DE INSTALACIONES */}
        <InstalacionesTable
          instalaciones={instalaciones}
          instalacionesActuales={instalacionesActuales}
          loadingWisp={loadingWisp}
          errorWisp={errorWisp}
          consultarWispHub={consultarWispHub}
          enviarInstalacionAlCronograma={enviarInstalacionAlCronograma}
          ordenarPor={ordenarPor}
          obtenerFlecha={obtenerFlecha}
          paginaActual={paginaActual}
          totalPaginas={totalPaginas}
          cambiarPagina={cambiarPagina}
        />

        {/* TABLA DE TICKETS */}
        <TicketsTable
          tickets={tickets}
          ticketsActuales={ticketsActuales}
          loadingTickets={loadingTickets}
          errorTickets={errorTickets}
          consultarTicketsWisp={consultarTicketsWisp}
          enviarTicketAlCronograma={enviarTicketAlCronograma}
          cerrarTicketDirecto={cerrarTicketDirecto}
          ordenarTicketsPor={ordenarTicketsPor}
          obtenerFlechaTickets={obtenerFlechaTickets}
          paginaActualTickets={paginaActualTickets}
          totalPaginasTickets={totalPaginasTickets}
          cambiarPaginaTickets={cambiarPaginaTickets}
        />

        {/* SECCIÓN DEL CRONOGRAMA Y FORMULARIO */}
        <CronogramaSection
          nuevaActividad={nuevaActividad}
          setNuevaActividad={setNuevaActividad}
          editandoId={editandoId}
          handleSubmitCronograma={handleSubmitCronograma}
          cancelarEdicion={cancelarEdicion}
          textoBusquedaCliente={textoBusquedaCliente}
          setTextoBusquedaCliente={setTextoBusquedaCliente}
          mostrarSugerencias={mostrarSugerencias}
          setMostrarSugerencias={setMostrarSugerencias}
          loadingClientes={loadingClientes}
          clientesFiltrados={clientesWisp}
          seleccionarClienteWisp={seleccionarClienteWisp}
          filtroGeneral={filtroGeneral}
          setFiltroGeneral={setFiltroGeneral}
          filtroFecha={filtroFecha}
          handleFiltroChange={handleFiltroChange}
          consultarCronograma={consultarCronograma}
          cronogramaOrdenado={cronogramaOrdenado}
          ordenarCronogramaPor={ordenarCronogramaPor}
          obtenerFlechaCronograma={obtenerFlechaCronograma}
          handleCambiarEstadoAdmin={handleCambiarEstadoAdmin}
          iniciarEdicion={iniciarEdicion}
          eliminarActividad={eliminarActividad}
        />

        {/* NAVEGACIÓN INFERIOR */}
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