import { getMethodsByAnnotationName } from "../aspect"; 
export let SCOPE = {
    METHOD: "method",
    METHODS: "methods",
    PROTOTYPE_METHODS: "prototypeMethods",
    PROTOTYPE_OWN_METHODS: "prototypeOwnMethods",
};

export let JOIN_POINT = {
    AFTER: "__after",
    AFTER_RETURNING: "__afterReturning",
    AFTER_THROWING: "__afterThrowing",
    AROUND: "__around",
    BEFORE: "__before",
};

const adviceEnhancedFlagName = "__jsAspect_advice_enhanced",
    originalMethodFlagName = "__jsAspect_original_method",
    originalAdvice = "__originalAdvice",
    originalMethodKey = "__originalMethod";

/**
 * Creates join points at the passed pointcut and advice name.
 * @param {Object|Function} target The target or namespace, which methods want to be intercepted.
 * @param {jsAspect.SCOPE|Pointcut} pointcut Specifies where the properties are introduced on a target,
 * as a shortcut jsAspect.SCOPE value can be provided
 * @param {jsAspect.JOIN_POINT} joinPoint The chosen join point to add the advice code.
 * @param {Function} advice The code, that needs to be executed at the join point.
 * @param {String} [methodName] The name of the method that need to be advised.
 * @method inject
 * @returns {Object} jsAspect to allow chaining calls
 */
const inject = function(target, pointcut, joinPoint, advice, methodName?) {
    const scope = pointcut.scope || pointcut;
    const methodRegex = pointcut.methodRegex;
    const annotationName = pointcut.annotationName;

    const isMethodPointcut = (SCOPE.METHOD === scope);
    const isPrototypeOwnMethodsPointcut = (SCOPE.PROTOTYPE_OWN_METHODS === scope);
    const isPrototypeMethodsPointcut = (SCOPE.PROTOTYPE_METHODS === scope);
    /* istanbul ignore if */
    if (isMethodPointcut) {
        injectAdvice(target, methodName, advice, joinPoint);
    } else {
        target = (isPrototypeOwnMethodsPointcut || isPrototypeMethodsPointcut) ? target.prototype : target;
        if (annotationName) {
            const toInjectedMethodNames = getMethodsByAnnotationName(annotationName).map((fn) => fn.name);
            Reflect.ownKeys(target).forEach((method: string) => {
                const shouldInjectToMethod = (target.hasOwnProperty(method) || isPrototypeMethodsPointcut);
                const isNeedInjected = (toInjectedMethodNames as any).includes(method);

                if (shouldInjectToMethod && isNeedInjected) {
                    injectAdvice(target, method, advice, joinPoint);
                }
            });
        } else {
            // ES6 instantiation method can't be enum
            Reflect.ownKeys(target).forEach((method: string) => {
                const shouldInjectToMethod = (target.hasOwnProperty(method) || isPrototypeMethodsPointcut);
                const matchesMethodRegex = (methodRegex === (void 0)) || method.match(methodRegex);

                if (shouldInjectToMethod && matchesMethodRegex) {
                    injectAdvice(target, method, advice, joinPoint);
                }
            });
        }
    }
};

/**
 * Intercepts a single method with a join point and adds an advice.
 * @param target
 * @param methodName
 * @param advice
 * @param joinPoint
 * @private
 * @method injectAdvice
 */
function injectAdvice(target, methodName, advice, joinPoint) {
    if (isFunction(target[methodName])) {
        if (JOIN_POINT.AROUND === joinPoint) {
            advice = wrapAroundAdvice(advice);
        }
        if (!target[methodName][adviceEnhancedFlagName]) {
            enhanceWithAdvices(target, methodName);
            target[methodName][adviceEnhancedFlagName] = true;
        }
        if (JOIN_POINT.AFTER === joinPoint || JOIN_POINT.AFTER_RETURNING === joinPoint 
            || JOIN_POINT.AFTER_THROWING === joinPoint) {
            target[methodName][joinPoint].push(advice);
        } else {
            target[methodName][joinPoint].unshift(advice);
        }
    }
}

/**
 * Wraps an existing advice, to add a additional advice at the same join point.
 * @param advice
 * @returns {wrappedAdvice}
 * @method wrapAroundAdvice
 * @private
 */
function wrapAroundAdvice(advice) {

    const wrappedAdvice = function(executionContext, leftAroundAdvices) {
        const oThis = this,
            nextWrappedAdvice = leftAroundAdvices.shift(),
            args = toArray(arguments).slice(2);

        /* istanbul ignore if */
        if (executionContext.isStopped) {
            return;
        }

        if (nextWrappedAdvice) {
            const nextUnwrappedAdvice = function() {
                const argsForWrapped = toArray(arguments);
                argsForWrapped.unshift(leftAroundAdvices);
                argsForWrapped.unshift(executionContext);
                return nextWrappedAdvice.apply(oThis, argsForWrapped);
            };
            args.unshift(nextUnwrappedAdvice);
        }
        if (!advice.originalMethodFlagName) {
            args.unshift(executionContext);
        }
        return advice.apply(this, args);
    };

    // Can be useful for debugging
    wrappedAdvice[originalAdvice] = advice;
    return wrappedAdvice;
}

/**
 * Intercepts the target's method with all supported join points
 * @param target
 * @param methodName
 * @method enhanceWithAdvices
 */
function enhanceWithAdvices(target, methodName) {
    const originalMethod = target[methodName];

    originalMethod.originalMethodFlagName = true;

    target[methodName] = function() {
        const self = this,
            method = target[methodName],
            args = toArray(arguments),
            executionContext = new ExecutionContext(target, methodName, args);
        let returnValue = null;    

        applyBeforeAdvices(self, method, args, executionContext);
        try {
            returnValue = applyAroundAdvices(self, method, args, executionContext);
            if (returnValue instanceof Promise || 
                (returnValue && typeof returnValue.then === "function" && typeof returnValue.catch === "function")) {
                return returnValue.then((value) => {
                    applyAfterAdvices(self, method, args, executionContext);
                    return value;
                }).then((value) => {
                    return applyAfterReturningAdvices(self, method, value, executionContext);
                }).catch((exception) => {
                    applyAfterThrowingAdvices(self, method, exception, executionContext);
                });
            }
        } catch (exception) {
            return applyAfterThrowingAdvices(self, method, exception, executionContext);
        }
        applyAfterAdvices(self, method, args, executionContext);
        return applyAfterReturningAdvices(self, method, returnValue, executionContext);
    };
    
    target[methodName][originalMethodKey] = originalMethod;

    for (const joinPoint in JOIN_POINT) {
        if (JOIN_POINT.hasOwnProperty(joinPoint)) {
            target[methodName][JOIN_POINT[joinPoint]] = [];
        }
    }
    target[methodName][JOIN_POINT.AROUND].unshift(wrapAroundAdvice(originalMethod));
}

/**
 * restore the target's method without any advice
 * @param target
 * @param methodName
 * @method restoreWithoutAdvices
 * @returns boolean
 */
export function restoreWithoutAdvices(target: object, methodNameRegExp: string, pointCutTypeName: string): boolean {
    try {
        if (!pointCutTypeName) {
            Reflect.ownKeys(target).forEach((method) => {
                const matchesMethodRegex = (method as string).match(new RegExp(methodNameRegExp));
        
                if (!matchesMethodRegex) {
                    return;
                }
                const originMethod = target[method].__originalMethod;
                if (originMethod) {
                    target[method] = originMethod;
                }
            });
        } else {
            const toInjectedMethodNames = getMethodsByAnnotationName(pointCutTypeName).map((fn) => fn.name);
            Reflect.ownKeys(target).forEach((method: string) => {
                const isInjected = (toInjectedMethodNames as any).includes(method);

                if (isInjected) {
                    const originMethod = target[method].__originalMethod;
                    if (originMethod) {
                        target[method] = originMethod;
                    }
                }
            });
        }
        
    } catch (error) {
        return false;
    }
    return true;
}

/**
 * Adds the before-join point to add behaviour <i>before</i> the method is executed.
 * @param context
 * @param method
 * @param args
 * @param {ExecutionContext} executionContext
 * @method applyBeforeAdvices
 */
function applyBeforeAdvices(context, method, args, executionContext) {
    applyIndependentAdvices(method[JOIN_POINT.BEFORE], context, method, args, executionContext);
}

/**
 * Adds the join point to control the method execution manually (executed before the <i>before</i> join point).
 * @param context
 * @param method
 * @param args
 * @param {ExecutionContext} executionContext
 * @method applyAroundAdvices
 * @private
 * @returns {Function|Object}
 */
function applyAroundAdvices(context, method, args, executionContext) {
    const aroundAdvices = toArray(method[JOIN_POINT.AROUND]),
    firstAroundAdvice = aroundAdvices.shift(),
    argsForAroundAdvicesChain = args.slice();

    argsForAroundAdvicesChain.unshift(aroundAdvices);
    argsForAroundAdvicesChain.unshift(executionContext);
    return firstAroundAdvice.apply(context, argsForAroundAdvicesChain);
}

/**
 * Adds the join point to add behaviour <i>after</i> the method thrown an exception.
 * @param context
 * @param method
 * @param exception
 * @param executionContext
 * @method applyAfterThrowingAdvices
 * @private
 */
function applyAfterThrowingAdvices(context, method, exception, executionContext) {
    // without any after_throwing advice
    if (method[JOIN_POINT.AFTER_THROWING].length === 0) {
        throw exception;
    }
    applyIndependentAdvices(method[JOIN_POINT.AFTER_THROWING], context, method, [exception], executionContext);
}

/**
 * Adds the before-join point to add behaviour <i>before</i> the method is executed.
 * @param context
 * @param method
 * @param args
 * @param {ExecutionContext} executionContext
 * @method applyAfterAdvices
 */
function applyAfterAdvices(context, method, args, executionContext) {
    applyIndependentAdvices(method[JOIN_POINT.AFTER], context, method, args, executionContext);
}

/**
 * Adds the join point to add behaviour <i>after</i> the method returned a value or 
 * the method stopped working (no return value).
 * @param context
 * @param method
 * @param returnValue
 * @method applyAfterReturningAdvices
 * @returns {Object}
 */
function applyAfterReturningAdvices(context, method, returnValue, executionContext) {
    const afterReturningAdvices = method[JOIN_POINT.AFTER_RETURNING];

    return afterReturningAdvices.reduce(function(acc, current) {
        return !executionContext.isStopped ? current(executionContext, acc) : (void 0);
    }, returnValue);
}

/**
 * Applies advices which do not depend on results of each other if 'stop' was not called.
 * @param advices
 * @param context
 * @param method
 * @param args
 * @param {ExecutionContext} executionContext
 * @method applyAfterAdvices
 */
function applyIndependentAdvices(advices, context, method, args, executionContext) {
    advices.forEach(function(advice) {
        const adviceArguments = args.slice();

        adviceArguments.unshift(executionContext);

        if (!executionContext.isStopped) {
            advice.apply(context, adviceArguments);
        }
    });
}

/**
 * Type of the parameter, that is passed to the joinPoints. It contains information about the method and
 *  constructor itself.
 * @param target - object for a method of which the advice is being executed
 * @param methodName - name of the method being executed
 * @param args - arguments with which the method is being executed
 * @constructor
 */
class ExecutionContext {
    public target: object;
    public method: {
        name: string,
        arguments: any[],
    };
    public isStopped: boolean;
    
    constructor(target, methodName, args) {
        this.target = target;
        this.method = {
            arguments: args,
            name: methodName,
        };
        this.isStopped = false;
    }

    /**
     * Can be used to stop the method execution. For example:
     * <ul>
     * <li>In <i>before</i> join point to prevent method from execution</li>
     * <li>In <i>afterThrowing</i> to prevent any applied <i>after</i> advices from execution </li>
     * <li>In <i>around</i> to prevent returning a value from a method and prevent
     * any other advices from execution</li>
     * </ul>
     * @method stop
     */
    public stop() {
        this.isStopped = true;
    }
}

/**
 * An aspect contains advices and the target to apply the advices to.
 * Advices can be passed both as an array and specified as arguments to the constructor.
 * @param {Advice|Advice[]} advices
 *
 * @class Aspect
 * @constructor
 */
export class Pointcut {
    public scope: string;
    public methodRegex: RegExp;
    public annotationName: string = null;

    constructor(scope: string, methodRegex?: RegExp) {
        this.scope = scope;
        this.methodRegex = methodRegex;
    }
}

const DEFAULT_POINTCUT = new Pointcut(SCOPE.PROTOTYPE_METHODS);

/**
 * Generic advice class.
 * @param {JOIN_POINT} joinPoint
 * @param {function(Object, ...)} func
 * @param {jsAspect.SCOPE} scope optional scope
 * @class Advice
 * @constructor
 */
export class Advice {
    public joinPoint: string;
    public func: Function;
    public pointcut: Pointcut;

    constructor(joinPoint, func, scope) {
        this.joinPoint = joinPoint;
        this.func = func;
        this.pointcut = null;
        if (scope) {
            this.withPointcut(scope);
        }
    }

    public withPointcut(scope, methodRegex?: string) {
        this.pointcut = new Pointcut(scope, new RegExp(methodRegex));
        return this;
    }
}

/**
 * This advice is a child of the Advice class. It defines the behaviour for a <i>before</i> join point.
 * @param {function(Object, ...)} func
 * @param {jsAspect.SCOPE} scope optional scope
 *
 * @class Before
 * @extends Advice
 *
 * @constructor
 */
class Before extends Advice {
    constructor(func, scope) {
        super(JOIN_POINT.BEFORE, func, scope);
    }
}

/**
 * This advice is a child of the Advice class. It defines the behaviour for a <i>after</i> join point.
 * @param {jsAspect.SCOPE} scope optional scope
 * @param {function(Object, ...)} func
 *
 * @class After
 * @extends Advice
 *
 * @constructor
 */
class After extends Advice {
    constructor(func, scope) {
        super(JOIN_POINT.AFTER, func, scope);
    }
}

/**
 * This advice is a child of the Advice class. It defines the behaviour for a <i>afterReturning</i> join point.
 * @param {jsAspect.SCOPE} scope optional scope
 * @param {function(Object, ...)} func
 *
 * @class AfterReturning
 * @extends Advice
 *
 * @constructor
 */
class AfterReturning extends Advice {
    constructor(func, scope) {
        super(JOIN_POINT.AFTER_RETURNING, func, scope);
    }
}

/**
 * This advice is a child of the Advice class. It defines the behaviour for a <i>afterThrowing</i> join point.
 * @param {jsAspect.SCOPE} scope optional scope
 * @param {function(Object, ...)} func
 *
 * @class AfterThrowing
 * @extends Advice
 *
 * @constructor
 */
class AfterThrowing extends Advice {
    constructor(func, scope) {
        super(JOIN_POINT.AFTER_THROWING, func, scope);
    }
}

/**
 * This advice is a child of the Around class. It defines the behaviour for a <i>around</i> join point.
 * @param {jsAspect.SCOPE} scope optional scope
 * @param {function(Object, ...)} func
 *
 * @class Around
 * @extends Advice
 *
 * @constructor
 */
class Around extends Advice {
    constructor(func, scope) {
        super(JOIN_POINT.AROUND, func, scope);
    }
}

export interface IAspect {
    advices: any[];
    pointcut: Pointcut;
    withPointcut: (arg1: any, arg2: string) => any;
    withRegex: (arg1: any) => any;
    withAnnotation: (arg1: string) => any;
    applyTo: (...args) => any;
}

/**
 * An aspect contains advices and the target to apply the advices to.
 * Advices can be passed both as an array and specified as arguments to the constructor.
 * @param {Advice|Advice[]} advices
 *
 * @class Aspect
 * @constructor
 */
class Aspect implements IAspect {
    public advices: any[];
    public pointcut: Pointcut;

    constructor(advices: any[]) {
        this.advices = (advices instanceof Array) ? advices : toArray(arguments);
        this.pointcut = DEFAULT_POINTCUT;
    }

    public withPointcut(scope: string, methodRegex: string) {
        this.pointcut = new Pointcut(scope, new RegExp(methodRegex));
        return this;
    }

    public withRegex(methodRegex: string) {
        return this.withPointcut(this.pointcut.scope, methodRegex);
    }

    public withAnnotation(annotationName: string) {
        this.pointcut.annotationName = annotationName;
        return this;
    }

    /**
     * Applies this Aspect to the given target. If called with several arguments the Aspect
     * will be applied to each one of them
     * @param {...Advice}
     * @method applyTo
     */
    public applyTo(...targets) {
        this.advices.forEach((advice) => {
            targets.forEach((target) => {
                inject(target, this.pointcut, advice.joinPoint, advice.func);
            });
        });
    }
}

function isFunction(obj) {
    return obj && Object.prototype.toString.call(obj) === "[object Function]";
}

function toArray(args) {
    return [].slice.call(args, 0);
}

export let Advices = {
    after: After,
    afterReturning: AfterReturning,
    afterThrowing: AfterThrowing,
    around: Around,
    before: Before,
};

export let AspectClazz = Aspect;
