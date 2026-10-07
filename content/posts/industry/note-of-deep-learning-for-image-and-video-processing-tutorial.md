---
title: "Note of Deep learning for image and video processing tutorial"
date: 2017-01-21
aliases:
  - "/blog/industry/2017-01-20-deep-learning-for-image-and-video-processing/"
---

> By Jon Shlens and George Toderici from Google Research @ 2017-01-20 Fri

* History

  + Convolutional NN: old tech, why suddenly it works?

    - Scale: 60M parameters
* At least 60M +1 data point to fit these parameters
* SIMD hardware (GPU)

  + Domain transfer

    - Use trained CNN (with large data set) on some other applications with limited data set
* CNN (convolutional neuron network)

  + Toy model of a neuron

    - Sum over weighted input + nonlinear activation function to output
    - Very little relationship with real neuron
  + Softmax classifier
  + Learning: cross-entropy loss (cost function)

    - Gradient descent with **back-propagation**
    - Optimization is HIGHLY non-convex, and works on O(1M) dimensions
  + Baseline task: MIST

    - Handwritten digits recoginition
    - Problem: input image size could blow up with more pixel
  + CNN arch fundamentals

    - Pre-choice parameter
* Size of the filter
* Stride: overlapping while sliding
* Padding: what to do at the edge
* Input depth / output depth (< 1024)

  + Learned by system
* The parameter inside the filter
* Advances in network arch

  + Types

    - AlexNet
    - Inception
    - BN-Inception
    - ResNet
  + 2 parts

    - Convolutional
* Less parameters, more computational intense

  + Fully connected
  + Themes in inception

    - Network-in-network
* Dimension reduction

  + Multi-scale
  + Covariate shifts

    - Batch normalization (BN)
* Image embedding and captioning

  + Embedding vs classification

    - Embedding: out-of-box information
  + Language model

    - Not words, but a sequence of words
  + RNN (recurrent neuron networks)

    - State is a function of previous state and inputs
    - Training
* Unrolling trick

  + Long short term memory (LSTM)
* Popular RNN
* Predicting in Pixel Space

  + Autoencoder: dimension reduction tool

    - Convolution encoder and decoder
    - Deconvolution: upconvolutions
* Video

  + Hard

    - Computantional intensive
    - Dataset is hard
