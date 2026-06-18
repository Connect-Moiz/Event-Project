import connectToDatabase from "@/lib/mongodb";
import { v2 as cloudinary } from 'cloudinary';
import { NextRequest, NextResponse } from "next/server";
import  Event  from '@/database/event.model';

const createSlug = (value: string): string =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')

const parseListField = (value: FormDataEntryValue | null): string[] => {
    if (value == null) {
        return []
    }

    if (typeof value !== 'string') {
        return []
    }

    const trimmed = value.trim()

    if (!trimmed) {
        return []
    }

    try {
        const parsed = JSON.parse(trimmed)

        if (Array.isArray(parsed)) {
            return parsed.map((item) => String(item).trim()).filter(Boolean)
        }
    } catch {
        // Fall through to comma-separated or single-value parsing.
    }

    return trimmed
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
}

export async function POST (req: NextRequest) {
    try{
        await connectToDatabase();

        const contentType = req.headers.get('content-type') ?? ''
        const isMultipart = contentType.includes('multipart/form-data')
        const isFormUrlEncoded = contentType.includes('application/x-www-form-urlencoded')

        let event: Record<string, string | string[]>
        let imageValue: FormDataEntryValue | string | undefined
        let tags: string[] = []
        let agenda: string[] = []

        if (isMultipart || isFormUrlEncoded) {
            const formData = await req.formData();

            event = Object.fromEntries(formData.entries()) as Record<string, string | string[]>
            imageValue = formData.get('image') ?? undefined
            tags = parseListField(formData.get('tags'))
            agenda = parseListField(formData.get('agenda'))
        } else {
            const body = await req.json()
            event = body as Record<string, string | string[]>
            imageValue = typeof body.image === 'string' ? body.image : undefined
            tags = Array.isArray(body.tags)
                ? body.tags.map((item) => String(item).trim()).filter(Boolean)
                : parseListField(typeof body.tags === 'string' ? body.tags : null)
            agenda = Array.isArray(body.agenda)
                ? body.agenda.map((item) => String(item).trim()).filter(Boolean)
                : parseListField(typeof body.agenda === 'string' ? body.agenda : null)
        }

        if (!event.slug && typeof event.title === 'string' && event.title.trim()) {
            event.slug = createSlug(event.title);
        }

        if (!event.title || !event.description || !event.overview || !event.venue || !event.location || !event.date || !event.time || !event.mode || !event.audience || !event.organizer) {
            return NextResponse.json({ message: 'Missing required event fields' }, { status: 400 })
        }

        if (!imageValue) {
            return NextResponse.json({message: 'Image file or image URL is required'}, { status: 400})
        }

        let imageUrl = ''
        if (typeof imageValue !== 'string') {
            const file = imageValue as File

            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const uploadResult = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    { resource_type: 'image', folder: 'DevEvent' },
                    (error, results) => {
                        if (error) return reject(error);
                        resolve(results);
                    }
                ).end(buffer);
            });

            imageUrl = (uploadResult as { secure_url: string }).secure_url;
        } else {
            imageUrl = imageValue
        }

        const createdEvent = await Event.create({
            ...event,
            image: imageUrl,
            tags: tags,
            agenda: agenda,
        });

        return NextResponse.json({ message: 'Event created successfully', event: createdEvent}, { status: 201});

    } catch (e) {
        console.error(e);
        return NextResponse.json({ message: 'Event Creation Failed', error: e instanceof Error ? e.message : 'Unknown'}, { status: 500})
    }
}




    export async function GET() {
        try {
            await connectToDatabase();

            const events = await Event.find().sort({ createdAt: -1 });

            return NextResponse.json({ message: 'Event fetched successfully', events }, { status: 200})

        } catch (e) {
            return NextResponse.json({ message: 'Event fatching failed', error: e}, { status: 500});
        }
    }


    // a route that accepts a slug as input => returns the event details
