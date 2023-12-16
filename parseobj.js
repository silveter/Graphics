// WebGL2 - load obj - w/mtl, normal maps
// from https://webgl2fundamentals.org/webgl/webgl-load-obj-w-mtl-w-normal-maps.html


"use strict";

// This is not a full .obj parser.
// see http://paulbourke.net/dataformats/obj/

function parseOBJ(text) {
    // because indices are base 1 let's just fill in the 0th data
    const objPositions = [[0, 0, 0]];
    const objTexcoords = [[0, 0]];
    const objNormals = [[0, 0, 0]];
    const objColors = [[0, 0, 0]];

    // same order as `f` indices
    const objVertexData = [
        objPositions,
        objTexcoords,
        objNormals,
        objColors,
    ];

    // same order as `f` indices
    let webglVertexData = [
        [],   // positions
        [],   // texcoords
        [],   // normals
        [],   // colors
    ];

    const materialLibs = [];
    const geometries = [];
    const bounds = {
        min: [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
        max: [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY]
    };
    let geometry;
    //let groups = ['default'];
    //let object = 'default';
    let material = 'default';
    let name = 'default';


    const noop = () => { };

    function newGeometry() {
        // If there is an existing geometry and it's
        // not empty then start a new one.
        if (geometry && geometry.data.position.length) {
            geometry = undefined;
        }
    }

    function setGeometry() {
        if (!geometry) {
            const position = [];
            const texcoord = [];
            const normal = [];
            const color = [];
            webglVertexData = [
                position,
                texcoord,
                normal,
                color,
            ];
            geometry = {
                //object,
                //groups,
                name,
                material,
                bounds: {
                    min: [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
                    max: [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY]
                },
                data: {
                    position,
                    texcoord,
                    normal,
                    color,
                },
            };
            geometries.push(geometry);
        }
    }

    function addVertex(vert) {
        const ptn = vert.split('/');
        ptn.forEach((objIndexStr, i) => {
            if (!objIndexStr) {
                return;
            }
            const objIndex = parseInt(objIndexStr);
            const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
            webglVertexData[i].push(...objVertexData[i][index]);
            // if this is the position index (index 0) and we parsed
            // vertex colors then copy the vertex colors to the webgl vertex color data
            if (i === 0 && objColors.length > 1) {
                geometry.data.color.push(...objColors[index]);
            }
        });
    }

    const keywords = {
        v(parts) {
            // if there are more than 3 values here they are vertex colors
            if (parts.length > 3) {
                objPositions.push(parts.slice(0, 3).map(parseFloat));
                objColors.push(parts.slice(3).map(parseFloat));
            } else {
                objPositions.push(parts.map(parseFloat));
            }
        },
        vn(parts) {
            objNormals.push(parts.map(parseFloat));
        },
        vt(parts) {
            let texCoords = parts.map(parseFloat);

            // make sure we always have 2D texcoords
            if (texCoords.length > 2) {
                texCoords.length = 2;
            } else if (texCoords.length == 1) {
                texCoords.push(0);
            }

            objTexcoords.push(texCoords);
        },
        f(parts) {
            setGeometry();
            const numTriangles = parts.length - 2;
            for (let tri = 0; tri < numTriangles; ++tri) {
                addVertex(parts[0]);
                addVertex(parts[tri + 1]);
                addVertex(parts[tri + 2]);
            }
        },
        s: noop,    // smoothing group
        mtllib(parts) {
            // the spec says there can be multiple file here
            // but I found one with a space in the filename
            materialLibs.push(parts.join(' '));
        },
        usemtl(parts, unparsedArgs) {
            material = unparsedArgs;
            newGeometry();
        },
        // while the spec allows more elaborate grouping mechanisms, almost all files in the wild
        // use either g or o (interchanchably and inconsistently) to define a single part
        g(parts, unparsedArgs) {
            name = unparsedArgs;
            newGeometry();
        },
        o(parts, unparsedArgs) {
            name = unparsedArgs;
            newGeometry();
        }
        /*
        g(parts) {
            groups = parts;
            newGeometry();
        },
        o(parts, unparsedArgs) {
            object = unparsedArgs;
            newGeometry();
        },*/
    };

    const keywordRE = /(\w*)(?: )*(.*)/;
    const lines = text.split('\n');
    for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
        const line = lines[lineNo].trim();
        if (line === '' || line.startsWith('#')) {
            continue;
        }
        const m = keywordRE.exec(line);
        if (!m) {
            continue;
        }
        const [, keyword, unparsedArgs] = m;
        const parts = line.split(/\s+/).slice(1);
        const handler = keywords[keyword];
        if (!handler) {
            console.warn('unhandled keyword:', keyword);  // eslint-disable-line no-console
            continue;
        }
        handler(parts, unparsedArgs);
    }

    // remove any arrays that have no entries.
    for (const geometry of geometries) {
        geometry.data = Object.fromEntries(
            Object.entries(geometry.data).filter(([, array]) => array.length > 0));
    }

    // compute bounds and normals (if needed)
    for (const geometry of geometries) {

        // if the part does not have normals, we will compute them
        if (geometry.data.normal == undefined) {

            let vertexNormalMap = new Map();

            // cantor pairing function
            const cantor = function (a, b) {
                return (a + b + 1) * (a + b) / 2 + b;
            }

            // hash function for our vertices by repated application of the cantor pairing function
            // (could break down due to numerical precision, but as the JavaScript Number type is 64 bit, this should work reasonably well)
            const hash = function (a, b, c) {
                return cantor(a, cantor(b, c));
            }


            for (let i = 0; i < geometry.data.position.length; i += 9) {

                const p = [glMatrix.vec3.fromValues(geometry.data.position[i + 0], geometry.data.position[i + 1], geometry.data.position[i + 2]),
                glMatrix.vec3.fromValues(geometry.data.position[i + 3], geometry.data.position[i + 4], geometry.data.position[i + 5]),
                glMatrix.vec3.fromValues(geometry.data.position[i + 6], geometry.data.position[i + 7], geometry.data.position[i + 8])];

                // compute the per-face normal
                const a = glMatrix.vec3.create();
                glMatrix.vec3.subtract(a, p[2], p[1]);

                const b = glMatrix.vec3.create();
                glMatrix.vec3.subtract(b, p[0], p[1]);

                const fn = glMatrix.vec3.create();
                glMatrix.vec3.cross(fn, a, b);
                glMatrix.vec3.normalize(fn, fn);

                // add the normal to our map
                for (let j = 0; j < 3; j++) {

                    const hv = hash(p[j][0], p[j][1], p[j][2]);
                    let nn = vertexNormalMap.get(hv);

                    if (nn == undefined)
                        nn = glMatrix.vec3.fromValues(0.0, 0.0, 0.0);

                    glMatrix.vec3.add(nn, fn, nn);
                    vertexNormalMap.set(hv, nn);
                }
            }

            geometry.data.normal = new Array(geometry.data.position.length);
            geometry.data.normal.fill(0.0);

            // final pass to normalize all the vertex normals
            for (let i = 0; i < geometry.data.position.length; i += 3) {
                const v = glMatrix.vec3.fromValues(geometry.data.position[i + 0], geometry.data.position[i + 1], geometry.data.position[i + 2]);
                const hv = hash(v[0], v[1], v[2]);

                let nn = vertexNormalMap.get(hv);
                glMatrix.vec3.normalize(nn, nn);

                for (let j = 0; j < 3; j++) {
                    geometry.data.normal[i + j] = nn[j];
                }
            }
        }

        // if we have texture coordinates, generate tangents
        if (geometry.data.texcoord) {
            geometry.data.tangent = generateTangents(geometry.data.position, geometry.data.texcoord);
        }
        else {
            geometry.data.tangent = { value: [1, 0, 0] };
        }

        for (let i = 0; i < geometry.data.position.length; i += 3) {
            for (let j = 0; j < 3; j++) {
                geometry.bounds.min[j] = Math.min(geometry.data.position[i + j], geometry.bounds.min[j]);
                geometry.bounds.max[j] = Math.max(geometry.data.position[i + j], geometry.bounds.max[j]);
            }
        }

        for (let j = 0; j < 3; j++) {
            bounds.min[j] = Math.min(geometry.bounds.min[j], bounds.min[j]);
            bounds.max[j] = Math.max(geometry.bounds.max[j], bounds.max[j]);
        }
    }

    return {
        geometries,
        materialLibs,
        bounds
    };
}

function parseMapArgs(unparsedArgs) {
    // TODO: handle options
    return unparsedArgs;
}

function parseMTL(text) {
    const materials = {};
    let material;

    // we parse the standard keywords as well as some common extensions
    // and give them nice readable names
    const keywords = {
        newmtl(parts, unparsedArgs) {
            material = {
            };
            materials[unparsedArgs] = material;
        },
        /* eslint brace-style:0 */
        Ns(parts) { material.shininess = parseFloat(parts[0]); },
        Ka(parts) { material.ambient = parts.map(parseFloat); },
        Kd(parts) { material.diffuse = parts.map(parseFloat); },
        Ks(parts) { material.specular = parts.map(parseFloat); },
        Ke(parts) { material.emissive = parts.map(parseFloat); },
        map_Ns(parts, unparsedArgs) { material.shininessMap = parseMapArgs(unparsedArgs); },
        map_Ka(parts, unparsedArgs) { material.ambientMap = parseMapArgs(unparsedArgs); },
        map_Kd(parts, unparsedArgs) { material.diffuseMap = parseMapArgs(unparsedArgs); },
        map_Ks(parts, unparsedArgs) { material.specularMap = parseMapArgs(unparsedArgs); },
        map_Ke(parts, unparsedArgs) { material.emissiveMap = parseMapArgs(unparsedArgs); },
        map_Bump(parts, unparsedArgs) { material.bumpMap = parseMapArgs(unparsedArgs); },
        Ni(parts) { material.opticalDensity = parseFloat(parts[0]); },
        d(parts) { material.opacity = parseFloat(parts[0]); },
        illum(parts) { material.illum = parseInt(parts[0]); },
    };

    const keywordRE = /(\w*)(?: )*(.*)/;
    const lines = text.split('\n');
    for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
        const line = lines[lineNo].trim();
        if (line === '' || line.startsWith('#')) {
            continue;
        }
        const m = keywordRE.exec(line);
        if (!m) {
            continue;
        }
        const [, keyword, unparsedArgs] = m;
        const parts = line.split(/\s+/).slice(1);
        const handler = keywords[keyword];
        if (!handler) {

            // to ease experimentation, we will allow for non-standard texture maps of any kind,
            // which will be passed through with a similar naming convention to the other maps, e.g.,
            // map_MyStuff -> myStuffMap
            if (keyword.startsWith("map_")) {
                const mapName = keyword.charAt(4).toLowerCase() + keyword.slice(5).toLowerCase() + "Map";
                material[mapName] = parseMapArgs(unparsedArgs);
                console.warn("Non-standard keyword '" + keyword + "' was passed through as '" + mapName + "'.");
            } else {
                console.warn("Unhandled keyword '" + keyword + "' was stripped.");
            }

            continue;
        }
        handler(parts, unparsedArgs);
    }

    return materials;
}

function makeIndexIterator(indices) {
    let ndx = 0;
    const fn = () => indices[ndx++];
    fn.reset = () => { ndx = 0; };
    fn.numElements = indices.length;
    return fn;
}

function makeUnindexedIterator(positions) {
    let ndx = 0;
    const fn = () => ndx++;
    fn.reset = () => { ndx = 0; };
    fn.numElements = positions.length / 3;
    return fn;
}

const subtractVector2 = (a, b) => a.map((v, ndx) => v - b[ndx]);

function getExtents(positions) {
    const min = positions.slice(0, 3);
    const max = positions.slice(0, 3);
    for (let i = 3; i < positions.length; i += 3) {
        for (let j = 0; j < 3; ++j) {
            const v = positions[i + j];
            min[j] = Math.min(v, min[j]);
            max[j] = Math.max(v, max[j]);
        }
    }
    return { min, max };
}

function getGeometriesExtents(geometries) {
    return geometries.reduce(({ min, max }, { data }) => {
        const minMax = getExtents(data.position);
        return {
            min: min.map((min, ndx) => Math.min(minMax.min[ndx], min)),
            max: max.map((max, ndx) => Math.max(minMax.max[ndx], max)),
        };
    }, {
        min: Array(3).fill(Number.POSITIVE_INFINITY),
        max: Array(3).fill(Number.NEGATIVE_INFINITY),
    });
}


function generateTangents(position, texcoord, indices) {
    const getNextIndex = indices ? makeIndexIterator(indices) : makeUnindexedIterator(position);
    const numFaceVerts = getNextIndex.numElements;
    const numFaces = numFaceVerts / 3;

    const tangents = [];
    for (let i = 0; i < numFaces; ++i) {
        const n1 = getNextIndex();
        const n2 = getNextIndex();
        const n3 = getNextIndex();

        const p1 = position.slice(n1 * 3, n1 * 3 + 3);
        const p2 = position.slice(n2 * 3, n2 * 3 + 3);
        const p3 = position.slice(n3 * 3, n3 * 3 + 3);

        const uv1 = texcoord.slice(n1 * 2, n1 * 2 + 2);
        const uv2 = texcoord.slice(n2 * 2, n2 * 2 + 2);
        const uv3 = texcoord.slice(n3 * 2, n3 * 2 + 2);

        const dp12 = glMatrix.vec3.create();
        glMatrix.vec3.subtract(dp12, p2, p1);

        const dp13 = glMatrix.vec3.create();
        glMatrix.vec3.subtract(dp13, p3, p1);

        const duv12 = subtractVector2(uv2, uv1);
        const duv13 = subtractVector2(uv3, uv1);

        const f = 1.0 / (duv12[0] * duv13[1] - duv13[0] * duv12[1]);

        const dp12s = glMatrix.vec3.create();
        glMatrix.vec3.scale(dp12s, dp12, duv13[1]);

        const dp13s = glMatrix.vec3.create();
        glMatrix.vec3.scale(dp13s, dp13, duv12[1]);

        const d = glMatrix.vec3.create();
        glMatrix.vec3.subtract(d, dp12s, dp13s);
        glMatrix.vec3.scale(d, d, f);
        glMatrix.vec3.normalize(d, d);

        const tangent = Number.isFinite(f) ? d : [1, 0, 0];

        tangents.push(...tangent, ...tangent, ...tangent);
    }

    return tangents;
}
