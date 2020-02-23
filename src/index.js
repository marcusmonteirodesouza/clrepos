require("dotenv").config();
const path = require("path");
const os = require("os");
const commander = require("commander");
const mkdirp = require("mkdirp");
const { Octokit } = require("@octokit/rest");
const git = require("nodegit");
const prompts = require("prompts");
const packageJson = require("../package.json");

const originDir = __dirname;
const codeDir = path.join(os.homedir(), "code");

const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN
});

const getRepos = async (page, language = null, topic = null) => {
  const q = `stars:>100 ${language ? `language:${language}` : ""} ${
    topic ? `topic:${topic}` : ""
  }`.trim();
  const sort = "stars";
  const order = "desc";

  const searchResult = await octokit.search.repos({
    q,
    sort,
    order,
    page
  });

  const { data } = searchResult;
  const repos = data.items;
  return repos.map(repo => {
    const name = repo.name;
    const description = repo.description;
    const cloneUrl = repo.clone_url;
    const language = repo.language;
    return {
      name,
      description,
      cloneUrl,
      language
    };
  });
};

const cloneRepo = async repo => {
  const dir = path.join(codeDir, repo.language);
  mkdirp.sync(dir);
  process.chdir(dir);
  await git.Clone(repo.cloneUrl, repo.name);
};

(async () => {
  const program = new commander.Command(packageJson.name)
    .version(packageJson.version)
    .requiredOption(
      "--page <number>",
      "page number of the results to fetch",
      Number.parseInt
    )
    .option("--language <language>")
    .option("--topic <topic>")
    .parse(process.argv);

  const repos = await getRepos(program.page, program.language, program.topic);
  for (let repo of repos) {
    const onCancel = _prompt => {
      console.log("Canceled!");
      process.exit();
    };
    const response = await prompts(
      {
        type: "confirm",
        name: "willClone",
        message: `Do you want to clone this repo? ${repo.name}. ${repo.description}?`
      },
      { onCancel }
    );

    if (response.willClone) {
      try {
        await cloneRepo(repo);
      } catch (err) {
        console.error(err);
      }
    }
  }

  process.chdir(originDir);
})();
