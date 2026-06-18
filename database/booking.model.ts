import {
  model,
  models,
  Schema,
  Types,
  type HydratedDocument,
  type Model,
} from 'mongoose'
import EventModel from './event.model'

export interface Booking {
  eventId: Types.ObjectId
  email: string
}

type BookingDocument = HydratedDocument<Booking>

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const bookingSchema = new Schema<Booking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [EMAIL_REGEX, 'Please provide a valid email address.'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

// Index eventId to speed up event-based booking lookups.
bookingSchema.index({ eventId: 1 })

// Validate referential integrity so bookings cannot point to a missing event.
bookingSchema.pre('save', async function preSaveBooking(this: BookingDocument) {
  const existingEvent = await EventModel.exists({ _id: this.eventId })

  if (!existingEvent) {
    throw new Error('Referenced event does not exist.')
  }
})

const BookingModel =
  (models.Booking as Model<Booking>) || model<Booking>('Booking', bookingSchema)

export type BookingWithTimestamps = Booking & {
  createdAt: Date
  updatedAt: Date
}

export default BookingModel;
