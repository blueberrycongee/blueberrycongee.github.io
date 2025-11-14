# BST 二叉搜索树

## 1. 基本概念

二叉搜索树（Binary Search Tree, BST）是一种特殊的二叉树，满足以下性质：

- **左子树**的所有节点值 < 根节点值
    
- **右子树**的所有节点值 > 根节点值
    
- 左右子树也都是二叉搜索树
    

## 2. 核心性质

**中序遍历必然递增**（非降序）

- 中序遍历：左 → 根 → 右
    
- 结果：升序序列
    
- 复杂度：O(n)
    

## 3. 操作复杂度

### 理想情况（平衡树）

- 查找：O(log n)
    
- 插入：O(log n)
    
- 删除：O(log n)
    

### 最坏情况（退化成链表）

- 查找：O(n)
    
- 插入：O(n)
    
- 删除：O(n)
    

## 4. 树高度分析

### 随机生成的BST

- **平均高度**：O(log n)
    
- 随机插入序列能保持较好平衡
    

### 随机组成的BST

- **平均高度**：O(√n)
    
- 这是某些特殊构造下的结果
    

### 退化情况

- **最坏高度**：O(n)
    
- 按升序或降序插入时发生
    

## 5. 基本操作

### 1. 查找操作

```python
def search(root, key):
    if root is None or root.val == key:
        return root
    
    if key < root.val:
        return search(root.left, key)
    else:
        return search(root.right, key)
```

### 2. 插入操作

```python
def insert(root, key):
    if root is None:
        return TreeNode(key)
    
    if key < root.val:
        root.left = insert(root.left, key)
    elif key > root.val:
        root.right = insert(root.right, key)
    
    return root
```

### 3. 删除操作

删除是最复杂的操作，分三种情况：

**情况1：叶子节点**

- 直接删除
    

**情况2：只有一个子节点**

- 用子节点替代被删除节点
    

**情况3：有两个子节点**

- 方法A：用**右子树的最小节点**替代
    
- 方法B：用**左子树的最大节点**替代
    

```python
def deleteNode(root, key):
    if root is None:
        return None
    
    if key < root.val:
        root.left = deleteNode(root.left, key)
    elif key > root.val:
        root.right = deleteNode(root.right, key)
    else:
        # 找到要删除的节点
        if root.left is None:
            return root.right
        elif root.right is None:
            return root.left
        
        # 两个子节点都存在
        # 找右子树最小节点
        minNode = findMin(root.right)
        root.val = minNode.val
        root.right = deleteNode(root.right, minNode.val)
    
    return root

def findMin(node):
    while node.left:
        node = node.left
    return node
```

## 6. 与有序数组的互转

### BST → 有序数组

```python
def inorderTraversal(root):
    result = []
    def inorder(node):
        if node:
            inorder(node.left)
            result.append(node.val)
            inorder(node.right)
    inorder(root)
    return result
```

**复杂度**：O(n)

### 有序数组 → 平衡BST

```python
def sortedArrayToBST(nums):
    if not nums:
        return None
    
    mid = len(nums) // 2
    root = TreeNode(nums[mid])
    root.left = sortedArrayToBST(nums[:mid])
    root.right = sortedArrayToBST(nums[mid+1:])
    return root
```

**复杂度**：O(n)

## 7. BST的问题

1. **不平衡**：极端情况下退化成链表
    
2. **性能不稳定**：依赖插入顺序
    
3. **解决方案**：使用平衡二叉树
    

## 8. 相关主题

- 比较基础算法
    
- 二分查找 - BST是二分思想的树形实现
    
- AVL树 - 严格平衡的BST
    
- 伸展树 - 自适应的BST
    
- 红黑树 - 弱平衡的BST
    

---

## 9. 常见面试题

1. 验证二叉搜索树
    
2. 二叉搜索树中第K小的元素
    
3. 将有序数组转换为BST
    
4. BST的最近公共祖先
    

---

#数据结构 #二叉搜索树 #BST #树


## 数据结构-二叉排序树判断题

**日期**: 2025-10-21
**来源**: 数据结构
#review错题本 #计算机科学/数据结构 #二叉排序树

---

### 一、原题复述

> [!question] 判断题
> 4、在一棵二叉树中，任一节点的关键码值都大于它的(如果存在)左孩子的关键码，且小于它的右孩子(如果存在)的关键码值，则此二叉树一定是一棵二叉排序树。

---

### 二、答案与解析

> [!summary] 答案
> **错误 (False)**

---

#### 核心知识点：二叉排序树 (BST) 的定义

你的理由是完全正确的。此题混淆了“二叉排序树”的真正定义与一个更弱的局部属性。

1.  **题中条件 (局部属性)**:
    对于**任意节点 N**，只要求：
    * `N.key > N.left_child.key` (如果存在)
    * `N.key < N.right_child.key` (如果存在)
    这只保证了任意节点比它的**直接孩子**满足大小关系。

2.  **二叉排序树 (BST) 的真正定义 (全局属性)**:
    对于**任意节点 N**，必须满足：
    * `N` 左**子树**中**所有**节点的 key，都必须小于 `N.key`。
    * `N` 右**子树**中**所有**节点的 key，都必须大于 `N.key`。

---

#review