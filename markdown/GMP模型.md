# 📚 第1课：Go GMP调度模型

## 1. G（Goroutine）

### 1.1 定义
- **Goroutine**是Go语言的轻量级线程
- 由Go运行时管理
- 用户态线程，不需要操作系统内核参与

### 1.2 特点
- **轻量级**：初始栈大小只有2KB
- **快速创建**：创建一个goroutine只需要几微秒
- **高效调度**：由Go运行时调度，不需要内核参与
- **并发执行**：多个goroutine可以并发执行

### 1.3 状态
```
新建 → 可运行 → 运行中 → 等待 → 可运行 → 运行中
              ↓
            结束
```

**状态说明：**
- `_Gidle`：刚创建，未初始化
- `_Grunnable`：可运行，等待被调度
- `_Grunning`：正在运行
- `_Gsyscall`：系统调用中
- `_Gwaiting`：等待中（如channel操作、sleep等）
- `_Gdead`：已结束

---

## 2. M（Machine）

### 2.1 定义
- **Machine**代表操作系统线程
- 每个M对应一个操作系统线程
- M负责运行goroutine

### 2.2 特点
- **绑定P**：M必须绑定P才能运行goroutine
- **执行G**：M从P的运行队列中获取G并执行
- **系统调用**：M可以执行系统调用
- **自旋**：M可以自旋等待工作

### 2.3 状态
- **运行中**：正在执行goroutine
- **空闲**：没有goroutine可执行
- **系统调用中**：执行系统调用
- **自旋中**：自旋等待工作

---

## 3. P（Processor）

### 3.1 定义
- **Processor**代表逻辑处理器
- P是G和M之间的桥梁
- P维护本地运行队列

### 3.2 特点
- **数量固定**：默认等于CPU核心数，可通过`GOMAXPROCS`设置
- **本地队列**：每个P维护一个本地运行队列
- **全局队列**：所有P共享一个全局运行队列
- **工作窃取**：P可以从其他P窃取goroutine

### 3.3 状态
- **运行中**：正在执行goroutine
- **空闲**：没有goroutine可执行
- **系统调用中**：执行系统调用

---

## 4. 三者关系

### 4.1 基本关系
```
P（处理器）
  ├─ 维护本地运行队列（存储G）
  ├─ 绑定M（执行G）
  └─ 从全局队列获取G

M（线程）
  ├─ 绑定P
  ├─ 从P的队列获取G
  └─ 执行G

G（goroutine）
  ├─ 存储在P的本地队列
  ├─ 或存储在全局队列
  └─ 被M执行
```

### 4.2 数量关系
- **G**：可以无限创建
- **P**：默认等于CPU核心数
- **M**：通常等于P的数量，但可以更多

### 4.3 绑定关系
- **M必须绑定P才能运行G**
- **一个P同一时间只能绑定一个M**
- **一个M同一时间只能绑定一个P**

---

## 5. Goroutine调度流程

### 5.1 创建goroutine
```
1. 用户调用go func()
   ↓
2. 创建新的G
   ↓
3. 将G放入当前P的本地队列
   ↓
4. 如果本地队列满了，放入全局队列
```

### 5.2 调度goroutine
```
1. M从P的本地队列获取G
   ↓
2. 如果本地队列为空，从全局队列获取G
   ↓
3. 如果全局队列为空，从其他P窃取G
   ↓
4. M执行G
```

### 5.3 goroutine切换
```
1. G执行完成
   ↓
2. M从P的队列获取下一个G
   ↓
3. 如果没有G，M进入空闲状态
```

### 5.4 系统调用
```
1. G执行系统调用
   ↓
2. M和P解绑
   ↓
3. M执行系统调用
   ↓
4. 系统调用完成
   ↓
5. M重新绑定P
   ↓
6. 继续执行G
```

---

## 6. 代码示例

### 6.1 观察GMP调度
```go
package main

import (
    "fmt"
    "runtime"
    "time"
)

func main() {
    // 设置P的数量
    runtime.GOMAXPROCS(4)
    
    // 创建多个goroutine
    for i := 0; i < 10; i++ {
        go func(n int) {
            fmt.Printf("Goroutine %d running\n", n)
            time.Sleep(100 * time.Millisecond)
        }(i)
    }
    
    time.Sleep(1 * time.Second)
}
```

### 6.2 观察工作窃取
```go
package main

import (
    "fmt"
    "runtime"
    "sync"
)

func main() {
    runtime.GOMAXPROCS(4)
    
    var wg sync.WaitGroup
    
    // 在一个P上创建大量goroutine
    for i := 0; i < 100; i++ {
        wg.Add(1)
        go func(n int) {
            defer wg.Done()
            fmt.Printf("Goroutine %d\n", n)
        }(i)
    }
    
    wg.Wait()
}
```

---

## 7. 关键要点

### 7.1 核心概念
- **G（Goroutine）**：轻量级线程，由Go运行时管理
- **M（Machine）**：操作系统线程，执行goroutine
- **P（Processor）**：逻辑处理器，维护运行队列

### 7.2 调度特点
- **M:N调度**：M个线程映射到N个goroutine
- **抢占式调度**：goroutine可以被抢占
- **工作窃取**：P可以从其他P窃取goroutine
- **本地队列**：每个P维护本地运行队列

### 7.3 性能优化
- **设置GOMAXPROCS**：根据CPU核心数设置P的数量
- **避免阻塞**：减少系统调用和阻塞操作
- **平衡负载**：合理分配goroutine到不同P

### 7.4 调试工具
- **runtime.NumGoroutine()**：查看goroutine数量
- **runtime.GOMAXPROCS()**：设置P的数量
- **runtime/pprof**：性能分析

---

## 8. 常见问题

### 8.1 为什么需要GMP？
- **提高并发性能**：避免内核态切换
- **减少资源消耗**：goroutine比线程轻量
- **高效调度**：用户态调度更灵活

### 8.2 GOMAXPROCS设置多少合适？
- **默认值**：等于CPU核心数
- **CPU密集型**：可以设置为核心数
- **IO密集型**：可以设置为核心数的2倍

### 8.3 如何避免goroutine泄漏？
- **及时关闭channel**
- **使用context取消goroutine**
- **避免无限循环**

---

## 9. 总结

### 9.1 GMP模型的核心
- **G**：轻量级线程
- **M**：操作系统线程
- **P**：逻辑处理器

### 9.2 调度流程
- **创建**：创建G，放入P的队列
- **调度**：M从P的队列获取G并执行
- **切换**：G执行完成，切换到下一个G
- **系统调用**：M和P解绑，系统调用完成重新绑定

### 9.3 性能优势
- **轻量级**：goroutine比线程轻量
- **高效调度**：用户态调度
- **工作窃取**：平衡负载
- **并发执行**：充分利用多核

---

## 10. 课后练习

### 10.1 练习1：观察goroutine数量
```go
package main

import (
    "fmt"
    "runtime"
    "time"
)

func main() {
    fmt.Printf("Initial goroutines: %d\n", runtime.NumGoroutine())
    
    for i := 0; i < 10; i++ {
        go func() {
            time.Sleep(1 * time.Second)
        }()
    }
    
    fmt.Printf("After creating: %d\n", runtime.NumGoroutine())
    
    time.Sleep(2 * time.Second)
    fmt.Printf("After GC: %d\n", runtime.NumGoroutine())
}
```

### 10.2 练习2：观察GOMAXPROCS影响
```go
package main

import (
    "fmt"
    "runtime"
    "sync"
    "time"
)

func main() {
    for procs := 1; procs <= 4; procs++ {
        runtime.GOMAXPROCS(procs)
        
        start := time.Now()
        
        var wg sync.WaitGroup
        for i := 0; i < 100; i++ {
            wg.Add(1)
            go func() {
                defer wg.Done()
                time.Sleep(10 * time.Millisecond)
            }()
        }
        
        wg.Wait()
        
        fmt.Printf("GOMAXPROCS=%d, Time=%v\n", procs, time.Since(start))
    }
}
```

