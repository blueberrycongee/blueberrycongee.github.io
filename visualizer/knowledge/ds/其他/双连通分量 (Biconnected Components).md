# 双连通分量 (Biconnected Components)

## 基本概念
### 连通分量（Connected Components）

​**连通分量**是无向图中的**极大连通子图**
### 双连通图

- ​**定义**​：一个无向连通图，如果删除任意一个顶点后，图仍然保持连通，则该图是**双连通的**​
    
- ​**关键特性**​：图中任意两个顶点之间都存在**至少两条顶点不相交的路径**

### 关节点 (Articulation Point)

- **定义**: 在无向图中，如果删除某个顶点后，原图的连通分量数量增加，则该顶点称为关节点

- **性质**:

- 叶节点不可能是关节点

- 根节点只有当其子树数≥2时才是关节点

- 内部节点v是关节点当且仅当存在某个孩子u，使得以u为根的子树无法通过后向边连接到v的任何真祖先

### 双连通图

- **定义**: 不含关节点的连通图称为双连通图

- **双连通分量**: 极大的双连通子图称为双连通分量(BCC)

## 算法思想

### 基于DFS的BCC算法

#### 核心思路

1. 构造DFS树，记录每个顶点的发现时间(disc_time)

2. 维护每个顶点能到达的最高祖先(highest_ancestor)

3. 通过后向边更新祖先信息

4. 根据祖先信息判断关节点并分离BCC

#### 关键数据结构

- `disc[v]`: 顶点v的发现时间

- `low[v]`: 顶点v能通过后向边到达的最高祖先的发现时间

- 栈: 存储当前BCC的顶点

#### 算法步骤

```python

DFS(v, parent):

disc[v] = low[v] = ++time

push v to stack

for each neighbor u of v:

if disc[u] == 0:  # 树边

DFS(u, v)

low[v] = min(low[v], low[u])

# 判断关节点条件

if low[u] >= disc[v]:

if parent != null or children_count > 1:

v is articulation point

pop vertices until u from stack to form a BCC

elif u != parent and disc[u] < disc[v]:  # 后向边

low[v] = min(low[v], disc[u])

push edge (v,u) to stack

```

## 复杂度分析

- **时间复杂度**: O(V + E)，与普通DFS相同

- **空间复杂度**: O(V + E)，需要额外的栈空间

## 重要性质

1. **关节点判定**:

- 根节点: 子树数≥2时才是关节点

- 非根节点: 存在子树无法回到祖先时才是关节点

2. **BCC特性**:

- BCC之间通过关节点连接

- 同一个BCC内的顶点low值不一定相同

## 算法实现要点

1. **初始化**: disc[v] = low[v] = v的发现时间

2. **后向边处理**: 更新low值

3. **回溯处理**: 根据low值判断关节点并分离BCC

4. **栈操作**: 维护当前BCC的顶点集合

> [!NOTE]

> 该算法适用于无向图。对于有向图的强连通分量，需要不同的处理方式。

## 应用场景

- 网络拓扑分析

- 关键节点识别

- 网络可靠性评估

- 电路板设计中的关键连接点识别