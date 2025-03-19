# models/product.py
import sqlite3

# Conectar a la base de datos (se creará si no existe)
conn = sqlite3.connect('database/db.sqlite')
cursor = conn.cursor()

# Crear la tabla de productos
cursor.execute('''
CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    precio REAL NOT NULL,
    descripcion TEXT NOT NULL,
    stock INTEGER NOT NULL,
    imagen TEXT NOT NULL  -- Nuevo campo para la ruta de la imagen
)
''')

# Guardar los cambios y cerrar la conexión
conn.commit()
conn.close()