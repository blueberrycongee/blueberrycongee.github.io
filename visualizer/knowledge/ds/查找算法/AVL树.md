# AVL树（C++实现）

## 1. 基本概念

AVL树是最早的自平衡二叉搜索树，由G. M. Adelson-Velsky和E. M. Landis在1962年提出。

​**定义**​：任意节点的左右子树高度差的绝对值 ≤ 1

## 2. 核心概念

### 2.1 平衡因子（Balance Factor）

```
BF = height(左子树) - height(右子树)
```

- AVL树要求：|BF| ≤ 1
    
- BF = -1, 0, 1 都是合法的
    

### 2.2 高度

- 空树高度：0
    
- 单节点树高度：1
    
- n个节点的AVL树高度：O(log n)
    

## 3. 操作复杂度

|操作|时间复杂度|说明|
|---|---|---|
|查找|O(log n)|保证平衡|
|插入|O(log n)|需要旋转|
|删除|O(log n)|需要旋转|

## 4. 拓扑结构变化量

这是AVL树的重要特性：

### 4.1 插入操作

- 结构变化：O(1)
    
- 最多只需要一次旋转（单旋或双旋）
    
- 从插入点向上，第一个失衡节点调整后，整棵树恢复平衡
    

### 4.2 删除操作

- 结构变化：O(log n)
    
- 最多需要O(log n)次旋转
    
- 可能需要一路向上调整到根节点
    

## 5. 节点结构定义

```
struct AVLNode {
    int key;
    AVLNode* left;
    AVLNode* right;
    int height;
    
    AVLNode(int k) : key(k), left(nullptr), right(nullptr), height(1) {}
};
```

## 6. 辅助函数

```
// 获取节点高度
int getHeight(AVLNode* node) {
    if (node == nullptr) return 0;
    return node->height;
}

// 获取平衡因子
int getBalance(AVLNode* node) {
    if (node == nullptr) return 0;
    return getHeight(node->left) - getHeight(node->right);
}

// 更新节点高度
void updateHeight(AVLNode* node) {
    if (node != nullptr) {
        node->height = 1 + max(getHeight(node->left), getHeight(node->right));
    }
}
```

## 7. 四种旋转操作

### 7.1 LL旋转（右旋）

```
AVLNode* rightRotate(AVLNode* y) {
    AVLNode* x = y->left;
    AVLNode* T2 = x->right;
    
    // 执行旋转
    x->right = y;
    y->left = T2;
    
    // 更新高度
    updateHeight(y);
    updateHeight(x);
    
    return x;
}
```

### 7.2 RR旋转（左旋）

```
AVLNode* leftRotate(AVLNode* x) {
    AVLNode* y = x->right;
    AVLNode* T2 = y->left;
    
    // 执行旋转
    y->left = x;
    x->right = T2;
    
    // 更新高度
    updateHeight(x);
    updateHeight(y);
    
    return y;
}
```

### 7.3 LR旋转（先左后右）

```
// 先对左子树左旋，再对根节点右旋
AVLNode* leftRightRotate(AVLNode* z) {
    z->left = leftRotate(z->left);
    return rightRotate(z);
}
```

### 7.4 RL旋转（先右后左）

```
// 先对右子树右旋，再对根节点左旋
AVLNode* rightLeftRotate(AVLNode* z) {
    z->right = rightRotate(z->right);
    return leftRotate(z);
}
```

## 8. 插入操作实现

```
AVLNode* insert(AVLNode* root, int key) {
    // 1. 标准BST插入
    if (root == nullptr) {
        return new AVLNode(key);
    }
    
    if (key < root->key) {
        root->left = insert(root->left, key);
    } else if (key > root->key) {
        root->right = insert(root->right, key);
    } else {
        // 重复键，不插入
        return root;
    }
    
    // 2. 更新高度
    updateHeight(root);
    
    // 3. 获取平衡因子
    int balance = getBalance(root);
    
    // 4. 处理四种不平衡情况
    
    // LL情况
    if (balance > 1 && key < root->left->key) {
        return rightRotate(root);
    }
    
    // RR情况
    if (balance < -1 && key > root->right->key) {
        return leftRotate(root);
    }
    
    // LR情况
    if (balance > 1 && key > root->left->key) {
        return leftRightRotate(root);
    }
    
    // RL情况
    if (balance < -1 && key < root->right->key) {
        return rightLeftRotate(root);
    }
    
    return root;
}
```

## 9. 删除操作实现

```
AVLNode* deleteNode(AVLNode* root, int key) {
    // 1. 标准BST删除
    if (root == nullptr) {
        return root;
    }
    
    if (key < root->key) {
        root->left = deleteNode(root->left, key);
    } else if (key > root->key) {
        root->right = deleteNode(root->right, key);
    } else {
        // 找到要删除的节点
        if (root->left == nullptr || root->right == nullptr) {
            AVLNode* temp = root->left ? root->left : root->right;
            
            if (temp == nullptr) {
                temp = root;
                root = nullptr;
            } else {
                *root = *temp;
            }
            delete temp;
        } else {
            // 有两个子节点，用后继节点替换
            AVLNode* temp = minValueNode(root->right);
            root->key = temp->key;
            root->right = deleteNode(root->right, temp->key);
        }
    }
    
    if (root == nullptr) {
        return root;
    }
    
    // 2. 更新高度
    updateHeight(root);
    
    // 3. 获取平衡因子
    int balance = getBalance(root);
    
    // 4. 处理四种不平衡情况
    
    // LL情况
    if (balance > 1 && getBalance(root->left) >= 0) {
        return rightRotate(root);
    }
    
    // LR情况
    if (balance > 1 && getBalance(root->left) < 0) {
        return leftRightRotate(root);
    }
    
    // RR情况
    if (balance < -1 && getBalance(root->right) <= 0) {
        return leftRotate(root);
    }
    
    // RL情况
    if (balance < -1 && getBalance(root->right) > 0) {
        return rightLeftRotate(root);
    }
    
    return root;
}

// 辅助函数：找到最小节点
AVLNode* minValueNode(AVLNode* node) {
    AVLNode* current = node;
    while (current->left != nullptr) {
        current = current->left;
    }
    return current;
}
```

## 10. 查找操作

```
AVLNode* search(AVLNode* root, int key) {
    if (root == nullptr || root->key == key) {
        return root;
    }
    
    if (key < root->key) {
        return search(root->left, key);
    } else {
        return search(root->right, key);
    }
}
```

## 11. Fibonacci-AVL树

​**定义**​：节点数最少的AVL树称为Fibonacci-AVL树

​**性质**​：

```
N(h) = N(h-1) + N(h-2) + 1
```

其中N(h)是高度为h的AVL树最少节点数

​**关系**​：

- N(h) ≈ Fib(h+3) - 1
    
- 这证明了AVL树的高度是O(log n)的
    

## 12. AVL树的优势

1. 严格平衡：保证最坏情况O(log n)
    
2. 查找效率高：适合频繁查找的场景
    
3. 理论完美：高度始终最优
    

## 13. AVL树的劣势

1. 插入/删除成本高：需要频繁旋转
    
2. 空间开销：需要存储平衡因子或高度
    
3. 实现复杂：相比普通BST更复杂
    

## 14. 与其他树的对比

|特性|AVL树|红黑树|伸展树|
|---|---|---|---|
|平衡性|严格|弱平衡|不保证|
|查找|最快|稍慢|期望快|
|插入删除|较慢|较快|期望快|
|使用场景|查找为主|插入删除为主|局部性强|

## 15. 相关主题

- 基于比较的算法（Comparison-Based Algorithm）
    
- 二叉搜索树（BST） - 基础结构
    
- 红黑树 - 另一种平衡方案
    
- 伸展树 - 自适应的平衡方案
    

## 16. 思考题

1. 为什么插入只需O(1)次旋转，删除却需要O(log n)次？
    
2. AVL树和红黑树如何选择？



## 数据结构-AVL树判断题

**日期**: 2025-10-21
**来源**: 数据结构
#review #错题本 #计算机科学/数据结构 #AVL树

---

### 一、原题复述

> [!question] 判断题
> 3、对规模为 $n$ 的 AVL 树做一次插入操作，最坏情况下可能引发 $\Omega(\log n)$ 次局部重构。

---

### 二、答案与解析

> [!summary] 答案
> **错误 (False)**

---
---

> [!done] 结论
> 该命题是 **错误** 的。
>
> * AVL 树的 **插入** 操作，在最坏情况下仅需要 **$O(1)$** 次局部重构（即一次旋转，可能是单旋或双旋）。
> * AVL 树的 **删除** 操作，在最坏情况下才需要 **$O(\log n)$** 次局部重构。
>
> 命题将删除操作的特性错误地安在了插入操作上。