const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const { Pool } = require('pg');

const app = express();
app.use(express.json());
app.use(cors());

const WISP_API_TOKEN = "LV4cqkWk.Q75LCb5TdjjavsjU4Kth0Nqem20Ki27c";
const WISP_CLIENTES_URL = "https://api.wisphub.app/api/instalaciones/";
const WISP_CLIENTES = "https://api.wisphub.app/api/clientes/";
const WISP_TICKETS_URL = "https://api.wisphub.app/api/tickets/";

// Configuración de la base de datos PostgreSQL (Supabase)
const pool = new Pool({
  connectionString: 'postgresql://postgres.qtylomhtanzipwclbjoc:Aw96b610265420+@aws-0-us-east-2.pooler.supabase.com:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

// Ruta raíz para evitar el error "Cannot GET /"
app.get('/', (req, res) => {
    res.send('Servidor de WispHub funcionando correctamente 🚀');
});

// Ruta para traer las instalaciones pendientes de WispHub
app.get('/api/wisphub/instalaciones', async (req, res) => {
    try {
        const response = await axios.get(WISP_CLIENTES_URL, {
            params: { limit: 50, offset: 0 },
            headers: { 
                'Authorization': `Api-Key ${WISP_API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        const clientes = response.data.results || response.data;

        const instalaciones = clientes.map(item => ({
            id: item.id_servicio || item.id,
            localidad: item.localidad || item.localidad_nombre || item.barrio || 'Sin barrio',
            direccion: item.direccion || 'Sin dirección',
            nombre: item.nombre || item.cliente?.nombre || 'Sin nombre',
            telefono: item.telefono || item.cliente?.telefono || 'Sin teléfono',
            tecnico: item.tecnico?.nombre || item.tecnico || 'Por asignar',
            fechaInstalacion: item.fecha_instalacion || item.fecha || 'Por programar'
        }));

        res.json({ success: true, data: instalaciones });
    } catch (error) {
        console.error("Error al consultar WispHub:", error.response?.data || error.message);
        res.status(500).json({ success: false, message: 'Error al conectar con WispHub' });
    }
});

// ==========================================
// 1. RUTA PARA CONSULTAR LOS TICKETS PENDIENTES
// ==========================================
app.get('/api/wisphub/tickets', async (req, res) => {
    try {
        const response = await axios.get(WISP_TICKETS_URL, {
            params: { limit: 100, offset: 0 },
            headers: { 
                'Authorization': `Api-Key ${WISP_API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        const listaTickets = response.data.results || response.data;

        const ticketsNuevos = (Array.isArray(listaTickets) ? listaTickets : []).filter(item => {
            const estado = (item.estado || '').toLowerCase();
            return estado === 'nuevo' || estado === 'pendiente' || estado === 'abierto';
        });

        const ticketsFormateados = ticketsNuevos.map(item => ({
            id: item.id_ticket || item.id,
            localidad: (item.servicio?.localidad || item.localidad || 'SIN BARRIO').toUpperCase(),
            direccion: (item.servicio?.direccion || item.direccion || 'SIN DIRECCIÓN').toUpperCase(),
            nombre: (item.servicio?.nombre || item.nombre || 'SIN NOMBRE').toUpperCase(),
            telefono: item.servicio?.telefono || item.telefono || 'SIN TELÉFONO',
            asunto: (item.asunto || item.titulo || 'SOPORTE / TICKET').toUpperCase(),
            tecnico: (item.tecnico || 'POR ASIGNAR').toUpperCase(),
            fechaTicket: formatearFecha(item.fecha_estimada_inicio || item.fecha_creacion)
        }));

        res.json({ success: true, data: ticketsFormateados });

    } catch (error) {
        console.error("Error al consultar tickets en WispHub:", error.response?.data || error.message);
        res.status(500).json({ success: false, message: 'Error al conectar con WispHub para obtener tickets' });
    }
});


// ==========================================
// 2. RUTA PARA CERRAR EL TICKET EN WISPHUB (NUEVA)
// ==========================================
app.post('/api/wisphub/cerrar-ticket', async (req, res) => {
    try {
        const { id_ticket_wisphub } = req.body;
        
        // Validación estricta: si no viene el ID, detenemos la ejecución
        if (!id_ticket_wisphub) {
            return res.status(400).json({ 
                success: false, 
                message: 'No se proporcionó el ID del ticket de WispHub o la actividad no proviene de un ticket.' 
            });
        }

        // URL del ticket específico en la API de WispHub
        const urlCierre = `${WISP_TICKETS_URL}${id_ticket_wisphub}/`;
        
        // Payload para actualizar el estado a Cerrado y agregar la respuesta REALIZADO
        const payloadCierre = {
            estado: 'Cerrado', 
            respuesta: 'REALIZADO'
        };

        // Petición PATCH para actualizar el ticket en WispHub
        await axios.patch(urlCierre, payloadCierre, {
            headers: { 
                'Authorization': `Api-Key ${WISP_API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        res.json({ 
            success: true, 
            message: `Ticket #${id_ticket_wisphub} cerrado exitosamente con la nota REALIZADO.` 
        });

    } catch (error) {
        console.error("Error al cerrar ticket en WispHub:", error.response?.data || error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Error al conectar con WispHub para cerrar el ticket.' 
        });
    }
});

// Ruta para traer los clientes de WispHub con filtrado inteligente por nombre completo
app.get('/api/wisphub/clientes', async (req, res) => {
    try {
        const buscar = (req.query.q || '').trim(); 
        if (!buscar) {
            return res.json({ success: true, data: [] });
        }

        // Dividimos la búsqueda por espacios por si escriben "Nombre Apellido"
        const partes = buscar.split(/\s+/);
        const terminoPrincipal = partes[0]; // Tomamos la primera palabra para buscar en WispHub

        // Consultamos a WispHub usando la primera palabra para asegurar que traiga los registros base
        const [resNombre, resApellido] = await Promise.all([
            axios.get(WISP_CLIENTES, {
                params: { limit: 500, nombre__contains: terminoPrincipal },
                headers: { 'Authorization': `Api-Key ${WISP_API_TOKEN}`, 'Content-Type': 'application/json' }
            }).catch(() => ({ data: [] })),
            
            axios.get(WISP_CLIENTES, {
                params: { limit: 500, apellido__contains: terminoPrincipal },
                headers: { 'Authorization': `Api-Key ${WISP_API_TOKEN}`, 'Content-Type': 'application/json' }
            }).catch(() => ({ data: [] }))
        ]);

        const listaNombre = resNombre.data.results || resNombre.data || [];
        const listaApellido = resApellido.data.results || resApellido.data || [];

        // Unimos ambas listas de forma segura
        const todosLosClientes = [...listaNombre, ...listaApellido];

        // Filtramos en memoria para soportar nombres completos o múltiples palabras (ej: "Adriana Molina")
        const clientesFiltrados = todosLosClientes.filter(cli => {
            const nombre = (cli.nombre || cli.nombres || '').toLowerCase();
            const apellido = (cli.apellido || cli.apellidos || '').toLowerCase();
            const completo = `${nombre} ${apellido}`;
            
            // Verificamos que CADA palabra escrita por el usuario esté contenida en el registro del cliente
            return partes.every(part => completo.includes(part.toLowerCase()));
        });

        // Eliminamos duplicados
        const mapaClientes = new Map();
        clientesFiltrados.forEach((cli) => {
            const identificadorUnico = cli.id || cli.id_cliente || cli.id_servicio || JSON.stringify(cli);
            mapaClientes.set(identificadorUnico, cli);
        });

        const clientesFinales = Array.from(mapaClientes.values());

        res.json({ success: true, data: clientesFinales });

    } catch (error) {
        res.status(500).json({ success: false, error: 'Error al consultar clientes' });
    }
});

// Función auxiliar para transformar de MM/DD/YYYY a DD-MM-YYYY
const formatearFecha = (fechaStr) => {
    if (!fechaStr) return 'POR PROGRAMAR';
    
    // Si viene en formato "MM/DD/YYYY HH:mm:ss"
    const partes = fechaStr.split(' ');
    if (partes.length > 0) {
        const fechaPartes = partes[0].split('/');
        if (fechaPartes.length === 3) {
            const [mes, dia, anio] = fechaPartes;
            return `${dia}/${mes}/${anio} ${partes[1] || ''}`.trim();
        }
        
        // Si viene en formato ISO (ej. 2026-10-16T...)
        if (fechaStr.includes('T')) {
            const fechaIso = new Date(fechaStr);
            if (!isNaN(fechaIso.getTime())) {
                const dia = String(fechaIso.getDate()).padStart(2, '0');
                const mes = String(fechaIso.getMonth() + 1).padStart(2, '0');
                const anio = fechaIso.getFullYear();
                const hora = fechaIso.toTimeString().split(' ')[0];
                return `${dia}-${mes}-${anio} ${hora}`;
            }
        }
    }
    return fechaStr;
};

// Ruta para obtener el cronograma (con soporte seguro para filtrar por fecha exacta)
app.get('/api/cronograma', async (req, res) => {
    try {
        const { fecha } = req.query;
        let query = 'SELECT * FROM cronograma_actividades';
        let values = [];

        if (fecha) {
            // Usamos CAST para comparar solo la fecha sin importar si la columna es timestamp o date
            query += ' WHERE fecha::text LIKE $1';
            values.push(`${fecha}%`);
        }

        query += ' ORDER BY prioridad ASC, fecha DESC, id DESC';

        const { rows } = await pool.query(query, values);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error("Error al consultar cronograma:", error);
        res.status(500).json({ success: false, message: 'Error al obtener los datos del cronograma' });
    }
});

// Ruta para crear una nueva actividad
app.post('/api/cronograma', async (req, res) => {
    try {
        const { fecha, tipo, zona, direccion, nombre_cliente, telefono, descripcion, asignado_a, prioridad, estado, id_ticket_wisphub } = req.body;
        
        const query = `
            INSERT INTO cronograma_actividades (fecha, tipo, zona, direccion, nombre_cliente, telefono, descripcion, asignado_a, prioridad, estado) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
            RETURNING *;
        `;
        
        const values = [
            fecha, 
            tipo, 
            zona, 
            direccion, 
            nombre_cliente, 
            telefono, 
            descripcion, 
            asignado_a, 
            prioridad || 0,
            estado || 'PENDIENTE',
            id_ticket_wisphub
        ];
        
        const { rows } = await pool.query(query, values);
        res.json({ success: true, message: 'Actividad registrada con éxito', data: rows[0] });
    } catch (error) {
        console.error("Error al guardar actividad:", error);
        res.status(500).json({ success: false, message: 'Error al registrar la actividad' });
    }
});

// Ruta para actualizar una actividad general (edición completa)
app.put('/api/cronograma/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { fecha, tipo, zona, direccion, nombre_cliente, telefono, descripcion, asignado_a, prioridad, estado } = req.body;
        
        const query = `
            UPDATE cronograma_actividades 
            SET fecha = $1, tipo = $2, zona = $3, direccion = $4, nombre_cliente = $5, telefono = $6, descripcion = $7, asignado_a = $8, prioridad = $9, estado = $10
            WHERE id = $11
            RETURNING *;
        `;
        
        const values = [fecha, tipo, zona, direccion, nombre_cliente, telefono, descripcion, asignado_a, prioridad || 0, estado || 'PENDIENTE', id];
        
        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Actividad no encontrada' });
        }

        res.json({ success: true, message: 'Actividad actualizada con éxito', data: rows[0] });
    } catch (error) {
        console.error("Error al actualizar actividad:", error);
        res.status(500).json({ success: false, message: 'Error al actualizar la actividad' });
    }
});

// RUTA ACTUALIZADA: Actualiza estado, fecha y adjunta el comentario/motivo de pospuesto si existe
app.put('/api/cronograma/:id/estado', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, nuevaFecha, comentario } = req.body;

        let query;
        let values;

        if (nuevaFecha) {
            // Si se pospone, actualizamos estado, nueva fecha y concatenamos el comentario en la descripción
            query = `
                UPDATE cronograma_actividades 
                SET estado = $1, 
                    fecha = $2, 
                    descripcion = CASE 
                        WHEN $3 <> '' AND descripcion IS NOT NULL AND descripcion <> '' 
                        THEN descripcion || ' | Pospuesto: ' || $3 
                        WHEN $3 <> '' 
                        THEN 'Pospuesto: ' || $3 
                        ELSE descripcion 
                    END
                WHERE id = $4 
                RETURNING *;
            `;
            values = [estado, nuevaFecha, comentario || '', id];
        } else {
            // Si cambia de estado normalmente sin modificar fecha
            query = `
                UPDATE cronograma_actividades 
                SET estado = $1 
                WHERE id = $2 
                RETURNING *;
            `;
            values = [estado, id];
        }

        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Actividad no encontrada' });
        }

        res.json({ success: true, message: 'Estado y fecha actualizados correctamente', data: rows[0] });
    } catch (error) {
        console.error("Error al actualizar estado:", error);
        res.status(500).json({ success: false, message: 'Error al actualizar el estado' });
    }
});

// Ruta para eliminar una actividad
app.delete('/api/cronograma/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM cronograma_actividades WHERE id = $1', [id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Actividad no encontrada' });
        }

        res.json({ success: true, message: 'Actividad eliminada con éxito' });
    } catch (error) {
        console.error("Error al eliminar actividad:", error);
        res.status(500).json({ success: false, message: 'Error al eliminar la actividad' });
    }
});

const PORT = process.env.PORT || 10000; 
app.listen(PORT, () => {
  console.log(`Backend corriendo en puerto ${PORT}`);
});