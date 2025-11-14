## 基本概念

  

并查集是一种用于处理**不相交集合**的数据结构，主要用于解决连通性问题。

**不相交集合**：简单来说就是一个人只能属于一个组织

  **快速判断两个东西是否属于同一团体**

> [!note] 应用场景

> - Kruskal算法中的环检测

> - 网络连通性判断

> - 图像处理中的连通区域标记

> - 社交网络中的朋友圈问题

  

## 核心接口

  

### 基本操作

1. **Find(x)**：查找元素x所属集合的代表（根节点）

2. **Union(x, y)**：合并元素x和y所在的两个集合

  
- **返回值是集合中某个元素的编号**​（不是新创建的ID）
    
- ​**同一个集合中所有元素的`find()`都返回相同的值**​
    
- ​**具体返回哪个数字取决于合并历史和路径压缩**​
    

所以对于集合{1,2,3}，`find(3)`可能返回1、2或3中的任意一个，但保证：

- `find(1) == find(2) == find(3)`
    

​核心思想：不管返回哪个数字，只要返回值相同，就说明在同一个集合中！​


### 扩展操作

3. **Connected(x, y)**：判断两个元素是否在同一集合中

  

## 数据结构实现

  

### 1. Quick Find（快速查找）

  

#### 实现原理

- 使用数组`parent`存储每个元素的集合代表

- `Find(x)`直接返回`parent[x]`，时间复杂度O(1)

- `Union(x, y)`需要遍历整个数组更新代表，时间复杂度O(n)

  

#### 代码实现

```python

class QuickFind:

    def __init__(self, n):

        self.parent = list(range(n))

    def find(self, x):

        return self.parent[x]

    def union(self, x, y):

        x_root = self.find(x)

        y_root = self.find(y)

        if x_root == y_root:

            return

        # 将x_root集合的所有元素更新为y_root

        for i in range(len(self.parent)):

            if self.parent[i] == x_root:

                self.parent[i] = y_root

```

  

#### 复杂度分析

- **Find操作**：O(1)

- **Union操作**：O(n)

- **空间复杂度**：O(n)

  

> [!warning] 性能问题

> Quick Find的Union操作需要遍历整个数组，在处理大量合并操作时效率较低。

  

### 2. Quick Union（快速合并）

  

#### 实现原理

- 使用树形结构表示集合

- 每个节点指向其父节点，根节点的父节点指向自己

- `Find(x)`通过递归找到根节点

- `Union(x, y)`将一个树的根节点指向另一个树的根节点

  

#### 代码实现

```python

class QuickUnion:

    def __init__(self, n):

        self.parent = list(range(n))

    def find(self, x):

        # 路径压缩前

        while self.parent[x] != x:

            x = self.parent[x]

        return x

    def union(self, x, y):

        x_root = self.find(x)

        y_root = self.find(y)

        if x_root == y_root:

            return

        # 将x_root的父节点指向y_root

        self.parent[x_root] = y_root

```

  

#### 复杂度分析

- **Find操作**：O(h)，其中h为树的高度

- **Union操作**：O(h)

- **最坏情况**：O(n)（树退化为链表）

  

> [!tip] 优化方向

> Quick Union的Find操作可能较慢，需要通过路径压缩和按秩合并进行优化。

  

## 优化策略

  

### 1. 路径压缩（Path Compression）

  

#### 优化原理

在`Find`操作过程中，将路径上的所有节点直接指向根节点，从而压缩路径长度。

  

#### 实现代码

```python

def find(self, x):

    if self.parent[x] != x:

        self.parent[x] = self.find(self.parent[x])  # 递归路径压缩

    return self.parent[x]

```

  

#### 压缩效果

- 第一次Find：需要遍历完整路径

- 后续Find：直接找到根节点

- **摊还分析**：几乎接近O(1)

  

> [!example] 路径压缩示例

> 假设Find(4)的路径为：4 → 7 → 1 → 6（根节点）

> 压缩后：4 → 6, 7 → 6, 1 → 6

  

### 2. 按秩合并（Union by Rank）

  

#### 优化原理

合并时将较短的树（秩较小）连接到较长的树（秩较大）下面，保持树的平衡。

  

#### 秩的定义

- 根节点的秩等于其子树的高度

- 合并时秩较小的树指向秩较大的树

  

#### 实现代码

```python

class UnionFind:

    def __init__(self, n):

        self.parent = list(range(n))

        self.rank = [0] * n  # 记录每个节点的秩

    def find(self, x):

        if self.parent[x] != x:

            self.parent[x] = self.find(self.parent[x])

        return self.parent[x]

    def union(self, x, y):

        x_root = self.find(x)

        y_root = self.find(y)

        if x_root == y_root:

            return

        # 按秩合并

        if self.rank[x_root] < self.rank[y_root]:

            self.parent[x_root] = y_root

        elif self.rank[x_root] > self.rank[y_root]:

            self.parent[y_root] = x_root

        else:

            self.parent[y_root] = x_root

            self.rank[x_root] += 1

```

  

## 完整优化版本

  

### 复杂度分析

经过路径压缩和按秩合并优化后：

  

> [!success] 性能保证

> - **Find操作**：O(α(n))，其中α为反阿克曼函数

> - **Union操作**：O(α(n))

> - **空间复杂度**：O(n)

  

反阿克曼函数α(n)增长极慢，对于实际应用中n ≤ 10^80，α(n) ≤ 4。

  

## 应用实例

  

### Kruskal算法中的应用

```python

def kruskal(graph):

    # 1. 初始化并查集

    uf = UnionFind(len(graph.vertices))

    # 2. 按权值排序边

    edges = sorted(graph.edges, key=lambda e: e.weight)

    mst = []

    for edge in edges:

        # 3. 检查是否形成环

        if not uf.connected(edge.u, edge.v):

            uf.union(edge.u, edge.v)

            mst.append(edge)

    return mst

```

  

## 总结

  

并查集是处理连通性问题的利器，通过合理的优化策略（路径压缩+按秩合并），可以接近常数时间完成基本操作。其在Kruskal算法中的应用完美展示了数据结构与算法的协同设计思想。