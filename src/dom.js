// DOM Elements
import { mapValue } from "./utils.js";

document.body.style.cursor = "none";
const velocityBar = document.getElementById("velocity-bar");
export const cursor = document.getElementById("custom-cursor");
export const progressContainer = document.getElementById("progress-container")
export const progressText = document.getElementById("progress")

export function updateVelocityBars(currentVelocity, maxVelocity) {
    let h = mapValue(currentVelocity, 0, maxVelocity, 0, 300);
    velocityBar.style.height = `${h}px`; // Adjust based on your design
  }