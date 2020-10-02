import { clientFetch } from "utils/fetch";

const SLUG = "spacecells";

export const get_data = (router, knownLevels) => {
  const data = {
    knownLevels,
  };
  let formdata = new FormData();
  for (let key in data) formdata.append(key, data[key]);
  const response = clientFetch(router, `/puzzle/${SLUG}/get_data`, {
    method: "POST",
    body: formdata,
  });
  return response;
}

export const get_submission = (router, level, knownLevels) => {
  const data = {
    level,
    knownLevels,
  };
  let formdata = new FormData();
  for (let key in data) formdata.append(key, data[key]);
  const response = clientFetch(router, `/puzzle/${SLUG}/get_submission`, {
    method: "POST",
    body: formdata,
  });
  return response;
}

export const make_submission = (router, level, submission, cycles, knownLevels) => {
  const data = {
    level,
    submission,
    cycles,
    knownLevels,
  };
  let formdata = new FormData();
  for (let key in data) formdata.append(key, data[key]);
  const response = clientFetch(router, `/puzzle/${SLUG}/make_submission`, {
    method: "POST",
    body: formdata,
  });
  return response;
}
