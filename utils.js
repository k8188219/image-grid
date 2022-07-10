function sortFn(a, b) {
  a = a.name.toLowerCase();
  b = b.name.toLowerCase();
  return strComp(a, b)
}

function strComp(a, b) {
  if (a === b) return 0
  var len = Math.min(a.length, b.length)
  for (var i = 0; i < len; i++) {
    // num compare
    if (a[i] > -1 && b[i] > -1) {
      const n_a = parseInt(a.substr(i))
      const n_b = parseInt(b.substr(i))
      if (n_a === n_b) {
        continue;
      }
      return n_a < n_b ? -1 : 1
    }
    if (a[i] === b[i]) continue;
    return a[i] < b[i] ? -1 : 1
  }
  return a.length < b.length ? -1 : 1
}

async function traverseFileTree(item, path) {
  path = path || "";
  if (item.isFile) {
    // Get file
    return await new Promise(resolve => {
      item.file(function (file) {
        resolve([{ name: path + file.name, file }])
      });
    })
  } else if (item.isDirectory) {
    // Get folder contents
    var dirReader = item.createReader();
    var entries = await new Promise(resolve => {
      dirReader.readEntries(entries => {
        resolve(entries)
      }, err => {
        console.warn(err)
        resolve([])
      });
    });

    entries = [entries.filter(e => e.isFile).sort(sortFn), entries.filter(e => e.isDirectory).sort(sortFn)].flat();
    var arr = []
    for (var i = 0; i < entries.length; i++) {
      arr.push(await traverseFileTree(entries[i], path + item.name + "/"))
    }
    return arr.flat()
  }
}


function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

var get_image_count = 0;
var batch_list = new Proxy([], {
  get(target, prop) {
    return target[prop] ?? (target[prop] = [])
  }
})
var batch_lock = new Proxy([], {
  get(target, prop) {
    return target[prop] ??
      (
        target[prop] = Promise.all(batch_list[prop])
          // .then(() => new Promise(r => setTimeout(r, 100)))
      )
  }
})

async function getImage(src) {
  var batch_index = Math.floor(get_image_count++ / 4);
  var batch = batch_list[batch_index];

  var resolve = null;
  var img_promise = new Promise(r => { resolve = r });
  batch.push(img_promise);

  if (batch_index > 0)
    await batch_lock[batch_index - 1]

  createImage(src, resolve);
  return img_promise;
}

function createImage(src, cb) {
  var img = new Image();
  img.src = src;
  img.onload = () => compressImage(img, cb)
  // img.onload = () => cb(img)
  img.onerror = () => cb()
}

function compressImage(img, cb) {
  const HEIGHT = 360;
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");
  // Actual resizing
  canvas.width = img.naturalWidth * HEIGHT / img.naturalHeight;
  console.log(img.naturalWidth * HEIGHT / img.naturalHeight)
  console.log(canvas.width)
  canvas.height = HEIGHT;
  canvas.naturalWidth = img.naturalWidth;
  canvas.naturalHeight = img.naturalHeight;
  ctx.drawImage(img, 0, 0, img.naturalWidth * HEIGHT / img.naturalHeight, HEIGHT);

  cb(canvas);

  // canvas.toBlob(blob => {
  //   var img = new Image();
  //   img.src = URL.createObjectURL(blob);
  //   img.onload = () => cb(img)
  //   img.onerror = () => cb()
  // })
}

function isOverlap(a1, a2, b1, b2) {
  var a_before_b = (a1 <= b1 && a1 <= b2) &&
    (a2 <= b1 && a2 <= b2)

  var a_after_b = (a1 >= b1 && a1 >= b2) &&
    (a2 >= b1 && a2 >= b2)

  var not_overlap = a_before_b || a_after_b

  return !not_overlap

}