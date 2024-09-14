"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Person = exports.SOME_RANDOM_CONST = exports.House = exports.steve = exports.mike = exports.joe = void 0;
function joe(p) {
    if (p.name === "Joe") {
        return p;
    }
    else {
        return new Person("Joe");
    }
}
exports.joe = joe;
const mike = (p) => {
    if (p.name === "Mike") {
        return p;
    }
    else {
        const person = new Person("Mike");
        return person;
    }
};
exports.mike = mike;
const steve = function (p) {
    if (p.name === "Steve") {
        return p;
    }
    else {
        const person = new Person("Steve");
        return person;
    }
};
exports.steve = steve;
class House {
    person;
    constructor(person) {
        this.person = person;
    }
}
exports.House = House;
exports.SOME_RANDOM_CONST = 123;
class Person {
    name;
    house;
    make_house;
    constructor(name) {
        this.name = name;
        this.house = new House(this);
        this.make_house = (p) => {
            return new House(p);
        };
    }
    /**
     * @description Returns a greeting
     * @example
     * const person = new Person('Joe');
     * person.sayHello(); // Hello Joe
     */
    sayHello() {
        return "Hello " + this.name;
    }
    getHouse() {
        return this.house;
    }
}
exports.Person = Person;
//# sourceMappingURL=person.js.map