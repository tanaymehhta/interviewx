# Spec Delta

## Purpose

Shows the candidate what they are good at, what they are not, and whether practice is moving the numbers, across all jobs and for the selected job.

## ADDED Requirements

### Requirement: Overall skills
The scorecard SHALL show four overall skills that apply to every job (Structure, Relevance, Quantified impact, Delivery), each as the mean of that sub-score over the person's last 10 scored answers across all jobs, on a 0 to 100 scale.

#### Scenario: Overall after answers
- **WHEN** the last 10 answers have Structure sub-scores averaging 6.4
- **THEN** overall Structure shows 64

### Requirement: Job skills
The scorecard SHALL show the selected job's skills from research. Each starts at 50; after each scored answer on that skill it SHALL become round(0.7 × old + 0.3 × overall × 10).

#### Scenario: Score update
- **WHEN** Sales methodology is 58 and an answer on it scores 8
- **THEN** Sales methodology becomes 65

#### Scenario: Unscored answer
- **WHEN** an answer could not be scored
- **THEN** no skill score changes

### Requirement: Round readiness
Each round SHALL have a readiness score equal to the rounded mean of the job skills that round tests, labeled "Early estimate" until at least 5 answers for that job are scored.

#### Scenario: Readiness changes
- **WHEN** a skill tested in the Final round rises
- **THEN** Final round readiness updates on the round page and scorecard, showing the old and new values

### Requirement: Weakest skill and trend
The scorecard SHALL highlight the weakest job skill for the selected round (ties go to the least recently practiced) with a one-line reason, and show each skill's trend since the job was added.

#### Scenario: Recommendation moves
- **WHEN** Behavioral storytelling rises from 48 to 61 and Executive communication is 55
- **THEN** the weakest skill changes to Executive communication

### Requirement: Answer log
The scorecard SHALL list every scored answer for the selected job as a table (date, tool, question, skill, overall score), filterable by tool, where each row opens its full feedback.

#### Scenario: Filter by tool
- **WHEN** the person filters the log to Call
- **THEN** only answers given in calls are listed

### Requirement: Progress summary
The scorecard SHALL show, for the last 7 days, the number of practice sessions, minutes practiced, and the skill that improved most.

#### Scenario: First week
- **WHEN** the person has no scored answers yet
- **THEN** the scorecard shows an invitation to start practice instead of empty charts
