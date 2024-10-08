// DOM Elements
import { mapValue } from "./utils.js";

document.body.style.cursor = "none";
const velocityBar = document.getElementById("velocity-bar");
const healthBar = document.getElementById("health-bar")

const ores = document.getElementById("ores");
const [ironElem, goldElem, crystalElem] = ores.children; 
export const cursor = document.getElementById("custom-cursor");
export const progressContainer = document.getElementById("progress-container")
export const progressText = document.getElementById("progress")


let iron = 0
let gold = 0
let crystal = 0
export function incrementOre(type) {
  console.log(type)
  if (type === 1) {
    iron += 1
    ironElem.innerHTML = `Iron ${iron}`
  } else if (type === 2) {
    gold += 1
    goldElem.innerHTML = `Gold ${gold}`
  } else if (type === 3) {
    crystal += 1
    crystalElem.innerHTML = `Crystal ${crystal}`
  }
}

export function updateVelocityBar(vel, maxVelocity) {
  let maxHeight = window.innerHeight - 50;
  let h = mapValue(vel, 0, maxVelocity, 0, maxHeight);
  velocityBar.style.height = `${h}px`;
}

export function updateHealthBar(health, maxHealth) {
  let maxHeight = window.innerHeight - 50;
  let h = mapValue(health, 0, maxHealth, 0, maxHeight);
  healthBar.style.height = `${h}px`;

  const healthPercentage = health / maxHealth;
  const red = Math.floor((1 - healthPercentage) * 255);
  const green = Math.floor(healthPercentage * 255);
  const color = `rgb(${red}, ${green}, 0)`;

  healthBar.style.backgroundColor = color;
}