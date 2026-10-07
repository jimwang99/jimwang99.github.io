---
title: "Use PCA (Principal Component Analysis) to do Clustering of Embeddings"
---

Let's consider a face recognition system, where we've got facial images from a list of known persons and the system input is a camera image. We need to figure out if there are people in this camera image from our list of known persons or not.
Face detection model is very commonly used. It gives bounding boxes of human faces and associated confidence numbers. We can use face detection model to find faces.
After faces are found and cropped, we then can use a face verification model to verify if input face is close to another reference face. The algorithm underneath is to represent the input face images as embedding vectors, and calculate the distance between these vectors.

The most common and simplest distance metric we use is cosine distance. It's simple a dot product of two vectors. If these two vectors are more similar / closer to each other, the scalar dot product is larger and closer to 1.0.
However, if we directly use the output of the face verification model, the cosine distance would be very subjective and it's hard for us to find a good threshold to give a binary result.

Today I'm going to discuss PCA (principle component analysis) using eigenvectors and eigenvalues, which can help to reduce noise of the output vector from face verification model and makes binary decision more accurate.

## PCA

PCA aims to transform a dataset with many features (or dimensions) into a smaller set of uncorrelated features, called principal components, that capture the most variance in the data. In our example, we don't reduce the dimension but instead use PCA to capture the most variance in the data.

### Create covariance matrix

```Python
import numpy as np

vector = np.random.rand(10, 1)

# normalize
vector -= np.mean(vector)

covariance_matrix = np.dot(vector, vector.T) / vector.shape[0]
```

### Calculate eigenvectors and eigenvalues

```Python
eigenvalues, eigenvectors = np.linalg.eigh(covariance_matrix)
top_eigenvector = eigenvector[-1]
```

After getting input vector's top eigenvector, you can directly use it to calculate cosine distances from other top eigenvectors.

## Why Eigenvectors Are Important

- **Eigenvectors define directions of maximum variance:** Eigenvectors identify and represent the directions in which the data varies the most.
- **Eigenvectors provide uncorrelated features:** The projection onto eigenvectors results in uncorrelated features, making further analysis easier and more accurate.
- **The same mechanism can be used to reduce dimension:** By selecting the top k eigenvectors, the same PCA mechanism reduces the dimensionality of the data while preserving its structure and variance.
