# Go 语言进阶指南：从基础语法到核心设计

掌握了 Go 的变量、循环和基础类型后，接下来的内容将带你进入 Go 语言的灵魂：**方法、接口与并发编程**。这篇博客将详细解析这些进阶语法，帮助你理解 Go 为什么如此设计。

---

## 1. 方法接收者 (Method Receivers)

在 Go 中，我们通过“方法接收者”将函数绑定到具体的结构体上。这让函数变成了该结构体的“专属技能”。

### 语法结构
```go
type Robot struct {
    Name string
}

// (r Robot) 就是接收者，它将 Move 方法绑定到了 Robot 结构体上
func (r Robot) Move(distance int) {
    fmt.Printf("%s 移动了 %d 米\n", r.Name, distance)
}

func main() {
    bot := Robot{Name: "小智"}
    bot.Move(10) // 使用“对象.方法”的方式调用
}