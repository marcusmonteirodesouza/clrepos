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
  const repos = data.items;
  return repos.map((repo) => {
    const { name } = repo;
    const { description } = repo;
    const cloneUrl = repo.clone_url;

    return {
      name,
      description,
      cloneUrl,
      language: repo.language,
    };
  });
};

const cloneRepo = async (repo) => {
  const dir = path.join(getCodeDir(), repo.language);
  mkdirp.sync(dir);
  process.chdir(dir);
  await git.Clone(repo.cloneUrl, repo.name); // eslint-disable-line new-cap
};

const isActive = (repo) => {
  const pushedAt = parseISO(repo.pushedAt);

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
