import "./style.css";

const APP_NAME = "COMPUTER THINK 2";
const CANVAS_SIZE: number = 256
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

// things to remember:
// - shift, opt, f to format
// - ternary operator

// to-do
// - PWA/manifest
// undo and redo clear
// - pass vars into events
// - destroy redo after clear
// - make selected button more concise
// - import button
// - stiker button to function
// - get rid of magic numbers

// ---------------------------------------------- DISPLAY

const header = document.createElement("h1");
header.innerHTML = APP_NAME;
app.append(header);

let canvas: HTMLCanvasElement = document.createElement("canvas");
canvas.width = canvas.height = CANVAS_SIZE;
app.append(canvas);

let context: CanvasRenderingContext2D = canvas.getContext("2d")!;

// ---------------------------------------------- INITS

// INPUT AND PREVIEW

interface Input {
    x: number;
    y: number;
    drawing: boolean;
}

const cursor: Input = { x: 0, y: 0, drawing: false };

interface Preview {
    draw: () => void;
}

function previewInput(
    x: number,
    y: number,
    thickness: boolean,
    color: string,
    emoji: string | undefined,
): Preview {
    function draw() {
        context.clearRect(0, 0, canvas.width, canvas.height);

        pastEdits.forEach((line) => {
            line.display();
        });

        if (stickerMode && emoji != undefined) {
            context.globalAlpha = 0.25;
            context.font = `${STICKER_SIZE}px Inter`;
            context.fillText(
                emoji,
                x - (STICKER_SIZE / 2),
                y + (STICKER_SIZE / 2),
            );
        } else {
            context.beginPath();
            context.strokeStyle = color;
            context.arc(x, y, 15, 0, Math.PI * 2);
            context.lineWidth = thickness == true ? MARKER_WEIGHT : PENCIL_WEIGHT;
            context.globalAlpha = 0.25;
            context.stroke();
            context.closePath();
        }
    }

    return { draw };
}

let inputPreview: Preview;

interface Edit {
    display: () => void;
    drag: (x: number, y: number) => void;
}

let rangeValue: number = 100;
let colorValue: string = "#ffffff";

// LINE

interface Point {
    x: number;
    y: number;
}

let isThick: boolean = false;
const MARKER_WEIGHT: number = 10;
const PENCIL_WEIGHT: number = 2;

// src = https://chat.brace.tools/s/d667c7d4-4bcc-45a0-9ba2-9fab4366a24f
interface Line {
    display: () => void;
    drag: (x: number, y: number) => void;
    thickness: boolean;
    opacity: number;
    color: string;
}

function drawLine(
    startX: number,
    startY: number,
    thickness: boolean,
    opacity: number,
    color: string,
): Line {
    const points: Array<Point> = [{ x: startX, y: startY }];

    function display() {
        context.globalAlpha = opacity / 100;
        context.strokeStyle = color;
        context.lineWidth = thickness == true ? MARKER_WEIGHT : PENCIL_WEIGHT;
        context.lineCap = "round";

        context.beginPath();
        const { x, y } = points[0];
        context.moveTo(x, y);
        for (const point of points) {
            context.lineTo(point.x, point.y);
        }
        context.stroke();
    }
    function drag(x: number, y: number) {
        points.push({ x, y });
    }

    return { display, drag, thickness, opacity, color };
}

const pastEdits: Array<Edit> = [];
const futureEdits: Array<Edit> = [];

let presentEdit: Edit = drawLine(0, 0, true, rangeValue, colorValue);

// STICKER

const STICKER_SIZE: number = 30;
let stickerMode: boolean = false;
let currentSticker: string | undefined = undefined;

interface Sticker {
    display: () => void;
    drag: (x: number, y: number) => void;
}

function placeSticker(x: number, y: number, emoji: string): Sticker {
    function display() {
        context.globalAlpha = 1;
        context.font = `${STICKER_SIZE}px Inter`;
        context.fillText(
            emoji,
            x - (STICKER_SIZE / 2),
            y + (STICKER_SIZE / 2),
        );
    }
    function drag(finalX: number, finalY: number) {
        x = finalX;
        y = finalY;

        display();
    }

    return { display, drag };
}

// ---------------------------------------------- CANVAS BASE FUNCTIONALITY

const drawingChanged = new CustomEvent("drawing-changed");

canvas.addEventListener("mousedown", (e) => {
    if (stickerMode && currentSticker != undefined) {
        presentEdit = placeSticker(e.offsetX, e.offsetY, currentSticker);
        pastEdits.push(presentEdit);
        futureEdits.splice(0, futureEdits.length);
        cursor.drawing = true;

        canvas.dispatchEvent(drawingChanged);
    } else if (!cursor.drawing) {
        presentEdit = drawLine(
            e.offsetX,
            e.offsetY,
            isThick,
            rangeValue,
            colorValue,
        );
        pastEdits.push(presentEdit);
        futureEdits.splice(0, futureEdits.length);
        cursor.drawing = true;

        canvas.dispatchEvent(drawingChanged);
    }
});

canvas.addEventListener("mousemove", (e) => {
    inputPreview = previewInput(
        e.clientX - canvas.getBoundingClientRect().left,
        e.clientY - canvas.getBoundingClientRect().top,
        isThick,
        colorValue,
        currentSticker,
    );
    canvas.dispatchEvent(drawingChanged);

    if (presentEdit && cursor.drawing) {
        (presentEdit as Line).drag(e.offsetX, e.offsetY);

        canvas.dispatchEvent(drawingChanged);
    }
});

function stopDrawing() {
    if (cursor.drawing) {
        cursor.drawing = false;

        canvas.dispatchEvent(drawingChanged);
    }
}

canvas.addEventListener("mouseleave", stopDrawing);
globalThis.addEventListener("mouseup", stopDrawing);

canvas.addEventListener("drawing-changed", function () {
    context.clearRect(0, 0, canvas.width, canvas.height);
    pastEdits.forEach((line) => {
        line.display();
    });
});

canvas.addEventListener("tool-moved", function () {
    if (!cursor.drawing) {
        inputPreview.draw();
    }
});

// ---------------------------------------------- CANVAS BUTTONS

interface Button {
    // src = https://chat.brace.tools/s/43dd6ec1-7db6-4588-a338-49af88ca2f4c
    text: string;
    action: () => void;
    id: string;
}

const buttons: Array<Button> = [
    { text: "add color", action: makeColorInput, id: "color-Adder" },
    { text: "clear", action: clear, id: "clear" },
    { text: "undo", action: undo, id: "undo" },
    { text: "redo", action: redo, id: "redo" },
    { text: "marker", action: thick, id: "thick" },
    { text: "pencil", action: thin, id: "thin" },
    { text: "export", action: exportImage, id: "export" },
    { text: "custom sticker", action: customSticker, id: "custom" },
];

const stickers = ["🪿", "🦢", "🕊️"];

// instead of doing color or rotation, I did opacity.
// i wanted to do a color input and didn't feel like rotation fit what i wanted to make.
const rangeDiv = document.createElement("div");
const range = document.createElement("input") as HTMLInputElement;
range.type = "range";
range.className = "range";
range.max = "100";
range.min = "1";
range.defaultValue = "100";
app.append(rangeDiv);
rangeDiv.append(range);

range.addEventListener("change", function () {
    rangeValue = Number(range.value);
});

const buttonDiv = document.createElement("div");
app.append(buttonDiv);

const colorsDiv = document.createElement("div");
buttonDiv.append(colorsDiv)

const emojiDiv = document.createElement("div");
app.append(emojiDiv);




function makeColorInput(){
    const colorInput = document.createElement("input") as HTMLInputElement;
    colorInput.type = "color";
    colorInput.id = "color-input";
    colorInput.defaultValue = colorValue;
    colorsDiv.append(colorInput);
    colorInput.addEventListener("change", function () {
        colorValue = colorInput.value;
    });
    colorInput.addEventListener("click", function () {
        colorValue = colorInput.value;
    });
}


function clear() {
    pastEdits.splice(0, pastEdits.length);
    futureEdits.splice(0, futureEdits.length);
    canvas.dispatchEvent(drawingChanged);
}

function undo() {
    if (pastEdits.length > 0) {
        futureEdits.push(pastEdits.pop()!);
        canvas.dispatchEvent(drawingChanged);
    }
}

function redo() {
    if (futureEdits.length > 0) {
        pastEdits.push(futureEdits.pop()!);
        canvas.dispatchEvent(drawingChanged);
    }
}

function thick() {
    stickerMode = false;
    isThick = true;
    (document.getElementById("thick") as HTMLElement).style.outline =
        "4px auto yellowgreen";
    (document.getElementById("thin") as HTMLElement).style.outline = "none";
}

function thin() {
    stickerMode = false;
    isThick = false;
    (document.getElementById("thin") as HTMLElement).style.outline =
        "4px auto yellowgreen";
    (document.getElementById("thick") as HTMLElement).style.outline = "none";
}

function exportImage() {
    const canvasExport = document.createElement("canvas");
    canvasExport.width = canvasExport.height = 1024;

    const contextExport: CanvasRenderingContext2D = canvasExport.getContext(
        "2d",
    )!;
    contextExport.scale(4, 4);

    const originalContext = context;
    const originalCanvas = canvas;

    context = contextExport;
    canvas = canvasExport;

    pastEdits.forEach((element) => {
        element.display();
    });

    context = originalContext;
    canvas = originalCanvas;

    // src = https://gist.github.com/Kaundur/2aca9a9edb003555f44195e826af4084
    const image = canvasExport.toDataURL("image/png");
    const aDownloadLink = document.createElement("a");
    aDownloadLink.download = "canvas_image.png";
    aDownloadLink.href = image;
    aDownloadLink.click();
}

function emoji() {
    stickerMode = true;
    (document.getElementById("thick") as HTMLElement).style.outline = "none";
    (document.getElementById("thin") as HTMLElement).style.outline = "none";
}

function customSticker() {
    emoji();
    const sticker = prompt("Enter emoji:", "bird");
    if (sticker) {
        stickers.pop();
        stickers.push(sticker!);
        const button = document.getElementById("customStickerResult");
        if (button) {
            button.innerHTML = sticker!;
        } else {
            console.error("'customStickerResult' not found.");
        }
        currentSticker = sticker!;
    }
}

stickers.forEach((element) => {
    const button = document.createElement("button");
    button.innerHTML = element;
    button.addEventListener("click", emoji);
    button.addEventListener("click", function () {
        currentSticker = element;
    });
    emojiDiv.append(button);
});

buttons.forEach((element) => {
    const button = document.createElement("button");
    button.id = element.id;
    button.innerHTML = element.text;
    button.addEventListener("click", element.action);
    if (button.id == "custom") {
        emojiDiv.append(button);
        stickers.push("🥚");
        const stickerButton = document.createElement("button");
        stickerButton.id = "customStickerResult";
        stickerButton.innerHTML = stickers[stickers.length - 1];
        stickerButton.addEventListener("click", emoji);
        stickerButton.addEventListener("click", function () {
            currentSticker = stickers[stickers.length - 1];
        });
        emojiDiv.append(stickerButton);
    }else if (button.id == "color-Adder" || button.id == "color-input"){
        colorsDiv.append(button);
        makeColorInput();
    } else {
        buttonDiv.append(button);
    }
});


document.getElementById("thin")?.click()