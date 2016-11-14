// clouds https://images.unsplash.com/16/unsplash_525a7e89953d1_1.JPG
// hills https://images.unsplash.com/29/cloudy-hills.jpg
// rock https://images.unsplash.com/reserve/yZfr4jmxQyuaE132MWZm_stagnes.jpg
// paris https://images.unsplash.com/33/YOfYx7zhTvYBGYs6g83s_IMG_8643.jpg

// Filter selection
var defaultFilters = [
  "", "smooth_ride", "space_pizza", "purple_pond", "sunday", "alien_goggles"
];
var currentFilter = "smooth_ride";


window.Algorithmia = window.Algorithmia || {};
Algorithmia.api_key = "simZfwrSvLraXpTAgJpIL53Ugji1";
var numTasks = 0;

// Update the style thumbnail view state
function updateStyleButtons() {
  var styleButtons = document.getElementsByClassName("style-thumb");
  for(var i = 0; i < styleButtons.length; i++) {
    var button = styleButtons[i];
    button.onclick = changeStyle;
    var styleName = button.getAttribute("data-style");
    if(styleName === currentFilter) {
      button.classList.add("selected")
    } else {
      button.classList.remove("selected")
    }
  }
}

// Called when a user clicks on a style thumbnail
function changeStyle(event, b) {
  newStyle = this.getAttribute("data-style");
  if(newStyle !== currentFilter) {
    console.log("Changing style to " + newStyle);
    currentFilter = newStyle;
    updateStyleButtons();
    callAlgorithm();
  }
}

function callAlgorithm() {
  var statusLabel = document.getElementById("status-label");
  statusLabel.innerHTML = "";

  // Get the img URL
  var img = document.getElementById("imgUrl").value;

  // Remove any whitespaces around the url
  img = img.trim();

  if(typeof(img) == "string" && img !== "") {
    startTask();

    // Call deep filter
    generateStylizedImage(img, currentFilter);
  }

};

function generateStylizedImage(img, filterName) {
  var uuid = Math.random().toString(36).substring(7);

  var algoInput = {
    "images": [img],
    "savePaths": ["s3+turing://algorithmia-demos/deepstyle/" +  uuid + ".jpg"],
    "filterName": filterName
  };

  Algorithmia.client(Algorithmia.api_key)
    .algo("algo://deeplearning/DeepFilter/0.3.2")
    .pipe(algoInput)
    .then(function(output) {
      if(output.error) {
        // Error Handling
        var statusLabel = document.getElementById("status-label");
        statusLabel.innerHTML = '<div class="alert alert-danger" role="alert">Uh Oh! Something went wrong: ' + output.error.message + ' </div>';
        taskError();
      } else {
        console.log("got output", output.result);

        if(output.result.savePaths.length == 1) {
          var url = output.result.savePaths[0];
          url = url.replace("s3+turing://", "https://s3.amazonaws.com/");

          // Display stylized image
          displayImg(url);

          finishTask();
        }

      }
    });
}

function displayImg(url) {
  // Update image and links
  document.getElementById("resultLink").href = url;
  var resultImg = document.getElementById("resultImg")
  // resultImg.crossOrigin = ""; // necessary for canvas to access image data
  resultImg.src = url;
  resultImg.classList.remove("faded");

  // Show results if not already showing
  var resultsDiv = document.getElementById("results");
  resultsDiv.style.display = "block";
  resultsDiv.style.height = "";
  document.getElementById("downloadLinks").classList.remove("hidden");
}

function analyzeDefault(img) {
	document.getElementById("imgUrl").value = img;
	callAlgorithm();
}

function startTask() {
  numTasks++;
  document.getElementById("overlay").classList.remove("hidden");
}

function finishTask() {
  numTasks--;
  if(numTasks <= 0) {
    document.getElementById("overlay").classList.add("hidden");
    document.getElementById("explainer").classList.add("hidden");
    document.getElementById("results").classList.remove("hidden");
    document.getElementById("social").classList.remove("invisible");
    document.getElementById("marketing").classList.remove("hidden");
  }
}

function taskError() {
  numTasks = 0;
  document.getElementById("overlay").classList.add("hidden");
  document.getElementById("explainer").classList.add("display");
  document.getElementById("explainer").classList.remove("hidden");
  document.getElementById("results").classList.add("hidden");
  document.getElementById("social").classList.add("invisible");
  document.getElementById("marketing").classList.add("hidden");
}


function initDropzone() {
  window.Dropzone.autoDiscover = false;
  var dropzone = new Dropzone("#file-dropzone", {
    options: {
      sending: function() {}
    },
    acceptedFiles: "image/*",
    previewTemplate: "<div></div>",
    maxFilesize: 10,
    filesizeBase: 1024,
    createImageThumbnails: false,
    clickable: true
  });
  dropzone.__proto__.cancelUpload = function() {};
  dropzone.__proto__.uploadFile = function() {};
  dropzone.__proto__.uploadFiles = function() {};

  dropzone.on("processing", function(file) {
    var statusLabel = document.getElementById("status-label")
    statusLabel.innerHTML = "";
    startTask();

    var reader = new FileReader();
    reader.addEventListener("load", function () {
      console.log("Calling algorithm with uploaded image.");
      colorify(reader.result);
      dropzone.removeFile(file);
    }, false);
    reader.readAsDataURL(file);
    console.log("Reading uploaded image...");
  });

  dropzone.on("error", function(file, err) {
    dropzone.removeFile(file);
    var statusLabel = document.getElementById("status-label")
    statusLabel.innerHTML = '<div class="alert alert-danger" role="alert">Uh oh! ' + err + ' </div>';
    taskError();
  });
}

updateStyleButtons();
initDropzone();
