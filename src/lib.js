const os = require("os");
const path = require("path");
const git = require("nodegit");
const mkdirp = require("mkdirp");
const parseISO = require("date-fns/parseISO");
const differenceInMonths = require("date-fns/differenceInMonths");

const getCodeDir = () => {
  return path.join(os.homedir(), "code");
};

const getRepos = async (
  octokit,
  page,
  language = null,
  topic = null,
  byHelpWanted = false
) => {
  const q = `stars:>100 ${language ? `language:${language}` : ""} ${
    topic ? `topic:${topic}` : ""
  }`.trim();
  const sort = byHelpWanted ? "help-wanted-issues" : "stars";
  const order = "desc";

  const searchResult = await octokit.search.repos({
    q,
    sort,
    order,
    page,
  });

  const { data } = searchResult;

  return data.items;
};

const cloneRepo = async (repo) => {
  const dir = path.join(getCodeDir(), repo.language);
  mkdirp.sync(dir);
  process.chdir(dir);
  await git.Clone(repo.clone_url, repo.name); // eslint-disable-line new-cap
};

const isActive = (repo) => {
  const pushedAt = parseISO(repo.pushed_at);

  if (differenceInMonths(new Date(), pushedAt) <= 3) {
    return true;
  }

  return false;
};

module.exports = {
  getRepos,
  cloneRepo,
  isActive,
  getCodeDir,
};
