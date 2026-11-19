import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  updateSkill, overallSkills, roundReadiness, isEarlyEstimate, weakestSkill, difficultyBand,
  countFillers, deliveryScore, sessionDelivery, activeRound, jobStatusAfter,
  buildPlan, replan, buildIcs, addDays, targetSeconds,
} from './coach.ts';

const skill = (id: string, score: number, last: string | null = null) => ({ id, score, last_practiced_at: last });

test('skill update: 58 with an 8 becomes 65; 48 with a 9 becomes 61', () => {
  assert.equal(updateSkill(58, 8), 65);
  assert.equal(updateSkill(48, 9), 61);
});

test('overall skills: mean of the last 10 sub-scores x 10', () => {
  const a = (structure: number) => ({ structure, relevance: 5, impact: 5, delivery: 5 });
  const answers = [6, 7, 6, 7, 6, 7, 6, 7, 6, 6, 0, 0].map(a); // 11th and 12th are ignored
  assert.equal(overallSkills(answers)!.structure, 64);
  assert.equal(overallSkills([]), null);
});

test('readiness and early estimate', () => {
  assert.equal(roundReadiness([48, 55, 60]), 54);
  assert.equal(isEarlyEstimate(4), true);
  assert.equal(isEarlyEstimate(5), false);
});

test('weakest skill moves when storytelling rises from 48 to 61', () => {
  const before = [skill('story', 48), skill('exec', 55)];
  assert.equal(weakestSkill(before)!.id, 'story');
  const after = [skill('story', updateSkill(48, 9)), skill('exec', 55)];
  assert.equal(weakestSkill(after)!.id, 'exec');
});

test('weakest skill tie goes to the least recently practiced', () => {
  const s = [skill('a', 50, '2026-11-18T10:00:00Z'), skill('b', 50, '2026-11-10T10:00:00Z'), skill('c', 50)];
  assert.equal(weakestSkill(s)!.id, 'c');
  assert.equal(weakestSkill(s.slice(0, 2))!.id, 'b');
});

test('difficulty band', () => {
  assert.deepEqual([49, 50, 74, 75].map(difficultyBand), ['foundational', 'standard', 'standard', 'pressure']);
});

test('fillers and delivery', () => {
  assert.equal(countFillers('Um, so like, you know, we basically won. Actually uh yes.'), 6);
  const clean = Array(260).fill('word').join(' ');
  assert.equal(deliveryScore({ text: clean, seconds: 110, targetSeconds: 120 }), 10);
  const filler = Array(50).fill('um we like did it').join(' ');
  assert.ok(deliveryScore({ text: filler, seconds: 110, targetSeconds: 120 }) <= 6);
  assert.ok(deliveryScore({ text: 'Too short answer here', seconds: 12, targetSeconds: 120 }) <= 6);
  assert.equal(targetSeconds('Behavioral'), 120);
  assert.equal(targetSeconds('Case'), 180);
});

test('session delivery numbers', () => {
  const d = sessionDelivery([
    { text: Array(150).fill('w').join(' '), seconds: 60 },
    { text: 'um ' + Array(149).fill('w').join(' '), seconds: 90 },
  ]);
  assert.deepEqual(d, { talkSeconds: 150, wpm: 120, fillers: 1, longestSeconds: 90 });
});

test('round progression', () => {
  const rounds = [
    { position: 1, outcome: 'advanced' }, { position: 2, outcome: null }, { position: 3, outcome: null },
  ];
  assert.equal(activeRound(rounds)!.position, 2);
  rounds[1].outcome = 'advanced';
  assert.equal(activeRound(rounds)!.position, 3);
  assert.equal(jobStatusAfter('advanced'), 'preparing');
  assert.equal(jobStatusAfter('offer'), 'offer');
  assert.equal(jobStatusAfter('withdrew'), 'withdrawn');
});

test('7-day plan: 7 practice days, weakest on 2+ days, Full interview the day before', () => {
  const skills = [skill('story', 48), skill('exec', 55), skill('method', 58), skill('plan', 60)];
  const plan = buildPlan('2026-11-19', '2026-11-26', skills);
  assert.equal(plan.length, 7);
  assert.equal(plan[0].day, '2026-11-19');
  assert.deepEqual(plan.at(-1), { day: '2026-11-25', skill_id: 'story', tool: 'full', minutes: 30, done: false });
  assert.ok(plan.filter((d) => d.skill_id === 'story').length >= 2);
  assert.ok(plan.every((d) => d.minutes >= 10 && d.minutes <= 45));
});

test('1-day plan is one Full interview; no plan on or after the round date', () => {
  const plan = buildPlan('2026-11-25', '2026-11-26', [skill('story', 48)]);
  assert.equal(plan.length, 1);
  assert.equal(plan[0].tool, 'full');
  assert.deepEqual(buildPlan('2026-11-26', '2026-11-26', []), []);
});

test('long spans cap at 13 practice entries and still end the day before', () => {
  const plan = buildPlan('2026-11-01', '2026-12-01', [skill('a', 40), skill('b', 50)]);
  assert.equal(plan.length, 13);
  assert.equal(plan.at(-1)!.day, '2026-11-30');
  assert.equal(new Set(plan.map((d) => d.day)).size, 13);
});

test('re-plan keeps completed days and puts the new weakest skill on the next open day', () => {
  const skills = [skill('method', 50), skill('exec', 55)];
  const plan = buildPlan('2026-11-19', '2026-11-23', skills);
  plan[0].done = true;
  const lifted = [skill('method', 62), skill('exec', 55)];
  const next = replan(plan, '2026-11-20', lifted);
  assert.deepEqual(next[0], plan[0]);
  assert.equal(next[1].skill_id, 'exec');
  assert.deepEqual(next.map((d) => d.tool), plan.map((d) => d.tool));
});

test('.ics has one event per day at the chosen local time', () => {
  const ics = buildIcs(
    [{ day: '2026-11-19', minutes: 15, title: 'InterviewX: Single questions' }, { day: '2026-11-20', minutes: 10, title: 'InterviewX: Call' }],
    '07:30',
    'https://example.com/jobs/1/2',
  );
  assert.equal(ics.match(/BEGIN:VEVENT/g)!.length, 2);
  assert.match(ics, /DTSTART:20261119T073000\r\n/);
  assert.match(ics, /DTEND:20261119T074500\r\n/);
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.equal(addDays('2026-11-30', 1), '2026-12-01');
});
