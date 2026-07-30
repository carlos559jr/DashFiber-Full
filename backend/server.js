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

// Ruta para traer los clientes de WispHub
app.get('/api/wisphub/clientes', async (req, res) => {
    try {
        const buscar = req.query.q || ''; 
        const response = await axios.get(WISP_CLIENTES, {
            params: { 
                limit: 1000, 
                nombre__contains: buscar 
            }, 
            headers: { 
                'Authorization': `Api-Key ${WISP_API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        const clientes = response.data.results || response.data;
        res.json({ success: true, data: clientes });
    } catch (error) {
        console.error('Error al obtener los clientes:', error.message);
        res.status(500).json({ success: false, error: 'Error al consultar clientes' });
    }
});

// Ruta para obtener el cronograma (con soporte para filtrar por fecha exacta)
app.get('/api/cronograma', async (req, res) => {
    try {
        const { fecha } = req.query;
        let query = 'SELECT * FROM cronograma_actividades';
        let values = [];

        if (fecha) {
            query += ' WHERE fecha = $1';
            values.push(fecha);
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
        const { fecha, tipo, zona, direccion, nombre_cliente, telefono, descripcion, asignado_a, prioridad, estado } = req.body;
        
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
            estado || 'PENDIENTE'
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

// RUTA CLAVE (Opción 1): Actualizar exclusivamente el estado desde el portal de técnicos
app.put('/api/cronograma/:id/estado', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const query = `
            UPDATE cronograma_actividades 
            SET estado = $1 
            WHERE id = $2 
            RETURNING *;
        `;

        const { rows } = await pool.query(query, [estado, id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Actividad no encontrada' });
        }

        res.json({ success: true, message: 'Estado actualizado correctamente', data: rows[0] });
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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend corriendo en puerto ${PORT}`);
});