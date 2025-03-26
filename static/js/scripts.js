// Carrito functions
window.cargarProducto = function(id) {
    fetch(`/producto/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Producto no encontrado');
            }
            return response.json();
        })
        .then(producto => {
            console.log('Producto recibido:', producto); // Para depuración
            
            document.getElementById('modalProductoTitulo').textContent = `${producto.marca} ${producto.modelo}`;
            document.getElementById('modalProductoImagen').src = `/static/${producto.imagen}`;
            document.getElementById('modalProductoDescripcion').textContent = producto.descripcion;
            document.getElementById('modalProductoPrecio').textContent = `Precio: $${producto.precio.toFixed(2)}`;
            document.getElementById('modalProductoStock').textContent = `Stock: ${producto.stock}`;
            document.getElementById('modalProducto').dataset.productoId = producto.id;
            
            // Mostrar el modal
            const modal = new bootstrap.Modal(document.getElementById('modalProducto'));
            modal.show();
        })
        .catch(error => {
            console.error('Error al cargar producto:', error);
            alert('Error al cargar los detalles del producto');
        });
};
// Función para agregar al carrito
window.agregarAlCarrito = function() {
    const id = document.getElementById('modalProducto').dataset.productoId;
    const cantidad = parseInt(document.getElementById('cantidadProducto').value) || 1;
    
    fetch('/agregar_al_carrito', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            id: parseInt(id),
            cantidad: cantidad
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('Error en la respuesta');
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Cierra el modal ANTES de actualizar el carrito
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalProducto'));
            modal.hide();
            
            // Resetear el formulario del modal
            document.getElementById('cantidadProducto').value = 1;
            
            mostrarNotificacion('Producto agregado al carrito');
            actualizarCarrito();
        } else {
            throw new Error(data.error || 'Error al agregar');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarNotificacion(error.message, 'error');
    });
};

// Función para actualizar el carrito
function actualizarCarrito() {
    fetch('/cart')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar el carrito');
            }
            return response.json();
        })
        .then(data => {
            const itemsContainer = document.getElementById('items-carrito');
            itemsContainer.innerHTML = '';
            
            let total = 0;
            data.carrito.forEach(item => {
                total += item.precio * item.cantidad;
                itemsContainer.innerHTML += `
                    <div class="card mb-2">
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-2">
                                    <img src="/static/${item.imagen}" width="50" alt="${item.marca} ${item.modelo}">
                                </div>
                                <div class="col-md-6">
                                    <h6>${item.marca} ${item.modelo}</h6>
                                    <p>$${item.precio.toFixed(2)} x ${item.cantidad}</p>
                                </div>
                                <div class="col-md-4 text-end">
                                    <button class="btn btn-danger btn-sm" onclick="eliminarDelCarrito(${item.id})">
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            document.getElementById('total-carrito').textContent = total.toFixed(2);
            document.getElementById('contador-carrito').textContent = data.carrito.length;
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarNotificacion('Error al cargar el carrito', 'error');
        });
}

// Función para eliminar del carrito
window.eliminarDelCarrito = function(id) {
    fetch(`/eliminar_del_carrito/${id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al eliminar del carrito');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            actualizarCarrito();
            mostrarNotificacion('Producto eliminado del carrito');
        } else {
            throw new Error('Error al eliminar del carrito');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarNotificacion(error.message, 'error');
    });
};

// Función auxiliar para mostrar notificaciones
function mostrarNotificacion(mensaje, tipo = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${tipo} border-0`;
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${mensaje}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    const contenedor = document.getElementById('toast-container') || document.body;
    contenedor.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Inicializar el carrito al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    actualizarCarrito();
});