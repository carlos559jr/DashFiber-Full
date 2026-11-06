import React from 'react';

export default function CronogramaSection({
  nuevaActividad,
  setNuevaActividad,
  editandoId,
  handleSubmitCronograma,
  cancelarEdicion,
  textoBusquedaCliente,
  setTextoBusquedaCliente,
  mostrarSugerencias,
  setMostrarSugerencias,
  loadingClientes,
  clientesFiltrados,
  seleccionarClienteWisp,
  filtroGeneral,
  setFiltroGeneral,
  filtroFecha,
  handleFiltroChange,
  consultarCronograma,
  cronogramaOrdenado,
  ordenarCronogramaPor,
  obtenerFlechaCronograma,
  handleCambiarEstadoAdmin,
  iniciarEdicion,
  eliminarActividad
}) {
  return (
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
  );
}