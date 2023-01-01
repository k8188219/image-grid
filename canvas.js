if (!self.window) {
  // inside worker
  try {
    self[self.name]();
  } catch (e) { }
}



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

  assignWorker({ file, width, height }).then(result => {
    var { image_bitmap } = result;
    requestAnimationFrame(() => ctx.drawImage(image_bitmap, 0, 0))
  })

  cb(canvas);
}

function compressImage3(file, { naturalWidth, naturalHeight }, cb) {
  const HEIGHT = 360;
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");
  canvas.width = naturalWidth * HEIGHT / naturalHeight;
  canvas.height = HEIGHT;
  canvas.naturalWidth = canvas.width;
  canvas.naturalHeight = canvas.height;
  var { width, height } = canvas

  assignWorker({ file, width, height, naturalWidth, naturalHeight }).then(result => {
    var { image_bitmap } = result;
    requestAnimationFrame(() => ctx.drawImage(image_bitmap, 0, 0))
  })

  cb(canvas);
}



function compressImage2_Worker() {
  self.onmessage = function (e) {
    var { file, width, height, id } = e.data;
    // var canvas = new OffscreenCanvas(100, 100);
    // var ctx = canvas.getContext('2d');
    createImageBitmap(file, { resizeWidth: width, resizeHeight: height })
      .then(image_bitmap => {
        self.postMessage({ id, image_bitmap });
      })
  };
}


function compressImage3_Worker() {
  if (self.window) return;

  // inside worker

  self.onmessage = function (e) {
    var { file, width, height, naturalWidth, naturalHeight, id } = e.data;
    // var canvas = new OffscreenCanvas(100, 100);
    // var ctx = canvas.getContext('2d');
    resizeImage(file, { naturalWidth, naturalHeight }, { resizeWidth: width, resizeHeight: height })
      .then(image_bitmap => {
        self.postMessage({ id, image_bitmap });
      })
  };

  function resizeImage(file, { naturalWidth, naturalHeight }, { resizeWidth, resizeHeight }) {
    // console.log({ naturalWidth, naturalHeight }, { resizeWidth, resizeHeight })

    if (naturalWidth / 2 < resizeWidth) {
      return createImageBitmap(file, { resizeWidth, resizeHeight })
    }

    return createImageBitmap(file, { resizeWidth: naturalWidth / 2, resizeHeight: naturalHeight / 2 })
      // .then(image_bitmap => {
      //   console.log(image_bitmap)
      //   return new Promise(resolve => setTimeout(()=>resolve(image_bitmap), 3000))
      // })
      .then(image_bitmap => {
        const { width: naturalWidth, height: naturalHeight } = image_bitmap;
        return resizeImage(image_bitmap, { naturalWidth, naturalHeight }, { resizeWidth, resizeHeight })
      })
  }

}
