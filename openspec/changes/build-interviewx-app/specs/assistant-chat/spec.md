# Spec Delta

## Purpose

An open conversation with an assistant that knows the candidate's resume, jobs, research, scores, and past answers, for questions and planning that are not practice.

## ADDED Requirements

### Requirement: Grounded chat
Chat SHALL answer in a conversational thread using the person's profile, resume analysis, all jobs and research briefs, scores, and past answers and feedback, with the selected job and round as default focus.

#### Scenario: Ask about weaknesses
- **WHEN** the person asks "What should I fix before Thursday?"
- **THEN** the reply names the weakest skills for the round on Thursday and quotes a recent improvement note

#### Scenario: Ask about the company
- **WHEN** the person asks "What does Salesforce care about in the final round?"
- **THEN** the reply uses the research brief and keeps its source tags

### Requirement: Never scored
Chat SHALL NOT score answers or change the scorecard, even when the person writes an interview answer.

#### Scenario: Answer typed in chat
- **WHEN** the person pastes an answer and asks for thoughts
- **THEN** the reply gives comments and offers to score it in Single questions, and the scorecard is unchanged

### Requirement: Suggested actions
Chat SHALL be able to offer action buttons (Practice this in Single questions, Start a full interview, Open scorecard) that open the matching tool with the topic filled in. Chat SHALL NOT change jobs, rounds, plans, or outcomes itself.

#### Scenario: Practice suggestion
- **WHEN** the reply suggests practicing a 30-60-90 day plan answer
- **THEN** a "Practice this in Single questions" button opens Single questions with that question

### Requirement: Streaming and history
Replies SHALL stream as they are written, and chat history SHALL be saved and listed by date.

#### Scenario: Reopen chat
- **WHEN** the person opens Chat the next day
- **THEN** yesterday's conversation is available in the history list
