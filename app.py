from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from werkzeug.utils import secure_filename
import sqlite3
import os

app = Flask(__name__)
app.secret_key = 'tu_clave_secreta_aqui'  # Clave secreta para las sesiones

# Credenciales del administrador (esto debería ser más seguro en producción)
ADMIN_USERNAME = 'admin'
ADMIN_PASSWORD = 'admin123'

# Configuración para la subida de imágenes
app.config['UPLOAD_FOLDER'] = 'static/img'  # Carpeta donde se guardarán las imágenes
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif', 'webp'}  # Extensiones permitidas

# Función para verificar extensiones permitidas
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# Función para conectar a la base de datos
def get_db_connection():
    conn = sqlite3.connect('database/db.sqlite')
    conn.row_factory = sqlite3.Row
    return conn

# Ruta para el login del administrador
@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            session['admin_logged_in'] = True
            flash('Inicio de sesión exitoso', 'success')
            return redirect(url_for('admin'))
        else:
            flash('Credenciales incorrectas', 'danger')
    return render_template('admin_login.html')

# Ruta para el logout del administrador
@app.route('/admin/logout')
def admin_logout():
    session.pop('admin_logged_in', None)
    flash('Sesión cerrada', 'success')
    return redirect(url_for('index'))

# Ruta para la página de administración (protegida)
@app.route('/admin')
def admin():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_login'))

    conn = get_db_connection()
    productos = conn.execute('SELECT * FROM productos').fetchall()
    conn.close()
    return render_template('admin.html', productos=productos)

# app.py
# Ruta para agregar un producto
@app.route('/admin/agregar', methods=['GET', 'POST'])
def agregar_producto():
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_login'))

    if request.method == 'POST':
        marca = request.form['marca']
        modelo = request.form['modelo']
        precio = float(request.form['precio'])
        descripcion = request.form['descripcion']
        stock = int(request.form['stock'])

        # Manejar la subida de la imagen
        if 'imagen' in request.files:
            imagen = request.files['imagen']
            if imagen.filename != '' and allowed_file(imagen.filename):
                filename = secure_filename(imagen.filename)  # Asegurar el nombre del archivo
                imagen.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                imagen_path = f'img/{filename}'
            else:
                imagen_path = 'img/default.webp'  # Imagen por defecto si no se sube ninguna o no es válida
        else:
            imagen_path = 'img/default.webp'

        conn = get_db_connection()
        conn.execute('INSERT INTO productos (marca, modelo, precio, descripcion, stock, imagen) VALUES (?, ?, ?, ?, ?, ?)',
                     (marca, modelo, precio, descripcion, stock, imagen_path))
        conn.commit()
        conn.close()
        flash('Producto agregado correctamente', 'success')
        return redirect(url_for('admin'))

    return render_template('agregar_producto.html')

# Ruta para editar un producto
@app.route('/admin/editar/<int:id>', methods=['GET', 'POST'])
def editar_producto(id):
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_login'))

    conn = get_db_connection()
    producto = conn.execute('SELECT * FROM productos WHERE id = ?', (id,)).fetchone()

    if request.method == 'POST':
        marca = request.form['marca']
        modelo = request.form['modelo']
        precio = float(request.form['precio'])
        descripcion = request.form['descripcion']
        stock = int(request.form['stock'])

        # Manejar la subida de la imagen
        if 'imagen' in request.files:
            imagen = request.files['imagen']
            if imagen.filename != '' and allowed_file(imagen.filename):
                filename = secure_filename(imagen.filename)  # Asegurar el nombre del archivo
                imagen.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                imagen_path = f'img/{filename}'
            else:
                imagen_path = producto['imagen']  # Mantener la imagen actual si no se sube una nueva
        else:
            imagen_path = producto['imagen']

        conn.execute('UPDATE productos SET marca = ?, modelo = ?, precio = ?, descripcion = ?, stock = ?, imagen = ? WHERE id = ?',
                     (marca, modelo, precio, descripcion, stock, imagen_path, id))
        conn.commit()
        conn.close()
        flash('Producto actualizado correctamente', 'success')
        return redirect(url_for('admin'))

    conn.close()
    return render_template('editar_producto.html', producto=producto)

# Ruta para eliminar un producto
@app.route('/admin/eliminar/<int:id>')
def eliminar_producto(id):
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_login'))

    conn = get_db_connection()
    conn.execute('DELETE FROM productos WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    flash('Producto eliminado correctamente', 'success')
    return redirect(url_for('admin'))

# Ruta para la página de inicio
@app.route('/')
def index():
    conn = get_db_connection()
    productos = conn.execute('SELECT * FROM productos').fetchall()
    conn.close()
    return render_template('index.html', productos=productos)

# Ruta para la página de productos
@app.route('/productos')
def productos():
    conn = get_db_connection()
    productos = conn.execute('SELECT * FROM productos').fetchall()
    conn.close()
    return render_template('productos.html', productos=productos)

# Ruta para ver los detalles de un producto
@app.route('/producto/<int:id>')
def producto(id):
    conn = get_db_connection()
    producto = conn.execute('SELECT * FROM productos WHERE id = ?', (id,)).fetchone()
    conn.close()
    
    if producto is None:
        return jsonify({'error': 'Producto no encontrado'}), 404
    
    # Convertir el objeto Row a dict y asegurar que el precio es float
    producto_dict = dict(producto)
    producto_dict['precio'] = float(producto_dict['precio'])
    
    return jsonify(producto_dict)

# Ruta para ver el carrito
@app.route('/api/carrito', methods=['GET'])
def api_carrito():
    carrito = session.get('carrito', [])
    total = sum(item['precio'] * item['cantidad'] for item in carrito)
    return jsonify({
        'carrito': carrito,
        'total': total
    })

# Ruta para agregar un producto al carrito
@app.route('/agregar_al_carrito', methods=['POST'])
def agregar_al_carrito():
    try:
        data = request.get_json()
        id = int(data['id'])
        cantidad = int(data.get('cantidad', 1))
        
        # Validación de cantidad
        if cantidad == 0:
            return jsonify({'success': False, 'error': 'La cantidad no puede ser cero'}), 400
            
        conn = get_db_connection()
        producto = conn.execute('SELECT * FROM productos WHERE id = ?', (id,)).fetchone()
        conn.close()

        if not producto:
            return jsonify({'success': False, 'error': 'Producto no encontrado'}), 404

        if 'carrito' not in session:
            session['carrito'] = []

        producto_dict = dict(producto)
        item_idx = next((i for i, item in enumerate(session['carrito']) if item['id'] == id), None)

        if item_idx is not None:
            # Validar que no quede cantidad negativa
            nueva_cantidad = session['carrito'][item_idx]['cantidad'] + cantidad
            if nueva_cantidad <= 0:
                # Eliminar el producto si la cantidad sería <= 0
                session['carrito'].pop(item_idx)
                mensaje = 'Producto eliminado del carrito'
            else:
                # Actualizar cantidad
                session['carrito'][item_idx]['cantidad'] = nueva_cantidad
                mensaje = 'Cantidad actualizada'
        else:
            if cantidad <= 0:
                return jsonify({'success': False, 'error': 'Cantidad inválida'}), 400
            session['carrito'].append({
                'id': id,
                'marca': producto_dict['marca'],
                'modelo': producto_dict['modelo'],
                'precio': float(producto_dict['precio']),
                'imagen': producto_dict['imagen'],
                'cantidad': cantidad
            })
            mensaje = 'Producto agregado al carrito'

        session.modified = True
        return jsonify({
            'success': True,
            'carrito': session['carrito'],
            'message': mensaje
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Ruta para eliminar un producto del carrito
@app.route('/eliminar_del_carrito/<int:id>', methods=['POST'])
def eliminar_del_carrito(id):
    try:
        if 'carrito' not in session:
            return jsonify({'success': False, 'error': 'Carrito no existe'}), 404

        data = request.get_json()
        eliminar_todos = data.get('eliminar_todos', False)

        # Encontrar todos los ítems con ese ID
        items_a_eliminar = [i for i, item in enumerate(session['carrito']) if item['id'] == id]

        if not items_a_eliminar:
            return jsonify({'success': False, 'error': 'Producto no encontrado en carrito'}), 404

        if eliminar_todos:
            # Eliminar todas las ocurrencias
            session['carrito'] = [item for item in session['carrito'] if item['id'] != id]
        else:
            # Eliminar solo una unidad del primer ítem encontrado
            idx = items_a_eliminar[0]
            if session['carrito'][idx]['cantidad'] > 1:
                session['carrito'][idx]['cantidad'] -= 1
            else:
                session['carrito'].pop(idx)

        session.modified = True
        return jsonify({
            'success': True,
            'carrito': session['carrito']
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Ruta para la página de contacto
@app.route('/contacto')
def contacto():
    return render_template('contacto.html')

if __name__ == '__main__':
    app.run(debug=True)