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
  console.log(`Ticket created: ${JSON.stringify(issue)}`)
  // adding assignee to the addNewIssue context requires an id instead of an email
  if (assignee) {
    await client.updateAssignee(issue.key, assignee)
    console.log('Ticket assigned')
    // 31 is In Progress
    await client.transitionIssue(issue.key, { transition: { id: '31' } })
    console.log('Ticket moved to in progress')
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

  const context = github.context
  console.log(JSON.stringify(context.payload.issue))
  const { owner, repo, number, title } = context.payload.issue
  // summary, description will come from github context
  const description = context.payload.issue.description || 'Auto generated description, please fill in.'

  const client = new JiraApi({
    protocol: 'https',
    host,
    username,
    password,
    apiVersion: '2',
    strictSSL: true
  })

  const issue = await createAndAssignTicket(client, projectId, { assignee, summary: title, description, component })
  console.log(`Issue created: ${host}/${issue.key}`)

  const octokit = github.getOctokit(token)
  // Update the PR title
  await octokit.rest.pulls.update({
    owner,
    repo,
    pull_number: number,
    title: `${issue.key}: ${title}`
  })
}

main().catch((error) => {
  core.setFailed(error.message)
})
