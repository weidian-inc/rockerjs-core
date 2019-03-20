import { AnnotationFactory } from '../../';

export class HookedClass {

    hookedMethod() {
        console.log("executing method...");
        return 1;
    }

    async hookedMethodAsync() {
        console.log("executing async method...");
        return 1;
    }

    hookedExceptionMethod() {
        throw new Error('exception occurs...');
    }

    exceptionMethod() {
        throw new Error('exception occurs...');
    }

    async hookedExceptionAsyncMethod() {
        throw new Error('exception occurs...');
    }

    otherMethod() {
        console.log("executing other method...");
        return 1;
    }

    @AnnotationFactory('marked')
    markedMethod() {
        console.log("executing marked method...");
        return 1;
    }

    @AnnotationFactory('marked')
    async markedMethodAsync() {
        console.log("executing async marked method...");
        return 1;
    }

    @AnnotationFactory('marked')
    markedExceptionMethod() {
        throw new Error('exception occurs in marked method...');
    }

    @AnnotationFactory('marked')
    async markedExceptionAsyncMethod() {
        throw new Error('exception occurs in async marked method...');
    }
}