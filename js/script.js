const video = document.getElementById("video");
var detections;
var AnomalyFlag = [0, 0, 0, 0, 0, 0];
var numberOfStrike = 0;
var resetStrikeFlag = true;
var objectModel;
var totalPhoneUsedTime = 0;
var totalTimeMultiplePeople = 0;
var totalTimeUserAbsence = 0;
var totalTimeUserPartialPresent = 0;

Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
  faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
]);

cocoSsd.load().then(function (loadedModel) {
  objectModel = loadedModel;
});

async function startVideo() {
  handPoseModel = await handpose.load();
  navigator.getUserMedia(
    { video: {} },
    (stream) => (video.srcObject = stream),
    (err) => console.error(err)
  );
}

video.addEventListener("play", () => {
  setInterval(async () => {
    detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions(128, 0))
      .withFaceLandmarks()
      .withFaceDescriptors();

    var numberOfPeople = await detections.length;
    PredictHands(numberOfPeople);
    MultiplePresence(numberOfPeople);
    UserPresence(numberOfPeople);
    PartialPresence(detections);
    AnalyzingObject();
    CheckAnamoly6();
  }, 100);
});

async function PredictHands(numberOfPeople) {
  const predictions = await handPoseModel.estimateHands(video);
  if (predictions.length == 0) {
    resetStrikeFlag = true;
  } else if (
    predictions.length >= 1 &&
    numberOfPeople == 0 &&
    resetStrikeFlag
  ) {
    StrickCheck();
  }
}

async function AnalyzingObject() {
  const predictions = await objectModel.detect(video);
  if (predictions.length > 1) {
    totalPhoneUsedTime += 100;
  }
}

function CheckAnamoly6() {
  console.log(totalPhoneUsedTime);
  if (totalPhoneUsedTime > 480000 && AnomalyFlag[5] == 0) {
    var li = document.getElementById("Anomaly6");
    li.appendChild(
      document.createTextNode(
        "Anomaly 6: User used hin mobile phone (or other device) for 8 minutes furing test"
      )
    );
    AnomalyFlag[5] = 1;
  }
}

function UserPresence(numberOfPeople) {
  if (numberOfPeople == 0) {
    totalTimeUserAbsence += 100;
    if (totalTimeUserAbsence > 120000 && AnomalyFlag[1] == 0) {
      var li = document.getElementById("Anomaly2");
      li.appendChild(
        document.createTextNode(
          "Anomaly 2: User Not present more that 2 minutes out of 30 minutes of total test"
        )
      );
      AnomalyFlag[1] = 1;
    }
  }
}

function MultiplePresence(numberOfPeople) {
  if (numberOfPeople > 1) {
    totalTimeMultiplePeople += 100;
    if (totalTimeMultiplePeople > 300000 && AnomalyFlag[0] == 0) {
      var li = document.getElementById("Anomaly1");
      li.appendChild(
        document.createTextNode(
          "Anomaly 1: Multiple peopple Detected for 5 minutes of 30 minutes of total test time"
        )
      );
      AnomalyFlag[0] = 1;
    }
  }
}

function PartialPresence(detection) {
  var score = 0;
  if (detection.length >= 1) {
    score = ScoreExtrator(JSON.stringify(detection));

    if (score < 80 || detection.length == 1) {
      console.log("working", score, totalTimeUserPartialPresent);
      totalTimeUserPartialPresent += 100;
      if (
        totalTimeUserPartialPresent > 420000 &&
        AnomalyFlag[3] == 0 &&
        AnomalyFlag[0] == 0
      ) {
        var li = document.getElementById("Anomaly4");
        li.appendChild(
          document.createTextNode(
            "Anomaly 4: User is partail present more that 7 minutes out of 30 minutes of total test"
          )
        );
        AnomalyFlag[3] = 1;
      }
    }
  }
}

function ScoreExtrator(str) {
  var array = str.split('":');
  var finalScore = array[6].split(",");
  return Number(finalScore[0]) * 100;
}

function StrickCheck() {
  if (numberOfStrike < 3) {
    resetStrikeFlag = false;
    numberOfStrike += 1;
  }
  if (AnomalyFlag[2] != 1 && numberOfStrike == 3) {
    var li = document.getElementById("Anomaly3");
    li.appendChild(
      document.createTextNode(
        "Anomaly 3: User covered his face 3 times during the test"
      )
    );
    AnomalyFlag[2] = 1;
  }
}
