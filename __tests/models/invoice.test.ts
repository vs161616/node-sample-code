/* eslint-disable no-undef */
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { Invoice } from '../../src/models/Invoice';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Invoice model', () => {
  beforeEach(async () => {
    await Invoice.create({
      _id: '507f191e810c19729de860ea',
      id: 'RM0908',
      createdAt: '2024-06-19T14:45:12.493Z',
      paymentDue: '2024-06-19T14:45:12.493Z',
      description: 'Test invoice',
      paymentTerms: 30,
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
      total: 200,
    });

    await Invoice.create({
      _id: '507f191e810c19729de860ef',
      id: 'JM4560',
      createdAt: new Date(),
      paymentDue: new Date(),
      description: 'Test invoice 234234',
      paymentTerms: 30,
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
      total: 200,
    });
  });

  afterEach(async () => {
    await Invoice.deleteMany({});
  });

  test('should return the doc with findById', async () => {
    const invoice = await Invoice.findById('507f191e810c19729de860ea').exec();
    console.log(invoice, 'invoice+++++++++++++++');
    expect(invoice).toBeDefined();
    expect(invoice!.id).toBe('RM0908');
    expect(invoice!.total).toBe(200);
  });

  test('should update the doc with findOneAndUpdate and also auto calculate total', async () => {
    const updatedInvoice = await Invoice.findOneAndUpdate(
      { id: 'RM0908' },
      {
        $set: {
          description: 'Updated invoice',
          clientName: 'Updated Client A',
          items: [
            { name: 'Item 1', quantity: 1, price: 150, total: 150 },
            { name: 'Item 2', quantity: 2, price: 60, total: 120 },
          ],
        },
      },
      { new: true },
    ).exec();
    console.log(updatedInvoice);

    expect(updatedInvoice).toBeDefined();
    expect(updatedInvoice!.id).toBe('RM0908');
    expect(updatedInvoice!.description).toBe('Updated invoice');
    expect(updatedInvoice!.clientName).toBe('Updated Client A');
    // expect(updatedInvoice!.items[0].price).toBe(150);
    // expect(updatedInvoice!.items[0].total).toBe(150);
    // expect(updatedInvoice!.items[1].price).toBe(60);
    // expect(updatedInvoice!.items[1].total).toBe(120);

    // Verify that the total is correctly recalculated
    expect(updatedInvoice!.total).toBe(270);
  });

  // Add more test cases as needed
});
