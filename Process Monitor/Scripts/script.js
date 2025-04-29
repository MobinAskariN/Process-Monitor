// متغیرها برای ذخیره موقعیت‌ها و اندازه‌ها
const childPositions = {};
const parentDimensions = {};

// تعریف ارتباطات بین child-nodeها
const relationships = window.relationships;

// تعریف متغیرهای پیش‌فرض برای هر ارتباط
const relationshipVariables = window.relationshipVariables;

// تعریف اطلاعات پیش‌فرض برای child-nodeها
const childNodeData = window.childNodeData;

// ذخیره خطوط برای دسترسی مستقیم
const arrowElements = new Map();

// تابع برای جابجایی گره‌ها
function setupDrag(node) {
    let isDragging = false;
    let offsetX = 0, offsetY = 0;

    node.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        isDragging = true;
        const rect = node.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        node.style.zIndex = "1000";
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const parentNode = node.parentElement.classList.contains("parent") ? node.parentElement : document.querySelector(".canvas");
            const parentRect = parentNode.getBoundingClientRect();
            const nodeRect = node.getBoundingClientRect();

            let newX = e.clientX - offsetX - parentRect.left;
            let newY = e.clientY - offsetY - parentRect.top;

            newX = Math.max(0, Math.min(newX, parentRect.width - nodeRect.width));
            newY = Math.max(0, Math.min(newY, parentRect.height - nodeRect.height));

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

// تابع برای تغییر اندازه گره‌ها
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
        startWidth = parentRect.width;
        startHeight = parentRect.height;
        parentNode.style.zIndex = "1000";
    });

    document.addEventListener('mousemove', (e) => {
        if (isResizing) {
            const parentNode = handle.parentElement;
            const parentParentNode = parentNode.parentElement;
            const parentParentRect = parentParentNode.getBoundingClientRect();

            let newWidth = startWidth + (e.clientX - startX);
            let newHeight = startHeight + (e.clientY - startY);

            const childNodes = Array.from(parentNode.children).filter(child => !child.classList.contains('resize-handle'));
            let minWidth = 200, minHeight = 100;

            childNodes.forEach(child => {
                const childRect = child.getBoundingClientRect();
                const childRight = childRect.right - parentNode.getBoundingClientRect().left;
                const childBottom = childRect.bottom - parentNode.getBoundingClientRect().top;

                if (childRight > minWidth) minWidth = childRight;
                if (childBottom > minHeight) minHeight = childBottom;
            });

            newWidth = Math.max(minWidth, newWidth);
            newHeight = Math.max(minHeight, newHeight);

            if (newWidth > parentParentRect.width - parseFloat(parentNode.style.left || 0))
                newWidth = parentParentRect.width - parseFloat(parentNode.style.left || 0);
            if (newHeight > parentParentRect.height - parseFloat(parentNode.style.top || 0))
                newHeight = parentParentRect.height - parseFloat(parentNode.style.top || 0);

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

// تابع برای مدیریت z-index
function updateZIndex(node) {
    // فقط مطمئن می‌شیم که گره‌ها روی همدیگه درست رندر بشن
    node.style.zIndex = "5"; // همه گره‌ها روی لایه 5
    const parentNode = node.closest('.parent');
    if (parentNode) {
        parentNode.style.zIndex = "4"; // والد یه لایه پایین‌تر
    }
}

// تابع برای تنظیم سایز parent-node بر اساس محتوای داخلش
function adjustParentSize(parentNode) {
    // ابتدا گره‌های والد فرزند رو تنظیم کن
    const childParents = parentNode.querySelectorAll('.parent');
    childParents.forEach(childParent => adjustParentSize(childParent));

    // حالا تمام گره‌های فرزند (child و parent) رو بررسی کن
    const children = Array.from(parentNode.children).filter(child => child.classList.contains('node'));
    if (children.length === 0) {
        // اگر هیچ فرزندی نداشت، اندازه پیش‌فرض
        parentNode.style.width = "250px";
        parentNode.style.height = "100px";
        parentDimensions[parentNode.id] = {
            x_coor: Math.round(parseFloat(parentNode.style.left || "0")),
            y_coor: Math.round(parseFloat(parentNode.style.top || "0")),
            width: 250,
            height: 100
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
    const newWidth = Math.max(maxRight + padding, 250); // حداقل عرض 250
    const newHeight = Math.max(maxBottom + padding, 100); // حداقل ارتفاع 100

    parentNode.style.width = `${newWidth}px`;
    parentNode.style.height = `${newHeight}px`;

    parentDimensions[parentNode.id] = {
        x_coor: Math.round(parseFloat(parentNode.style.left || "0")),
        y_coor: Math.round(parseFloat(parentNode.style.top || "0")),
        width: newWidth,
        height: newHeight
    };
}

// تابع برای تنظیم موقعیت parent-nodeهای فرزند به صورت شبکه‌ای
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
            // استفاده از مختصات ذخیره‌شده
            left = parseFloat(child.style.left);
            top = parseFloat(child.style.top);
        } else {
            // محاسبه موقعیت جدید
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

// تابع برای محاسبه موقعیت بعدی child-node در parent-node
function getNextPosition(parentNode) {
    const children = Array.from(parentNode.children).filter(child => child.classList.contains('child'));
    const gridSize = 180;
    const margin = 10;
    const rowCapacity = Math.floor(parentNode.clientWidth / gridSize) || 1;

    const row = Math.floor(children.length / rowCapacity);
    const col = children.length % rowCapacity;

    return { left: col * gridSize + margin, top: row * (40 + margin) + margin };
}

// تابع برای رسم خطوط بین child-nodeها
function drawArrow(fromNode, toNode) {
    const fromRect = fromNode.getBoundingClientRect();
    const toRect = toNode.getBoundingClientRect();
    const canvasRect = document.querySelector(".canvas").getBoundingClientRect();

    const fromPoints = {
        top: { x: fromRect.left - canvasRect.left + fromRect.width / 2, y: fromRect.top - canvasRect.top },
        bottom: { x: fromRect.left - canvasRect.left + fromRect.width / 2, y: fromRect.bottom - canvasRect.top },
        left: { x: fromRect.left - canvasRect.left, y: fromRect.top - canvasRect.top + fromRect.height / 2 },
        right: { x: fromRect.right - canvasRect.left, y: fromRect.top - canvasRect.top + fromRect.height / 2 }
    };

    const toPoints = {
        top: { x: toRect.left - canvasRect.left + toRect.width / 2, y: toRect.top - canvasRect.top },
        bottom: { x: toRect.left - canvasRect.left + toRect.width / 2, y: toRect.bottom - canvasRect.top },
        left: { x: toRect.left - canvasRect.left, y: toRect.top - canvasRect.top + toRect.height / 2 },
        right: { x: toRect.right - canvasRect.left, y: toRect.top - canvasRect.top + toRect.height / 2 }
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

// تابع برای به‌روزرسانی خطوط
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
        defs.innerHTML = `
            <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="black" />
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
            pathElement.setAttribute("stroke-width", "2");
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
            const canvasRect = document.querySelector('.canvas').getBoundingClientRect();
            tooltip.style.left = `${e.clientX - canvasRect.left + 10}px`;
            tooltip.style.top = `${e.clientY - canvasRect.top + 10}px`;
        });

        pathElement.addEventListener('mouseout', () => {
            tooltip.style.display = 'none';
        });
    });
}

// اعمال توابع به تمام گره‌ها و دسته‌های تغییر اندازه
const nodes = document.querySelectorAll(".node");
nodes.forEach(node => setupDrag(node));

const resizeHandles = document.querySelectorAll(".resize-handle");
resizeHandles.forEach(handle => setupResize(handle));

// تابع برای انتقال child-node به parent-node مربوطه
function moveChildToParent(childNode, parentNode) {
    parentNode.appendChild(childNode);
    childNode.style.position = "absolute";
    let left, top;
    if (childNode.style.left && childNode.style.top) {
        // استفاده از مختصات ذخیره‌شده
        left = parseFloat(childNode.style.left);
        top = parseFloat(childNode.style.top);
    } else {
        // محاسبه موقعیت جدید
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

// تابع برای انتقال child-node از parent-node به لیست
function moveChildToArea(childNode) {
    const childList = document.querySelector(".child-list");
    childList.appendChild(childNode);
    childNode.style.position = "static";
    childPositions[childNode.id] = { x_coor: -1, y_coor: -1 };
    childNode.style.zIndex = "5";
    updateArrows();
}

// تابع برای بررسی اینکه آیا child-node به parent-node مربوطه کشیده شده است یا نه
function isCorrectParent(childNode, parentNode) {
    return childNode.getAttribute("data-parent-id") === parentNode.id;
}

// اضافه کردن رویدادها به child-nodeها
const childNodes = document.querySelectorAll(".child");
childNodes.forEach(childNode => {
    let clickTimeout = null;

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

// تابع برای نمایش modal (بدون انیمیشن)
function showModal(content) {
    const modal = document.getElementById("modal");
    const modalBody = document.getElementById("modal-body");
    modalBody.textContent = content;
    modal.style.display = "block";
}

// بستن modal با کلیک روی دکمه بسته شدن
document.querySelector(".modal-close").onclick = function () {
    document.getElementById("modal").style.display = "none";
};

// بستن modal با کلیک خارج از آن
document.getElementById("modal").onclick = function (e) {
    if (e.target === document.getElementById("modal")) {
        document.getElementById("modal").style.display = "none";
    }
};

// تابع برای تنظیم موقعیت‌های child-nodeها و parent-nodeها
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

// تابع برای تنظیم موقعیت parent-nodeهای ریشه
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
            // استفاده از مختصات ذخیره‌شده
            left = parseFloat(parent.style.left);
            top = parseFloat(parent.style.top);
        } else {
            // محاسبه موقعیت جدید اگر مختصاتی وجود نداشته باشه
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

// تابع برای ذخیره موقعیت‌ها
function saveNodePositions() {
    const processUpdates = [];
    for (const id in childPositions) {
        const childNode = document.getElementById(id);
        const parentId = childNode.getAttribute("data-parent-id");
        const processGroup = parentId ? parseInt(parentId.replace("parent-", "")) : null;
        processUpdates.push({
            process_id: parseInt(id.replace("child-", "")),
            process_group: processGroup, // اضافه کردن process_group
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

// اجرای اولیه
initializePositionsAndDimensions();
layoutRootParents();

// انتقال child-nodeهای داخل بوم به parent-node مربوطه
const childNodesInCanvas = document.querySelectorAll(".child.in-canvas");
childNodesInCanvas.forEach(childNode => {
    const parentId = childNode.getAttribute("data-parent-id");
    const targetParent = document.getElementById(parentId);
    if (targetParent) {
        moveChildToParent(childNode, targetParent);
        childNode.classList.remove("in-canvas");
    }
});

// تنظیم سایز parent-nodeها
const rootParents = document.querySelectorAll(".canvas > .parent");
rootParents.forEach(rootParent => adjustParentSize(rootParent));

// به‌روزرسانی خطوط
setTimeout(updateArrows, 300);