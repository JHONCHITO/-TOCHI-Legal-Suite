import mongoose, { Schema, Document, Model } from "mongoose";

export type InvoiceStatus = "borrador" | "pendiente" | "pagada" | "vencida" | "cancelada";

export interface IInvoiceItem {
  descripcion: string;
  cantidad: number;
  valorUnitario: number;
  subtotal: number;
}

export interface IPayment {
  fecha: Date;
  monto: number;
  metodo: "efectivo" | "transferencia" | "tarjeta" | "cheque" | "otro";
  referencia?: string;
  notas?: string;
}

export interface IInvoice extends Document {
  _id: mongoose.Types.ObjectId;
  numero: string;
  // Relaciones
  clienteId: mongoose.Types.ObjectId;
  casoId?: mongoose.Types.ObjectId;
  abogadoId: mongoose.Types.ObjectId;
  // Portal cliente
  portalCompartido?: boolean;
  portalCompartidoEn?: Date;
  // Fechas
  fechaEmision: Date;
  fechaVencimiento: Date;
  // Items
  concepto: string;
  items: IInvoiceItem[];
  // Valores
  subtotal: number;
  ivaPorcentaje?: number;
  impuestos: number;
  descuento: number;
  total: number;
  // Pagos
  pagos: IPayment[];
  montoPagado: number;
  saldoPendiente: number;
  // Estado
  estado: InvoiceStatus;
  // Notas
  notas?: string;
  terminos?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>({
  descripcion: { type: String, required: true },
  cantidad: { type: Number, required: true, default: 1 },
  valorUnitario: { type: Number, required: true },
  subtotal: { type: Number, required: true },
});

const PaymentSchema = new Schema<IPayment>({
  fecha: { type: Date, required: true },
  monto: { type: Number, required: true },
  metodo: {
    type: String,
    enum: ["efectivo", "transferencia", "tarjeta", "cheque", "otro"],
    required: true,
  },
  referencia: String,
  notas: String,
});

const InvoiceSchema = new Schema<IInvoice>(
  {
    numero: { type: String, required: true, unique: true },
    clienteId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    casoId: { type: Schema.Types.ObjectId, ref: "Case" },
    abogadoId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    portalCompartido: { type: Boolean, default: false },
    portalCompartidoEn: Date,
    fechaEmision: { type: Date, default: Date.now },
    fechaVencimiento: { type: Date, required: true },
    concepto: { type: String, required: true },
    items: [InvoiceItemSchema],
    subtotal: { type: Number, required: true },
    ivaPorcentaje: { type: Number, default: 19 },
    impuestos: { type: Number, default: 0 },
    descuento: { type: Number, default: 0 },
    total: { type: Number, required: true },
    pagos: [PaymentSchema],
    montoPagado: { type: Number, default: 0 },
    saldoPendiente: { type: Number, required: true },
    estado: {
      type: String,
      enum: ["borrador", "pendiente", "pagada", "vencida", "cancelada"],
      default: "pendiente",
    },
    notas: String,
    terminos: String,
  },
  {
    timestamps: true,
  }
);

// Generar numero de factura automatico
InvoiceSchema.pre("save", async function () {
  if (!this.numero) {
    const year = new Date().getFullYear();
    const count = await mongoose.models.Invoice.countDocuments();
    this.numero = `FAC-${year}-${String(count + 1).padStart(5, "0")}`;
  }
});

// Calcular saldo pendiente
InvoiceSchema.pre("save", function () {
  this.montoPagado = this.pagos.reduce((sum, pago) => sum + pago.monto, 0);
  this.saldoPendiente = this.total - this.montoPagado;
  
  // Actualizar estado basado en pagos
  if (this.saldoPendiente <= 0) {
    this.estado = "pagada";
  } else if (this.fechaVencimiento < new Date() && this.estado !== "cancelada") {
    this.estado = "vencida";
  }
});

const Invoice: Model<IInvoice> =
  mongoose.models.Invoice || mongoose.model<IInvoice>("Invoice", InvoiceSchema);

export default Invoice;
