# Spec Delta

## Purpose

Captures who the candidate is once, so every job, question, and piece of feedback can use their real background.

## ADDED Requirements

### Requirement: Onboarding
The system SHALL run a short onboarding after first sign-in that collects name, program or current role (for example "MBA, class of 2027"), target roles (free text, up to 5), and a resume. Name and resume are required.

#### Scenario: Complete onboarding
- **WHEN** a new person enters their name, program, two target roles, and uploads a resume
- **THEN** the system saves the profile and opens My Jobs with the Add a job prompt

#### Scenario: Leave and return
- **WHEN** a person closes the browser during onboarding and signs in again
- **THEN** onboarding resumes with the fields already entered

### Requirement: Resume upload
The system SHALL accept a resume as a PDF up to 3 MB or as pasted text, store the file privately for that person only, and allow replacing it in Settings.

#### Scenario: Wrong file
- **WHEN** the person uploads a .docx file or a PDF larger than 3 MB
- **THEN** the system rejects it with a message naming the allowed type and size and keeps the other fields

### Requirement: Resume analysis
The system SHALL analyze the resume and show up to three strengths, up to three gaps against the target roles, and up to five stories worth preparing, each with a short name the candidate can edit.

#### Scenario: Stories found
- **WHEN** a resume with a lost-deal turnaround is analyzed
- **THEN** one story is listed with a short name such as "Northwind renewal recovery" and later questions and feedback may refer to it by that name

#### Scenario: Analysis fails
- **WHEN** the analysis call fails
- **THEN** the profile is still saved, the analysis section shows a retry button, and the person can continue to My Jobs
