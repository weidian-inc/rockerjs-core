export function isEmpty(v: any): boolean {
    return typeof v === "undefined" || v == null;
}

export function isFunction(fn): boolean {
    return !isEmpty(fn) && Object.prototype.toString.call(fn) === "[object Function]";
}

export function isClass(fn) {
    return typeof fn === "function" && /^\s*class\s+/.test(fn.toString());
}

export function getExtends(fn): object {
    return Object.getPrototypeOf(fn);
}

export function camelCase(str: string): string {
    return str.replace(/(?:-|_)([a-z])/g, function(all, letter) {
        return letter.toUpperCase();
    });
}
