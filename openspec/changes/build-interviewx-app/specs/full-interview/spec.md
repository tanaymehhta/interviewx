# Spec Delta

## Purpose

Simulates a real round from start to finish, out loud, so the candidate practices under realistic pressure and gets one complete review at the end.

## ADDED Requirements

### Requirement: Setup screen
The system SHALL show a setup screen with the job, round, and what the round expects; a length choice of 15, 30, or 45 minutes (about 3, 6, or 9 main questions); answer mode (Voice default, Typing); a microphone check with a live level line; and a headphones tip. Begin SHALL be disabled in Voice mode until the microphone check hears sound.

#### Scenario: Microphone works
- **WHEN** the person picks 30 minutes and speaks during the microphone check
- **THEN** the level line moves and Begin becomes active

#### Scenario: Microphone denied
- **WHEN** the browser denies microphone access
- **THEN** the setup screen switches to Typing mode and explains how to allow the microphone

### Requirement: Interviewer persona
The interview SHALL open with a short spoken and on-screen introduction from an interviewer persona that matches the round's interviewer type and the person's interviewer notes.

#### Scenario: Notes provided
- **WHEN** the round's interviewer notes say "VP Sales, ex-Oracle"
- **THEN** the persona introduces itself as a VP of Sales

### Requirement: Live question display
Each question SHALL appear on screen in large text at the same moment it is spoken aloud, with its number, total, and type (for example "Question 3 of 6 · Behavioral"). While the interviewer speaks, the screen SHALL show "Interviewer speaking" and SHALL NOT capture the microphone.

#### Scenario: New question
- **WHEN** the interviewer asks question 3
- **THEN** the question text, "Question 3 of 6 · Behavioral", and the speaking state show on screen while it is read aloud, and listening starts when reading ends

### Requirement: Live transcript
While the person answers by voice, the system SHALL show their words on screen as they speak: words still being recognized in a lighter tone, settled words in full tone. The person SHALL be able to switch to typing at any time without losing what was transcribed.

#### Scenario: Speaking
- **WHEN** the person speaks an answer
- **THEN** their words appear under the question within about one second of speaking them

#### Scenario: Switch to typing
- **WHEN** the person presses Type instead mid-answer
- **THEN** the transcript so far moves into an editable text box

### Requirement: Answer controls and timing
The screen SHALL show answer time against a target (2:00 behavioral, 3:00 case or technical) and total interview time. The person ends an answer with "Done" or the Space key; silence alone SHALL NOT end an answer in a full interview. Pause SHALL stop both timers and listening.

#### Scenario: Long pause while thinking
- **WHEN** the person is silent for 6 seconds mid-answer
- **THEN** the answer stays open and listening continues

#### Scenario: Over target time
- **WHEN** the answer passes its target
- **THEN** the answer timer changes to the over-time style and keeps counting

### Requirement: Follow-up questions
After a main answer, the interviewer MAY ask at most one follow-up that refers to something the person said, labeled "Follow-up" under the same question number. Follow-ups SHALL be asked when the answer lacks a result, a number, or the person's own role.

#### Scenario: Missing result
- **WHEN** the answer describes a deal but never states the outcome
- **THEN** the follow-up asks what the outcome was

### Requirement: Transcript drawer
The system SHALL keep a collapsible transcript of all earlier questions and answers in the session, closed by default.

#### Scenario: Open transcript
- **WHEN** the person opens the transcript during question 4
- **THEN** questions 1 to 3, follow-ups, and their answers are listed in order

### Requirement: Ending and early exit
The interview SHALL end when the chosen length is reached after the current answer, or when the person chooses End interview and confirms. The interviewer SHALL close with a short spoken line. Answers given before an early end SHALL be reviewed and the session marked incomplete.

#### Scenario: End early
- **WHEN** the person ends after question 2 of 6
- **THEN** the review covers questions 1 and 2 and the session shows "Incomplete · 2 of 6"

### Requirement: Review loading screen
After the interview, the system SHALL show a loading screen with a staged list of review steps (reading answers, scoring structure and impact, comparing with what the company expects in this round, writing upgraded answers) and a thin progress bar, then open results. It SHALL finish within 60 seconds or show the answers already reviewed with a retry for the rest.

#### Scenario: Review completes
- **WHEN** a 6-question interview ends
- **THEN** the loading screen shows each step as it finishes and opens results

### Requirement: Results screen
The results SHALL show: overall score and the change in round readiness; a one-line verdict; a round-fit checklist of the round's expectations marked met, partly met, or missing; a SWOT; delivery numbers (talk time, words per minute, filler words, longest answer); every question with its score that expands to full feedback; and next steps to practice the weakest skill.

#### Scenario: Read results
- **WHEN** the results open
- **THEN** the person sees all sections above, and choosing a next step opens Single questions on the weakest skill

### Requirement: Saved session
Each full interview SHALL be saved with its transcript, scores, and feedback, and SHALL update the scorecard. Audio SHALL NOT be stored.

#### Scenario: Reopen later
- **WHEN** the person opens a past full interview from the Feedback answer log
- **THEN** the same results screen opens with the saved transcript
