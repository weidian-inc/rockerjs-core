import { Container, Inject} from '..';
import * as chai from 'chai'
import  {contextConfiguration, Test, run, OnlyRun, Describe, before, after} from '@rockerjs/tsunit';
import {TestClass} from "./container/testClass";

const expect = chai.expect;

class ContainerSpec {

    @Inject(1, "arg2")
    private testClass: TestClass;

    @Test('test inject')
    async testInjectSuccess() {
        expect(this.testClass).to.exist;
    }

    @Test('test instance')
    async testInstance() {
        expect(this.testClass).to.be.instanceof(TestClass);
    }

    @Test('test referencing')
    async testReferencing() {
        expect(this.testClass).to.have.property("arg1");
        expect(this.testClass).to.have.property("arg1", 1000);
    }

    @Test('test method')
    async testMethod() {
        expect(this.testClass.testMethod()).to.equal('hooked! test method: 1000 - arg2');
    }

    @Test('get container info')
    async getContainerInfo() {
        console.log("globalGeneralProviders => " + JSON.stringify(Container.getGeneralHashmap()));
        console.log("globalTypedProviders => " + JSON.stringify(Container.getTypedHashmap()));
    }
}

Container.provides([TestClass, (arg1, arg2) => {
    return new class extends TestClass {
        constructor(arg1: number, arg2: string) {
            super(arg1 * 1000, arg2);
        }
        public testMethod() {
            return `hooked! test method: ${this.arg1} - ${this.arg2}`;
        }
    }(arg1, arg2);
}]);

export {ContainerSpec};
