#!/usr/bin/env node
require("dotenv").config();
const commander = require("commander");
const mkdirp = require("mkdirp");
const { Octokit } = require("@octokit/rest");
const prompts = require("prompts");
const packageJson = require("../package.json");
const { getCodeDir } = require("./lib");
const { getRepos, cloneRepo, isActive } = require("./lib")(async () => {
  const originDir = __dirname;
  mkdirp.sync(getCodeDir());

  const octokit = new Octokit();

  const program = new commander.Command(packageJson.name)
    .version(packageJson.version)
    .option("--starting-page <number>", Number.parseInt)
    .option("--language <language>")
    .option("--topic <topic>")
    .option("--by-help-wanted")
    .parse(process.argv);

  let page = program.startingPage || 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const repos = await getRepos(
      octokit,
      page,
      program.language,
      program.topic,
      program.byHelpWanted
    );

    // eslint-disable-next-line no-restricted-syntax
    for (const repo of repos) {
      const onCancel = () => {
        process.chdir(originDir);
        process.exit();
      };

      if (isActive(repo)) {
        // eslint-disable-next-line no-await-in-loop
        const response = await prompts(
          {
            type: "confirm",
            name: "willClone",
            message: `Page ${page} - Do you want to clone this repo? ${repo.name}. ${repo.description}?`,
          },
          { onCancel }
        );

        if (response.willClone) {
          try {
            await cloneRepo(repo); // eslint-disable-line no-await-in-loop
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error("cloneRepo", error);
            throw error;
          }
        }
      }
    }

    page += 1;
  }
})();
