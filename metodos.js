AFRAME.registerComponent('interaction-handler', {
    schema: {
        rotationSpeed: { type: 'number', default: 0.5 }, // Velocidad de rotación
        zoomSpeed: { type: 'number', default: 0.1 }, // Velocidad de zoom
        moveSpeed: { type: 'number', default: 0.01 }, // Velocidad de movimiento
        minScale: { type: 'number', default: 0.1 }, // Escala mínima
        maxScale: { type: 'number', default: 5 } // Escala máxima
    },

    init: function () {
        this.state = {
            rotating: false, // Estado para rotación
            zooming: false, // Estado para zoom
            moving: false, // Estado para movimiento
            prevPos: {}, // Posición previa para seguimiento
            initDist: 0, // Distancia inicial para zoom táctil
            scale: this.data.minScale, // Escala inicial
            lastClickTime: 0 // Tiempo del último clic para detectar doble clic
        };
        this.bindEvents(); // Vincular eventos
    },

    bindEvents: function () {
        const sceneEl = this.el.sceneEl; // Referencia al elemento de la escena

        const events = {
            mousemove: (e) => this.handleMouseMove(e), // Manejar movimiento del mouse
            mousedown: (e) => this.startMouseInteraction(e), // Iniciar interacción de clic
            mouseup: () => this.resetState(), // Restablecer estado al soltar clic
            touchstart: (e) => this.handleTouchStart(e), // Iniciar interacción táctil
            touchmove: (e) => this.handleTouchMove(e), // Manejar movimiento táctil
            touchend: () => this.resetState(), // Restablecer estado táctil
            wheel: (e) => this.zoom(e.deltaY * -1) // Manejar zoom con la rueda del mouse
        };

        Object.entries(events).forEach(([type, handler]) => {
            sceneEl.addEventListener(type, handler);
        });
    },

    setState: function (key, value) {
        if (typeof value === 'object') this.state.prevPos = value; // Actualizar posición previa si es un objeto
        this.state[key] = !!value; // Actualizar el estado con un valor booleano
    },

    resetState: function () {
        this.setState('rotating', false); // Restablecer rotación
        this.setState('zooming', false); // Restablecer zoom
        this.setState('moving', false); // Restablecer movimiento
    },

    startMouseInteraction: function (e) {
        const currentTime = new Date().getTime(); // Obtener el tiempo actual
        const timeDifference = currentTime - this.state.lastClickTime; // Diferencia entre clics
        this.state.lastClickTime = currentTime; // Actualizar tiempo del último clic

        if (timeDifference < 300) {
            this.setState('rotating', true); // Doble clic para rotar
        } else {
            this.setState('moving', { x: e.clientX, y: e.clientY }); // Clic único para mover
        }
    },

    handleMouseMove: function (e) {
        if (this.state.moving) {
            this.move(e.clientX, e.clientY); // Mover modelo si está en estado de movimiento
        } else if (this.state.rotating) {
            this.handleInteraction(e.clientX, e.clientY, 'rotate'); // Manejar rotación si aplica
        }
    },

    handleInteraction: function (x, y, mode) {
        if (mode === 'rotate' && !this.state.rotating) return; // Salir si no está rotando

        const { x: prevX, y: prevY } = this.state.prevPos; // Obtener posición previa
        const rotation = this.el.getAttribute('rotation'); // Obtener la rotación actual

        if (this.state.rotating) {
            this.el.setAttribute('rotation', {
                x: rotation.x - (y - prevY) * this.data.rotationSpeed,
                y: rotation.y + (x - prevX) * this.data.rotationSpeed,
                z: rotation.z
            });
        }
        this.state.prevPos = { x, y }; // Actualizar posición previa
    },

    move: function (x, y) {
        const { x: prevX, y: prevY } = this.state.prevPos; // Obtener posición previa
        const position = this.el.getAttribute('position'); // Obtener posición actual

        this.el.setAttribute('position', {
            x: position.x + (x - prevX) * this.data.moveSpeed, // Actualizar posición X
            y: position.y + (y - prevY) * this.data.moveSpeed, // Actualizar posición Y
            z: position.z // Mantener posición Z
        });

        this.state.prevPos = { x, y }; // Actualizar posición previa
    },

    handleTouchStart: function (e) {
        if (e.touches.length === 1) {
            this.setState('rotating', { x: e.touches[0].clientX, y: e.touches[0].clientY }); // Un dedo: rotar
        } else if (e.touches.length === 2) {
            this.state.zooming = true; // Dos dedos: zoom
            this.state.initDist = this.getTouchDistance(e.touches); // Calcular distancia inicial
        } else if (e.touches.length === 3) {
            this.setState('moving', { x: e.touches[0].clientX, y: e.touches[0].clientY }); // Tres dedos: mover
        }
    },

    handleTouchMove: function (e) {
        if (e.touches.length === 1) {
            this.handleInteraction(e.touches[0].clientX, e.touches[0].clientY, 'rotate'); // Rotar con un dedo
        } else if (e.touches.length === 2 && this.state.zooming) {
            const dist = this.getTouchDistance(e.touches); // Calcular nueva distancia
            this.zoom((dist - this.state.initDist) * this.data.zoomSpeed); // Realizar zoom
            this.state.initDist = dist; // Actualizar distancia inicial
        } else if (e.touches.length === 3 && this.state.moving) {
            this.move(e.touches[0].clientX, e.touches[0].clientY); // Mover con tres dedos
        }
    },

    getTouchDistance: function (touches) {
        const [t1, t2] = touches; // Obtener dos puntos táctiles
        return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY); // Calcular distancia
    },

    zoom: function (delta) {
        const newScale = Math.min(
            Math.max(this.state.scale + delta * this.data.zoomSpeed, this.data.minScale),
            this.data.maxScale
        ); // Calcular nueva escala respetando límites

        if (newScale !== this.state.scale) {
            this.state.scale = newScale; // Actualizar escala
            this.el.setAttribute('scale', `${newScale} ${newScale} ${newScale}`); // Aplicar nueva escala
        }
    }
});
