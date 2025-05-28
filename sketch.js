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
let lastLetterSpawn = 0;
let letterSpawnInterval = 100; // Spawn a new letter every 100ms when mouth is open

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
          // Mouth just opened, start timer and spawn first letter
          mouthOpenStart = millis();
          lastLetterSpawn = millis();
          spawnLetter(upperLip, lowerLip);
        } else {
          // Continuously spawn letters while mouth is open
          if (millis() - lastLetterSpawn > letterSpawnInterval) {
            spawnLetter(upperLip, lowerLip);
            lastLetterSpawn = millis();
          }
          
          // Grow all letters that are still attached to mouth
          for (let letter of letters) {
            if (letter.attachedToMouth) {
              let openDuration = millis() - mouthOpenStart; // Use mouth open start time, not individual letter time
              letter.size = 24 + openDuration * 0.05;
              // Update position to follow mouth
              letter.x = (upperLip.x + lowerLip.x) / 2 + random(-5, 5);
              letter.y = (upperLip.y + lowerLip.y) / 2 + random(-5, 5);
            }
          }
        }
        mouthWasOpen = true;
      } else {
        // Mouth closed, release all attached letters
        if (mouthWasOpen) {
          for (let letter of letters) {
            if (letter.attachedToMouth) {
              letter.attachedToMouth = false;
              letter.vy = random(2, 5);
              letter.vx = random(-4, 4);
            }
          }
        }
        mouthWasOpen = false;
      }
    }
  }

  // Draw and animate letters
  for (let i = letters.length - 1; i >= 0; i--) {
    let letter = letters[i];
    
    // Update position only if not attached to mouth
    if (!letter.attachedToMouth) {
      letter.x += letter.vx;
      letter.y += letter.vy;
      letter.vy += 0.2; // gravity
      
      // Check if letter hits the bottom of the screen
      if (letter.y >= height - letter.size/2) {
        letter.y = height - letter.size/2; // Keep it at the bottom
        letter.vy = 0; // Stop vertical movement
        letter.vx *= 0.8; // Add friction to horizontal movement
        letter.settled = true; // Mark as settled at bottom
        
        // Stop horizontal movement when it's very slow
        if (abs(letter.vx) < 0.1) {
          letter.vx = 0;
        }
      }
      
      // Keep letters within screen bounds horizontally
      if (letter.x < letter.size/2) {
        letter.x = letter.size/2;
        letter.vx *= -0.5; // Bounce back with reduced speed
      }
      if (letter.x > width - letter.size/2) {
        letter.x = width - letter.size/2;
        letter.vx *= -0.5; // Bounce back with reduced speed
      }
    }
    
    // Only fade opacity if letter hasn't settled at the bottom
    if (!letter.settled && !letter.attachedToMouth) {
      letter.opacity -= 1; // Gradual fade for letters still falling
    }
    
    // Draw the letter
    push();
    fill(letter.r, letter.g, letter.b, letter.opacity);
    stroke(255, 255, 255, letter.opacity);
    strokeWeight(2);
    textAlign(CENTER, CENTER);
    textSize(letter.size);
    textFont('Arial Black');
    text(letter.char, letter.x, letter.y);
    pop();
    
    // Only remove letters that fade out completely (don't remove based on position)
    if (letter.opacity <= 0) {
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

function spawnLetter(upperLip, lowerLip) {
  let letter = String.fromCharCode(65 + floor(random(26))); // Random A-Z
  let newLetter = {
    char: letter,
    x: (upperLip.x + lowerLip.x) / 2,
    y: (upperLip.y + lowerLip.y) / 2,
    size: 24,
    vx: random(-1, 1), // horizontal velocity
    vy: random(-1, 1), // vertical velocity
    startTime: millis(),
    opacity: 255,
    attachedToMouth: true,
    settled: false, // Track if letter has settled at bottom
    r: random(100, 255), // Random red component
    g: random(100, 255), // Random green component
    b: random(100, 255)  // Random blue component
  };
  letters.push(newLetter);
}
