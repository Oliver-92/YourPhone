# Estructura del proyecto

```plaintext
celulares_web/
│
├── app.py                  # Archivo principal de la aplicación Flask
├── requirements.txt        # Archivo con las dependencias del proyecto
├── README.md               # Documentación del proyecto
│
├── static/                 # Carpeta para archivos estáticos (CSS, JS, imágenes)
│   ├── css/                # Archivos CSS
│   │   └── styles.css      # Estilos personalizados
│   ├── js/                 # Archivos JavaScript
│   │   └── scripts.js      # Scripts personalizados
│   └── img/                # Imágenes del sitio web
│       └── logo.png        # Logo del sitio
│
├── templates/              # Carpeta para las plantillas HTML
│   ├── base.html           # Plantilla base para las páginas
│   ├── index.html          # Página inicial
│   ├── product_detail.html # Modal de descripción del producto
│   ├── cart.html           # Página del carrito de compras
│   ├── admin.html          # Página de administración (CRUD)
│   └── partials/           # Fragmentos de HTML reutilizables
│       ├── navbar.html     # Barra de navegación
│       ├── footer.html     # Pie de página
│       └── modal.html      # Modal genérico
│
├── database/               # Carpeta para la base de datos
│   └── db.sqlite           # Base de datos SQLite
│
└── models/                 # Carpeta para los modelos de la base de datos
    └── product.py          # Modelo de producto
```