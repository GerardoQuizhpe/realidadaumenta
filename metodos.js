AFRAME.registerComponent('interaction-handler', {
    schema: {
        rotationSpeed: { type: 'number', default: 0.5 },
        zoomSpeed: { type: 'number', default: 0.1 },
        moveSpeed: { type: 'number', default: 0.01 },
        minScale: { type: 'number', default: 0.1 },
        maxScale: { type: 'number', default: 5 }
    },
    init: function () {
        this.state = {
            rotating: false,
            zooming: false,
            moving: false,
            prevPos: {},
            initDist: 0,
            scale: this.data.minScale,
            lastClickTime: 0
        };
        this.bindEvents();
    },
    bindEvents: function () {
        const sceneEl = this.el.sceneEl;
        const events = {
            mousemove: e => this.handleInteraction(e.clientX, e.clientY), // Manejar interacción según el estado actual
            mousedown: e => this.startInteraction(e.clientX, e.clientY, 'mouse'), // Detectar inicio de interacción con clic
            mouseup: () => this.resetState(), // Finalizar interacción al soltar el clic
            touchstart: e => this.handleTouchStart(e), // Detectar inicio de interacción táctil
            touchmove: e => this.handleTouchMove(e), // Manejar interacción táctil
            touchend: () => this.resetState(), // Finalizar interacción táctil
            wheel: e => this.zoom(e.deltaY * -1) // Manejar zoom con la rueda del mouse
        };
        Object.entries(events).forEach(([type, handler]) => sceneEl.addEventListener(type, handler));
    },
    setState: function (key, value) {
        if (typeof value === 'object') this.state.prevPos = value;
        this.state[key] = !!value;
    },
    resetState: function () {
        this.setState('rotating', false);
        this.setState('zooming', false);
        this.setState('moving', false);
    },
    startInteraction: function (x, y, mode) {
        const currentTime = new Date().getTime();
        const timeDifference = currentTime - this.state.lastClickTime;
        this.state.lastClickTime = currentTime;

        if (timeDifference < 300) {
            this.setState('rotating', true); // Doble clic para rotar
        } else {
            this.setState('moving', { x, y }); // Clic simple para mover
        }
    },
    handleInteraction: function (x, y) {
        if (this.state.rotating) {
            this.rotate(x, y); // Realizar rotación
        } else if (this.state.moving) {
            this.move(x, y); // Realizar movimiento
        }
        this.state.prevPos = { x, y }; // Actualizar la posición previa
    },
    rotate: function (x, y) {
        const { x: prevX, y: prevY } = this.state.prevPos;
        const rotation = this.el.getAttribute('rotation');
        this.el.setAttribute('rotation', {
            x: rotation.x - (y - prevY) * this.data.rotationSpeed,
            y: rotation.y + (x - prevX) * this.data.rotationSpeed,
            z: rotation.z
        });
    },
    move: function (x, y) {
        const { x: prevX, y: prevY } = this.state.prevPos;
        const position = this.el.getAttribute('position');
        this.el.setAttribute('position', {
            x: position.x + (x - prevX) * this.data.moveSpeed,
            y: position.y - (y - prevY) * this.data.moveSpeed, // Invertido para movimiento natural
            z: position.z
        });
    },
    handleTouchStart: function (e) {
        if (e.touches.length === 1) {
            this.setState('rotating', { x: e.touches[0].clientX, y: e.touches[0].clientY });
        } else if (e.touches.length === 2) {
            this.state.zooming = true;
            this.state.initDist = this.getTouchDistance(e.touches);
        } else if (e.touches.length === 3) {
            this.setState('moving', { x: e.touches[0].clientX, y: e.touches[0].clientY });
        }
    },
    handleTouchMove: function (e) {
        if (e.touches.length === 1 && this.state.rotating) {
            this.handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
        } else if (e.touches.length === 2 && this.state.zooming) {
            const dist = this.getTouchDistance(e.touches);
            this.zoom((dist - this.state.initDist) * this.data.zoomSpeed);
            this.state.initDist = dist;
        } else if (e.touches.length === 3 && this.state.moving) {
            this.handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
        }
    },
    getTouchDistance: function (touches) {
        const [t1, t2] = touches;
        return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    },
    zoom: function (delta) {
        const newScale = Math.min(
            Math.max(this.state.scale + delta * this.data.zoomSpeed, this.data.minScale),
            this.data.maxScale
        );
        if (newScale !== this.state.scale) {
            this.state.scale = newScale;
            this.el.setAttribute('scale', `${newScale} ${newScale} ${newScale}`);
        }
    }
});
