AFRAME.registerComponent('interaction-handler', {
    schema: {
        rotationSpeed: { type: 'number', default: 0.5 },
        zoomSpeed: { type: 'number', default: 0.1 },
        moveSpeed: { type: 'number', default: 0.01 }, // Velocidad de movimiento adicional
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
            lastClickTime: 0 // Para detectar el doble click
        };
        this.bindEvents();
    },
    bindEvents: function () {
        const sceneEl = this.el.sceneEl;
        const events = {
            mousemove: e => this.handleInteraction(e.clientX, e.clientY, 'rotate'), // Manejar rotación con el mouse
            mousedown: e => this.startInteraction(e.clientX, e.clientY, 'mouse'), // Iniciar rotación o movimiento con el mouse
            mouseup: () => this.resetState(), // Finalizar rotación o movimiento
            touchstart: e => this.handleTouchStart(e), // Manejar inicio de toques
            touchmove: e => this.handleTouchMove(e), // Manejar movimientos táctiles
            touchend: () => this.resetState(), // Reiniciar estado al soltar los toques
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
            this.setState('moving', { x, y }); // Click simple para mover
        }
    },
    handleInteraction: function (x, y, mode) {
        if (mode === 'rotate' && !this.state.rotating) return;

        const { x: prevX, y: prevY } = this.state.prevPos;
        const rotation = this.el.getAttribute('rotation');
        if (this.state.rotating) {
            this.el.setAttribute('rotation', {
                x: rotation.x - (y - prevY) * this.data.rotationSpeed,
                y: rotation.y + (x - prevX) * this.data.rotationSpeed,
                z: rotation.z
            });
        } else if (this.state.moving) {
            this.move(x, y);
        }
        this.state.prevPos = { x, y };
    },
    move: function (x, y) {
        const { x: prevX, y: prevY } = this.state.prevPos;
        const position = this.el.getAttribute('position');
        this.el.setAttribute('position', {
            x: position.x + (x - prevX) * this.data.moveSpeed,
            y: position.y + (y - prevY) * this.data.moveSpeed,
            z: position.z
        });
        this.state.prevPos = { x, y };
    },
    handleTouchStart: function (e) {
        if (e.touches.length === 1) {
            this.setState('rotating', { x: e.touches[0].clientX, y: e.touches[0].clientY });
        } else if (e.touches.length === 2) {
            this.state.zooming = true;
            this.state.initDist = this.getTouchDistance(e.touches);
        }
    },
    handleTouchMove: function (e) {
        if (e.touches.length === 1) {
            this.handleInteraction(e.touches[0].clientX, e.touches[0].clientY, 'rotate');
        } else if (e.touches.length === 2 && this.state.zooming) {
            const dist = this.getTouchDistance(e.touches);
            this.zoom((dist - this.state.initDist) * this.data.zoomSpeed);
            this.state.initDist = dist;
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
