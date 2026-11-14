---
title: Go 内存管理深度解析
date: 2025-12-28 20:47:00
categories:
  - 由浅到深学习GO
tags:
  - Go
  - 内存管理
  - GC
---

# 📚 第2课：Go内存管理

## 1. 堆和栈

### 1.1 堆（Heap）

#### 定义
- **堆是用于存储动态分配的内存区域**
- 所有goroutine共享堆内存
- 由GC自动管理

#### 特点
1. **动态分配**
   - 使用`make()`、`new()`分配
   - 大小不固定
   - 可以动态增长

2. **共享访问**
   - 所有goroutine共享堆内存
   - 需要同步机制保护

3. **GC管理**
   - 堆内存由GC自动回收
   - 不需要手动释放

#### 示例代码
```go
// 分配在堆上
p1 := make([]int, 100)  // 切片
p2 := new(int)           // 指针
p3 := &struct{}{         // 结构体指针
    x: 1,
}
```

---

### 1.2 栈（Stack）

#### 定义
- **栈是用于存储函数调用和局部变量的内存区域**
- 每个goroutine有自己的栈
- 自动管理

#### 特点
1. **自动管理**
   - 函数调用时自动分配
   - 函数返回时自动释放
   - 不需要手动管理

2. **私有访问**
   - 每个goroutine有自己的栈
   - 不需要同步机制

3. **大小有限**
   - 初始大小2KB
   - 可以动态增长
   - 最大1GB

#### 示例代码
```go
func foo() {
    // 分配在栈上
    x := 1           // 整数
    arr := [10]int{} // 数组
    s := "hello"     // 字符串
}
```

---

### 1.3 堆和栈的区别

| 特性 | 堆 | 栈 |
|------|-----|-----|
| 分配方式 | 动态分配 | 自动分配 |
| 分配速度 | 慢 | 快 |
| 访问速度 | 慢 | 快 |
| 大小限制 | 受系统内存限制 | 受goroutine栈大小限制 |
| 管理方式 | GC自动回收 | 函数返回时自动释放 |
| 共享性 | 所有goroutine共享 | 每个goroutine私有 |

---

## 2. 内存分配的层次结构

### 2.1 四层架构

```
┌─────────────────────────────────────┐
│          操作系统内存               │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         mheap (全局堆)               │
│  - 管理所有span                      │
│  - 管理arena区域                     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      mcentral (全局缓存)             │
│  - 管理空闲span                      │
│  - 按span大小分类                    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      mcache (本地缓存)               │
│  - 每个P一个mcache                   │
│  - 管理本地span                      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Goroutine分配内存               │
│  - 从mcache获取内存                  │
│  - 快速分配                          │
└─────────────────────────────────────┘
```

### 2.2 各层职责

| 层次 | 名称 | 职责 |
|------|------|------|
| 第1层 | 操作系统内存 | 提供物理内存 |
| 第2层 | mheap | 管理所有内存和span |
| 第3层 | mcentral | 管理空闲span |
| 第4层 | mcache | 本地缓存，快速分配 |

---

## 3. Span（内存块）

### 3.1 定义
- **Span是Go内存管理的基本单位，是一块连续的内存**
- span的大小是页的倍数
- 页大小通常是8KB

### 3.2 特点
1. **固定大小**
   - span的大小是页的倍数
   - 页大小通常是8KB
   - span可以是1页、2页、4页等

2. **存储对象**
   - 一个span存储多个相同大小的对象
   - 对象大小固定
   - 对象按span大小分类

3. **状态管理**
   - span有三种状态：空闲、使用中、清扫中
   - GC时标记span的状态
   - 清扫时回收空闲的span

### 3.3 span大小分类

| class | size (bytes) | objects | span size |
|-------|--------------|---------|-----------|
| 1 | 8 | 1024 | 8KB |
| 2 | 16 | 512 | 8KB |
| 3 | 32 | 256 | 8KB |
| 4 | 48 | 170 | 8KB |
| 5 | 64 | 128 | 8KB |
| 6 | 80 | 102 | 8KB |
| ... | ... | ... | ... |
| 67 | 32768 | 1 | 32KB |

### 3.4 span状态

```go
const (
    mSpanDead   = iota // span未使用
    mSpanInUse         // span使用中
    mSpanManual        // span手动管理
)
```

---

## 4. mcache（本地缓存）

### 4.1 定义
- **mcache是每个P的本地内存缓存**
- 每个P有自己的mcache
- 不需要锁保护

### 4.2 特点
1. **每个P一个mcache**
   - 每个P有自己的mcache
   - 不需要锁保护
   - 分配速度快

2. **管理span**
   - mcache管理多个span
   - 按对象大小分类
   - 每个类别有一个span

3. **快速分配**
   - goroutine从mcache分配内存
   - 不需要加锁
   - 速度非常快

### 4.3 mcache结构

```go
type mcache struct {
    // 每个大小类别一个span
    alloc [numSpanClasses]*mspan
    
    // tiny分配器（用于小对象）
    tiny       uintptr
    tinyoffset uintptr
    
    // 其他字段...
}
```

### 4.4 分配流程

```
1. Goroutine需要分配内存
   ↓
2. Goroutine从P的mcache获取span
   ↓
3. 从span中分配对象
   ↓
4. 如果span满了，从mcentral获取新span
```

---

## 5. mcentral（全局缓存）

### 5.1 定义
- **mcentral是全局的内存缓存，管理空闲的span**
- 所有P共享mcentral
- 需要锁保护

### 5.2 特点
1. **全局共享**
   - 所有P共享mcentral
   - 需要锁保护
   - 管理空闲span

2. **按大小分类**
   - 每个大小类别一个mcentral
   - 管理该大小的所有空闲span
   - 分为两个链表：空闲链表和使用链表

3. **平衡mcache**
   - mcache从mcentral获取span
   - mcache将空闲span还给mcentral
   - 平衡各个mcache的内存使用

### 5.3 mcentral结构

```go
type mcentral struct {
    spanclass spanClass      // span大小类别
    partial  mSpanList       // 部分使用的span链表
    empty    mSpanList       // 完全使用的span链表
    lock     mutex           // 保护mcentral的锁
}
```

### 5.4 分配流程

```
1. mcache需要新span
   ↓
2. mcache从mcentral获取span
   ↓
3. mcentral从partial链表获取span
   ↓
4. 如果partial链表为空，从mheap分配新span
```

---

## 6. mheap（全局堆）

### 6.1 定义
- **mheap是全局的堆，管理所有的内存**
- 整个程序只有一个mheap
- 管理所有span

### 6.2 特点
1. **全局唯一**
   - 整个程序只有一个mheap
   - 管理所有内存
   - 管理所有span

2. **管理arena**
   - arena是连续的内存区域
   - arena大小通常是512GB
   - 分为多个页

3. **分配span**
   - mheap分配span给mcentral
   - 从操作系统获取内存
   - 管理span的生命周期

### 6.3 mheap结构

```go
type mheap struct {
    // arena区域
    arena_start uintptr
    arena_used  uintptr
    arena_end   uintptr
    
    // 管理所有span
    spans []*mspan
    
    // 按大小分类的mcentral
    central [numSpanClasses]struct {
        mcentral mcentral
    }
    
    // 空闲span链表
    free     [_MaxMHeapList]mSpanList
    freelarge mTreap
    
    // 其他字段...
}
```

### 6.4 分配流程

```
1. mcentral需要新span
   ↓
2. mcentral从mheap获取span
   ↓
3. mheap从arena分配内存
   ↓
4. 如果arena不足，从操作系统获取内存
```

---

## 7. 内存分配流程

### 7.1 完整分配流程

```
1. Goroutine需要分配内存
   ↓
2. 计算对象大小，确定span类别
   ↓
3. 从当前P的mcache获取span
   ├─ 如果mcache有可用span
   │  └─ 从span中分配对象
   └─ 如果mcache没有可用span
      ↓
      4. 从mcentral获取span
      ├─ 如果mcentral有可用span
      │  └─ 将span给mcache
      └─ 如果mcentral没有可用span
         ↓
         5. 从mheap分配新span
         ├─ 从arena分配内存
         └─ 创建新span
         ↓
         6. 将span给mcentral
         ↓
         7. mcentral将span给mcache
         ↓
         8. 从span中分配对象
```

### 7.2 快速路径

```go
// 快速分配：从mcache直接分配
func mallocgc(size uintptr, typ *type, needzero bool) unsafe.Pointer {
    // 1. 计算span类别
    sizeclass := size_to_class8(size)
    
    // 2. 从mcache获取span
    c := gomcache()
    span := c.alloc[sizeclass]
    
    // 3. 从span中分配对象
    return span.freealloc(size)
}
```

### 7.3 慢速路径

```go
// 慢速分配：从mcentral或mheap获取span
func mallocgc_slow(size uintptr) unsafe.Pointer {
    // 1. 从mcentral获取span
    span = mcentral_alloc(size)
    
    // 2. 如果mcentral没有，从mheap获取
    if span == nil {
        span = mheap_alloc(size)
    }
    
    // 3. 将span给mcache
    c.alloc[sizeclass] = span
    
    // 4. 从span中分配对象
    return span.freealloc(size)
}
```

---

## 8. 内存回收流程

### 8.1 GC清扫阶段回收内存

```
1. 标记阶段完成
   ↓
2. 进入清扫阶段
   ↓
3. 遍历所有span
   ├─ 如果span中有不可达对象
   │  └─ 标记span为需要清扫
   └─ 如果span中所有对象都可达
      └─ 标记span为不需要清扫
   ↓
4. 并发清扫span
   ├─ 回收不可达对象
   ├─ 将空闲对象放入空闲链表
   └─ 如果span完全空闲，还给mcentral
   ↓
5. mcentral管理空闲span
   ├─ 如果有空闲span，给mcache使用
   └─ 如果空闲span太多，还给mheap
   ↓
6. mheap管理空闲span
   ├─ 如果有空闲span，给mcentral使用
   └─ 如果空闲span太多，还给操作系统
```

### 8.2 span回收

```go
// 清扫span
func sweepone() uintptr {
    // 1. 获取需要清扫的span
    span := get_sweep_span()
    
    // 2. 遍历span中的对象
    for i := 0; i < span.nelems; i++ {
        obj := span.base() + i*span.elemsize
        
        // 3. 检查对象是否可达
        if !is_marked(obj) {
            // 4. 回收对象
            free_object(obj)
        }
    }
    
    // 5. 如果span完全空闲，还给mcentral
    if span.is_empty() {
        mcentral_free(span)
    }
}
```

---

## 9. 关键要点

### 9.1 堆和栈的区别
- **堆**：动态分配、GC管理、共享访问
- **栈**：自动分配、自动释放、私有访问

### 9.2 内存分配的层次
- **mcache（本地缓存）→ mcentral（全局缓存）→ mheap（全局堆）**
- 每一层都有自己的职责
- 分层设计提高性能

### 9.3 Span是基本单位
- **span是连续的内存块**
- 按对象大小分类
- 是GC的基本单位

### 9.4 分配流程
- **从mcache快速分配**
- mcache不足时从mcentral获取
- mcentral不足时从mheap分配

### 9.5 回收流程
- **GC标记可达对象**
- 清扫阶段回收不可达对象
- 空闲span向上层归还

### 9.6 性能优化
- **mcache无锁分配**：提高分配速度
- **分层设计**：减少锁竞争
- **span分类**：提高内存利用率
- **并发清扫**：减少STW时间

---

## 10. 代码示例

### 10.1 观察内存分配

```go
package main

import (
    "fmt"
    "runtime"
)

func main() {
    var m1, m2 runtime.MemStats
    
    // 第一次读取内存统计
    runtime.ReadMemStats(&m1)
    fmt.Printf("HeapAlloc: %d MB\n", m1.HeapAlloc/1024/1024)
    
    // 分配大量内存
    data := make([]byte, 100*1024*1024) // 100MB
    
    // 第二次读取内存统计
    runtime.ReadMemStats(&m2)
    fmt.Printf("HeapAlloc: %d MB\n", m2.HeapAlloc/1024/1024)
    fmt.Printf("Allocated: %d MB\n", (m2.HeapAlloc-m1.HeapAlloc)/1024/1024)
    
    // 释放内存
    data = nil
    runtime.GC()
    
    // 第三次读取内存统计
    var m3 runtime.MemStats
    runtime.ReadMemStats(&m3)
    fmt.Printf("HeapAlloc: %d MB\n", m3.HeapAlloc/1024/1024)
}
```

### 10.2 观察GC触发

```go
package main

import (
    "fmt"
    "runtime"
    "time"
)

func main() {
    // 设置GC触发条件
    runtime.SetGCPercent(100)
    
    var m runtime.MemStats
    
    for i := 0; i < 10; i++ {
        // 分配内存
        _ = make([]byte, 10*1024*1024) // 10MB
        
        // 读取内存统计
        runtime.ReadMemStats(&m)
        fmt.Printf("GC cycles: %d, Heap: %d MB\n", 
            m.NumGC, m.HeapAlloc/1024/1024)
        
        time.Sleep(100 * time.Millisecond)
    }
}
```

### 10.3 观察内存统计

```go
package main

import (
    "fmt"
    "runtime"
)

func main() {
    var m runtime.MemStats
    
    runtime.ReadMemStats(&m)
    
    fmt.Printf("Alloc: %d MB\n", m.Alloc/1024/1024)
    fmt.Printf("TotalAlloc: %d MB\n", m.TotalAlloc/1024/1024)
    fmt.Printf("Sys: %d MB\n", m.Sys/1024/1024)
    fmt.Printf("Lookups: %d\n", m.Lookups)
    fmt.Printf("Mallocs: %d\n", m.Mallocs)
    fmt.Printf("Frees: %d\n", m.Frees)
    fmt.Printf("HeapAlloc: %d MB\n", m.HeapAlloc/1024/1024)
    fmt.Printf("HeapSys: %d MB\n", m.HeapSys/1024/1024)
    fmt.Printf("HeapIdle: %d MB\n", m.HeapIdle/1024/1024)
    fmt.Printf("HeapInuse: %d MB\n", m.HeapInuse/1024/1024)
    fmt.Printf("HeapReleased: %d MB\n", m.HeapReleased/1024/1024)
    fmt.Printf("HeapObjects: %d\n", m.HeapObjects)
    fmt.Printf("StackInuse: %d MB\n", m.StackInuse/1024/1024)
    fmt.Printf("StackSys: %d MB\n", m.StackSys/1024/1024)
    fmt.Printf("MSpanInuse: %d MB\n", m.MSpanInuse/1024/1024)
    fmt.Printf("MSpanSys: %d MB\n", m.MSpanSys/1024/1024)
    fmt.Printf("MCacheInuse: %d MB\n", m.MCacheInuse/1024/1024)
    fmt.Printf("MCacheSys: %d MB\n", m.MCacheSys/1024/1024)
    fmt.Printf("BuckHashSys: %d MB\n", m.BuckHashSys/1024/1024)
    fmt.Printf("GCSys: %d MB\n", m.GCSys/1024/1024)
    fmt.Printf("OtherSys: %d MB\n", m.OtherSys/1024/1024)
    fmt.Printf("NextGC: %d MB\n", m.NextGC/1024/1024)
    fmt.Printf("LastGC: %d\n", m.LastGC)
    fmt.Printf("PauseTotalNs: %d\n", m.PauseTotalNs)
    fmt.Printf("NumGC: %d\n", m.NumGC)
    fmt.Printf("NumForcedGC: %d\n", m.NumForcedGC)
    fmt.Printf("GCCPUFraction: %f\n", m.GCCPUFraction)
    fmt.Printf("EnableGC: %v\n", m.EnableGC)
    fmt.Printf("DebugGC: %v\n", m.DebugGC)
}
```

---

## 11. 常见问题

### 11.1 为什么需要分层设计？
- **提高性能**：mcache无锁分配，速度快
- **减少竞争**：mcentral和mheap使用锁，但访问频率低
- **平衡负载**：mcache分散到各个P，减少锁竞争

### 11.2 span为什么按大小分类？
- **提高内存利用率**：相同大小的对象放在同一个span
- **减少碎片**：避免大小不一的对象混在一起
- **快速分配**：根据对象大小快速找到对应的span

### 11.3 什么时候从操作系统获取内存？
- **mheap的arena不足时**
- **需要分配大对象时**
- **系统内存不足时**

### 11.4 如何优化内存分配？
- **减少小对象分配**：合并小对象
- **复用对象**：使用对象池
- **避免频繁分配**：预分配内存
- **调整GC参数**：使用`runtime.SetGCPercent()`

---

## 12. 总结

### 12.1 核心概念
- **堆和栈**：动态分配vs自动分配
- **span**：内存管理的基本单位
- **mcache**：本地缓存，无锁分配
- **mcentral**：全局缓存，管理空闲span
- **mheap**：全局堆，管理所有内存

### 12.2 分配流程
- **快速路径**：从mcache直接分配
- **慢速路径**：从mcentral或mheap获取span
- **分层设计**：提高性能，减少竞争

### 12.3 回收流程
- **标记阶段**：标记可达对象
- **清扫阶段**：回收不可达对象
- **并发清扫**：减少STW时间

### 12.4 性能优势
- **快速分配**：mcache无锁分配
- **高效回收**：并发清扫
- **低碎片**：span分类管理
- **高利用率**：分层设计

---

## 13. 课后练习

### 13.1 练习1：观察内存分配

```go
package main

import (
    "fmt"
    "runtime"
)

func main() {
    var m1, m2 runtime.MemStats
    
    // 第一次读取内存统计
    runtime.ReadMemStats(&m1)
    fmt.Printf("Before: HeapAlloc = %d MB\n", m1.HeapAlloc/1024/1024)
    
    // 分配大量内存
    data := make([]byte, 100*1024*1024) // 100MB
    
    // 第二次读取内存统计
    runtime.ReadMemStats(&m2)
    fmt.Printf("After: HeapAlloc = %d MB\n", m2.HeapAlloc/1024/1024)
    fmt.Printf("Allocated = %d MB\n", (m2.HeapAlloc-m1.HeapAlloc)/1024/1024)
    
    // 释放内存
    data = nil
    runtime.GC()
    
    // 第三次读取内存统计
    var m3 runtime.MemStats
    runtime.ReadMemStats(&m3)
    fmt.Printf("After GC: HeapAlloc = %d MB\n", m3.HeapAlloc/1024/1024)
}
```

### 13.2 练习2：观察GC触发

```go
package main

import (
    "fmt"
    "runtime"
    "time"
)

func main() {
    // 设置GC触发条件
    runtime.SetGCPercent(100)
    
    var m runtime.MemStats
    
    for i := 0; i < 10; i++ {
        // 分配内存
        _ = make([]byte, 10*1024*1024) // 10MB
        
        // 读取内存统计
        runtime.ReadMemStats(&m)
        fmt.Printf("GC cycles: %d, Heap: %d MB\n", 
            m.NumGC, m.HeapAlloc/1024/1024)
        
        time.Sleep(100 * time.Millisecond)
    }
}
```

### 13.3 练习3：观察内存统计

```go
package main

import (
    "fmt"
    "runtime"
)

func main() {
    var m runtime.MemStats
    
    runtime.ReadMemStats(&m)
    
    fmt.Printf("Alloc: %d MB\n", m.Alloc/1024/1024)
    fmt.Printf("TotalAlloc: %d MB\n", m.TotalAlloc/1024/1024)
    fmt.Printf("Sys: %d MB\n", m.Sys/1024/1024)
    fmt.Printf("HeapAlloc: %d MB\n", m.HeapAlloc/1024/1024)
    fmt.Printf("HeapSys: %d MB\n", m.HeapSys/1024/1024)
    fmt.Printf("HeapInuse: %d MB\n", m.HeapInuse/1024/1024)
    fmt.Printf("NumGC: %d\n", m.NumGC)
    fmt.Printf("NextGC: %d MB\n", m.NextGC/1024/1024)
}
```

---

## 14. 检查理解

### 14.1 回答这些问题

1. **堆和栈的区别是什么？**
   - 堆：动态分配、GC管理、共享访问
   - 栈：自动分配、自动释放、私有访问

2. **内存分配的层次结构是什么？**
   - mcache → mcentral → mheap

3. **什么是span？**
   - span是连续的内存块
   - 是Go内存管理的基本单位
   - 按对象大小分类

4. **mcache的作用是什么？**
   - 每个P一个mcache
   - 管理本地span
   - 快速分配内存

5. **mcentral的作用是什么？**
   - 全局缓存
   - 管理空闲span
   - 平衡mcache的内存使用

6. **mheap的作用是什么？**
   - 全局堆
   - 管理所有内存
   - 从操作系统获取内存

7. **为什么需要分层设计？**
   - 提高性能：mcache无锁分配
