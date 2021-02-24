var canvas = document.getElementById("cad-canvas")
var ctx = canvas.getContext("webgl")
var fileReader = new FileReader()

function canvasToJSON(objects){
    out = [];

    for (var i = 0; i < objects.length; i++){
        var object = {
            vertices: objects[i].vertices,
            mode: objects[i].mode,
            color: objects[i].color
        }

        out.push(object)
    }

    return out;
}

document.getElementById("save-button").addEventListener("click", function(){
    data = canvasToJSON(objects)
    jsonData = JSON.stringify(data)

    var filename = prompt("filename:", "data")
    if (filename == null){
        filename = "data";
    }

    var file = new Blob([jsonData], {
        type : "application/json"
    })

    var a = document.createElement("a")
    a.href = URL.createObjectURL(file)
    a.download = filename + ".json"
    a.click()
});

document.getElementById("load-button").addEventListener("change", function(){
    if (this.files[0]){
        fileReader.readAsText(this.files[0]);
    }
});

fileReader.onload = function(){
    objects = JSON.parse(fileReader.result);
};