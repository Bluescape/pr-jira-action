const issueTypes = {
  epic: '10000',
  story: '10001',
  task: '10002',
  subTask: '10003',
  bug: '10004'
}

async function createTask (client, projectName, title, { component, body } = {}) {
  const projectId = (await client.getProject(projectName.toUpperCase()))?.id

  if (!projectId) {
    throw Error(`Project Id not found for '${projectName}'`)
  }

  let components

  if (component) {
    // Get the component id
    const res = await client.listComponents(projectName)
    const id = res.find(comp => comp.name.toLowerCase() === component.toLowerCase())?.id
    if (!id) {
      throw Error(`Component Id not found for '${component}', it may not exist in the project '${projectName}'`)
    }
    components = [
      {
        id
      }
    ]
  }

  const issue = await client.addNewIssue({
    fields: {
      summary: title,
      description: body || '',
      project: {
        id: projectId
      },
      issuetype: {
        id: issueTypes.task
      },
      components
    }
  })

  if (!issue.key) {
    throw Error(JSON.stringify(issue))
  }

  return issue
}

module.exports = {
  createTask
}
