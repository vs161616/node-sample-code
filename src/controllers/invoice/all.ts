import { RequestHandler } from 'express';
import { Invoice } from '../../models/Invoice';
import { isValidObjectId } from 'mongoose';
import moment from 'moment';

/**
 * Request handler to retrieve all invoices.
 * Formats the paymentDue date to 'YYYY-MM-DD' for each invoice before returning them.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
const allWragger: RequestHandler = async (req, res) => {
  const invoices = await Invoice.find();
  console.log(invoices);
  console.log(invoices);

  const formattedInvoices = invoices.map((invoice) => ({
    ...invoice.toJSON(),
    paymentDue: moment(invoice.paymentDue).format('YYYY-MM-DD'),
  }));
  res.status(200).json(formattedInvoices);
};

/**
 * Request handler to retrieve an invoice by its ID.
 * Validates the invoice ID and returns the invoice if found.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
const getInvoiceByIdWrapper: RequestHandler = async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid invoice ID' });
  }

  const invoice = await Invoice.findById(id);
  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found' });
  } else {
    res.status(200).json(invoice);
  }
};

export const all = allWragger;
export const getInvoiceById = getInvoiceByIdWrapper;
