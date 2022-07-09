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

async function getImage(src) {
  return new Promise(resolve => {
    var img = new Image();
    img.src = src;
    img.onload = () => resolve(img)
    img.onerror = () => resolve()
  })
}


function getSrc(file) {
  return URL.createObjectURL(file)
}


