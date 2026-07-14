<h1 align="center">Distribuidora Grupo Moreno — Backend</h1>

<p align="center">
  <strong>Trabajo de Integración Curricular</strong> — Escuela Politécnica Nacional<br>
  Desarrollo de un sistema web basado en IA y N8N para la gestión y comercialización de artículos de oficina para el negocio "Distribuidaora Grupo Moreno".
</p>

---

## Descripción

**Distribuidora Grupo Moreno** es un negocio ubicado en el sur de Quito dedicado a la venta de productos escolares y materiales de oficina. Este repositorio contiene el componente **backend** del sistema web desarrollado como parte del Trabajo de Integración Curricular

Dicho sistema permite al negocio automatizar visualmente sus procesos internos, reducir la intervención manual, mejorar la gestión de la información y adoptar decisiones más oportunas mediante la visualización de información centralizada, organizada y en tiempo real.

---

## Recursos importantes

| Recurso | Enlace |
|---|---|
| **Formulario F_AA_233** | [Acceder al formulario](https://epnecuador-my.sharepoint.com/:b:/g/personal/alessia_perez_epn_edu_ec/IQCAFNUv4dX4SKgZape9b8RUAXr6WWIXGsodIXP9Jvt-GU0?e=aTEQ8f) |
| **Formulario F_AA_234** | [Acceder al formulario](https://epnecuador-my.sharepoint.com/:b:/g/personal/alessia_perez_epn_edu_ec/IQDd4hdPAA77RbavFUoM6WJXAa2-L5wkmpIxU-dtpI2VU70?e=uFDYFz) |
| **Formulario F_AA_236** | [Acceder al formulario](https://epnecuador-my.sharepoint.com/:b:/g/personal/alessia_perez_epn_edu_ec/IQB-Ki1Pg_LqQ5FdvYT-qJuWASMqIk8TuQXKRQRSUa4CJRg?e=W6Jwxo) |
| **Documento de tesis** | [Ver documento](https://epnecuador-my.sharepoint.com/:b:/g/personal/alessia_perez_epn_edu_ec/IQCwCGZFEn3QTZAK-q3khI5SAYFBXTmo33PnHdWUFEqcE5M?e=9PNuCE) |
| **Certificado IA** | [Ver documento](https://epnecuador-my.sharepoint.com/:b:/g/personal/alessia_perez_epn_edu_ec/IQC8Ch8BhjaNQrRrOuHNDsxAASiKBtz1o-FVhsaBB8H6jrg?e=stHDww) |
| **Turnitin** | [Ver documento](https://epnecuador-my.sharepoint.com/:b:/g/personal/alessia_perez_epn_edu_ec/IQBk-pwkWxOISpzjXsqFqizUATP5KTkPE4nHtwJl7VC3QHM?e=4JlsoA) |
| **Video demostrativo** | [Ver video](https://www.youtube.com/watch?v=xlRkscrBpF8) |

---

## Aplicación en producción


```
https://grupo-moreno.onrender.com

```

---

## Patrón arquitectónico
<img width="700" height="400" alt="image" src="https://github.com/user-attachments/assets/000351c3-fc73-4f5f-8daa-57ddeb3a7b6f" />


---

## Roles del sistema

### Administrador
- Inicio de sesióngestión de perfil
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

<img width="700" height="430" alt="image" src="https://github.com/user-attachments/assets/a3d52940-b21c-4fb0-aff2-708de9afe8ba" />

---

### Herramientas
| Herramienta | Uso |
|---|---|
| **Node.js** | Entorno de ejecución para JavaScript en el servidor |
| **Express** | Framework web para la creación de la API REST |
| **Cloudinary**| Almacenamiento de imágenes|
| **MongoDB Atlas** | Base de datos NoSQL alojada en la nube |
| **Visual Studio Code** | Editor de código |
| **n8n** | Automatización de flujos de trabajo y alertas |
| **GitHub** | Control de versiones y repositorio |
| **Render** | Despliegue y alojamiento del backend |


---

## Arquitectura de automatización y flujos (Muestra de flujos)

El núcleo del sistema backend integra un total de 8 flujos de trabajo mediante **n8n**. A continuación, se presenta una muestra de 3 de los flujos implementados como ejemplo de la arquitectura:

| Caso de uso / Flujo en n8n | Vista del flujo (Lienzo de nodos) |
|---|---|
| **Alertas automatizadas de stock bajo**| <img width="700" height="400" alt="image" src="https://github.com/user-attachments/assets/201e4ad9-49f7-4f6d-be75-f6f7bec26d59" />|
| **Recordatorio de pago al SRI**| <img width="700" height="400" alt="image" src="https://github.com/user-attachments/assets/7703b197-e25a-41ee-b0b8-2257c8389741" />|
| **Envio de credenciales al correo del vendedor** | <img width="700" height="400" alt="image" src="https://github.com/user-attachments/assets/228b68a8-5bad-417c-a38f-a8beed5be072" />|

---

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/alessia-23/grupo_moreno.git

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


