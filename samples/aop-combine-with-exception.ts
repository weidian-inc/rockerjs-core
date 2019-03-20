import { Inject, Container, Aspect, Pointcut, Before, After, After_Returning, Around, composeAspects } from "..";

@Inject
class Test {
  foo() {
    console.log("foo");
    // throw new Error('67676')
    return "bar";
  }
}

@Aspect
class Logger {
  @Pointcut({
    clazz: Test,
    advices: ["before", "after", "around", 'after_returning']
  })
  static main() {}

  @Before
  printStart() {
    console.log("1:start");
  }

  @After
  printafter() {
    console.log("1:after");
  }

  @After_Returning
  printReturn(ctx, result) {
      console.log('1:after_returning', result)
      return result + 1
  }

  @Around
  printAround(ctx, next) {
    console.log("1:around:before");
    let ret = next();
    console.log("1:around:after", ret);
    return ret;
  }
}

@Aspect
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

@Aspect
class Logger3 {
  @Pointcut({
    clazz: Test,
    advices: ["before", "after", "around", 'after_returning']
  })
  static main() {}

  @Before
  printStart() {
    console.log("3:start");
  }

  @After
  printafter() {
    console.log("3:after");
  }

  @After_Returning
  printReturn(ctx, result) {
      console.log('3:after_returning', result)
      return result + 3
  }

  @Around
  printAround3(ctx, next) {
    console.log("3:around:before");
    let ret = next();
    console.log("3:around:after", ret);
    return ret;
  }
}

composeAspects({
    clazz: Test,
    // rules: '.*foo.*',
    aspects: [Logger, Logger2, Logger3]
})

Container.getObject<Test>('test').foo();
