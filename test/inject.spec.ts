import {Container, Inject} from '..';
import  {contextConfiguration, Test, run, OnlyRun, Describe, before, after} from '@rockerjs/tsunit';
import * as chai from 'chai'
import {Cat, Dog, Sheep} from "./inject/animal";

const expect = chai.expect;

@Inject
class AnimalUtilDefault {
    time: Date;
    animalTypes: string[];

    constructor(time, types) {
        this.time = time;
        this.animalTypes = types;
    }

    @Inject
    public dog: Dog;

    @Inject(true)
    public cat: Cat;
}

@Inject(new Date(), ['dog','cat'])
class AnimalUtil {
    time: Date;
    animalTypes: string[];

    constructor(time, types) {
        this.time = time;
        this.animalTypes = types;
    }

    @Inject
    public dog: Dog;

    @Inject(true)
    public cat: Cat;
}

@Inject('utils', new Date(), ['dog','cat'])
class AnimalUtil2 {
    time: Date;
    animalTypes: string[];

    constructor(time, types) {
        this.time = time;
        this.animalTypes = types;
    }

    @Inject
    public dog: Dog;

    @Inject(true)
    public cat: Cat;
}

class InjectSpec {

    @Inject
    private dog: Dog;

    @Inject(true)
    private cat: Cat;

    @Inject(function() {
        return ['dolly'];
    })
    private sheep: Sheep;

    @Test('test inject')
    async testInjectSuccess() {
        expect(this.dog).to.exist;
        expect(this.cat).to.exist;
        expect(this.sheep).to.exist;
    }

    @Test('test instance')
    async testInstance() {
        expect(this.dog).to.be.instanceof(Dog);
        expect(this.cat).to.be.instanceof(Cat);
        expect(this.sheep).to.be.instanceof(Sheep);
    }

    @Test('test referencing')
    async testReferencing() {
        expect(this.cat).to.have.property("isOrangeCat");
        expect(this.cat).to.have.property("isOrangeCat", true);
        expect(this.sheep).to.have.property("name");
        expect(this.sheep).to.have.property("name", 'dolly');
    }

    @Test('test method')
    async testMethod() {
        expect(this.dog.makeSound()).to.equal("woof");
        expect(this.cat.makeSound()).to.equal("meow");
        expect(this.sheep.makeSound()).to.equal("baa");
    }

    @Test('test assignment')
    async assign() {
        let dog = {name: 'Samoyed'};
        this.dog = <any>dog;
        expect(this.dog).equal(dog);
    }

    @Test('test instance from container default')
    async testContainerDefault() {
        expect(Container.getObject<AnimalUtil>('animalUtilDefault').dog.makeSound()).to.equal("woof");
        expect(Container.getObject<AnimalUtil>('animalUtilDefault').cat.makeSound()).to.equal("meow");
    }

    @Test('test instance from container')
    async testContainer() {
        expect(Container.getObject<AnimalUtil>('animalUtil').dog.makeSound()).to.equal("woof");
        expect(Container.getObject<AnimalUtil>('animalUtil').cat.makeSound()).to.equal("meow");
    }

    @Test('test instance from container with name')
    async testContainerWithName() {
        expect(Container.getObject<AnimalUtil>('utils').dog.makeSound()).to.equal("woof");
        expect(Container.getObject<AnimalUtil>('utils').cat.makeSound()).to.equal("meow");
    }
}

export {InjectSpec};