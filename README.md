# Rockerjs Core
[![Build Status](https://travis-ci.org/weidian-inc/rockerjs-core.svg?branch=dev)](https://travis-ci.org/weidian-inc/rockerjs-core)
[![Coverage Status](https://coveralls.io/repos/github/weidian-inc/rockerjs-core/badge.svg?branch=dev)](https://coveralls.io/github/weidian-inc/rockerjs-core?branch=dev)
[![npm package](https://img.shields.io/npm/v/@rockerjs/core.svg)](https://www.npmjs.org/package/@rockerjs/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

- [项目主页](https://rockerjs.weidian.com/rockerjs/core.html)

基于 TypeScript 和注解的轻量级IoC容器，提供了依赖注入、面向切面编程及异常处理等功能。Rockerjs Core可在任意工程中引入，是一个框架无关的IoC容器。

**@rockerjs/core**模块不依赖于任何框架，并与现有框架、库、类等保持兼容。通过DI(Dependency Injection）实现代码解耦和依赖解耦，在构建复杂应用时保证可扩展性与灵活性；同时提供二维编程的能力，基于注解可在各个连接点（Advice）进行非核心业务的操作，减少代码冗余；最后，它提供一种基于注解配置的简易异常处理机制 -- **Clamp机制**，通过特定规则匹配异常处理程序实现处理。

## 一、快速上手

安装

```sh
npm install @rockerjs/core
```


> @rockerjs/core最佳实践需要结合TypeScript的装饰器一起使用（也可使用接口），因此需要在项目根目录添加 **tsconfig.json** 文件，并配置编译选项 “**experimentalDecorators**”和“**emitDecoratorMetadata**”为 true


示例 1

```typescript
import { Container, Inject } from '@rockerjs/core';

class User {
  id: string = "testId";
  name: string = "testName";
}

class UserService {
  getUser(_id: string): User {
    return new User();
  }
}

@Inject
class ControlDefault {
  @Inject
  userService: UserService;

  test() {
    let user: User = this.userService.getUser("test");
    console.log(user);
  }
}

@Inject('controllor-with-args', new Date())
class ControlDefaultWithArgs {
  name: string;
  time: Date;

  constructor(name: string, time: Date) {
    this.name = name;
    this.time = time;
  }

  @Inject
  userService: UserService;

  test() {
    let user: User = this.userService.getUser("test");
    console.log(user, this.name, this.time);
  }
}

@Inject('controllor1', 'util', new Date())
class Control {
  name: string;
  time: Date;

  constructor(name: string, time: Date) {
    this.name = name;
    this.time = time;
  }

  @Inject
  userService: UserService;

  test() {
    let user: User = this.userService.getUser("test");
    console.log(user, this.name, this.time);
  }
}

// 通过getObject接口从容器中获取实例，参数为“单例的名称”（默认名称为类名首字母小写）
Container.getObject<ControlDefault>('controlDefault').test();
// 通过getObject接口从容器中获取实例，此例中并未提供实例名
Container.getObject<ControlDefaultWithArgs>('controlDefaultWithArgs').test();
// 通过getObject接口从容器中获取实例，此例中提供了3个参数，@rockerjs/core 认为第一个参数为实例名，剩下的参数则用于实例化
Container.getObject<Control>('controllor1').test();
```

示例 2 ： RPC

```typescript
import {Container, Inject} from '@rockerjs/core';

//PRC Demo实现
let RPC = {
    config: function (cfg: { serviceUrl: string, interfaces: Function[] }) {
        if (cfg.interfaces) {
            cfg.interfaces.forEach((type: FunctionConstructor) => {
                if (type.prototype) {
                    let newObj = {}, proto = type.prototype;
                    let nms = Object.getOwnPropertyNames(proto);
                    if (nms) {
                        nms.forEach((nm) => {
                            if (nm != 'constructor' && typeof(proto[nm]) === 'function') {
                                newObj[nm] = function () {
                                    //{nm:方法名,arguments:参数表},改为调用远程请求过程
                                    return arguments[0];//test return
                                }
                            }
                        })
                    }
                    Container.provides([type, () => {
                        return newObj;
                    }])
                }
            })
        }
    }
}

//--DEMO--------------------------------------------------------

//1. 接口声明（注意,此处只能使用Concrete class）
class Product {
    getById(id: string): string {
        return null;
    }
}

//2. 应用RPC Framework
RPC.config({
    serviceUrl: null,
    interfaces: [Product]//提供接口描述，在RPC中构建factory
})

//3. Service class
@Inject
class Service {
    @Inject
    product: Product;

    test() {
        let id: string = 'tid';
        let rst = this.product.getById(id);
        console.log(rst);
    }
}

//4.测试
Container.getObject<Service>('service').test();
```

## 二、依赖注入与容器

### 依赖注入 @Inject

提供了注解 `@Inject` 来实现依赖的注入，当我们有如下 `GetDubboData` 类时

```typescript
class GetDubboData {
    p0: number;
    constructor(p0: number, p1: string) {
        this.p0 = p0;
    }
}
```

我们可以通过以下方式实例化这个类，同时传入指定的参数

1. 直接传递构造函数的参数

   ```typescript
   class SomeControl {
       @Inject(1, 'aaa')
       private dubbo: GetDubboData
   }
   ```



2. 给出构造函数的工厂函数

   ```typescript
   class SomeControl {
       @Inject(function () {
           return [1, 'aaa']
       })
       private dubbo: GetDubboData
   }
   ```



3. 无构造函数或参数为空

   ```typescript
   class SomeControl {
       @Inject
       private dubbo: GetDubboData
   }
   ```



### 操作类实例化容器

默认的实例化方法可以满足开发者的大部分需求，Rockerjs Core 提供了 provides 方法自定义实例化工厂，同时提供了获取类和类实例化函数映射表的方法。

#### 注册、修改类的实例化方法

- 直接传入类或工厂函数

  ```typescript
  // 形式一：形如 Container.provides(class extends UserService{})
  Container.provides(
    class extends UserService {
      getUser(id: string): User {
        console.log(1);
        return new User();
      }
    }
  );
  ```

- 传入类及类的工厂函数

  ```typescript
  // 形式二：形如 Container.provides([UserService,FactoryFunction])
  Container.provides([
    UserService,
    () => {
      return new class extends UserService {
        getUser(id: string): User {
          console.log(2);
          return new User();
        }
      }();
    }
  ]);
  ```



#### 获取实例化方法注册表

##### getGeneralHashmap()

返回一个构造函数-工厂方法映射表, 结构如下

```typescript
const globalGeneralProviders: Map<FunctionConstructor, Function> = new Map<
  FunctionConstructor,
  Function
>();
```



#### 手动实例化方法

`Container.injectClazzManually` 方法提供了直接实例化注册表中的类的功能，参数为构造函数以及想要传入的参数

```typescript
class SomeControl {
  transGet: GetTransData = Container.injectClazzManually(GetTransData, 1, 2);

  async getProduct(_productId?: number) {
    let json: any = await this.transGet.getDetail(_productId);
    console.log(json);
  }
}
```



### 完整例子

假设我们有一个获取异步数据的抽象类

```typescript
abstract class GetTransData {
  p0: number
  constructor(p0: number, p1: string) {
      console.log(p0 + p1)
      this.p0 = p0
  }

  abstract async getDetail(_proId: number): Promise<string>;
}
```

可以通过 Container 的 `provides` API 来指定对应类型的工厂函数

```typescript
Container.provides([GetTransData, (_p0, _p1) => {
  return new class extends GetTransData {
      constructor(p0: number, p1: string) {
          super(p0, p1);
      }

      async getDetail(_id: number): Promise<string> {
          await  ((ms) => new Promise(res => setTimeout(res, ms)))(100)
          return `Hello ${this.p0}`
      }
  }(_p0, _p1);
}]);
```

最终通过 `@Inject` 方法注入在测试类里面实例化这个对象

```typescript
@Inject
class SomeControl {
  @Inject(666, 2)
  transGet: GetTransData;

  async getProduct(_productId?: number) {
      let json: any = await this.transGet.getDetail(_productId);
      console.log(json);
  }
}

Container.getObject<SomeControl>('someControl').getProduct();
```

得到输出结果

```
668
Hello 666
```

## 三、面向切面编程 AOP

面向切面编程（AOP是Aspect Oriented Program的首字母缩写）是指在运行时，动态地将代码切入到类的指定方法、指定位置上的编程思想。Rockerjs Core 提供了 AOP 编程能力

### 简单的例子

假如我们想在下面的 `foo` 方法执行前后打点

```typescript
class Test {
  foo() {
    console.log('foo')
  }
}

new Test().foo()
```

我们可以声明一个日志类，通过`@Aspect`注解声明其为一个切面类，通过`@Pointcut`注解配置想要匹配的类、方法以及需要执行的钩子,  最后通过 `@Before`和`@After`等注解标识被修饰方法在处于对应生命周期时需要执行的方法

```typescript
import { Aspect, Pointcut, Before, After } from "@rockerjs/core";

@Aspect
class Logger {
  // 必须在静态方法上注册切点
  @Pointcut({
    clazz: Test, // 定位被修饰的类
    rules: ".*foo.*", // 通过正则匹配到对应的方法，不填则匹配所有函数
    advices: ["before:printStart", "after"] // 过滤将要执行的钩子 (可细致到函数名)
  })
  static main() {}

  // 在执行被打点方法前执行的方法
  @Before
  printStart() {
    console.log("log:start:", new Date());
  }

  // 可以指定多个方法
  @Before
  printStart2() {
    console.log("log:start:", new Date());
  }

  // 在执行被打点方法后执行的方法
  @After
  printEnd() {
    console.log("log:end:", new Date());
  }
}
```

> 必须在切面类的静态方法上注册切点

### Advices(可理解为生命周期，下文用生命周期代指advice)列表

Rockerjs Core 提供了`Before`, `After`,`After_Throwing`, `After_Returning`,`Around`等生命周期

- Before：在被打点函数执行前执行
- After：在被打点函数执行后执行
- After_Throwing：在被打点函数抛出异常时执行
- After_Returning：在被打点函数返回结果后执行
- Around：在被打点函数执行前后执行，类似于 koa 中间件

#### @After_Returning

1. 在 after 后执行
2. 如果原生函数没有 return 任何东西则不执行
3. 可以修改返回结果

```typescript
@After_Returning
printReturn(ctx, result) {
 	// ctx 为函数执行上下文
  // result 为函数执行的结果
  result += 666
  return result
}
```

#### @After_Throwing

```typescript
@After_Throwing
printthrow(ctx, ex) {
    // ctx 为函数执行上下文
    // ex 为错误信息
    console.log('Loggy catch: '+ ex.message);
    console.log(ctx)
}
```

#### @Around

```typescript
@Around
currentTime2(ctx, next) {
    // ctx 为函数执行上下文
    // next 为匹配到的函数
    console.log('before',Date.now());
    let ret = next();
    console.log('after',Date.now(),ret);
    return ret;
}
```

### 切面组合

我们可以为某个类同时注册多个切面类，再通过 `composeAspects` 方法将它们组合起来，默认按照声明的顺序来包裹被打点的函数，最后声明的类会包裹在最外面一层

```typescript
@Aspect()
class Logger {
    // ...
}

@Aspect()
class Logger2 {
  @Pointcut({
    clazz: Test,
    advices: ["before", "after", "around", 'after_returning']
  })
  static main() {}

  @Before
  printStart() {
    console.log("2:start");
  }

  @After
  printafter() {
    console.log("2:after");
  }

  @After_Returning
  printReturn(ctx, result) {
      console.log('2:after_returning', result)
      return result + 2
  }

  @Around
  printAround2(ctx, next) {
    console.log("2:around:before");
    let ret = next();
    console.log("2:around:after", ret);
    return ret;
  }
}

@Aspect()
class Logger3 {
  // ...
}

composeAspects({
    clazz: Test,
    // rules: '.*foo.*',
    aspects: [Logger, Logger2, Logger3]
});

```

执行结果如下：

```
3:start
2:start
1:start
3:around:before
2:around:before
1:around:before
foo
1:around:after bar
2:around:after bar
3:around:after bar
1:after
2:after
3:after
1:after_returning bar
2:after_returning bar
3:after_returning bar
```



如果想自定义切面之间执行的顺序，可以在切面注解上传入切面的次序（数值小的在洋葱模型的外层）：

```typescript
@Aspect({
  order: 2
})
class Logger { }

@Aspect({
  order: 1
})
class Logger2 { }

@Aspect({
  order: 3
})
class Logger3 { }

composeAspects({
    clazz: Test,
    aspects: [Logger, Logger2, Logger3]
});
```

执行顺序如下：

```
2:start
1:start
3:start
2:around:before
1:around:before
3:around:before
foo
3:around:after bar
1:around:after bar
2:around:after bar
3:end
1:end
2:end
```

## 四、异常处理 Exception

除了通过 Rockerjs Core AOP 中的 ` @After_Throwing` 注解来实现错误捕获，我们还提供了更简便的实现错误捕获的方法，如下例，我们先声明一个错误捕获夹，然后在被包裹的函数上使用这个错误捕获夹，当函数执行过程中有异常发生时，我们能在捕获夹的 catch 方法中拿到错误信息以及函数执行的上下文。

```typescript
import { Container, Inject, Catch, Clamp, ExceptionClamp } from "@rockerjs/core";

// 1. 声明一个捕获器，实现 catch 方法
@Clamp
class Clamper extends ExceptionClamp {
  catch(ex, ctx) {
    console.log("hahaha: ****", ex, ctx);
  }
}

@Inject
class Test {
  // 2. 使用捕获器
  @Catch("Clamper")
  test() {
    throw new Error("12322");
  }
}

Container.getObject<Test>('test').test();
```

与 `@After_Throwing` 同时使用时，`@Catch` 会先捕获到错误，再次将错误抛出， `@After_Throwing` 才捕获到错误

```typescript
@Clamp
class Clamper extends ExceptionClamp {
  catch(ex, ctx) {
    console.log("hahaha: ****", ex, ctx);
    throw ex // 将错误二次抛出
  }
}

@Inject
class Test {
  @Catch("Clamper")
  test() {
    throw new Error("12322");
  }
}


@Aspect
class ExceptionClamp2 {
  @Pointcut({
    clazz: Test,
    advices: ['after_throwing']
  })
  static main() {}

  @After_Throwing
  printThrow(ctx, ex) {
      console.log('Loggy catch: '+ ex.message);
      console.log(ctx)
  }
}

Container.getObject<Test>('test').test();
```

## Contribute

请参考 [Contribute Guide](https://github.com/weidian-inc/rockerjs-core/blob/dev/CONTRIBUTING.md) 后提交 Pull Request。

## License

MIT