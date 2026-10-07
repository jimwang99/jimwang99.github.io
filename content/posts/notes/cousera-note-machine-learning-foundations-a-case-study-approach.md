---
title: "[Cousera Note] Machine Learning Foundations A Case Study Approach"
date: 2015-10-20
aliases:
  - "/blog/machine-learning/2015-10-20-machine-learning-foundations-coursera/"
  - "/blog/ml/2015-10-20-machine-learning-foundations-coursera/"
  - "/blog/note/2015-10-20-machine-learning-foundations-coursera/"
---

* 1 Week1: Welcome
  + 1.1 Introduction
    - 1.1.1 real world case based
      * - regression: house price prediction
      * - classificiation: sentiment analysis
      * - clustering & retrieval: finding doc
      * - maxtrix factorization & dimensionality reduction: recommending products
    - 1.1.2 requirement
      * math: calculas & algebra
      * python
    - 1.1.3 capstone project
  + 1.2 iPython Notebook
    - Python command and its outputs
    - Markdown for doc
  + 1.3 SFrames
    - 1.3.1 GraphLab Canvas
      * - any data structure \*.show() » data visualization web page. make it inline of iPython Notebook:
        + graphlab.canvas.set\_target(‘ipynb’)
      * - create new column
        + sf[‘Full Name’] = sf[‘First Name’] + ' ' + sf[‘Last Name’]
      * - apply function
        + sf[‘Country’] = sf[‘Country’].apply(transform\_country)
* 2 Week2: Regression case: predicting house prices
  + 2.1 Linear regression modeling
    - 2.1.1 recent sales in nearby neighbourhood
      * x = sqft, feature / covariate / predictor / indepentent varaible
      * y = price, observation / response
    - 2.1.2 look at average price in range
      * limited hits
      * throwing out other information: it’s bad
    - 2.1.3 linear regression
      * fw(x) = w0 + w1\*x
        + - w0 = intercept
        + - w1 = slope
        + - w0/w1 are parameters of our model, w = (w0,w1); also called regression coefficients
      * different parameter set w; choose w is important
      * \*\* RSS = residual sum of squares \*\*
        + - delta = Y of observation - Y from prediction
        + - RSS = sum(all possible delta^2)
        + - minimize RSS(w0,w1) and solve it, get you w’
        + - then y’ = w0’ + w1’ \* x of my house
    - 2.1.4 adding higher order effects
      * straight line is good enough?
        + maybe not a linear relationship, rather a quadratic function
      * quadratic
        + fw(x) = w0 + w1*x + w2*x^2
          - still linear regression, x^2 is just another feature
      * higher order polynomial? 13th order polynomial to minimize RSS
        + this function just looks crazy
        + overfitting
  + 2.2 Evaluating regression models
    - evaluating overfitting via training/test split
      * min RSS » bad prediction
      * how to choos model order/complexity?
        + goal: good predictions
        + simulate predictions
          - step 1. remove some data points
          - step 2. fit model on remaining
          - step 3. predict heldout houses
            * use model to predict those removed data points (in step 1), and see how accurate they are
        + need extra test data
      * terminology
        + training set / test set
        + training error = RSS of all training data points, minimize it to find w’
        + test error = RSS of all test data points with w’
    - training/test curves: model complexity vs. error
      * training curves: the higher model complexity is, smaller the error gets
      * test curves: probably will look like a U, which has optimized lowest value
      * w2\_training\_test\_curves.png
    - add other features
      * for houses as an example, # of bedrooms as x2
        + fitting an 3D surface
      * how many features to use? unlimited! hold there and more info in the “regression” course
      * always more feature the better to capture underlying process? NO
    - other regression examples
      * stock prediction
        + recent history
        + news events
        + related commodities
      * temp of smart house
        + spatial function
        + thermostat setting/ blinds / window / vents / temp outside / time of day
  + 2.3 Summary
    - regression ML block diagran ML pipepline: data » ML method » intelligence
      * w2\_regression\_ML\_model.png
  + 2.4 Predict house prices (iPython Notebook example)
    - Loading & exploring house sale data
      * graphlab.SFrame(‘xxx.gl.zip’)
        + - SFrame: table data structure in graphlab
        + - here xxx.gl.zip is some presist data dumped out by graphlab
      * SFrame.show(view="Scatter\_plit”, x="column1”, y="column2”)
    - Split data into training and test data sets
      * SFrame.random\_split(float,seed=int) » (training\_data, test\_data)
    - Build regression model
      * model = graphlab.linear\_regression.create(traning\_data, target='column1’, features=list(‘column2’, ‘column3’))
        + - target: variable you try to predict
        + - features
        + - algorithm chosed automatically
    - Evaluating error
      * model.evaluate(test\_data)
        + a simple model gives high error and high RMSE (root mean square error)
        + RMSE = (RSS / 2)^(1/2)
    - Visualizing with Matplotlib
      * matplotlib.pyplot.plot(list\_of\_x, list\_of\_y1, ‘.', list\_of\_x, list\_of\_y2, ‘-')
      * model.predict(test\_data)
    - Inspect coefficients
      * model.get(‘coeffcients’)
        + intercept is w0
    - Explore other features
      * use multiple features, other than only sqft
      * SFrame.Show(view='BoxW Plot’, x=, y=)
      * 6 features give you less max error and less RMSE
    - Apply models to particular data points
      * sales[sales[‘id’]=='53xxx’]
      * for multiple feature model, even on average we have better RMSE, but on some particular data points it could have larger error number.
      * add image in iPython Notebook
        + *[Example image not included in the archive]*
  + 2.5 Homework
    - SArray
      * - immutable array object
      * - each column in an SFrame is an SArray
    - Filter
      * - logical filter
      * - .apply()
      * - a selection in SFrame takes a list consists of 0 and 1. And the length equals to the length of SFrame’s num of rows. When it comes to 0, row is ignored; otherwise it’s taken.
* 3 Week3: Classification: Analyzing Sentiment
  + 3.1 Classification modeling
    - 3.1.1 intelligent restaurant review
      * break review into sentences
      * sentence sentiment classifier
    - 3.1.2 classifier
      * input = x » output = y
      * input can have multi information
      * output can be multi categories, called multicalss classification
      * example
        + review sentiment
        + webpage category: output tech, sport, news, …
        + spam filtering: input has multi information
        + image classification
        + personalized medical diagnosis: input DNA and life style
    - 3.1.3 linear classifier
      * simple threshold classifier
        + count pos/neg words in sentence
        + problems
          - how to get list of pos/neg word
          - word degree of sentiment
          - single words not enough
      * give weight for each word
      * score = sum of input words’ weight, so it’s linear
      * if score > 0, output = pos, else output = neg
    - 3.1.4 decision boundaries
      * decision boundary separates pos/neg predictions
  + 3.2 Evaluating classification models
    - 3.2.1 training and eval a classifier
      * traing set for learn classifer » to get the weight of words
      * test set to eval the weight of words. hide the label, feed sentence to classifier, compare prediction with real label.
      * classification error
        + error = (# of mistakes) / (total # of sentences)
        + accuracy = (# of corrects) / (total # of sentences)
        + error = 1.0 - accuracy
    - 3.2.2 what’s a good accuracy?
      * accuracy should beat random guess, larger than 1/K (K is the number of classes)
      * class imbalance will give you good performance. accuracy should beat majority class baseline, in which we simple guess everything is from the majority class. Eg. 80% of the reviews are pos, so it’s baseline of majority class is 80% since everytime we guess a review is pos anyway.
      * most importantly: how accurate the application need? what accuracy will make the user happy?
    - 3.2.3 confusion matrices
      * correct: true pos / true neg; mistake: false neg / false pos
      * false neg and false pos can have different impact in some application. eg email spam filter, medical diagnosis
    - 3.2.4 learning curves
      * how much data does a model need to learn?
        + the more the better, but data quality is most important factor
      * learning curve
        + x = amount of training data
        + y = test error
        + limit? yes, for most models
        + bias = even with infinite data, test error will not got to zero
      * complex models tend to have less bias, but need more data to learn
      * bias is not possible to eliminate
    - 3.2.5 class probabilities
      * class probablity = how confident is your prediction (soft ouptut!)
      * many classifier provide a confidence level
  + 3.3 Summary
    - w3\_summary.png
  + 3.4 Analyzing sentiment with iPython Notebook
    - graphlab.text\_analytics.count\_words(SFrame)
      * count\_bigrams
      * count\_trgrams
    - SFrame.show(view='Categorical’)
    - data engineering: define pos/neg sentiment by throught 3-star reviews out
    - graphlab.logistic\_classifier.create(train\_data, target='sentiment’, features=[‘word\_count’], validation\_set=test\_data)
    - model.evaluate(test\_data, metric = ‘roc\_curve’)
      * roc\_curve help to explore confusion matrics
      * change the threshold to get different rate of true pos vs false pos, help you to choose different strategy for different application requirements
      * it looks like the result is very good **JUST** according to the word count! The word count is not the number of words in the review, but a count of different words in the review.
    - model.predict(SFram, output\_type='propability’)
    - SFrame.sort(‘predicted\_sentiment’, ascending=False)
    - .apply() is very limited because its function only takes 1 argument, itself
    - model[‘coefficients’]
* 4 Week4: Clustering and Similarity: Retrieving Documents
  + 4.1 Algorigthms for retrieval and measuring similarity of documents
    - 4.1.1 problem definition
      * how to measure similarity?
      * how to search through ariticle?
    - 4.1.2 word count representation for measuring similarity
      * bag of words model
        + - ignore order
        + - count number of words in vocabulary
      * measure similarity: sum(x\_i \* y\_i), where i is the word index in vacabulary
      * issue with word counts: doc length matters! doesn’t make sense, because prefer longer article
      * solution = normalize: x’\_i = x\_i / (sum(x\_i^2)^(1/2)
    - 4.1.3 word importance priority with tf-idf
      * common words vs rare words: emphasize important words even they are rare.
      * important word
        + - common locally
        + - rare globally
        + - trade off between these 2
      * TF-IDF: term frequency - inverse document frequency
      * term freq = word counts
      * inverse doc freq, look at all the doc in our corpus = log [# docs / (1 + # docs using this word)]
        + - common word, idf->0
        + - rare word, idf is large
      * tf \* idf
        + - down weight common words
        + - up weight rare words
    - 4.1.4 nearest neighbor search to retrieve similar document
      * distance metric
        + - search each article in corpus
        + - compute similarity
        + - return largest 1 or N similarity article(s)
  + 4.2 Clusterinng models and algorithms
    - 4.2.1 overview
      * discover groups (clusters) of related articles
      * training set: labeled docs
      * multiclass classification problem
    - 4.2.2 clustering documents without supervise
      * unsupervised learning
        + - no labels provided
        + - want to uncover cluster structure
        + - input: docs as vectors. This will put each article as a dot in a vector space. In the class, we assume a 2-D space with X=# of word\_1, Y=# of word\_2
        + - output: label (cluster)
      * what defines a cluster?
        + - center
        + - shape/spread
        + - assign observation (doc) to cluster (topic label). (1) score (2) distance to cluster center
    - 4.2.3 k-means algorithm
      * similarity = distance to cluster centers
      * algorithm
        + - initialize cluster centers by “randomly”
        + - assign observations to closest cluster center by “voronoi tessellation”
        + - revise cluster centers as mean of assigned observations
        + - repeat step (2)+(3) until convergence
    - 4.2.4 other examples
      * - clustering images
      * - grouping patients by medical condition
      * - production recommendation on Amazon
      * - discovering groups of users on Amazon
      * - structuring web research results. multiple meanings of one word
      * - discovering similar neighborhoods: house price prediction (not enough sales data) / forecase violent crimes
  + 4.3 Summary
    - iteratively update our cluster centers (parameters of clustering)
    - w4\_summary.png
    - My questions
      * How about the thesaurus? We need to take them into consideration.
  + 4.4 Doument retrieval in python
    - graphlab.text\_analytics.count\_words(); # uni-gram counting
    - SFrame.stack($column\_name, new\_column\_name=list) » a new stack SFrame table (expand the value of given column, and copy the other columns)
      * <https://dato.com/products/create/docs/generated/graphlab.SFrame.stack.html>
    - 4.4.1 TF-IDF
      * tf\_idf = graphlab.text\_analytics.tf\_idf(people[‘word\_count’])
    - 4.4.2 distance matric
      * graphlab.distances.\*; # lots of options to choose from to calculate distance metric graphlab.distances.cosine; # smaller the closer
    - 4.4.3 nearest neighbor model
      * knn\_model = graphlab.nearest\_neighbors.create(people, features=[‘tf\_idf’], lable='name’)
      * knn\_model.query(obama); # return the nearest entry, obama here is SArray for SFrame ‘people’
* 5 Week5: Recommending Products
  + 5.1 Recommender system
    - 5.1.1 overview
      * use past history and other user’s history in prediction
      * recommender system in action
        + - personalization: what do I care about? because of information overload; connect users and items
        + - movie recommendations: what want to watch?
        + - product recommendations: global and session interests
        + - music recommendations: coherent and diverse sequence
        + - friend recommendations: users and “items” are of the same “type”
        + - drug-target interactions: what drug should we “repurpose” for some disease? asprin from headache to blood thinner in heart condition
    - 5.1.2 recommender system via classification
      * solution 0: popularity
        + - rank by global popularity; no personalization
      * solution 1: classification model
        + - use features of items and users
        + - input : user info + purchase history + production info + other info
        + - pros: personalized; features can capture context (time of the day, what I just saw), even handles limited user history
        + - cons: features may not be available; collaborative filtering cannot work
      * solution 2: collaborative filter
  + 5.2 Co-occurrence matrices for collaborative filtering
    - 5.2.1 collaborative filtering
      * people who bought this also bought …
      * Matrix C: store # users who bought both items i & j
        + - x = y = # items
        + - symmetric: C\_ij = C\_ji
      * How to use Matrix C?
        + - look at row i, which user just bought
        + - recommend other items in the row with **largest** counts
    - 5.2.2 effect of popular items
      * no matter what I just purchased, most popular item will be recommended, will drowns out other effects
    - 5.2.3 normalizing co-occurrence matrices and leveraging purchase history
      * Jaccard similarity: normalizes by popularity
        + - both i and j / i or j = C\_ij / (C\_i + C\_j - C\_ij) = S\_ij
        + - limitations: no history; what if purchased many items
      * Weighted average of purchased items
        + - purchased item j and k
        + - S(i) = avg(S\_ij + S\_ik)
        + - chose highest S
        + limitations: no context; no user features; no product features; new user/product (cold start problem)
  + 5.3 Matrix factorization
    - 5.3.1 matrix completion task
      * solution 3: discovering hidden structure by matrix factorization
      * use movie recommendation as example
      * matrix of rating
        + - x = movies
        + - y = user
        + - value = rating of movie x by user y
        + - if user y hasn’t watched movie x, then use ? (white square)
        + - goal: filling white squares, how much user y will like movie x’ (not watched yet)
    - 5.3.2 user/item features
      * movie topics Rv for movie v
      * user prefer topics Lu for user u
      * rating(u,v) = Rv \* Lu = (element vise product)
      * recommendation: sort rating(u,v)
        + - rating will be out of a certain range
    - 5.3.3 predictions in matrix form
      * rating matrix takes all the users and all the movies, every element is a rating(u,v)
    - 5.3.4 discovering hidden structure by matrix factorization model
      * HOWEVER we don’t have the features of users and movies, we have to discover topics from data
      * use observed value to estimate Lu and Rv: regression
        + - RSS(L,R) = sum(rating(u,v), )^2, where Lu and Rv are estimated from model parameters R & L, and sum are for all the black squares (with data)
        + - RSS(L,R) gives L and R from regression
        + - then use L and R to predict rating(u,v) for white squares
        + - many efficient algorithms for factorization
      * limitation of matrix factorization
        + cold-start problem
    - 5.3.5 all together: featurized matrix factorization
      * blending model
        + feature: context
        + matrix factorization: groups of users
        + combine: feature for new users; as more info discovered, use matrix factorization topics
        + Netflix Prize 1M dollars: winning team blended over 100 models
  + 5.4 Performance metrics for recommender systems
    - 5.4.1 performance metric
      * classification accuracy
      * interested in what user like, but not “user does not like”
      * fast vs. full list
      * recall = # liked and shown / # liked
      * precision = # liked and shown / # shown
        + - how much “garbage” (things i’m not interested in) i need to look at
    - 5.4.2 optimal recommenders
      * maximize recall? recommend everything, but will give very small precision
      * optimal: recommend things I like, and only the things I like
    - 5.4.3 precision-recall curves
      * input = specific recommender system
      * output = algorithm-specific precision-recall curve
      * x = # items recommended
      * precision-recall\_curves.png
      * which algorithm is best?
        + - given precision, better recall
        + - given recall, better precision
        + - metric 1: largest area under the curve (AUC)
        + - metric 2: precision at a specific # recommended items
  + 5.5 Summary
    - w5\_summary.png
  + 5.6 Song recommender with Python
    - users = song\_data[‘user\_id’].unique() len(users)
    - 5.6.1 simple popularity-based recommender
      * popularity\_model = graphlab.popularity\_recommender.create(training\_data, user\_id='user\_id’, item\_id='song’) popularity\_mode.recommend(users=[users[0]]) popularity\_mode.recommend(users=[users[1]])
      * everyone get the exact same thing
    - 5.6.2 personalization recommender
      * personalized\_model = graphlab.item\_similarity\_recommender.create(training\_data, user\_id='user\_id’, item\_id='song’) personalized\_model.recommend(users=[users[0]]) personalized\_model.recommend(users=[users[1]])
      * # similar songs personalized\_model.get\_similar\_items([‘song name here’])
      * # similar users personalized\_model.get\_similar\_users([‘user id here’])
    - 5.6.3 Qunatitative comparison between the models
      * model\_performance = graphlab.recommender.util.compare\_models(test\_data, [popularity\_model, personalized\_model], user\_sample=0.05)
  + 5.7 Assignment
    - artist\_popularity = song\_data.groupby(key\_columns='artist’, operations={‘total\_count’: graphlab.aggregate.SUM(‘listen\_count’)})
* 6 Week6: Deep Learning: Searching for Images
  + 6.1 Neural networks: Learning very non-linear features
    - 6.1.1 search for images
    - 6.1.2 what is a visual product recommender?
      * keyword search? don’t know what keyword to search
      * use image similarity to search for product
    - 6.1.3 learning very non-linear features with neural networks
      * features (of images) are very important to neural networks.
      * layers and layers of linear models and non-linear transformations
      * in 90s disfavor
      * big resurgence recent 10 years
        + - lots of data to train
        + - computing resource like GPUs
  + 6.2 Deep learning & deep features
    - 6.2.1 application for deep learning to computer vision
      * image features
        + - local detectors combined to make prediction
        + - image features of “interesting points”
        + - before we used to hand crafted features
      * standard image classification approach
        + - input
        + - extract features (hand created)
        + - use simple classifier
      * deep learning: implicitly learns features
        + - different layers detect different types of features
        + - automatically!
    - 6.2.2 deep learning performance
      * ImageNet 2012 competition: 1.2M training images, 1000 categories
      * SuperVision use deeplearning neural network has a big gain against 2nd place
    - 6.2.3 demo on ImageNet data
    - 6.2.4 challenges
      * pros
        + - learning automatically rather than hand tuning
        + - performance gain
        + - potential
      * cons
        + - lots of labeled data (human annotation)
        + - computationally expensive
        + - many tricks to tune
    - 6.2.5 deep features
      * can we learn features from data, even when we don’t have the data or time? deep learning + transfer learning: use data from one task to help learn on another
      * what’s learned in a neural net?
        + - very speicific to task 1 for the latest layers
        + - more generic for earlier layers, can be reuse
      * transfer learning
        + - keep first few layers
        + - use simple classifier to replace last several layers that is too specific
      * deep features workflow
        + deep\_features\_workflow.png
  + 6.3 Summary
    - w6\_summary.png
  + 6.4 Deep features for image classification
    - deep\_learning\_model = graphlab.load\_model(‘imagenet\_model’); # this is a pre-trained deep learning model using ImageNet’s 1.5M images
    - image\_train[‘deep\_features’] = deep\_learning\_model.extract\_features(image\_train); # extract deep feature using pre-trained model
    - deep\_features\_model = graphlab.logistic\_classifier.create(image\_train, features=[‘deep\_features’], target='labl’); # use simple classifier on extracted deep features
  + 6.5 Deep features for image retrieval
    - knn\_model = graphlab.nearest\_neighbors.create(image\_train, features=[‘deep\_features’], label='id’)
    - ​ cat = image\_train[18]
      knn\_model.query(cat); # gives neighbors of given “cat” item
  + 6.6 Assignment
    - use sketch\_summary to get summary statitics of the data, only for SArray (not as assignment said for both SFrame and SArray)
      * image\_train[‘label’].sketch\_summary()
  + 6.7 Deploying machine learning as a service
    - 6.7.1 what’s production? life cycle
      * - deployment: serving
      * - evaluation: measuring quality of deployed models
      * - management: choosing between deployed models
      * - monitoring: tracking model quality and operations
    - 6.7.2 deployment
      * traning with historical data
      * real-time predictions with live data
      * feedback and improve
    - 6.7.3 3 other pieces
      * learning new, alternative models
      * how to choose between models
      * evaluating a recommender: user engagement and user experience
      * offline evaluation: when to update model
      * online evaluation: choosing between models
    - 6.7.4 A/B testing: choosing between ML models
      * group A use model 1 and group B use model 2
      * other issues: versioning, provenace, dashboards, reports, …
  + 6.8 Machine learning challenges and future directions
    - 6.8.1 model selection
    - 6.8.2 feature engineering/representation
    - 6.8.3 scaling
      * data is getting bigger and bigger
        + - social website
        + - products on amazon
        + - devices of IoT
        + - medical record
      * models are getting bigger and bigger
      * CPUs stopped getting faster
        + - GPUs
        + - multicores
        + - clusters
        + - clouds
        + - supercomputers
      * parallel architecture
        + - programmability
        + - data distribution
        + - failures
