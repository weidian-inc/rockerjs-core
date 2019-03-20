# Contributing Guide

### 编译

```javascript
npm run build
```
编译 TypeScript

### 测试

语法检查

```javascript
npm run lint
```

单元测试检查

```javascript
npm run test
```

### 规范

- 编写时请遵循 `tslint` 中的配置。
- 提交代码时 git commit message 请遵循[格式化规范](http://www.ruanyifeng.com/blog/2016/01/commit_message_change_log.html)，加入 [fix]、[feat]、[chore] 等标记
- 发起 Pull Request 之前先用 lint 和 test 做检查，确保发 request 时尽量为无 warning 无 error 状态。