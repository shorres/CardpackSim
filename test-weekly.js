// Test script for weekly set generation
// Run this in the browser console to test the weekly set functionality

console.log("Testing Weekly Set Generation...");

// Test the weekly set generator
const generator = new WeeklySetGenerator();

// Get current weekly set
const currentSet = generator.getCurrentWeeklySet();
console.log("Current Weekly Set:", currentSet);

// Get next weekly set
const nextSet = generator.getNextWeeklySet();
console.log("Next Weekly Set:", nextSet);

// Test time functions
const timeUntilNext = generator.getTimeUntilNextWeek();
console.log("Time until next week (ms):", timeUntilNext);

const isActive = generator.isWeeklySetActive();
console.log("Is weekly set active:", isActive);

// Test all sets function
const allSets = getAllSets();
console.log("All available sets:", Object.keys(allSets));

// Check if weekly set is included
const weeklySetId = generator.getWeeklySetId();
console.log("Weekly Set ID:", weeklySetId);
console.log("Weekly set included in all sets:", allSets.hasOwnProperty(weeklySetId));

console.log("Weekly Set Generation Test Complete!");