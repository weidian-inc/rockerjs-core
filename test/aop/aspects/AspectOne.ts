import { Aspect, Pointcut, Before, After,After_Throwing, After_Returning, Around, composeAspects } from '../../..';
import { HookedClass } from "../../aop/hookedClass";

@Aspect({
    order: 2
})
export class AspectOne {

    @Pointcut({
        clazz: HookedClass,
        rules: '.*hooked.*',
        advices: []
    })
    static pointcut(){};

    @Pointcut({
        clazz: HookedClass,
        rules: '.*other.*',
        advices: []
    })
    static pointcutOther(){};

    @Before
    before() {
        console.log('before executing method...');
    }

    @After
    after() {
        console.log('after executing method...');
    }

    @After_Returning
    printReturn(ctx, result) {
        console.log('after running method... result: ' + result);
        return result;
    }

    @Around
    around(ctx, next) {
        let result = null;
        console.log('method around before...: ');
        result = next();
        if(result instanceof Promise) {
            // noop
        }else {
            result *= 1000;
        }
        console.log('method around after... result: ' + result);
        return result;
    }
}