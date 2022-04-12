async function updateStatusWithName (client, issueKey, statusName) {
  const { transitions } = await client.listTransitions(issueKey)
  const transitionId = transitions.find(
    (status) => status.name.toLowerCase() === statusName.toLowerCase()
  )?.id
  if (!transitionId) {
    throw Error(`No id found for status of '${statusName}'`)
  }
  console.log(`> Transition ID '${statusName}' found with id '${transitionId}'`)
  await client.transitionIssue(issueKey, { transition: { id: transitionId } })
  console.log('> Ticket moved to "In Progress"')
}

module.exports = {
  updateStatusWithName
}
