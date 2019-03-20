import { GeneralException } from "./general.exception";

export class AspectException extends GeneralException {
    constructor(msg?: string) {
        super(`
        AspectException has been detected, ${msg ? msg + "," : ""}
        `);
    }
}
