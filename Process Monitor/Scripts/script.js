const childPositions = {};
const parentDimensions = {};

const relationships = window.relationships;
const relationshipVariables = window.relationshipVariables;
const childNodeData = window.childNodeData;

const arrowElements = new Map();

let zoomLevel = 1;
const minZoom = 0.05;
const maxZoom = 3;
const zoomStep = 0.1;

function assignDepthClasses() {
    function setDepth(node, depth) {
        if (node.classList.contains('parent')) {
            // حذف کلاس‌های depth قبلی برای جلوگیری از تداخل
            for (let i = 0; i <= 6; i++) {
                node.classList.remove(`depth-${i}`);
            }
            // گرفتن مقدار رنگ
            let color = window.depthColors[depth] || "107, 114, 128, 1"; // رنگ پیش‌فرض با شفافیت 1
            // جدا کردن مقادیر RGBA
            const colorValues = color.split(',').map(val => val.trim());
            if (colorValues.length === 4) {
                // اگه RGBA بود، سه مقدار اول RGB و مقدار آخر Alpha هست
                const [r, g, b, a] = colorValues;
                node.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${a})`; // استفاده از شفافیت داخل داده‌ها
            } else if (colorValues.length === 3) {
                // اگه RGB بود، شفافیت پیش‌فرض (مثلاً 0.5) رو اعمال می‌کنیم
                const [r, g, b] = colorValues;
                node.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
            } else {
                // اگه فرمت ناشناخته بود، رنگ پیش‌فرض
                node.style.backgroundColor = `rgba(107, 114, 128, 0.5)`;
            }
            // پردازش نودهای فرزند
            const childParents = Array.from(node.children).filter(child => child.classList.contains('parent'));
            childParents.forEach(child => setDepth(child, depth + 1));
        }
    }

    const allParents = document.querySelectorAll(".parent");
    allParents.forEach(parent => {
        const isRoot = !parent.parentElement.classList.contains('parent');
        setDepth(parent, isRoot ? 0 : parent.parentElement.dataset.depth ? parseInt(parent.parentElement.dataset.depth) + 1 : 1);
        parent.dataset.depth = isRoot ? 0 : parseInt(parent.parentElement.dataset.depth) + 1;
    });
}


function setupDrag(node) {
    let isDragging = false;
    let offsetX = 0, offsetY = 0;

    node.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        isDragging = true;
        const rect = node.getBoundingClientRect();
        offsetX = (e.clientX - rect.left) / zoomLevel;
        offsetY = (e.clientY - rect.top) / zoomLevel;
        node.style.zIndex = "1000";
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const parentNode = node.parentElement.classList.contains("parent") ? node.parentElement : document.querySelector(".canvas");
            const parentRect = parentNode.getBoundingClientRect();
            const nodeRect = node.getBoundingClientRect();

            let newX = (e.clientX - offsetX * zoomLevel - parentRect.left) / zoomLevel;
            let newY = (e.clientY - offsetY * zoomLevel - parentRect.top) / zoomLevel;

            newX = Math.max(0, Math.min(newX, (parentRect.width / zoomLevel) - (nodeRect.width / zoomLevel)));
            newY = Math.max(0, Math.min(newY, (parentRect.height / zoomLevel) - (nodeRect.height / zoomLevel)));

            node.style.left = `${newX}px`;
            node.style.top = `${newY}px`;

            if (node.classList.contains("child")) {
                childPositions[node.id] = { x_coor: Math.round(newX), y_coor: Math.round(newY) };
            } else if (node.classList.contains("parent")) {
                parentDimensions[node.id] = {
                    x_coor: Math.round(newX),
                    y_coor: Math.round(newY),
                    width: node.offsetWidth,
                    height: node.offsetHeight
                };
            }

            updateArrows();
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            updateZIndex(node);
            updateArrows();
        }
    });
}

function setupResize(handle) {
    let isResizing = false;
    let startX, startY, startWidth, startHeight;

    handle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        isResizing = true;
        const parentNode = handle.parentElement;
        const parentRect = parentNode.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        startWidth = parentRect.width / zoomLevel;
        startHeight = parentRect.height / zoomLevel;
        parentNode.style.zIndex = "1000";
    });

    document.addEventListener('mousemove', (e) => {
        if (isResizing) {
            const parentNode = handle.parentElement;
            const parentParentNode = parentNode.parentElement;
            const parentParentRect = parentParentNode.getBoundingClientRect();

            let newWidth = startWidth + (e.clientX - startX) / zoomLevel;
            let newHeight = startHeight + (e.clientY - startY) / zoomLevel;

            const childNodes = Array.from(parentNode.children).filter(child => !child.classList.contains('resize-handle'));
            let minWidth = 200, minHeight = 100;

            childNodes.forEach(child => {
                const childRect = child.getBoundingClientRect();
                const childRight = (childRect.right - parentNode.getBoundingClientRect().left) / zoomLevel;
                const childBottom = (childRect.bottom - parentNode.getBoundingClientRect().top) / zoomLevel;

                if (childRight > minWidth) minWidth = childRight;
                if (childBottom > minHeight) minHeight = childBottom;
            });

            newWidth = Math.max(minWidth, newWidth);
            newHeight = Math.max(minHeight, newHeight);

            if (newWidth > parentParentRect.width / zoomLevel - parseFloat(parentNode.style.left || 0))
                newWidth = parentParentRect.width / zoomLevel - parseFloat(parentNode.style.left || 0);
            if (newHeight > parentParentRect.height / zoomLevel - parseFloat(parentNode.style.top || 0))
                newHeight = parentParentRect.height / zoomLevel - parseFloat(parentNode.style.top || 0);

            parentNode.style.width = `${newWidth}px`;
            parentNode.style.height = `${newHeight}px`;

            parentDimensions[parentNode.id] = {
                x_coor: Math.round(parseFloat(parentNode.style.left || "0")),
                y_coor: Math.round(parseFloat(parentNode.style.top || "0")),
                width: newWidth,
                height: newHeight
            };

            updateArrows();
        }
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            const parentNode = handle.parentElement;
            parentNode.style.zIndex = "";
            updateArrows();
        }
    });
}

function updateZIndex(node) {
    node.style.zIndex = "5";
    const parentNode = node.closest('.parent');
    if (parentNode) {
        parentNode.style.zIndex = "4";
    }
}

function adjustParentSize(parentNode) {
    const childParents = parentNode.querySelectorAll('.parent');
    childParents.forEach(childParent => adjustParentSize(childParent));

    const children = Array.from(parentNode.children).filter(child => child.classList.contains('node'));
    const existingWidth = parseFloat(parentNode.style.width || parentDimensions[parentNode.id] ?.width || "250");
    const existingHeight = parseFloat(parentNode.style.height || parentDimensions[parentNode.id] ?.height || "100");

    if (children.length === 0) {
        parentNode.style.width = `${existingWidth}px`;
        parentNode.style.height = `${existingHeight}px`;
        parentDimensions[parentNode.id] = {
            x_coor: Math.round(parseFloat(parentNode.style.left || "0")),
            y_coor: Math.round(parseFloat(parentNode.style.top || "0")),
            width: existingWidth,
            height: existingHeight
        };
        return;
    }

    let maxRight = 0;
    let maxBottom = 0;
    children.forEach(child => {
        const left = parseFloat(child.style.left || "0");
        const top = parseFloat(child.style.top || "0");
        const right = left + child.offsetWidth;
        const bottom = top + child.offsetHeight;
        if (right > maxRight) maxRight = right;
        if (bottom > maxBottom) maxBottom = bottom;
    });

    const padding = 20;
    const minWidth = Math.max(maxRight + padding, 250);
    const minHeight = Math.max(maxBottom + padding, 100);

    const newWidth = Math.max(existingWidth, minWidth);
    const newHeight = Math.max(existingHeight, minHeight);

    parentNode.style.width = `${newWidth}px`;
    parentNode.style.height = `${newHeight}px`;

    parentDimensions[parentNode.id] = {
        x_coor: Math.round(parseFloat(parentNode.style.left || "0")),
        y_coor: Math.round(parseFloat(parentNode.style.top || "0")),
        width: newWidth,
        height: newHeight
    };
}

function adjustParentPositions(parentNode) {
    const childParents = Array.from(parentNode.children).filter(child => child.classList.contains('parent'));
    if (childParents.length === 0) return;

    const margin = 20;
    const maxHeight = 650;
    let currentTop = 50;
    let currentLeft = 15;
    const columnWidth = 520;

    childParents.forEach(child => {
        let left, top;
        if (child.style.left && child.style.top) {
            left = parseFloat(child.style.left);
            top = parseFloat(child.style.top);
        } else {
            left = currentLeft;
            top = currentTop;

            const nextTop = currentTop + (parseFloat(child.style.height || "100")) + margin;
            if (nextTop > maxHeight) {
                currentLeft += columnWidth;
                currentTop = 10;
            } else {
                currentTop = nextTop;
            }
        }

        child.style.position = 'absolute';
        child.style.left = `${left}px`;
        child.style.top = `${top}px`;
        parentDimensions[child.id] = {
            x_coor: left,
            y_coor: top,
            width: parseFloat(child.style.width || "500"),
            height: parseFloat(child.style.height || "100")
        };

        adjustParentPositions(child);
    });

    adjustParentSize(parentNode);
}

function getNextPosition(parentNode) {
    const children = Array.from(parentNode.children).filter(child => child.classList.contains('child'));
    const gridSize = 180;
    const margin = 10;
    const rowCapacity = Math.floor(parentNode.clientWidth / gridSize) || 1;

    const row = Math.floor(children.length / rowCapacity);
    const col = children.length % rowCapacity;

    return { left: col * gridSize + margin, top: row * (40 + margin) + margin };
}

function drawArrow(fromNode, toNode) {
    const fromRect = fromNode.getBoundingClientRect();
    const toRect = toNode.getBoundingClientRect();
    const canvasRect = document.querySelector(".canvas").getBoundingClientRect();

    const fromPoints = {
        top: { x: (fromRect.left - canvasRect.left + fromRect.width / 2) / zoomLevel, y: (fromRect.top - canvasRect.top) / zoomLevel },
        bottom: { x: (fromRect.left - canvasRect.left + fromRect.width / 2) / zoomLevel, y: (fromRect.bottom - canvasRect.top) / zoomLevel },
        left: { x: (fromRect.left - canvasRect.left) / zoomLevel, y: (fromRect.top - canvasRect.top + fromRect.height / 2) / zoomLevel },
        right: { x: (fromRect.right - canvasRect.left) / zoomLevel, y: (fromRect.top - canvasRect.top + fromRect.height / 2) / zoomLevel }
    };

    const toPoints = {
        top: { x: (toRect.left - canvasRect.left + toRect.width / 2) / zoomLevel, y: (toRect.top - canvasRect.top) / zoomLevel },
        bottom: { x: (toRect.left - canvasRect.left + toRect.width / 2) / zoomLevel, y: (toRect.bottom - canvasRect.top) / zoomLevel },
        left: { x: (toRect.left - canvasRect.left) / zoomLevel, y: (toRect.top - canvasRect.top + toRect.height / 2) / zoomLevel },
        right: { x: (toRect.right - canvasRect.left) / zoomLevel, y: (toRect.top - canvasRect.top + toRect.height / 2) / zoomLevel }
    };

    let minDistance = Infinity;
    let fromSide, toSide;
    for (const fromKey in fromPoints) {
        for (const toKey in toPoints) {
            const dx = fromPoints[fromKey].x - toPoints[toKey].x;
            const dy = fromPoints[fromKey].y - toPoints[toKey].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < minDistance) {
                minDistance = distance;
                fromSide = fromKey;
                toSide = toKey;
            }
        }
    }

    const start = fromPoints[fromSide];
    const end = toPoints[toSide];
    let path = `M ${start.x},${start.y} `;

    if (fromSide === 'right' || fromSide === 'left') {
        const midX = (start.x + end.x) / 2;
        path += `L ${midX},${start.y} L ${midX},${end.y} L ${end.x},${end.y}`;
    } else {
        const midY = (start.y + end.y) / 2;
        path += `L ${start.x},${midY} L ${end.x},${midY} L ${end.x},${end.y}`;
    }

    return { path, fromNode, toNode };
}

function updateArrows() {
    const svg = document.querySelector('.arrows');
    svg.innerHTML = '';

    const childNodesInCanvas = Array.from(document.querySelectorAll(".canvas .child"));
    const arrowData = [];

    childNodesInCanvas.forEach(fromNode => {
        const fromId = fromNode.id;
        if (relationships[fromId]) {
            relationships[fromId].forEach(toId => {
                const toNode = childNodesInCanvas.find(n => n.id === toId);
                if (toNode) {
                    const arrowKey = `${fromId}-${toId}`;
                    let arrow = arrowElements.get(arrowKey);
                    if (!arrow) {
                        arrow = drawArrow(fromNode, toNode);
                        arrow.variables = relationshipVariables[arrowKey] || [];
                        arrowElements.set(arrowKey, arrow);
                    } else {
                        arrow = drawArrow(fromNode, toNode);
                        arrow.variables = relationshipVariables[arrowKey] || [];
                        arrowElements.set(arrowKey, arrow);
                    }
                    arrowData.push(arrow);
                }
            });
        }
    });

    if (!svg.querySelector('defs')) {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const baseMarkerSize = 6;
        const markerSize = baseMarkerSize * zoomLevel;
        defs.innerHTML = `
            <marker id="arrowhead" markerWidth="${markerSize}" markerHeight="${markerSize * 2 / 3}" refX="${markerSize}" refY="${markerSize * 2 / 3 / 2}" orient="auto">
                <polygon points="0 0, ${markerSize} ${markerSize * 2 / 3 / 2}, 0 ${markerSize * 2 / 3}" fill="black" />
            </marker>
        `;
        svg.appendChild(defs);
    }

    const tooltip = document.getElementById("tooltip");
    arrowData.forEach(arrow => {
        const arrowKey = `${arrow.fromNode.id}-${arrow.toNode.id}`;
        let pathElement = arrowElements.get(arrowKey) ?.pathElement;
        if (!pathElement) {
            pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
            pathElement.setAttribute("stroke", "black");
            pathElement.setAttribute("stroke-width", `${2 * zoomLevel}`);
            pathElement.setAttribute("fill", "none");
            pathElement.setAttribute("marker-end", "url(#arrowhead)");
            arrow.pathElement = pathElement;
            arrowElements.set(arrowKey, arrow);
        }
        pathElement.setAttribute("d", arrow.path);
        svg.appendChild(pathElement);

        pathElement.addEventListener('mouseover', () => {
            const variables = arrow.variables || [];
            if (variables.length > 0) {
                const tooltipText = variables.map(v => {
                    const key = Object.keys(v)[0];
                    return `${key}: ${v[key]}`;
                }).join('<br>');
                tooltip.innerHTML = tooltipText;
                tooltip.style.display = 'block';
            }
        });

        pathElement.addEventListener('mousemove', (e) => {
            const canvasContainer = document.querySelector(".canvas-container");
            const canvas = document.querySelector(".canvas");
            const canvasRect = canvas.getBoundingClientRect();
            const containerRect = canvasContainer.getBoundingClientRect();

            const x = (e.clientX - containerRect.left + canvasContainer.scrollLeft) / zoomLevel + 10;
            const y = (e.clientY - containerRect.top + canvasContainer.scrollTop) / zoomLevel + 10;

            tooltip.style.left = `${x}px`;
            tooltip.style.top = `${y}px`;
        });

        pathElement.addEventListener('mouseout', () => {
            tooltip.style.display = 'none';
        });
    });
}

function zoomCanvas(delta, mouseX, mouseY) {
    const canvasContainer = document.querySelector('.canvas-container');
    const rect = canvasContainer.getBoundingClientRect();
    const offsetX = mouseX - rect.left;
    const offsetY = mouseY - rect.top;

    const worldX = (offsetX + canvasContainer.scrollLeft) / zoomLevel;
    const worldY = (offsetY + canvasContainer.scrollTop) / zoomLevel;

    const newZoomLevel = Math.max(minZoom, Math.min(maxZoom, zoomLevel + delta));
    if (newZoomLevel === zoomLevel) return;

    zoomLevel = newZoomLevel;

    const canvas = document.querySelector('.canvas');
    canvas.style.transform = `scale(${zoomLevel})`;
    updateArrows();

    canvasContainer.scrollLeft = worldX * zoomLevel - offsetX;
    canvasContainer.scrollTop = worldY * zoomLevel - offsetY;
}

const nodes = document.querySelectorAll(".node");
nodes.forEach(node => setupDrag(node));

const resizeHandles = document.querySelectorAll(".resize-handle");
resizeHandles.forEach(handle => setupResize(handle));

function moveChildToParent(childNode, parentNode) {
    parentNode.appendChild(childNode);
    childNode.style.position = "absolute";
    let left, top;
    if (childNode.style.left && childNode.style.top) {
        left = parseFloat(childNode.style.left);
        top = parseFloat(childNode.style.top);
    } else {
        const pos = getNextPosition(parentNode);
        left = pos.left;
        top = pos.top;
    }
    childNode.style.left = `${left}px`;
    childNode.style.top = `${top}px`;
    childPositions[childNode.id] = { x_coor: left, y_coor: top };
    adjustParentSize(parentNode);
    updateZIndex(childNode);
    updateArrows();
}

function moveChildToArea(childNode) {
    const childList = document.querySelector(".child-list");
    childList.appendChild(childNode);
    childNode.style.position = "static";
    childPositions[childNode.id] = { x_coor: -1, y_coor: -1 };
    childNode.style.zIndex = "5";
    updateArrows();
}

function isCorrectParent(childNode, parentNode) {
    return childNode.getAttribute("data-parent-id") === parentNode.id;
}

const childNodes = document.querySelectorAll(".child");
childNodes.forEach(childNode => {
    let clickTimeout = null;

    childNode.addEventListener('mouseover', (e) => {
        const nodeId = childNode.id;
        const data = window.childNodeData[nodeId];
        if (data) {
            const tooltipText = `تعداد دفعات تکرار: ${data.repeatCount}<br>متوسط زمان‌بری: ${data.avgTime}`;
            const tooltip = document.getElementById("tooltip");
            tooltip.innerHTML = tooltipText;
            tooltip.style.display = 'block';
        }
    });

    childNode.addEventListener('mousemove', (e) => {
        const canvasContainer = document.querySelector(".canvas-container");
        const canvas = document.querySelector(".canvas");
        const canvasRect = canvas.getBoundingClientRect();
        const containerRect = canvasContainer.getBoundingClientRect();

        const x = (e.clientX - containerRect.left + canvasContainer.scrollLeft) / zoomLevel + 10;
        const y = (e.clientY - containerRect.top + canvasContainer.scrollTop) / zoomLevel + 10;

        const tooltip = document.getElementById("tooltip");
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
    });

    childNode.addEventListener('mouseout', () => {
        const tooltip = document.getElementById("tooltip");
        tooltip.style.display = 'none';
    });

    childNode.addEventListener('click', (e) => {
        e.preventDefault();
        clearTimeout(clickTimeout);
        clickTimeout = setTimeout(() => {
            const parentNode = childNode.closest('.parent');
            if (parentNode && isCorrectParent(childNode, parentNode)) {
                const data = childNodeData[childNode.id];
                if (data) showModal(data.type1);
            }
        }, 200);
    });

    childNode.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const parentNode = childNode.closest('.parent');
        if (parentNode && isCorrectParent(childNode, parentNode)) {
            const data = childNodeData[childNode.id];
            if (data) showModal(data.type2);
        }
    });

    childNode.addEventListener('dblclick', (e) => {
        e.preventDefault();
        clearTimeout(clickTimeout);
        const parentNode = childNode.parentElement.classList.contains("parent") ? childNode.parentElement : null;
        if (parentNode) {
            moveChildToArea(childNode);
        } else {
            const parentId = childNode.getAttribute("data-parent-id");
            const targetParent = document.getElementById(parentId);
            if (targetParent) moveChildToParent(childNode, targetParent);
        }
    });

    childNode.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const parentNode = e.target.closest('.parent');
        if (parentNode && !isCorrectParent(childNode, parentNode)) {
            childNode.style.zIndex = '-1';
        } else {
            childNode.style.zIndex = '5';
        }
    });

    childNode.addEventListener('mouseup', () => {
        updateZIndex(childNode);
        updateArrows();
    });
});

function showModal(content) {
    const modal = document.getElementById("modal");
    const modalBody = document.getElementById("modal-body");
    modalBody.textContent = content;
    modal.style.display = "block";
}

document.querySelector(".modal-close").onclick = function () {
    document.getElementById("modal").style.display = "none";
};

document.getElementById("modal").onclick = function (e) {
    if (e.target === document.getElementById("modal")) {
        document.getElementById("modal").style.display = "none";
    }
};

const canvasContainer = document.querySelector('.canvas-container');

document.getElementById('zoom-in').addEventListener('click', () => {
    const rect = canvasContainer.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    zoomCanvas(zoomStep, centerX, centerY);
});

document.getElementById('zoom-out').addEventListener('click', () => {
    const rect = canvasContainer.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    zoomCanvas(-zoomStep, centerX, centerY);
});

function initializePositionsAndDimensions() {
    const childNodes = document.querySelectorAll(".child");
    childNodes.forEach(child => {
        const left = parseFloat(child.style.left || "-1");
        const top = parseFloat(child.style.top || "-1");
        childPositions[child.id] = { x_coor: left, y_coor: top };
    });

    const parentNodes = document.querySelectorAll(".parent");
    parentNodes.forEach(parent => {
        const left = parseFloat(parent.style.left || "0");
        const top = parseFloat(parent.style.top || "0");
        const width = parseFloat(parent.style.width || "500");
        const height = parseFloat(parent.style.height || "100");
        parentDimensions[parent.id] = { x_coor: left, y_coor: top, width: width, height: height };
        parent.style.position = "absolute";
    });
}

function layoutRootParents() {
    const rootParents = document.querySelectorAll(".canvas > .parent");
    let startX = 50;
    let startY = 50;
    const marginX = 50;
    const marginY = 50;
    let maxHeight = 0;
    let currentX = startX;
    let currentY = startY;
    const canvas = document.querySelector(".canvas");

    rootParents.forEach(parent => {
        let left, top;
        if (parent.style.left && parent.style.top) {
            left = parseFloat(parent.style.left);
            top = parseFloat(parent.style.top);
        } else {
            const width = parseFloat(parent.style.width || "500");
            const height = parseFloat(parent.style.height || "100");

            if (currentX + width + marginX > canvas.clientWidth) {
                currentX = startX;
                currentY += maxHeight + marginY;
                maxHeight = 0;
            }

            left = currentX;
            top = currentY;

            currentX += width + marginX;
            if (height > maxHeight) maxHeight = height;
        }

        parent.style.left = `${left}px`;
        parent.style.top = `${top}px`;
        parentDimensions[parent.id] = {
            x_coor: left,
            y_coor: top,
            width: parseFloat(parent.style.width || "500"),
            height: parseFloat(parent.style.height || "100")
        };

        adjustParentPositions(parent);
    });

    const lastParent = rootParents[rootParents.length - 1];
    if (lastParent) {
        const lastBottom = parseFloat(lastParent.style.top) + parseFloat(lastParent.style.height);
        canvas.style.minHeight = `${lastBottom + marginY}px`;
    }
}

function saveNodePositions() {
    const processUpdates = [];
    for (const id in childPositions) {
        const childNode = document.getElementById(id);
        const parentId = childNode.getAttribute("data-parent-id");
        const processGroup = parentId ? parseInt(parentId.replace("parent-", "")) : null;
        processUpdates.push({
            process_id: parseInt(id.replace("child-", "")),
            process_group: processGroup,
            x: childPositions[id].x_coor,
            y: childPositions[id].y_coor
        });
    }
    const groupUpdates = [];
    for (const id in parentDimensions) {
        groupUpdates.push({
            group_id: parseInt(id.replace("parent-", "")),
            x: parentDimensions[id].x_coor,
            y: parentDimensions[id].y_coor,
            width: parentDimensions[id].width,
            height: parentDimensions[id].height
        });
    }

    $.ajax({
        url: "/Process/UpdateCoordinates",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({ processData: processUpdates, groupData: groupUpdates }),
        success: function (response) {
            alert(response.success ? "ذخیره شد!" : "خطا در ذخیره.");
        },
        error: function () {
            alert("خطا در ارتباط با سرور.");
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initializePositionsAndDimensions();
    assignDepthClasses();
    layoutRootParents();

    const childNodesInCanvas = document.querySelectorAll(".child.in-canvas");
    childNodesInCanvas.forEach(childNode => {
        const parentId = childNode.getAttribute("data-parent-id");
        const targetParent = document.getElementById(parentId);
        if (targetParent) {
            moveChildToParent(childNode, targetParent);
            childNode.classList.remove("in-canvas");
        }
    });

    const rootParents = document.querySelectorAll(".canvas > .parent");
    rootParents.forEach(rootParent => adjustParentSize(rootParent));

    setTimeout(updateArrows, 300);
});

window.onload = function () {
    const canvasContainer = document.querySelector('.canvas-container');
    canvasContainer.scrollLeft = 0;
};