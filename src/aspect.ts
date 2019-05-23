import { Container } from "./container";
import { SCOPE, JOIN_POINT, restoreWithoutAdvices, Advice, Advices, IAspect, AspectClazz} from "./aop";
import { camelCase } from "./util";
import { AspectException } from "./errors/aspect.exception";
const ASPECT_TAG = "aspect";
const AspectContainer: Map<FunctionConstructor, object> = new Map();
const ADVICE_TYPES: string[] = Object.keys(JOIN_POINT).map((s) => s.toLowerCase());
const ADVICE_NAMES: string[] = (Object as any).values(JOIN_POINT).map((s) => s.toLowerCase());
const ASPECT_ORDER_KEY = "__order";
const ASPECT_KEY = "__aspect";
const ADVICE_KEY = "__advice";

interface IAdvice {
    advice: Advice;
    name: string;
}

interface IPointcut {
    clazz?: FunctionConstructor | Function;
    rules?: string;
    execution?: [FunctionConstructor | Function, string];
    advices?: string[];
    scope?: "static" | "prototype";
}

interface IComposeAspectsOptions {
    clazz?: FunctionConstructor | Function;
    rules?: string;
    execution?: [FunctionConstructor | Function, string];
    aspects: object[]; // item should be path or object
}

const AnnotionTypeMap: Map<string, Function> = new Map();
const AnnotationMethodMap: Map<Function, Function[]> = new Map();

export function AnnotationFactory(pointcutType: string): Function {
    if (AnnotionTypeMap.has(pointcutType)) {
        return AnnotionTypeMap.get(pointcutType);
    } else {
        const fn = function(target: Function, key: string, descriptor: PropertyDescriptor) {
            const methodOnPointcut = AnnotationMethodMap.has(fn) ? AnnotationMethodMap.get(fn) : [];
            methodOnPointcut.push(descriptor.value);
            AnnotationMethodMap.set(fn, methodOnPointcut);
        };

        AnnotionTypeMap.set(pointcutType, fn);
        return fn;
    }
}

export function getMethodsByAnnotationName(annotationName: string): Function[] {
    return AnnotationMethodMap.get(AnnotionTypeMap.get(annotationName));
}

export function Aspect(...args: any[]): void | any {
    if (args.length === 1
        && typeof(args[0]) === "function") { 
        // noop
    } else if (args.length === 1 
        && typeof(args[0]) === "object") {
        const order = args[0].order;
        return function(target: FunctionConstructor) {
            const aspectInstance = AspectContainer.get(target);
            if (order) {
                aspectInstance[ASPECT_ORDER_KEY] = order;
            } else {
                aspectInstance[ASPECT_ORDER_KEY] = 0;
            }
        };
    }
}

export function composeAspects(options: IComposeAspectsOptions) {
    let { clazz, aspects } = options;
    const { rules, execution } = options;
    let pointCutTypeName: string = null;
    /* istanbul ignore if */
    if ((typeof clazz !== "function" && typeof execution[0] !== "function") || (!clazz && !execution)) {
        throw new AspectException(`Pointcut must provide clazz property`);
    } else {
        !clazz ? (clazz = execution[0], pointCutTypeName = (execution[1] as string)) : null;
    }

    if (restoreWithoutAdvices(clazz.prototype, rules || "", pointCutTypeName)) {
        aspects = aspects.sort((a, b) => {
            if (AspectContainer.has(a as FunctionConstructor) && AspectContainer.has(b as FunctionConstructor)) {
                a = AspectContainer.get(a as FunctionConstructor);
                b = AspectContainer.get(b as FunctionConstructor);
            }
            return (+b[ASPECT_ORDER_KEY] - (+a[ASPECT_ORDER_KEY]));
        });
        aspects.map((asp) => {
            if (AspectContainer.has(asp as FunctionConstructor)) {
                asp = rules ? AspectContainer.get(asp as FunctionConstructor)[ASPECT_KEY][clazz as any][rules] : 
                AspectContainer.get(asp as FunctionConstructor)[ASPECT_KEY][clazz as any][pointCutTypeName];
            }
            if (rules) {
                (asp as IAspect).withRegex(rules).applyTo(clazz);
            } else if (!rules && pointCutTypeName) {
                (asp as IAspect).withAnnotation(pointCutTypeName).applyTo(clazz);
            } else {
                (asp as IAspect).applyTo(clazz);
            }
        });
    }
}

function initAspect(clazz: FunctionConstructor, ...args: any[]) {
    if (!AspectContainer.has(clazz)) {
        Container.provides([ ASPECT_TAG, clazz, function() {
            const aspectInstance = new clazz();
            // advices map
            aspectInstance[ADVICE_KEY] = {};
            // aspect map 
            aspectInstance[ASPECT_KEY] = {};
            ADVICE_NAMES.forEach((adviceName) => {
                aspectInstance[adviceName] = ([] as IAdvice[]);
            });
            AspectContainer.set(clazz as FunctionConstructor, aspectInstance);
        }]);
        // instantiate clazz
        Container.injectClazzManually(clazz as FunctionConstructor, ASPECT_TAG, ...args);
    }
}

function adviceHandler(adviceType: "before"|"after"|"after_throwing"|"after_returning"|"around", target: FunctionConstructor | Object, key: string): void | any {
    const targetClazz: FunctionConstructor = (typeof target === "function" ? target : target.constructor) as FunctionConstructor;
    initAspect(targetClazz);
    const targetProto = targetClazz.prototype;
    const specAdvice = new Advices[camelCase(adviceType)](targetProto[key].bind(AspectContainer.get(targetClazz)), SCOPE.PROTOTYPE_METHODS); 
    AspectContainer.has(targetClazz) ? (AspectContainer.get(targetClazz)[(JOIN_POINT[adviceType.toUpperCase()]).toLowerCase()].push({ 
        advice: specAdvice,
        name: key,
    } as IAdvice), AspectContainer.get(targetClazz)[ADVICE_KEY][`${adviceType}:${key}`] = specAdvice) : null;
}

/**
 * @description method's decorator, the method could be static member or instance member
 * @param target 
 * @param key 
 * @param descriptor 
 */
export function Before(target: FunctionConstructor | Object, key: string, descriptor: PropertyDescriptor): void | any {
    adviceHandler("before", target, key);
}

/**
 * @description method's decorator, the method could be static member or instance member
 * @param target 
 * @param key 
 * @param descriptor 
 */
export function After(target: FunctionConstructor | Object, key: string, descriptor: PropertyDescriptor): void | any {
    adviceHandler("after", target, key);
}

export function After_Throwing(target: FunctionConstructor | Object, key: string, descriptor: PropertyDescriptor): void | any {
    adviceHandler("after_throwing", target, key);
}

export function After_Returning(target: FunctionConstructor | Object, key: string, descriptor: PropertyDescriptor): void | any {
    adviceHandler("after_returning", target, key);
}

/**
 * @description method's decorator, the method could be static member or instance member
 * @param target 
 * @param key 
 * @param descriptor 
 */
export function Around(target: FunctionConstructor | Object, key: string, descriptor: PropertyDescriptor): void | any {
    adviceHandler("around", target, key);
}

export function Pointcut(options: IPointcut): void | any {
    let { clazz, scope } = options;
    const { rules, execution, advices } = options;
    scope ? null : scope = "prototype";
    let pointCutTypeName: string = null;

    // Array.isArray(advices) && (advices = advices.map((it) => {
    //     return it.toLowerCase();
    // }));

    /* istanbul ignore if */
    if ((typeof clazz !== "function" && typeof execution[0] !== "function") || (!clazz && !execution)) {
        throw new AspectException(`Pointcut must provide clazz property`);
    } else {
        !clazz ? (clazz = execution[0], pointCutTypeName = execution[1] as string) : null;
    }

    return function decorator(target: FunctionConstructor | Object, key: string, descriptor: PropertyDescriptor) {
        const targetClazz: FunctionConstructor = (typeof target === "function" ? target : target.constructor) as FunctionConstructor;
        const aspectInstance = AspectContainer.get(targetClazz);
        let aspects: Advice[] = [],
        aspect: IAspect = null;
        /* istanbul ignore if */
        if (!aspectInstance) {
            throw new AspectException(`Can't find class instance [${targetClazz.name}] at Pointcut`);
        }

        if (!advices || advices.length === 0) {
            ADVICE_NAMES.forEach((adviceName) => {
                const data: IAdvice[] = aspectInstance[adviceName];
                aspects = aspects.concat(data.map((it) => it.advice));
            });
        } else {
            advices.forEach((adviceName) => {
                // todo: 过滤 advices: before before:ac
                if ((ADVICE_TYPES as any).includes(adviceName)) {
                    aspects = aspects.concat(aspectInstance[(JOIN_POINT[adviceName.toUpperCase()]).toLowerCase()].map((item) => item.advice));
                } else if (adviceName.indexOf(":") !== -1) {
                    const specailAdvice = AspectContainer.get(targetClazz)[ADVICE_KEY][adviceName as any];
                    specailAdvice ? aspects = aspects.concat(specailAdvice) : null;
                }
            });
        }
        
        aspect = new AspectClazz(aspects.reverse());
        // save aspect
        if (aspectInstance[ASPECT_KEY][clazz as any]) {
            // rules or exacuation
            rules ? (aspectInstance[ASPECT_KEY][clazz as any][rules] = aspect) : (aspectInstance[ASPECT_KEY][clazz as any][pointCutTypeName] = aspect);
        } else {
            rules ? (aspectInstance[ASPECT_KEY][clazz as any] = {
                [rules]: aspect,
            }) : (aspectInstance[ASPECT_KEY][clazz as any] = {
                [pointCutTypeName]: aspect,
            });
        }

        if (scope === "prototype") {
            if (rules && !pointCutTypeName) {
                aspect.withRegex(rules).applyTo(clazz);
            } else if (!rules && pointCutTypeName) {
                aspect.withAnnotation(pointCutTypeName).applyTo(clazz);
            } else {
                aspect.applyTo(clazz);
            }
        } else if (scope === "static") {
            if (rules && !pointCutTypeName) {
                aspect.withRegex(rules).withPointcut(scope, rules).applyTo(clazz);
            }
        }
    };
}
