import { Aspect, Pointcut, Before, After,After_Throwing, After_Returning, Around, composeAspects } from '..';
import { HookedClass } from "./aop/hookedClass";
import { Inject } from '..';
import { AspectOne } from './aop/aspects/AspectOne';
import { AspectTwo } from './aop/aspects/AspectTwo';
import  { contextConfiguration, Test, run, OnlyRun, Describe, before, after } from '@rockerjs/tsunit';
import * as chai from "chai";
import * as path from 'path';

const expect = chai.expect;

class AopSpec {

    @Inject
    private hookedClass: HookedClass;

    @Test('test method')
    async testFlow() {
        let result = this.hookedClass.hookedMethod();
        expect(result).to.equal(1001);
    }

    @Test('test other method')
    async testOther() {
        let result = this.hookedClass.otherMethod();
        expect(result).to.equal(1000);
    }

    @Test('test async method')
    async testFlowAsync() {
        let result = await this.hookedClass.hookedMethodAsync();
        expect(result).to.equal(2);
    }

    @Test('test exception')
    async testException() {
        this.hookedClass.hookedExceptionMethod();
    }

    @Test('test exception without after-throwing advice')
    async testExceptionMethodWithoutAdvice() {
        try {
            this.hookedClass.exceptionMethod();
        } catch(e) {
            expect(e).instanceof(Error);
        }
    }

    @Test('test async exception')
    async testAsyncExceptionMethod() {
        try {
            await this.hookedClass.hookedExceptionAsyncMethod();
        } catch(e) {
            expect(e).instanceof(Error);
        }
    }
}

composeAspects({
    clazz: HookedClass,
    rules: '.*hooked.*',
    aspects: [AspectOne, AspectTwo]//[path.join(__dirname, './aop/aspects/AspectOne'), path.join(__dirname, './aop/aspects/AspectTwo')]
});

export {AopSpec};