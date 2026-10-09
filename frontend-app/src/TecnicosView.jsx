import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './App.css';

export default function TecnicosView() {
  const obtenerFechaHoy = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [cronograma, setCronograma] = useState([]);
  const [filtroGeneral, setFiltroGeneral] = useState('');
  const [filtroFecha, setFiltroFecha] = useState(obtenerFechaHoy());
  const [filtroTecnico, setFiltroTecnico] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para controlar el modal del calendario de pospuesto
  const [modalPospuestoAbierto, setModalPospuestoAbierto] = useState(false);
  const [idActividadSeleccionada, setIdActividadSeleccionada] = useState(null);
  const [nuevaFechaPospuesto, setNuevaFechaPospuesto] = useState(obtenerFechaHoy());

  const consultarCronogramaTecnicos = async (fechaFiltro = '') => {
    setLoading(true);
    try {
      const url = fechaFiltro 
        ? `https://dashfiber-backend.onrender.com/api/cronograma?fecha=${fechaFiltro}` 
        : 'https://dashfiber-backend.onrender.com/api/cronograma';
      const response = await axios.get(url);
      if (response.data.success) {
        setCronograma(response.data.data);
      }
    } catch (err) {
      console.error("Error al consultar cronograma para técnicos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fechaHoy = obtenerFechaHoy();
    consultarCronogramaTecnicos(fechaHoy);
  }, []);

  const handleFiltroFechaChange = (e) => {
    const fecha = e.target.value;
    setFiltroFecha(fecha);
    consultarCronogramaTecnicos(fecha);
  };

  const handleCambiarEstado = (idActividad, nuevoEstado) => {
    if (nuevoEstado === 'POSPUESTO') {
      // Si selecciona pospuesto, guardamos el ID y abrimos el modal con el calendario
      setIdActividadSeleccionada(idActividad);
      setNuevaFechaPospuesto(obtenerFechaHoy());
      setModalPospuestoAbierto(true);
      return;
    }

    // Para los demás estados, actualizamos directamente
    enviarActualizacionEstado(idActividad, nuevoEstado, null);
  };

  const enviarActualizacionEstado = async (idActividad, nuevoEstado, fechaPospuesto) => {
    try {
      setCronograma((prevCronograma) =>
        prevCronograma.map((item) =>
          item.id === idActividad 
            ? { 
                ...item, 
                estado: nuevoEstado, 
                ...(fechaPospuesto ? { fecha: fechaPospuesto } : {}) 
              } 
            : item
        )
      );

      const payload = { estado: nuevoEstado };
      if (fechaPospuesto) {
        payload.nuevaFecha = fechaPospuesto;
      }

      await axios.put(`https://dashfiber-backend.onrender.com/api/cronograma/${idActividad}/estado`, payload);
      consultarCronogramaTecnicos(filtroFecha);
    } catch (err) {
      console.error("Error al actualizar el estado:", err);
      alert("No se pudo actualizar el estado en el servidor.");
      consultarCronogramaTecnicos(filtroFecha);
    }
  };

  const confirmarPospuesto = () => {
    if (!nuevaFechaPospuesto) {
      alert("Por favor selecciona una fecha válida.");
      return;
    }
    setModalPospuestoAbierto(false);
    enviarActualizacionEstado(idActividadSeleccionada, 'POSPUESTO', nuevaFechaPospuesto);
  };

  const cancelarPospuesto = () => {
    setModalPospuestoAbierto(false);
    setIdActividadSeleccionada(null);
    consultarCronogramaTecnicos(filtroFecha); // Restaura el select visualmente
  };

  // 1. Filtrar por texto general + EXCLUIR actividades de Carlos automáticamente
  const cronogramaFiltrado = cronograma.filter((item) => {
    const asignadoRaw = (item.asignado_a || '').toLowerCase();
    if (asignadoRaw.includes('carlos')) {
      return false;
    }

    const texto = filtroGeneral.toLowerCase();
    const cliente = (item.nombre_cliente || '').toLowerCase();
    const zona = (item.zona || '').toLowerCase();
    const direccion = (item.direccion || '').toLowerCase();
    const tipo = (item.tipo || '').toLowerCase();
    const descripcion = (item.descripcion || '').toLowerCase();
    const asignado = asignadoRaw;
    const telefono = (item.telefono || '').toLowerCase();
    const estado = (item.estado || '').toLowerCase();

    return (
      cliente.includes(texto) ||
      zona.includes(texto) ||
      direccion.includes(texto) ||
      tipo.includes(texto) ||
      descripcion.includes(texto) ||
      asignado.includes(texto) ||
      telefono.includes(texto) ||
      estado.includes(texto)
    );
  });

  const tecnicosPrincipales = useMemo(() => {
    const setTecnicos = new Set();
    cronogramaFiltrado.forEach(item => {
      if (item.asignado_a) {
        const partes = item.asignado_a.toUpperCase().split(/\/|,|\s+Y\s+|\s+E\s+/);
        partes.forEach(p => {
          const limpio = p.trim();
          if (limpio && limpio !== 'TODOS' && limpio !== 'POR ASIGNAR') {
            setTecnicos.add(limpio);
          }
        });
      }
    });
    return Array.from(setTecnicos);
  }, [cronogramaFiltrado]);

  const cronogramaAgrupadoPorTecnico = useMemo(() => {
    const grupos = {};

    tecnicosPrincipales.forEach(tecnico => {
      grupos[tecnico] = cronogramaFiltrado.filter(item => {
        const asignadoStr = (item.asignado_a || '').toUpperCase();
        const regex = new RegExp(`(^|\\b|\\s|/|Y)${tecnico}(\\b|\\s|/|Y|$)`);
        return regex.test(asignadoStr);
      });
    });

    cronogramaFiltrado.forEach(item => {
      const asignadoRaw = (item.asignado_a || 'POR ASIGNAR').trim().toUpperCase();
      const coincideConAlguno = tecnicosPrincipales.some(tec => {
        const regex = new RegExp(`(^|\\b|\\s|/|Y)${tec}(\\b|\\s|/|Y|$)`);
        return regex.test(asignadoRaw);
      });

      if (!coincideConAlguno) {
        if (!grupos[asignadoRaw]) {
          grupos[asignadoRaw] = [];
        }
        grupos[asignadoRaw].push(item);
      }
    });

    const gruposFiltrados = {};
    Object.keys(grupos).forEach(tec => {
      if (grupos[tec].length > 0) {
        gruposFiltrados[tec] = grupos[tec];
      }
    });

    return gruposFiltrados;
  }, [cronogramaFiltrado, tecnicosPrincipales]);

  const gruposAMostrar = useMemo(() => {
    if (!filtroTecnico) return cronogramaAgrupadoPorTecnico;
    const filtrado = {};
    if (cronogramaAgrupadoPorTecnico[filtroTecnico]) {
      filtrado[filtroTecnico] = cronogramaAgrupadoPorTecnico[filtroTecnico];
    }
    return filtrado;
  }, [cronogramaAgrupadoPorTecnico, filtroTecnico]);

  const opcionesTecnicos = Object.keys(cronogramaAgrupadoPorTecnico).sort();

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1400px', margin: '0 auto', gap: '30px', padding: '20px' }}>
      
      <div style={{ background: '#1a365d', padding: '20px', borderRadius: '8px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ margin: 0 }}>📱 Vista de Campo - Técnicos</h2>
          <p style={{ margin: '5px 0 0 0', color: '#cbd5e0', fontSize: '14px' }}>Actividades y mantenimientos agrupados por personal asignado</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => consultarCronogramaTecnicos(filtroFecha)} 
            disabled={loading} 
            style={{ background: '#3182ce', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {loading ? '🔄 Actualizando...' : '🔄 Sincronizar'}
          </button>

          <div style={{ background: '#fff', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>🔍 Buscar:</label>
            <input 
              type="text" 
              placeholder="Filtrar..." 
              value={filtroGeneral} 
              onChange={(e) => setFiltroGeneral(e.target.value)} 
              style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e0', background: '#fff', color: '#000', width: '130px' }} 
            />
            {filtroGeneral && (
              <button onClick={() => setFiltroGeneral('')} style={{ background: '#718096', color: '#fff', border: 'none', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
            )}
          </div>

          <div style={{ background: '#fff', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>Técnico:</label>
            <select
              value={filtroTecnico}
              onChange={(e) => setFiltroTecnico(e.target.value)}
              style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e0', background: '#fff', color: '#000', fontSize: '13px' }}
            >
              <option value="">Todos los técnicos</option>
              {opcionesTecnicos.map(tec => (
                <option key={tec} value={tec}>{tec}</option>
              ))}
            </select>
            {filtroTecnico && (
              <button onClick={() => setFiltroTecnico('')} style={{ background: '#718096', color: '#fff', border: 'none', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '6px 10px', borderRadius: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>Fecha:</label>
            <input 
              type="date" 
              value={filtroFecha} 
              onChange={handleFiltroFechaChange} 
              style={{ padding: '4px 6px', borderRadius: '4px', border: '1px solid #cbd5e0', background: '#fff', color: '#000' }} 
            />
            {filtroFecha && (
              <button onClick={() => { setFiltroFecha(''); consultarCronogramaTecnicos(''); }} style={{ background: '#e53e3e', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Limpiar</button>
            )}
          </div>
        </div>
      </div>

      {loading && cronograma.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#718096', fontSize: '16px' }}>Cargando actividades...</div>
      ) : Object.keys(gruposAMostrar).length === 0 ? (
        <div className="empty-state" style={{ background: '#fff', padding: '40px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <p style={{ color: '#718096', margin: 0 }}>No hay actividades registradas o coincidentes para mostrar en la fecha seleccionada.</p>
        </div>
      ) : (
        Object.entries(gruposAMostrar).map(([tecnico, itemsTecnico]) => (
          <div key={tecnico} style={{ marginBottom: '35px', border: '1px solid #cbd5e0', borderRadius: '8px', overflow: 'hidden', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            
            <div style={{ background: '#2b6cb0', color: '#fff', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🛠️ Técnico: <span style={{ background: '#1a365d', padding: '2px 10px', borderRadius: '4px', color: '#fff' }}>{tecnico}</span>
              </h4>
              <span style={{ fontSize: '13px', background: '#2c5282', padding: '3px 10px', borderRadius: '12px' }}>
                {itemsTecnico.length} {itemsTecnico.length === 1 ? 'actividad' : 'actividades'}
              </span>
            </div>

            <div className="table-container" style={{ margin: 0, overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', margin: 0 }}>
                <thead>
                  <tr style={{ background: '#edf2f7', color: '#2d3748', textAlign: 'left', fontSize: '13px' }}>
                    <th style={{ padding: '10px' }}>PRIORIDAD</th>
                    <th style={{ padding: '10px' }}>ESTADO</th>
                    <th style={{ padding: '10px' }}>FECHA</th>
                    <th style={{ padding: '10px' }}>TIPO</th>
                    <th style={{ padding: '10px' }}>ZONA</th>
                    <th style={{ padding: '10px' }}>DIRECCIÓN</th>
                    <th style={{ padding: '10px' }}>NOMBRE CLIENTE</th>
                    <th style={{ padding: '10px' }}>TELÉFONO</th>
                    <th style={{ padding: '10px' }}>DESCRIPCIÓN</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsTecnico.map((item) => {
                    const estadoActual = (item.estado || 'PENDIENTE').toUpperCase();
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #edf2f7', fontSize: '14px' }}>
                        <td style={{ padding: '10px' }}>
                          <span style={{ background: '#bee3f8', color: '#2b6cb0', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                            {item.prioridad || 0}
                          </span>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <select
                            value={estadoActual}
                            onChange={(e) => handleCambiarEstado(item.id, e.target.value)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e0',
                              fontWeight: 'bold',
                              fontSize: '12px',
                              background: 
                                estadoActual === 'REALIZADO' ? '#c6f6d5' : 
                                estadoActual === 'POSPUESTO' ? '#feebc8' : 
                                estadoActual === 'SIN CONTACTO CON CLIENTE' ? '#fed7d7' : '#edf2f7',
                              color: 
                                estadoActual === 'REALIZADO' ? '#22543d' : 
                                estadoActual === 'POSPUESTO' ? '#744210' : 
                                estadoActual === 'SIN CONTACTO CON CLIENTE' ? '#9b2c2c' : '#2d3748',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="PENDIENTE">PENDIENTE</option>
                            <option value="REALIZADO">REALIZADO</option>
                            <option value="SIN CONTACTO CON CLIENTE">SIN CONTACTO CON CLIENTE</option>
                            <option value="POSPUESTO">POSPUESTO</option>
                          </select>
                        </td>
                        <td style={{ padding: '10px' }}>{item.fecha ? item.fecha.split('T')[0] : ''}</td>
                        <td style={{ padding: '10px' }}><b>{item.tipo}</b></td>
                        <td style={{ padding: '10px' }}><span className="badge-barrio">{item.zona}</span></td>
                        <td style={{ padding: '10px' }}>📍 {item.direccion}</td>
                        <td style={{ padding: '10px' }}><b>{item.nombre_cliente}</b></td>
                        <td style={{ padding: '10px' }}>
                          <a href={`tel:${item.telefono}`} className="phone-link" style={{ color: '#3182ce', textDecoration: 'none', fontWeight: 'bold' }}>
                            📞 {item.telefono || 'N/A'}
                          </a>
                        </td>
                        <td style={{ padding: '10px' }}>{item.descripcion}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        ))
      )}

      {/* MODAL DE CALENDARIO PARA SELECCIONAR FECHA DE POSPUESTO */}
      {modalPospuestoAbierto && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#fff',
            padding: '25px',
            borderRadius: '8px',
            width: '320px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px'
          }}>
            <h3 style={{ margin: 0, color: '#1a365d', fontSize: '18px' }}>📅 Seleccionar Nueva Fecha</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#718096' }}>Elige la fecha a la cual deseas posponer esta actividad:</p>
            
            <input 
              type="date"
              value={nuevaFechaPospuesto}
              onChange={(e) => setNuevaFechaPospuesto(e.target.value)}
              style={{
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e0',
                fontSize: '15px',
                width: '100%',
                fontWeight: 'bold'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button 
                onClick={cancelarPospuesto}
                style={{ padding: '8px 14px', background: '#718096', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmarPospuesto}
                style={{ padding: '8px 14px', background: '#3182ce', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}