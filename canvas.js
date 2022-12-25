function compressImage1(img, cb) {
  const HEIGHT = 360;
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");
  // Actual resizing
  canvas.width = img.naturalWidth * HEIGHT / img.naturalHeight;
  canvas.height = HEIGHT;
  canvas.naturalWidth = img.naturalWidth;
  canvas.naturalHeight = img.naturalHeight;

  setTimeout(() => {
    ctx.drawImage(img, 0, 0, img.naturalWidth * HEIGHT / img.naturalHeight, HEIGHT);
  }, 1000)

  cb(canvas);
}



function compressImage2(file, img, cb) {
  const HEIGHT = 360;
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");
  canvas.width = img.naturalWidth * HEIGHT / img.naturalHeight;
  canvas.height = HEIGHT;
  canvas.naturalWidth = canvas.width;
  canvas.naturalHeight = canvas.height;
  var { width, height } = canvas

  setTimeout(() => {
    assignWorker({ file, width, height }).then(result => {
      var { image_bitmap } = result;
      requestAnimationFrame(() => ctx.drawImage(image_bitmap, 0, 0))
    })
  }, 1000)


  cb(canvas);
}



function createWorker() {
  const workerCode = `
  self.onmessage = function(e) {
    const HEIGHT = 360;
    var { file, width, height, id } = e.data;
    // var canvas = new OffscreenCanvas(100, 100);
    // var ctx = canvas.getContext('2d');
    createImageBitmap(file, {resizeWidth:width, resizeHeight:height})
      .then(image_bitmap => {
        self.postMessage({ id, image_bitmap });
      })
  };`;
  const blob = new Blob([workerCode], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);
  URL.revokeObjectURL(url); // cleanup
  return worker;
}