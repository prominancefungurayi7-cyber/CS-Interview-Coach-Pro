// Curated visual references are downloaded in assets/visuals with attribution in
// manifest.json. Code-drawn diagrams and the sketch pad work without network access.
const commons = (file, title, name, license, author = "Wikimedia Commons contributor") => ({
    src: `/assets/visuals/${file}`, title,
    source: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(name)}`,
    license, author
});

function diagram(title, labels) {
    const rects = labels.map((label, i) => {
        const x = 32 + i * (576 / labels.length);
        const width = 540 / labels.length;
        return `<rect x="${x}" y="133" width="${width}" height="92" rx="14" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
            <text x="${x + width / 2}" y="183" text-anchor="middle" font-size="${labels.length > 4 ? 14 : 18}" fill="#0f172a">${label}</text>`;
    }).join("");
    const arrows = labels.slice(1).map((_, i) => {
        const x = 32 + (i + 1) * (576 / labels.length) - 20;
        return `<path d="M ${x} 179 h 18 m -6 -6 l 6 6 -6 6" stroke="#0f766e" stroke-width="3" fill="none"/>`;
    }).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
        <rect width="640" height="360" fill="#fff"/><text x="320" y="60" text-anchor="middle" font-size="24" font-family="Arial" font-weight="bold" fill="#0f172a">${title}</text>
        ${rects}${arrows}<text x="320" y="294" text-anchor="middle" font-size="15" font-family="Arial" fill="#475569">Annotate the steps and explain each transition.</text></svg>`;
    return { src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, title, author: "CS Interview Coach Pro", license: "App-authored diagram" };
}

function pixelGrid() {
    const cells = [];
    for (let y = 0; y < 5; y++) for (let x = 0; x < 8; x++) {
        const value = Math.round(30 + x * 24 + y * 8);
        cells.push(`<rect x="${72 + x * 62}" y="${72 + y * 48}" width="58" height="44" fill="rgb(${value},${value},${value})" stroke="#94a3b8"/><text x="${101 + x * 62}" y="${100 + y * 48}" text-anchor="middle" font-size="11" fill="${value < 130 ? "white" : "black"}">${value}</text>`);
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="white"/><text x="320" y="39" text-anchor="middle" font-family="Arial" font-size="22">Pixels and grayscale values</text>${cells.join("")}</svg>`;
    return { src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, title: "Pixels and intensity values", author: "CS Interview Coach Pro", license: "App-authored diagram" };
}

function sobelGrid() {
    const input = [[10,15,11,12],[12,0,14,13],[8,12,98,0],[10,9,11,10]];
    const kernel = [[-1,0,1],[-2,0,2],[-1,0,1]];
    const cells = (grid, x0, y0, size, highlight) => grid.flatMap((row, y) => row.map((value, x) =>
        `<rect x="${x0+x*size}" y="${y0+y*size}" width="${size}" height="${size}" fill="${highlight?.(x,y) ? "#dbeafe" : "#fff"}" stroke="#64748b"/>` +
        `<text x="${x0+x*size+size/2}" y="${y0+y*size+size/2+6}" text-anchor="middle" font-size="18" font-family="Arial" fill="#0f172a">${value}</text>`)).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="white"/>
        <text x="320" y="38" text-anchor="middle" font-size="22" font-family="Arial">Horizontal Sobel: multiply then sum</text>
        <text x="135" y="78" text-anchor="middle" font-size="17" font-family="Arial">4 × 4 image patch</text>
        <text x="465" y="78" text-anchor="middle" font-size="17" font-family="Arial">Gx kernel</text>
        ${cells(input,40,95,48,(x,y)=>x>=1&&x<=2&&y>=1&&y<=2)}${cells(kernel,384,106,54)}
        <text x="320" y="326" text-anchor="middle" font-size="15" font-family="Arial">Central signed responses: 95, 11, 183, −10</text></svg>`;
    return { src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, title: "Worked Sobel kernel", author: "CS Interview Coach Pro", license: "App-authored diagram" };
}

function confusionGrid() {
    const labels = [["TP", "FP"],["FN", "TN"]];
    const squares = labels.flatMap((row,y)=>row.map((value,x)=>`<rect x="${196+x*124}" y="${118+y*86}" width="124" height="86" fill="${x===y ? "#dcfce7" : "#fee2e2"}" stroke="#475569"/><text x="${258+x*124}" y="${169+y*86}" text-anchor="middle" font-size="24" font-family="Arial">${value}</text>`)).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="white"/><text x="320" y="44" text-anchor="middle" font-size="22" font-family="Arial">Binary confusion matrix</text><text x="320" y="90" text-anchor="middle" font-size="16" font-family="Arial">Columns: actual positive → negative</text><text x="88" y="160" font-size="14" font-family="Arial">Predicted +</text><text x="88" y="246" font-size="14" font-family="Arial">Predicted −</text>${squares}<text x="320" y="324" text-anchor="middle" font-size="15" font-family="Arial">Accuracy = (TP + TN) / total</text></svg>`;
    return { src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, title: "Confusion matrix", author: "CS Interview Coach Pro", license: "App-authored diagram" };
}

export function visualForQuestion(question) {
    const text = `${question.question} ${question.topic || ""}`.toLowerCase();
    if (question.category === "dip") {
        if (/sobel calculation|horizontal sobel kernel|exam matrix/.test(text)) return sobelGrid();
        if (/confusion matrix|producer's accuracy|user's accuracy/.test(text)) return confusionGrid();
        if (/near-infrared|vegetation index/.test(text)) return diagram("Vegetation reflectance", ["Red band", "NIR band", "NIR ÷ Red", "Interpret"]);
        if (/opening|closing|hole/.test(text)) return [commons("dilationerosion.png", "Dilation and erosion", "DilationErosion.png", "Public domain", "Renato Keshet"),
            commons("binary-image-with-holes.png", "Binary image with holes", "Binary_image_with_holes.png", "CC BY-SA 3.0", "Highlandsgaucho")];
        if (/erosion/.test(text)) return [commons("dilationerosion.png", "Dilation and erosion", "DilationErosion.png", "Public domain", "Renato Keshet"),
            commons("binary-image-erosion.png", "Binary erosion", "Binary_image_erosion.png", "CC BY-SA 3.0", "Highlandsgaucho")];
        if (/dilat|structuring|morpholog/.test(text)) return [commons("morphologicaldilation.png", "Morphological dilation", "MorphologicalDilation.png", "Public domain", "MartinPfeiffer"),
            commons("binary-image-dilation.png", "Binary dilation", "Binary_image_dilation.png", "CC BY-SA 3.0", "Highlandsgaucho")];
        if (/histogram|contrast/.test(text)) return commons("histogram-equalization.png", "Histogram equalization", "Histogram_equalization.png", "CC0");
        if (/pixel|sampling|quantiz|resolution|bit depth/.test(text)) return pixelGrid();
        if (/convolution|kernel|gaussian|median|edge|sobel|prewitt|canny/.test(text)) return diagram("Image filtering", ["Image", "Kernel", "Filtered image"]);
        if (/jpeg|compress|run-length|huffman/.test(text)) return diagram("Compression", ["Pixels", "Transform", "Encode", "File"]);
        if (/cnn|classification/.test(text)) return diagram("Classification workflow", ["Image", "Features", "Classifier", "Label"]);
        if (/segmen|threshold|cluster|watershed/.test(text)) return diagram("Segmentation", ["Image", "Features", "Mask", "Regions"]);
        if (/restor|blur|noise|wiener|deconvolution/.test(text)) return diagram("Image restoration", ["Original", "Blur + noise", "Observed", "Estimate"]);
        return diagram("Image processing", ["Acquire", "Process", "Analyze", "Check"]);
    }
    if (question.category === "dsa" && /binary search tree/.test(text)) return [commons("binary-search-tree.svg", "Binary search tree", "Binary_search_tree.svg", "Public domain"),
        commons("binary-tree-structure.svg", "Binary tree structure", "Binary_tree_structure.svg", "Public domain", "Cbuckley")];
    if (question.category === "dsa" && /tree|binary|heap/.test(text)) return commons("binary-tree.svg", "Binary tree", "Binary_tree.svg", "Public domain", "Derrick Coetzee");
    if (question.category === "dsa" && /quick.?sort/.test(text)) return commons("quicksort-example.gif", "Quicksort example", "Quicksort-example.gif", "CC BY-SA 3.0", "Matt Chan");
    if (question.category === "dsa" && /merge.?sort/.test(text)) return commons("merge-sort-example-300px.gif", "Merge sort example", "Merge-sort-example-300px.gif", "CC BY-SA 3.0", "Swfung8");
    if (question.category === "dsa" && /sort|search/.test(text)) return diagram("Algorithm trace", ["Input", "Compare", "Update", "Output"]);
    if (question.category === "dsa" && /array|list|stack|queue/.test(text)) return diagram("Indexed collection", ["0: A", "1: B", "2: C", "3: D"]);
    if (question.category === "oop" && /inherit|polymorph|class|interface/.test(text)) return [commons("generalization-uml-class-diagram.svg", "UML generalization", "Generalization_(UML_class_diagram).svg", "Public domain", "Mischa004"),
        commons("adapter-using-inheritance-uml-class-diagram.svg", "Inheritance in an Adapter design", "Adapter_using_inheritance_UML_class_diagram.svg", "Public domain", "Trashtoy")];
    if (question.category === "oop" && /exception|try|catch/.test(text)) return diagram("Exception flow", ["Try", "Throw", "Catch", "Finally"]);
    if (question.category === "oop") return diagram("Java program flow", ["Source", "javac", "Bytecode", "JVM"]);
    if (question.category === "networking" && /osi|layer|protocol/.test(text)) return commons("osi-model-v1.svg", "OSI networking layers", "OSI_Model_v1.svg", "Public domain", "Offnfopt");
    if (question.category === "networking") return diagram("Network request", ["Client", "Network", "Server", "Reply"]);
    if (question.category === "dbms") return diagram("Relational data", ["Table", "Key", "Join", "Result"]);
    if (question.category === "os") return diagram("Process scheduling", ["Ready", "Running", "Waiting", "Ready"]);
    if (question.category === "web") return diagram("Web request", ["Browser", "HTTP", "Server", "HTML"]);
    if (question.category === "cloud" || question.category === "systemDesign") return diagram("Service architecture", ["Client", "API", "Service", "Storage"]);
    if (question.category === "cybersecurity") return diagram("Security layers", ["Identity", "Access", "Encryption", "Audit"]);
    if (question.category === "coding" || question.category === "softwareEngineering") return diagram("Build and test", ["Design", "Code", "Test", "Review"]);
    return { title: "Draw your own explanation", author: "Your sketch", license: "Created by you" };
}

export function mountVisual(panel, visual) {
    if (!visual) return;
    if (Array.isArray(visual)) { visual.forEach(item => mountVisual(panel, item)); return; }
    const section = document.createElement("section");
    section.className = "visual-workspace";
    const heading = document.createElement("h5");
    heading.textContent = visual.title;
    const guidance = document.createElement("p");
    guidance.textContent = "Draw on this visual to explain the idea. Use Clear to try again, or Download sketch to save your work.";
    const canvas = document.createElement("canvas");
    canvas.width = 640; canvas.height = 360;
    canvas.setAttribute("aria-label", `Drawing surface for ${visual.title}`);
    const ctx = canvas.getContext("2d");
    const image = new Image();
    const drawBase = () => {
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (visual.src && image.complete && image.naturalWidth) {
            const scale = Math.min(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
            const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
            ctx.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
        }
    };
    drawBase();
    if (visual.src) { image.onload = drawBase; image.src = visual.src; }
    let drawing = false;
    const point = event => {
        const box = canvas.getBoundingClientRect();
        return { x: (event.clientX - box.left) * canvas.width / box.width,
            y: (event.clientY - box.top) * canvas.height / box.height };
    };
    canvas.addEventListener("pointerdown", event => {
        drawing = true; canvas.setPointerCapture(event.pointerId);
        const { x, y } = point(event);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.strokeStyle = "#dc2626";
    });
    canvas.addEventListener("pointermove", event => {
        if (!drawing) return;
        const { x, y } = point(event); ctx.lineTo(x, y); ctx.stroke();
    });
    canvas.addEventListener("pointerup", () => { drawing = false; });
    canvas.addEventListener("pointercancel", () => { drawing = false; });
    const controls = document.createElement("div"); controls.className = "visual-controls";
    const clear = document.createElement("button"); clear.type = "button"; clear.className = "outline-btn"; clear.textContent = "Clear drawing"; clear.addEventListener("click", drawBase);
    const save = document.createElement("button"); save.type = "button"; save.className = "outline-btn"; save.textContent = "Download sketch";
    save.addEventListener("click", () => {
        const output = document.createElement("canvas"); output.width = 640; output.height = 390;
        const out = output.getContext("2d"); out.fillStyle = "#fff"; out.fillRect(0, 0, 640, 390); out.drawImage(canvas, 0, 0);
        out.fillStyle = "#334155"; out.font = "12px Arial";
        out.fillText(`${visual.author} · ${visual.license}`.slice(0, 95), 12, 378);
        const link = document.createElement("a"); link.href = output.toDataURL("image/png");
        link.download = "interview-coach-sketch.png"; link.click();
    });
    controls.append(clear, save);
    const credit = document.createElement("p"); credit.className = "visual-credit";
    credit.textContent = `${visual.author} · ${visual.license}`;
    if (visual.source) { const source = document.createElement("a"); source.href = visual.source; source.target = "_blank"; source.rel = "noopener noreferrer"; source.textContent = "Source and license"; credit.append(" · ", source); }
    section.append(heading, guidance, canvas, controls, credit);
    panel.appendChild(section);
}
