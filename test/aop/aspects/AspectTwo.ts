import { Aspect, Pointcut, Before, After,After_Throwing, After_Returning, Around, composeAspects } from '../../..';
import { HookedClass } from "../../aop/hookedClass";

@Aspect({
    order: 1
})
export class AspectTwo {

    @Pointcut({
        clazz: HookedClass,
        rules: '.*hooked.*',
        advices: ['before:before', "after", "after_returning", 'After_Throwing']
    })
    static pointcut(){};

    @Before
    before() {
        console.log('before executing method, higher priority...');
    }

    @Before
    before2() {
        console.log('before2 executing method, higher priority...');
    }

    @After
    after() {
        console.log('after executing method, higher priority...');
    }

    @After_Returning
    printReturn(ctx, result) {
        result = result + 1;
        console.log('after running method, higher priority result: ' + result);
        return result;
    }


    @After_Throwing
    afterThrowing(ctx, ex) {
        console.log('exception catch: '+ ex.message);
        console.log(ctx)
    }
}