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
        node.style.zIndex = 1000;
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const parentNode = node.parentElement;
            const parentRect = parentNode.getBoundingClientRect();
            const nodeRect = node.getBoundingClientRect();

            let newX = e.clientX - offsetX - parentRect.left;
            let newY = e.clientY - offsetY - parentRect.top;

            if (newX < 0) newX = 0;
            if (newY < 0) newY = 0;
            if (newX + nodeRect.width > parentRect.width) newX = parentRect.width - nodeRect.width;
            if (newY + nodeRect.height > parentRect.height) newY = parentRect.height - nodeRect.height;

            node.style.left = `${newX}px`;
            node.style.top = `${newY}px`;

            // به‌روزرسانی موقعیت‌ها
            if (node.classList.contains('child')) {
                childPositions[node.id] = { x_coor: Math.round(newX), y_coor: Math.round(newY) };
            } else if (node.classList.contains('parent')) {
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
        parentNode.style.zIndex = 1000;
    });

    document.addEventListener('mousemove', (e) => {
        if (isResizing) {
            const parentNode = handle.parentElement;
            const parentParentNode = parentNode.parentElement;
            const parentParentRect = parentParentNode.getBoundingClientRect();

            let newWidth = startWidth + (e.clientX - startX);
            let newHeight = startHeight + (e.clientY - startY);

            const childNodes = Array.from(parentNode.children).filter(child => !child.classList.contains('resize-handle'));
            let minWidth = 0, minHeight = 0;

            childNodes.forEach(child => {
                const childRect = child.getBoundingClientRect();
                const childRight = childRect.right - parentNode.getBoundingClientRect().left;
                const childBottom = childRect.bottom - parentNode.getBoundingClientRect().top;

                if (childRight > minWidth) minWidth = childRight;
                if (childBottom > minHeight) minHeight = childBottom;
            });

            if (newWidth < minWidth) newWidth = minWidth;
            if (newHeight < minHeight) newHeight = minHeight;

            if (newWidth > parentParentRect.width - parentNode.offsetLeft) newWidth = parentParentRect.width - parentNode.offsetLeft;
            if (newHeight > parentParentRect.height - parentNode.offsetTop) newHeight = parentParentRect.height - parentNode.offsetTop;

            parentNode.style.width = `${newWidth}px`;
            parentNode.style.height = `${newHeight}px`;

            // به‌روزرسانی ابعاد parent-node
            parentDimensions[parentNode.id] = {
                x_coor: Math.round(parseFloat(parentNode.style.left || '0')),
                y_coor: Math.round(parseFloat(parentNode.style.top || '0')),
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
            parentNode.style.zIndex = '';
            updateArrows();
        }
    });
}

// تابع جدید برای مدیریت z-index
function updateZIndex(node) {
    const parentNode = node.closest('.parent');
    if (node.classList.contains('child') && parentNode) {
        if (!isCorrectParent(node, parentNode)) {
            node.style.zIndex = '-1';
        } else {
            node.style.zIndex = '5';
        }
    } else {
        node.style.zIndex = '5';
    }
}

// تابع برای تنظیم سایز parent-node بر اساس محتوای داخلش
function adjustParentSize(parentNode) {
    const childParents = parentNode.querySelectorAll('.parent');
    childParents.forEach(childParent => adjustParentSize(childParent));

    const children = Array.from(parentNode.children).filter(child => child.classList.contains('node'));
    if (children.length === 0) return;

    let maxRight = 0;
    let maxBottom = 0;
    children.forEach(child => {
        const left = parseInt(child.style.left || '0', 10);
        const top = parseInt(child.style.top || '0', 10);
        const right = left + child.offsetWidth;
        const bottom = top + child.offsetHeight;
        if (right > maxRight) maxRight = right;
        if (bottom > maxBottom) maxBottom = bottom;
    });

    const padding = 10;
    parentNode.style.width = `${maxRight + padding}px`;
    parentNode.style.height = `${maxBottom + padding}px`;

    // به‌روزرسانی ابعاد parent-node
    parentDimensions[parentNode.id] = {
        x_coor: Math.round(parseFloat(parentNode.style.left || '0')),
        y_coor: Math.round(parseFloat(parentNode.style.top || '0')),
        width: maxRight + padding,
        height: maxBottom + padding
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
        child.style.position = 'absolute';
        child.style.left = `${currentLeft}px`;
        child.style.top = `${currentTop}px`;
        // به‌روزرسانی موقعیت parent-node
        parentDimensions[child.id] = {
            x_coor: Math.round(currentLeft),
            y_coor: Math.round(currentTop),
            width: child.offsetWidth,
            height: child.offsetHeight
        };

        const nextTop = currentTop + child.offsetHeight + margin;
        if (nextTop > maxHeight) {
            currentLeft += columnWidth;
            currentTop = 10;
        } else {
            currentTop = nextTop;
        }

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

    const left = col * gridSize + margin;
    const top = row * (40 + margin) + margin;

    return { left, top };
}

// تابع برای پیدا کردن نزدیک‌ترین ضلع‌ها و رسم خط شکسته بدون مورب
function drawArrow(fromNode, toNode) {
    const fromRect = fromNode.getBoundingClientRect();
    const toRect = toNode.getBoundingClientRect();
    const canvasRect = document.querySelector('.canvas').getBoundingClientRect();

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

    if (fromSide === 'right' || fromSide === 'left') { // شروع افقی
        const midX = (start.x + end.x) / 2;
        path += `L ${midX},${start.y} L ${midX},${end.y} L ${end.x},${end.y}`;
    } else { // شروع عمودی
        const midY = (start.y + end.y) / 2;
        path += `L ${start.x},${midY} L ${end.x},${midY} L ${end.x},${end.y}`;
    }

    return { path, fromNode, toNode };
}

function updateArrows() {
    const svg = document.querySelector('.arrows');
    svg.innerHTML = ''; // پاک کردن SVG

    const childNodesInCanvas = Array.from(document.querySelectorAll('.canvas .child'));
    const arrowData = [];

    childNodesInCanvas.forEach(fromNode => {
        const fromId = fromNode.id; // استفاده از id به‌جای textContent
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
                        const fromRect = fromNode.getBoundingClientRect();
                        const toRect = toNode.getBoundingClientRect();
                        const canvasRect = document.querySelector('.canvas').getBoundingClientRect();

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
                        arrow.path = `M ${start.x},${start.y} `;
                        if (fromSide === 'right' || fromSide === 'left') {
                            const midX = (start.x + end.x) / 2;
                            arrow.path += `L ${midX},${start.y} L ${midX},${end.y} L ${end.x},${end.y}`;
                        } else {
                            const midY = (start.y + end.y) / 2;
                            arrow.path += `L ${start.x},${midY} L ${end.x},${midY} L ${end.x},${end.y}`;
                        }
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

    const tooltip = document.getElementById('tooltip');
    arrowData.forEach(arrow => {
        const arrowKey = `${arrow.fromNode.id}-${arrow.toNode.id}`; // استفاده از id به‌جای textContent
        let pathElement = arrowElements.get(arrowKey) ?.pathElement;
        if (!pathElement) {
            pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathElement.setAttribute('stroke', 'black');
            pathElement.setAttribute('stroke-width', '2');
            pathElement.setAttribute('fill', 'none');
            pathElement.setAttribute('marker-end', 'url(#arrowhead)');
            arrow.pathElement = pathElement;
        }
        pathElement.setAttribute('d', arrow.path);
        svg.appendChild(pathElement);

        pathElement.addEventListener('mouseover', (e) => {
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
const nodes = document.querySelectorAll('.node');
nodes.forEach(node => setupDrag(node));

const resizeHandles = document.querySelectorAll('.resize-handle');
resizeHandles.forEach(handle => setupResize(handle));

// تابع برای انتقال child-node به parent-node مربوطه
function moveChildToParent(childNode, parentNode) {
    childNode.remove();
    parentNode.appendChild(childNode);
    childNode.style.position = 'absolute';
    const { left, top } = getNextPosition(parentNode);
    childNode.style.left = `${left}px`;
    childNode.style.top = `${top}px`;

    // به‌روزرسانی موقعیت child-node
    childPositions[childNode.id] = { x_coor: Math.round(left), y_coor: Math.round(top) };

    updateZIndex(childNode);
    adjustParentSize(parentNode);
    updateArrows();
}

// تابع برای انتقال child-node از parent-node به لیست
function moveChildToArea(childNode) {
    const childList = document.querySelector('.child-list');
    childNode.remove();
    childList.appendChild(childNode);
    childNode.style.position = 'static';
    childNode.style.zIndex = '5';

    // تنظیم موقعیت به -1 برای child-node در child-list
    childPositions[childNode.id] = { x_coor: -1, y_coor: -1 };

    updateArrows();
}

// تابع برای بررسی اینکه آیا child-node به parent-node مربوطه کشیده شده است یا نه
function isCorrectParent(childNode, parentNode) {
    return childNode.getAttribute('data-parent-id') === parentNode.id;
}

// اضافه کردن رویدادها به child-nodeها
const childNodes = document.querySelectorAll('.child');
childNodes.forEach(childNode => {
    let clickTimeout = null;

    childNode.addEventListener('click', (e) => {
        e.preventDefault();
        clearTimeout(clickTimeout);
        clickTimeout = setTimeout(() => {
            const parentNode = childNode.closest('.parent');
            if (parentNode && isCorrectParent(childNode, parentNode)) {
                const key = childNode.id; // e.g., "child-5"
                const data = childNodeData[key];
                if (data) {
                    showModal(data.type1);
                }
            }
        }, 200);
    });

    childNode.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const parentNode = childNode.closest('.parent');
        if (parentNode && isCorrectParent(childNode, parentNode)) {
            const key = childNode.id; // e.g., "child-5"
            const data = childNodeData[key];
            if (data) {
                showModal(data.type2);
            }
        }
    });

    childNode.addEventListener('dblclick', (e) => {
        e.preventDefault();
        clearTimeout(clickTimeout);
        const parentNode = childNode.closest('.parent');
        if (parentNode) {
            moveChildToArea(childNode);
        } else {
            const parentId = childNode.getAttribute('data-parent-id');
            const targetParent = document.getElementById(parentId);
            if (targetParent) {
                moveChildToParent(childNode, targetParent);
            }
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
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    modalBody.textContent = content;
    modal.style.display = 'block';
}

// تابع برای بستن modal (بدون انیمیشن)
function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
}

// بستن modal با کلیک روی دکمه بسته شدن
document.querySelector('.modal-close').addEventListener('click', closeModal);

// بستن modal با کلیک خارج از آن
document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal')) {
        closeModal();
    }
});

function initializePositionsAndDimensions() {
    // تنظیم موقعیت‌های child-nodeها
    const allChildNodes = document.querySelectorAll('.child');
    allChildNodes.forEach(child => {
        const childId = child.id;
        const left = parseFloat(child.style.left || '0');
        const top = parseFloat(child.style.top || '0');
        if (child.closest('.child-list') || isNaN(left) || isNaN(top)) {
            childPositions[childId] = { x_coor: -1, y_coor: -1 };
        } else {
            childPositions[childId] = { x_coor: Math.round(left), y_coor: Math.round(top) };
        }
    });

    // تنظیم موقعیت‌ها و اندازه‌های parent-nodeها
    const allParentNodes = document.querySelectorAll('.parent');
    allParentNodes.forEach(parent => {
        const parentId = parent.id;
        const left = parseFloat(parent.style.left || '0');
        const top = parseFloat(parent.style.top || '0');
        const width = parseFloat(parent.style.width || parent.offsetWidth);
        const height = parseFloat(parent.style.height || parent.offsetHeight);
        parentDimensions[parentId] = {
            x_coor: Math.round(left),
            y_coor: Math.round(top),
            width: width,
            height: height
        };
    });
}

// تنظیم اولیه سایز و موقعیت تمام parent-nodeها
const rootParents = document.querySelectorAll('.canvas > .parent');
rootParents.forEach(rootParent => {
    const parentId = rootParent.id;
    const dim = parentDimensions[parentId];
    if (!dim || isNaN(dim.x_coor) || isNaN(dim.y_coor) || !dim.width || !dim.height) {
        rootParent.style.left = rootParent.id === 'parent-1' ? '200px' : '800px';
        rootParent.style.top = '150px';
        adjustParentPositions(rootParent);
        adjustParentSize(rootParent);
    }
});

function saveNodePositions() {
    const processUpdates = [];
    const groupUpdates = [];

    // جمع‌آوری داده‌های child-nodeها
    for (const [childId, pos] of Object.entries(childPositions)) {
        const processId = parseInt(childId.replace('child-', ''));
        processUpdates.push({
            process_id: processId,
            x: pos.x_coor,
            y: pos.y_coor
        });
    }

    // جمع‌آوری داده‌های parent-nodeها
    for (const [parentId, dim] of Object.entries(parentDimensions)) {
        const groupId = parseInt(parentId.replace('parent-', ''));
        groupUpdates.push({
            group_id: groupId,
            x: dim.x_coor,
            y: dim.y_coor,
            width: dim.width,
            height: dim.height
        });
    }

    // ارسال داده‌ها به سرور با AJAX
    $.ajax({
        url: '/Process/UpdateCoordinates', // مسیر متد کنترلر
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            processData: processUpdates,
            groupData: groupUpdates
        }),
        success: function (response) {
            if (response.success) {
                alert('Coordinates updated successfully!');
            } else {
                alert('Error updating coordinates.');
            }
        },
        error: function (xhr, status, error) {
            console.error('AJAX error:', status, error);
            alert('An error occurred while updating coordinates.');
        }
    });
}
initializePositionsAndDimensions();
updateArrows();

// انتقال child-nodeهای داخل بوم به parent-node مربوطه
const childNodesInCanvas = document.querySelectorAll('.child.in-canvas');
childNodesInCanvas.forEach(childNode => {
    const parentId = childNode.getAttribute('data-parent-id');
    const targetParent = document.getElementById(parentId);
    if (targetParent) {
        childNode.remove();
        targetParent.appendChild(childNode);
        childNode.classList.remove('in-canvas'); // حذف کلاس موقت
    }
});

updateArrows();