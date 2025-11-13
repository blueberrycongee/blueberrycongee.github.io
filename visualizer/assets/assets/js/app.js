// 主应用逻辑

class TreeVisualizer {
    constructor() {
        this.nodes = new Map();
        this.root = null;
        this.analyzer = new TreeAnalyzer();
        this.draggingNode = null;
        this.draggingHandle = null;
        this.dragLine = null;
        this.dragStartPos = null;
        this.nodeCounter = 1;
        this.canvas = document.getElementById('tree-canvas');
        this.nodeContainer = document.getElementById('node-container');
        this.selectedTreeType = null;
        this.contextMenu = null;
        this.rafId = null;
        this.pendingRedraw = false;
        this.connectionLines = new Map(); // 存储连接线，用于快速更新
        this.nodeLines = new Map(); // 存储每个节点对应的连接线
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupContextMenu();
        this.setupEventListeners();
        this.createInitialNode();
        this.updateDisplay();
    }

    setupContextMenu() {
        // 创建右键菜单
        this.contextMenu = document.createElement('div');
        this.contextMenu.className = 'context-menu';
        this.contextMenu.innerHTML = `
            <div class="context-menu-item delete">删除节点</div>
        `;
        document.body.appendChild(this.contextMenu);
        
        // 点击菜单项
        this.contextMenu.querySelector('.delete').addEventListener('click', () => {
            if (this.contextMenu.dataset.nodeId) {
                this.deleteNode(this.contextMenu.dataset.nodeId);
            }
            this.hideContextMenu();
        });
        
        // 点击其他地方关闭菜单
        document.addEventListener('click', (e) => {
            if (!this.contextMenu.contains(e.target)) {
                this.hideContextMenu();
            }
        });
        
        // 阻止默认右键菜单
        this.nodeContainer.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    showContextMenu(x, y, nodeId) {
        this.contextMenu.style.display = 'block';
        this.contextMenu.style.left = `${x}px`;
        this.contextMenu.style.top = `${y}px`;
        this.contextMenu.dataset.nodeId = nodeId;
    }

    hideContextMenu() {
        this.contextMenu.style.display = 'none';
        this.contextMenu.dataset.nodeId = '';
    }

    setupCanvas() {
        // 创建SVG箭头标记
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'arrowhead');
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '10');
        marker.setAttribute('refX', '9');
        marker.setAttribute('refY', '3');
        marker.setAttribute('orient', 'auto');
        
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', '0 0, 10 3, 0 6');
        polygon.setAttribute('fill', '#667eea');
        marker.appendChild(polygon);
        defs.appendChild(marker);
        
        const markerInvalid = marker.cloneNode(true);
        markerInvalid.setAttribute('id', 'arrowhead-invalid');
        polygon.setAttribute('fill', '#dc3545');
        defs.appendChild(markerInvalid);
        
        this.canvas.appendChild(defs);
        
        // 设置画布大小
        this.updateCanvasSize();
        window.addEventListener('resize', () => this.updateCanvasSize());
    }

    updateCanvasSize() {
        const rect = this.nodeContainer.getBoundingClientRect();
        this.canvas.setAttribute('width', rect.width);
        this.canvas.setAttribute('height', rect.height);
        this.redrawConnections();
    }

    setupEventListeners() {
        // 树类型选择器
        document.querySelectorAll('.tree-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectedTreeType = e.target.dataset.type;
                document.querySelectorAll('.tree-type-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updateHints();
            });
        });

        // 清空按钮
        document.getElementById('clear-btn').addEventListener('click', () => {
            this.clearCanvas();
        });

        // 重置按钮
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.reset();
        });

        // 导出按钮
        document.getElementById('export-json-btn').addEventListener('click', () => {
            this.exportJSON();
        });

        document.getElementById('export-image-btn').addEventListener('click', () => {
            this.exportImage();
        });

        // 画布点击事件（创建根节点）
        this.nodeContainer.addEventListener('click', (e) => {
            if (e.target === this.nodeContainer && !this.root) {
                const rect = this.nodeContainer.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.createNode(x, y, true);
            }
        });
    }

    createInitialNode() {
        if (!this.root) {
            const rect = this.nodeContainer.getBoundingClientRect();
            const x = rect.width / 2;
            const y = 100;
            this.createNode(x, y, true);
        }
    }

    createNode(x, y, isRoot = false) {
        const node = document.createElement('div');
        node.className = 'tree-node';
        node.style.left = `${x - 30}px`;
        node.style.top = `${y - 30}px`;
        node.textContent = this.nodeCounter++;
        const nodeId = `node-${Date.now()}-${Math.random()}`;
        node.dataset.nodeId = nodeId;
        
        // 创建树节点对象
        const treeNode = new TreeNode(node.textContent, x, y);
        treeNode.id = nodeId;
        treeNode.domElement = node;
        
        this.nodes.set(nodeId, treeNode);
        
        if (isRoot || !this.root) {
            this.root = treeNode;
            this.analyzer.setRoot(treeNode);
        }
        
        // 创建链接手柄
        this.createHandles(node, treeNode);
        
        // 节点拖拽
        this.setupNodeDrag(node, treeNode);
        
        // 右键菜单
        this.setupNodeContextMenu(node, treeNode);
        
        this.nodeContainer.appendChild(node);
        this.updateDisplay();
        this.redrawConnections();
        
        return treeNode;
    }

    setupNodeContextMenu(nodeElement, treeNode) {
        nodeElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showContextMenu(e.clientX, e.clientY, treeNode.id);
        });
    }

    deleteNode(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node) return;
        
        // 如果是根节点，需要找到新的根节点
        if (this.root === node) {
            // 如果有子节点，选择左孩子或右孩子作为新根
            if (node.left) {
                this.root = node.left;
                node.left.parent = null;
                if (node.right) {
                    // 将右孩子连接到左孩子的某个位置（这里简化处理，可能需要更复杂的逻辑）
                    // 暂时只保留左孩子作为根
                }
            } else if (node.right) {
                this.root = node.right;
                node.right.parent = null;
            } else {
                this.root = null;
            }
            this.analyzer.setRoot(this.root);
        }
        
        // 断开与父节点的连接
        if (node.parent) {
            if (node.parent.left === node) {
                node.parent.left = null;
            } else if (node.parent.right === node) {
                node.parent.right = null;
            }
        }
        
        // 断开与子节点的连接
        if (node.left) {
            node.left.parent = null;
        }
        if (node.right) {
            node.right.parent = null;
        }
        
        // 删除相关的连接线引用
        this.nodeLines.delete(`${nodeId}-left`);
        this.nodeLines.delete(`${nodeId}-right`);
        if (node.parent) {
            const parentKey = `${node.parent.id}-${node.parent.left === node ? 'left' : 'right'}`;
            this.nodeLines.delete(parentKey);
        }
        
        // 删除DOM元素
        if (node.domElement) {
            node.domElement.remove();
        }
        
        // 从节点映射中删除
        this.nodes.delete(nodeId);
        
        // 更新显示
        this.updateDisplay();
        this.redrawConnections();
    }

    createHandles(nodeElement, treeNode) {
        // 上方手柄（创建父节点）
        const topHandle = document.createElement('div');
        topHandle.className = 'link-handle top';
        topHandle.dataset.direction = 'top';
        topHandle.title = '创建父节点';
        
        // 左侧手柄（创建左孩子）
        const leftHandle = document.createElement('div');
        leftHandle.className = 'link-handle left';
        leftHandle.dataset.direction = 'left';
        leftHandle.title = '创建左孩子';
        
        // 右侧手柄（创建右孩子）
        const rightHandle = document.createElement('div');
        rightHandle.className = 'link-handle right';
        rightHandle.dataset.direction = 'right';
        rightHandle.title = '创建右孩子';
        
        nodeElement.appendChild(topHandle);
        nodeElement.appendChild(leftHandle);
        nodeElement.appendChild(rightHandle);
        
        // 手柄拖拽事件
        this.setupHandleDrag(topHandle, treeNode, 'top');
        this.setupHandleDrag(leftHandle, treeNode, 'left');
        this.setupHandleDrag(rightHandle, treeNode, 'right');
    }

    setupHandleDrag(handle, sourceNode, direction) {
        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.startHandleDrag(e, sourceNode, direction);
        });
    }

    startHandleDrag(e, sourceNode, direction) {
        // 在开始拖拽时就检查是否合法
        const validation = this.isValidConnection(sourceNode, null, direction);
        if (!validation.valid) {
            // 操作非法，显示错误提示
            const hintBox = document.getElementById('hint-box');
            hintBox.innerHTML = `<p style="color: #dc3545;">✗ ${validation.reason}</p>`;
            hintBox.className = 'hint-box error';
            
            // 2秒后恢复提示
            setTimeout(() => {
                this.updateHints();
            }, 2000);
            return; // 不开始拖拽
        }
        
        this.draggingHandle = { node: sourceNode, direction };
        this.dragStartPos = { x: e.clientX, y: e.clientY };
        
        // 创建拖拽连接线
        this.dragLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        this.dragLine.setAttribute('stroke', '#667eea');
        this.dragLine.setAttribute('stroke-width', '3');
        this.dragLine.setAttribute('stroke-dasharray', '5,5');
        this.dragLine.setAttribute('marker-end', 'url(#arrowhead)');
        this.canvas.appendChild(this.dragLine);
        
        const rect = this.nodeContainer.getBoundingClientRect();
        const sourceRect = sourceNode.domElement.getBoundingClientRect();
        const startX = sourceRect.left + sourceRect.width / 2 - rect.left;
        const startY = sourceRect.top + sourceRect.height / 2 - rect.top;
        
        // 根据方向调整起点
        let offsetX = 0, offsetY = 0;
        if (direction === 'left') offsetX = -30;
        else if (direction === 'right') offsetX = 30;
        else if (direction === 'top') offsetY = -30;
        
        this.dragLine.setAttribute('x1', startX + offsetX);
        this.dragLine.setAttribute('y1', startY + offsetY);
        this.dragLine.setAttribute('x2', e.clientX - rect.left);
        this.dragLine.setAttribute('y2', e.clientY - rect.top);
        
        document.addEventListener('mousemove', this.handleDragMove);
        document.addEventListener('mouseup', this.handleDragEnd);
    }

    handleDragMove = (e) => {
        if (!this.dragLine || !this.draggingHandle) return;
        
        const rect = this.nodeContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.dragLine.setAttribute('x2', x);
        this.dragLine.setAttribute('y2', y);
        
        // 检查是否悬停在节点上
        const targetNode = this.getNodeAtPosition(e.clientX, e.clientY);
        const validation = this.isValidConnection(this.draggingHandle.node, targetNode, this.draggingHandle.direction);
        const isValid = validation.valid;
        const reason = validation.reason || '';
        
        // 更新提示信息
        this.updateDragHint(isValid, reason);
        
        if (targetNode && isValid) {
            targetNode.domElement.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.8)';
            this.dragLine.setAttribute('stroke', '#667eea');
            this.dragLine.setAttribute('marker-end', 'url(#arrowhead)');
        } else {
            // 移除所有高亮
            this.nodes.forEach(node => {
                if (node.domElement) {
                    node.domElement.style.boxShadow = '';
                }
            });
            
            if (targetNode && !isValid) {
                targetNode.domElement.style.boxShadow = '0 0 20px rgba(220, 53, 69, 0.8)';
                this.dragLine.setAttribute('stroke', '#dc3545');
                this.dragLine.setAttribute('marker-end', 'url(#arrowhead-invalid)');
            } else if (!isValid) {
                // 即使没有目标节点，如果操作本身非法，也要显示红色
                this.dragLine.setAttribute('stroke', '#dc3545');
                this.dragLine.setAttribute('marker-end', 'url(#arrowhead-invalid)');
            } else {
                this.dragLine.setAttribute('stroke', '#667eea');
                this.dragLine.setAttribute('marker-end', 'url(#arrowhead)');
            }
        }
    }

    updateDragHint(isValid, reason) {
        const hintBox = document.getElementById('hint-box');
        if (!isValid && reason) {
            hintBox.innerHTML = `<p style="color: #dc3545;">✗ ${reason}</p>`;
            hintBox.className = 'hint-box error';
        } else {
            // 恢复默认提示
            if (this.selectedTreeType) {
                this.updateHints();
            } else {
                hintBox.innerHTML = '<p>提示：将鼠标悬停在节点上以显示链接手柄</p>';
                hintBox.className = 'hint-box';
            }
        }
    }

    handleDragEnd = (e) => {
        if (!this.dragLine || !this.draggingHandle) return;
        
        const targetNode = this.getNodeAtPosition(e.clientX, e.clientY);
        const sourceNode = this.draggingHandle.node;
        const direction = this.draggingHandle.direction;
        
        // 移除所有高亮
        this.nodes.forEach(node => {
            if (node.domElement) {
                node.domElement.style.boxShadow = '';
            }
        });
        
        // 验证连接是否有效
        const validation = this.isValidConnection(sourceNode, targetNode, direction);
        
        if (validation.valid) {
            if (targetNode) {
                // 连接到已有节点
                this.connectNodes(sourceNode, targetNode, direction);
            } else {
                // 创建新节点
                const rect = this.nodeContainer.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const newNode = this.createNode(x, y);
                this.connectNodes(sourceNode, newNode, direction);
            }
        } else {
            // 操作非法，显示错误提示
            const hintBox = document.getElementById('hint-box');
            hintBox.innerHTML = `<p style="color: #dc3545;">✗ ${validation.reason}</p>`;
            hintBox.className = 'hint-box error';
            
            // 2秒后恢复提示
            setTimeout(() => {
                this.updateHints();
            }, 2000);
        }
        
        // 清理
        this.canvas.removeChild(this.dragLine);
        this.dragLine = null;
        this.draggingHandle = null;
        
        document.removeEventListener('mousemove', this.handleDragMove);
        document.removeEventListener('mouseup', this.handleDragEnd);
        
        this.updateDisplay();
        this.redrawConnections();
    }

    getNodeAtPosition(x, y) {
        for (const [id, node] of this.nodes) {
            if (!node.domElement) continue;
            const rect = node.domElement.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            if (distance < 40) {
                return node;
            }
        }
        return null;
    }

    isValidConnection(sourceNode, targetNode, direction) {
        // 检查上方手柄：如果源节点已有父节点，无论是否连接到已有节点或创建新节点，都是非法的
        if (direction === 'top') {
            if (sourceNode.parent) {
                return { valid: false, reason: '该节点已有父节点，无法创建新的父节点' };
            }
        }
        
        // 如果没有目标节点（创建新节点）
        if (!targetNode) {
            // 对于上方手柄，如果源节点已有父节点，已经在上面的检查中处理了
            // 对于左右手柄，创建新节点总是有效的
            if (direction === 'top' && sourceNode.parent) {
                return { valid: false, reason: '该节点已有父节点，无法创建新的父节点' };
            }
            return { valid: true, reason: '' };
        }
        
        // 连接到已有节点的情况
        if (sourceNode === targetNode) {
            return { valid: false, reason: '不能连接到自身' };
        }
        
        if (direction === 'left') {
            if (sourceNode.left) {
                return { valid: false, reason: '左孩子已存在' };
            }
        } else if (direction === 'right') {
            if (sourceNode.right) {
                return { valid: false, reason: '右孩子已存在' };
            }
        } else if (direction === 'top') {
            if (targetNode.left && targetNode.right) {
                return { valid: false, reason: '目标节点已有两个孩子' };
            }
        }
        
        // 检查是否会造成循环
        if (direction === 'top' && this.wouldCreateCycle(sourceNode, targetNode)) {
            return { valid: false, reason: '会造成循环引用' };
        }
        
        return { valid: true, reason: '' };
    }

    wouldCreateCycle(node, potentialParent) {
        let current = potentialParent;
        while (current) {
            if (current === node) return true;
            current = current.parent;
        }
        return false;
    }

    connectNodes(sourceNode, targetNode, direction) {
        if (direction === 'left') {
            if (sourceNode.left) {
                sourceNode.left.parent = null;
            }
            sourceNode.left = targetNode;
            targetNode.parent = sourceNode;
        } else if (direction === 'right') {
            if (sourceNode.right) {
                sourceNode.right.parent = null;
            }
            sourceNode.right = targetNode;
            targetNode.parent = sourceNode;
        } else if (direction === 'top') {
            // 将sourceNode设置为targetNode的孩子
            // 需要找到targetNode的空位置
            if (!targetNode.left) {
                targetNode.left = sourceNode;
                sourceNode.parent = targetNode;
            } else if (!targetNode.right) {
                targetNode.right = sourceNode;
                sourceNode.parent = targetNode;
            }
            
            // 如果sourceNode是根节点，需要更新根节点
            if (this.root === sourceNode) {
                // 找到新的根节点（没有父节点的节点）
                this.root = this.findRoot(targetNode);
                this.analyzer.setRoot(this.root);
            }
        }
        
        this.updateDisplay();
    }

    findRoot(node) {
        while (node.parent) {
            node = node.parent;
        }
        return node;
    }

    setupNodeDrag(nodeElement, treeNode) {
        let isDragging = false;
        let startX, startY, initialX, initialY;
        let animationFrameId = null;
        
        const handleMouseDown = (e) => {
            if (e.target.classList.contains('link-handle')) return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = nodeElement.getBoundingClientRect();
            const containerRect = this.nodeContainer.getBoundingClientRect();
            initialX = rect.left - containerRect.left + rect.width / 2;
            initialY = rect.top - containerRect.top + rect.height / 2;
            nodeElement.classList.add('dragging');
            this.draggingNode = treeNode;
            e.preventDefault();
        };
        
        const updateConnections = () => {
            if (!isDragging || !this.draggingNode) return;
            
            // 只更新与当前拖动节点相关的连接线
            this.updateNodeConnections(this.draggingNode);
            
            animationFrameId = null;
            this.pendingRedraw = false;
        };
        
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            const containerRect = this.nodeContainer.getBoundingClientRect();
            const newX = initialX + dx;
            const newY = initialY + dy;
            treeNode.x = newX;
            treeNode.y = newY;
            nodeElement.style.left = `${newX - 30}px`;
            nodeElement.style.top = `${newY - 30}px`;
            
            // 使用 requestAnimationFrame 优化性能
            if (!this.pendingRedraw) {
                this.pendingRedraw = true;
                animationFrameId = requestAnimationFrame(updateConnections);
            }
        };
        
        const handleMouseUp = () => {
            if (isDragging) {
                isDragging = false;
                nodeElement.classList.remove('dragging');
                this.draggingNode = null;
                
                // 取消待处理的动画帧
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
                
                // 最终更新所有连接
                this.redrawConnections();
                this.updateDisplay();
            }
        };
        
        nodeElement.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    updateNodeConnections(node) {
        // 更新与指定节点相关的所有连接线
        if (!node.domElement) return;
        
        const nodeRect = node.domElement.getBoundingClientRect();
        const containerRect = this.nodeContainer.getBoundingClientRect();
        const nodeX = nodeRect.left + nodeRect.width / 2 - containerRect.left;
        const nodeY = nodeRect.top + nodeRect.height / 2 - containerRect.top;
        
        // 更新父节点到当前节点的连接
        if (node.parent && node.parent.domElement) {
            // 查找父节点到当前节点的连接线
            const parentLineKey = `${node.parent.id}-${node.parent.left === node ? 'left' : 'right'}`;
            const parentLine = this.nodeLines.get(parentLineKey);
            if (parentLine) {
                parentLine.setAttribute('x2', nodeX);
                parentLine.setAttribute('y2', nodeY);
            } else {
                // 如果找不到，使用备用方法
                this.updateParentConnection(node, nodeX, nodeY);
            }
        }
        
        // 更新当前节点到左孩子的连接
        if (node.left && node.left.domElement) {
            const leftRect = node.left.domElement.getBoundingClientRect();
            const leftX = leftRect.left + leftRect.width / 2 - containerRect.left;
            const leftY = leftRect.top + leftRect.height / 2 - containerRect.top;
            
            const leftLineKey = `${node.id}-left`;
            const leftLine = this.nodeLines.get(leftLineKey);
            if (leftLine) {
                leftLine.setAttribute('x1', nodeX);
                leftLine.setAttribute('y1', nodeY);
                leftLine.setAttribute('x2', leftX);
                leftLine.setAttribute('y2', leftY);
            }
        }
        
        // 更新当前节点到右孩子的连接
        if (node.right && node.right.domElement) {
            const rightRect = node.right.domElement.getBoundingClientRect();
            const rightX = rightRect.left + rightRect.width / 2 - containerRect.left;
            const rightY = rightRect.top + rightRect.height / 2 - containerRect.top;
            
            const rightLineKey = `${node.id}-right`;
            const rightLine = this.nodeLines.get(rightLineKey);
            if (rightLine) {
                rightLine.setAttribute('x1', nodeX);
                rightLine.setAttribute('y1', nodeY);
                rightLine.setAttribute('x2', rightX);
                rightLine.setAttribute('y2', rightY);
            }
        }
    }

    updateParentConnection(node, nodeX, nodeY) {
        // 备用方法：直接查找连接线
        const lines = Array.from(this.canvas.querySelectorAll('line'));
        if (!node.parent || !node.parent.domElement) return;
        
        const parentRect = node.parent.domElement.getBoundingClientRect();
        const containerRect = this.nodeContainer.getBoundingClientRect();
        const parentX = parentRect.left + parentRect.width / 2 - containerRect.left;
        const parentY = parentRect.top + parentRect.height / 2 - containerRect.top;
        
        for (const line of lines) {
            const x1 = parseFloat(line.getAttribute('x1'));
            const y1 = parseFloat(line.getAttribute('y1'));
            
            if (Math.abs(x1 - parentX) < 10 && Math.abs(y1 - parentY) < 10) {
                const x2 = parseFloat(line.getAttribute('x2'));
                const y2 = parseFloat(line.getAttribute('y2'));
                if (Math.abs(x2 - nodeX) < 10 && Math.abs(y2 - nodeY) < 10) {
                    line.setAttribute('x2', nodeX);
                    line.setAttribute('y2', nodeY);
                    break;
                }
            }
        }
    }

    redrawConnections() {
        // 清除所有现有连接（除了拖拽线）
        const lines = this.canvas.querySelectorAll('line');
        lines.forEach(line => {
            if (line !== this.dragLine) {
                this.canvas.removeChild(line);
            }
        });
        
        // 清空连接线映射
        this.nodeLines.clear();
        
        // 绘制所有连接
        this.nodes.forEach(node => {
            if (!node.domElement) return;
            
            const nodeRect = node.domElement.getBoundingClientRect();
            const containerRect = this.nodeContainer.getBoundingClientRect();
            const nodeX = nodeRect.left + nodeRect.width / 2 - containerRect.left;
            const nodeY = nodeRect.top + nodeRect.height / 2 - containerRect.top;
            
            if (node.left && node.left.domElement) {
                const leftRect = node.left.domElement.getBoundingClientRect();
                const leftX = leftRect.left + leftRect.width / 2 - containerRect.left;
                const leftY = leftRect.top + leftRect.height / 2 - containerRect.top;
                
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', nodeX);
                line.setAttribute('y1', nodeY);
                line.setAttribute('x2', leftX);
                line.setAttribute('y2', leftY);
                line.setAttribute('stroke', '#667eea');
                line.setAttribute('stroke-width', '3');
                line.setAttribute('marker-end', 'url(#arrowhead)');
                this.canvas.appendChild(line);
                
                // 存储连接线引用
                const lineKey = `${node.id}-left`;
                this.nodeLines.set(lineKey, line);
            }
            
            if (node.right && node.right.domElement) {
                const rightRect = node.right.domElement.getBoundingClientRect();
                const rightX = rightRect.left + rightRect.width / 2 - containerRect.left;
                const rightY = rightRect.top + rightRect.height / 2 - containerRect.top;
                
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', nodeX);
                line.setAttribute('y1', nodeY);
                line.setAttribute('x2', rightX);
                line.setAttribute('y2', rightY);
                line.setAttribute('stroke', '#667eea');
                line.setAttribute('stroke-width', '3');
                line.setAttribute('marker-end', 'url(#arrowhead)');
                this.canvas.appendChild(line);
                
                // 存储连接线引用
                const lineKey = `${node.id}-right`;
                this.nodeLines.set(lineKey, line);
            }
        });
    }

    updateDisplay() {
        // 更新树类型
        const treeType = this.analyzer.identifyTreeType();
        document.getElementById('tree-type-display').textContent = treeType;
        
        // 更新属性
        const nodeCount = this.analyzer.getNodeCount();
        const depth = this.analyzer.getDepth();
        const height = this.analyzer.getHeight();
        const balanceFactor = this.analyzer.getBalanceFactor();
        
        document.getElementById('node-count').textContent = nodeCount;
        document.getElementById('tree-depth').textContent = depth;
        document.getElementById('tree-height').textContent = height;
        document.getElementById('balance-factor').textContent = balanceFactor;
        
        // 更新性能分析
        const performance = this.analyzer.getPerformanceAnalysis();
        document.getElementById('search-complexity').textContent = performance.search;
        document.getElementById('insert-complexity').textContent = performance.insert;
        document.getElementById('delete-complexity').textContent = performance.delete;
        
        // 更新验证状态
        const validation = this.analyzer.validateTree();
        const statusEl = document.getElementById('validation-status');
        statusEl.textContent = validation.valid ? `✓ ${validation.message}` : `✗ ${validation.message}`;
        statusEl.className = validation.valid ? 'validation-status' : 'validation-status invalid';
        
        // 更新提示
        this.updateHints();
    }

    updateHints() {
        const hintBox = document.getElementById('hint-box');
        if (!this.selectedTreeType) {
            hintBox.innerHTML = '<p>提示：将鼠标悬停在节点上以显示链接手柄</p>';
            hintBox.className = 'hint-box';
            return;
        }
        
        const treeType = this.analyzer.identifyTreeType();
        const typeNames = {
            'binary': '真二叉树',
            'complete': '完全二叉树',
            'full': '满二叉树',
            'bst': '二叉搜索树',
            'leftist': '左式堆'
        };
        
        const targetType = typeNames[this.selectedTreeType];
        const currentTypes = treeType.split('、');
        
        if (currentTypes.includes(targetType)) {
            hintBox.innerHTML = `<p>✓ 当前树是${targetType}！</p>`;
            hintBox.className = 'hint-box';
        } else {
            let hint = '';
            if (this.selectedTreeType === 'bst') {
                hint = '提示：二叉搜索树要求左子树所有节点值小于根节点，右子树所有节点值大于根节点';
            } else if (this.selectedTreeType === 'leftist') {
                hint = '提示：左式堆需要满足堆性质和左式性质（左孩子的null路径长度 >= 右孩子的null路径长度）';
            } else if (this.selectedTreeType === 'complete') {
                hint = '提示：完全二叉树要求所有层都完全填满，除了最后一层，且最后一层从左到右填充';
            } else if (this.selectedTreeType === 'full') {
                hint = '提示：满二叉树要求所有非叶子节点都有两个子节点，且所有叶子节点在同一层';
            } else if (this.selectedTreeType === 'binary') {
                hint = '提示：真二叉树要求每个节点有0个或2个子节点';
            }
            hintBox.innerHTML = `<p>${hint}</p>`;
            hintBox.className = 'hint-box warning';
        }
    }

    clearCanvas() {
        this.nodes.forEach(node => {
            if (node.domElement) {
                node.domElement.remove();
            }
        });
        this.nodes.clear();
        this.root = null;
        this.analyzer.setRoot(null);
        this.nodeCounter = 1;
        
        // 清除所有连接线
        const lines = this.canvas.querySelectorAll('line');
        lines.forEach(line => this.canvas.removeChild(line));
        
        this.updateDisplay();
    }

    reset() {
        this.clearCanvas();
        this.createInitialNode();
    }

    exportJSON() {
        const json = this.analyzer.exportToJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tree-structure.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    exportImage() {
        // 检查html2canvas是否可用
        if (typeof html2canvas === 'undefined') {
            alert('html2canvas库未加载，请检查网络连接或使用浏览器的截图功能');
            return;
        }
        
        // 使用html2canvas库截图
        html2canvas(this.nodeContainer, {
            backgroundColor: '#ffffff',
            width: this.nodeContainer.offsetWidth,
            height: this.nodeContainer.offsetHeight,
            scale: 2 // 提高图片质量
        }).then(canvas => {
            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'tree-structure.png';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 'image/png');
        }).catch(err => {
            console.error('导出图片失败:', err);
            alert('导出图片失败，请使用浏览器的截图功能');
        });
    }
}

// 初始化应用
let visualizer;
document.addEventListener('DOMContentLoaded', () => {
    visualizer = new TreeVisualizer();
});

