// Agregar un nuevo componente para girar y hacer zoom
AFRAME.registerComponent('interaction-handler', {
    // Definir las propiedades configurables del esquema
    schema: {
        rotationSpeed: { type: 'number', default: 0.5 }, // Velocidad de rotación por defecto
        zoomSpeed: { type: 'number', default: 0.1 }, // Velocidad de zoom por defecto
        minScale: { type: 'number', default: 0.1 }, // Escala mínima del modelo 3D
        maxScale: { type: 'number', default: 5 } // Escala máxima del modelo 3D
    },
    //Inicialización del componente
    init: function () {
        // Estado inicial de los eventos
        this.state = { rotating: false, zooming: false, prevPos: {}, initDist: 0, scale: this.data.minScale };
        
        // Vincular eventos de la escena a sus correspondientes manejadores 
        this.bindEvents();
    },
    // Asignar eventos a la escena
    bindEvents: function () {
        const sceneEl = this.el.sceneEl;
        const events = {
            mousemove: e => this.handleInteraction(e.clientX, e.clientY, 'rotate'), // Manejar rotación con el mouse
            mousedown: e => this.setState('rotating', { x: e.clientX, y: e.clientY }), // Iniciar rotación con el mouse
            mouseup: () => this.resetState(), // Finalizar rotación
            touchstart: e => this.handleTouchStart(e), // Manejar inicio de toques
            touchmove: e => this.handleTouchMove(e), // Manejar movimientos táctiles
            touchend: () => this.resetState(), // Reiniciar estado al soltar los toques
            wheel: e => this.zoom(e.deltaY * -1) // Manejar zoom con la rueda del mouse
        };
        // Asociar los eventos a la escena
        Object.entries(events).forEach(([type, handler]) => sceneEl.addEventListener(type, handler));
    },
    // Cambiar el estado según el valor dado
    setState: function (key, value) {
        // Si el valor recibido es un objeto, asignar las coordenadas de la posición previa
        if (typeof value === 'object') this.state.prevPos = value;
        this.state[key] = !!value; // Convertir valor a booleano y actualizar estado
    },
    // Reiniciar los estados de interacción al finalizar
    resetState: function () {
        this.setState('rotating', false); // Desactivar modo de rotación
        this.setState('zooming', false); // Desactivar modo de zoom
    },
    // Manejar interacción de rotación
    handleInteraction: function (x, y, mode) {
        // Salir si no está en modo rotación y el modo es 'rotate'
        if (!this.state.rotating && mode === 'rotate') return;
        
        const { x: prevX, y: prevY } = this.state.prevPos; // Obtener posición previa
        const rotation = this.el.getAttribute('rotation'); // Obtener la rotación actual del elemento

        // Calcular la nueva rotación y aplicarlo al modelo 3D
        this.el.setAttribute('rotation', {
            x: rotation.x - (y - prevY) * this.data.rotationSpeed, // Rotación en X
            y: rotation.y + (x - prevX) * this.data.rotationSpeed, // Rotación en Y
            z: 0 // Rotación en Z fija
        });
        this.state.prevPos = { x, y }; // Actualizar la posición previa
    },
    // Función para realizar zoom en el modelo 3D
    zoom: function (delta) {
        // Calcular el nuevo tamaño del modelo respetando los límites establecidos
        const newScale = Math.min(
            Math.max(this.state.scale + delta * this.data.zoomSpeed, this.data.minScale),
            this.data.maxScale
        );
        if (newScale !== this.state.scale) { // Si la escala cambia, se actualiza
            this.state.scale = newScale; // Guardar la nueva escala (tamaño)
            this.el.setAttribute('scale', `${newScale} ${newScale} ${newScale}`); // Aplicar escala
        }
    },
    // Manejar inicio de interacciones táctiles (rotación o zoom)
    handleTouchStart: function (e) {
        // Un dedo: modo rotación
        if (e.touches.length === 1) this.setState('rotating', { x: e.touches[0].clientX, y: e.touches[0].clientY });
        // Dos dedos: modo zoom
        else if (e.touches.length === 2) {
            this.state.zooming = true; // Activar el modo zoom
            this.state.initDist = this.getTouchDistance(e.touches); // Calcular la distancia inicial del modelo 3D
        }
    },
    // Manejar movimientos táctiles (rotación o zoom)
    handleTouchMove: function (e) {
        // Un dedo: rotación
        if (e.touches.length === 1) this.handleInteraction(e.touches[0].clientX, e.touches[0].clientY, 'rotate');
        // Dos dedos: zoom
        else if (e.touches.length === 2 && this.state.zooming) {
            const dist = this.getTouchDistance(e.touches); // Calcular la nueva distancia entre dedos
            this.zoom((dist - this.state.initDist) * this.data.zoomSpeed); // Ajustar el zoom
            this.state.initDist = dist; // Actualizar la distancia inicial
        }
    },
    // Calcular la distancia entre los puntos de contacto
    getTouchDistance: function (touches) {
        const [t1, t2] = touches; // Obtener las posiciones táctiles
        return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY); // Calcular la distancia entre las posiciones táctiles
    }
});

/*
// Componente para aplicar rotación y zoom
AFRAME.registerComponent('interaction-handler', {
    schema: {
        rotationSpeed: { type: 'number', default: 0.5 },  // Velocidad de rotación por píxel
        zoomSpeed: { type: 'number', default: 0.1 },    // Velocidad de zoom para la rueda del mouse o toque
        minScale: { type: 'number', default: 0.1 },     // Escala mínima del objeto 3D
        maxScale: { type: 'number', default: 5 }        // Escala máxima del objeto 3D
    },
    init: function () {
        this.isRotating = false;  // Indicar si el objeto 3D está rotando
        this.previousMousePosition = { x: 0, y: 0 };   // Almacenar la posición anterior del mouse/tacto
        this.scale = 1;   // Escala actual del objeto 3D

        // Agregar los eventos para la interacciones
        this.el.sceneEl.addEventListener('wheel', this.onZoom.bind(this));  // Rueda del mouse para zoom
        this.el.sceneEl.addEventListener('mousedown', this.onMouseDown.bind(this));  // Hacer clic para iniciar rotación
        this.el.sceneEl.addEventListener('mouseup', this.onMouseUp.bind(this));  // Dejar de hacer clic para detener rotación
        this.el.sceneEl.addEventListener('mousemove', this.onMouseMove.bind(this));  // Movimiento del mouse para rotación
        this.el.sceneEl.addEventListener('touchstart', this.onTouchStart.bind(this));  // Toque inicial para empezar la interacción
        this.el.sceneEl.addEventListener('touchmove', this.onTouchMove.bind(this));  // Movimiento del toque para rotación y zoom
        this.el.sceneEl.addEventListener('touchend', this.onTouchEnd.bind(this));  // Toque final para detener interacción
    },
    onMouseDown: function (event) {
        this.isRotating = true;  // Iniciar la rotación cuando se presiona el mouse
        this.previousMousePosition = { x: event.clientX, y: event.clientY };  // Guardar la posición inicial del mouse
    },
    onMouseUp: function () {
        this.isRotating = false;  // Detener la rotación
    },
    onMouseMove: function (event) {
        if (!this.isRotating) return;  // Si no se está rotando, no se hace nada

        const deltaMove = {  // Calcular el movimiento del mouse
            x: event.clientX - this.previousMousePosition.x,
            y: event.clientY - this.previousMousePosition.y
        };

        const rotation = this.el.getAttribute('rotation');  // Obtener la rotación actual del objeto 3D
        this.el.setAttribute('rotation', {  // Establecer la nueva rotación
            x: rotation.x - deltaMove.y * this.data.rotationSpeed,  // Rotación en el eje X
            y: rotation.y + deltaMove.x * this.data.rotationSpeed,  // Rotación en el eje Y
            z: rotation.z  // Rotación en el eje Z (sin cambio)
        });

        this.previousMousePosition = { x: event.clientX, y: event.clientY };  // Actualizar la posición anterior del mouse
    },
    onTouchStart: function (event) {
        // Iniciar la rotación o zoom cuando se detecta el toque
        if (event.touches.length === 1) {
            this.isRotating = true;  // Iniciar la rotación con un solo toque
            this.previousMousePosition = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
        } else if (event.touches.length === 2) {
            this.isZooming = true;  // Iniciar el zoom con dos toques
            this.initialDistance = this.getDistance(event.touches);  // Calcular la distancia inicial entre los dos dedos
        }
    },
    onTouchMove: function (event) {
        // Realizar la rotación o zoom basado en el movimiento de los dedos
        if (this.isRotating && event.touches.length === 1) {
            // Rotación en modo táctil
            const deltaMove = {
                x: event.touches[0].clientX - this.previousMousePosition.x,
                y: event.touches[0].clientY - this.previousMousePosition.y
            };

            const rotation = this.el.getAttribute('rotation');
            this.el.setAttribute('rotation', {
                x: rotation.x - deltaMove.y * this.data.rotationSpeed,
                y: rotation.y + deltaMove.x * this.data.rotationSpeed,
                z: rotation.z
            });

            this.previousMousePosition = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
        } else if (this.isZooming && event.touches.length === 2) {
            // Aplicar zoom en modo táctil
            const currentDistance = this.getDistance(event.touches);  // Calcula la distancia actual entre los dedos
            const scaleChange = (currentDistance - this.initialDistance) * this.data.zoomSpeed;  // Cambio de escala

            this.scale = Math.min(  // Asegurar que la escala esté entre los límites
                Math.max(this.scale + scaleChange, this.data.minScale),
                this.data.maxScale
            );

            this.el.setAttribute('scale', `${this.scale} ${this.scale} ${this.scale}`);  // Establecer nueva escala
            this.initialDistance = currentDistance;  // Actualizar la distancia inicial para el siguiente cálculo
        }
    },
    onTouchEnd: function () {
        this.isRotating = false;  // Detener la rotación
        this.isZooming = false;  // Detener el zoom
    },
    onZoom: function (event) {
        const scaleChange = -event.deltaY * this.data.zoomSpeed;  // Calcular el cambio de escala con la rueda del mouse

        this.scale = Math.min(
            Math.max(this.scale + scaleChange, this.data.minScale),
            this.data.maxScale
        );

        this.el.setAttribute('scale', `${this.scale} ${this.scale} ${this.scale}`);  // Actualizar la escala del objeto 3D
    },
    getDistance: function (touches) {
        const dx = touches[0].clientX - touches[1].clientX;  // Diferencia en X entre los dedos
        const dy = touches[0].clientY - touches[1].clientY;  // Diferencia en Y entre los dedos
        return Math.sqrt(dx * dx + dy * dy);  // Calcular la distancia entre los dedos
    }
});*/