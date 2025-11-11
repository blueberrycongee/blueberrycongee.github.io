// 树类型识别算法

class TreeNode {
    constructor(value, x = 0, y = 0) {
        this.value = value;
        this.left = null;
        this.right = null;
        this.parent = null;
        this.x = x;
        this.y = y;
        this.id = `node-${Date.now()}-${Math.random()}`;
    }
}

class TreeAnalyzer {
    constructor() {
        this.root = null;
    }

    // 设置根节点
    setRoot(root) {
        this.root = root;
    }

    // 获取所有节点
    getAllNodes(root = this.root, nodes = []) {
        if (!root) return nodes;
        nodes.push(root);
        this.getAllNodes(root.left, nodes);
        this.getAllNodes(root.right, nodes);
        return nodes;
    }

    // 计算节点的深度（从根节点到该节点的路径上的边数）
    // 根节点深度为 0
    getNodeDepth(node, root = this.root, depth = 0) {
        if (!root || !node) return -1;
        if (root === node) return depth;
        
        const leftDepth = this.getNodeDepth(node, root.left, depth + 1);
        if (leftDepth !== -1) return leftDepth;
        
        return this.getNodeDepth(node, root.right, depth + 1);
    }

    // 计算树的高度（树中所有叶节点的深度中的最大值）
    // 空树：高度为 -1
    // 只有根节点的树：高度为 0
    getHeight(root = this.root) {
        if (!root) return -1; // 空树高度为 -1
        
        // 如果是叶节点（没有子节点），返回深度 0（相对于当前节点）
        if (!root.left && !root.right) return 0;
        
        // 递归计算左右子树的高度，取最大值并加1
        const leftHeight = this.getHeight(root.left);
        const rightHeight = this.getHeight(root.right);
        return 1 + Math.max(leftHeight, rightHeight);
    }

    // 计算树的最大深度（等同于树的高度，用于显示）
    // 这个方法是 getHeight 的别名，保持向后兼容
    getDepth(root = this.root) {
        return this.getHeight(root);
    }

    // 计算节点数
    getNodeCount(root = this.root) {
        if (!root) return 0;
        return 1 + this.getNodeCount(root.left) + this.getNodeCount(root.right);
    }

    // 检查是否为真二叉树（每个节点有0或2个子节点）
    isStrictBinaryTree(root = this.root) {
        if (!root) return true;
        const hasLeft = root.left !== null;
        const hasRight = root.right !== null;
        
        // 如果有子节点，必须有两个
        if (hasLeft || hasRight) {
            if (!(hasLeft && hasRight)) return false;
        }
        
        return this.isStrictBinaryTree(root.left) && this.isStrictBinaryTree(root.right);
    }

    // 检查是否为完全二叉树
    isCompleteBinaryTree(root = this.root) {
        if (!root) return true;
        
        const nodeCount = this.getNodeCount(root);
        return this.isCompleteBinaryTreeHelper(root, 0, nodeCount);
    }

    isCompleteBinaryTreeHelper(root, index, nodeCount) {
        if (!root) return true;
        if (index >= nodeCount) return false;
        return this.isCompleteBinaryTreeHelper(root.left, 2 * index + 1, nodeCount) &&
               this.isCompleteBinaryTreeHelper(root.right, 2 * index + 2, nodeCount);
    }

    // 检查是否为满二叉树（所有非叶子节点都有两个子节点，且所有叶子节点在同一层）
    isFullBinaryTree(root = this.root) {
        if (!root) return true;
        
        const height = this.getHeight(root);
        const nodeCount = this.getNodeCount(root);
        const expectedNodes = Math.pow(2, height + 1) - 1;
        
        return nodeCount === expectedNodes && this.isStrictBinaryTree(root);
    }

    // 检查是否为二叉搜索树
    isBinarySearchTree(root = this.root, min = -Infinity, max = Infinity) {
        if (!root) return true;
        
        const value = parseInt(root.value) || 0;
        if (value <= min || value >= max) return false;
        
        return this.isBinarySearchTree(root.left, min, value) &&
               this.isBinarySearchTree(root.right, value, max);
    }

    // 检查是否为左式堆
    isLeftistHeap(root = this.root) {
        if (!root) return true;
        
        // 左式堆需要满足：
        // 1. 堆性质（最小堆或最大堆）
        // 2. 左孩子的null路径长度 >= 右孩子的null路径长度
        
        const isHeap = this.isMinHeap(root) || this.isMaxHeap(root);
        if (!isHeap) return false;
        
        return this.checkLeftistProperty(root);
    }

    // 检查最小堆性质
    isMinHeap(root = this.root) {
        if (!root) return true;
        
        const value = parseInt(root.value) || 0;
        const leftValue = root.left ? (parseInt(root.left.value) || 0) : Infinity;
        const rightValue = root.right ? (parseInt(root.right.value) || 0) : Infinity;
        
        if (value > leftValue || value > rightValue) return false;
        
        return this.isMinHeap(root.left) && this.isMinHeap(root.right);
    }

    // 检查最大堆性质
    isMaxHeap(root = this.root) {
        if (!root) return true;
        
        const value = parseInt(root.value) || 0;
        const leftValue = root.left ? (parseInt(root.left.value) || 0) : -Infinity;
        const rightValue = root.right ? (parseInt(root.right.value) || 0) : -Infinity;
        
        if (value < leftValue || value < rightValue) return false;
        
        return this.isMaxHeap(root.left) && this.isMaxHeap(root.right);
    }

    // 计算null路径长度（到最近null节点的距离）
    getNullPathLength(root) {
        if (!root) return 0;
        return 1 + Math.min(
            this.getNullPathLength(root.left),
            this.getNullPathLength(root.right)
        );
    }

    // 检查左式堆的左式性质
    checkLeftistProperty(root = this.root) {
        if (!root) return true;
        
        const leftNPL = this.getNullPathLength(root.left);
        const rightNPL = this.getNullPathLength(root.right);
        
        if (leftNPL < rightNPL) return false;
        
        return this.checkLeftistProperty(root.left) && 
               this.checkLeftistProperty(root.right);
    }

    // 计算平衡因子（左右子树高度差）
    getBalanceFactor(root = this.root) {
        if (!root) return 0;
        const leftHeight = this.getHeight(root.left);
        const rightHeight = this.getHeight(root.right);
        return leftHeight - rightHeight;
    }

    // 识别树类型
    identifyTreeType() {
        if (!this.root) return '未识别';
        
        const types = [];
        
        if (this.isStrictBinaryTree()) {
            types.push('真二叉树');
        }
        
        if (this.isCompleteBinaryTree()) {
            types.push('完全二叉树');
        }
        
        if (this.isFullBinaryTree()) {
            types.push('满二叉树');
        }
        
        if (this.isBinarySearchTree()) {
            types.push('二叉搜索树');
        }
        
        if (this.isLeftistHeap()) {
            types.push('左式堆');
        }
        
        return types.length > 0 ? types.join('、') : '普通二叉树';
    }

    // 获取性能分析
    getPerformanceAnalysis() {
        const nodeCount = this.getNodeCount();
        const depth = this.getDepth();
        const isBST = this.isBinarySearchTree();
        
        return {
            search: isBST ? `O(log n) ≈ O(${Math.ceil(Math.log2(nodeCount || 1))})` : `O(n) ≈ O(${nodeCount})`,
            insert: isBST ? `O(log n) ≈ O(${Math.ceil(Math.log2(nodeCount || 1))})` : `O(n) ≈ O(${nodeCount})`,
            delete: isBST ? `O(log n) ≈ O(${Math.ceil(Math.log2(nodeCount || 1))})` : `O(n) ≈ O(${nodeCount})`
        };
    }

    // 验证树结构合法性
    validateTree() {
        if (!this.root) return { valid: true, message: '树为空' };
        
        // 检查是否有循环引用
        const visited = new Set();
        const hasCycle = this.checkCycle(this.root, visited);
        if (hasCycle) {
            return { valid: false, message: '检测到循环引用' };
        }
        
        // 检查父子关系一致性
        const nodes = this.getAllNodes();
        for (const node of nodes) {
            if (node.left && node.left.parent !== node) {
                return { valid: false, message: '父子关系不一致' };
            }
            if (node.right && node.right.parent !== node) {
                return { valid: false, message: '父子关系不一致' };
            }
        }
        
        return { valid: true, message: '结构合法' };
    }

    // 检查循环引用
    checkCycle(node, visited, parent = null) {
        if (!node) return false;
        if (visited.has(node)) return true;
        visited.add(node);
        
        if (node.left && this.checkCycle(node.left, visited, node)) return true;
        if (node.right && this.checkCycle(node.right, visited, node)) return true;
        
        return false;
    }

    // 导出为JSON
    exportToJSON() {
        const nodes = this.getAllNodes();
        const treeData = {
            root: this.root ? this.root.id : null,
            nodes: nodes.map(node => ({
                id: node.id,
                value: node.value,
                x: node.x,
                y: node.y,
                left: node.left ? node.left.id : null,
                right: node.right ? node.right.id : null,
                parent: node.parent ? node.parent.id : null
            }))
        };
        return JSON.stringify(treeData, null, 2);
    }
}

