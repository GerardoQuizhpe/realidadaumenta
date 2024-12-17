// Agregar un nuevo componente para girar y hacer zoom
AFRAME.registerComponent('interaction-handler', {
    // Definir las propiedades configurables del esquema
    schema: {
        rotationSpeed: {type: 'number', default: 0.5}, // Velocidad de rotación
        zoomSpeed: {type: 'number', default: 0.001}, // Velocidad de zoom
        moveSpeed: {type: 'number', default: 0.01}, // Velocidad de movimiento
        minScale: {type: 'number', default: 0.1}, // Escala mínima del modelo 3D
        maxScale: {type: 'number', default: 3} // Escala máxima del modelo 3D
    },
    //Inicialización del componente
    init: function () {
        // Estado inicial de los eventos
        this.state = { 
            rotating: false, 
            zooming: false, 
            moving: false, 
            prevPos: {x: 0, y: 0}, 
            initDist: 0, 
            scale: this.data.minScale, 
            lastClickTime: 0}; // Para detectar el doble click
        
        // Vincular eventos de la escena a sus correspondientes manejadores 
        this.bindEvents();
    },
    // Asignar eventos a la escena
    bindEvents: function () {
        const sceneEl = this.el.sceneEl;
        const events = {
            mousemove: e => this.handleInteraction(e.clientX, e.clientY), // Manejar interacciones (rotación o movimiento)
            mousedown: e => this.startInteraction(e.clientX, e.clientY, 'mouse'), // Iniciar interacción con el mouse
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
        Object.assign(this.state, {rotating: false, zooming: false, moving: false});
    },
    // Iniciar interacción según el modo (rotación o movimiento)
    startInteraction: function (x, y) {
        const currentTime = new Date().getTime();
        const timeDifference = currentTime - this.state.lastClickTime;
        this.state.lastClickTime = currentTime;

        if (timeDifference < 300) {
            this.setState('rotating', true); // Doble clic para rotar
        } else {
            this.setState('moving', {x, y}); // Click simple para mover
        }
    },
    // Manejar interacción de rotación o movimiento
    handleInteraction: function (x, y) {
        if (this.state.rotating) this.rotate(x, y); // Doble clic para rotar
        else if (this.state.moving) this.move(x, y);
    },
    // Función para rotar el modelo 3D
    rotate: function (x, y) {
        const {x: prevX, y: prevY} = this.state.prevPos; // Obtener posición previa
        const rotation = this.el.getAttribute('rotation'); // Obtener la rotación actual del elemento
        this.el.setAttribute('rotation', {
            x: rotation.x - (y - prevY) * this.data.rotationSpeed,
            y: rotation.y + (x - prevX) * this.data.rotationSpeed,
            z: rotation.z
        });
        this.state.prevPos = {x, y}; // Actualizar la posición previa
    },
    // Función para mover el modelo 3D
    move: function (x, y) {
        const {x: prevX, y: prevY} = this.state.prevPos; // Obtener posición previa
        const position = this.el.getAttribute('position'); // Obtener la posición actual del modelo
        // Calcular el desplazamiento y actualizar la posición en ambos ejes
        this.el.setAttribute('position', {
            x: position.x + (x - prevX) * this.data.moveSpeed,
            y: position.y + (y - prevY) * this.data.moveSpeed,
            z: position.z
        });
        this.state.prevPos = {x, y}; // Actualizar la posición previa
    },
    // Función para realizar zoom del modelo 3D
    zoom: function (delta) {
        const newScale = Math.min(
            Math.max(this.state.scale + delta * this.data.zoomSpeed, this.data.minScale),
            this.data.maxScale
        );
        if (newScale !== this.state.scale) {
            this.state.scale = newScale;
            this.el.setAttribute('scale', `${newScale} ${newScale} ${newScale}`)
        }
    },
    // Manejar inicio de interacciones táctiles (rotación o zoom)
    handleTouchStart: function (e) {
        if (e.touches.length === 1) { // Un dedo: modo rotación movimiento
            this.setState('moving', {x: e.touches[0].clientX, y: e.touches[0].clientY});
        } else if (e.touches.length === 2) { // Dos dedos: modo zoom
            this.state.zooming = true; // Activar el modo zoom
            this.state.initDist = this.getTouchDistance(e.touches); // Calcular la distancia inicial del modelo 3D
        }
    },
    // Manejar movimientos táctiles (rotación, zoom o movimiento)
    handleTouchMove: function (e) {
        // Un dedo: rotación o movimiento
        if (e.touches.length === 1 && this.state.moving) {
            this.rotate(e.touches[0].clientX, e.touches[0].clientY);
        } else if (e.touches.length === 2 && this.state.zooming) { // Dos dedos: zoom
            const dist = this.getTouchDistance(e.touches); // Calcular la nueva distancia entre dedos
            this.zoom((dist - this.state.initDist) * this.data.zoomSpeed); // Ajustar el zoom
            this.state.initDist = dist; // Actualizar la distancia inicial
        }
    },
    // Calcular la distancia entre los puntos de contacto
    getTouchDistance: function ([t1, t2]) {
        return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY); // Obtener las posiciones táctiles y calcular la distancia entre las posiciones
    }
});
