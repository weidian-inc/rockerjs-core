import { Inject, Container, Aspect, Pointcut, Before, After, After_Returning, Around } from "..";

@Inject
class Test {
  foo() {
    console.log("foo");
  }

  foo2() {
    console.log("foo2");
    return "foo2";
  }
}

@Aspect
class Logger {
  @Pointcut({
    clazz: Test,
    // rules: ".*foo.*",
    advices: ["before", "after", "After_Returning", "Around"]
  })
  static main() {}

  @Before
  printStart() {
    console.log("log:start:", new Date());
  }

  @After
  printEnd() {
    console.log("log:end:", new Date());
  }

  @After_Returning
  printReturn(ctx, result) {
    console.log("wireless after return: ", " result :", result);
  }

  @Around
  currentTime2(ctx, next) {
      console.log('before',Date.now());
      let ret = next();
      console.log('after',Date.now(),ret);
      return ret;
  }
}

Container.getObject<Test>('test').foo();
Container.getObject<Test>('test').foo2();
