'use server';

import BookingModel from "@/database/booking.model";

import connectToDatabase from "../mongodb";

export const createBooking = async ({ eventId, slug, email}: { eventId: string; slug: string; email: string}) => {

    try{
        await connectToDatabase();
       void slug;
       const booking = await BookingModel.create({ eventId, email });

       return { success: true, booking };
    } catch (e) {
        console.error('create booking failed', e)
        return { success: false};
    }
}
