import { Router } from 'express';
import * as InvoiceController from './controllers/invoice/index';
import { authMiddleware } from './middlewares/auth-middleware';

export const router = Router();

router.get('/invoices', authMiddleware, InvoiceController.all);
router.post('/invoice', authMiddleware, InvoiceController.addInvoice);
router.post('/invoice/saveAsDraft', authMiddleware, InvoiceController.addDraftInvoice);
router.post('/invoice/:invoiceId', authMiddleware, InvoiceController.editInvoice);
router.delete('/invoice/:id', authMiddleware, InvoiceController.deleteInvoice);
router.put('/invoice/markAsPaid/:invoiceId', authMiddleware, InvoiceController.markAsPaid);
router.get('/invoice/:id', authMiddleware, InvoiceController.getInvoiceById);
