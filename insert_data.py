# insert_data.py
import sqlite3

# Conectar a la base de datos
conn = sqlite3.connect('database/db.sqlite')
cursor = conn.cursor()

# Insertar datos de prueba con imágenes
cursor.execute('''
INSERT INTO productos (marca, modelo, precio, descripcion, stock, imagen)
VALUES 
    ('Samsung', 'Galaxy S21', 799.99, 'Un teléfono potente con una cámara increíble.', 10, 'img/samsung_galaxy_s21.webp'),
    ('Apple', 'iPhone 13', 999.99, 'El último iPhone con pantalla Super Retina XDR.', 15, 'img/iphone_13.webp'),
    ('Xiaomi', 'Mi 11', 699.99, 'Un teléfono Android con excelente relación calidad-precio.', 20, 'img/xiaomi_mi_11.webp')
''')

# Guardar los cambios y cerrar la conexión
conn.commit()
conn.close()