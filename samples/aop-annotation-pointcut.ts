import { Inject, Container, Pointcut, Before, After, After_Returning, Around, AnnotationFactory } from "..";

@Inject
class Test {
  foo() {
    console.log("foo");
  }

  @AnnotationFactory('foo2')
  foo2() {
    console.log("foo2");
    return "foo2";
  }
}

class Logger {
  @Pointcut({
    execution: [Test, 'foo2'],
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
    return 2
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
