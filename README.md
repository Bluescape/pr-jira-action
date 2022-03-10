# bluescape/pr-jira-action

## Description
GitHub Action that creates JIRA's based off of a pull request. When called, the action will use the github context to: 
- Create a JIRA ticket in a specified project
- Assign it to a user
- Set it to "In Progress"
- Update the name of the PR to include that JIRA as a prefix

## Usage
### Pre-requisites
Create a workflow `.yml` file in your `.github/workflows` directory. An example workflow is available below. For more information, reference the GitHub Help Documentation for [Creating a workflow file](https://help.github.com/en/articles/configuring-a-workflow#creating-a-workflow-file).

### Example
```
      - uses: bluescape/pr-jira-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          project-id: ${JIRA_PROJECT_ID} # set to whatever value
          component: ${JIRA_COMPONENT_ID} # set to whatever value
          host: jira.com
          username: ${{ secrets.JIRA_USERNAME }}
          password: ${{ secrets.JIRA_PASSWORD }}
          assignee: ${{ steps.get-email.outputs.email }}
```

### Common Implementations
Generally this action will be triggered by a label or a comment on a PR. Here is an example of triggering the action based on comment of /jira in a pull request which then uses the email of the latest committer to assign the JIRA to.
```
name: Create JIRA for PR

on:
  issue_comment:
    types: [created]

jobs:
  create_jira:
    if: github.event.issue.pull_request
    runs-on: ubuntu-latest
    steps:
      - name: Check if matched
        id: check
        if: github.event.comment.body == '/jira' # This is customizable
        run: |
          echo 'Matching comment found'
      - name: Get PR SHA
        if: steps.check.conclusion == 'success'
        id: sha
        uses: actions/github-script@v4
        with:
          result-encoding: string
          script: |
            const { owner, repo, number } = context.issue;
            const pr = await github.pulls.get({
              owner,
              repo,
              pull_number: number,
            });
            return pr.data.head.sha     
      - uses: actions/checkout@v1
        if: steps.check.conclusion == 'success'
        with:
          ref: ${{ steps.sha.outputs.result }}
      - name: Get User Email
        if: steps.check.conclusion == 'success'
        id: get-email
        run: |
          commitCount=1
          while [ -z "$email" ]
          do
            # Ignore the merge commits made by github
            email=$(git show -s --format='%ae' $(git rev-parse HEAD -${commitCount}) | grep -v "@users.noreply.github.com")
            ((commitCount=commitCount+1))
          done
          echo "::set-output name=email::${email}"
      - uses: bluescape/pr-jira-action@v1
        if: steps.check.conclusion == 'success'
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          project-id: 1234
          component: 4321
          host: jira.com
          username: ${{ secrets.JIRA_USERNAME }}
          password: ${{ secrets.JIRA_PASSWORD }}
          assignee: ${{ steps.get-email.outputs.email }}

```
