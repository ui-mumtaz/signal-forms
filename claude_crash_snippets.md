## CLI Project Prompt
```
Create a Node script(index.js) that fetches the top 5 crypto prices from the CoinGecko API and prints them in a clean table — name, current price, 24-hour change. Keep the code clean and organized.
```

## Readability Refactor
```
Refactor this for readability and maintainability. Split it into
focused ES modules: an api module for the CoinGecko fetch, a format
module for the price and change helpers, and a table module for the
printing. Keep the output identical and don't add any dependencies.
```
## Config Coin Count
```
Make the number of coins configurable via a command line argument. Default to 5 if no argument is given. For example, `node index.js 10` should show the top 10.
```
## Prop Drill Fix
```
Look at the @App.jsx file and let me know how we could refactor this project to not prop-drill the Homepage. What are your suggestions?
```

## Favorites Feature
```
I want a favorites feature that let's us star coins from the list, filter to show only favorites, and persist with localStorage. How would you implement this?
```

## Git Commit Message SKill

```
Create a project-scoped skill called commit-msg. The workflow:

1. Check that there are staged changes with git diff --staged. If nothing is staged, stop and tell me to stage first.
2. Read the staged diff.
3. Generate a commit message in this format:

   type(scope): short subject

   - bullet of what changed
   - bullet of why

4. Run git commit with that message.

Types: feat, fix, refactor, chore, docs, style, test. Subject under 60 characters. Body bullets optional but encouraged. Never include a Co-Authored-By trailer.

Trigger when I say "write a commit message", "generate a commit", "commit my changes", or run /commit-msg.
```

## Playwirght MCP Install
```
claude mcp add -s user playwright -- npx @playwright/mcp@latest
```

## Playwright Test
```
Use Playwright to open the project and then click the star icon on the first coin in the list. Then click the favorites filter. Tell me if the starred coin is the only one showing, and take a screenshot.
```
## Use Explore Subagent
```
Use the Explore agent to map the data flow in this project. Where does the coin data come from? What components consume it? How does state move through the app after our recent refactor? Report back with a summary.
```

## Custom Subagent
```
Create a project-scoped subagent called code-reviewer. It should review the current uncommitted changes in this project and check for:

- Dead code or unused imports
- console.log statements left in
- Missing key props on lists in React
- Accessibility misses (missing alt text, missing aria labels on icon buttons)
- Hardcoded values that should be env vars or constants
- Anything that breaks the patterns in CLAUDE.md

It should produce a markdown report with findings, grouped by severity. It should NOT make any edits — just report.

Trigger it when I say "review my code", "run the reviewer", or /code-reviewer.
```
