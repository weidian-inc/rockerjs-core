import {Catch, Clamp, ExceptionClamp} from "../index";
import {Inject} from '../index';
export { ExceptionClamp, Clamp, Catch } from '../src/exception';
import  {contextConfiguration, Test, run, OnlyRun, Describe, before, after} from '@rockerjs/tsunit';
import * as chai from 'chai'
import {CustomError, ExceptionMaker} from "./exception/exceptionMaker";

const expect = chai.expect;

@Clamp
@Clamp
class Clamper extends ExceptionClamp {
    catch(ex, ctx) {
        console.log('catch some exceptions: \n', ex, ctx);
    }
}

class ExceptionInject {

    @Inject
    private exceptionMaker: ExceptionMaker;

    @Inject
    static staticExMaker: ExceptionMaker;

    @Catch('Clamper')
    testException() {
        expect(this.exceptionMaker.throwException()).to.throw(CustomError);
    }

    @Catch('Clamper')
    async testAsyncException() {
        this.exceptionMaker.throwException();
    }


    @Catch('Clamper')
    static testStaticException() {
        expect(this.staticExMaker.throwException()).to.throw(CustomError);
    }

    @Catch('Clamper')
    normalFunction() {
        return "this is a normal function";
    }
}

export {ExceptionInject};