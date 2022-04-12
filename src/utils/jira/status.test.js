const { updateStatusWithName } = require('./status')

let client

beforeEach(() => {
  jest.clearAllMocks()
  client = {
    listTransitions: jest.fn().mockReturnValue([{
      name: 'In Progress',
      id: '3'
    }]),
    transitionIssue: jest.fn().mockReturnValue({})
  }
})

test('Gets ID for In progress status', async () => {
  await updateStatusWithName(client, 'QAA-123', 'In Progress')
  expect(client.transitionIssue).toHaveBeenCalledWith('QAA-123', { transition: { id: '3' } })
})

test('Gets ID for non case sensitive status', async () => {
  await updateStatusWithName(client, 'QAA-123', 'in progrEsS')
  expect(client.transitionIssue).toHaveBeenCalledWith('QAA-123', { transition: { id: '3' } })
})
test('Throws when status id is not found', async () => {
  await expect(async () => await updateStatusWithName(client, 'QAA-123', 'donso')).rejects.toThrowError("No id found for status of 'donso'")
  expect(client.transitionIssue).not.toHaveBeenCalled()
})
