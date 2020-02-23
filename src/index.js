#!/usr/bin/env node
require('dotenv').config();
const path = require('path');
const os = require('os');
const commander = require('commander');
const mkdirp = require('mkdirp');
const {Octokit} = require('@octokit/rest');
const git = require('nodegit');
const prompts = require('prompts');
const packageJson = require('../package.json');

const originDir = __dirname;
const codeDir = path.join(os.homedir(), 'code');
mkdirp.sync(codeDir);

const octokit = new Octokit();

const getRepos = async (
	page,
	language = null,
	topic = null,
	byHelpWanted = false
) => {
	const q = `stars:>100 ${language ? `language:${language}` : ''} ${
		topic ? `topic:${topic}` : ''
	}`.trim();
	const sort = byHelpWanted ? 'help-wanted-issues' : 'stars';
	const order = 'desc';

	const searchResult = await octokit.search.repos({
		q,
		sort,
		order,
		page
	});

	const {data} = searchResult;
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
	await git.Clone(repo.cloneUrl, repo.name); // eslint-disable-line new-cap
};

(async () => {
	const program = new commander.Command(packageJson.name)
		.version(packageJson.version)
		.option('--starting-page <number>', Number.parseInt)
		.option('--language <language>')
		.option('--topic <topic>')
		.option('--by-help-wanted')
		.parse(process.argv);

	let page = program.startingPage || 1;

	// eslint-disable-next-line no-constant-condition
	while (true) {
		// eslint-disable-next-line no-await-in-loop
		const repos = await getRepos(
			page,
			program.language,
			program.topic,
			program.byHelpWanted
		);

		for (const repo of repos) {
			const onCancel = () => {
				process.chdir(originDir);
				process.exit();
			};

			// eslint-disable-next-line no-await-in-loop
			const response = await prompts(
				{
					type: 'confirm',
					name: 'willClone',
					message: `Do you want to clone this repo? ${repo.name}. ${repo.description}?`
				},
				{onCancel}
			);

			if (response.willClone) {
				try {
					await cloneRepo(repo); // eslint-disable-line no-await-in-loop
				} catch (error) {
					console.error(error);
				}
			}
		}

		page++;
	}
})();
