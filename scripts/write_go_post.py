#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""创建 Go 语言基础语法快速入门文章"""

content = """---
title: Go语言基础语法快速入门
date: 2025-12-26 22:30:00
tags:
  - Go
  - 技术
  - 编程语言
categories:
  - Go语言教程
---

Go（又称 Golang）是 Google 开发的一种静态强类型、编译型语言。它以简洁的语法、高效的并发模型（Goroutines）和强大的标准库而闻名。

## 1. 第一个程序：Hello World

每一个 Go 文件都必须以 `package` 声明开头。`main` 包是程序的入口包。

```go
package main

import "fmt" // 导入格式化包，用于输出

func main() {
    fmt.Println("Hello, Go!")
}
```

- 运行：`go run main.go`
- 编译：`go build main.go`

## 2. 变量与常量

Go 支持显式声明和类型推导。

### 变量声明

```go
var name string = "Golang" // 显式类型声明
var version = 1.21         // 自动类型推导
count := 10                // 短变量声明（仅限函数内部使用）
```

### 常量

使用 `const` 关键字，值在编译时确定且不可更改。

```go
const Pi = 3.14159
```

## 3. 基本数据类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `bool` | 布尔值 | `true`, `false` |
| `int/uint` | 整数（根据平台 32/64 位） | `100`, `-1` |
| `float64` | 浮点数 | `3.14` |
| `string` | 字符串（UTF-8 编码） | `"你好"` |
| `error` | 接口类型，用于处理错误 | `nil` |

## 4. 控制结构

### 条件判断 (If-Else)

Go 的 `if` 不需要圆括号，且支持在条件判断前执行初始化语句。

```go
if score := 85; score >= 60 {
    fmt.Println("合格")
} else {
    fmt.Println("不合格")
}
```

### 循环 (For)

Go 只有一种循环关键字：`for`。它可以实现传统的 C 风格循环、While 循环和迭代。

```go
// 传统风格
for i := 0; i < 5; i++ {
    fmt.Println(i)
}

// 模拟 While
for n < 10 {
    n++
}

// 死循环
for {
    break
}
```

## 5. 复合类型

### 切片 (Slice)

切片是 Go 中最常用的数据结构，它是对数组的抽象，长度可变。

```go
nums := []int{1, 2, 3}
nums = append(nums, 4)       // 添加元素
sub := nums[1:3]             // 切片截取（左闭右开）
fmt.Println(len(nums), cap(nums)) // 长度与容量
```

### 映射 (Map)

无序的键值对集合（哈希表）。

```go
m := make(map[string]int)
m["Go"] = 2009
delete(m, "Go") // 删除键
```

## 6. 函数 (Functions)

Go 函数支持多个返回值，通常用于返回结果和错误信息。

```go
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, fmt.Errorf("除数不能为 0")
    }
    return a / b, nil
}
```

## 7. 结构体与方法 (Structs & Methods)

Go 没有"类"，而是通过 `struct` 定义数据，通过为结构体绑定 method 来定义行为。

### 定义结构体

```go
type User struct {
    ID   int
    Name string
}
```

### 定义方法

```go
// (u User) 是接收者，类似于 self 或 this
func (u User) SayHi() {
    fmt.Printf("大家好，我是 %s\\n", u.Name)
}
```

## 8. 指针 (Pointers)

Go 允许使用指针，但不支持指针运算（如 `p++`），这保证了内存安全。

- `&`：获取变量地址
- `*`：获取地址指向的值

```go
x := 1
p := &x         // p 是指向 x 的指针
fmt.Println(*p) // 输出 1
```

## 9. 错误处理

Go 提倡显式处理错误，而不是抛出异常（try-catch）。

```go
res, err := divide(10, 0)
if err != nil {
    fmt.Println("发生错误:", err)
    return
}
fmt.Println("结果:", res)
```

## 总结

Go 的语法设计极其克制，去掉了复杂的特性，专注于代码的可读性和可维护性。
"""

output_path = r"D:\Desktop\blog-source\source\_posts\Go语言基础语法快速入门.md"
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(content)
print(f"文章已保存到: {output_path}")
