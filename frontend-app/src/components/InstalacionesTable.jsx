import React from 'react';

export default function InstalacionesTable({
  instalaciones,
  instalacionesActuales,
  loadingWisp,
  errorWisp,
  consultarWispHub,
  enviarInstalacionAlCronograma,
  ordenarPor,
  obtenerFlecha,
  paginaActual,
  totalPaginas,
  cambiarPagina
}) {
  return (
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
  );
}