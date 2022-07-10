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
  }, 3000)

  cb(canvas);
}

var pending_jobs = []

var mainThreadListener = (e) => {
  var job = pending_jobs[e.data.id];
  var canvas = job.canvas;
  var { width, height } = e.data;

  canvas.naturalWidth = width;
  canvas.naturalHeight = height;

  if (e.data.image_bitmap) {
    canvas.width = width
    canvas.height = height
    var ctx = canvas.getContext("2d");
    requestAnimationFrame(() => ctx.drawImage(e.data.image_bitmap, 0, 0))
  }

  job.cb(canvas)
}

var i = 0;
var workers = []
for (let i = 0; i < COMPRESS_WORKERS; i++) {
  let worker = COMPRESS_IMAGE === 2
    ? createWorker1()
    : COMPRESS_IMAGE === 3
      ? createWorker2()
      : COMPRESS_IMAGE === 4
        ? createWorker2()
        : null

  worker?.addEventListener("message", mainThreadListener)
  worker && workers.push(worker);
}


function compressImage2(file, cb) {
  var canvas = document.createElement("canvas");
  var offscreen = canvas.transferControlToOffscreen()

  workers[i].postMessage({ file, id: pending_jobs.length, canvas: offscreen }, [offscreen]);
  i = (i + 1) % workers.length

  pending_jobs.push({ canvas, cb })
}

function createWorker1() {
  const workerCode = `
  self.onmessage = function(e) {
    const HEIGHT = 360;
    var { canvas, file, id } = e.data;
    var ctx = canvas.getContext('2d');

    createImageBitmap(file).then(img => {
      canvas.width = img.width * HEIGHT / img.height;
      canvas.height = HEIGHT;
      var { width, height } = canvas;

      self.postMessage({ id, width, height });
      return {img, width, height}
    }).then(({img, width, height}) => {
      ctx.drawImage(img, 0, 0, width, height);
    })
  };`;
  const blob = new Blob([workerCode], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);
  URL.revokeObjectURL(url); // cleanup
  return worker;
}



function compressImage3(file, cb) {
  var canvas = document.createElement("canvas");

  workers[i].postMessage({ file, id: pending_jobs.length });
  i = (i + 1) % workers.length

  pending_jobs.push({ canvas, cb })
}

function createWorker2() {
  const workerCode = `
  self.onmessage = function(e) {
    const HEIGHT = 360;
    var { file, id } = e.data;
    var canvas = new OffscreenCanvas(100, 100);
    var ctx = canvas.getContext('2d');

    createImageBitmap(file).then(img => {
      canvas.width = img.width * HEIGHT / img.height;
      canvas.height = HEIGHT;
      var { width, height } = canvas;
      ctx.drawImage(img, 0, 0, width, height);
      // self.setTimeout(()=>{self.close()}, 100)
      var image_bitmap = canvas.transferToImageBitmap();
      self.postMessage({ id, width, height, image_bitmap });
    })
  };`;
  const blob = new Blob([workerCode], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);
  URL.revokeObjectURL(url); // cleanup
  return worker;
}


function compressImage4(file, img, cb) {
  const HEIGHT = 360;
  var canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth * HEIGHT / img.naturalHeight;
  canvas.height = HEIGHT;
  canvas.naturalWidth = img.naturalWidth;
  canvas.naturalHeight = img.naturalHeight;

  setTimeout(() => {
    workers[i].postMessage({ file, id: pending_jobs.length });
    i = (i + 1) % workers.length

    pending_jobs.push({ canvas, cb: () => { } })
  }, 1000)

  cb(canvas);
}
