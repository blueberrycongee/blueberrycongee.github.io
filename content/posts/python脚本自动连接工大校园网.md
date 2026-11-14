---
title: python脚本自动连接工大校园网
date: 2022-11-22 20:32:24
tags:
  - python
categories:
  - 易忘之事
---

# python脚本自动连接工大校园网

## 代码如下

```
import requests    # 用于向目标网站发送请求
import os
import time

url = ''   # 这行是你需要根据自己的情况修改的地方
response = requests.get(url).status_code  # 直接利用 GET 方式请求这个 URL 同时获取状态码

os.system('pause')

print("状态码{}".format(response))  # 打印状态码
```

学校校园网连接似乎是get类型，账号和密码都写在了url明文里面。十分的简单