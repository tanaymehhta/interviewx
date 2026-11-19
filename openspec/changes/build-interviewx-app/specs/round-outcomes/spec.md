# Spec Delta

## Purpose

Closes the loop on each real round: what happened, how it felt, and how ready the candidate was, which starts the data that shows which practice leads to offers.

## ADDED Requirements

### Requirement: Interview-day state
On a round's date, the round page and the job card SHALL say "Today is your <round name>" and show only a short warm-up option (one Call) and the round's key expectations.

#### Scenario: Interview day
- **WHEN** the person opens the Final round on Nov 26, its date
- **THEN** the round page shows "Today is your Final round", the expectations checklist, and a warm-up Call button

### Requirement: Post-round check-in
From the day after a round's date until an outcome is logged, the system SHALL ask "How did it go?" on My Jobs and the round page.

#### Scenario: Next day
- **WHEN** the person opens My Jobs on Nov 27 with no outcome for the Nov 26 Final round
- **THEN** a check-in prompt for that round appears

### Requirement: Outcome and reflections
The check-in SHALL record outcome (Waiting, Advanced, Offer, Rejected, Withdrew), what went well, where it went wrong, and the questions actually asked. Each asked question SHALL be addable to Single questions in one click.

#### Scenario: Save asked question
- **WHEN** the person adds "Walk me through a deal you lost" and chooses Practice this
- **THEN** Single questions opens with that question and it joins the round's suggestions

### Requirement: Readiness snapshot
When an outcome is logged, the system SHALL save the round's readiness, job skill scores, and number of practice answers at that time, and show them on the round.

#### Scenario: Snapshot shown
- **WHEN** the person logs Advanced for the Hiring manager round
- **THEN** the round shows its readiness, skill scores, and practice count at the time of the round

### Requirement: Job progression
Logging Advanced SHALL make the next round the active round. Logging Offer, Rejected, or Withdrew SHALL close the job and move it to Past jobs.

#### Scenario: Advanced
- **WHEN** the person logs Advanced for the Hiring manager round
- **THEN** the Final round becomes the active round on the job card

#### Scenario: Offer
- **WHEN** the person logs Offer for the Final round
- **THEN** the job moves to Past jobs with status Offer
