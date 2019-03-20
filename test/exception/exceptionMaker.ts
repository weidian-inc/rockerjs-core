export class ExceptionMaker {

    public throwException() {
        throw new CustomError("some exception occurs");
    }
}

export class CustomError extends Error {

    private msg;

    constructor(msg) {
        super(msg);
        this.msg = msg;
    }

    getErrorMsg() {
        return this.msg;
    }
}