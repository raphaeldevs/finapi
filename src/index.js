const express = require('express')
const { v4: uuid } = require('uuid')

const app = express()
app.use(express.json())

const customers = []

// Middleware
function verifyIfExistsAccountCPF(request, response, next) {
  const { cpf } = request.headers

  const customer = customers.find(customer => customer.cpf === cpf)

  if (!customer) {
    return response.status(400).json({ error: 'Customer not found' })
  }

  request.customer = customer

  return next()
}

function getBalance(statement) {
  const balance = statement.reduce((accumulator, operation) => {
    if (operation.type === 'credit') {
      return accumulator + operation.amount
    }

    return accumulator - operation.amount
  }, 0)

  return balance
}

app.post('/account', (request, response) => {
  const { name, cpf } = request.body

  const customerAlreadyExists = customers.some(customer => customer.cpf === cpf)

  if (customerAlreadyExists) {
    return response.status(400).json({ error: 'Customer already exists' })
  }

  customers.push({
    id: uuid(),
    name,
    cpf,
    statement: []
  })

  return response.sendStatus(201)
})

app.get('/statement', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request

  return response.json(customer.statement)
})

app.post('/deposit', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request
  const { description, amount } = request.body

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: 'credit'
  }

  customer.statement.push(statementOperation)

  return response.sendStatus(201)
})

app.post('/withdraw', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request
  const { amount } = request.body

  const balance = getBalance(customer.statement)

  if (balance < amount) {
    return response.status(400).json({ error: 'Insufficient funds.' })
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: 'debit'
  }

  customer.statement.push(statementOperation)

  return response.sendStatus(201)
})

app.get('/statement/date', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request
  const { date } = request.query

  const dateFormatted = new Date(`${date} 00:00`)

  const statement = customer.statement.filter(
    operation =>
      operation.created_at.toDateString() === dateFormatted.toDateString()
  )

  return response.json(statement)
})

app.put('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request
  const { name } = request.body

  customer.name = name

  return response.sendStatus(201)
})

app.get('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request

  return response.json({
    ...customer,
    balance: getBalance(customer.statement)
  })
})

app.delete('/account', verifyIfExistsAccountCPF, (request, response) => {
  const customer = request

  customers.splice(customer, 1)

  return response.json(customers)
})

app.get('/balance', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request

  const balance = getBalance(customer.statement)

  return response.json(balance)
})

app.listen(3333, () => console.log('🎈 Hello!'))
