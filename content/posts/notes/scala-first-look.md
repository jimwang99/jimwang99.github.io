---
title: "Scala First Look"
date: 2017-05-14
aliases:
  - "/blog/note/2017-05-14-scala-first-look/"
  - "/blog/tutorial/2017-05-14-scala-first-look/"
---

> Scala introduction course on LinkedIn. Not very useful, if not using it in real project.

# introduction

* short for Scalable language
* object-oriented + functional programming
  + everything is object
    - including numbers and functions
    - does not include primitive data types
  + can pass/assign function: functional programming
* seamless compatible with Java
  + runs on JVM, compile to JVM
  + reuse Java libraries and types
  + can call any Java code
* REPL interactive shell
  + read, eval, print, loop

# syntax

* define: `var` (variable) vs `val` (value)
  + `var` defines variables that can be changed
    - but cannot change from one data type to another, ex. from Int to Double
  + `val` defines variables that cannot be changed (immutable)
    - such as string, char
* TIPS: worksheet
  + while save, output result of every line of code to source file as comment
* underscore `_` is a special char in Scala, so it cannot be used in variable name

## data type

* Any
  + AnyVal
    - Int
    - Double
    - Boolean
    - …
  + AnyRef
    - String
    - Vector
    - Array
    - …
* Null
* Nothing

## repetition statements

* `while`
* `for`
  + iterate a list: `for (f <- lsFruit)`
    - unpacking: `for ( (a, b) <- lsFruit )`
  + filtering
    - `for (f <- lsFruit if (f.startswith("c")))`
    - `for (n <- 1 to 10; e = n % 2; if e == 0)`
  + nested for loop: `for (i <- 1 to 5; j <- 1 to 5)`
    - `to` in Scala is different from Python: `1 to 5` gives 1, 2, 3, 4, 5
    - `until` in Scala is the same with Python: `1 until 5` gives 1, 2, 3, 4

## function vs method

* function is a complete object, that can be assigned to a variable
* method is a part of a class which has a name ans signature
* void function: return Unit

## special function

* call by value vs call by name

```
def something() = {
  5 // return value
}
de callByValue(x: Int) = {  // something is run once, and pass return value "5" to x
  println("x1 = " + x)
  println("x2 = " + x)
}
callByValue(something())
def callByName(x: => Int) = {
  println("x1 = " + x)  // something ran once
  println("x2 = " + x)  // something ran again
}
callByName(something())
```

* anonymous function

```
((x: Int) => x + 1)(5)  //> res0: Int = 6
```

* high order function

```
var y = 5
val f = (x: Int) => (x + y) // here, y is going to use y=5 which already exists
```

## decision

* `if`
* `match` = case/switch

## set and map

* both immutable
* set: automatically unique
* map: key to value pairs
  + `var m = Map("key1"->value1, "key2"->value2)`
  + add new item: `m += “key3”->value3
  + remove item: `m -= "key1"`

## array

* index by numbers from 0
* `var a = Array[String](6)`

## list

* immutable
* concatenate use `:::`

## class

* case class

## singleton: object

* object: create a anonymous class and one of its instance
