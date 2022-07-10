var jobs_batch_list = new Proxy([], {
  get: (target, prop) => target[prop] ?? (target[prop] = [])
})

var jobs_batch_lock = new Proxy([], {
  get: (target, prop) => target[prop] ?? (target[prop] = Promise.all(jobs_batch_list[prop]).then(() => {
    jobs_batch_list[prop] = []; /* release ref for gc */
  }))
})

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

async function dispatchJob(job) {
  return new Promise(resolve => {
    workers[i].postMessage({ ...job, id: pending_jobs.length });
    i = (i + 1) % workers.length

    pending_jobs.push({ new_job_control: resolve })
  })
}
