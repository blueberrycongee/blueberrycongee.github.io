# 核心概念

- ​**要解决的问题**​：在一个带权有向图中，计算任意两点之间的最短路径（All-Pairs Shortest Paths, APSP）。

> 给你一张带权有向图，它一次性把**所有起点到所有终点**的最短路都算出来——也就是**全源最短路（APSP）**，不是只算“从一个点出发”的那一种。
    
- ​**边权**​：允许负权边，但如果存在可达的负权环，则相关点对的最短路径不存在（可记为 -∞）。
    
- ​**复杂度**​：时间复杂度 O(n³)，空间复杂度 O(n²)。适用于顶点数不太大或图较稠密、需要一次性获取所有点对最短路径的场景。
    

# 动态规划思路

令 $\text{dist}[i][j]$ 表示从 $i$ 到 $j$ 的当前最短距离。算法按顶点 $k=0..n-1$ 作为"允许的中间点"的上界逐步放宽：

$$
\text{dist}[i][j] = \min(\text{dist}[i][j], \text{dist}[i][k] + \text{dist}[k][j])
$$

把 $k$ 放在最外层循环，可以就地（in-place）用同一张 2D 表完成经典的三重循环。

# 初始化

- `dist[i][i] = 0`
    
- 若存在边 i→ji \to j 权重 ww，则 `dist[i][j] = w`；否则为 `INF`。
    
- 为了**恢复路径**，通常维护 `next[i][j]`：从 ii 出发走向 jj 的第一步去哪个顶点。
    

# 参考实现（cpp）
```cpp
// Floyd–Warshall (APSP) with path reconstruction and negative-cycle propagation
// 输入格式（0-based 顶点标号）：
// n m
// u v w    （m 行边，允许负权；多条平行边取最小权）
// q
// s t      （q 行查询，输出最短距离与路径）
//
// 输出：全对最短路矩阵 + 每个查询的路径结果
//
// 说明：若 s->t 不可达：INF；若受可达负环影响：-INF。

#include <bits/stdc++.h>
using namespace std;

struct APSP {
    static constexpr long long INF = (1LL << 60); // 足够大的无穷
    vector<vector<long long>> dist;   // 最短距离；若 neg_inf[i][j] 为真，则逻辑上视为 -INF
    vector<vector<int>> nxt;          // 路径恢复：从 i 到 j 的下一跳顶点；-1 表示无路径
    vector<vector<char>> neg_inf;     // 受可达负环影响（距离为 -INF）
};

APSP floyd_warshall(int n, const vector<tuple<int,int,long long>>& edges) {
    APSP res;
    res.dist.assign(n, vector<long long>(n, APSP::INF));
    res.nxt.assign(n, vector<int>(n, -1));
    res.neg_inf.assign(n, vector<char>(n, 0));

    // 初始化对角线
    for (int i = 0; i < n; ++i) {
        res.dist[i][i] = 0;
        res.nxt[i][i] = i;
    }
    // 初始化边；多条边取最小权
    for (auto [u, v, w] : edges) {
        if (u < 0 || v < 0 || u >= n || v >= n) continue;
        if (w < res.dist[u][v]) {
            res.dist[u][v] = w;
            res.nxt[u][v] = v;
        }
    }

    // 核心三重循环：k 在最外层
    for (int k = 0; k < n; ++k) {
        for (int i = 0; i < n; ++i) {
            if (res.dist[i][k] == APSP::INF) continue;
            long long dik = res.dist[i][k];
            for (int j = 0; j < n; ++j) {
                if (res.dist[k][j] == APSP::INF) continue;
                long long cand = dik + res.dist[k][j];
                if (cand < res.dist[i][j]) {
                    res.dist[i][j] = cand;
                    res.nxt[i][j] = res.nxt[i][k]; // 关键：从 i->k 的第一步
                }
            }
        }
    }

    // 负环检测：dist[x][x] < 0 说明 x 在可达负环上
    vector<char> neg(n, 0);
    for (int x = 0; x < n; ++x) {
        if (res.dist[x][x] < 0) neg[x] = 1;
    }

    // 将所有受负环影响的点对标注为 -INF（存在 i->k 和 k->j 的可达路径）
    for (int k = 0; k < n; ++k) if (neg[k]) {
        for (int i = 0; i < n; ++i) {
            if (res.dist[i][k] == APSP::INF) continue; // i 无法到达该负环
            for (int j = 0; j < n; ++j) {
                if (res.dist[k][j] == APSP::INF) continue; // 负环无法到达 j
                res.neg_inf[i][j] = 1;
                res.nxt[i][j] = -1; // 路径不定义
            }
        }
    }

    return res;
}

// 路径恢复：返回从 u 到 v 的顶点序列；若不可达或受负环影响，返回空
vector<int> get_path(const APSP& a, int u, int v) {
    int n = (int)a.dist.size();
    if (u < 0 || v < 0 || u >= n || v >= n) return {};
    if (a.neg_inf[u][v]) return {};                // 受负环影响，路径不定义
    if (a.nxt[u][v] == -1) return {};              // 不可达
    vector<int> path;
    path.push_back(u);
    // 防御：最多走 n 步应该到达 v（无负环情况下）
    for (int step = 0; step <= n; ++step) {
        if (u == v) break;
        u = a.nxt[u][v];
        if (u == -1) return {};
        path.push_back(u);
    }
    if (path.back() != v) return {}; // 未能到达
    return path;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    if (!(cin >> n >> m)) {
        cerr << "输入格式：n m，然后 m 行 u v w（0-based），再 q 和 q 行查询 s t\n";
        return 0;
    }
    vector<tuple<int,int,long long>> edges;
    edges.reserve(m);
    for (int i = 0; i < m; ++i) {
        int u, v; long long w;
        cin >> u >> v >> w;
        edges.emplace_back(u, v, w);
    }

    APSP ans = floyd_warshall(n, edges);

    // 打印全对最短路矩阵
    cout << "All-Pairs Shortest Path Matrix:\n";
    for (int i = 0; i < n; ++i) {
        for (int j = 0; j < n; ++j) {
            if (ans.neg_inf[i][j]) {
                cout << "-INF";
            } else if (ans.dist[i][j] == APSP::INF) {
                cout << "INF";
            } else {
                cout << ans.dist[i][j];
            }
            if (j + 1 < n) cout << ' ';
        }
        cout << '\n';
    }

    // 处理查询：输出距离与路径
    int q;
    if (cin >> q) {
        while (q--) {
            int s, t;
            cin >> s >> t;
            cout << "Query " << s << " -> " << t << " : ";
            if (s < 0 || t < 0 || s >= n || t >= n) {
                cout << "invalid\n";
                continue;
            }
            if (ans.neg_inf[s][t]) {
                cout << "distance = -INF (affected by a reachable negative cycle)\n";
                continue;
            }
            if (ans.dist[s][t] == APSP::INF || ans.nxt[s][t] == -1) {
                cout << "unreachable (INF)\n";
                continue;
            }
            cout << "distance = " << ans.dist[s][t] << ", path = ";
            auto path = get_path(ans, s, t);
            if (path.empty()) {
                cout << "(path undefined)\n";
           

```
# 与其他算法怎么选

- **需要所有点对**、图**稠密**或**有负边**：选 Floyd–Warshall。
    
- **只要单源最短路且无负边**、图**稀疏**：多次 Dijkstra 更合适（用二叉堆/斐波那契堆）。
    
- **稀疏 + 有负边**（但无负环），且也想算所有点对：**Johnson 算法**（一次 Bellman–Ford 重权，再跑 nn 次 Dijkstra）。
    

# 常见坑

- `k` 必须在最外层；否则就地更新会错。
    
- 多条平行边要取最小权。
    
- 检查负环：看 `dist[i][i] < 0`；若要“标注受负环影响的点对”，需再做一次可达性传播（上面代码已演示）。
    
- 不可达用 `INF` 表示；打印或比较前注意。


# Floyd-Warshall算法 - 全源最短路径

## 算法概述

Floyd-Warshall算法是一种用于求解**图中所有顶点对之间最短路径**的动态规划算法。

> [!note] 算法特点

> - **全源最短路径**：计算所有顶点到其他所有顶点的最短距离

> - **动态规划**：通过逐步增加允许经过的中间顶点来求解

> - **适用范围**：带权有向图或无向图（不允许负权环）

## 算法原理

### 基本思想

对于图中的任意两个顶点u和v，最短路径可能有三种情况：

1. **直接连接**：u和v之间存在直接边

2. **通过中间顶点**：u → x → v，其中x是中间顶点

3. **无通路**：u和v不连通

### 动态规划递推

设`d(k)[i][j]`表示**只允许经过前k个顶点作为中间顶点**时，从顶点i到顶点j的最短距离。

#### 递推公式

```

d(k)[i][j] = min(

    d(k-1)[i][j],           # 不经过第k个顶点

    d(k-1)[i][k] + d(k-1)[k][j]  # 经过第k个顶点

)

```

#### 边界条件

- `d(0)[i][j]`：不经过任何中间顶点的最短距离

  - 如果i = j，则为0

  - 如果(i,j)是边，则为边权

  - 否则为∞

## 算法实现

### 伪代码

```

FLOYD-WARSHALL(G):

    n = G.vertices.length

    // 初始化距离矩阵

    for i = 1 to n:

        for j = 1 to n:

            if i == j:

                d[i][j] = 0

            else if (i,j) ∈ G.edges:

                d[i][j] = weight(i,j)

            else:

                d[i][j] = ∞

    // 动态规划求解

    for k = 1 to n:

        for i = 1 to n:

            for j = 1 to n:

                d[i][j] = min(d[i][j], d[i][k] + d[k][j])

    return d

```

### Python实现

```python

def floyd_warshall(graph):

    n = len(graph.vertices)

    INF = float('inf')

    # 初始化距离矩阵

    dist = [[INF] * n for _ in range(n)]

    for i in range(n):

        dist[i][i] = 0

    for edge in graph.edges:

        u, v, w = edge

        dist[u][v] = w

    # Floyd-Warshall动态规划

    for k in range(n):

        for i in range(n):

            for j in range(n):

                if dist[i][k] + dist[k][j] < dist[i][j]:

                    dist[i][j] = dist[i][k] + dist[k][j]

    return dist

```

## 复杂度分析

### 时间复杂度

- **三层循环**：O(n³)

- **空间复杂度**：O(n²)

> [!warning] 性能考虑

> 当顶点数n较大时（n > 1000），O(n³)的时间复杂度可能成为瓶颈。

### 适用场景

- ✅ 顶点数量适中（n ≤ 500）

- ✅ 需要所有点对最短路径

- ✅ 图中存在负权边但无负权环

## 路径重建

上述算法只能计算最短距离，无法重建具体路径。需要额外的矩阵记录路径信息。

### 路径矩阵

```python

def floyd_warshall_with_path(graph):

    n = len(graph.vertices)

    INF = float('inf')

    # 初始化距离和路径矩阵

    dist = [[INF] * n for _ in range(n)]

    next_vertex = [[None] * n for _ in range(n)]

    # 初始化

    for i in range(n):

        dist[i][i] = 0

        for j in range(n):

            if i != j:

                next_vertex[i][j] = j

    # 设置直接边的信息

    for edge in graph.edges:

        u, v, w = edge

        dist[u][v] = w

    # Floyd-Warshall算法

    for k in range(n):

        for i in range(n):

            for j in range(n):

                if dist[i][k] + dist[k][j] < dist[i][j]:

                    dist[i][j] = dist[i][k] + dist[k][j]

                    next_vertex[i][j] = next_vertex[i][k]

    return dist, next_vertex

def reconstruct_path(next_vertex, start, end):

    path = []

    current = start

    while current != end:

        path.append(current)

        current = next_vertex[current][end]

        if current is None:  # 无路径

            return None

    path.append(end)

    return path

```

## 算法变种

### 1. 检测负权环

```python

def detect_negative_cycle(dist):

    n = len(dist)

    for i in range(n):

        if dist[i][i] < 0:

            return True, i  # 存在负权环，返回顶点i

    return False, None

```

### 2. 传递闭包

将权值设为1（布尔值），可计算图的传递闭包：

```python

def transitive_closure(graph):

    n = len(graph.vertices)

    reach = [[False] * n for _ in range(n)]

    # 初始化

    for i in range(n):

        reach[i][i] = True

        for j in range(n):

            if (i, j) in graph.edges:

                reach[i][j] = True

    # Floyd-Warshall

    for k in range(n):

        for i in range(n):

            for j in range(n):

                reach[i][j] = reach[i][j] or (reach[i][k] and reach[k][j])

    return reach

```

## 与其他算法的比较

| 算法 | 适用场景 | 时间复杂度 | 空间复杂度 | 特点 |

|------|----------|------------|------------|------|

| **Dijkstra** | 单源最短路径 | O(E log V) | O(V) | 不支持负权边 |

| **Bellman-Ford** | 单源最短路径 | O(VE) | O(V) | 支持负权边，可检测负权环 |

| **Floyd-Warshall** | 全源最短路径 | O(V³) | O(V²) | 支持负权边，代码简洁 |

## 应用场景

1. **网络路由**：计算网络中所有节点对之间的最短路径

2. **交通规划**：城市间最短路径规划

3. **社交网络**：计算用户间的最短关系链

4. **游戏开发**：寻路算法（如棋类游戏的最佳走法）

5. **电路设计**：PCB布线优化

## 总结

Floyd-Warshall算法通过动态规划的思想巧妙地解决了全源最短路径问题。虽然时间复杂度较高，但其实现简单、逻辑清晰，特别适合顶点数量适中的场景。算法的核心在于**逐步放宽约束条件**（允许经过更多中间顶点），这种思想在许多动态规划问题中都有应用。