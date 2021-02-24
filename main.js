var currColor = [1.0, 0.0, 0.0, 1.0];
var selected = null;

function changeColor() {
    var temp = document.getElementById('color').value;
    if (temp === 'red') {
        currColor = [1.0, 0.0, 0.0, 1.0];
    }
    else if (temp === 'green') {
        currColor = [0.0, 1.0, 0.0, 1.0];
    }
    else if (temp === 'blue') {
        currColor = [0.0, 0.0, 1.0, 1.0];
    }
    if (temp === 'magenta') {
        currColor = [1.0, 0.0, 1.0, 1.0];
    }
    else if (temp === 'cyan') {
        currColor = [0.0, 1.0, 1.0, 1.0];
    }
    else if (temp === 'yellow') {
        currColor = [1.0, 1.0, 0.0, 1.0];
    }
    else if (temp === 'black') {
        currColor = [0.0, 0.0, 0.0, 1.0];
    }
    if (selected !== null && selected.type === 'polygon') {
        selected.color = currColor;
        selected.id = getID(currColor);
    }
}

function getID(color) {
    return (color[0] * 255) + ((color[1] * 255) << 8) + ((color[2] * 255) << 16) + ((color[3] * 255) << 24);
}

function main() {
    var objects = [];
    var coordList = [];
    var done = false;
    var activeObject = null;
    var startX = 0;
    var startY = 0;
    var isMove = false;
    var oldVertices = [];
    var oldMidPoint = []; // only for square
    var chosenIdx = -1;
    var mousePos = {
        x: 0,
        y: 0
    }

    var buttonIds = [
        'line-button',
        'square-button'
    ];

    var buttonState = 'none';

    buttonIds.forEach(id => {
        let button = document.getElementById(id);
        button.addEventListener('click', function(event) {
            button.disabled = true;
            if (buttonState !== 'none') {
                document.getElementById(buttonState).disabled = false;
            }
            buttonState = id;
        });
    });

    var polybutton = document.getElementById('polygon-button');
    polybutton.addEventListener('click', function(event) {
        polybutton.disabled = true;
        if (done) {
            polybutton.disabled = false;
            done = false;
        }
        buttonState = 'polygon-button';
    });

    function euclideanDistance(p1, p2) {
        return Math.sqrt(Math.pow((p1.x - p2.x), 2) + Math.pow((p1.y - p2.y), 2));
    }

    function getVertexDegree(v1, v2, v3) {
        // MAIN VERTEX : V2
        var v12 = Math.sqrt((Math.pow((v2.x - v1.x), 2)) + (Math.pow((v2.y - v1.y), 2)));
        var v23 = Math.sqrt((Math.pow((v2.x - v3.x), 2)) + (Math.pow((v2.y - v3.y), 2)));
        var v13 = Math.sqrt((Math.pow((v3.x - v1.x), 2)) + (Math.pow((v3.y - v1.y), 2)));
        var temp = Math.acos((v23 * v23 + v12 * v12 - v13 * v13) / (2 * v23 * v12));
        return temp * 180 / Math.PI;
    }

    function triangulizePolygon(coordList) {
        var i, temp, j;
        var len = coordList.length;
        var degreeList = [];
        var vertexResult = [];
        for (i = 0; i < len; i++) {
            temp = getVertexDegree(coordList[(i - 1 + len) % len], coordList[i], coordList[(i + 1) % len]);
            degreeList.push({coord: coordList[i], fstneigh: coordList[(i - 1 + len) % len], secneigh: coordList[(i + 1) % len], degree: temp});
        }
        while (degreeList.length >= 3) {
            degreeList.sort(function(it1, it2) {return ((it1.degree > it2.degree) ? -1 : ((it1.degree == it2.degree) ? 0 : 1))});
            if (degreeList.length == 3) {
                vertexResult.push(degreeList[0].coord.x, degreeList[0].coord.y, degreeList[1].coord.x, degreeList[1].coord.y, degreeList[2].coord.x, degreeList[2].coord.y);
                return vertexResult;
            }
            else {
                temp = degreeList[degreeList.length - 1];
                vertexResult.push(temp.fstneigh.x, temp.fstneigh.y, temp.coord.x, temp.coord.y, temp.secneigh.x, temp.secneigh.y);
                temp = degreeList.pop();
                for (i = 0; i < coordList.length; i++) {
                    if (coordList[i].x == temp.coord.x && coordList[i].y == temp.coord.y) {
                        coordList.splice(i, 1);
                        len = coordList.length;
                    }
                }
                for (i = 0; i < coordList.length; i++) {
                    if (coordList[i].x == temp.fstneigh.x && coordList[i].y == temp.fstneigh.y) {
                        for (j = 0; j < degreeList.length; j++) {
                            if (degreeList[j].coord.x == temp.fstneigh.x && degreeList[j].coord.y == temp.fstneigh.y) {
                                degreeList[j].fstneigh = coordList[(i - 1 + len) % len];
                                degreeList[j].secneigh = coordList[(i + 1) % len];
                                degreeList[j].degree = getVertexDegree(degreeList[j].fstneigh, degreeList[j].coord, degreeList[j].secneigh);
                                break;
                            }
                        }
                    }
                    else if (coordList[i].x == temp.secneigh.x && coordList[i].y == temp.secneigh.y) {
                        for (j = 0; j < degreeList.length; j++) {
                            if (degreeList[j].coord.x == temp.secneigh.x && degreeList[j].coord.y == temp.secneigh.y) {
                                degreeList[j].fstneigh = coordList[(i - 1 + len) % len];
                                degreeList[j].secneigh = coordList[(i + 1) % len];
                                degreeList[j].degree = getVertexDegree(degreeList[j].fstneigh, degreeList[j].coord, degreeList[j].secneigh);
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    var canvas = document.getElementById('cad-canvas');

    canvas.width = 600;
    canvas.height = 600;

    var gl = canvas.getContext('webgl', {preserveDrawingBuffer: true});

    if (!gl) {
        alert('Your browser does not support webgl');
        return;
    }

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Load, compile, and link shaders
    var vertSrc = `precision mediump float;
    
    attribute vec2 vertPos;
    uniform vec2 screenRes;
    uniform mat3 transToOrigin;
    uniform mat3 scaleMat;
    uniform mat3 transBack;

    void main() {
        vec3 transResult = transBack * scaleMat * transToOrigin * vec3(vertPos, 1.0);
        vec2 newPos = 2.0*transResult.xy/screenRes;
        gl_Position = vec4(newPos, 0.0, 1.0);
    }`;

    var fragSrc = `precision mediump float;
  
    uniform vec4 u_fragColor;
    void main() {
        gl_FragColor = u_fragColor;
    }`;

    var vertShader = gl.createShader(gl.VERTEX_SHADER);
    var fragShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertShader, vertSrc);
    gl.shaderSource(fragShader, fragSrc);

    gl.compileShader(vertShader);
    if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
        console.log("failed to compile vertex shader, ", gl.getShaderInfoLog(vertShader));
        return;
    }

    gl.compileShader(fragShader);
    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
        console.log("failed to compile fragment shader, ", gl.getShaderInfoLog(fragShader));
        return;
    }

    var program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log("failed to link program : ", gl.getProgramInfoLog(program));
        return;
    }

    // Set canvas event listener
    canvas.addEventListener('mousemove', canvasOnMouseMove);
    canvas.addEventListener('click', canvasOnClick);
    canvas.addEventListener('mousedown', canvasOnMouseDown);
    canvas.addEventListener('mouseup', canvasOnMouseUp);

    // Set slider event listener
    let slider = document.getElementById('square-slider');
    slider.addEventListener('input', function() {
        if (activeObject) {
            if (activeObject.type === 'square') {
                const newK = 0.1 * slider.value;
                let translateToOrigin = [
                    1.0, 0.0, 0.0,
                    0.0, 1.0, 0.0,
                    -activeObject.midPoint[0], -activeObject.midPoint[1], 1.0
                ];
                let scaleMat = [
                    newK, 0.0, 0.0,
                    0.0, newK, 0.0, 
                    0.0, 0.0, 1.0
                ];
                let translateBack = [
                    1.0, 0.0, 0.0,
                    0.0, 1.0, 0.0,
                    activeObject.midPoint[0], activeObject.midPoint[1], 1.0
                ];
                activeObject.transToOrigin = translateToOrigin;
                activeObject.scaleMat = scaleMat;
                activeObject.transBack = translateBack;
            }
        }
    });

    // Initialize canvas resolution
    gl.useProgram(program);
    let resLocation = gl.getUniformLocation(program, 'screenRes');
    gl.uniform2fv(resLocation, [gl.canvas.width, gl.canvas.height]);

    requestAnimationFrame(render);

    // Canvas Event listener functions
    function canvasOnMouseMove(event) {
        let rect = canvas.getBoundingClientRect();
        let xMax = gl.canvas.width / 2;
        let yMax = gl.canvas.height / 2;

        mousePos.x = event.clientX - rect.x - xMax;
        mousePos.y = rect.y - event.clientY + yMax;
    }

    function canvasOnClick(event) {
        let rect = canvas.getBoundingClientRect();
        if (buttonState === 'line-button') {
            objects.push(
                {
                    type: 'line',
                    vertices: [
                        mousePos.x, mousePos.y,
                        mousePos.x + gl.canvas.width/8, mousePos.y
                    ],
                    scaleMat: [
                        1.0, 0, 0,
                        0, 1.0, 0,
                        0, 0, 1.0
                    ],
                    transToOrigin: [
                        1.0, 0, 0,
                        0, 1.0, 0,
                        0, 0, 1.0
                    ],
                    transBack: [
                        1.0, 0, 0,
                        0, 1.0, 0,
                        0, 0, 1.0
                    ],
                    mode: gl.LINES,
                    color: currColor,
                    type: 'line',
                    id: 0,
                    originColor: currColor
                }
            )
        } else if (buttonState === 'square-button') {
            objects.push(
                {
                    midPoint: [mousePos.x + gl.canvas.width/16, mousePos.y - gl.canvas.height/16],
                    vertices: [
                        mousePos.x, mousePos.y,
                        mousePos.x + gl.canvas.width/8, mousePos.y,
                        mousePos.x + gl.canvas.width/8, mousePos.y - gl.canvas.width/8,
                        mousePos.x, mousePos.y,
                        mousePos.x + gl.canvas.width/8, mousePos.y - gl.canvas.width/8,
                        mousePos.x, mousePos.y - gl.canvas.width/8
                    ],
                    scaleMat: [
                        1.0, 0, 0,
                        0, 1.0, 0,
                        0, 0, 1.0
                    ],
                    transToOrigin: [
                        1.0, 0, 0,
                        0, 1.0, 0,
                        0, 0, 1.0
                    ],
                    transBack: [
                        1.0, 0, 0,
                        0, 1.0, 0,
                        0, 0, 1.0
                    ],
                    mode: gl.TRIANGLES,
                    color: currColor,
                    type: 'square',
                    id: 1,
                    originColor: currColor
                });
        } else if (buttonState === 'polygon-button') {
            console.log(done);
            if (!done) {
                if (coordList.length > 3) {
                    console.log(euclideanDistance({x: mousePos.x, y: mousePos.y}, coordList[0]));
                    if (euclideanDistance({x: mousePos.x, y: mousePos.y}, coordList[0]) < 5) {
                        done = true;
                        objects.push({
                            vertices: triangulizePolygon(coordList),
                            mode: gl.TRIANGLES,
                            color: currColor,
                            type: 'polygon',
                            id: getID(currColor),
                            originColor: currColor,
                            scaleMat: [
                                1.0, 0, 0,
                                0, 1.0, 0,
                                0, 0, 1.0
                            ],
                            transToOrigin: [
                                1.0, 0, 0,
                                0, 1.0, 0,
                                0, 0, 1.0
                            ],
                            transBack: [
                                1.0, 0, 0,
                                0, 1.0, 0,
                                0, 0, 1.0
                            ]
                        });
                        coordList = [];
                    }
                    else {
                        coordList.push({x: mousePos.x, y: mousePos.y});
                    }
                }
                else {
                    coordList.push({x: mousePos.x, y: mousePos.y});
                }
            }
        }
        else if (buttonState === 'none') {
            const pixelX = (event.clientX - rect.left) * gl.canvas.width / canvas.clientWidth;
            const pixelY = gl.canvas.height - (event.clientY - rect.top) * gl.canvas.height / canvas.clientHeight - 1;
            var data = new Uint8Array(4);
            gl.readPixels(pixelX, pixelY, 1,1, gl.RGBA, gl.UNSIGNED_BYTE, data);
            const id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24);
            console.log(id);
            if (id !== 0) {
                for (i = 0; i < objects.length; i++) {
                    console.log(objects[i].id);
                    if (objects[i].id === id && selected === null) {
                        selected = objects[i];
                        console.log("Polygon " + selected.id + " selected");
                        break;
                    }
                    else if (objects[i].id === id && selected !== null) {
                        selected = objects[i];
                        console.log("Polygon " + selected.id + " selected");
                    }
                }
            }
            else {
                selected = null;
            }
        }
        console.log(buttonState);
        if (buttonState !== 'none') {
            if (buttonState !== 'polygon-button') {
                document.getElementById(buttonState).disabled = false;
                buttonState = 'none';
            }
            else {
                if (done) {
                    document.getElementById(buttonState).disabled = false;
                    buttonState = 'none';
                }
            }
        }
    }

    function canvasOnMouseDown(event) {
        activeObject = null;
        isMove = false;
        chosenIdx = -1;
        document.getElementById("scale-box").style.display = 'none';
        for (object of objects) {
            oldVertices = [];
            oldMidPoint = [];
            for (let i = 0; i < object.vertices.length; i += 2) {
                let mat = matrixMultiplication(
                    matrixTranspose(object.transBack), 
                    matrixMultiplication(matrixTranspose(object.scaleMat), matrixTranspose(object.transToOrigin))
                );
                let transformedVertice = transform(mat, [object.vertices[i], object.vertices[i + 1], 1.0])
                oldVertices.push(object.vertices[i]);
                oldVertices.push(object.vertices[i + 1]);
                if (Math.abs(transformedVertice[0] - mousePos.x) < 5 && Math.abs(transformedVertice[1] - mousePos.y) < 5) {
                    isMove = true;
                    activeObject = object;
                    startX = mousePos.x;
                    startY = mousePos.y;
                    chosenIdx = i;
                    if (object.type === 'square') {
                        oldMidPoint.push(object.midPoint[0]);
                        oldMidPoint.push(object.midPoint[1]);
                    }
                }
            }
            if (isMove)
                break;
        }

        if (isMove) {
            if (activeObject.type === 'square') {
                document.getElementById("scale-box").style.display = 'inline';
            }
        }
    }

    function canvasOnMouseUp(event) {
        isMove = false;
    }

    // Matrix related functions
    function matrixTranspose(mat) {
        let copyMat = [];
        for (elmt of mat) {
            copyMat.push(elmt);
        }

        for (let i = 0; i < 3; i++) {
            for (let j = i; j < 3; j++) {
                let temp = copyMat[3*i + j];
                copyMat[3*i + j] = copyMat[3*j + i];
                copyMat[3*j + i] = temp;
            }
        }

        return copyMat;
    }

    function matrixMultiplication(matA, matB) {

        if (matA.length != matB.length) {
            return;
        }
    
        let outputMat = [];
        let matLength = 3;
        for (let i = 0; i < matLength; i++) {
            for (let j = 0; j < matLength; j++) {
                let sum = 0;
                for (let k = 0; k < matLength; k++) {
                    sum += matA[i*matLength + k] * matB[k*matLength + j];
                }
                outputMat.push(sum);
            }
        }
    
        return outputMat;
    }

    function transform(mat, vertice) {
        let tempVertice = [];
        let n = vertice.length;
        for (let i = 0; i < n; i++) {
            let sum = 0.0;
            for (let j = 0; j < n; j++) {
                sum += (mat[i*n + j] * vertice[j]);
            }
            tempVertice.push(sum);
        }

        return tempVertice;
    }

    function moveObject() {
        if (isMove) {
            let xTrans = mousePos.x - startX;
            let yTrans = mousePos.y - startY;
            if (activeObject.type === 'line') {
                activeObject.vertices[chosenIdx] = oldVertices[chosenIdx] + xTrans;
                activeObject.vertices[chosenIdx + 1] = oldVertices[chosenIdx + 1] + yTrans;
            } else {
                for (let i = 0; i < activeObject.vertices.length; i += 2) {
                    activeObject.vertices[i] = oldVertices[i] + xTrans;
                    activeObject.vertices[i + 1] = oldVertices[i + 1] + yTrans;
                }

                if (activeObject.type === 'square') {
                    activeObject.midPoint[0] = oldMidPoint[0] + xTrans;
                    activeObject.midPoint[1] = oldMidPoint[1] + yTrans;
                    let translateToOrigin = [
                        1.0, 0.0, 0.0,
                        0.0, 1.0, 0.0,
                        -activeObject.midPoint[0], -activeObject.midPoint[1], 1.0
                    ];
                    let translateBack = [
                        1.0, 0.0, 0.0,
                        0.0, 1.0, 0.0,
                        activeObject.midPoint[0], activeObject.midPoint[1], 1.0
                    ];
                    activeObject.transToOrigin = translateToOrigin;
                    activeObject.transBack = translateBack;
                }
            }
        }
    }

    // Render related functions
    function drawObject(object, program) {
        let buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.vertices), gl.STATIC_DRAW);

        gl.useProgram(program);
        let pos = gl.getAttribLocation(program, 'vertPos');
        gl.vertexAttribPointer(
            pos,
            2,
            gl.FLOAT,
            gl.FALSE,
            2 * Float32Array.BYTES_PER_ELEMENT,
            0
        );
        
        var uniformCol = gl.getUniformLocation(program, 'u_fragColor')
        gl.uniform4fv(uniformCol, object.color);
        gl.enableVertexAttribArray(pos);

        let matLocation = gl.getUniformLocation(program, 'transToOrigin');
        gl.uniformMatrix3fv(matLocation, false, new Float32Array(object.transToOrigin));
        matLocation = gl.getUniformLocation(program, 'scaleMat');
        gl.uniformMatrix3fv(matLocation, false, new Float32Array(object.scaleMat));
        matLocation = gl.getUniformLocation(program, 'transBack');
        gl.uniformMatrix3fv(matLocation, false, new Float32Array(object.transBack));

        gl.drawArrays(object.mode, 0, object.vertices.length/2);
    }

    function render() {
        moveObject();
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(program);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        for (object of objects) {
            drawObject(object, program);
        }
        requestAnimationFrame(render);
    };
}

main();