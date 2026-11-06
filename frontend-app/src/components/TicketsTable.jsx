import React from 'react';

export default function TicketsTable({
  tickets,
  ticketsActuales,
  loadingTickets,
  errorTickets,
  consultarTicketsWisp,
  enviarTicketAlCronograma,
  cerrarTicketDirecto,
  ordenarTicketsPor,
  obtenerFlechaTickets,
  paginaActualTickets,
  totalPaginasTickets,
  cambiarPaginaTickets
}) {
  return (
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
                        <button 
                          onClick={() => enviarTicketAlCronograma(item)}
                          title="Enviar Ticket al Cronograma"
                          style={{ background: '#3182ce', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                        >
                          📥 Enviar
                        </button>
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '0 5px' }}>
              <span style={{ fontSize: '14px', color: '#718096' }}>Página {paginaActualTickets} de {totalPaginasTickets || 1}</span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => cambiarPaginaTickets(paginaActualTickets - 1)} disabled={paginaActualTickets === 1} style={{ padding: '8px 16px', backgroundColor: paginaActualTickets === 1 ? '#edf2f7' : '#3182ce', color: paginaActualTickets === 1 ? '#a0aec0' : '#ffffff', border: 'none', borderRadius: '6px', cursor: paginaActualTickets === 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>Anterior</button>
                <button onClick={() => cambiarPaginaTickets(paginaActualTickets + 1)} disabled={paginaActualTickets === totalPaginasTickets || totalPaginasTickets === 0} style={{ padding: '8px 16px', backgroundColor: (paginaActualTickets === totalPaginasTickets || totalPaginas === 0) ? '#edf2f7' : '#3182ce', color: (paginaActualTickets === totalPaginasTickets || totalPaginas === 0) ? '#a0aec0' : '#ffffff', border: 'none', borderRadius: '6px', cursor: (paginaActualTickets === totalPaginasTickets || totalPaginas === 0) ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>Siguiente</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}