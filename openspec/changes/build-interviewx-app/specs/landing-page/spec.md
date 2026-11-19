# Spec Delta

## Purpose

The public, market-facing page that introduces InterviewX to MBA career centers and candidates and leads into sign-up.

## ADDED Requirements

### Requirement: Story sections
The landing page SHALL present, in order: hero with the line "Practice the right part at the right time." and a "Get started" action; the problem ("I knew that answer, I just didn't say it."); how it works in four steps (add the job, we research every round, practice out loud, see what is improving); the five tools; a differentiation section ("Other tools grade your answer. InterviewX learns which answers got offers."); a section for career centers; and a footer.

#### Scenario: Visitor reads the page
- **WHEN** a visitor scrolls the landing page
- **THEN** sections appear in the order above and every "Get started" action opens sign-in

### Requirement: Sign-in entry
The top bar SHALL show a "Sign in" link for signed-out visitors and "My Jobs" for signed-in people.

#### Scenario: Signed-in visitor
- **WHEN** a signed-in person opens the landing page
- **THEN** the top bar shows "My Jobs" instead of "Sign in"

### Requirement: Sourced claims only
Any statistic SHALL show its source in small text beside it. Allowed figures: 19% fewer jobs for workers 22-25 in AI-exposed jobs (Stanford Digital Economy Lab, 2026); 7x more senior-skill asks in entry-level AI-exposed postings (PwC 2026 AI Jobs Barometer); 700+ universities using an AI practice tool (Big Interview, company claim).

#### Scenario: Statistic shown
- **WHEN** the "19% fewer" figure appears
- **THEN** its source line is visible beside it

### Requirement: Pitch video
The landing page SHALL include the team's pitch video with captions on by default and no autoplay with sound.

#### Scenario: Play video
- **WHEN** the visitor presses play
- **THEN** the pitch video plays inline with captions

### Requirement: Career center interest form
The landing page SHALL have a "For career centers" form with name, school, and email that saves the submission and shows a thank-you state. Invalid email SHALL be rejected inline.

#### Scenario: Submit form
- **WHEN** a visitor submits a valid name, school, and email
- **THEN** the submission is stored and the form is replaced by a thank-you message

#### Scenario: Invalid email
- **WHEN** the visitor enters "abc@" as email
- **THEN** the form shows an inline email error and does not submit
