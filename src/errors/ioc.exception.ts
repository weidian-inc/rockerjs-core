import { GeneralException } from "./general.exception";

export class IoCException extends GeneralException {
    constructor(msg?: string) {
        super(`
        IoCException has been detected, ${msg ? msg + "," : ""}
        `);
    }
}
