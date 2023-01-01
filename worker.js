var jobs_batch_list = new Proxy([], {
  get: (target, prop) => target[prop] ?? (target[prop] = [])
})

var jobs_batch_lock = new Proxy([], {
  get: (target, prop) => target[prop] ?? (target[prop] = Promise.all(jobs_batch_list[prop]).then(() => {
    jobs_batch_list[prop] = []; /* release ref for gc */
    for (let w of workers) {
      w.terminate();
    }
    workers = []
    for (let i = 0; i < COMPRESS_WORKERS; i++) {
      let worker = createWorker()

      worker.addEventListener("message", mainThreadListener)
      workers.push(worker);
    }
  }))
})


function createWorker() {
  const name = `compressImage${COMPRESS_IMAGE}_Worker`;
  const worker = new Worker("/canvas.js", { name });
  return worker;
}

var next_worker = 0;
var workers = []
for (let i = 0; i < COMPRESS_WORKERS; i++) {
  let worker = createWorker()
  worker.addEventListener("message", mainThreadListener)
  workers.push(worker);
}

var jobs_count = 0
function assignWorker(job) {
  var batch_index = Math.floor(jobs_count++ / (COMPRESS_WORKERS * 5));
  var batch = jobs_batch_list[batch_index];

  var job_promise = (async () => {
    if (batch_index > 0) {
      await jobs_batch_lock[batch_index - 1];
    }
    return await dispatchJob(job)
  })();
  batch.push(job_promise);
  return job_promise;
}

var pending_jobs = []

function mainThreadListener(e) {
  var job = pending_jobs[e.data.id];
  pending_jobs[e.data.id] = null; // release ref for gc
  // console.log(Math.floor(e.data.id / (COMPRESS_WORKERS * 5)))
  job.resolve(e.data);
}

async function dispatchJob(job) {
  return new Promise(resolve => {
    workers[next_worker].postMessage({ ...job, id: pending_jobs.length });
    next_worker = (next_worker + 1) % workers.length

    pending_jobs.push({ resolve })
  })
}
