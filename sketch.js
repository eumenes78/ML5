/*
 * 👋 Hello! This is an ml5.js example made and shared with ❤️.
 * Learn more about the ml5.js project: https://ml5js.org/
 * ml5.js license and Code of Conduct: https://github.com/ml5js/ml5-next-gen/blob/main/LICENSE.md
 *
 * This example demonstrates face tracking on live video through ml5.faceMesh.
 */

let faceMesh;
let video;
let faces = [];
let options = { maxFaces: 1, refineLandmarks: false, flipHorizontal: false };

// Letter vomiting variables
let letters = [];
let mouthWasOpen = false;
let mouthOpenStart = 0;
let currentLetter = null;
let mouthOpenThreshold = 15; // Distance threshold for mouth being "open"

function preload() {
  // Load the faceMesh model
  faceMesh = ml5.faceMesh(options);
}

function setup() {
  createCanvas(640, 480);
  // Create the webcam video and hide it
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  // Start detecting faces from the webcam video
  faceMesh.detectStart(video, gotFaces);
}

function draw() {
  // Draw the webcam video
  image(video, 0, 0, width, height);

  // Process mouth detection and letter spawning
  if (faces.length > 0) {
    let face = faces[0];
    
    // Get mouth keypoints (MediaPipe Face Mesh indices)
    // Upper lip center: 13, Lower lip center: 14
    // Alternative mouth points: 61 (upper), 17 (lower), 0 (center top), 17 (center bottom)
    let upperLip = face.keypoints[13] || face.keypoints[12] || face.keypoints[15];
    let lowerLip = face.keypoints[14] || face.keypoints[16] || face.keypoints[17];
    
    if (upperLip && lowerLip) {
      // Calculate mouth openness
      let mouthDistance = dist(upperLip.x, upperLip.y, lowerLip.x, lowerLip.y);
      let mouthOpen = mouthDistance > mouthOpenThreshold;
      
      if (mouthOpen) {
        if (!mouthWasOpen) {
          // Mouth just opened, start timer and spawn a new letter
          mouthOpenStart = millis();
          let letter = String.fromCharCode(65 + floor(random(26))); // Random A-Z
          currentLetter = {
            char: letter,
            x: (upperLip.x + lowerLip.x) / 2,
            y: (upperLip.y + lowerLip.y) / 2,
            size: 24,
            vx: random(-2, 2), // horizontal velocity
            vy: random(1, 3),  // vertical velocity
            startTime: mouthOpenStart,
            opacity: 255
          };
          letters.push(currentLetter);
        } else if (currentLetter) {
          // Grow the current letter the longer mouth stays open
          let openDuration = millis() - mouthOpenStart;
          currentLetter.size = 24 + openDuration * 0.1; // Grow faster
          // Update position to follow mouth
          currentLetter.x = (upperLip.x + lowerLip.x) / 2;
          currentLetter.y = (upperLip.y + lowerLip.y) / 2;
        }
        mouthWasOpen = true;
      } else {
        // Mouth closed, stop growing current letter and let it fall
        if (mouthWasOpen && currentLetter) {
          // Give the letter some initial velocity when mouth closes
          currentLetter.vy = random(2, 5);
          currentLetter.vx = random(-3, 3);
        }
        mouthWasOpen = false;
        currentLetter = null;
      }
    }
  }

  // Draw and animate letters
  for (let i = letters.length - 1; i >= 0; i--) {
    let letter = letters[i];
    
    // Update position
    letter.x += letter.vx;
    letter.y += letter.vy;
    letter.vy += 0.2; // gravity
    
    // Fade out over time
    letter.opacity -= 1;
    
    // Draw the letter
    push();
    fill(255, 100, 100, letter.opacity);
    stroke(255, 255, 255, letter.opacity);
    strokeWeight(2);
    textAlign(CENTER, CENTER);
    textSize(letter.size);
    textFont('Arial Black');
    text(letter.char, letter.x, letter.y);
    pop();
    
    // Remove letters that are off screen or too faded
    if (letter.y > height + 100 || letter.opacity <= 0) {
      letters.splice(i, 1);
    }
  }

  // Optional: Draw face points (comment out for cleaner look)
  /*
  for (let i = 0; i < faces.length; i++) {
    let face = faces[i];
    for (let j = 0; j < face.keypoints.length; j++) {
      let keypoint = face.keypoints[j];
      fill(0, 255, 0);
      noStroke();
      circle(keypoint.x, keypoint.y, 2);
    }
  }
  */
}

// Callback function for when faceMesh outputs data
function gotFaces(results) {
  // Save the output to the faces variable
  faces = results;
}
