export declare class Error {
    public name: string;
    public message: string;
    public stack: string;
    constructor(message?: string);
}
  
export class GeneralException extends Error {
    constructor(private readonly msg = ``) {
        super(msg);
    }

    public desc() {
        return this.msg;
    }
}
