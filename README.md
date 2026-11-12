# Nexfood — Menú Digital Móvil (NF 24 HORAS)

Aplicación web optimizada para pedidos rápidos desde teléfonos móviles con separación por categorías, tirilla PDF para repartidores y envío directo por WhatsApp.

---

## 📁 Estructura del Proyecto

Organizado según las mejores prácticas de desarrollo web modular:

```text
nexfood/
├── index.html           # Vista principal ultra rápida y directa a las categorías
├── abrir.bat            # Acceso directo para abrir la app en tu navegador
├── css/
│   ├── variables.css    # Paleta de colores, tokens de espaciado y modo luz/oscuro
│   ├── base.css         # Reseteo CSS, tipografía base y estructura fluida
│   ├── components.css   # Barra superior de búsqueda, drawer del carrito y checkout modal
│   └── mobile.css       # Hub táctil de categorías en tarjetas y catálogo desplegable
├── js/
│   ├── data.js          # Base de datos de productos (220+), categorías y efectos animados
│   ├── assets.js        # Fuentes y logotipo vectorial para la tirilla
│   ├── jspdf.min.js     # Librería para generación de documentos PDF (80 mm)
│   ├── ticket.js        # Generador de tirilla térmica con datos para el repartidor
│   ├── cart.js          # Estado reactivo del carrito, totales y audio feedback
│   ├── checkout.js      # Formulario de entrega, cálculo de vuelto en efectivo y WhatsApp
│   └── app.js           # Enrutamiento móvil, búsqueda en tiempo real y favoritos
└── README.md            # Documentación del proyecto
```

---

## ⚡ Optimizaciones Clave

1. **Modo Predeterminado "Con Luz" (Light Mode)**:
   - La aplicación inicia siempre en modo claro con alto contraste y colores nítidos. Si el usuario lo desea, puede alternar al modo oscuro con un solo toque.
2. **Cero Sobrecarga de Datos (0 KB de imágenes externas)**:
   - Se eliminaron las fotos pesadas de Unsplash. Se reemplazaron por ilustraciones animadas ligeras con sombras pulsantes y efectos temáticos (vapor, fuego, burbujas, chispas).
3. **Dirección Obligatoria**:
   - En el formulario de pedido, la **Dirección de entrega** ahora es un campo obligatorio (`*`) validado antes de enviar.
4. **Check Rápido de Envío**:
   - Selector táctil para decidir si se cobra el envío a domicilio (€3.99) o si es gratis / para recoger en local (€0.00). Los cálculos de total, billetes de vuelto, mensaje de WhatsApp y tirilla PDF se recalculan al instante.
5. **Notas Predeterminadas con Checks + Campo Libre**:
   - Botones rápidos para marcar instrucciones comunes en 1 toque:
     - 🥫 Más salsas y cremas
     - 🧅 Sin cebolla
     - 🌶️ Sin picante
     - 🧂 Salsas aparte
     - 🔔 Llamar al telefonillo
     - 🚪 Dejar en la puerta
     - 🍴 Servilletas y cubiertos
     - 🧊 Bebidas bien frías
     - 🥩 Carne bien hecha
     - 🥓 Bacon crujiente
   - Campo de texto libre para indicaciones adicionales específicas (alergias, timbres, etc.).
6. **Tirilla PDF para Repartidor**:
   - Datos del cliente destacados (Nombre, Teléfono, Dirección completa, Piso/Habitación).
   - Forma de pago con letra grande. Si es efectivo, indica claramente el monto con el que paga y el vuelto exacto a entregar. Si no se cobró envío, indica `DOMICILIO: GRATIS`.

---

## 🚀 Cómo ejecutarlo

1. **Opción rápida**: Haz doble clic en el archivo `abrir.bat`.
2. **Opción manual**: Haz doble clic directamente sobre `index.html`.
