---
title: "Course Note of Python Design Patterns"
date: 2017-05-17
aliases:
  - "/blog/note/2017-05-17-python-design-patterns-note/"
  - "/blog/tutorial/2017-05-17-python-design-patterns-note/"
---

> The course is on Coursera

## understanding design patterns

* what?
  + well-known solutions for recurring problems
* why?
  + don't reinvent wheels
  + reuse best practices
* characteristics
  + language neutral
  + dynamic
  + incomplete by design to promote customization
* types
  + creational
  + structual
  + behavioral
* OOP (object-oriented programming)
  + design pattern relies on OOP
  + attributes + methods
  + inheritence & polymorphism
* pattern context
  + participants and their rols
  + quality attributes: nonfunctional requirements
  + forces: various factors or trade-offs to consider
  + consequences: side effects by decision makers
* pattern language
  + name
  + context
  + problem
  + solution
  + related patterns

## creational patterns

### factory

* create and return object on the fly
  + flexibility of adding new classes
* problem
  + uncertainties in types of objects
  + runtime decision of types of objects

### abstract facotry

* a factory dynamically uses different factories to create objects on the fly
* problem
  + create a family of related objects at runtime
* concepts
  + abstract factory
  + concrete factory (the real factory used at runtime)

### singleton

* only one object from a class
* problem
  + cache information shared by multiple objects
