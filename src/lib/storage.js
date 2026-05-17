const JOBS_STORAGE_KEY = 'jobtrail.jobs';

function emptyJobsState() {
  return { jobs: [], meta: {} };
}

export async function getJobs() {
  const result = await chrome.storage.local.get(JOBS_STORAGE_KEY);
  const stored = result[JOBS_STORAGE_KEY];
  if (!stored || typeof stored !== 'object') return emptyJobsState();
  return {
    jobs: Array.isArray(stored.jobs) ? stored.jobs : [],
    meta: stored.meta && typeof stored.meta === 'object' ? stored.meta : {},
  };
}

export async function saveJobs(data) {
  const payload = {
    jobs: Array.isArray(data?.jobs) ? data.jobs : [],
    meta: data?.meta && typeof data.meta === 'object' ? data.meta : {},
  };
  await chrome.storage.local.set({ [JOBS_STORAGE_KEY]: payload });
}
