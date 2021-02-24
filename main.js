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

    // TODO : load, compile, and link shaders
    var vertSrc = `precision mediump float;
    
    attribute vec2 vertPos;

    void main() {
        gl_Position = vec4(vertPos, 0.0, 1.0);
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

    // TODO : set event listener
    canvas.addEventListener('click', function(event) {
        var rect = canvas.getBoundingClientRect();
        var xMax = canvas.width / 2;
        var xCoor = (event.clientX - rect.x - xMax) / xMax;

        var yMax = canvas.height / 2;
        var yCoor = (-1*(event.clientY - rect.y) + yMax) / yMax;

        console.log('xCoor:', xCoor);
        console.log('yCoor:', yCoor);
        
        if (buttonState === 'line-button') {
            objects.push(
                {
                    vertices: [
                        xCoor, yCoor,
                        xCoor + 0.25, yCoor
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
                    vertices: [
                        xCoor, yCoor,
                        xCoor + 0.25, yCoor,
                        xCoor + 0.25, yCoor - 0.25,
                        xCoor, yCoor,
                        xCoor + 0.25, yCoor - 0.25,
                        xCoor, yCoor - 0.25
                    ],
                    mode: gl.TRIANGLES,
                    color: currColor,
                    type: 'square',
                    id: 1,
                    originColor: currColor
                }
            )
        } else if (buttonState === 'polygon-button') {
            console.log(done);
            if (!done) {
                if (coordList.length > 3) {
                    console.log(euclideanDistance({x: xCoor, y: yCoor}, coordList[0]));
                    if (euclideanDistance({x: xCoor, y: yCoor}, coordList[0]) < 0.025) {
                        done = true;
                        objects.push({
                            vertices: triangulizePolygon(coordList),
                            mode: gl.TRIANGLES,
                            color: currColor,
                            type: 'polygon',
                            id: getID(currColor),
                            originColor: currColor
                        });
                        coordList = [];
                    }
                    else {
                        coordList.push({x: xCoor, y: yCoor});
                    }
                }
                else {
                    coordList.push({x: xCoor, y: yCoor});
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
    });

    requestAnimationFrame(render);

    function drawObject(object, program) {
        var buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.vertices), gl.STATIC_DRAW);

        gl.useProgram(program);
        var pos = gl.getAttribLocation(program, 'vertPos');
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
        gl.drawArrays(object.mode, 0, object.vertices.length/2);
    }

    function render() {
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