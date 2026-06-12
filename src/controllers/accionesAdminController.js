import AccionesAdmin from '../models/AccionesAdmin.js';

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

    if (tipo === 'BAJO_NUMERO_VENTAS') {
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
export {
    listarAccionesAdmin, finalizarAccionAdmin,reactivarAccionAdmin
};