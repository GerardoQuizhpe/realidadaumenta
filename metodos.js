AFRAME.registerComponent('interaction-handler', {
    schema: {
        rotationSpeed: {type: 'number', default: 0.5},
        zoomSpeed: {type: 'number', default: 0.001},
        moveSpeed: {type: 'number', default: 0.01},
        minScale: {type: 'number', default: 0.1},
        maxScale: {type: 'number', default: 3}
    },
    init: function () {
        this.state = { 
            rotating: false, 
            zooming: false, 
            moving: false, 
            prevPos: {x: 0, y: 0}, 
            initDist: 0, 
            scale: this.data.minScale, 
            lastClickTime: 0
        };
        this.bindEvents();
    },
    bindEvents: function () {
        const sceneEl = this.el.sceneEl;
        const events = {
            mousemove: e => this.handleInteraction(e.clientX, e.clientY),
            mousedown: e => this.startInteraction(e.clientX, e.clientY, 'mouse'),
            mouseup: () => this.resetState(),
            touchstart: e => this.handleTouchStart(e),
            touchmove: e => this.handleTouchMove(e),
            touchend: () => this.resetState(),
            wheel: e => this.zoom(e.deltaY * -1)
        };
        Object.entries(events).forEach(([type, handler]) => sceneEl.addEventListener(type, handler));
    },
    setState: function (key, value) {
        if (typeof value === 'object') this.state.prevPos = value;
        this.state[key] = !!value;
    },
    resetState: function () {
        Object.assign(this.state, {rotating: false, zooming: false, moving: false});
    },
    startInteraction: function (x, y) {
        const currentTime = new Date().getTime();
        const timeDifference = currentTime - this.state.lastClickTime;
        this.state.lastClickTime = currentTime;

        if (timeDifference < 300) {
            this.setState('rotating', true); 
        } else {
            this.setState('moving', {x, y});
        }
    },
    handleInteraction: function (x, y) {
        if (this.state.rotating) this.rotate(x, y);
        else if (this.state.moving) this.move(x, y);
    },
    rotate: function (x, y) {
        const {x: prevX, y: prevY} = this.state.prevPos;
        const rotation = this.el.getAttribute('rotation');
        this.el.setAttribute('rotation', {
            x: rotation.x - (y - prevY) * this.data.rotationSpeed,
            y: rotation.y + (x - prevX) * this.data.rotationSpeed,
            z: rotation.z
        });
        this.state.prevPos = {x, y};
    },
    move: function (x, y) {
        const {x: prevX, y: prevY} = this.state.prevPos;
        const position = this.el.getAttribute('position');
        this.el.setAttribute('position', {
            x: position.x + (x - prevX) * this.data.moveSpeed,
            y: position.y + (y - prevY) * this.data.moveSpeed,
            z: position.z
        });
        this.state.prevPos = {x, y};
    },
    handleTouchStart: function (e) {
        if (e.touches.length === 1) {
            this.setState('moving', {x: e.touches[0].clientX, y: e.touches[0].clientY});
        } else if (e.touches.length === 2) {
            this.state.zooming = true;
            this.state.initDist = this.getTouchDistance(e.touches);
        }
    },
    handleTouchMove: function (e) {
        if (e.touches.length === 1 && this.state.moving) {
            this.move(e.touches[0].clientX, e.touches[0].clientY);
        } else if (e.touches.length === 2 && this.state.zooming) {
            const dist = this.getTouchDistance(e.touches);
            this.zoom((dist - this.state.initDist) * this.data.zoomSpeed);
            this.state.initDist = dist;
        }
    },
    getTouchDistance: function ([t1, t2]) {
        return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    },
    zoom: function (delta) {
        const newScale = Math.min(
            Math.max(this.state.scale + delta * this.data.zoomSpeed, this.data.minScale),
            this.data.maxScale
        );
        if (newScale !== this.state.scale) {
            this.state.scale = newScale;
            this.el.setAttribute('scale', `${newScale} ${newScale} ${newScale}`)
        }
    }
});
