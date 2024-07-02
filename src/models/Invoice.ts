import moment from 'moment';
import { Document, Model, Schema, UpdateQuery, model } from 'mongoose';

/**
 * Interface for the item subdocument.
 * Includes the properties of the subdocument.
 *
 * @property {string} name - The name of the item.
 * @property {number} quantity - The quantity of the item.
 * @property {number} price - The price of the item.
 * @property {number} total - The total cost of the item (quantity * price).
 */
interface IItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

/**
 * Interface for the address subdocument.
 * Includes the properties of the subdocument.
 */
interface IAddress {
  street: string;
  city: string;
  postCode: string;
  country: string;
}



/**
 * Interface for the Invoice document.
 * Includes the properties of the document, along with methods.
 *
 * @property {string} id - The unique ID of the invoice.
 * @property {Date} createdAt - The date when the invoice was created.
 * @property {Date} paymentDue - The due date for payment of the invoice.
 * @property {string} description - The description of the invoice.
 * @property {number} paymentTerms - The payment terms in days.
 * @property {string} clientName - The name of the client.
 * @property {string} clientEmail - The email address of the client.
 * @property {'paid' | 'pending' | 'draft'} status - The status of the invoice.
 * @property {IAddress} senderAddress - The address of the sender.
 * @property {IAddress} clientAddress - The address of the client.
 * @property {IItem[]} items - The array of items included in the invoice.
 * @property {number} total - The total amount due in the invoice.
 * @method calculateTotal - Instance method to calculate the total amount due.
 */
export interface IInvoice extends Document {
  id: string;
  createdAt: Date;
  paymentDue: Date | string;
  description: string;
  paymentTerms: number;
  clientName: string;
  clientEmail: string;
  status: 'paid' | 'pending' | 'draft';
  senderAddress: IAddress;
  clientAddress: IAddress;
  items: IItem[];
  total: number;
  calculateTotal: () => number;
}

/**
 * Interface for the Invoice model extending Mongoose's Model.
 * Includes a static method to get overdue invoices.
 */
interface IInvoiceModel extends Model<IInvoice> {
  /**
   * Static method to get overdue invoices.
   * @returns {Promise<IInvoice[]>} A promise that resolves to an array of overdue invoices.
   */
  getOverdueInvoices: () => Promise<IInvoice[]>;
}

// Create the schema for the address subdocument
const addressSchema = new Schema<IAddress>({
  street: { type: String, required: true },
  city: { type: String, required: true },
  postCode: { type: String, required: true },
  country: { type: String, required: true },
});

// Create the schema for the item subdocument
const itemSchema = new Schema<IItem>({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  total: { type: Number, required: true },
});

// Function to generate random ID
function generateRandomId() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';

  let randomId = '';
  for (let i = 0; i < 2; i++) {
    randomId += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 4; i++) {
    randomId += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }

  return randomId;
}

// Create the schema for the Invoice document
const invoiceSchema = new Schema<IInvoice>(
  {
    id: { type: String },
    description: {
      type: String,
      required: function () {
        return this.status !== 'draft';
      },
    },
    paymentTerms: {
      type: Number,
      required: function () {
        return this.status !== 'draft';
      },
    },
    paymentDue: { type: Date },
    clientName: {
      type: String,
      required: function () {
        return this.status !== 'draft';
      },
    },
    clientEmail: {
      type: String,
      required: function () {
        return this.status !== 'draft';
      },
      validate: {
        validator: function (email: string) {
          return /^\S+@\S+\.\S+$/.test(email);
        },
        message: (props) => `${props.value} is not a valid email address!`,
      },
    },
    status: {
      type: String,
      required: function () {
        return this.status !== 'draft';
      },
      enum: ['paid', 'pending', 'draft'],
      default: 'pending',
    },
    senderAddress: {
      type: addressSchema,
      required: function () {
        return this.status !== 'draft';
      },
    },
    clientAddress: {
      type: addressSchema,
      required: function () {
        return this.status !== 'draft';
      },
    },
    items: {
      type: [itemSchema],
      required: function () {
        return this.status !== 'draft';
      },
    },
    total: {
      type: Number,
      required: function () {
        return this.status !== 'draft';
      },
      default: 0,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  },
);

// Pre-save hook to calculate total, generate unique ID, and calculate payment due date
invoiceSchema.pre<IInvoice>('save', async function (next) {
  // Ensure total is correctly calculated
  this.total = this.items.reduce(
    (sum: number, item: IItem) => sum + item.total,
    0,
  );

  next();
});

invoiceSchema.pre<IInvoice>('save', async function (next) {
  // Generate a unique ID if not already set
  if (!this.id) {
    let isUnique = false;
    let newId;

    while (!isUnique) {
      newId = generateRandomId();
      const existingInvoice = await this.model('Invoice').findOne({
        id: newId,
      });
      if (!existingInvoice) {
        isUnique = true;
      }
    }
    this.id = newId;
  }

  next();
});

// Instance method to calculate payment due date
invoiceSchema.pre<IInvoice>('save', async function (next) {
  if (!this.paymentDue) {
    this.paymentDue = moment(this.createdAt).add(this.paymentTerms, 'days').toDate();
  }

  next();
})

// Instance method to calculate total
invoiceSchema.methods.calculateTotal = function () {
  this.total = this.items.reduce(
    (sum: number, item: IItem) => sum + item.total,
    0,
  );
  return this.total;
};

// Middleware to update total when items are updated
invoiceSchema.pre('findOneAndUpdate', async function (next) {
  const update: UpdateQuery<IInvoice> = this.getUpdate();
  const query: unknown = this.getQuery();

  // Find the document being updated
  const docToUpdate = await this.model.findOne(query).exec();

  if (docToUpdate) {
    // If items exist in the document, calculate the total
    const items = update.items || docToUpdate.items;
    const total = items.reduce((sum: number, item: IItem) => sum + item.total, 0);
    
    // Set the total in the update object
    update.total = total;
  }
  
  next();
});

// Static method to get overdue invoices
invoiceSchema.statics.getOverdueInvoices = function () {
  return this.find({
    paymentDue: { $lt: new Date() },
    status: { $ne: 'paid' },
  });
};

// Add indexes
invoiceSchema.index({ clientEmail: 1 });
invoiceSchema.index({ id: 1 });

// Create and export the Invoice model
export const Invoice: IInvoiceModel = model<IInvoice, IInvoiceModel>(
  'Invoice',
  invoiceSchema,
);
