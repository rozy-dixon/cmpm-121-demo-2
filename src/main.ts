import "./style.css";

const APP_NAME = "Computer Think Pt2";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

// things to remember:
// - shift, opt, f to format

// to-do 
// - PWA/manifest
// undo and redo clear

// ---------------------------------------------- INITS

interface Input {
    x: number;
    y: number;
    drawing: boolean;
}

const cursor: Input = { x: 0, y: 0, drawing: false };

interface Point {
    x: number;
    y: number;
}

const drawnLines: Array<Array<Point> | undefined> = [];
const linesToDraw: Array<Array<Point> | undefined> = [];

let lineInProgress: Array<Point> | undefined = [];

interface Button {
    // src = https://chat.brace.tools/s/43dd6ec1-7db6-4588-a338-49af88ca2f4c
    text: string;
    action: () => void;
}

const buttons: Array<Button> = [
    { text: "clear", action: clear },
    { text: "undo", action: undo },
    { text: "redo", action: redo },
];

// ---------------------------------------------- DISPLAY

const header = document.createElement("h1");
header.innerHTML = APP_NAME;
app.append(header);

const canvas = document.createElement("canvas");
canvas.width = canvas.height = 256;
app.append(canvas);

const context: CanvasRenderingContext2D | null = canvas.getContext("2d");

// ---------------------------------------------- CANVAS BASE FUNCTIONALITY

canvas.addEventListener("mousedown", (e) => {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    cursor.drawing = true;

    lineInProgress = [];
    drawnLines.push(lineInProgress);
    lineInProgress.push({ x: cursor.x, y: cursor.y });
    linesToDraw.splice(0, linesToDraw.length);

    canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
    if (cursor.drawing) {
        cursor.x = e.offsetX;
        cursor.y = e.offsetY;
        lineInProgress?.push({ x: cursor.x, y: cursor.y });

        canvas.dispatchEvent(new CustomEvent("drawing-changed"));
    }
});

function stopDrawing() {
    cursor.drawing = false;
    lineInProgress = undefined;
    canvas.dispatchEvent(new CustomEvent("drawing-changed"));
}

canvas.addEventListener("mouseleave", stopDrawing);
globalThis.addEventListener("mouseup", stopDrawing);

canvas.addEventListener("drawing-changed", function () {
    context?.clearRect(0, 0, canvas.width, canvas.height);
    drawnLines.forEach((line) => {
        if (line != undefined && line.length > 1 && line) {
            context?.beginPath();
            const point: Point = line[0];
            context?.moveTo(point.x, point.y);
            for (const { x, y } of line) {
                context?.lineTo(x, y);
            }
            context?.stroke();
        }
    });
});

// ---------------------------------------------- CANVAS BUTTONS

const buttonDiv = document.createElement("div");
app.append(buttonDiv);

function clear() {
    drawnLines.splice(0, drawnLines.length);
    canvas.dispatchEvent(new CustomEvent("drawing-changed"));
}

function undo() {
    if (drawnLines.length > 0) {
        linesToDraw.push(drawnLines.pop());
        canvas.dispatchEvent(new CustomEvent("drawing-changed"));
    }
}

function redo() {
    if (linesToDraw.length > 0) {
        drawnLines.push(linesToDraw.pop());
        canvas.dispatchEvent(new CustomEvent("drawing-changed"));
    }
}

buttons.forEach((element) => {
    const button = document.createElement("button");
    button.innerHTML = element.text;
    button.addEventListener("click", element.action);
    buttonDiv.append(button);
});
