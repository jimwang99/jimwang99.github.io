---
title: "IDF (Intel Developer Forum) 2015 San Francisco, Moscone Center"
date: 2015-07-01
aliases:
  - "/blog/industry/2015-07-01-idf-2015/"
---

* Intel IoT platform
  + Intel IoT Platform
    - Sensors and things
      * Arduino
    - Gateway
      * transfer data between different types of networks
      * some data processing as well
      * moving quickly: different types of data
      * flexibility is important for scalability
      * PMA: protocol mapper and adapter (UPAL)
    - Security
      * not only data, but also physical security
    - data storage
      * physically distributed
      * depend on the data types, and there are so many of them
      * different users use the same data in many different ways
        + provide different sets of APIs at business level
  + Real world IoT challenges
    - 3 major areas
      * connected things and devices
      * intelligence and the edge
      * turn data in to insight
    - different applications
      * cities: e.g. drain block sensor network
        + connected things and devices
          - regulatory:delay tolerance
          - harsh conditions: device robust
          - long distance: zigbee is not useful anymore
          - security
        + intelligence ant ht edge
          - low power
          - OOB ML
          - sensor fusion
        + turn data into insight
          - diverse ecosystem
          - multiuse data
          - data ownership
      * smart grid
        + high freq
        + extreme reliabliity
          - challenging environment
        + manageablity
        + security
        + demand response
        + actuation
        + data privacy
        + data volumen
        + public/private
      * industrial
        + legacy integration
          - very old implementation
        + multi-protocols
        + zero downtime
        + security
          - multi million equipments
        + bespoke feeds
        + data translation
        + ML customisation
        + enterprise/network
        + integration
        + business rules
  + Smart cities
    - future of flood management
      * approach
        + work with cicies
          - city managers have the requirements and most of the experience
        + prototype
          - Intel IoT gateway: extend the life of equipment by make use of old equipments that already exists
          - custom flood detecting sensor
          - software and simulation in matlab (openTSDB)
        + deploy and iterate
          - deploy the implementation is time consuming and fruastrating for engineers
          - iteration is important for this kind of experiment projects
  + Smart grids: enernet
    - put sensors in families and get their energy usage profiles
    - and make use of these data
  + Data center
    - to increase visibility to resource usage
* Data analytics and machine learning Intel fellow
  + what is machine learning
    - a computer program learns, if tis performance improves with experience, Tom Mitchell
    - 3 types
      * superviesed learning: large amount of learning data, and people label data out
      * unsupervised learning: make inferences without labeled data
      * reinforcement learning: act in an env to maximize reward, real learning process
  + why now, tech is decades old, why sudden hot now
    - machine makes real decisions now
    - big opportunity: extract value from data. things x data = value
  + relationship to other workloads
    - similar to high performance computing, and showing more and more similarities
    - traditional: inside-out process
    - emerging: outside-in process, from data to knowledge
    - machine learning combines both of these 2 processes
    - models
      * algorithms
        + database primitives
        + graph algo
        + machine learning
        + numeric cmputing
  + intel architecture-specific optimization
    - key msg
      * machine learning is the most significant emergin algorithm class today
      * publicly available code is highly inefficent in terms of its parallelism-awareness
      * code modernization: signle-node or distributed
      * enhance both processor and tool chain
    - how intel tools accelerate machine learning
    - why deep learning is so exciting
      * shallow learning: one layer
      * deep network layers can apply to parallelism
      * go deeper in the layers, the system learn and got more clear idea of the target
    - Intel Xeon + FPGA (from Altera)
* Internet of things software standards unscrambled
  + Creating a Model
  + Simple Layer Model
    - application and service <-> data & control points
    - profiles, data & resource models
      * how IoT devices are represetned to app and servcies
      * how app and servcie interact vith the represetnations
    - comms protocols <->
      * high level protocols, multi-layers
    - transports <->
      * physical layers and low level protocols
  + standards for locao IP, internet and cloud
    - local to local via internet?
    - cloud to cloud connect?
  + deliverables
    - traditional standard
      * specification
      * certification
    - code
      * for developers, open source projects, de facto standard
  + IP
    - trademark
    - copyright
    - patent
  + standard
    - intel is behind both IIC & OIC
    - open source is changing the formation of standard. so intel is contributing open source code
  + Future?
    - never be one standard to rule them all
    - recurring themes
      * consistency
      * low power and constrained services
      * security
        + machine to machine communication
        + different user/admin will have different level of access
    - IP, REST-based
    - cooperation
      * interoperation
      * collaboration
      * consolidation
* Realsense
  + 3D camera and develope kit
* IoT (windriver & VxWorks)
  + 2015 is the peak of inflated expectations
  + tech wave: 1B+ desktop internet » 10B+ mobile device » 50B+ IoT
  + 2 business interests
    - optimization
      * new efficientcies: more data of things that cannot collectable before
    - transformation
      * new revenue streams
      * transitionsing business models
      * positive shifts in value creation and value capture
  + how to get started with IoT
    - platform, integrited from left (things) to right (cloud)
      * things side
        + embedded system
      * gateway
      * cloud side
        + network
        + data center
        + cloud analytics
    - secure from end to end: edge-to-enterprise
