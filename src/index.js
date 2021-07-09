const express = require('express')
const { v4: uuid } = require('uuid')

const app = express()
app.use(express.json())

const customers = []

/**
 * id: uuid
 * cpf: string
 * name: string
 * statement: []
 */
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

app.listen(3333, () => console.log('🎈 Hello!'))
