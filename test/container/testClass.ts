class TestClass {

    arg1: number;
    arg2: string;

    constructor(arg1: number, arg2: string) {
        console.log(`construct testClass, arg1: ${arg1}, arg2: ${arg2}`);

        this.arg1 = arg1;
        this.arg2 = arg2;
    }

    public testMethod() {
        return `test method: ${this.arg1} - ${this.arg2}`;
    }
}

export {TestClass}