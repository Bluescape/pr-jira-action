async function updateStatusWithName (client, issueKey, statusName) {
  const statusId = (await client.listStatus()).find(
    (comp) => comp.name.toLowerCase() === statusName.toLowerCase()
  )?.id
  if (!statusId) {
    throw Error(`No id found for status of '${statusName}'`)
  }
  await client.transitionIssue(issueKey, { transition: { id: statusId } })
  console.log('> Ticket moved to "In Progress"')
}

module.exports = {
  updateStatusWithName
}
