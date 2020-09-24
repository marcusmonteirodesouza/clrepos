# CLRepos

Clone GitHub repositories via Command Line.

Will only ask for repositories that were pushed_at 3 or less months ago.

## Usage

`clrepos`

Starts prompting from the repositories with the most stars.

`clrepos --starting-page=<number>`

Starts from page `number` of the search results.

`clrepos --topic=<topic>`

Only prompts repos with the selected topic.

`clrepos --language=<language>`

Only prompts repos with the selected language.

`clrepos help-wanted-issues`

Orders by 'help wanted issues' instead of stars.
