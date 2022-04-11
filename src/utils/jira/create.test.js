const { createTask } = require('./create')

let client

beforeEach(() => {
  jest.clearAllMocks()
  client = {
    listComponents: jest.fn().mockReturnValue([{
      id: '12345',
      name: 'Test',
      project: 'AD',
      projectId: 11201,
      archived: false
    }
    ]),
    addNewIssue: jest.fn().mockReturnValue({
      key: 'QAA-543'
    }),
    getProject: jest.fn().mockReturnValue({ id: '123' })
  }
})

test('Creates issue with component when found', async () => {
  await createTask(client, 'QAA', 'title', { component: 'Test' })
  expect(client.addNewIssue).toHaveBeenCalledTimes(1)
  expect(client.addNewIssue).toHaveBeenCalledWith({
    fields: {
      summary: 'title',
      description: '',
      project: {
        id: '123'
      },
      issuetype: {
        id: '10002'
      },
      components: [
        {
          id: '12345'
        }
      ]
    }
  })
})

test('Creates issue with component when found with different casing', async () => {
  await createTask(client, 'QAA', 'title', { component: 'tEsT' })
  expect(client.addNewIssue).toHaveBeenCalledTimes(1)
  expect(client.addNewIssue).toHaveBeenCalledWith({
    fields: {
      summary: 'title',
      description: '',
      project: {
        id: '123'
      },
      issuetype: {
        id: '10002'
      },
      components: [
        {
          id: '12345'
        }
      ]
    }
  })
})

test('Creates issue with description when body set', async () => {
  await createTask(client, 'QAA', 'title', { body: 'Test' })
  expect(client.addNewIssue).toHaveBeenCalledTimes(1)
  expect(client.addNewIssue).toHaveBeenCalledWith({
    fields: {
      summary: 'title',
      description: 'Test',
      project: {
        id: '123'
      },
      issuetype: {
        id: '10002'
      }
    }
  })
})

test('Creates issue without component when not defined', async () => {
  await createTask(client, 'QAA', 'title')
  expect(client.addNewIssue).toHaveBeenCalledTimes(1)
  expect(client.addNewIssue).toHaveBeenCalledWith({
    fields: {
      summary: 'title',
      description: '',
      project: {
        id: '123'
      },
      issuetype: {
        id: '10002'
      }
    }
  })
})

test('Throws when projectId isnt found', async () => {
  client.getProject = jest.fn().mockReturnValue({})
  await expect(async () => await createTask(client, 'AD', 'title')).rejects.toThrow()
})

test('Throws when component isnt found', async () => {
  await expect(async () => await createTask(client, 'QAA', 'title', { component: 'NotReal' })).rejects.toThrow()
})

test('Throws when key isnt present in issue', async () => {
  client.addNewIssue = jest.fn().mockReturnValue({})
  await expect(async () => await createTask(client, 'QAA', 'title')).rejects.toThrow()
})
