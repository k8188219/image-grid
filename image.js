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
    if (COMPRESS_IMAGE === 3)
      getImageSize(file).then(img => compressImage3(file, img, resolve), () => resolve())
  })
}

async function pngSize(file) {
  var ab = await file.slice(0, 32).arrayBuffer();
  var dv = new DataView(ab);
  var naturalWidth = dv.getUint32(16, false)
  var naturalHeight = dv.getUint32(20, false)
  return { naturalWidth, naturalHeight }
}

// https://stackoverflow.com/questions/2517854/getting-image-size-of-jpeg-from-its-binary
async function jpgSize(file, offset = 2) {
  const CHUNK_SIZE = 10240
  var ab = await file.slice(offset, offset + CHUNK_SIZE).arrayBuffer();
  var dv = new DataView(ab);

  var size = null;
  // var size = {
  //   naturalWidth: null,
  //   naturalHeight: null,
  // }

  var i = 0;
  function getc(dv) {
    if (i >= dv.byteLength) return NaN;
    return dv.getUint8(i++, false)
  }

  while (i < dv.byteLength) {
    var marker;
    // ┌i
    //  FF C2 00 11 08 04 2B 03 52 03 01 22 00 02 11 01 03 11 01
    if ((marker = getc(dv)) !== 0xFF) {
      // debugger;
      throw new Error('read file error: not 0xFF');
    }

    //    ┌i
    //  FF C2 00 11 08 04 2B 03 52 03 01 22 00 02 11 01 03 11 01
    marker = getc(dv);

    if (marker == 0xd8) continue;    // SOI
    if (marker == 0xd9) break;       // EOI
    if (0xd0 <= marker && marker <= 0xd7) continue;
    if (marker == 0x01) continue;    // TEM
    if (Number.isNaN(marker)) break;

    // SOF0 Segment
    if (
      (marker >= 0xC0 && marker <= 0xC3) &&
      (i + 7 <= dv.byteLength)
    ) {
      size = {
        //       ┌i             ┌(i + 5)
        //  FF C2 00 11 08 04 2B 03 52 03 01 22 00 02 11 01 03 11 01
        naturalWidth: dv.getUint16(i + 5, false),
        //       ┌i       ┌(i + 3)
        //  FF C2 00 11 08 04 2B 03 52 03 01 22 00 02 11 01 03 11 01
        naturalHeight: dv.getUint16(i + 3, false),
      }
      break;
    }

    if (i + 2 <= dv.byteLength)
      //       ┌i
      //  FF C2 00 11 08 04 2B 03 52 03 01 22 00 02 11 01 03 11 01
      i += dv.getUint16(i, false) // skip segment
    else {
      // ┌i
      //  FF C2 00 11 08 04 2B 03 52 03 01 22 00 02 11 01 03 11 01
      i -= 2 // make i point to 0xFF for next chunk
      break;
    }
  }

  if (size) return size;

  const isLastChunk = ab.byteLength !== CHUNK_SIZE
  if (!isLastChunk) {
    const nextChunkOffset = offset + i
    return await jpgSize(file, nextChunkOffset)
  }
  throw new Error('read file error: cannot read size');
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
      return size;
    }
    if (type === "jpg") {
      var size = await jpgSize(file);
      return size;
    }
  } catch (err) {
    console.error(err);
    return Promise.reject();
  }

  console.error("unsupported file type")
  return Promise.reject()
}
