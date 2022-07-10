var get_image_count = 0;
var batch_list = new Proxy([], {
  get: (target, prop) => target[prop] ?? (target[prop] = [])
})

var batch_lock = new Proxy([], {
  get: (target, prop) => target[prop] ?? (target[prop] = Promise.all(batch_list[prop]))
    .then(() => new Promise(r => setTimeout(r, 100)))
})

function getImage(file) {
  var batch_index = Math.floor(get_image_count++ / IMAGE_BATCH_SIZE);
  var batch = batch_list[batch_index];

  var img_promise = (async () => {
    if (batch_index > 0) {
      await Promise.all(batch_list[batch_index - 1]);
      // await batch_lock[batch_index - 1];
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
      compressImage2(file, resolve)
    if (COMPRESS_IMAGE === 3)
      compressImage3(file, resolve)
    if (COMPRESS_IMAGE === 4)
      createImage1(URL.createObjectURL(file)).then(img => compressImage4(file, img, resolve))
  })
}