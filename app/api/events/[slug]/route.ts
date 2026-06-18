import { NextRequest, NextResponse } from "next/server";

import connectToDatabase from "@/lib/mongodb";
import Event from "@/database/event.model";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    // Connect to MongoDB
    await connectToDatabase();

    const { slug } = await params;

    // Validate slug
    if (!slug || typeof slug !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "A valid event slug is required.",
        },
        { status: 400 }
      );
    }

    const normalizedSlug = decodeURIComponent(slug).trim();

    if (!normalizedSlug) {
      return NextResponse.json(
        {
          success: false,
          message: "Event slug cannot be empty.",
        },
        { status: 400 }
      );
    }

    // Find event by slug
    const event = await Event.findOne({
      slug: normalizedSlug,
    }).lean();

    // Event not found
    if (!event) {
      return NextResponse.json(
        {
          success: false,
          message: "Event not found.",
        },
        { status: 404 }
      );
    }

    // Success response
    return NextResponse.json(
      { message: 'Event fetched successfully', event},
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("GET_EVENT_BY_SLUG_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Internal server error.",
      },
      { status: 500 }
    );
  }
}