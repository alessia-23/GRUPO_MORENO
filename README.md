<h1 align="center">Distribuidora Grupo Moreno — Backend</h1>

<p align="center">
  <strong>Trabajo de Integración Curricular</strong> — Escuela Politécnica Nacional<br>
  Desarrollo de un sistema web basado en IA y N8N para la gestión y comercialización de artículos de oficina.
</p>

---

## Descripción

**Distribuidora Grupo Moreno** es un negocio ubicado en el sur de Quito dedicado a la venta de productos escolares y materiales de oficina. Este repositorio contiene el componente **backend** del sistema web desarrollado como parte del Trabajo de Integración Curricular

El sistema permite al negocio automatizar visualmente sus procesos internos, reducir la intervención manual, mejorar la gestión de la información y adoptar decisiones más oportunas mediante la visualización de información centralizada, organizada y en tiempo real.

---

## Recursos importantes

| Recurso | Enlace |
|---|---|
| **Formulario F_AA_233A** | [Acceder al formulario](https://epnecuador-my.sharepoint.com/:w:/g/personal/alessia_perez_epn_edu_ec/IQCM4CllupY9TJyhliPbtQKdAdduheTh6H-hxn9EeB8ui7M?e=mswwhG) |
| **Documento de tesis** | [Ver documento](https://epnecuador-my.sharepoint.com/:b:/g/personal/alessia_perez_epn_edu_ec/IQBEiHe0YTQ3Tr-p_fh-UugWAbQnOrVrby6_wTMY8hPK85I?e=mVxxH8) |
| **Video demostrativo** | [Ver video](https://www.youtube.com/watch?v=xlRkscrBpF8) |

---

## Aplicación en producción


```
https://grupo-moreno.onrender.com

```

---

## Arquitectura de backend
<img width="926" height="602" alt="image" src="https://github.com/user-attachments/assets/5a8de691-4242-44ac-9ecb-eb73a510826e" />

---

## Roles del sistema

### Administrador
- Inicio de sesión y gestión de perfil
- Gestión de vendedores y clientes
- Gestión de categorías
- Visualización de estadísticas y reporte de ventas
- Gestión de quejas y/o sugerencias
- Recomendaciones automatizadas mediante N8N

### Vendedor
- Inicio de sesión y gestión de perfil
- Gestión de productos e inventario
- Visualización de ventas realizadas
- Gestión de pedidos pendientes
- Recomendaciones al administrador

### Cliente
- Registro e inicio de sesión
- Gestión de perfil
- Visualización del catálogo de productos y categorías
- Gestión del carrito de compras
- Proceso de pago (efectivo, transferencia o tarjeta)
- Gestión de quejas y/o sugerencias

---

## Tecnologías utilizadas

### Herramientas
| Herramienta | Uso |
|---|---|
| **Node.js** | Entorno de ejecución para JavaScript en el servidor |
| **Express** | Framework web para la creación de la API REST |
| **MongoDB Atlas** | Base de datos NoSQL alojada en la nube |
| **Visual Studio Code** | Editor de código |
| **n8n** | Automatización de flujos de trabajo y alertas |
| **GitHub** | Control de versiones y repositorio |
| **Render** | Despliegue y alojamiento del backend |

### Pasos

```bash
# 1. Clonar el repositorio
git clone [https://github.com/alessia-23/grupo_moreno.git](https://github.com/alessia-23/grupo_moreno.git)

# 2. Ingresar al directorio
cd grupo_moreno

# 3. Instalar dependencias
npm install

# 4. Crear el archivo de variables de entorno
cp .env.example .env
# Edita .env con tus credenciales de MongoDB y JWT

# 5. Ejecutar en modo desarrollo
npm run dev

```

---

## Metodología — Scrum

El proyecto se desarrolló bajo el marco ágil **Scrum**, organizado en 6 sprints:

| Sprint | Descripción |
| --- | --- |
| Sprint 0 | Preparación del entorno de desarrollo |
| Sprint 1 | Gestión de cuenta para todos los roles |
| Sprint 2 | Módulos del administrador |
| Sprint 3 | Módulos del vendedor |
| Sprint 4 | Módulos del cliente |
| Sprint 5 | Pruebas y despliegue |


---

## Autora

**Alessia de los Ángeles Pérez Palacios**

* alessia.perez@epn.edu.ec

**Director:** Ing. Byron Gustavo Loarte Cajamarca, MSc.

* byron.loarteb@epn.edu.ec

**Año:** 2026

---

## Licencia

Este proyecto es público y se encuentra a disposición de la comunidad a través del repositorio institucional de la Escuela Politécnica Nacional. Los derechos patrimoniales corresponden a la autora del presente trabajo.
