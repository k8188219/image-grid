var get_image_count = 0;
var batch_list = new Proxy([], {
  get: (target, prop) => target[prop] ?? (target[prop] = [])
})

var batch_lock = new Proxy([], {
  get: (target, prop) => target[prop] ?? (target[prop] = Promise.all(batch_list[prop]).then(() => {
    // new Promise(r => setTimeout(r, 100))
  }))

})

function getImage(file) {
  var batch_index = Math.floor(get_image_count++ / IMAGE_BATCH_SIZE);
  var batch = batch_list[batch_index];

  var img_promise = (async () => {
    if (batch_index > 0) {
      await batch_lock[batch_index - 1];
    }
    return await createImage(file)
  })();

  batch.push(img_promise);
  return img_promise;
}


async function createImage(file) {
  if (CREATE_IMAGE === "img")
    return createImage1(URL.createObjectURL(file));
  if (CREATE_IMAGE === "canvas")
    return createImage2(file);
}

async function createImage1(src) {
  return new Promise(resolve => {
    var img = new Image();
    img.src = src;
    img.onload = () => resolve(img)
    img.onerror = () => resolve()
  })
}

async function createImage2(file) {
  return new Promise(resolve => {
    if (COMPRESS_IMAGE === 1)
      createImage1(URL.createObjectURL(file)).then(img => compressImage1(img, resolve))
    if (COMPRESS_IMAGE === 2)
      getImageSize(file).then(img => compressImage2(file, img, resolve), () => resolve())
  })
}

async function pngSize(file) {
  var ab = await file.slice(0, 32).arrayBuffer();
  var dv = new DataView(ab);
  var naturalWidth = dv.getUint32(16, false)
  var naturalHeight = dv.getUint32(20, false)
  return { naturalWidth, naturalHeight }
}

var jpg_segments = [];
async function jpgSize(file, start = 2) {
  var ab = await file.slice(start, start + 10240).arrayBuffer();
  var dv = new DataView(ab);

  var naturalWidth = null
  var naturalHeight = null

  var i = 0;
  function getc(dv) {
    if (i >= dv.byteLength) return NaN;
    return dv.getUint8(i++, false)
  }

  var segments = [];

  for (; ;) {
    var marker;
    while ((marker = getc(dv)) < 0xFF);
    while ((marker = getc(dv)) == 0xFF);

    if (marker == 0x00) continue
    if (Number.isNaN(marker)) break;

    segments.push([...new Uint8Array(ab.slice(i - 2, i + 2))].map(n => n.toString(16).padStart(2, "0")).join(" "))
    // SOF0 Segment
    if ((marker >= 0xC0 && marker <= 0xC3) && i + 7 <= dv.byteLength) {
      naturalWidth = dv.getUint16(i + 5, false)
      naturalHeight = dv.getUint16(i + 3, false)
      if (!LOG_IMAGE_SIZE) break;
    }

    if (i + 2 <= dv.byteLength)
      i += dv.getUint16(i, false)
    else {
      i -= 2
      break;
    }
  }

  jpg_segments.push(segments)

  if (naturalWidth === null || naturalHeight === null) {
    if (ab.byteLength === 10240)
      return await jpgSize(file, start + i)
    return Promise.reject()
  }

  return { naturalWidth, naturalHeight }
}

async function getImageSize(file) {
  var ab = await file.slice(0, 4).arrayBuffer();
  var dv = new DataView(ab);
  var header = dv.getUint32(0, false)

  var png_header = 0x89504e47
  var jpg_header = 0xffd8ff

  var type = header === png_header
    ? "png"
    : header >>> 8 === jpg_header
      ? "jpg"
      : null

  try {
    if (type === "png") {
      var size = await pngSize(file);
      LOG_IMAGE_SIZE && console.log(type, size)
      return size;
    }
    if (type === "jpg") {
      var size = await jpgSize(file);
      LOG_IMAGE_SIZE && console.log(type, size)
      return size;
    }
  } catch (err) {
    LOG_IMAGE_SIZE && console.log(type, "read size error")
    return Promise.reject(err)
  }

  LOG_IMAGE_SIZE && console.log("unsupport file type")
  return Promise.reject()
}
