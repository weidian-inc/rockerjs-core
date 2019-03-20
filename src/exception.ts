const CatcherContainer: Map<ExceptionClamp, ExceptionClamp> = new Map();
const CatcherNameMap: Map<string, ExceptionClamp> = new Map();

interface IExceptionContext {
    context: object;
}

export abstract class ExceptionClamp {
    constructor(public name: string) {
    }
    public abstract catch(exception: Error, context: IExceptionContext): any;
}

/**
 * @description Class decorator, the class must extend abstract class ExceptionClamp
 * @param target 
 */
export function Clamp(target: ExceptionClamp | any): void | any {
    if (CatcherContainer.has(target)) {
        return;
    }
    CatcherContainer.set(target, new (target as any)());
    CatcherNameMap.set(target.name, target);
}

/**
 * @description  decorator, point out the clamp which handle the exception
 * @param target 
 */
export function Catch(clampName: string): void | any {
    const clampClazz = CatcherNameMap.get(clampName);
    const clampInstance = CatcherContainer.get(clampClazz);
    return function(target: Object, key: string, descriptor: PropertyDescriptor) {
        let clazz = null, originMethod = null;
        if (typeof target === "function") {
            // static method
            clazz = target;
            originMethod = clazz[key];
        } else {
            clazz = target.constructor;
            originMethod = clazz.prototype[key];
        }
        
        if (!clampInstance || typeof originMethod !== "function") {
            return;
        }

        return {
            configurable: false,
            enumerable: true,
            value(...args) {
                let returnVal = null;
                try {
                    returnVal = originMethod.call(this, ...args);
                    if (returnVal instanceof Promise || (returnVal && typeof returnVal.then === "function" && typeof returnVal.catch === "function")) {
                        return returnVal.catch((ex) => {
                            clampInstance.catch(ex, {
                                context: this,
                            });
                        });
                    }
                } catch (ex) {
                    clampInstance.catch(ex, {
                        context: this,
                    });
                }
                return returnVal;
            },
            writable: true,
        };
    };
}
