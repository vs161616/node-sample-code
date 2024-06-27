import { RequestHandler } from 'express';
import Joi from 'joi';
import { relogRequestHandler } from '../../middlewares/request-middleware';
import { Invoice, IInvoice } from '../../models/Invoice';

/**
 * Joi schema for validating draft invoice data.
 * Defines a relaxed structure with optional fields for creating draft invoices.
 */
export const addDraftInvoiceSchema = Joi.object().keys({
  paymentTerms: Joi.number(),
  description: Joi.string(),
  clientName: Joi.string(),
  clientEmail: Joi.string().email(),
  status: Joi.string().valid('draft').default('draft'),
  senderAddress: Joi.object({
    street: Joi.string(),
    city: Joi.string(),
    postCode: Joi.string(),
    country: Joi.string(),
  }),
  clientAddress: Joi.object({
    street: Joi.string(),
    city: Joi.string(),
    postCode: Joi.string(),
    country: Joi.string(),
  }),
  items: Joi.array().items(
    Joi.object({
      name: Joi.string(),
      quantity: Joi.number(),
      price: Joi.number(),
      total: Joi.number(),
    }),
  ),
});

/**
 * Request handler to add a new invoice as a draft.
 * Validates the request body against the addDraftInvoiceSchema and saves the draft invoice to the database.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
const addDraftInvoiceWrapper: RequestHandler = async (req, res) => {
  try {
    const {
      paymentTerms,
      description,
      clientName,
      clientEmail,
      senderAddress,
      clientAddress,
      items,
    } = req.body;

    // Prepare partial invoice data with default status 'draft'
    const invoiceData: Partial<IInvoice> = {
      paymentTerms,
      description,
      clientName,
      clientEmail,
      status: 'draft', // Ensure status is set to 'draft'
      senderAddress,
      clientAddress,
      items,
    };

    const invoice = new Invoice(invoiceData);

    await invoice.save();

    res.status(201).json(invoice.toJSON());
  } catch (error) {
    console.error('Error saving draft invoice:', error);
    res.status(500).json({ error: 'Failed to save draft invoice.' });
  }
};

// Export the request handler with validation middleware applied
export const addDraftInvoice = relogRequestHandler(addDraftInvoiceWrapper, {
  validation: { body: addDraftInvoiceSchema },
});
