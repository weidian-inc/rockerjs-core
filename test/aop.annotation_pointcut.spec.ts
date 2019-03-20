import { Aspect, Pointcut, Before, After,After_Throwing, After_Returning, Around, composeAspects } from '..';
import {HookedClass} from "./aop/hookedClass";
import {Inject} from '..';
import  {contextConfiguration, Test, run, OnlyRun, Describe, before, after} from '@rockerjs/tsunit';
import * as chai from "chai";

const expect = chai.expect;

class AopAnnotationSpec {

    @Inject
    private hookedClass: HookedClass;

    @Test('test annotation method')
    async testAnnotationMethod() {
        let result = this.hookedClass.markedMethod();
        expect(result).to.equal(1001);
    }

    @Test('test async annotation method')
    async testAsyncAnnotationMethod() {
        let result = await this.hookedClass.markedMethodAsync();
        expect(result).to.equal(2);
    }

    @Test('test annotation method exception')
    async testAnnotationMethodException() {
        this.hookedClass.markedExceptionMethod();
    }

    // @Test('test exception without after-throwing advice')
    // async testExceptionMethodWithoutAdvice() {
    //     try {
    //         this.hookedClass.exceptionMethod();
    //     } catch(e) {
    //         expect(e).instanceof(Error);
    //     }
    // }

    @Test('test async annotation method throw exception')
    async testAsyncAnnotationExceptionMethod() {
        await this.hookedClass.markedExceptionAsyncMethod();
    }
}

@Aspect({
    order: 2
})
class AspectOne {

    @Pointcut({
        execution: [HookedClass, 'marked'],
        advices: ['before','after','around', 'after_returning']
    })
    static pointcut(){};

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

@Aspect({
})
class AspectTwo {

    @Pointcut({
        execution: [HookedClass, 'marked'],
        advices: ['before', "after", "after_returning", 'After_Throwing']
    })
    static pointcut(){};

    @Before
    before() {
        console.log('before executing method, higher priority...');
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

composeAspects({
    execution: [HookedClass, 'marked'],
    aspects: [AspectOne, AspectTwo]
});

export {AopAnnotationSpec};