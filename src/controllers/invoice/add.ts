import { RequestHandler } from 'express';
import Joi from 'joi';
import { relogRequestHandler } from '../../middlewares/request-middleware';
import { Invoice } from '../../models/Invoice';
import { isValidObjectId } from 'mongoose';
import moment from 'moment';

/**
 * Joi schema for validating invoice data.
 * Defines the required structure and types for each field in the invoice.
 */
export const addInvoiceSchema = Joi.object().keys({
  id: Joi.string(),
  paymentTerms: Joi.number().required(),
  description: Joi.string().required(),
  clientName: Joi.string().required(),
  clientEmail: Joi.string().email().required(),
  status: Joi.string().valid('paid', 'pending').required(),
  senderAddress: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    postCode: Joi.string().required(),
    country: Joi.string().required(),
  }).required(),
  clientAddress: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    postCode: Joi.string().required(),
    country: Joi.string().required(),
  }).required(),
  items: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        quantity: Joi.number().required(),
        price: Joi.number().required(),
        total: Joi.number().required(),
      }),
    )
    .required(),
});

/**
 * Request handler to add a new invoice.
 * Validates the request body against the addInvoiceSchema and saves the invoice to the database.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
const addInvoiceWrapper: RequestHandler = async (req, res) => {
  const {
    paymentTerms,
    description,
    clientName,
    clientEmail,
    status,
    senderAddress,
    clientAddress,
    items,
  } = req.body;

  const invoice = new Invoice({
    paymentTerms,
    description,
    clientName,
    clientEmail,
    status,
    senderAddress,
    clientAddress,
    items,
  });

  await invoice.save();

  let createdInvoice = invoice.toJSON();
  createdInvoice = { ...createdInvoice, paymentDue: moment(createdInvoice.paymentDue).format('DD MMM YYYY') };

  res.status(201).json(createdInvoice);
};

/**
 * Request handler to edit an existing invoice.
 * Validates the invoice ID, updates the invoice data, and saves the changes to the database.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
export const editInvoiceHandler: RequestHandler = async (req, res) => {
  const invoiceId = req.params.invoiceId;
  const invoiceData = req.body;
  const value = { ...invoiceData };

  if (!isValidObjectId(invoiceId)) {
    return res.status(400).json({ error: 'Invalid invoice ID' });
  }

  try {
    // Update status from 'draft' to 'pending' if applicable
    if (value.status === 'draft') {
      value.status = 'pending';
    }

    // Find the existing invoice by ID and update it
    const updatedInvoice = await Invoice.findByIdAndUpdate(invoiceId, value, {
      new: true,
    });

    if (!updatedInvoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    return res.json(updatedInvoice);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Request handler to mark an invoice as paid.
 * Validates the invoice ID and updates the status to 'paid'.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
export const markAsPaidHandler: RequestHandler = async (req, res) => {
  const invoiceId = req.params.invoiceId;

  if (!isValidObjectId(invoiceId)) {
    return res.status(400).json({ error: 'Invalid invoice ID' });
  }

  try {
    // Find the existing invoice by ID and update the status to 'paid'
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      invoiceId,
      { status: 'paid' },
      { new: true }
    );

    if (!updatedInvoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    return res.json(updatedInvoice);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


// Export the request handlers with validation middleware applied
export const addInvoice = relogRequestHandler(addInvoiceWrapper, {
  validation: { body: addInvoiceSchema },
});
export const editInvoice = relogRequestHandler(editInvoiceHandler, {
  validation: { body: addInvoiceSchema },
});
export const markAsPaid = relogRequestHandler(markAsPaidHandler);
