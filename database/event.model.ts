import { model, models, Schema, type HydratedDocument, type Model } from 'mongoose'

type EventMode = 'online' | 'offline' | 'hybrid' | (string & {})

export interface Event {
  title: string
  slug: string
  description: string
  overview: string
  image: string
  venue: string
  location: string
  date: string
  time: string
  mode: EventMode
  audience: string
  agenda: string[]
  organizer: string
  tags: string[]
}

type EventDocument = HydratedDocument<Event>

const REQUIRED_TEXT_FIELDS: Array<
  keyof Pick<
    Event,
    | 'title'
    | 'description'
    | 'overview'
    | 'image'
    | 'venue'
    | 'location'
    | 'date'
    | 'time'
    | 'mode'
    | 'audience'
    | 'organizer'
  >
> = [
  'title',
  'description',
  'overview',
  'image',
  'venue',
  'location',
  'date',
  'time',
  'mode',
  'audience',
  'organizer',
]

const createSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

const normalizeDateToIso = (input: string): string => {
  const parsedDate = new Date(input)

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error('Invalid event date. Use a valid date value.')
  }

  return parsedDate.toISOString()
}

const normalizeTime = (input: string): string => {
  const raw = input.trim().toUpperCase()
  const time12hMatch = raw.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/)

  if (time12hMatch) {
    const [, hoursText, minutesText, meridiem] = time12hMatch
    const hours = Number(hoursText)
    const minutes = Number(minutesText)

    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
      throw new Error('Invalid event time. Use a valid time value.')
    }

    const normalizedHours = meridiem === 'AM' ? hours % 12 : (hours % 12) + 12
    return `${String(normalizedHours).padStart(2, '0')}:${minutesText}`
  }

  const time24hMatch = raw.match(/^(\d{1,2}):(\d{2})$/)

  if (!time24hMatch) {
    throw new Error('Invalid event time. Use HH:mm or h:mm AM/PM format.')
  }

  const [, hoursText, minutesText] = time24hMatch
  const hours = Number(hoursText)
  const minutes = Number(minutesText)

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error('Invalid event time. Use a valid time value.')
  }

  return `${String(hours).padStart(2, '0')}:${minutesText}`
}

const eventSchema = new Schema<Event>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    description: { type: String, required: true, trim: true },
    overview: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    venue: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    date: { type: String, required: true, trim: true },
    time: { type: String, required: true, trim: true },
    mode: { type: String, required: true, trim: true },
    audience: { type: String, required: true, trim: true },
    agenda: { type: [String], required: true, default: [] },
    organizer: { type: String, required: true, trim: true },
    tags: { type: [String], required: true, default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

// Keep a dedicated unique index on slug for fast lookup and uniqueness enforcement.
eventSchema.index({ slug: 1 }, { unique: true })

// Pre-save normalization validates required values, keeps slug synced with title, and normalizes date/time.
eventSchema.pre('save', function preSaveEvent(this: EventDocument) {
  for (const fieldName of REQUIRED_TEXT_FIELDS) {
    const value = this[fieldName]

    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`Event field "${fieldName}" is required and cannot be empty.`)
    }
  }

  const cleanAgenda = this.agenda.map((item) => item.trim()).filter(Boolean)
  if (cleanAgenda.length === 0) {
    throw new Error('Event field "agenda" must contain at least one non-empty item.')
  }
  this.agenda = cleanAgenda

  const cleanTags = this.tags.map((item) => item.trim()).filter(Boolean)
  if (cleanTags.length === 0) {
    throw new Error('Event field "tags" must contain at least one non-empty item.')
  }
  this.tags = cleanTags

  if (this.isModified('title') || !this.slug) {
    this.slug = createSlug(this.title)
  }

  this.date = normalizeDateToIso(this.date)
  this.time = normalizeTime(this.time)
})

const EventModel = (models.Event as Model<Event>) || model<Event>('Event', eventSchema)

export type EventWithTimestamps = Event & {
  createdAt: Date
  updatedAt: Date
}

export type EventHydratedDocument = EventDocument

export default EventModel
