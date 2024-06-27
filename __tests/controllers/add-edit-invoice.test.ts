/* eslint-disable no-undef */
import request from 'supertest';
import { app } from '../../src/app'; // Import your Express app
import { connect, closeDatabase, clearDatabase } from '../test-setup';
import { Invoice } from '../../src/models/Invoice';

beforeAll(async () => await connect());
afterAll(async () => await closeDatabase());
afterEach(async () => await clearDatabase());

describe('Invoice Endpoints with Authentication', () => {
  const authHeader = { Authorization: 'Bearer mockToken' };

  it('should add a new invoice', async () => {
    const newInvoice = {
      paymentTerms: 30,
      description: 'Test Invoice',
      clientName: 'Client A',
      clientEmail: 'client@example.com',
      status: 'pending',
      senderAddress: {
        street: '123 Main St',
        city: 'Anytown',
        postCode: '12345',
        country: 'Country',
      },
      clientAddress: {
        street: '456 Elm St',
        city: 'Othertown',
        postCode: '54321',
        country: 'Another Country',
      },
      items: [
        { name: 'Item 1', quantity: 1, price: 100, total: 100 },
        { name: 'Item 2', quantity: 2, price: 50, total: 100 },
      ],
    };

    const res = await request(app)
      .post('/api/invoice')
      .set(authHeader)
      .send(newInvoice)
      .expect(201);
    console.log(res);

    expect(res.body).toHaveProperty('_id');
    expect(res.body).toMatchObject(newInvoice);
  });

  it('should edit an existing invoice', async () => {
    const invoice = new Invoice({
      paymentTerms: 30,
      description: 'Test Invoice',
      clientName: 'Client A',
      clientEmail: 'client@example.com',
      status: 'pending',
      senderAddress: {
        street: '123 Main St',
        city: 'Anytown',
        postCode: '12345',
        country: 'Country',
      },
      clientAddress: {
        street: '456 Elm St',
        city: 'Othertown',
        postCode: '54321',
        country: 'Another Country',
      },
      items: [
        { name: 'Item 1', quantity: 1, price: 100, total: 100 },
        { name: 'Item 2', quantity: 2, price: 50, total: 100 },
      ],
    });

    await invoice.save();

    const updatedData = {
      paymentTerms: 60,
      description: 'Updated Invoice',
      clientName: 'Updated Client A',
      clientEmail: 'updatedclient@example.com',
      status: 'paid',
      senderAddress: {
        street: '789 New St',
        city: 'Newtown',
        postCode: '67890',
        country: 'New Country',
      },
      clientAddress: {
        street: '101 New Elm St',
        city: 'Newtown',
        postCode: '09876',
        country: 'New Country',
      },
      items: [
        { name: 'Item 1', quantity: 1, price: 150, total: 150 },
        { name: 'Item 2', quantity: 2, price: 60, total: 120 },
      ],
    };

    const res = await request(app)
      .post(`/api/invoice/${invoice._id}`)
      .set(authHeader)
      .send(updatedData)
      .expect(200);

    expect(res.body).toHaveProperty('_id');
    expect(res.body.paymentTerms).toBe(60);
    expect(res.body.description).toBe('Updated Invoice');
    expect(res.body.clientName).toBe('Updated Client A');
    expect(res.body.clientEmail).toBe('updatedclient@example.com');
    expect(res.body.status).toBe('paid');
  });

  it('should return 400 for invalid invoice ID', async () => {
    const invalidId = 'invalid-id';

    await request(app)
      .post(`/api/invoice/${invalidId}`)
      .set(authHeader)
      .send({
        paymentTerms: 60,
        description: 'Updated Invoice',
        clientName: 'Updated Client A',
        clientEmail: 'updatedclient@example.com',
        status: 'paid',
      })
      .expect(400);
  });
});
