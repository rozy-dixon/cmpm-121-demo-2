import "./style.css";

const APP_NAME = "Computer Think Pt2";
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
    emoji: string | undefined,
): Preview {
    function draw() {
        context.clearRect(0, 0, canvas.width, canvas.height);

        pastEdits.forEach((line) => {
            line.display();
        });

        if (stickerMode && emoji != undefined) {
            context.globalAlpha = 0.25;
            context.font = `${stickerSize}px Inter`;
            context.fillText(
                emoji,
                x - (stickerSize / 2),
                y + (stickerSize / 2),
            );
        } else {
            context.beginPath();
            context.arc(x, y, 15, 0, Math.PI * 2);
            context.lineWidth = thickness == true ? markerWeight : pencilWeight;
            context.globalAlpha = 0.25;
            context.stroke();
            context.closePath();
        }
    }

    return { draw };
}

let inputPreview: Preview;

// LINE

interface Edit {
    display: () => void;
    drag: (x: number, y: number) => void;
}

interface Point {
    x: number;
    y: number;
}

let isThick: boolean = false;
const markerWeight = 10;
const pencilWeight = 2;

// src = https://chat.brace.tools/s/d667c7d4-4bcc-45a0-9ba2-9fab4366a24f
interface Line {
    display: () => void;
    drag: (x: number, y: number) => void;
    thickness: boolean;
}

function drawLine(startX: number, startY: number, thickness: boolean): Line {
    const points: Array<Point> = [{ x: startX, y: startY }];

    function display() {
        context.globalAlpha = 1;
        context.lineWidth = thickness == true ? markerWeight : pencilWeight;
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

    return { display, drag, thickness };
}

const pastEdits: Array<Edit> = [];
const futureEdits: Array<Edit> = [];

let presentEdit: Edit = drawLine(0, 0, true);

// STICKER

const stickerSize: number = 20;
let stickerMode: boolean = false;
let currentSticker: string | undefined = undefined;

interface Sticker {
    display: () => void;
    drag: (x: number, y: number) => void;
}

function placeSticker(x: number, y: number, emoji: string): Sticker {
    function display() {
        context.globalAlpha = 1;
        context.font = `${stickerSize}px Inter`;
        context.fillText(
            emoji,
            x - (stickerSize / 2),
            y + (stickerSize / 2),
        );
    }
    function drag(finalX: number, finalY: number) {
        x = finalX;
        y = finalY;

        display();
    }

    return { display, drag };
}

// ---------------------------------------------- DISPLAY

const header = document.createElement("h1");
header.innerHTML = APP_NAME;
app.append(header);

const canvas = document.createElement("canvas");
canvas.width = canvas.height = 256;
app.append(canvas);

const context: CanvasRenderingContext2D = canvas.getContext("2d")!;

// ---------------------------------------------- CANVAS BASE FUNCTIONALITY

canvas.addEventListener("mousedown", (e) => {
    if (stickerMode && currentSticker != undefined) {
        presentEdit = placeSticker(e.offsetX, e.offsetY, currentSticker);
        pastEdits.push(presentEdit);
        futureEdits.splice(0, futureEdits.length);
        cursor.drawing = true;

        canvas.dispatchEvent(new CustomEvent("drawing-changed"));
    } else if (!cursor.drawing) {
        presentEdit = drawLine(e.offsetX, e.offsetY, isThick);
        pastEdits.push(presentEdit);
        futureEdits.splice(0, futureEdits.length);
        cursor.drawing = true;

        canvas.dispatchEvent(new CustomEvent("drawing-changed"));
    }
});

canvas.addEventListener("mousemove", (e) => {
    inputPreview = previewInput(
        e.clientX - canvas.getBoundingClientRect().left,
        e.clientY - canvas.getBoundingClientRect().top,
        isThick,
        currentSticker,
    );
    canvas.dispatchEvent(new CustomEvent("tool-moved"));

    if (presentEdit && cursor.drawing) {
        (presentEdit as Line).drag(e.offsetX, e.offsetY);

        canvas.dispatchEvent(new CustomEvent("drawing-changed"));
    }
});

function stopDrawing() {
    if (cursor.drawing) {
        cursor.drawing = false;

        canvas.dispatchEvent(new CustomEvent("drawing-changed"));
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
    { text: "clear", action: clear, id: "clear" },
    { text: "undo", action: undo, id: "undo" },
    { text: "redo", action: redo, id: "redo" },
    { text: "marker", action: thick, id: "thick" },
    { text: "pencil", action: thin, id: "thin" },
    { text: "🪿", action: emoji, id: "emoji" },
    { text: "🦢", action: emoji, id: "emoji" },
    { text: "🕊️", action: emoji, id: "emoji" },
];

const buttonDiv = document.createElement("div");
app.append(buttonDiv);

const emojiDiv = document.createElement("div");
app.append(emojiDiv);

function clear() {
    pastEdits.splice(0, pastEdits.length);
    canvas.dispatchEvent(new CustomEvent("drawing-changed"));
}

function undo() {
    if (pastEdits.length > 0) {
        futureEdits.push(pastEdits.pop()!);
        canvas.dispatchEvent(new CustomEvent("drawing-changed"));
    }
}

function redo() {
    if (futureEdits.length > 0) {
        pastEdits.push(futureEdits.pop()!);
        canvas.dispatchEvent(new CustomEvent("drawing-changed"));
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

function emoji() {
    stickerMode = true;
    (document.getElementById("thick") as HTMLElement).style.outline = "none";
    (document.getElementById("thin") as HTMLElement).style.outline = "none";
}

buttons.forEach((element) => {
    const button = document.createElement("button");
    if (element.id == "emoji") {
        button.innerHTML = element.text;
        button.addEventListener("click", element.action);
        button.addEventListener("click", function () {
            currentSticker = element.text;
        });
        emojiDiv.append(button);
    } else {
        button.id = element.id;
        button.innerHTML = element.text;
        button.addEventListener("click", element.action);
        buttonDiv.append(button);
    }
});
