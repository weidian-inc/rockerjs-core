import { Inject, Container, Aspect, Pointcut, Before, After, Around, composeAspects } from "..";

@Inject
class Test {
  foo() {
    console.log("foo");
    return "bar";
  }
}

@Aspect({
  order: 2
})
class Logger {
  @Pointcut({
    clazz: Test,
    advices: ["before", "after", "around"]
  })
  static main() {}

  @Before
  printStart() {
    console.log("1:start");
  }

  @After
  printEnd() {
    console.log("1:end");
  }

  @Around
  printAround(ctx, next) {
    console.log("1:around:before");
    let ret = next();
    console.log("1:around:after", ret);
    return ret;
  }
}

@Aspect({
  order: 1
})
class Logger2 {
  @Pointcut({
    clazz: Test,
    advices: ["before", "after", "around"]
  })
  static main() {}

  @Before
  printStart() {
    console.log("2:start");
  }

  @After
  printEnd() {
    console.log("2:end");
  }


  @Around
  printAround2(ctx, next) {
    console.log("2:around:before");
    let ret = next();
    console.log("2:around:after", ret);
    return ret;
  }
}

@Aspect({
  order: 3
})
class Logger3 {
  @Pointcut({
    clazz: Test,
    advices: ["before", "after", "around"]
  })
  static main() {}

  @Before
  printStart() {
    console.log("3:start");
  }

  @After
  printEnd() {
    console.log("3:end");
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
