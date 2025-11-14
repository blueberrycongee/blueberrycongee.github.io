# Kruskal算法 - 最小生成树

  

## 算法概述

  

Kruskal算法是一种用于求解**最小生成树**的贪心算法，与Prim算法并列为两种主要的最小生成树算法。

  

> [!note] 算法特点

> - **贪心策略**：按照边的权值从小到大依次尝试添加

> - **判断条件**：只有当添加边不产生环时才将其加入生成树

> - **适用场景**：特别适合**稀疏图**（边数较少）

  

## 算法原理

  

### 核心思想

1. 将图中的所有边按照权值从小到大排序

2. 依次遍历排序后的边

3. 对于每条边，如果加入该边不会形成环，则将其加入最小生成树

4. 重复直到树中有n-1条边（n为顶点数）

  

### 与Prim算法的区别

| 特征        | Prim算法     | Kruskal算法  |
| --------- | ---------- | ---------- |
| **策略**    | 从顶点出发，逐步扩展 | 从边出发，逐步构建  |
| **数据结构**  | 需要优先队列     | 需要并查集      |
| **适用场景**  | 稠密图        | 稀疏图        |
| **时间复杂度** | O(E log V) | O(E log E) |

  

## 算法正确性

  

### 贪心选择性质

- **最短边原则**：图中权值最小的边必然在某个最小生成树中

- **切割性质**：在图的任意切割中，权值最小的跨越边必然属于某个最小生成树

  

### 算法演示

以给定图为例：

1. **初始状态**：所有顶点都是独立的集合

2. **添加最短边**：权值为1的边（无环，加入）

3. **继续添加**：权值为2的两条边（均无环，加入）

4. **跳过形成环的边**：权值为5的边会形成环，跳过

5. **继续构建**：添加权值为6的边

6. **完成生成树**：直到包含所有n-1条边

  

## 算法实现

  

### 基本数据结构定义

```cpp

#include <iostream>

#include <vector>

#include <algorithm>

using namespace std;

  

/**

 * @brief 边的结构体

 * 包含两个顶点u、v以及边的权值weight

 */

struct Edge {

    int u, v;      // 边的两个端点

    int weight;    // 边的权值

    // 构造函数

    Edge(int u, int v, int w) : u(u), v(v), weight(w) {}

    // 用于sort()函数排序的运算符重载

    // 按权值从小到大排序

    bool operator<(const Edge& other) const {

        return weight < other.weight;

    }

};

  

/**

 * @brief 图的结构体

 * 存储顶点数量和所有边

 */

struct Graph {

    int vertices;          // 顶点数量

    vector<Edge> edges;    // 所有边的集合

    // 构造函数

    Graph(int n) : vertices(n) {}

    // 添加边到图中

    void addEdge(int u, int v, int weight) {

        edges.emplace_back(u, v, weight);

    }

};

```

  

### 并查集实现（用于环检测）

```cpp

/**

 * @brief 并查集类（Disjoint Set Union）

 * 用于检测添加边是否会形成环

 */

class UnionFind {

private:

    vector<int> parent;    // parent[i]表示i的父节点

    vector<int> rank;      // rank[i]表示以i为根的树的秩（高度）

public:

    /**

     * @brief 构造函数，初始化并查集

     * @param n 元素数量（顶点数）

     */

    UnionFind(int n) {

        parent.resize(n);

        rank.resize(n, 0);

        // 初始化：每个元素都是自己的父节点，秩为0

        for (int i = 0; i < n; i++) {

            parent[i] = i;

            rank[i] = 0;

        }

    }

    /**

     * @brief 查找元素x所在集合的根节点（带路径压缩）

     * @param x 要查找的元素

     * @return 根节点的索引

     */

    int find(int x) {

        // 如果x不是根节点，则递归查找其父节点，并进行路径压缩

        if (parent[x] != x) {

            parent[x] = find(parent[x]);  // 路径压缩：将x直接指向根节点

        }

        return parent[x];

    }

    /**

     * @brief 合并两个元素所在的集合（按秩合并）

     * @param x 第一个元素

     * @param y 第二个元素

     */

    void unionSets(int x, int y) {

        int rootX = find(x);  // 找到x所在集合的根节点

        int rootY = find(y);  // 找到y所在集合的根节点

        // 如果两个元素已经在同一个集合中，则不需要合并

        if (rootX == rootY) {

            return;

        }

        // 按秩合并：将秩较小的树连接到秩较大的树上

        if (rank[rootX] < rank[rootY]) {

            // 如果rootX的秩小于rootY的秩，则将rootX连接到rootY

            parent[rootX] = rootY;

        } else if (rank[rootX] > rank[rootY]) {

            // 如果rootX的秩大于rootY的秩，则将rootY连接到rootX

            parent[rootY] = rootX;

        } else {

            // 如果两个树的秩相等，则任选一个作为父节点，并增加其秩

            parent[rootY] = rootX;

            rank[rootX]++;  // 增加rootX的秩

        }

    }

    /**

     * @brief 检查两个元素是否在同一个集合中

     * @param x 第一个元素

     * @param y 第二个元素

     * @return true如果在同一个集合中，false否则

     */

    bool isConnected(int x, int y) {

        return find(x) == find(y);

    }

};

```

  

### Kruskal算法核心实现

```cpp

/**

 * @brief Kruskal算法求解最小生成树

 * @param graph 输入的图

 * @return 最小生成树的边集合

 */

vector<Edge> kruskalMST(Graph& graph) {

    int n = graph.vertices;

    vector<Edge> result;  // 存储最小生成树的边

    // 1. 对所有边按权值从小到大排序

    sort(graph.edges.begin(), graph.edges.end());

    // 2. 初始化并查集，每个顶点都是独立的集合

    UnionFind uf(n);

    // 3. 依次遍历排序后的边

    for (const Edge& edge : graph.edges) {

        // 检查添加这条边是否会形成环

        if (!uf.isConnected(edge.u, edge.v)) {

            // 如果不会形成环，则将这条边加入最小生成树

            uf.unionSets(edge.u, edge.v);

            result.push_back(edge);

            // 如果已经添加了n-1条边，则最小生成树构建完成

            if (result.size() == n - 1) {

                break;

            }

        }

    }

    return result;

}

  

/**

 * @brief 打印最小生成树的信息

 * @param mst 最小生成树的边集合

 */

void printMST(const vector<Edge>& mst) {

    int totalWeight = 0;

    cout << "最小生成树的边：" << endl;

    for (const Edge& edge : mst) {

        cout << edge.u << " --(" << edge.weight << ")-- " << edge.v << endl;

        totalWeight += edge.weight;

    }

    cout << "最小生成树的总权值：" << totalWeight << endl;

}

```

  

### 完整示例程序

```cpp

int main() {

    // 创建一个包含7个顶点的图

    Graph graph(7);

    // 添加图的边（顶点编号从0开始）

    graph.addEdge(0, 1, 7);

    graph.addEdge(0, 3, 5);

    graph.addEdge(1, 2, 8);

    graph.addEdge(1, 4, 7);

    graph.addEdge(2, 4, 5);

    graph.addEdge(2, 5, 6);

    graph.addEdge(3, 4, 15);

    graph.addEdge(3, 5, 4);

    graph.addEdge(4, 5, 8);

    graph.addEdge(4, 6, 9);

    graph.addEdge(5, 6, 11);

    cout << "原图的边：" << endl;

    for (const Edge& edge : graph.edges) {

        cout << edge.u << " --(" << edge.weight << ")-- " << edge.v << endl;

    }

    cout << endl;

    // 使用Kruskal算法求解最小生成树

    vector<Edge> mst = kruskalMST(graph);

    // 打印结果

    printMST(mst);

    return 0;

}

```

  

## 时间复杂度分析

  

### 详细分析

- **排序阶段**：O(E log E)，其中E为边数

- **并查集操作**：O(E α(V))，其中α为反阿克曼函数，V为顶点数

- **总体复杂度**：O(E log E)

  

> [!tip] 复杂度优化

> 对于连通无向图（E ≥ n-1），Kruskal算法的时间复杂度为O(E log E)，可以看出它**仅与边数有关，与顶点数无关**，因此特别适合稀疏图。

  

## 算法特点

  

### 优势

- ✅ 思路简单，易于理解和实现

- ✅ 对于稀疏图效率很高

- ✅ 能够处理不连通的图（生成森林）

  

### 局限性

- ❌ 需要对所有边进行排序

- ❌ 不适合稠密图

- ❌ 可能产生不同的最小生成树（最小生成树不唯一）

  

## 应用场景

  

1. **网络设计**：设计成本最低的通信网络

2. **电路设计**：连接所有节点的最小成本布线

3. **交通规划**：建设成本最低的交通网络

4. **聚类分析**：基于距离的层次聚类

  

## 总结

  

Kruskal算法通过贪心策略和环检测巧妙地构建最小生成树，其核心在于**并查集**数据结构的运用。算法的时间复杂度与边数成正比，这使得它在处理稀疏图时具有显著优势。