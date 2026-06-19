import axios from 'axios';
import Producto from '../models/Producto.js';

// Genera recomendaciones usando IA a partir del producto visualizado
const recomendarPorProducto = async (req, res) => {
    try {
        const { productoId } = req.params;

        // Buscar producto actual
        const productoActual = await Producto.findById(productoId)
            .populate('categoria', 'nombre');

        if (!productoActual) {
            return res.status(404).json({
                msg: 'Producto no encontrado'
            });
        }

        // Obtener productos disponibles para recomendar
        const productosDisponibles = await Producto.find({
            _id: { $ne: productoId },
            estado: true,
            stock: { $gt: 0 }
        })
            .select('nombre descripcion precioVenta stock imagen categoria marca color material tamanio presentacion')
            .populate('categoria', 'nombre')
            .limit(30);

        if (productosDisponibles.length === 0) {
            return res.status(200).json({
                msg: 'No hay productos disponibles para recomendar',
                recomendaciones: []
            });
        }

        // Preparar catálogo real para enviarlo a la IA
        const catalogo = productosDisponibles.map((p) => ({
            id: p._id.toString(),
            nombre: p.nombre,
            categoria: p.categoria?.nombre || 'Sin categoría',
            marca: p.marca || '',
            color: p.color || '',
            material: p.material || '',
            tamanio: p.tamanio || '',
            presentacion: p.presentacion || '',
            descripcion: p.descripcion || ''
        }));

        const prompt = `
Eres un asistente de recomendaciones para una distribuidora de productos escolares, oficina y papelería.

Producto que el cliente está viendo:
${productoActual.nombre}

Catálogo real disponible:
${JSON.stringify(catalogo, null, 2)}

Elige máximo 4 productos del catálogo real que podrían interesarle al cliente.
No inventes productos.
No cambies los ids.
No recomiendes el mismo producto actual.
No importa si no son perfectamente relacionados, pueden ser productos de interés general, escolares, oficina o papelería.

Responde SOLO en JSON válido con este formato:
{
  "recomendaciones": [
    {
      "productoId": "id exacto del producto",
      "motivo": "explicación corta y natural"
    }
  ]
}
`;

        // Consultar IA para generar recomendaciones
        const respuestaIA = await axios.post(
            'https://text.pollinations.ai/openai',
            {
                model: process.env.POLLINATIONS_MODEL || 'openai',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.4
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.POLLINATIONS_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const contenido = respuestaIA.data.choices[0].message.content;

        let dataIA;

        // Convertir respuesta de IA a JSON
        try {
            dataIA = JSON.parse(contenido);
        } catch {
            return res.status(500).json({
                msg: 'La IA no devolvió un JSON válido',
                respuestaIA: contenido
            });
        }

        // Obtener ids recomendados por la IA
        const idsRecomendados = dataIA.recomendaciones
            ?.map((r) => r.productoId)
            .filter(Boolean) || [];

        // Buscar productos recomendados reales en la base
        const productosRecomendados = await Producto.find({
            _id: { $in: idsRecomendados },
            estado: true,
            stock: { $gt: 0 }
        })
            .select('nombre descripcion precioVenta stock imagen categoria marca color material tamanio presentacion')
            .populate('categoria', 'nombre');

        // Construir respuesta final para el frontend
        const recomendaciones = productosRecomendados.map((producto) => {
            const motivoIA = dataIA.recomendaciones.find(
                (r) => r.productoId === producto._id.toString()
            );

            return {
                _id: producto._id,
                nombre: producto.nombre,
                descripcion: producto.descripcion,
                precioVenta: producto.precioVenta,
                stock: producto.stock,
                imagen: producto.imagen,
                categoria: producto.categoria,
                marca: producto.marca,
                color: producto.color,
                material: producto.material,
                tamanio: producto.tamanio,
                presentacion: producto.presentacion,
                motivo: motivoIA?.motivo || 'También podría interesarte este producto.',
                urlProducto: `/producto/${producto._id}`
            };
        });

        return res.status(200).json({
            msg: 'Recomendaciones generadas correctamente',
            titulo: 'Productos que te pueden interesar',
            productoBase: {
                _id: productoActual._id,
                nombre: productoActual.nombre
            },
            recomendaciones
        });

    } catch (error) {
        return res.status(500).json({
            msg: 'Error al generar recomendaciones con IA',
            error: error.response?.data || error.message
        });
    }
};

export {
    recomendarPorProducto
};