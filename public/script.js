const video = document.getElementById("video");
var start = Date.now();
var isGettingData = false;
var timeStamp = 0;
var prevScore = 3100;
var score = 3100;
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceExpressionNet.loadFromUri("/models"),
  faceapi.nets.ssdMobilenetv1.loadFromUri("/models")
]).then(startVideo);

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    stream => (video.srcObject = stream),
    err => console.error(err)
  );
}

video.addEventListener("play", async () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  const labeledFaceDescriptors = await loadLabeledImages();
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
  faceapi.matchDimensions(canvas, displaySize);
  setInterval(async () => {
    timeStamp = 0;
    const detections = await faceapi
      .detectAllFaces(video)
      .withFaceLandmarks()
      .withFaceExpressions()
      .withFaceDescriptors();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

    const results = resizedDetections.map(d =>
      faceMatcher.findBestMatch(d.descriptor)
    );

    // console.log(detections[0].expressions);
    var howAngry = detections[0].expressions.angry;
    var howNeutral = detections[0].expressions.neutral;
    var howHappy = detections[0].expressions.happy;
    var howSad = detections[0].expressions.sad;

    var faceName = results[0].label;

    var millis = Date.now() - start;

    milis = Math.floor(millis / 1000);

    if (milis % 10 == 0) {
      isGettingData = true;
    }

    if (isGettingData == true) {
      console.log("retrieving");
      const response = await fetch("/api");
      const scoreArray = await response.json();
      for (item of scoreArray) {
        if (isGettingData == true) {
          if (faceName == item.faceName) {
            console.log("matching");
            if (item.timestamp > timeStamp) {
              timeStamp = item.timestamp;
              if (howSad > 0.3) {
                score -= 5;
              }
              if (howHappy > 0.9) {
                score += 5;
              }
              if (howAngry > 0.3) {
                score -= 5;
              }
              const data = { faceName, score };
              const options = {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
              };
              const response = await fetch("/api", options);
              const json = await response.json();
              isGettingData = false;
              break;
            }
          }
        }
      }
      isGettingData = false;
    }
    // console.log(timeStamp);

    if (milis % 10 != 0) {
      isGettingData = false;
    }
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, {
        label: result.toString()
      });
      drawBox.draw(canvas);
    });
  }, 100);
});

function loadLabeledImages() {
  const labels = [
    "Black Widow",
    "Captain America",
    "Captain Marvel",
    "Hawkeye",
    "Jim Rhodes",
    "Thor",
    "Tony Stark",
    "Steven Wyks",
    "Emily Broad"
  ];
  return Promise.all(
    labels.map(async label => {
      const descriptions = [];
      for (let i = 1; i <= 2; i++) {
        const img = await faceapi.fetchImage(
          `https://raw.githubusercontent.com/slw515/Final-Project-Documentation/master/labeled_images/${label}/${i}.jpg`
        );
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        descriptions.push(detections.descriptor);
      }
      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
}

async function getScores() {
  const response = await fetch("/api");
  const scoreArray = await response.json();
  console.log(scoreArray);
}

async function submitScore() {
  // console.log("hello");
  var score = 3000;
  var faceName = document.getElementById("name").value;
  console.log(name.value);
  var playerscore = score;
  const data = { faceName, score };
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  };
  const response = await fetch("/api", options);
  const json = await response.json();
  console.log(json);
}
