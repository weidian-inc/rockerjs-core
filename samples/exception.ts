import { Inject, Container, Catch, Clamp, ExceptionClamp, Aspect, Pointcut, After_Throwing } from "..";

@Clamp
class Clamper extends ExceptionClamp {
  catch(ex, ctx) {
    console.log("hahaha: ****", ex, ctx);
    throw ex
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

Container.getObject<Test>('test').test()