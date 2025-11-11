const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");
const brushBtn = document.querySelector(".brushBtn");
const eraserBtn = document.querySelector(".eraserBtn");
const result = document.querySelector(".result");

let model = getModel();
const imageWidth = 50;
const imageHeight = 50;
const shapes = ["Circle", "Square", "Star", "Triangle"];

let drawing = false;
let currentColor = "black"

document.addEventListener("pointerdown", () => drawing = true);
document.addEventListener("pointerup", () => drawing = false);

canvas.addEventListener("pointermove", draw);
canvas.addEventListener("pointerdown", draw);

c.fillStyle = "white";
c.fillRect(0, 0, canvas.width, canvas.height);
c.fillStyle = "black";

document.addEventListener("loadeddata", () => getModel())

function draw(event){
    setTimeout(() => {
        if (!drawing) return;

        result.textContent = "Hmmm";
        c.fillRect(event.x - canvas.getBoundingClientRect().x - 15, event.y - canvas.getBoundingClientRect().y - 15, 30, 30);
        c.fillRect(event.x - canvas.getBoundingClientRect().x - 7.5, event.y - canvas.getBoundingClientRect().y - 19, 15, 15);
        c.fillRect(event.x - canvas.getBoundingClientRect().x - 7.5, event.y - canvas.getBoundingClientRect().y + 4, 15, 15);
        c.fillRect(event.x - canvas.getBoundingClientRect().x - 19, event.y - canvas.getBoundingClientRect().y - 7.5, 15, 15);
        c.fillRect(event.x - canvas.getBoundingClientRect().x + 4, event.y - canvas.getBoundingClientRect().y - 7.5, 15, 15);
    }, 0.01);
}

function pickBrush(){
    c.fillStyle = "black";
    currentColor = "black";
    brushBtn.classList.add(["selectedBtn"]);
    eraserBtn.classList.remove(["selectedBtn"]);
}
function pickEraser(){
    c.fillStyle = "white";
    currentColor = "white";
    eraserBtn.classList.add(["selectedBtn"]);
    brushBtn.classList.remove(["selectedBtn"]);
}
function clearCanvas(){
    c.fillStyle = "white";
    c.fillRect(0, 0, canvas.width, canvas.height);
    c.fillStyle = currentColor;
    result.textContent = "Hmmm";
}
async function determineShape(){
    if (!model) {
        result.textContent = "Model hasn't loaded yet."
        return
    }

    const image_data = c.getImageData(0, 0, canvas.width, canvas.height).data;
    let grayscaled_image_data = [];

    for (let i = 0; i < image_data.length; i += 4){
        const r = image_data[i];
        const g = image_data[i+1];
        const b = image_data[i+2];

        const gray = 0.3*r + 0.59*g + 0.11*b;

        grayscaled_image_data.push(gray / 255.0);
    }

    let final_image = resizeImage(grayscaled_image_data, canvas.width, canvas.height, imageWidth, imageHeight);
    let isBlankCanvas = true;
    for (let pixel of final_image){
        if (pixel != 1){
            isBlankCanvas = false;
            break;
        }
    }
    if (isBlankCanvas){
        result.textContent = "You've drawn nothing yet!";
        return;
    }

    const features = new Float32Array(final_image);
    const tensor = tf.tensor(features, [1,1,50,50]);

    const prediction = model.predict(tensor);
    const prediction_array = await prediction.array();

    let maxValueIndex = -1;
    let maxValue = -9999;
    for (let i = 0; i < prediction_array[0].length; i++){
        if (prediction_array[0][i] > maxValue){
            maxValue = prediction_array[0][i];
            maxValueIndex = i;
        }
    }
    result.textContent = "I think you drew a " + shapes[maxValueIndex] + "!";
}

async function getModel(){
    try {
        model = await tf.loadLayersModel("./model/model.json");
        console.log("Model successfully loaded!");
    }
    catch(error){
        console.error(error);
        result.textContent = "Error: Cannot load model (Please refresh the page)"
    }
}
function resizeImage(image_data, origWidth, origHeight, targetWidth, targetHeight){
    let image_data2D = [];
    for (let i = 0; i < origHeight; i++){
        let row = [];
        for (let j = 0; j < origWidth; j++){
            row.push(image_data[j + i * origWidth]);
        }
        image_data2D.push(row);
    }

    let resized_image = [];
    for (let i = 0; i < targetHeight; i++){
        for (let j = 0; j < targetWidth; j++){
            resized_image.push(image_data2D[j * (origWidth / targetWidth)][i * (origHeight / targetHeight)]);
        }
    }

    return resized_image;
}