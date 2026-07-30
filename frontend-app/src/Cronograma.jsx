import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

export default function App() {
  const fechaHoy = new Date().toISOString().split('T')[0];

  const [clientesWisp, setClientesWisp] = useState([]); // Estado para la lista de clientes
  const [loadingClientes, setLoadingClientes] = useState(false);
  
  const [cronograma, setCronograma] = useState([]);
  const [filtroFecha, setFiltroFecha] = useState(fechaHoy);
  const [editandoId, setEditandoId] = useState(null);

  const [nuevaActividad, setNuevaActividad] = useState({
    fecha: fechaHoy,
    tipo: 'INSTALACION',
    zona: '',
    direccion: '',
    nombre_cliente: '',
    telefono: '',
    descripcion: '',
    asignado_a: 'TODOS'
  });

  // Función para consultar los clientes desde el nuevo endpoint del backend
  const consultarClientesWisp = async () => {
    setLoadingClientes(true);
    try {
      const response = await axios.get('http://localhost:4000/api/wisphub/clientes');
      if (response.data.success) {
        setClientesWisp(response.data.data);
      }
    } catch (err) {
      console.error('No se pudo cargar la lista de clientes de WispHub.', err);
    } finally {
      setLoadingClientes(false);
    }
  };

  const consultarCronograma = async (fechaFiltro = '') => {
    try {
      const url = fechaFiltro 
        ? `http://localhost:4000/api/cronograma?fecha=${fechaFiltro}` 
        : 'http://localhost:4000/api/cronograma';
      const response = await axios.get(url);
      if (response.data.success) {
        setCronograma(response.data.data);
      }
    } catch (err) {
      console.error("Error al consultar cronograma:", err);
    }
  };

  useEffect(() => {
    consultarClientesWisp();
    consultarCronograma(fechaHoy);
  }, []);

  // Autocompletar datos al seleccionar un cliente del endpoint de clientes
  const seleccionarClienteWisp = (e) => {
    const nombreSeleccionado = e.target.value;
    
    if (!nombreSeleccionado) {
      setNuevaActividad(prev => ({
        ...prev,
        nombre_cliente: '',
        zona: '',
        direccion: '',
        telefono: ''
      }));
      return;
    }

    // Busca el cliente en la lista obtenida de https://api.wisphub.app/api/clientes/
    const clienteEncontrado = clientesWisp.find(cli => cli.nombre === nombreSeleccionado || cli.nombre_completo === nombreSeleccionado);

    if (clienteEncontrado) {
      setNuevaActividad(prev => ({
        ...prev,
        nombre_cliente: clienteEncontrado.nombre || clienteEncontrado.nombre_completo || '',
        zona: clienteEncontrado.localidad || clienteEncontrado.barrio || '',
        direccion: clienteEncontrado.direccion || '',
        telefono: clienteEncontrado.telefono || clienteEncontrado.celular || ''
      }));
    }
  };

  const handleSubmitCronograma = async (e) => {
    e.preventDefault();
    try {
      if (editandoId) {
        const response = await axios.put(`http://localhost:4000/api/cronograma/${editandoId}`, nuevaActividad);
        if (response.data.success) {
          alert('Actividad actualizada correctamente');
          setEditandoId(null);
        }
      } else {
        const response = await axios.post('http://localhost:4000/api/cronograma', nuevaActividad);
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
        asignado_a: 'TODOS'
      });
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
      asignado_a: item.asignado_a
    });
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
      asignado_a: 'TODOS'
    });
  };

  const eliminarActividad = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este registro del cronograma?')) {
      try {
        const response = await axios.delete(`http://localhost:4000/api/cronograma/${id}`);
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

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1400px', margin: '0 auto', gap: '30px' }}>
      
      {/* SECCIÓN: CRONOGRAMA DE ACTIVIDADES Y MANTENIMIENTOS */}
      <div className="card" style={{ width: '100%' }}>
        <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 className="title">📅 Cronograma de Actividades y Mantenimientos</h2>
            <p className="subtitle">Gestión y registro operativo conectado a Clientes de WispHub</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#edf2f7', padding: '8px 12px', borderRadius: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>Filtrar por Fecha:</label>
            <input 
              type="date" 
              value={filtroFecha} 
              onChange={handleFiltroChange} 
              style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e0', background: '#fff' }} 
            />
            {filtroFecha && (
              <button 
                onClick={() => { setFiltroFecha(''); consultarCronograma(''); }} 
                style={{ background: '#e53e3e', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Formulario de Registro / Edición con Buscador de Clientes WispHub */}
        <form onSubmit={handleSubmitCronograma} style={{ background: editandoId ? '#feebc8' : '#f8fafc', border: editandoId ? '2px solid #dd6b20' : '1px solid #e2e8f0', padding: '20px', borderRadius: '8px', marginBottom: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
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
              <option value="ACOMETIDA">ACOMETIDA</option>
              <option value="VIABILIDAD">VIABILIDAD</option>
              <option value="INSTALACION PUNTO">INSTALACION PUNTO</option>
            </select>
          </div>

          {/* SELECTOR CONECTADO AL ENDPOINT DE CLIENTES DE WISPHUB */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#2b6cb0' }}>
              {loadingClientes ? '🔄 Cargando clientes de WispHub...' : '🔍 Buscar Cliente en WispHub (Autocompletar)'}
            </label>
            <select 
              onChange={seleccionarClienteWisp} 
              value={nuevaActividad.nombre_cliente}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #3182ce', background: '#ebf8ff', fontWeight: 'bold' }}
            >
              <option value="">-- Seleccione un cliente de la lista --</option>
              {clientesWisp.map((cli, idx) => {
                const nombreCli = cli.nombre || cli.nombre_completo || 'Sin nombre';
                const zonaCli = cli.localidad || cli.barrio || '';
                return (
                  <option key={cli.id || idx} value={nombreCli}>
                    {nombreCli} {zonaCli ? `- (${zonaCli})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Nombre Cliente</label>
            <input 
              type="text" 
              placeholder="Nombre completo" 
              required 
              value={nuevaActividad.nombre_cliente} 
              onChange={e => setNuevaActividad({...nuevaActividad, nombre_cliente: e.target.value})} 
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', background: '#fff' }} 
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Zona / Barrio</label>
            <input 
              type="text" 
              placeholder="Ej: SEVILLA REAL" 
              required 
              value={nuevaActividad.zona} 
              onChange={e => setNuevaActividad({...nuevaActividad, zona: e.target.value})} 
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', background: '#fff' }} 
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Dirección</label>
            <input 
              type="text" 
              placeholder="Dirección cliente" 
              required 
              value={nuevaActividad.direccion} 
              onChange={e => setNuevaActividad({...nuevaActividad, direccion: e.target.value})} 
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', background: '#fff' }} 
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Teléfono</label>
            <input 
              type="text" 
              placeholder="Teléfono" 
              value={nuevaActividad.telefono} 
              onChange={e => setNuevaActividad({...nuevaActividad, telefono: e.target.value})} 
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', background: '#fff' }} 
            />
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

        {/* Tabla del Cronograma */}
        <div className="table-container">
          {cronograma.length === 0 ? (
            <div className="empty-state">
              <p>No hay actividades registradas en el cronograma para esta fecha.</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr style={{ background: '#00b4d8', color: '#fff' }}>
                  <th>FECHA</th>
                  <th>TIPO</th>
                  <th>ZONA</th>
                  <th>DIRECCIÓN</th>
                  <th>NOMBRE CLIENTE</th>
                  <th>TELÉFONO</th>
                  <th>DESCRIPCIÓN</th>
                  <th>ASIGNADO A</th>
                  <th style={{ textAlign: 'center' }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {cronograma.map((item) => (
                  <tr key={item.id} style={{ background: editandoId === item.id ? '#feebc8' : 'transparent' }}>
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

    </div>
  );
}