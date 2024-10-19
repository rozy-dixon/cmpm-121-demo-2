import "./style.css";

const APP_NAME = "Computer Think Pt2";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

// ---------------------------------------------- INITS

interface Input {
    x: number;
    y: number;
    drawing: boolean;
}

const cursor: Input = { x: 0, y: 0, drawing: false}

// ---------------------------------------------- DISPLAY

const header = document.createElement("h1");
header.innerHTML = APP_NAME;
app.append(header);

const canvas = document.createElement("canvas");
canvas.width = canvas.height = 256;
app.append(canvas);

const context: any = canvas.getContext("2d");

// ---------------------------------------------- CANVAS BASE FUNCTIONALITY

canvas.addEventListener("mousedown", (e) => {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    cursor.drawing = true;
});

canvas.addEventListener("mousemove", (e) => {
    if (cursor.drawing) {
        drawLine(context, cursor.x, cursor.y, e.offsetX, e.offsetY)
    }
});

canvas.addEventListener("mouseout", (e) => {
    cursor.drawing = false;
})

window.addEventListener("mouseup", (e) => {
    cursor.drawing = false;
});

function drawLine(context: any, x: number, y: number, xOffeset: number, yOffset: number) {
    context.beginPath();
    context.strokeStyle = "black";
    context.lineWidth = 1;
    context.moveTo(x, y);
    context.lineTo(xOffeset, yOffset);
    context.stroke();
    cursor.x = xOffeset;
    cursor.y = yOffset;
}

// ---------------------------------------------- CANVAS BUTTONS

const buttonDiv = document.createElement("div")
app.append(buttonDiv);

const clearButton = document.createElement("button");
clearButton.innerHTML = 'clear';
buttonDiv.append(clearButton);

clearButton.addEventListener("click", () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
})