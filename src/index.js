const core = require('@actions/core')
const github = require('@actions/github')
const JiraApi = require('jira-client')

const issueTypes = {
  epic: '10000',
  story: '10001',
  task: '10002',
  subTask: '10003',
  bug: '10004'
}

async function createAndAssignTicket (client, projectId, { assignee, summary, description, component }) {
  const issue = await client.addNewIssue({
    fields: {
      summary,
      description,
      project: {
        id: projectId
      },
      issuetype: {
        id: issueTypes.task
      },
      components: component ? [
        {
          id: component
        }
      ] : []
    }
  })
  // adding assignee to the addNewIssue context requires an id instead of an email
  if (assignee) {
    await client.updateAssignee(issue.key, assignee)
    // 31 is In Progress
    await client.transitionIssue(issue.key, { transition: { id: '31' } })
  }
  return issue
}

async function main () {
  const token = core.getInput('github-token')
  const projectId = core.getInput('project-id')
  const host = core.getInput('host')
  const username = core.getInput('username')
  const password = core.getInput('password')
  const assignee = core.getInput('assignee')
  const component = core.getInput('component')
  const summary = 'Automatically Generated Ticket'
  const description = 'Auto generated description, please fill in.'
  // summary, description comes from github context
  const client = new JiraApi({
    protocol: 'https',
    host,
    username,
    password,
    apiVersion: '2',
    strictSSL: true
  })

  const issue = await createAndAssignTicket(client, projectId, assignee, { summary, description, component })
  console.log(`Issue created: ${host}/${issue.key}`)

  // Update the PR title
  const context = github.context
  console.log(JSON.stringify(context))
  const { owner, repo, number, event } = context.issue

  const octokit = github.getOctokit(token)
  await octokit.rest.pulls.update({
    owner,
    repo,
    pull_number: number,
    title: `${issue.key}: ${event.title}`
  })
}

main().catch((error) => {
  core.setFailed(error.message)
})
