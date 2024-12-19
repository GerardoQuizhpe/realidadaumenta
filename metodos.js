// Agregar componente para girar, mover y hacer zoom
AFRAME.registerComponent('interaction-handler', {
    // Definir las propiedades configurables del esquema
    schema: {
        rotationSpeed: { type: 'number', default: 0.5 }, // Velocidad de rotación
        zoomSpeed: { type: 'number', default: 0.1 }, // Velocidad de zoom
        moveSpeed: { type: 'number', default: 0.01 }, // Velocidad de movimiento
        minScale: { type: 'number', default: 0.1 }, // Escala mínima del modelo
        maxScale: { type: 'number', default: 5 } // Escala máxima para el modelo
    },
    // Inicializar los componentes
    init: function () {
        this.state = {
            rotating: false, // Estado que indica si se está rotando
            zooming: false, //  Estado que indica si se está haciendo zoom
            moving: false, //  Estado que indica si se está moviendo
            prevPos: {}, // Guardar la posición previa del mouse o toque
            initDist: 0, // Almacenar la distancia inicial para el zoom táctil
            scale: this.data.minScale, // Escala inicial del modelo
            lastClickTime: 0 // Tiempo del último clic para detectar doble clic
        };
        this.bindEvents(); // Vincular los eventos necesarios
    },
    // Función para asignar eventos a la escena
    bindEvents: function () {
        const sceneEl = this.el.sceneEl; // Referenciar al elemento de la escena
        const events = {
            mousemove: (e) => this.handleMouseMove(e), // Manejar movimiento del mouse
            mousedown: (e) => this.startMouseInteraction(e), // Manejar clic inicial
            mouseup: () => this.resetState(), // Reiniciar estado al soltar clic
            touchstart: (e) => this.handleTouchStart(e), // Manejar inicio de interacción táctil
            touchmove: (e) => this.handleTouchMove(e), // Manejar movimiento táctil
            touchend: () => this.resetState(), // Reiniciar estado táctil al soltar
            wheel: (e) => this.zoom(e.deltaY * -1) // Manejar zoom con la rueda del mouse
        };
        // Asociar los eventos a la escena
        Object.entries(events).forEach(([type, handler]) => {
            sceneEl.addEventListener(type, handler); // Asignar cada evento al manejador correspondiente
        });
    },
    // Función para cambiar el estado según el valor dado
    setState: function (key, value) {
        if (typeof value === 'object') this.state.prevPos = value; // Actualizar posición previa si el valor es un objeto
        this.state[key] = !!value; // Actualizar el estado con un valor booleano
    },
    // Función para reiniciar los estados de interacción al finalizar
    resetState: function () {
        this.setState('rotating', false); // Detener la rotación
        this.setState('zooming', false); // Detener el zoom
        this.setState('moving', false); // Detener el movimiento
    },
    // Función para iniciar las funcionalidades
    startMouseInteraction: function (e) {
        const currentTime = new Date().getTime(); // Obtener el tiempo actual
        const timeDifference = currentTime - this.state.lastClickTime; // Calcular el tiempo entre los clics realizados
        this.state.lastClickTime = currentTime; // Actualizar el tiempo del último clic

        if (timeDifference < 300) { //Si el tiempo calculado es menor a 300 ms, se interpreta como un doble clic
            this.setState('rotating', true); // Activar la rotación con un doble clic
        } else {
            this.setState('moving', { x: e.clientX, y: e.clientY }); // Activar el movimiento con un clic simple
        }
    },
    // Función para mover con el modelo con el mouse
    handleMouseMove: function (e) {
        if (this.state.moving) {
            this.move(e.clientX, e.clientY); // Realizar el movimiento del modelo si está activado
        } else if (this.state.rotating) {
            this.handleInteraction(e.clientX, e.clientY, 'rotate'); // Realizar la rotación si está activada
        }
    },
    // Función para manejar la interacción de rotar con el mouse
    handleInteraction: function (x, y, mode) {
        if (mode === 'rotate' && !this.state.rotating) return; // Salir si no se está rotando el modelo

        const { x: prevX, y: prevY } = this.state.prevPos; // Obtener la posición previa
        const rotation = this.el.getAttribute('rotation'); // Obtener la rotación actual

        if (this.state.rotating) {
            this.el.setAttribute('rotation', {
                x: rotation.x - (y - prevY) * this.data.rotationSpeed, // Actualizar rotación en X
                y: rotation.y + (x - prevX) * this.data.rotationSpeed, // Actualizar rotación en Y
                z: rotation.z // Mantener rotación en Z
            });
        }
        this.state.prevPos = { x, y }; // Guardar la nueva posición previa
    },
    // Función para mover el modelo
    move: function (x, y) {
        const { x: prevX, y: prevY } = this.state.prevPos; // Obtener la posición previa
        const position = this.el.getAttribute('position'); // Obtener la posición actual

        this.el.setAttribute('position', {
            x: position.x + (x - prevX) * this.data.moveSpeed, // Calcular la nueva posición en X
            y: position.y + (y - prevY) * this.data.moveSpeed, // Calcular la nueva posición en Y
            z: position.z // Mantener la posición en Z
        });

        this.state.prevPos = { x, y }; // Actualizar la posición previa del modelo
    },
    // Función para iniciar interacciones táctiles (zoom, mover y girar)
    handleTouchStart: function (e) {
        if (e.touches.length === 1) {
            this.setState('rotating', { x: e.touches[0].clientX, y: e.touches[0].clientY }); // Un dedo se activa la rotación del modelo
        } else if (e.touches.length === 2) {
            this.state.zooming = true; // Dos dedos se activa el zoom
            this.state.initDist = this.getTouchDistance(e.touches); // Calcular la distancia inicial para zoom
        } else if (e.touches.length === 3) {
            this.setState('moving', { x: e.touches[0].clientX, y: e.touches[0].clientY }); // Tres dedos se activa el movimiento del modelo
        }
    },
    // Función para manejar los movimientos táctiles (zoom, mover y girar)
    handleTouchMove: function (e) {
        if (e.touches.length === 1) {
            this.handleInteraction(e.touches[0].clientX, e.touches[0].clientY, 'rotate'); // Rotar con un dedo
        } else if (e.touches.length === 2 && this.state.zooming) { // Zoom con dos dedos
            const dist = this.getTouchDistance(e.touches); // Calcular la nueva distancia de los dedos
            this.zoom((dist - this.state.initDist) * this.data.zoomSpeed); // Realizar zoom
            this.state.initDist = dist; // Actualizar la distancia inicial
        } else if (e.touches.length === 3 && this.state.moving) { 
            this.move(e.touches[0].clientX, e.touches[0].clientY); // Mover con tres dedos
        }
    },
    // Función para calcular la distancia entre los puntos de contacto
    getTouchDistance: function (touches) {
        const [t1, t2] = touches; // Obtener los dos puntos de contacto
        return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY); // Calcular la distancia entre ellos
    },
    // Función para realizar zoom
    zoom: function (delta) {
        const newScale = Math.min(
            Math.max(this.state.scale + delta * this.data.zoomSpeed, this.data.minScale),
            this.data.maxScale
        ); // Calcular la nueva escala dentro de los límites establecidos

        if (newScale !== this.state.scale) {
            this.state.scale = newScale; // Actualizar la escala (tamaño)
            this.el.setAttribute('scale', `${newScale} ${newScale} ${newScale}`); // Aplicar la nueva escala al modelo
        }
    }
});
