var currColor = [1.0, 0.0, 0.0, 1.0];

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
}

function main() {
    var objects = [];

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
                    color: currColor
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
                    color: currColor
                }
            )
        } else if (buttonState === 'polygon-button') {
            // add polygon
        }

        if (buttonState !== 'none') {
            document.getElementById(buttonState).disabled = false;
            buttonState = 'none';
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
        for (object of objects) {
            drawObject(object, program);
        }
        requestAnimationFrame(render);
    };
}

main();