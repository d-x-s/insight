---
name: User Stories
about: Use this template for user stories submission
title: "C3 Phase 1: User Stories"
labels: []
assignees: ""
---

Make sure to follow the *Role, Goal, Benefit* framework for the user stories and the *Given/When/Then* framework for the Definitions of Done! For the DoDs, think about both success and failure scenarios. You can also refer to the examples DoDs in [C3 spec](https://sites.google.com/view/ubc-cpsc310-22w1/project/checkpoint-3#h.8c0lkthf1uae).

## User Story 1
As a student, I want to know the distance between two rooms, so that I know how far to walk between classes.


#### Definitions of Done(s)
Scenario: Find the distance between two rooms 
Given: The rooms have been added. <br /> 
When: The student inputs two valid room full names into two input fields. The student will then click on the 
"calculate" button. <br /> 
Then: The distance between the rooms will be displayed.

## User Story 2
As a student, I want to know what the historical average of a professor's classes are, so that I know how
hard they mark.

#### Definitions of Done(s)
Scenario: Calculate the history average of all classes of a given professor <br />
Given: All datasets have been added <br />
When: The valid and existing name of a professor is inputted into the "professor" field and a button named "calculate"
is pressed.
Then: An average representing the mean of all classes the professor has taught will be calculated. 
## Others
Make sure to catch misspelled names
// Do we need to include error catching in our user stories? Ie. Valid names, existing names, etc.
