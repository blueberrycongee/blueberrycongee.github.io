// AVL树可视化器

class AVLNode {
    constructor(value) {
        this.value = value;
        this.left = null;
        this.right = null;
        this.height = 0;
        this.balanceFactor = 0;
        this.domElement = null;
        this.x = 0;
        this.y = 0;
        this.id = `node-${Date.now()}-${Math.random()}`;
    }

    updateHeight() {
        const leftHeight = this.left ? this.left.height : -1;
        const rightHeight = this.right ? this.right.height : -1;
        this.height = Math.max(leftHeight, rightHeight) + 1;
        this.balanceFactor = rightHeight - leftHeight;
    }
}

class AVLTree {
    constructor(visualizer = null) {
        this.root = null;
        this.nodeMap = new Map();
        this.visualizer = visualizer;
        this.rotationCounts = {
            ll: 0, // 左旋
            rr: 0, // 右旋
            lr: 0, // 左右旋
            rl: 0  // 右左旋
        };
        // 记录最近一次旋转信息，用于渲染后播放动画
        this.lastRotationInfo = null; // { type: 'LL'|'RR'|'LR'|'RL', pivotValue: number }
    }

    // 获取节点高度
    getHeight(node) {
        return node ? node.height : -1;
    }

    // 更新节点高度和平衡因子
    updateNodeHeight(node) {
        if (!node) return;
        node.updateHeight();
    }

    // 右旋（RR旋转）
    rotateRight(y) {
        const x = y.left;
        const T2 = x.right;

        // 执行旋转
        x.right = y;
        y.left = T2;

        // 更新高度
        this.updateNodeHeight(y);
        this.updateNodeHeight(x);

        this.rotationCounts.rr++;
        return x;
    }

    // 左旋（LL旋转）
    rotateLeft(x) {
        const y = x.right;
        const T2 = y.left;

        // 执行旋转
        y.left = x;
        x.right = T2;

        // 更新高度
        this.updateNodeHeight(x);
        this.updateNodeHeight(y);

        this.rotationCounts.ll++;
        return y;
    }

    // 左右旋（LR旋转）
    rotateLeftRight(node) {
        node.left = this.rotateLeft(node.left);
        if (this.visualizer && typeof this.visualizer.recordStep === 'function') {
            const leftVal = node.left ? node.left.value : null;
            this.visualizer.recordStep('LR 第一步：左子左旋', [node.value, leftVal].filter(v => v != null));
        }
        const res = this.rotateRight(node);
        if (this.visualizer && typeof this.visualizer.recordStep === 'function') {
            this.visualizer.recordStep('LR 第二步：当前节点右旋', [res.value]);
        }
        return res;
    }

    // 右左旋（RL旋转）
    rotateRightLeft(node) {
        node.right = this.rotateRight(node.right);
        if (this.visualizer && typeof this.visualizer.recordStep === 'function') {
            const rightVal = node.right ? node.right.value : null;
            this.visualizer.recordStep('RL 第一步：右子右旋', [node.value, rightVal].filter(v => v != null));
        }
        const res = this.rotateLeft(node);
        if (this.visualizer && typeof this.visualizer.recordStep === 'function') {
            this.visualizer.recordStep('RL 第二步：当前节点左旋', [res.value]);
        }
        return res;
    }

    // 插入节点
    async insert(value) {
        const result = await this.insertNode(this.root, value);
        this.root = result.node;
        return result.rotation;
    }

    async insertNode(node, value) {
        // 1. 执行标准BST插入
        if (!node) {
            return { node: new AVLNode(value), rotation: null };
        }

        let rotation = null;
        if (value < node.value) {
            const result = await this.insertNode(node.left, value);
            node.left = result.node;
            rotation = result.rotation;
        } else if (value > node.value) {
            const result = await this.insertNode(node.right, value);
            node.right = result.node;
            rotation = result.rotation;
        } else {
            // 值已存在，不插入
            return { node, rotation: null };
        }

        // 2. 更新节点高度
        this.updateNodeHeight(node);

        // 3. 获取平衡因子
        const balance = node.balanceFactor;

        // 4. 如果节点不平衡，执行旋转（仅记录旋转信息，不在此处播放动画）
        // 左左情况（LL）
        if (balance > 1 && node.right.balanceFactor >= 0) {
            rotation = 'LL';
            this.lastRotationInfo = { type: 'LL', pivotValue: node.value };
            const rotated = this.rotateLeft(node);
            if (this.visualizer) this.visualizer.addLog(`执行LL旋转`, 'rotate');
            return { node: rotated, rotation };
        }

        // 右右情况（RR）
        if (balance < -1 && node.left.balanceFactor <= 0) {
            rotation = 'RR';
            this.lastRotationInfo = { type: 'RR', pivotValue: node.value };
            const rotated = this.rotateRight(node);
            if (this.visualizer) this.visualizer.addLog(`执行RR旋转`, 'rotate');
            return { node: rotated, rotation };
        }

        // 左右情况（LR）
        if (balance < -1 && node.left.balanceFactor > 0) {
            rotation = 'LR';
            this.lastRotationInfo = { type: 'LR', pivotValue: node.value };
            const rotated = this.rotateLeftRight(node);
            if (this.visualizer) this.visualizer.addLog(`执行LR旋转`, 'rotate');
            return { node: rotated, rotation };
        }

        // 右左情况（RL）
        if (balance > 1 && node.right.balanceFactor < 0) {
            rotation = 'RL';
            this.lastRotationInfo = { type: 'RL', pivotValue: node.value };
            const rotated = this.rotateRightLeft(node);
            if (this.visualizer) this.visualizer.addLog(`执行RL旋转`, 'rotate');
            return { node: rotated, rotation };
        }

        return { node, rotation };
    }

    // 删除节点
    async delete(value) {
        this.root = await this.deleteNode(this.root, value);
        return this.root;
    }

    async deleteNode(node, value) {
        if (!node) {
            return null;
        }

        if (value < node.value) {
            node.left = await this.deleteNode(node.left, value);
        } else if (value > node.value) {
            node.right = await this.deleteNode(node.right, value);
        } else {
            // 找到要删除的节点
            if (!node.left && !node.right) {
                // 叶子节点
                return null;
            } else if (!node.left) {
                return node.right;
            } else if (!node.right) {
                return node.left;
            } else {
                // 有两个子节点，找到中序后继
                const successor = this.getMinValueNode(node.right);
                node.value = successor.value;
                node.right = await this.deleteNode(node.right, successor.value);
            }
        }

        // 更新节点高度
        this.updateNodeHeight(node);

        // 获取平衡因子
        const balance = node.balanceFactor;

        // 左左情况（LL）
        if (balance > 1 && node.right && node.right.balanceFactor >= 0) {
            await this.showRotationAnimation('LL', node);
            const result = this.rotateLeft(node);
            if (this.visualizer) {
                this.visualizer.addLog(`执行LL旋转`, 'rotate');
            }
            return result;
        }

        // 右右情况（RR）
        if (balance < -1 && node.left && node.left.balanceFactor <= 0) {
            await this.showRotationAnimation('RR', node);
            const result = this.rotateRight(node);
            if (this.visualizer) {
                this.visualizer.addLog(`执行RR旋转`, 'rotate');
            }
            return result;
        }

        // 左右情况（LR）
        if (balance < -1 && node.left && node.left.balanceFactor > 0) {
            await this.showRotationAnimation('LR', node);
            const result = this.rotateLeftRight(node);
            if (this.visualizer) {
                this.visualizer.addLog(`执行LR旋转`, 'rotate');
            }
            return result;
        }

        // 右左情况（RL）
        if (balance > 1 && node.right && node.right.balanceFactor < 0) {
            await this.showRotationAnimation('RL', node);
            const result = this.rotateRightLeft(node);
            if (this.visualizer) {
                this.visualizer.addLog(`执行RL旋转`, 'rotate');
            }
            return result;
        }

        return node;
    }

    // 获取最小值的节点
    getMinValueNode(node) {
        let current = node;
        while (current.left) {
            current = current.left;
        }
        return current;
    }

    // 显示旋转动画
    async showRotationAnimation(type, node) {
        if (!this.visualizer) {
            return;
        }

        // 收集参与节点并设置说明
        const nodesToAnimate = [];
        if (node) nodesToAnimate.push(node);
        let x = null, y = null, T2 = null;
        let title = '';
        let stepsText = [];
        let stepItems = [];

        if (type === 'LL') {
            // 左旋：x=node, y=node.right, T2=y.left
            x = node;
            y = node && node.right ? node.right : null;
            T2 = y && y.left ? y.left : null;
            if (y) nodesToAnimate.push(y);
            if (T2) nodesToAnimate.push(T2);
            title = 'LL 左旋（右重）';
            stepsText = [
                '步骤 1：标记 x=当前节点, y=其右子节点',
                '步骤 2：将 y 的左子树 T2 设为 x 的右子树',
                '步骤 3：y 上移为新子树根，x 成为 y 的左子'
            ];
            stepItems = [
                { message: stepsText[0], nodes: [x, y] },
                { message: stepsText[1], nodes: [T2, x] },
                { message: stepsText[2], nodes: [x, y] }
            ];
        } else if (type === 'RR') {
            // 右旋：y=node, x=node.left, T2=x.right
            y = node;
            x = node && node.left ? node.left : null;
            T2 = x && x.right ? x.right : null;
            if (x) nodesToAnimate.push(x);
            if (T2) nodesToAnimate.push(T2);
            title = 'RR 右旋（左重）';
            stepsText = [
                '步骤 1：标记 y=当前节点, x=其左子节点',
                '步骤 2：将 x 的右子树 T2 设为 y 的左子树',
                '步骤 3：x 上移为新子树根，y 成为 x 的右子'
            ];
            stepItems = [
                { message: stepsText[0], nodes: [y, x] },
                { message: stepsText[1], nodes: [T2, y] },
                { message: stepsText[2], nodes: [x, y] }
            ];
        } else if (type === 'LR') {
            if (node && node.left) nodesToAnimate.push(node.left);
            title = 'LR 左右双旋';
            stepsText = [
                '步骤 1：先对当前节点的左子执行左旋',
                '步骤 2：再对当前节点执行右旋'
            ];
            stepItems = [
                { message: stepsText[0], nodes: [node.left] },
                { message: stepsText[1], nodes: [node] }
            ];
        } else if (type === 'RL') {
            if (node && node.right) nodesToAnimate.push(node.right);
            title = 'RL 右左双旋';
            stepsText = [
                '步骤 1：先对当前节点的右子执行右旋',
                '步骤 2：再对当前节点执行左旋'
            ];
            stepItems = [
                { message: stepsText[0], nodes: [node.right] },
                { message: stepsText[1], nodes: [node] }
            ];
        }

        // 显示动画提示（含步骤）
        const overlay = document.createElement('div');
        overlay.className = 'animation-overlay show';
        overlay.innerHTML = `<div class="rotation-title">${title}</div><div class="rotation-step"></div>`;
        document.body.appendChild(overlay);
        const stepEl = overlay.querySelector('.rotation-step');

        // 标记旋转中的节点
        nodesToAnimate.forEach(n => {
            if (n && n.domElement) {
                n.domElement.classList.add('rotating');
            }
        });

        // 高亮连接线
        const canvas = this.visualizer.canvas;
        const nodeContainer = this.visualizer.nodeContainer;
        const lines = canvas.querySelectorAll('line');
        lines.forEach(line => {
            const x1 = parseFloat(line.getAttribute('x1'));
            const y1 = parseFloat(line.getAttribute('y1'));
            nodesToAnimate.forEach(n => {
                if (n && n.domElement) {
                    const rect = n.domElement.getBoundingClientRect();
                    const containerRect = nodeContainer.getBoundingClientRect();
                    const nodeX = rect.left + rect.width / 2 - containerRect.left;
                    const nodeY = rect.top + rect.height / 2 - containerRect.top;
                    if (Math.abs(x1 - nodeX) < 5 && Math.abs(y1 - nodeY) < 5) {
                        line.classList.add('rotating');
                    }
                }
            });
        });

        // 分步展示，整体时间更慢
        for (let i = 0; i < stepsText.length; i++) {
            stepEl.textContent = stepsText[i];
            await this.sleep(type === 'LR' || type === 'RL' ? 1200 : 1400);
        }

        // 移除标记
        nodesToAnimate.forEach(n => {
            if (n && n.domElement) {
                n.domElement.classList.remove('rotating');
            }
        });
        lines.forEach(line => line.classList.remove('rotating'));
        overlay.remove();

        // 旋转动画仅用于即时提示，具体的回放通过快照步进实现
    }

    // 工具函数：延迟
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 获取所有节点
    getAllNodes(root = this.root, nodes = []) {
        if (!root) return nodes;
        nodes.push(root);
        this.getAllNodes(root.left, nodes);
        this.getAllNodes(root.right, nodes);
        return nodes;
    }

    // 获取节点数
    getNodeCount() {
        return this.getAllNodes().length;
    }

    // 获取树的高度
    getTreeHeight() {
        return this.root ? this.root.height : -1;
    }

    // 检查是否平衡
    isBalanced(root = this.root) {
        if (!root) return true;
        const balance = Math.abs(root.balanceFactor);
        return balance <= 1 && this.isBalanced(root.left) && this.isBalanced(root.right);
    }

    // 在指定路径上再平衡
    async rebalancePath(node, steps = []) {
        let current = node;
        while (current) {
            this.updateNodeHeight(current);
            const balance = current.balanceFactor;

            let newCurrent = null;
            let rotationMessage = null;
            let rotationHighlight = [];

            // 左左情况
            if (balance > 1 && current.right && current.right.balanceFactor >= 0) {
                this.lastRotationInfo = { type: 'LL', pivotValue: current.value };
                await this.showRotationAnimation('LL', current);
                newCurrent = this.rotateLeft(current);
                if (this.visualizer) this.visualizer.addLog(`执行LL旋转`, 'rotate');
                rotationMessage = 'LL 旋转';
                rotationHighlight = [this.lastRotationInfo?.pivotValue].filter(v => v != null);
            }
            // 右右情况
            else if (balance < -1 && current.left && current.left.balanceFactor <= 0) {
                this.lastRotationInfo = { type: 'RR', pivotValue: current.value };
                await this.showRotationAnimation('RR', current);
                newCurrent = this.rotateRight(current);
                if (this.visualizer) this.visualizer.addLog(`执行RR旋转`, 'rotate');
                rotationMessage = 'RR 旋转';
                rotationHighlight = [this.lastRotationInfo?.pivotValue].filter(v => v != null);
            }
            // 左右情况
            else if (balance < -1 && current.left && current.left.balanceFactor > 0) {
                this.lastRotationInfo = { type: 'LR', pivotValue: current.value };
                await this.showRotationAnimation('LR', current);
                newCurrent = this.rotateLeftRight(current);
                if (this.visualizer) this.visualizer.addLog(`执行LR旋转`, 'rotate');
                // 双旋各步骤在 rotateLeftRight 内已记录
            }
            // 右左情况
            else if (balance > 1 && current.right && current.right.balanceFactor < 0) {
                this.lastRotationInfo = { type: 'RL', pivotValue: current.value };
                await this.showRotationAnimation('RL', current);
                newCurrent = this.rotateRightLeft(current);
                if (this.visualizer) this.visualizer.addLog(`执行RL旋转`, 'rotate');
                // 双旋各步骤在 rotateRightLeft 内已记录
            }

            if (newCurrent) {
                const parent = this.findParent(this.root, current.value);
                if (parent) {
                    if (parent.left === current) {
                        parent.left = newCurrent;
                    } else {
                        parent.right = newCurrent;
                    }
                } else {
                    this.root = newCurrent;
                }
                current = newCurrent;

                // 重要：在新子树挂接到父节点之后再记录旋转快照，保证整棵树的一致性
                if (rotationMessage && Array.isArray(steps) && this.visualizer) {
                    steps.push({
                        message: rotationMessage,
                        highlightValues: rotationHighlight,
                        snapshot: this.visualizer.snapshotTree(this.root)
                    });
                    rotationMessage = null;
                    rotationHighlight = [];
                }
            }

            current = this.findParent(this.root, current.value);
        }
    }

    // 按值查找节点（用于渲染后根据枢轴定位参与动画的节点）
    findNodeByValue(root, value) {
        if (!root) return null;
        if (value === root.value) return root;
        if (value < root.value) return this.findNodeByValue(root.left, value);
        return this.findNodeByValue(root.right, value);
    }

    findParent(root, value) {
        if (!root || root.value === value) {
            return null;
        }

        if ((root.left && root.left.value === value) || (root.right && root.right.value === value)) {
            return root;
        }

        if (value < root.value) {
            return this.findParent(root.left, value);
        }

        return this.findParent(root.right, value);
    }
}

// AVL树可视化器
class AVLVisualizer {
    constructor() {
        this.tree = new AVLTree(this);
        this.canvas = document.getElementById('tree-canvas');
        this.nodeContainer = document.getElementById('node-container');
        this.operationLog = document.getElementById('operation-log');
        this.stepController = new AnimationStepController({
            nodeContainer: this.nodeContainer,
            canvas: this.canvas,
            onStep: this.onStepChange ? this.onStepChange.bind(this) : undefined,
            overlayParent: document.body,
            overlayAutoHideMs: 3000
        });
        this.pendingSteps = [];
        this.animationQueue = [];
        this.isAnimating = false;
        this.nodeCounter = 1;
        this.draggingHandle = null;
        this.dragLine = null;
        this.contextMenu = null;
        this.valueMenu = null; // 添加值菜单属性

        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.createValueMenu(); // 创建值菜单
        this.updateDisplay();
        // 延迟创建初始节点，确保DOM已加载
        setTimeout(() => {
            this.createInitialNode();
        }, 200);
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
        // 清空按钮
        document.getElementById('clear-btn').addEventListener('click', () => {
            this.clearTree();
        });

        // 重置按钮
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.clearTree();
        });

        // 画布点击事件（创建根节点）
        this.nodeContainer.addEventListener('click', (e) => {
            // 检查是否点击在画布空白区域（不是节点或手柄）
            // 如果点击的是容器本身，或者是SVG画布，且没有根节点，则创建根节点
            const isContainer = e.target === this.nodeContainer;
            const isCanvas = e.target === this.canvas || e.target.tagName === 'svg';
            const isBlankArea = isContainer || isCanvas;
            
            if (isBlankArea && !this.tree.root) {
                e.preventDefault();
                e.stopPropagation();
                const rect = this.nodeContainer.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.createNode(x, y, true);
            }
        });

        // 设置右键菜单
        this.setupContextMenu();

        // 绑定步进按钮
        const prevBtn = document.getElementById('step-prev-btn');
        const nextBtn = document.getElementById('step-next-btn');
        if (prevBtn && nextBtn) {
            this.stepController.bindControls(prevBtn, nextBtn);
        }
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
                this.deleteNodeById(this.contextMenu.dataset.nodeId);
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

    createInitialNode() {
        if (!this.tree.root) {
            const rect = this.nodeContainer.getBoundingClientRect();
            console.log('createInitialNode', rect);
            if (rect.width > 0 && rect.height > 0) {
                const x = rect.width / 2;
                const y = 100;
                console.log('创建初始节点', { x, y });
                this.createNode(x, y, true);
            } else {
                console.log('容器尺寸无效，重试...');
                // 如果容器尺寸无效，延迟重试
                setTimeout(() => {
                    this.createInitialNode();
                }, 100);
            }
        }
    }

    async createNode(x, y, isRoot = false) {
        if (this.isAnimating) {
            console.log('正在动画中，跳过创建节点');
            return null;
        }

        console.log('开始创建节点', { x, y, isRoot, hasRoot: !!this.tree.root });
        this.isAnimating = true;

        try {
            // 创建新节点，值从最大值+1生成
            let value;
            if (this.tree.root) {
                const maxValue = this.getMaxValue(this.tree.root);
                value = maxValue + 1;
            } else {
                value = this.nodeCounter++;
            }
            let rotation = null;

            if (isRoot || !this.tree.root) {
                this.tree.root = new AVLNode(value);
                this.addLog(`创建根节点: ${value}`, 'insert');
                console.log('创建根节点成功', value);
            } else {
                // 插入到AVL树并平衡
                rotation = await this.tree.insert(value);
                this.addLog(`插入节点: ${value}`, 'insert');
                console.log('插入节点成功', value);
            }

            // 先渲染，让新节点可见
            await this.renderTree();

            // 若发生旋转，则在渲染后播放动画，再重新渲染
            if (rotation) {
                const pivotValue = this.tree.lastRotationInfo?.pivotValue;
                const pivotNode = pivotValue != null ? this.tree.findNodeByValue(this.tree.root, pivotValue) : this.tree.root;
                await this.tree.showRotationAnimation(rotation, pivotNode);
                await this.renderTree();
            }

            this.updateDisplay();

            console.log('节点创建完成');
            return this.tree.root;
        } catch (error) {
            console.error('创建节点失败:', error);
            this.addLog('创建节点失败: ' + error.message, 'warning');
            return null;
        } finally {
            this.isAnimating = false;
        }
    }

    async connectNodeToParent(parentNode, childNode, direction) {
        if (this.isAnimating) {
            return;
        }

        this.isAnimating = true;

        // 根据BST规则插入节点
        if (direction === 'left') {
            if (parentNode.left) {
                // 左孩子已存在，不能插入
                this.isAnimating = false;
                return;
            }
            parentNode.left = childNode;
        } else if (direction === 'right') {
            if (parentNode.right) {
                // 右孩子已存在，不能插入
                this.isAnimating = false;
                return;
            }
            parentNode.right = childNode;
        }

        // 插入到AVL树并平衡
        const rotation = await this.tree.insert(childNode.value);

        // 先渲染新节点
        await this.renderTree();

        // 若有旋转，渲染后播放动画并再次渲染
        if (rotation) {
            const pivotValue = this.tree.lastRotationInfo?.pivotValue;
            const pivotNode = pivotValue != null ? this.tree.findNodeByValue(this.tree.root, pivotValue) : this.tree.root;
            await this.tree.showRotationAnimation(rotation, pivotNode);
            await this.renderTree();
        }
        this.updateDisplay();

        this.isAnimating = false;
    }

    async deleteNodeById(nodeId) {
        if (this.isAnimating) {
            return;
        }

        // 找到节点
        const allNodes = this.tree.getAllNodes();
        const node = allNodes.find(n => n.id === nodeId);
        if (!node) return;

        this.isAnimating = true;
        this.addLog(`删除节点: ${node.value}`, 'delete');

        // 删除节点
        await this.tree.delete(node.value);

        // 重新渲染
        await this.renderTree();
        this.updateDisplay();

        this.isAnimating = false;
    }

    clearTree() {
        // 清除所有节点
        this.nodeContainer.querySelectorAll('.avl-node').forEach(node => node.remove());
        this.canvas.querySelectorAll('line').forEach(line => line.remove());
        this.tree = new AVLTree(this);
        this.operationLog.innerHTML = '<p class="log-empty">暂无操作</p>';
        this.updateDisplay();
    }

    async renderTree() {
        // 保存现有节点的位置（用于动画）
        const oldPositions = new Map();
        this.nodeContainer.querySelectorAll('.avl-node').forEach(nodeEl => {
            const nodeId = nodeEl.dataset.nodeId;
            const allNodes = this.tree.getAllNodes();
            const node = allNodes.find(n => n.id === nodeId);
            if (node) {
                oldPositions.set(node, {
                    x: parseFloat(nodeEl.style.left) + 35,
                    y: parseFloat(nodeEl.style.top) + 35
                });
            }
        });

        // 清除现有节点
        this.nodeContainer.querySelectorAll('.avl-node').forEach(node => node.remove());
        this.canvas.querySelectorAll('line').forEach(line => line.remove());

        if (!this.tree.root) return;

        // 计算布局
        const layout = this.calculateLayout(this.tree.root);
        
        // 创建节点和连接
        await this.createNodesWithAnimation(this.tree.root, layout, oldPositions);
        this.redrawConnections();
    }

    async createNodesWithAnimation(root, layout, oldPositions) {
        const createNodeElement = async (node) => {
            const pos = layout.get(node);
            if (!pos) return;

            const nodeElement = document.createElement('div');
            nodeElement.className = 'avl-node';
            nodeElement.dataset.nodeId = node.id;
            nodeElement.dataset.value = String(node.value);

            nodeElement.innerHTML = `
                <div class="node-value">${node.value}</div>
                <div class="node-balance ${this.getBalanceClass(node.balanceFactor)}">
                    BF: ${node.balanceFactor}
                </div>
            `;

            node.domElement = nodeElement;
            node.x = pos.x;
            node.y = pos.y;

            // 检查是否有旧位置（用于动画）
            const oldPos = oldPositions.get(node);
            if (oldPos) {
                // 从旧位置开始动画
                nodeElement.style.left = `${oldPos.x - 35}px`;
                nodeElement.style.top = `${oldPos.y - 35}px`;
                nodeElement.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            } else {
                // 新节点，从中心缩放
                nodeElement.style.left = `${pos.x - 35}px`;
                nodeElement.style.top = `${pos.y - 35}px`;
                nodeElement.style.opacity = '0';
                nodeElement.style.transform = 'scale(0)';
            }

            this.nodeContainer.appendChild(nodeElement);

            // 创建链接手柄
            this.createHandles(nodeElement, node);
            
            // 右键菜单
            this.setupNodeContextMenu(nodeElement, node);

            // 触发动画
            await this.sleep(10);
            if (oldPos) {
                // 移动到新位置
                nodeElement.style.left = `${pos.x - 35}px`;
                nodeElement.style.top = `${pos.y - 35}px`;
            } else {
                // 缩放和淡入
                nodeElement.style.transition = 'all 0.3s ease';
                nodeElement.style.opacity = '1';
                nodeElement.style.transform = 'scale(1)';
            }
        };

        const traverse = async (node) => {
            if (!node) return;
            await traverse(node.left);
            await createNodeElement(node);
            await traverse(node.right);
        };

        await traverse(root);
        await this.sleep(500);
    }

    // 工具函数：延迟
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    calculateLayout(root) {
        const layout = new Map();
        const nodeWidth = 70;
        const nodeHeight = 70;
        const horizontalSpacing = 100;
        const verticalSpacing = 120;

        const calculatePositions = (node, x, y, level) => {
            if (!node) return;

            const nodeX = x;
            const nodeY = y;

            layout.set(node, { x: nodeX, y: nodeY });

            if (node.left || node.right) {
                const childrenCount = this.countChildren(node);
                const leftWidth = this.getSubtreeWidth(node.left);
                const rightWidth = this.getSubtreeWidth(node.right);

                if (node.left) {
                    const leftX = x - (rightWidth + 1) * horizontalSpacing;
                    calculatePositions(node.left, leftX, y + verticalSpacing, level + 1);
                }

                if (node.right) {
                    const rightX = x + (leftWidth + 1) * horizontalSpacing;
                    calculatePositions(node.right, rightX, y + verticalSpacing, level + 1);
                }
            }
        };

        const containerRect = this.nodeContainer.getBoundingClientRect();
        const startX = containerRect.width / 2;
        const startY = 200;

        calculatePositions(root, startX, startY, 0);

        return layout;
    }

    countChildren(node) {
        if (!node) return 0;
        return (node.left ? 1 : 0) + (node.right ? 1 : 0);
    }

    getSubtreeWidth(node) {
        if (!node) return 0;
        const leftWidth = this.getSubtreeWidth(node.left);
        const rightWidth = this.getSubtreeWidth(node.right);
        return Math.max(leftWidth, rightWidth) + 1;
    }


    getBalanceClass(balanceFactor) {
        if (balanceFactor > 0) return 'positive';
        if (balanceFactor < 0) return 'negative';
        return 'zero';
    }

    createHandles(nodeElement, treeNode) {
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
        
        nodeElement.appendChild(leftHandle);
        nodeElement.appendChild(rightHandle);
        
        // 手柄拖拽事件
        this.setupHandleDrag(leftHandle, treeNode, 'left');
        this.setupHandleDrag(rightHandle, treeNode, 'right');
    }

    setupHandleDrag(handle, sourceNode, direction) {
        handle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showValueMenu(e, sourceNode, direction);
        });
    }

    createValueMenu() {
        this.valueMenu = document.createElement('div');
        this.valueMenu.className = 'value-menu';
        document.body.appendChild(this.valueMenu);

        document.addEventListener('click', (e) => {
            if (!this.valueMenu.contains(e.target)) {
                this.hideValueMenu();
            }
        });
    }

    showValueMenu(event, parentNode, direction) {
        this.valueMenu.innerHTML = '';
        this.valueMenu.style.display = 'block';
        this.valueMenu.style.left = `${event.clientX + 10}px`;
        this.valueMenu.style.top = `${event.clientY}px`;

        const values = this.generateSuggestedValues(parentNode, direction);

        values.forEach(value => {
            const item = document.createElement('a');
            item.href = '#';
            item.textContent = value;
            item.onclick = (e) => {
                e.preventDefault();
                this.handleValueSelection(value, parentNode, direction);
                this.hideValueMenu();
            };
            this.valueMenu.appendChild(item);
        });

        // 添加一个事件监听器来隐藏菜单
        setTimeout(() => {
            document.addEventListener('click', this.hideValueMenu.bind(this), { once: true });
        }, 0);
    }

    // 生成“全局合法”的建议值：同时满足父节点方向约束以及所有祖先约束
    generateSuggestedValues(parentNode, direction) {
        const { low, high } = this.getGlobalBoundsForChild(parentNode, direction);
        const suggested = [];

        // 如果没有合法区间，返回空列表
        if (!(low < high)) return suggested;

        // 从父节点附近开始向合法方向探测，避免破坏 BST
        const step = direction === 'left' ? -1 : 1;
        let candidate = direction === 'left' ? parentNode.value - 1 : parentNode.value + 1;

        const maxTries = 100; // 防御性限制，避免极端情况下死循环
        while (suggested.length < 3 && candidate > low && candidate < high && suggested.length < 3) {
            let tries = 0;
            // 跳过已存在或不在合法区间的值
            while ((this.tree.nodeMap.has(candidate) || !(candidate > low && candidate < high)) && tries < maxTries) {
                candidate += step;
                tries++;
            }
            if (tries >= maxTries) break;
            // 二次校验，确保合法
            if (candidate > low && candidate < high && !this.tree.nodeMap.has(candidate)) {
                suggested.push(candidate);
                candidate += step;
            } else {
                break; // 无更多合法候选
            }
        }

        return suggested;
    }

    // 计算“全局合法区间”：[low, high]，开区间 (low, high)
    // 遍历从根到 parentNode 的路径，累积祖先约束
    getGlobalBoundsForChild(parentNode, direction) {
        let low = -Infinity;
        let high = Infinity;
        let curr = this.tree.root;
        const targetVal = parentNode.value;

        while (curr && curr !== parentNode) {
            if (targetVal < curr.value) {
                // parentNode 位于 curr 的左子树，所有子孙都必须 < curr.value
                high = Math.min(high, curr.value);
                curr = curr.left;
            } else {
                // parentNode 位于 curr 的右子树，所有子孙都必须 > curr.value
                low = Math.max(low, curr.value);
                curr = curr.right;
            }
        }

        if (direction === 'left') {
            high = Math.min(high, parentNode.value);
        } else {
            low = Math.max(low, parentNode.value);
        }
        return { low, high };
    }

    getMinValue(node) {
        let current = node;
        while (current.left) {
            current = current.left;
        }
        return current.value;
    }

    getMaxValue(node) {
        let current = node;
        while (current.right) {
            current = current.right;
        }
        return current.value;
    }

    hideValueMenu() {
        if (this.valueMenu) {
            this.valueMenu.style.display = 'none';
        }
    }

    async handleValueSelection(value, parentNode, direction) {
        const numValue = typeof value === 'number' ? value : parseInt(value, 10);
        const { low, high } = this.getGlobalBoundsForChild(parentNode, direction);

        // 全局合法性与唯一性校验
        if (!(numValue > low && numValue < high)) {
            this.addLog(`非法值：${numValue} 不在允许区间 (${low}, ${high}) 内`, 'error');
            return;
        }
        if (this.tree.nodeMap.has(numValue)) {
            this.addLog(`重复值：${numValue} 已存在于树中`, 'error');
            return;
        }

        // 记录插入过程快照：插入前
        const steps = [];
        this.pendingSteps = steps;
        steps.push({
            message: '插入前（原树）',
            highlightValues: [],
            snapshot: this.snapshotTree(this.tree.root)
        });

        const newNode = this.createNodeAt(numValue, parentNode, direction);

        // 先渲染，让新节点可见（未再平衡）
        await this.renderTree();
        steps.push({
            message: `插入后（未再平衡）：${numValue}`,
            highlightValues: [numValue],
            snapshot: this.snapshotTree(this.tree.root)
        });

        // 再进行路径再平衡（内部将分步播放旋转动画，并在旋转点记录快照）
        await this.tree.rebalancePath(parentNode, steps);

        const childDirection = direction === 'left' ? '左' : '右';
        this.addLog(`为节点 ${parentNode.value} 添加${childDirection}孩子: ${numValue}`, 'insert');

        await this.renderTree();
        // 再平衡完成（最终树形）
        steps.push({
            message: '再平衡完成',
            highlightValues: [],
            snapshot: this.snapshotTree(this.tree.root)
        });

        // 设置快照步进（默认定位到最后一步：当前状态）
        this.stepController.setSteps('插入过程', steps);
        this.updateDisplay();
    }

    createNodeAt(value, parentNode, direction) {
        const newNode = new AVLNode(value);
        if (direction === 'left') {
            parentNode.left = newNode;
        } else {
            parentNode.right = newNode;
        }
        this.tree.nodeMap.set(value, newNode);
        return newNode;
    }

    getMaxValue(node) {
        if (!node) return null;
        let current = node;
        while (current.right) {
            current = current.right;
        }
        return current.value;
    }

    getMinValue(node) {
        if (!node) return null;
        let current = node;
        while (current.left) {
            current = current.left;
        }
        return current.value;
    }

    setupNodeContextMenu(nodeElement, treeNode) {
        nodeElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showContextMenu(e.clientX, e.clientY, treeNode.id);
        });
    }

    redrawConnections() {
        // 清除所有连接线
        this.canvas.querySelectorAll('line').forEach(line => line.remove());

        const drawConnections = (node) => {
            if (!node || !node.domElement) return;

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
                line.style.transition = 'all 0.5s ease';
                this.canvas.appendChild(line);

                drawConnections(node.left);
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
                line.style.transition = 'all 0.5s ease';
                this.canvas.appendChild(line);

                drawConnections(node.right);
            }
        };

        drawConnections(this.tree.root);
    }

    updateDisplay() {
        // 更新节点数
        document.getElementById('node-count').textContent = this.tree.getNodeCount();

        // 更新高度
        document.getElementById('tree-height').textContent = this.tree.getTreeHeight();

        // 更新平衡状态
        const isBalanced = this.tree.isBalanced();
        const balanceStatus = document.getElementById('balance-status');
        balanceStatus.textContent = isBalanced ? '平衡' : '不平衡';
        balanceStatus.style.color = isBalanced ? '#28a745' : '#dc3545';

        // 更新旋转计数
        document.getElementById('ll-count').textContent = this.tree.rotationCounts.ll;
        document.getElementById('rr-count').textContent = this.tree.rotationCounts.rr;
        document.getElementById('lr-count').textContent = this.tree.rotationCounts.lr;
        document.getElementById('rl-count').textContent = this.tree.rotationCounts.rl;
    }

    // 步进回调：依据快照重渲染并高亮节点
    async onStepChange(step) {
        if (!step) return;
        if (step.snapshot) {
            await this.renderSnapshot(step.snapshot);
        }
        if (Array.isArray(step.highlightValues)) {
            this.highlightValues(step.highlightValues);
        }
    }

    // 根据快照重建树并渲染
    async renderSnapshot(snapshot) {
        const root = this.buildTreeFromSnapshot(snapshot);
        this.tree.root = root;
        await this.renderTree();
    }

    // 生成结构快照（值与左右子引用）
    snapshotTree(root) {
        const snap = (node) => {
            if (!node) return null;
            return {
                value: node.value,
                left: snap(node.left),
                right: snap(node.right)
            };
        };
        return snap(root);
    }

    // 从快照构建 AVLNode 树并补充高度与平衡因子
    buildTreeFromSnapshot(snapshot) {
        const build = (s) => {
            if (!s) return null;
            const n = new AVLNode(s.value);
            n.left = build(s.left);
            n.right = build(s.right);
            return n;
        };
        const root = build(snapshot);
        this.recomputeHeightsAndBF(root);
        return root;
    }

    // 后序遍历重算高度与平衡因子
    recomputeHeightsAndBF(node) {
        const dfs = (n) => {
            if (!n) return -1;
            const lh = dfs(n.left);
            const rh = dfs(n.right);
            n.height = Math.max(lh, rh) + 1;
            const lhv = n.left ? n.left.height : -1;
            const rhv = n.right ? n.right.height : -1;
            n.balanceFactor = rhv - lhv;
            return n.height;
        };
        dfs(node);
    }

    // 高亮指定值的节点（DOM）
    highlightValues(values) {
        if (!values || values.length === 0) {
            this.stepController.markNodes([]);
            return;
        }
        const nodes = [];
        values.forEach((val) => {
            const el = this.nodeContainer.querySelector(`.avl-node[data-value="${val}"]`);
            if (el) nodes.push(el);
        });
        this.stepController.markNodes(nodes);
    }

    // 供树算法调用：记录当前结构快照
    recordStep(message, highlightValues = []) {
        if (!Array.isArray(this.pendingSteps)) return;
        this.pendingSteps.push({
            message,
            highlightValues,
            snapshot: this.snapshotTree(this.tree.root)
        });
    }

    addLog(message, type = 'info') {
        if (this.operationLog.querySelector('.log-empty')) {
            this.operationLog.innerHTML = '';
        }

        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = message;
        this.operationLog.insertBefore(logEntry, this.operationLog.firstChild);

        // 限制日志数量
        while (this.operationLog.children.length > 20) {
            this.operationLog.removeChild(this.operationLog.lastChild);
        }
    }
}

// 初始化应用
let visualizer;
document.addEventListener('DOMContentLoaded', () => {
    visualizer = new AVLVisualizer();
});

