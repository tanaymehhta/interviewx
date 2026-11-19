# Spec Delta

## Purpose

Turns the time left before each round into a concrete day-by-day practice schedule, so the candidate always knows what to practice today.

## ADDED Requirements

### Requirement: Plan per round
The system SHALL create a plan for each round that has a date: one entry per day from today to the round date (max 14 entries; longer spans group days). Each entry names a skill, a tool (Single questions, Call, or Full interview), and 10 to 45 minutes. The round date entry is the interview itself.

#### Scenario: Seven days out
- **WHEN** the Final round is set 7 days ahead
- **THEN** the plan shows 7 practice days and the interview day, the weakest skill appears on at least two days, and the day before the interview is a Full interview

#### Scenario: Round without date
- **WHEN** a round has no date
- **THEN** the round page shows no plan and asks for the date to build one

### Requirement: Plan adapts to scores
The system SHALL re-order a round's remaining plan days when the weakest skill for that round changes, without changing completed days.

#### Scenario: Weak spot moves
- **WHEN** a scored answer lifts Sales methodology above Executive communication
- **THEN** the next uncompleted day switches to Executive communication and completed days stay unchanged

### Requirement: Today's task
The round page SHALL show today's plan entry with one Begin button that opens the matching tool already set to that skill.

#### Scenario: Begin today's task
- **WHEN** today's entry is "Single questions · Behavioral storytelling · 15 min" and the person clicks Begin
- **THEN** Single questions opens with a Behavioral storytelling question

#### Scenario: Task done
- **WHEN** the person finishes a scored session matching today's skill and tool
- **THEN** today's entry is marked done

### Requirement: Calendar reminders
The system SHALL let the person download a round's plan as one calendar file with an event per day at a chosen time (default 8:00 AM local), each linking to the round page.

#### Scenario: Export reminders
- **WHEN** the person chooses Add to calendar with 7:30 AM
- **THEN** the browser downloads an .ics file with one event per plan day at 7:30 AM local time

### Requirement: In-app reminder
The system SHALL show a banner on any screen after 6:00 PM local time when any round has an unfinished task for today.

#### Scenario: Evening nudge
- **WHEN** the person opens My Jobs at 7:00 PM with today's Final round task not done
- **THEN** a banner names the job and round and links to the task
