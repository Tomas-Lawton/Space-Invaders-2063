// DOM Elements
import { mapValue } from "./utils.js";

document.body.style.cursor = "none";
const velocityBar = document.getElementById("velocity-bar");
export const cursor = document.getElementById("custom-cursor");
export const progressContainer = document.getElementById("progress-container")
export const progressText = document.getElementById("progress")

export function updateVelocityBars(ship, maxVelocity) {
  let maxHeight = window.innerHeight - 50;
  let h = mapValue(ship.forwardVelocity, 0, maxVelocity, 0, maxHeight);
  velocityBar.style.height = `${h}px`;
}