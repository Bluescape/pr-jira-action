async function updateStatusWithName (client, issueKey, statusName) {
  const statusId = (await client.listStatus()).find(
    (comp) => comp.name.toLowerCase() === statusName.toLowerCase()
  )?.id
  if (!statusId) {
    throw Error(`No id found for status of '${statusName}'`)
  }
  console.log(`> Status '${statusName}' found with id '${statusId}'`)
  await client.transitionIssue(issueKey, { transition: { id: statusId.toString() } })
  console.log('> Ticket moved to "In Progress"')
}

module.exports = {
  updateStatusWithName
}
