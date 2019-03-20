import { Inject, Container, Aspect, Pointcut, Before, After, After_Returning, After_Throwing, Around, AnnotationFactory, composeAspects } from "..";

@Inject
class Test {
  @AnnotationFactory('foo')
  foo() {
    console.log("foo");
    return "bar";
  }

  @AnnotationFactory('foo')
  toe() {
    console.log("toe");
    // throw new Error('67676')
    return "bar";
  }
}

@Aspect({order: 1})
class Logger {
  @Pointcut({
    execution: [Test, 'foo'],
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

@Aspect({order: 2})
class Logger2 {
  @Pointcut({
    execution: [Test, 'foo'],
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

@Aspect({order: 3})
class Logger3 {
  @Pointcut({
    execution: [Test, 'foo'],
    advices: ["before", "after", "around", 'after_returning', 'after_throwing']
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

  @After_Throwing
  printThrowing(ctx, ex) {
      console.log('3:after_throwing', ex)
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
    execution: [Test, 'foo'],
    aspects: [Logger, Logger2, Logger3]
})

Container.getObject<Test>('test').foo();
Container.getObject<Test>('test').toe();
