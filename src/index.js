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

async function createAndAssignTicket (
  client,
  projectId,
  { summary, description, component }
) {
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
      components: component
        ? [
          {
            id: component
          }
        ]
        : []
    }
  })
  return issue
}

async function main () {
  const context = github.context.payload
  const { number, title, body } = context.issue
  const repo = context.repository.name
  const owner = context.repository.owner.login

  const token = core.getInput('github-token')
  let projectId = core.getInput('project-id')
  const projectName = core.getInput('project-name')

  const octokit = github.getOctokit(token)
  if (!projectId && projectName) {
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: number,
      body: 'Failed to create JIRA because both project-id and project-name were not defined.'
    })
    throw Error('Either project-id or project-name is required')
  }
  const host = core.getInput('host')
  const username = core.getInput('username')
  const password = core.getInput('password')
  const assignee = core.getInput('assignee')
  const component = core.getInput('component')

  const client = new JiraApi({
    protocol: 'https',
    host,
    username,
    password,
    apiVersion: '2',
    strictSSL: true
  })

  if (!projectId) {
    projectId = (await client.getProject(projectName)).id
  }

  const issue = await createAndAssignTicket(client, projectId, {
    summary: title,
    description: body,
    component
  })
  if (!issue.key) {
    throw Error(JSON.stringify(issue))
  }
  console.log(`Ticket created: https://${host}/browse/${issue.key}`)
  // adding assignee to the addNewIssue context requires an id instead of an email
  if (assignee) {
    await client.updateAssignee(issue.key, assignee)
    console.log(`> Ticket assigned to ${assignee}`)
    // 31 is In Progress
    await client.transitionIssue(issue.key, { transition: { id: '31' } })
    console.log('> Ticket moved to in progress')
  }

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
}

main().catch((error) => {
  core.setFailed(error.message)
})
