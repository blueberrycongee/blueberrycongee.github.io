---
title: hexo一些操作
date: 2022-11-19 17:33:58
tags:
  - 杂谈
categories:
  - 易忘之事
---

## hexo经典三板斧

hexo clean

hexo g

hexo d

## 服务器地址

deploy:

 type: ‘git’

 repository: [abc@175.178.246.53](mailto:abc@175.178.246.53):/home/git/blog.git  #用户名@服务器Ip:git仓库位置

 branch: master

deploy:

 type: ‘git’

 repo: [https://github.com/blueberrycongee/blueberrycongee.github.io](https://github.com/blueberrycongee/blueberrycongee.github.io)  #用户名@服务器Ip:git仓库位置

 branch: main

## 出现某个bug时候的操作

```
git config --global core.autocrlf false
```