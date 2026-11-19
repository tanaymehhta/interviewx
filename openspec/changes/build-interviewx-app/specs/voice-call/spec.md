# Spec Delta

## Purpose

Lets the candidate do a few minutes of spoken practice without looking at the screen, like a phone call on a train, inside the website on their phone.

## ADDED Requirements

### Requirement: Call view
The system SHALL offer a full-screen call view built for phone screens: job and round name, call timer, question number, a speaking/listening state, a large End call button, and the current question in large text. There SHALL be no typing in a call and no phone number shown.

#### Scenario: Start a call
- **WHEN** the person taps Call on the round page
- **THEN** the call view opens and the first question is spoken and shown

#### Scenario: Voice unsupported
- **WHEN** the browser lacks speech recognition or speech output
- **THEN** the call does not start, the system names the browsers that work, and offers Single questions instead

### Requirement: Quick drill content
A call SHALL ask 3 short questions (person can choose 3 or 5 before starting) on the round's weakest skill, using the round's question types.

#### Scenario: Default call
- **WHEN** the weakest skill for the Final round is Executive communication
- **THEN** the call asks 3 Executive communication questions in the style of the Final round

### Requirement: Hands-free turn taking
In a call, 3 seconds of silence after at least 15 words SHALL end the answer. The system SHALL then speak a one-sentence tip and the next question. The live transcript SHALL show on screen.

#### Scenario: Silence ends answer
- **WHEN** the person speaks 120 words and then stays silent for 3 seconds
- **THEN** the system speaks a tip such as "Good story. Say the result first." and asks the next question

### Requirement: Call recap
After the call ends, the system SHALL show each answer with full feedback and update the scorecard. Ending early SHALL keep and score the answers already given.

#### Scenario: End after question 2
- **WHEN** the person taps End call during question 3
- **THEN** the recap shows feedback for answers 1 and 2
