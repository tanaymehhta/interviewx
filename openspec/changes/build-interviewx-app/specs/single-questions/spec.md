# Spec Delta

## Purpose

A conversational space to practice individual answers or work on one story, where every real answer is scored and counts toward the scorecard.

## ADDED Requirements

### Requirement: Practice thread
Single questions SHALL be a chat-style thread for the selected round. It SHALL open with up to four suggested questions drawn from the weakest skill, the round's question types, and questions the person was asked in real rounds.

#### Scenario: Open Single questions
- **WHEN** the person opens Single questions for the Final round
- **THEN** the thread shows suggested questions and a message box

### Requirement: Ask for a question
The person SHALL be able to request practice in their own words, and the system SHALL respond with a question card (question, type, difficulty, and why it was chosen).

#### Scenario: Request a classic
- **WHEN** the person types "Let me practice tell me about yourself"
- **THEN** a question card for "Tell me about yourself" appears, tailored to this job and round

### Requirement: Answer and score
After a question card, the person's next message (spoken or typed) SHALL be treated as their answer and scored with the shared answer feedback, shown as a feedback card in the thread. The person SHALL be able to mark a message as "not an answer" to skip scoring.

#### Scenario: Spoken answer
- **WHEN** the person presses the microphone, answers out loud, and sends
- **THEN** the transcript appears as their message and a feedback card follows with score, keep/cut marks, and upgraded answer

#### Scenario: Not an answer
- **WHEN** the person asks "can you give me a hint?" after a question card and marks it not an answer
- **THEN** the system replies with a hint and does not score the message

### Requirement: Story analysis
The person SHALL be able to ask for a SWOT or critique of one of their stories (by name or pasted text), returned as a SWOT card with a suggested way to tell the story for this round. Story analysis SHALL NOT change the scorecard.

#### Scenario: SWOT a story
- **WHEN** the person types "SWOT my Northwind renewal recovery story"
- **THEN** a SWOT card for that story appears with one suggested opening line for the Final round

### Requirement: Thread history
Each round's Single questions thread SHALL be saved and reopen where the person left off.

#### Scenario: Return later
- **WHEN** the person returns the next day
- **THEN** the earlier question, answer, and feedback cards are visible above a fresh suggestion row
