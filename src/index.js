const core = require('@actions/core')
const github = require('@actions/github')
const JiraApi = require('jira-client')
const { createTask } = require('./utils/jira/create')
const { updateStatusWithName } = require('./utils/jira/status')

const context = github.context.payload
const { number, title, body } = context.issue
const repo = context.repository.name
const owner = context.repository.owner.login

const token = core.getInput('github-token')
const octokit = github.getOctokit(token)

const host = core.getInput('host')
const username = core.getInput('username')
const password = core.getInput('password')
const assignee = core.getInput('assignee')
const component = core.getInput('component')
const projectName = core.getInput('project-name')
const status = core.getInput('status')

async function main () {
  const client = new JiraApi({
    protocol: 'https',
    host,
    username,
    password,
    apiVersion: '2',
    strictSSL: true
  })

  const issue = await createTask(client, projectName, title, { component, body })
  console.log(`Ticket created: https://${host}/browse/${issue.key}`)

  // adding assignee to the addNewIssue context requires an id instead of an email
  if (assignee) {
    await client.updateAssignee(issue.key, assignee)
    console.log(`> Ticket assigned to ${assignee}`)
    // 31 is In Progress
    try {
      updateStatusWithName(client, issue.key, status)
    } catch (e) {
      console.warn(e)
      console.warn('> Could not move the ticket to "In Progress", it may not be an option in the workflow')
    }
  }
  return issue
}

main().then(async (issue) => {
  // Update the PR title
  const newTitle = `${issue.key}: ${title}`
  await octokit.rest.pulls.update({
    owner,
    repo,
    pull_number: number,
    title: newTitle
  })
  console.log(`> PR Title updated as '${newTitle}'`)
  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: number,
    body: `JIRA created: https://${host}/browse/${issue.key}`
  })
}).catch(async (error) => {
  core.setFailed(error.message)
  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: number,
    body: `Failed to create JIRA: ${error.message}`
  })
})
