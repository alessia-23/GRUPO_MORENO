import axios from 'axios';
import AccionesAdmin from '../models/AccionesAdmin.js';
import Producto from '../models/Producto.js';
import Usuario from '../models/Usuario.js';


const tiposAcciones = [
    'PROMOCION_SUGERIDA',
    'NUEVA_MERCADERIA',
    'BAJO_NUMERO_VENTAS',
    'PAGO_SRI',
    'FECHA_FESTIVA'
];

const obtenerPeriodoActual = (tipo) => {
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');

    if (
        tipo === 'BAJO_NUMERO_VENTAS' ||
        tipo === 'PROMOCION_SUGERIDA'
    ) {
        const inicioAnio = new Date(anio, 0, 1);
        const dias = Math.floor((fecha - inicioAnio) / (24 * 60 * 60 * 1000));
        const semana = String(Math.ceil((dias + inicioAnio.getDay() + 1) / 7)).padStart(2, '0');
        return `${anio}-S${semana}`;
    }

    return `${anio}-${mes}`;
};

const listarAccionesAdmin = async (req, res) => {
    try {
        const acciones = await Promise.all(
            tiposAcciones.map(async (tipo) => {
                const periodo = obtenerPeriodoActual(tipo);

                const registro = await AccionesAdmin.findOne({
                    tipo,
                    periodo
                });

                return {
                    tipo,
                    periodo,
                    estado: registro?.estado || 'PENDIENTE'
                };
            })
        );

        return res.status(200).json({ acciones });
    } catch (error) {
        console.error('Error al listar acciones administrativas:', error);
        return res.status(500).json({
            msg: 'Error al listar acciones administrativas'
        });
    }
};


const finalizarAccionAdmin = async (req, res) => {
    try {
        const { tipo } = req.params;

        if (!tiposAcciones.includes(tipo)) {
            return res.status(400).json({
                msg: 'Tipo de acción administrativa no válido'
            });
        }

        const periodo = obtenerPeriodoActual(tipo);

        const accion = await AccionesAdmin.findOneAndUpdate(
            { tipo, periodo },
            {
                tipo,
                periodo,
                estado: 'FINALIZADA',
                fechaFinalizacion: new Date()
            },
            {
                new: true,
                upsert: true
            }
        );

        return res.status(200).json({
            msg: 'Acción marcada como finalizada',
            accion
        });
    } catch (error) {
        console.error('Error al finalizar acción administrativa:', error);
        return res.status(500).json({
            msg: 'Error al finalizar acción administrativa'
        });
    }
};

const reactivarAccionAdmin = async (req, res) => {
    try {
        const { tipo } = req.params;

        if (!tiposAcciones.includes(tipo)) {
            return res.status(400).json({
                msg: 'Tipo de acción administrativa no válido'
            });
        }

        const periodo = obtenerPeriodoActual(tipo);

        const accion = await AccionesAdmin.findOneAndUpdate(
            { tipo, periodo },
            {
                tipo,
                periodo,
                estado: 'PENDIENTE',
                fechaFinalizacion: null
            },
            {
                new: true,
                upsert: true
            }
        );

        return res.status(200).json({
            msg: 'Acción marcada como pendiente',
            accion
        });
    } catch (error) {
        console.error('Error al reactivar acción administrativa:', error);
        return res.status(500).json({
            msg: 'Error al reactivar acción administrativa'
        });
    }
};


const reactivarAccionAdminN8n = async (req, res) => {
    try {
        const { tipo } = req.params;
        const { token } = req.query;

        if (token !== process.env.N8N_SECRET_TOKEN) {
            return res.status(401).json({
                msg: 'Token de n8n no válido'
            });
        }

        if (!tiposAcciones.includes(tipo)) {
            return res.status(400).json({
                msg: 'Tipo de acción administrativa no válido'
            });
        }

        const periodo = obtenerPeriodoActual(tipo);

        const accion = await AccionesAdmin.findOneAndUpdate(
            { tipo, periodo },
            {
                tipo,
                periodo,
                estado: 'PENDIENTE',
                fechaFinalizacion: null
            },
            {
                new: true,
                upsert: true
            }
        );

        return res.status(200).json({
            msg: 'Acción marcada como pendiente desde n8n',
            accion
        });
    } catch (error) {
        console.error('Error al marcar acción desde n8n:', error);
        return res.status(500).json({
            msg: 'Error al marcar acción desde n8n'
        });
    }
};

const ejecutarPromocionSugerida = async (req, res) => {
    try {
        const tipo = 'PROMOCION_SUGERIDA';
        const periodo = obtenerPeriodoActual(tipo);

        const accionExistente = await AccionesAdmin.findOne({
            tipo,
            periodo
        });

        if (accionExistente?.estado === 'FINALIZADA') {
            return res.status(400).json({
                msg: 'La promoción sugerida ya fue ejecutada esta semana'
            });
        }

        if (!process.env.N8N_WEBHOOK_PROMOCION_SUGERIDA) {
            return res.status(500).json({
                msg: 'No está configurado el webhook de promoción sugerida'
            });
        }

        const productos = await Producto.find({
            estado: true,
            stock: { $gt: 0 }
        })
            .sort({ stock: -1 })
            .limit(3)
            .select('nombre descripcion precioVenta stock imagen');

        if (productos.length === 0) {
            return res.status(404).json({
                msg: 'No existen productos para promocionar'
            });
        }

        const clientes = await Usuario.find({
            rol: 'CLIENTE',
            estado: true
        }).select('email');

        const correos = clientes
            .map(cliente => cliente.email)
            .filter(Boolean);

        if (correos.length === 0) {
            return res.status(404).json({
                msg: 'No existen clientes para enviar promociones'
            });
        }

        await axios.post(process.env.N8N_WEBHOOK_PROMOCION_SUGERIDA, {
            tipo,
            periodo,
            productos,
            correos
        });

        const accion = await AccionesAdmin.findOneAndUpdate(
            { tipo, periodo },
            {
                tipo,
                periodo,
                estado: 'FINALIZADA',
                fechaFinalizacion: new Date()
            },
            {
                new: true,
                upsert: true
            }
        );

        return res.status(200).json({
            msg: 'Promoción sugerida ejecutada correctamente',
            totalClientes: correos.length,
            productos,
            accion
        });

    } catch (error) {
        console.error('Error al ejecutar promoción sugerida:', error);

        return res.status(500).json({
            msg: 'Error al ejecutar promoción sugerida'
        });
    }
};

const consultarAccionAdminN8n = async (req, res) => {
    try {
        const { tipo } = req.params;
        const { token } = req.query;

        if (token !== process.env.N8N_SECRET_TOKEN) {
            return res.status(401).json({
                msg: 'Token de n8n no válido'
            });
        }

        if (!tiposAcciones.includes(tipo)) {
            return res.status(400).json({
                msg: 'Tipo de acción administrativa no válido'
            });
        }

        const periodo = obtenerPeriodoActual(tipo);

        const accion = await AccionesAdmin.findOne({
            tipo,
            periodo
        });

        return res.status(200).json({
            tipo,
            periodo,
            estado: accion?.estado || 'PENDIENTE',
            debeEnviarCorreo: !accion || accion.estado === 'PENDIENTE'
        });

    } catch (error) {
        console.error('Error al consultar acción desde n8n:', error);
        return res.status(500).json({
            msg: 'Error al consultar acción desde n8n'
        });
    }
};
export {
    listarAccionesAdmin, finalizarAccionAdmin, reactivarAccionAdmin, reactivarAccionAdminN8n, consultarAccionAdminN8n, ejecutarPromocionSugerida
};