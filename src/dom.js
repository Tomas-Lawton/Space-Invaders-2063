// DOM Elements
import { mapValue } from "./utils.js";

document.body.style.cursor = "none";
const velocityBar = document.getElementById("velocity-bar");
const healthBar = document.getElementById("health-bar")

export const cursor = document.getElementById("custom-cursor");
export const progressContainer = document.getElementById("progress-container")
export const progressText = document.getElementById("progress")

export function updateVelocityBar(vel, maxVelocity) {
  let maxHeight = window.innerHeight - 50;
  let h = mapValue(vel, 0, maxVelocity, 0, maxHeight);
  velocityBar.style.height = `${h}px`;
}

export function updateHealthBar(health, maxHealth) {
  let maxHeight = window.innerWidth - 50;
  let h = mapValue(health, 0, maxHealth, 0, maxHeight);
  healthBar.style.height = `${h}px`;

  const healthPercentage = health / maxHealth;
  const red = Math.floor((1 - healthPercentage) * 255);
  const green = Math.floor(healthPercentage * 255);
  const color = `rgb(${red}, ${green}, 0)`;

  healthBar.style.backgroundColor = color;
}