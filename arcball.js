function arcballVector(x, y) {
    let p = glMatrix.vec3.fromValues(x, y, 0.0);
    const length2 = x * x + y * y;

    if (length2 < 1.0) {
        p[2] = Math.sqrt(1.0 - length2);
    } else {
        glMatrix.vec3.normalize(p, p);
    }

    return p;
}

function transition(x) {
    const a = 0.99;
    const b = 0.1;
    const k = Math.pow(a + b, a + b) / (Math.pow(a, a) * Math.pow(b, b));
    return k * Math.pow(x, a) * Math.pow(1 - x, b);
}



function ArcballCamera(env) {
    this.environment = env;
    this.pparams = null;
    this.oparams = null;
}

ArcballCamera.prototype.animate = function (time) {
    if (this.pparams && this.oparams) {
        const damping = 0.975 ** (250.0 * time);
        const params = { ...this.pparams };

        if (params.rotate) {
            params.rotate *= damping;
        }

        if (params.zoom) {
            params.zoom *= damping;
        }

        if (params.pan) {
            params.pan *= damping;
        }

        if (params.scale) {
            params.scale *= damping;
        }

        if (params.rotatezoom) {
            params.rotatezoom *= damping;
        }

        this.pparams = this.oparams;
        this.update(params);
    }
}

// Call this whenever the mouse moves
ArcballCamera.prototype.update = function (params) {
    if (params && this.pparams) {
        if (params.rotate) {
            if (params.x != this.pparams.x || params.y != this.pparams.y) {
                const va = arcballVector(this.pparams.x, this.pparams.y);
                const vb = arcballVector(params.x, params.y);

                if (va[0] != vb[0] || va[1] != vb[1] || va[2] != vb[2]) {
                    const dp = glMatrix.vec3.dot(va, vb);
                    const angle = transition(params.rotate) * Math.acos(Math.max(-1.0, Math.min(1.0, dp)));
                    const axis = glMatrix.vec4.fromValues(0.0, 0.0, 0.0, 0.0);
                    glMatrix.vec3.cross(axis, va, vb);

                    const inverseView = glMatrix.mat4.create();
                    glMatrix.mat4.invert(inverseView, this.environment.settings.view);
                    const transformedAxis = glMatrix.vec4.create();
                    glMatrix.vec4.transformMat4(transformedAxis, axis, inverseView);
                    glMatrix.mat4.rotate(this.environment.settings.view, this.environment.settings.view, angle, transformedAxis);
                }
            }
        }

        if (params.zoom) {
            if (params.x != this.pparams.x || params.y != this.pparams.y) {

                let va = glMatrix.vec2.fromValues(this.pparams.x, this.pparams.y);
                let vb = glMatrix.vec2.fromValues(params.x, params.y);
                let d = glMatrix.vec2.create();
                glMatrix.vec2.subtract(d, vb, va);

                const l = Math.abs(d[0]) > Math.abs(d[1]) ? d[0] : d[1];
                let s = 1.0;

                if (l > 0.0) {
                    s += Math.min(0.5, transition(params.zoom) * glMatrix.vec2.length(d));
                } else {
                    s -= Math.min(0.5, transition(params.zoom) * glMatrix.vec2.length(d));
                }

                glMatrix.mat4.scale(this.environment.settings.view, this.environment.settings.view, glMatrix.vec3.fromValues(s, s, s));
            }
        }

        if (params.scale) {
            const f = transition(params.scale);
            const s = f * params.scaleFactor + (1.0 - f);
            glMatrix.mat4.scale(this.environment.settings.view, this.environment.settings.view, glMatrix.vec3.fromValues(s, s, s));
        }

        if (params.pan) {
            if (params.x != this.pparams.x || params.y != this.pparams.y) {
                const va = glMatrix.vec3.fromValues(this.pparams.x, this.pparams.y, 0.0);
                const vb = glMatrix.vec3.fromValues(params.x, params.y, 0.0);
                const d = glMatrix.vec3.create();
                glMatrix.vec3.subtract(d, vb, va);

                const aspect = params.width / params.height;
                d[0] *= aspect;

                glMatrix.vec3.scale(d, d, transition(params.pan));

                const t = glMatrix.mat4.create();
                glMatrix.mat4.fromTranslation(t, d);
                glMatrix.mat4.multiply(this.environment.settings.view, t, this.environment.settings.view);
            }
        }

        if (params.rotatezoom) {
            if (params.axisX != this.pparams.axisX || params.axisY != this.pparams.axisY) {
                const va = arcballVector(this.pparams.axisX, this.pparams.axisY);
                const vb = arcballVector(params.axisX, params.axisY);

                if (va[0] != vb[0] || va[1] != vb[1] || va[2] != vb[2]) {
                    const dp = glMatrix.vec3.dot(va, vb);
                    const angle = transition(params.rotatezoom) * Math.acos(Math.max(-1.0, Math.min(1.0, dp)));
                    const axis = glMatrix.vec4.fromValues(0.0, 0.0, 0.0, 0.0);
                    glMatrix.vec3.cross(axis, va, vb);

                    const inverseView = glMatrix.mat4.create();
                    glMatrix.mat4.invert(inverseView, this.environment.settings.view);

                    const transformedAxis = glMatrix.vec4.create();
                    glMatrix.vec4.transformMat4(transformedAxis, axis, inverseView);
                    glMatrix.mat4.rotate(this.environment.settings.view, this.environment.settings.view, angle, transformedAxis);
                }
            }

            if (params.distance != this.pparams.distance) {
                const f = transition(params.rotatezoom);

                const scale = params.distance / this.pparams.distance;
                const s = Math.min(Math.max(0.8, f * scale + (1.0 - f)), 1.25);
                glMatrix.mat4.scale(this.environment.settings.view, this.environment.settings.view, glMatrix.vec3.fromValues(s, s, s));
            }

            if (params.centerX != this.pparams.centerX || params.centerY != this.pparams.centerY) {
                const va = glMatrix.vec3.fromValues(this.pparams.centerX, this.pparams.centerY, 0.0);
                const vb = glMatrix.vec3.fromValues(params.centerX, params.centerY, 0.0);
                const d = glMatrix.vec3.create();
                glMatrix.vec3.subtract(d, vb, va);

                const aspect = params.width / params.height;
                d[0] *= aspect;

                glMatrix.vec3.scale(d, d, transition(params.rotatezoom));

                const t = glMatrix.mat4.create();
                glMatrix.mat4.fromTranslation(t, d);
                glMatrix.mat4.multiply(this.environment.settings.view, t, this.environment.settings.view);
            }
        }
    }
    this.oparams = this.pparams;
    this.pparams = params;
}

function arcballController(canvas, environment) {
    let camera = new ArcballCamera(environment);
    let distance = 1.0;
    let px = 0.0;
    let py = 0.0;
    const defaultView = glMatrix.mat4.clone(environment.settings.view);

    canvas.addEventListener("keydown", function (e) {
        e.preventDefault();

        switch (e.key) {
            case "ArrowUp": {
                const inverseView = glMatrix.mat4.create();
                glMatrix.mat4.invert(inverseView, camera.environment.settings.view);
                const transformedAxis = glMatrix.vec4.create();
                glMatrix.vec4.transformMat4(transformedAxis, glMatrix.vec4.fromValues(1, 0, 0, 0), inverseView);
                glMatrix.mat4.rotate(camera.environment.settings.view, camera.environment.settings.view, -30 * Math.PI / 180, transformedAxis);
                break;
            }

            case "ArrowDown": {
                const inverseView = glMatrix.mat4.create();
                glMatrix.mat4.invert(inverseView, camera.environment.settings.view);
                const transformedAxis = glMatrix.vec4.create();
                glMatrix.vec4.transformMat4(transformedAxis, glMatrix.vec4.fromValues(1, 0, 0, 0), inverseView);
                glMatrix.mat4.rotate(camera.environment.settings.view, camera.environment.settings.view, 30 * Math.PI / 180, transformedAxis);
                break;
            }

            case "ArrowLeft": {
                const inverseView = glMatrix.mat4.create();
                glMatrix.mat4.invert(inverseView, camera.environment.settings.view);
                const transformedAxis = glMatrix.vec4.create();
                glMatrix.vec4.transformMat4(transformedAxis, glMatrix.vec4.fromValues(0, 1, 0, 0), inverseView);
                glMatrix.mat4.rotate(camera.environment.settings.view, camera.environment.settings.view, -30 * Math.PI / 180, transformedAxis);
                break;
            }

            case "ArrowRight": {
                const inverseView = glMatrix.mat4.create();
                glMatrix.mat4.invert(inverseView, camera.environment.settings.view);
                const transformedAxis = glMatrix.vec4.create();
                glMatrix.vec4.transformMat4(transformedAxis, glMatrix.vec4.fromValues(0, 1, 0, 0), inverseView);
                glMatrix.mat4.rotate(camera.environment.settings.view, camera.environment.settings.view, 30 * Math.PI / 180, transformedAxis);
                break;
            }

            case "PageUp": {
                const s = 1.2;
                glMatrix.mat4.scale(camera.environment.settings.view, camera.environment.settings.view, glMatrix.vec3.fromValues(s, s, s));
                break;
            }

            case "PageDown": {
                const s = (1.0 / 1.2);
                glMatrix.mat4.scale(camera.environment.settings.view, camera.environment.settings.view, glMatrix.vec3.fromValues(s, s, s));
                break;
            }

            case "Home": {
                glMatrix.mat4.copy(camera.environment.settings.view, defaultView);
                break;
            }
        }
    });

    canvas.addEventListener("contextmenu", function (e) {
        e.preventDefault();
    });

    const makeMouse = function (e) {
        const rect = canvas.getBoundingClientRect();
        let params = {
            ...camera.pparams,
            x: 2.0 * ((e.clientX - rect.left) / rect.width) - 1.0,
            y: 2.0 * (1.0 - ((e.clientY - rect.top) / rect.height)) - 1.0,
            width: rect.width,
            height: rect.height,
        };

        return params;
    }

    canvas.addEventListener("mousedown", function (e) {
        e.preventDefault();
        canvas.focus();
        let params = makeMouse(e);

        if (e.button == 0)
            params.rotate = 1;
        else if (e.button == 1)
            params.pan = 1;
        else if (e.button == 2)
            params.zoom = 1;

        camera.pparams = params;
        camera.update(params);

    });

    canvas.addEventListener("mousemove", function (e) {
        e.preventDefault();

        if (e.buttons != 0) {
            let params = makeMouse(e);

            if ((e.buttons & 1) === 1) {
                params.rotate = 1.0;
            }

            if ((e.buttons & 2) === 2) {
                params.zoom = 1.0;
            }

            if ((e.buttons & 4) === 4) {
                params.pan = 1.0;
            }

            camera.update(params);
        }
    });

    const makeTouch = function (e) {
        let rect = canvas.getBoundingClientRect();

        let params = {
            ...camera.pparams
        };

        params.width = rect.width;
        params.height = rect.height;

        if (e.touches.length > 0) {
            params.x = 2.0 * ((e.touches[0].clientX - rect.left) / rect.width) - 1.0;
            params.y = 2.0 * (1.0 - ((e.touches[0].clientY - rect.top) / rect.height)) - 1.0;

            if (e.touches.length == 2) {
                params.centerX = params.x;
                params.centerY = params.y;

                const dx = (e.touches[1].pageX - e.touches[0].pageX);
                const dy = (e.touches[1].pageY - e.touches[0].pageY);
                params.distance = Math.hypot(dx, dy);
                this.distance = params.distance;

                params.axisX = 2.0 * dx / params.distance;
                params.axisY = -2.0 * dy / params.distance;
            }
        }

        return params;
    };

    canvas.addEventListener("touchstart", function (e) {
        e.preventDefault();
        let params = makeTouch(e);

        if (e.touches.length == 2) {
            params.rotatezoom = 1.0;
        } else {
            params.rotate = 1.0;
        }

        camera.pparams = params;
        camera.update(params);
    });

    canvas.addEventListener("touchend", function (e) {
        e.preventDefault();
        let params = makeTouch(e);

        if (e.touches.length == 1) {
            // special case when we are in multi-touch (rotate/zoom/pan) mode, switching to single-touch
            camera.pparams = params;
        }
    });

    canvas.addEventListener("touchmove", function (e) {
        e.preventDefault();
        let params = makeTouch(e);

        if (e.touches.length == 2) {
            params.rotatezoom = 1.0;
        } else {
            params.rotate = 1.0;
        }

        camera.update(params);
    });

    canvas.addEventListener("wheel", function (e) {
        e.preventDefault();

        const rect = canvas.getBoundingClientRect();

        let params = {};
        params.width = rect.width;
        params.height = rect.height;
        params.x = 2.0 * ((e.x - rect.left) / rect.width) - 1.0;
        params.y = 2.0 * (1.0 - ((e.y - rect.top) / rect.height)) - 1.0;

        let factor = 0.99995 ** e.deltaY;
        factor = Math.min(Math.max(0.125, factor), 4);

        params.scale = 1.0;
        params.scaleFactor = factor;
        camera.update(params);
    });

    return camera;
}
