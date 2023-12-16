// create our simple UI with TweakPane
function setupInterface(env) {
    env.controller = arcballController(env.gl.canvas, env);

    env.ui.rootPane = new Pane({ title: "Parameters", container: document.querySelector("#pane") });

    const tab = env.ui.rootPane.addTab({
        pages: [
            { title: "General" },
            { title: "Objects" },
            { title: "Materials" }
        ]
    });

    env.ui.generalPane = tab.pages[0];
    env.ui.objectsPane = tab.pages[1];
    env.ui.materialsPane = tab.pages[2];

    env.ui.filePane = env.ui.generalPane.addFolder({
        title: "Files",
        expanded: true
    });

    env.ui.resetSceneButton = env.ui.filePane.addButton({
        title: "Reset Scene"
    });

    env.ui.resetSceneButton.on("click", function () {
        env.store.clear().then(function () {
            Object.assign(env.settings, env.defaults.settings);
            location.reload();
        });
    });

    env.ui.resetSettingsButton = env.ui.filePane.addButton({
        title: "Reset Settings"
    });

    env.ui.resetSettingsButton.on("click", function () {
        Object.assign(env.settings, env.defaults.settings);
        location.reload();
    });

    env.ui.resetMaterialsButton = env.ui.filePane.addButton({
        title: "Reset Materials"
    });

    env.ui.resetMaterialsButton.on("click", function () {
        env.settings.materials = {};
        location.reload();
    });

    env.ui.resetObjectsButton = env.ui.filePane.addButton({
        title: "Reset Objects"
    });

    env.ui.resetObjectsButton.on("click", function () {
        env.settings.objects = {};
        location.reload();
    });

    env.ui.resetViewButton = env.ui.filePane.addButton({
        title: "Reset View"
    });

    env.ui.resetViewButton.on("click", function () {
        glMatrix.mat4.copy(env.settings.view, env.defaults.settings.view);
    });


    

    // file upload actions need to be triggered by a input element with  type="file"
    env.ui.fileLoad = document.createElement("input");
    env.ui.fileLoad.setAttribute("type", "file");
    env.ui.fileLoad.setAttribute("accept", ".obj, .mtl, .png, .jpg");
    env.ui.fileLoad.setAttribute("multiple", "");
    env.ui.fileLoad.setAttribute("style", "color: white; padding-top: 4px; padding-bottom: 4px;");
    env.ui.fileLoad.addEventListener("change", (event) => {
        loadFiles(env, event.target.files);
    });

    env.ui.resetSceneButton.element.prepend(env.ui.fileLoad);

    env.ui.statisticsPane = env.ui.generalPane.addFolder({
        title: "Statistics",
        expanded: true
    });

    env.ui.settingsPane = env.ui.generalPane.addFolder({
        title: "Settings",
        expanded: true
    });

    env.ui.objectSelector = env.ui.objectsPane.addBlade({
        view: "list",
        label: "Object",
        options: [
            { text: "", value: "" },
        ],
        value: "",
    });

    env.ui.materialSelector = env.ui.materialsPane.addBlade({
        view: "list",
        label: "Material",
        options: [
            { text: "", value: "" },
        ],
        value: "",
    });
    

    

}

// bind our UI controls to the settings
function setupBindings(env) {

    env.ui.statisticsPane.addBinding(env.statistics, "totalVertices", {
        readonly: true,
        label: "Total Vertices",
        format: (v) => v.toFixed()
    });

    env.ui.statisticsPane.addBinding(env.statistics, "renderedVertices", {
        readonly: true,
        label: "Rendered Vertices",
        format: (v) => v.toFixed()
    });

    env.ui.statisticsPane.addBinding(env.statistics, "framesPerSecond", {
        readonly: true,
        label: "Frames/Second",
        view: "graph",
        min: 0,
        max: 200
    });

    env.ui.settingsPane.addBinding(env.settings, "background", {
        label: "Background",
        color: { type: 'float' },
    });

    env.ui.settingsPane.addBinding(env.settings, "fov", {
        label: "Field of View",
        min: 1,
        max: 180
    });

    env.ui.settingsPane.addBinding(env.settings, "perspective", {
        label: "Perspective",
    });

    env.ui.objectPropertiesPane = env.ui.objectsPane.addFolder({
        title: "Properties",
        expanded: true
    });

    env.ui.objectSelector.on("change", function (e) {
        env.ui.objectPropertiesPane.dispose();
        env.ui.objectPropertiesPane = env.ui.objectsPane.addFolder({
            title: "Properties",
            expanded: true
        });
        env.ui.objectPropertiesPane.addBinding(env.settings.objects[e.value], "enabled");
    });

    env.ui.materialPropertiesPane = env.ui.materialsPane.addFolder({
        title: "Properties",
        expanded: true
    });

    env.ui.materialSelector.on("change", function (e) {
        updateMaterialSelector(env, e.value);
    });
}

// update object properties pane on selection change
function updateObjectSelector(env, value) {
    env.ui.objectPropertiesPane.dispose();
    env.ui.objectPropertiesPane = objectsPane.addFolder({
        title: "Properties",
        expanded: true
    });
    env.ui.objectPropertiesPane.addBinding(env.settings.objects[value], "enabled");
}

// update material properties pane on selection change
function updateMaterialSelector(env, value) {
    env.ui.materialPropertiesPane.dispose();
    env.ui.materialPropertiesPane = env.ui.materialsPane.addFolder({
        title: "Properties",
        expanded: true
    });

    if (value in env.settings.materials) {
        const m = env.settings.materials[value];

        if (m.ambient != undefined) {
            m.ambient = makeColor(m.ambient);
            env.ui.materialPropertiesPane.addBinding(m, "ambient", {
                color: { type: "float" }
            });
        }

        if (m.diffuse != undefined) {
            m.diffuse = makeColor(m.diffuse);
            env.ui.materialPropertiesPane.addBinding(m, "diffuse", {
                color: { type: "float" }
            });
        }

        if (m.specular != undefined) {
            m.specular = makeColor(m.specular);
            env.ui.materialPropertiesPane.addBinding(m, "specular", {
                color: { type: "float" }
            });
        }

        if (m.emissve != undefined) {
            m.emissve = makeColor(m.emissve);
            env.ui.materialPropertiesPane.addBinding(m, "emissive", {
                color: { type: "float" }
            });
        }

        if (m.shininess != undefined) {
            env.ui.materialPropertiesPane.addBinding(m, "shininess", {
                min: 0.0, max: 1000.0
            });
        }

        Object.entries(m)
            .filter(([key]) => !key.startsWith("_") && key.endsWith("Map"))
            .forEach(([key]) => {
                env.ui.materialPropertiesPane.addBinding(m, key, {
                    options: env.images
                });
            });
    }
}

// update list of objects in object selector
function updateObjects(env, geometries) {
    const objs = {};
    const list = [];

    for (let o of geometries) {

        if (!objs[o.name]) {
            objs[o.name] = true;
            list.push({ text: o.name, value: o.name });
        }

        const obj = {
            enabled: true,
            ...(o.name in env.settings.objects ? env.settings.objects[o.name] : {})
        };

        env.settings.objects[o.name] = obj;
    }

    env.ui.objectSelector.options = list;
}

// update list of materials in material selector
function updateMaterials(env, materials) {
    const mats = {};
    const list = [];

    for (let m in materials) {

        if (!mats[m]) {
            mats[m] = true;
            list.push({ text: m, value: m });
        }

        const mat = {
            ...env.defaults.material,
            ...materials[m],
            ...(m in env.settings.materials ? env.settings.materials[m] : {})
        };

        env.settings.materials[m] = mat;
    }

    env.ui.materialSelector.options = list;
}

// loads multiple files from the passed array
function loadFiles(env, files) {
    for (let i = 0; i < files.length; i++) {
        const f = files[i];

        const extension = f.name.split('.').pop().toLowerCase();
        const fileReader = new FileReader();

        if (extension == "obj" || extension == "mtl") {

            fileReader.onload = function () {
                if (extension == "obj") {
                    env.store.set("objFile", fileReader.result);
                    env.scene = parseOBJ(fileReader.result);
                    createBuffers(env, env.scene.geometries);
                    updateObjects(env, env.scene.geometries);
                }
                else if (extension == "mtl") {
                    env.store.set("mtlFile", fileReader.result);
                    env.materials = parseMTL(fileReader.result);
                    updateMaterials(env, env.materials);
                }
            };

            fileReader.onerror = function () {
                console.log(fileReader.error);
            };

            fileReader.readAsText(f);
        } else {
            fileReader.onload = function () {
                env.images[f.name] = f.name;
                env.store.set("images", env.images);
                env.store.set(f.name, fileReader.result);
                env.textures[f.name] = twgl.createTexture(env.gl, { src: fileReader.result, flipY: true });
                updateMaterialSelector(env, env.ui.materialSelector.value);
            }

            fileReader.onerror = function () {
                console.log(fileReader.error);
            };

            fileReader.readAsDataURL(f);
        }

    }
}

// loads all our settings and data from the object store
function restoreSession(env, customBindings) {
    env.store.get("settings").then((s) => {
        if (s) {
            env.settings = {
                ...env.settings,
                ...s
            };
        }
        setupBindings(env);

        if (customBindings instanceof Function) {
            customBindings(env);
        }
    });

    env.store.get("objFile").then((objFile) => {
        if (objFile) {
            env.scene = parseOBJ(objFile);
            createBuffers(env, env.scene.geometries);
            updateObjects(env, env.scene.geometries);
        }
    });

    env.store.get("mtlFile").then((mtlFile) => {
        if (mtlFile) {
            env.materials = parseMTL(mtlFile);
            updateMaterials(env, env.materials);
        }
    });

    env.store.get("images").then((imgs) => {
        if (imgs) {
            env.images = imgs;

            for (const name in env.images) {
                const n = name;
                env.store.get(name).then((data) => {
                    if (data) {
                        env.textures[n] = twgl.createTexture(env.gl, { src: data, flipY: true });
                    }
                });
            }
        }
    });
}

// saves our current settings to the object store
function saveSettings(env) {
    env.store.set("settings", env.settings);
}


// create buffers for our geometries
function createBuffers(env, geometries) {
    for (const obj of geometries) {
        const bufferInfo = twgl.createBufferInfoFromArrays(env.gl, obj.data);
        const vertexArray = twgl.createVAOFromBufferInfo(env.gl, env.programInfo, bufferInfo);
        obj.gl = { bufferInfo, vertexArray };
    }
}

// exposes r g b properties for an array, so TweakPane lets us use its color picker
function makeColor(array) {
    class Color extends Array {
        constructor(array) {
            super();
            for (let i = 0; i < array.length; i++) {
                this[i] = array[i];
            }
        }
        get r() {
            return this[0];
        }
        get g() {
            return this[1];
        }
        get b() {
            return this[2];
        }
        set r(value) {
            this[0] = value;
        }
        set g(value) {
            this[1] = value;
        }
        set b(value) {
            this[2] = value;
        }
    }

    return new Color(array);
}
