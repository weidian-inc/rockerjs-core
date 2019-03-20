abstract class Animal {

    abstract makeSound(): string;
}

class Dog extends Animal {

    makeSound(): string {
        return "woof";
    }
}

class Cat extends Animal {

    isOrangeCat: boolean;

    constructor(isOrangeCat: boolean) {
        super();
        this.isOrangeCat = isOrangeCat;
    }

    makeSound(): string {
        return "meow"
    }
}

class Sheep extends Animal {
    name: string;
    constructor(name: string) {
        super();
        this.name = name;
    }

    makeSound(): string {
        return "baa";
    }
}

export {Dog, Cat, Sheep};