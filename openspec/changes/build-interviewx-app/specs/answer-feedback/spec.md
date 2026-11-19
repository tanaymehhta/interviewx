# Spec Delta

## Purpose

One consistent way to judge an answer, used by Full interview, Call, and Single questions, that tells the candidate what to keep, what to cut, and how their own answer sounds improved.

## ADDED Requirements

### Requirement: Answer scoring
The system SHALL score each answer with an overall score from 0 to 10 and four sub-scores from 0 to 10: Structure, Relevance, Quantified impact, and Delivery. Delivery SHALL be calculated from answer length against the target and filler-word count, not judged by the model.

#### Scenario: Scored answer
- **WHEN** the person submits a 250-word behavioral answer in Single questions
- **THEN** a feedback card shows the overall score and four sub-scores within 15 seconds

#### Scenario: Scoring fails
- **WHEN** scoring fails or returns invalid output
- **THEN** the answer is saved unscored, the scorecard does not change, and a retry action is shown

#### Scenario: Too short
- **WHEN** an answer has fewer than 20 words
- **THEN** it is not scored and the person is asked for a fuller answer

### Requirement: Strengths and improvements
The system SHALL list two or three strengths and two or three improvements, each pointing to a specific part of the answer.

#### Scenario: Missing metric
- **WHEN** the answer has no result number
- **THEN** one improvement names the result part and asks for a number

### Requirement: Keep and cut marks
The system SHALL mark each sentence of the answer as keep, cut, or tighten and show the marks on the answer text.

#### Scenario: Off-topic opening
- **WHEN** the answer opens with two sentences of unrelated background
- **THEN** those sentences are marked cut

### Requirement: Upgraded answer
The system SHALL show an improved version of the person's own answer that keeps their facts and voice and SHALL NOT invent achievements; missing facts SHALL appear as placeholders such as "[X%]".

#### Scenario: Vague result
- **WHEN** the answer says revenue "went up a lot"
- **THEN** the upgraded answer says "revenue grew [X%]"

### Requirement: Round-fit check
The system SHALL compare each answer, and each full interview as a whole, with the round's expectations and the company's wants from the research, and mark each relevant expectation met, partly met, or missing.

#### Scenario: Expectation missing
- **WHEN** the Final round expects a 30-60-90 day plan and the interview never gives one
- **THEN** the round-fit checklist marks it missing

### Requirement: Session SWOT
The system SHALL produce a SWOT (strengths, weaknesses, opportunities, threats) after a full interview, based on all its answers.

#### Scenario: End of interview
- **WHEN** a full interview is reviewed
- **THEN** the results include a SWOT with at least one item in each quadrant
