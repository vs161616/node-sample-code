import { RequestHandler } from 'express';
import { Invoice } from '../../models/Invoice';
import { isValidObjectId } from 'mongoose';

/**
 * Request handler to delete an invoice by its ID.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 */
const deleteWrapper: RequestHandler = async (req, res) => {
  const { id } = req.params;
console.log("object")
console.log("object")
console.log("object")


  // Validate if the provided ID is a valid MongoDB ObjectId
  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid invoice ID' });
  }

  try {
    // Attempt to find and delete the invoice by ID
    const deletedInvoice = await Invoice.findByIdAndDelete(id);

    // If no invoice is found with the provided ID, return a 404 error
    if (!deletedInvoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Return a success message upon successful deletion
    res.json({ message: 'Invoice deleted successfully' });
  } catch (err) {
    // Handle server errors if deletion fails unexpectedly
    console.error('Error deleting invoice:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Export the request handler with validation middleware
export const deleteInvoice = deleteWrapper;
