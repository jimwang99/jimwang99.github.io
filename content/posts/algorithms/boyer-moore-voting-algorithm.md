---
title: "Boyer-Moore Voting Algorithm"
date: 2024-06-22
---

#note #learn-with-chatgpt #algorithm

> NOTE: this is a note from ChatGPT

The Boyer-Moore Voting Algorithm, also known simply as the Voting Algorithm, is a method for finding a majority element in a sequence of elements. This means it's useful for determining if there's an element in the sequence that appears more than `n/2` times, where `n` is the number of elements in the sequence.

Here's the basic idea:

1. **Initialization**: Start with an initial candidate and a count of 0.
2. **Iteration**: Go through the sequence element by element.
- If the count is 0, set the current element as the candidate.
- If the current element is the same as the current candidate, increment the count.
- Otherwise, decrement the count.
3. **Validation**: The candidate at the end of the iteration is the potential majority element. However, one additional pass through the sequence is required to confirm if it is indeed the majority element.

The intuition behind this algorithm is that if there's a majority element, it will outvote every other element combined.

Here's a Python implementation of the Boyer-Moore Voting Algorithm:

```Python
def majority_element(nums):
    candidate, count = None, 0

    for num in nums:
        if count == 0:
            candidate, count = num, 1
        elif candidate == num:
            count += 1
        else:
            count -= 1

    # Optional: validate if candidate is indeed the majority
    return candidate if nums.count(candidate) > len(nums) // 2 else None

# Example
nums = [3, 3, 4, 2, 4, 4, 2, 4, 4]
print(majority_element(nums))  # Outputs: 4
```

The beauty of the Boyer-Moore Voting Algorithm is its efficiency. It processes the elements in O(n) time and uses O(1) space. The additional validation step, if required, also takes O(n) time.
