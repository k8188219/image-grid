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

async function traverseFileTree(entries = []) {
  var files = entries.filter(e => e.isFile).sort(sortFn);
  if (files.length === entries.length) {
    return files;
  }
  // Get folder contents
  var directories = entries.filter(e => e.isDirectory).sort(sortFn);

  for (var directory of directories) {
    files = files.concat(await readDirectory(directory).then(traverseFileTree))
  }
  return files;
}

async function readDirectory(directory) {
  var dirReader = directory.createReader();
  var entries = []

  while (true) {
    var batch = await new Promise(resolve => {
      dirReader.readEntries(results => {
        resolve(results)
      }, err => {
        console.warn(err)
        resolve([])
      });
    });
    if (!batch.length) break;

    entries = entries.concat(batch)
  }
  return entries
}

