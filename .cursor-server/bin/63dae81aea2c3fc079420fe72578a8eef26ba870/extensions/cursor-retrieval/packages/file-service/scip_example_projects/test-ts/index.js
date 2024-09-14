"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const person_1 = require("./person");
console.log((0, person_1.joe)(new person_1.Person("Joe")).sayHello());
console.log((0, person_1.mike)(new person_1.Person("Mike")).sayHello());
console.log((0, person_1.steve)(new person_1.Person("Steve")).sayHello());
console.log(person_1.SOME_RANDOM_CONST);
//# sourceMappingURL=index.js.map