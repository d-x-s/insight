---
name: User Stories
about: Use this template for user stories submission
title: "C3 Phase 1: User Stories"
labels: []
assignees: ""
---

Make sure to follow the *Role, Goal, Benefit* framework for the user stories and the *Given/When/Then* framework for 
the Definitions of Done! For the DoDs, think about both success and failure scenarios. You can also refer to the 
examples DoDs in [C3 spec](https://sites.google.com/view/ubc-cpsc310-22w1/project/checkpoint-3#h.8c0lkthf1uae).

## User Story 1
As a student, I want to know the distance between two rooms, so that I know how far to walk between classes.

### Definitions of Done(s) [Positive Case]

Scenario: Find the distance between two rooms given their full names.

Given: The rooms have been added.

When: The student inputs the full name of the building that a room belongs to into an input field. Repeat for the next room. The student will then click on the "Find Distance" button and receive the distance 
between the two buildings.

Then: The distance between the rooms will be displayed. 

### Definitions of Done(s) [Negative Case]

Scenario: Find the distance between two rooms that belong to different buildings.

Given: The rooms have been added but the inputted rooms do not exist

When: The student inputs the full name of the building that a room belongs to into an input field.
Repeat for the next room. The student will then click on the "Find Distance" button and receive the distance 
between the two buildings.

Then: As an invalid or non-existing room was inputted, an error will be thrown + displayed to the user, and the user 
will be invited to resubmit the inputs.


## User Story 2

As a student, I want to look up a professor's profile and see the historical average across all their sections, as well as a list of every section they have ever taught.

### Definitions of Done(s) [Positive Case]

Scenario: Calculate the historical average of all classes of a given professor

Given: Valid course dataset(s) have been added, and valid sections that the professor teaches exist.

When: Name of a professor is inputted into the "Professor" field and a button named "Search for Professor" is clicked.

Then: An average representing the mean of all classes the professor has taught will be calculated.

### Definitions of Done(s) [Negative Case]

Scenario: Calculate the historical average of all classes of a non-existing or misspelled professor

Given: Valid course dataset(s) have been added, but the professor does not exist in any of the datasets as they do not teach any of the sections or do not exist.

When: Name of a non-existing or misspelled professor is inputted into the "Professor" field and a button named "Search for Professor" is clicked.

Then: As an invalid or non-existing name of a professor was inputted, an error message will be displayed and the user will be invited to resubmit the inputs.



## Others
For User Story 1, we will add a special message if the room is inputted twice, saying that they are in the same building.
