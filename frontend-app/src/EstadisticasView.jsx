import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import './App.css';

export default function EstadisticasView() {
  // Obtener el primer y último día del mes actual por defecto
  const primerYultimoDiaMes = useMemo(() => {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = ahora.getMonth(); // 0-indexado
    
    const primerDia = new Date(anio, mes, 1).toISOString().split('T')[0];
    const ultimoDia = new Date(anio, mes + 1, 0).toISOString().split('T')[0];
    
    return { primerDia, ultimoDia };
  }, []);

  const [cronograma, setCronograma] = useState([]);
  const [fechaInicioDashboard, setFechaInicioDashboard] = useState(primerYultimoDiaMes.primerDia);
  const [fechaFinDashboard, setFechaFinDashboard] = useState(primerYultimoDiaMes.ultimoDia);

  const consultarCronograma = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/cronograma');
      if (response.data.success) {
        setCronograma(response.data.data);
      }
    } catch (err) {
      console.error("Error al consultar cronograma:", err);
    }
  };

  useEffect(() => {
    consultarCronograma();
  }, []);

  // Función auxiliar para limpiar tildes y comparar sin errores
  const normalizarTexto = (texto) => {
    return (texto || '')
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .trim();
  };

  // CÁLCULOS Y FILTRADOS PARA EL DASHBOARD ESTADÍSTICO
  const cronogramaFiltradoRango = cronograma.filter((item) => {
    const fechaItem = item.fecha ? item.fecha.split('T')[0] : '';
    if (!fechaItem) return false;
    return fechaItem >= fechaInicioDashboard && fechaItem <= fechaFinDashboard;
  });

  const totalActividadesRango = cronogramaFiltradoRango.length;
  
  const totalInstalacionesRango = cronogramaFiltradoRango.filter(i => 
    normalizarTexto(i.tipo).includes('INSTALACION')
  ).length;

  const totalMantenimientosRango = cronogramaFiltradoRango.filter(i => 
    normalizarTexto(i.tipo).includes('MANTENIMIENTO')
  ).length;

  // Desglose por Tipo de Actividad
  const porTipoEstadistica = cronogramaFiltradoRango.reduce((acc, item) => {
    const tipo = item.tipo || 'OTRO';
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {});

  // Desglose por Técnico Asignado
  const porTecnicoEstadistica = cronogramaFiltradoRango.reduce((acc, item) => {
    const tecnico = item.asignado_a || 'Sin asignar';
    acc[tecnico] = (acc[tecnico] || 0) + 1;
    return acc;
  }, {});

  // Desglose por Zona / Barrio
  const porZonaEstadistica = cronogramaFiltradoRango.reduce((acc, item) => {
    const zona = item.zona || 'Sin zona';
    acc[zona] = (acc[zona] || 0) + 1;
    return acc;
  }, {});

  // Desglose por Descripción
  const porDescripcionEstadistica = cronogramaFiltradoRango.reduce((acc, item) => {
    const desc = item.descripcion || 'Sin descripción';
    acc[desc] = (acc[desc] || 0) + 1;
    return acc;
  }, {});

  // Desglose por Estado
  const porEstadoEstadistica = cronogramaFiltradoRango.reduce((acc, item) => {
    const estado = item.estado || 'Registrado';
    acc[estado] = (acc[estado] || 0) + 1;
    return acc;
  }, {});

  // Función para descargar los datos filtrados a Excel
  const descargarExcel = () => {
    if (cronogramaFiltradoRango.length === 0) {
      alert('No hay datos en el rango seleccionado para exportar.');
      return;
    }

    const datosParaExcel = cronogramaFiltradoRango.map(item => ({
      ID: item.id,
      Fecha: item.fecha ? item.fecha.split('T')[0] : '',
      Tipo: item.tipo,
      Prioridad: item.prioridad || 0,
      Zona: item.zona,
      Direccion: item.direccion,
      Cliente: item.nombre_cliente,
      Telefono: item.telefono,
      Descripcion: item.descripcion,
      AsignadoA: item.asignado_a,
      Estado: item.estado || 'Registrado'
    }));

    const hoja = XLSX.utils.json_to_sheet(datosParaExcel);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Actividades');
    
    XLSX.writeFile(libro, `Reporte_Actividades_${fechaInicioDashboard}_al_${fechaFinDashboard}.xlsx`);
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1400px', margin: '0 auto', gap: '30px', padding: '20px' }}>
      
      {/* Barra de Navegación superior y Botón Descargar Excel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '15px 20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', flexWrap: 'wrap', gap: '15px' }}>
        <h2 style={{ margin: 0, color: '#2d3748', fontSize: '20px' }}>📊 Módulo de Estadísticas y Reportes</h2>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={descargarExcel} 
            style={{ background: '#276749', color: '#fff', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            📥 Descargar Excel
          </button>
          <Link to="/" style={{ background: '#3182ce', color: '#fff', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>
            ← Volver al Panel Principal
          </Link>
        </div>
      </div>

      {/* DASHBOARD ESTADÍSTICO */}
      <div className="card" style={{ width: '100%', background: '#ffffff', borderTop: '4px solid #3182ce' }}>
        <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
          <div>
            <h2 className="title" style={{ color: '#2d3748' }}>Dashboard Operativo</h2>
            <p className="subtitle">Métricas inicializadas por defecto en el mes actual</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '10px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>Desde:</span>
            <input 
              type="date" 
              value={fechaInicioDashboard} 
              onChange={(e) => setFechaInicioDashboard(e.target.value)} 
              style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e0', background: '#fff' }} 
            />
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#4a5568' }}>Hasta:</span>
            <input 
              type="date" 
              value={fechaFinDashboard} 
              onChange={(e) => setFechaFinDashboard(e.target.value)} 
              style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e0', background: '#fff' }} 
            />
          </div>
        </div>

        {/* Tarjetas KPI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '25px' }}>
          <div style={{ background: '#ebf8ff', border: '1px solid #bee3f8', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#2b6cb0', fontSize: '14px' }}>Total Actividades</h4>
            <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#2c5282' }}>{totalActividadesRango}</span>
          </div>
          <div style={{ background: '#f0fff4', border: '1px solid #c6f6d5', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#22543d', fontSize: '14px' }}>Instalaciones</h4>
            <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#276749' }}>{totalInstalacionesRango}</span>
          </div>
          <div style={{ background: '#fffaf0', border: '1px solid #feebc8', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#7b341e', fontSize: '14px' }}>Mantenimientos</h4>
            <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#9c4221' }}>{totalMantenimientosRango}</span>
          </div>
        </div>

        {/* Desgloses (Tipo, Zona, Técnico, Descripción, Estado) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          
          {/* Por Tipo */}
          <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#2d3748' }}>📌 Desglose por Tipo</h4>
            {Object.keys(porTipoEstadistica).length === 0 ? (
              <p style={{ fontSize: '13px', color: '#718096' }}>No hay registros.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(porTipoEstadistica).map(([tipo, cantidad]) => (
                  <li key={tipo} style={{ display: 'flex', justifyContent: 'space-between', background: '#fff', padding: '8px 12px', borderRadius: '4px', border: '1px solid #edf2f7', fontSize: '13px' }}>
                    <span><b>{tipo}</b></span>
                    <span style={{ background: '#edf2f7', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>{cantidad}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Por Zona */}
          <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#2d3748' }}>📍 Recuento por Zona / Barrio</h4>
            {Object.keys(porZonaEstadistica).length === 0 ? (
              <p style={{ fontSize: '13px', color: '#718096' }}>No hay registros.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(porZonaEstadistica).map(([zona, cantidad]) => (
                  <li key={zona} style={{ display: 'flex', justifyContent: 'space-between', background: '#fff', padding: '8px 12px', borderRadius: '4px', border: '1px solid #edf2f7', fontSize: '13px' }}>
                    <span><b>{zona}</b></span>
                    <span style={{ background: '#edf2f7', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>{cantidad}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Por Técnico */}
          <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#2d3748' }}>👷‍♂️ Actividades por Técnico</h4>
            {Object.keys(porTecnicoEstadistica).length === 0 ? (
              <p style={{ fontSize: '13px', color: '#718096' }}>No hay registros.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(porTecnicoEstadistica).map(([tecnico, cantidad]) => (
                  <li key={tecnico} style={{ display: 'flex', justifyContent: 'space-between', background: '#fff', padding: '8px 12px', borderRadius: '4px', border: '1px solid #edf2f7', fontSize: '13px' }}>
                    <span><b>{tecnico}</b></span>
                    <span style={{ background: '#edf2f7', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>{cantidad}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Por Descripción */}
          <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#2d3748' }}>📝 Recuento por Descripción</h4>
            {Object.keys(porDescripcionEstadistica).length === 0 ? (
              <p style={{ fontSize: '13px', color: '#718096' }}>No hay registros.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(porDescripcionEstadistica).map(([desc, cantidad]) => (
                  <li key={desc} style={{ display: 'flex', justifyContent: 'space-between', background: '#fff', padding: '8px 12px', borderRadius: '4px', border: '1px solid #edf2f7', fontSize: '13px' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }} title={desc}><b>{desc}</b></span>
                    <span style={{ background: '#edf2f7', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>{cantidad}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Por Estado */}
          <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', gridColumn: '1 / -1' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#2d3748' }}>📌 Recuento por Estado</h4>
            {Object.keys(porEstadoEstadistica).length === 0 ? (
              <p style={{ fontSize: '13px', color: '#718096' }}>No hay registros.</p>
            ) : (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {Object.entries(porEstadoEstadistica).map(([estado, cantidad]) => (
                  <div key={estado} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '10px 15px', borderRadius: '6px', border: '1px solid #edf2f7', fontSize: '13px', minWidth: '150px', flex: '1' }}>
                    <span><b>{estado}</b></span>
                    <span style={{ background: '#3182ce', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>{cantidad}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}