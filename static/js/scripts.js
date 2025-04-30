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

// Función para abrir el modal del carrito
window.abrirCarrito = function() {
    actualizarCarrito();
    const modal = new bootstrap.Modal(document.getElementById('modalCarrito'));
    modal.show();
};

// Función para agregar al carrito 
window.agregarAlCarrito = function() {
    const id = parseInt(document.getElementById('modalProducto').dataset.productoId);
    const cantidadInput = document.getElementById('cantidadProducto');
    let cantidad = parseInt(cantidadInput.value) || 1;
    
    // Validación en el frontend
    if (cantidad <= 0) {
        mostrarNotificacion('La cantidad debe ser al menos 1', 'error');
        cantidadInput.value = 1;
        return;
    }

    fetch('/agregar_al_carrito', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            id: id,
            cantidad: cantidad
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('Error en la respuesta');
        return response.json();
    })
    .then(data => {
        if (!data.success) throw new Error(data.error || 'Error al agregar');
        
        // Cerrar modales y resetear
        const modalProducto = bootstrap.Modal.getInstance(document.getElementById('modalProducto'));
        modalProducto.hide();
        document.getElementById('cantidadProducto').value = 1;
        
        // Mostrar notificación y actualizar carrito
        mostrarNotificacion(data.message || 'Producto agregado');
        actualizarCarrito();
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarNotificacion(error.message, 'error');
    });
};

function validarCantidad(input) {
    if (input.value < 1) {
        input.value = 1;
        mostrarNotificacion('La cantidad mínima es 1', 'warning');
    }
}


// Función para actualizar el carrito
function actualizarCarrito() {
    fetch('/api/carrito')
        .then(response => response.json())
        .then(data => {
            const itemsContainer = document.getElementById('items-carrito');
            itemsContainer.innerHTML = '';
            
            let total = 0;
            data.carrito.forEach(item => {
                // Validación adicional para asegurar cantidades positivas
                const cantidad = Math.max(1, item.cantidad); // Nunca menor a 1
                const subtotal = item.precio * cantidad;
                total += subtotal;
                
                itemsContainer.innerHTML += `
                    <div class="card mb-2" data-product-id="${item.id}">
                        <div class="card-body">
                            <div class="row align-items-center">
                                <div class="col-md-2">
                                    <img src="/static/${item.imagen}" width="50" class="img-thumbnail">
                                </div>
                                <div class="col-md-4">
                                    <h6>${item.marca} ${item.modelo}</h6>
                                    <small class="text-muted">$${item.precio.toFixed(2)} c/u</small>
                                </div>
                                <div class="col-md-3">
                                    <div class="d-flex align-items-center">
                                        <button class="btn btn-sm btn-outline-secondary" 
                                                onclick="modificarCantidad(${item.id}, -1)"
                                                ${item.cantidad <= 1 ? 'disabled' : ''}>
                                            −
                                        </button>
                                        <span class="mx-2 cantidad-input">${cantidad}</span>
                                        <button class="btn btn-sm btn-outline-secondary" 
                                                onclick="modificarCantidad(${item.id}, 1)">
                                            +
                                        </button>
                                    </div>
                                </div>
                                <div class="col-md-3 text-end">
                                    <p class="mb-1">$${subtotal.toFixed(2)}</p>
                                    <button class="btn btn-sm btn-danger" 
                                            onclick="eliminarDelCarrito(${item.id}, true)">
                                        Eliminar<i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            // Asegurar total no negativo
            document.getElementById('total-carrito').textContent = Math.max(0, total).toFixed(2);
            const totalItems = data.carrito.reduce((sum, item) => sum + Math.max(1, item.cantidad), 0);
            document.getElementById('contador-carrito').textContent = Math.max(0, totalItems);
        });
}

// Nueva función para modificar cantidades
window.modificarCantidad = function(id, delta) {
    const cantidadInput = document.querySelector(`.card[data-product-id="${id}"] .cantidad-input`);
    const cantidadActual = parseInt(cantidadInput.textContent);
    
    // Validación en el frontend
    if (cantidadActual + delta <= 0) {
        if (confirm('¿Eliminar este producto del carrito?')) {
            eliminarDelCarrito(id, true);
        }
        return;
    }

    fetch('/agregar_al_carrito', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            id: id,
            cantidad: delta
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('Error en la respuesta');
        return response.json();
    })
    .then(data => {
        if (!data.success) throw new Error(data.error || 'Error al modificar');
        actualizarCarrito();
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarNotificacion(error.message, 'error');
    });
};

// Función para eliminar del carrito
window.eliminarDelCarrito = function(id, eliminarTodos = false) {
    fetch(`/eliminar_del_carrito/${id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            eliminar_todos: eliminarTodos
        })
    })
    .then(response => response.json())
    .then(data => {
        actualizarCarrito();
        mostrarNotificacion(eliminarTodos ? 
            'Producto eliminado' : 
            'Una unidad eliminada');
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarNotificacion('Error al eliminar', 'error');
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