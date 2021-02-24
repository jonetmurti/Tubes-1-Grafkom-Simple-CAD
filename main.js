function main() {
    var objects = [];
    var activeObject = null;
    var id = 0;
    var startX = 0;
    var startY = 0;
    var isMove = false;
    var oldVertices = [];
    var chosenIdx = -1;
    var mousePos = {
        x: 0,
        y: 0
    }

    var buttonIds = [
        'line-button',
        'square-button',
        'polygon-button'
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

    var canvas = document.getElementById('cad-canvas');

    canvas.width = 600;
    canvas.height = 600;

    var gl = canvas.getContext('webgl');

    if (!gl) {
        alert('Your browser does not support webgl');
        return;
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // TODO : load, compile, and link shaders
    var vertSrc = `precision mediump float;
    
    attribute vec2 vertPos;
    uniform vec2 screenRes;

    void main() {
        vec2 newPos = 2.0*vertPos/screenRes;
        gl_Position = vec4(newPos, 0.0, 1.0);
    }`;

    var fragSrc = `precision mediump float;

    void main() {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
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
    canvas.addEventListener('mousemove', canvasOnMouseMove);
    canvas.addEventListener('click', canvasOnClick);
    canvas.addEventListener('mousedown', canvasOnMouseDown);
    canvas.addEventListener('mouseup', canvasOnMouseUp);

    // Initialize uniforms
    gl.useProgram(program);
    let resLocation = gl.getUniformLocation(program, 'screenRes');
    gl.uniform2fv(resLocation, [gl.canvas.width, gl.canvas.height]);

    requestAnimationFrame(render);

    function canvasOnMouseMove(event) {
        var rect = canvas.getBoundingClientRect();
        var xMax = gl.canvas.width / 2;
        var yMax = gl.canvas.height / 2;

        mousePos.x = event.clientX - rect.x - xMax;
        mousePos.y = rect.y - event.clientY + yMax;
    }

    function canvasOnClick(event) {
        if (buttonState === 'line-button') {
            objects.push(
                {
                    type: 'line',
                    vertices: [
                        mousePos.x, mousePos.y,
                        mousePos.x + gl.canvas.width/8, mousePos.y
                    ],
                    k: 1,
                    scaleMat: [
                        1.0, 0, 0,
                        0, 1.0, 0,
                        0, 0, 1.0
                    ],
                    mode: gl.LINES
                }
            )
            console.log(objects);
            id++;
        } else if (buttonState === 'square-button') {
            // add square
        } else if (buttonState === 'polygon-button') {
            // add polygon
        }

        if (buttonState !== 'none') {
            document.getElementById(buttonState).disabled = false;
            buttonState = 'none';
        }
    }

    function canvasOnMouseDown(event) {
        activeObject = null;
        isMove = false;
        for (object of objects) {
            oldVertices = [];
            for (let i = 0; i < object.vertices.length; i += 2) {
                let transformedVertice = transform(object.scaleMat, [object.vertices[i], object.vertices[i + 1], 1.0])
                oldVertices.push(object.vertices[i]);
                oldVertices.push(object.vertices[i + 1]);
                if (Math.abs(transformedVertice[0] - mousePos.x) < 5 && Math.abs(transformedVertice[1] - mousePos.y) < 5) {
                    isMove = true;
                    activeObject = object;
                    startX = mousePos.x;
                    startY = mousePos.y;
                    chosenIdx = i;
                }
            }
            if (isMove)
                break;
        }
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

    function canvasOnMouseUp(event) {
        document.getElementById('mouse-button').innerText = 'lepas';
        isMove = false;
        chosenIdx = -1;
    }

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
        gl.enableVertexAttribArray(pos);
        gl.drawArrays(object.mode, 0, object.vertices.length/2);
    }

    function moveObject() {
        if (isMove) {
            console.log('moving');
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
            }
        }
    }

    function render() {
        moveObject();
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        for (object of objects) {
            drawObject(object, program);
        }
        requestAnimationFrame(render);
    };
}

main();