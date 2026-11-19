# Spec Delta

## Purpose

Keeps every screen in one calm, bright, editorial visual language (inspired by aabhushanjewels.com) and away from the generic AI-product look.

## ADDED Requirements

### Requirement: Light theme by default
Every screen SHALL open in the light theme (white and ivory backgrounds, dark ink text) regardless of the operating system's color preference. A dark theme SHALL be available as an option in Settings and remembered per account.

#### Scenario: OS in dark mode
- **WHEN** a new person's computer is set to dark mode
- **THEN** the site still shows the light theme

#### Scenario: Choose dark
- **WHEN** the person selects Dark in Settings and signs in on another device
- **THEN** the site shows the dark theme on both devices

### Requirement: Palette and type
Every screen SHALL use only the defined palette tokens and two typefaces: a light high-contrast display serif for headings, questions, and numbers, and a light humanist sans for body text.

#### Scenario: Audit colors
- **WHEN** a reviewer inspects any page's computed colors
- **THEN** every text, border, and background color maps to a palette token of the active theme

### Requirement: Banned patterns
Screens SHALL NOT use: emojis, purple or blue-violet gradients, glassmorphism or blurred panels, glowing borders, sparkle or magic-wand icons, "AI-powered" badges, rounded pill buttons, drop shadows on cards, icon-in-a-circle feature grids, or colored chat bubbles.

#### Scenario: Review a screen
- **WHEN** a reviewer checks the landing, round, interview, and chat screens against the banned list
- **THEN** none of the banned patterns appear

### Requirement: Conversation styling
Chat and Single questions threads SHALL read as a transcript: messages left-aligned, speaker name in small uppercase letters above each message, a hairline between turns, and cards (question, feedback, SWOT) as bordered blocks.

#### Scenario: Thread view
- **WHEN** the person views a Single questions thread
- **THEN** messages show speaker labels and hairlines, with no colored bubbles

### Requirement: Shape and space
Buttons SHALL have square corners. Cards SHALL use 1px hairline borders, at most 2px radius, and no shadow. Landing sections SHALL be at least 96px apart on desktop.

#### Scenario: Primary button
- **WHEN** a primary button renders in the light theme
- **THEN** it is deep olive, square-cornered, with white serif label text

### Requirement: Scores read like typography
Scores and readiness SHALL render as large serif numerals with a thin bar, not as gradient rings or gauges.

#### Scenario: Readiness display
- **WHEN** readiness is 64
- **THEN** "64" appears in the display serif with a thin olive bar at 64% width

### Requirement: Responsive and accessible
Every screen SHALL work from 360px to 1440px wide without horizontal scroll, meet WCAG AA text contrast in both themes, be usable by keyboard with visible focus, and respect reduced-motion preferences.

#### Scenario: Phone width
- **WHEN** the round page is viewed at 375px wide
- **THEN** the five tools stack in one column with no horizontal scroll

#### Scenario: Reduced motion
- **WHEN** the operating system requests reduced motion
- **THEN** score and page transitions are instant
