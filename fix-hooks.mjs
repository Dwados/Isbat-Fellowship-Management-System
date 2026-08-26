// fix-hooks.mjs — Fixes the React Hooks crash by moving the Wednesday check to the correct spot
import { readFileSync, writeFileSync } from 'node:fs';

const file = 'src/pages/CheckInPage.jsx';
let content = readFileSync(file, 'utf8');

// 1. Remove the bad early-return block
const badBlock = `  // Block access if not Wednesday
  if (!isWednesday) {
    return <ClosedScreen />;
  }

  // Countdown while a final screen is showing`;

content = content.replace(badBlock, `  // Countdown while a final screen is showing`);

// 2. Insert it AFTER all the timers/hooks have run
const insertionPoint = `  const showStreak = flow.step === 'welcome' || flow.step === 'registered' ? streak : 0;`;

const newBlock = `  // Block access if not Wednesday (must be after all Hooks)
  if (!isWednesday) {
    return <ClosedScreen />;
  }

  const showStreak = flow.step === 'welcome' || flow.step === 'registered' ? streak : 0;`;

content = content.replace(insertionPoint, newBlock);

writeFileSync(file, content);
console.log('Fixed React Hooks violation in CheckInPage.jsx!');