---
title: "Deep learning and Siri by Alex Acero @ Apple"
date: 2017-03-23
aliases:
  - "/blog/industry/2017-03-23-deep-learning-in-siri/"
---

# AI and ML

Artificial intellegence vs human intellegence
The imitation game, eugen Goosman passed the Turing Test, 2014
Alpha Go, deepmind 2015

# Introduction to deep learning

Improve on task T with respect to performance metric P based on experience E
Perceptron learning (one layer NN): a(i) = a(i-1) + n \* {target - output} \* A(i)
1974 multi-ayer perceptron with backpropagation training
​ deep learning is old tricks, more computing power, more data makes it possible and powerful
Binary classification
​ TouchID, speaker verification, face verification, emal spam, motion detection, credit card fraud
N-ary classifiction
​ MNIST (handwriting), speaker identification, word prediction (typing on iphone)
Deep learning for speech (Deng, 2010)

# Intro to Siri

Speech -> ASR -> NL (nature language) -> Dialog -> action (what to do)
​ +—-> TTS (text to speech)
Hands-free Siri: heySiri
​ low power audio processor makes it possible to listen all the time
Dictation
​ voice to text message
voicemail transcript
21 languages

# Deep learning in TTS

Concatenative TTS (vs. parametric synthesizer)
​ ———text processing ———| |——- signal processing ————–
​ Text -> text analysis -> prosody generation -> unit selection -> waveform concatenation -> speeck
​ unit database–^
​ unit database is the key
​ unit selection is also using DNN learning: target cost + concatenation cost
​ Acoustic features: prosodic, spectral
​ use parametric HMM synthesizer to predict spectral, and use concatenate engine to cat them together
​ Linguistic features: phoneme, syllable, word, phrase, utterance
​ Deltas/variance in the concatenation
Big differences from iOS9 to iOS10

# Automatic speech recoginition (accent)

en\_IN for india english speakers
“World english 1” for all varieties of english
“world english 2” mixed training data together

# Siri: bringing conversational agents mainstream

# Q&A

My question: is Siri running on dedicated chip or the general CPU?
Answer: there is a ultra-low power CPU core that is listening all the time waiting for “HeySiri” starting command, when it detected this signal, it will power up the main CPU for later work. After that, the input voice will be recorded and compressed, then send to online servers for voice recognition and so on. (I guess the TTS part is also the same, the runtime part of DNN is done on cloud servers and voice units are send back to phones). (So both the training and runtime are done on GPU farms)
