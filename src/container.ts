/**
 * IOC Container
 */
import { IoCException } from "./errors/ioc.exception";
import * as Util from "./util";

const globalGeneralProviders: Map<FunctionConstructor, Function> = new Map<FunctionConstructor, Function>();
const globalTypedProviders: Map<string, Map<FunctionConstructor, Function>> = new Map<string, Map<FunctionConstructor, Function>>();
const globalContainer: Map<string, object> = new Map();

/**
 * @description IoC Container
 * @className Container
 * @data 2019-03-11 11:03 
 */
export class Container {
    /**
     * @description export globalGeneralProviders
     * @returns Map<FunctionConstructor, Function>
     */
    public static getGeneralHashmap(): Map<FunctionConstructor, Function> {
        return globalGeneralProviders;
    }

    /**
     * @description export globalTypedProviders
     * @returns Map<FunctionConstructor, Map<FunctionConstructor, Function>>
     */
    public static getTypedHashmap(): Map<string, Map<FunctionConstructor, Function>> {
        return globalTypedProviders;
    }

    /**
     * @description export instance
     * @returns Object
     */
    public static getObject<T>(id: string): T {
        return (globalContainer.get(id) || void 0) as any;
    }

    /**
     * @description Provid type's implements factory
     * @param defAry defination of IoC, include "type and instantiation"
     */
    public static provides(...defAry: (Function | [Function, Function] | [String, Function, Function])[]) {
        defAry.forEach((def) => {
            /* istanbul ignore if */
            if (Array.isArray(def)) {
                if (def.length === 2 && Util.isFunction(def[0]) && Util.isFunction(def[1])) {
                    globalGeneralProviders.set((def[0]) as FunctionConstructor, def[1]);
                } else if (def.length === 3 && typeof def[0] === "string" && Util.isFunction(def[1]) && Util.isFunction(def[2])) {
                    globalTypedProviders.has(def[0] as string) ? globalTypedProviders.get(def[0] as string).set(def[1] as FunctionConstructor, def[2] as Function) 
                        : (globalTypedProviders.set(def[0] as string, new Map<FunctionConstructor, Function>()), globalTypedProviders.get(def[0] as string).set(def[1] as FunctionConstructor, def[2] as Function));
                } else {
                    throw new IoCException("Invalid type of params , should be  [Class, Function] | [String, Class, Function].");
                }
            } else {
                /* istanbul ignore next */
                if (!Util.isFunction(def)) {
                    throw new IoCException("Invalid Provider type, must be a class or a [class,function].");
                }
                /* istanbul ignore next */
                globalGeneralProviders.set(def as FunctionConstructor, function(...args) {
                    return factory(def as FunctionConstructor, ...args);
                });
            }
        });
    }

    public static injectClazzManually(target: FunctionConstructor|any, ...args: any[]) {
        return injectClazz(target, ...args);
    }

}

/**
 * @description the factory method of decorator, Inject an object into property|param
 * @param args decorator's params
 * @returns void | any
 */
export function Inject(...args: any[]): void | any {
    let params = args; 
    const fn = function(target: Function | object, key: string, descriptor: PropertyDescriptor) {
        const targetClazz: FunctionConstructor = (typeof target === "function" ? target : target.constructor) as FunctionConstructor;
        let dt: FunctionConstructor = Reflect.getMetadata("design:type", target, key);
        /* istanbul ignore next */
        if (!dt) {
            dt = Reflect.getMetadata("design:type", target.constructor, key);
        }
        // constructor doesn't have args, this case means @Inject annoation a Class
        if (typeof target === "function" && !key) {
            Container.provides([targetClazz, function(params: any[]) {
                // [InstanceName, arg1 ... argn]
                if (targetClazz.length + 1 === params.length && typeof params[0] === "string") {
                    const singletonName = params.shift();
                    const singleton = new targetClazz(...params);
                    globalContainer.set(singletonName, singleton);
                    return singleton;
                } else {
                    const singleton = new targetClazz(...params);
                    const clazzName = targetClazz.name;
                    globalContainer.set(clazzName.substring(0, 1).toLowerCase() + clazzName.substring(1), singleton);
                }
            }]);
            Container.injectClazzManually(targetClazz, params);
        } else {
            injectProperty(targetClazz, key, dt, params);
        }
        return;
    };

    if (args.length === 3
        && (typeof(args[0]) === "object" && typeof(args[0].constructor) === "function" // Instance property
            || typeof(args[0]) === "function") // Class property
        && typeof(args[1]) === "string") { // None parameters
        params = [];
        return fn.apply(null, args);
    } else if (args.length === 1 && typeof(args[0]) === "function" && Util.isClass(args[0])) {
        return fn.apply(null, args);
    } else {
        return fn;
    }
}

function injectProperty(target: Function, key: string, propertyType: FunctionConstructor, args: any[]) {
    const instanseName = `__${key}__`; // cache instanse
    Object.defineProperty(target.prototype, key, {
        enumerable: true,
        get() {
            let instanse = this[instanseName];
            if (!instanse) {
                const factoryFn = globalGeneralProviders.get(propertyType);
                if (factoryFn) {
                    instanse = factoryFn(...args);
                } else {
                    instanse = factory(propertyType, ...args);
                }
                this[instanseName] = instanse; // cache for singleton
            }
            return instanse;
        },
        set(properValue) {
            this[instanseName] = properValue;
        },
    });
}

function injectClazz(target: FunctionConstructor, ...args: any[]) {
    const instanseName = `__singleton__`; // cache instanse
    let instance = null;
    if (!target[instanseName]) {
        const factoryFn: Function = globalGeneralProviders.has(target) ? globalGeneralProviders.get(target)
            : globalTypedProviders.has(args[0]) && globalTypedProviders.get(args[0]).has(target) ? globalTypedProviders.get(args[0]).get(target) 
            : null;
        if (factoryFn) {
            instance = factoryFn(...args);
        } else {
            /* istanbul ignore next */
            throw new IoCException(`Class instantiation error, can't find the factory method`);
        }
        target[instanseName] = instance; // cache for singleton
    }
    return target[instanseName];
}

function factory(fn: FunctionConstructor, ...args: any[]) {
    try {
        if (args.length === 1 && typeof(args[0]) === "function") { // Parameters factory
            args = args[0]();
        }
        return new fn(...args);
    } catch (e) {
        /* istanbul ignore next */
        throw new IoCException("New instance of class\n\n" + fn + "\n,parameters:[" + args + "] error, message:" + e.toString());
    }
}
