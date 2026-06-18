import BookEvent from "@/components/BookEvent";
import EventCard from "@/components/EventCard";
import { getSimilarEventsBySlug } from "@/lib/actions/event.actions";
import connectToDatabase from "@/lib/mongodb";
import EventModel from "@/database/event.model";
import type { Event as EventData } from "@/database";
import Image from "next/image";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const EventDetailItem = ({
  icon,
  alt,
  label,
}: {
  icon: string;
  alt: string;
  label: string;
}) => (
  <div className="flex-row-gap-2 items-center">
    <Image src={icon} alt={alt} width={17} height={17} />
    <p>{label}</p>
  </div>
);

const EventAgenda = ({ agendaItems }: { agendaItems: string[] }) => (
  <div className="agenda">
    <h2>Agenda</h2>
    <ul>
      {agendaItems.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  </div>
);

const EventTags = ({ tags }: { tags: string[] }) => (
  <div className="flex flex-row gap-1.5 flex-wrap">
    {tags.map((tag) => (
      <div className="pill" key={tag}>
        {tag}
      </div>
    ))}
  </div>
);

const EventDetailsPage = async ({ params }: PageProps) => {
  const { slug } = await params;

  await connectToDatabase();

  const event = (await EventModel.findOne({ slug }).lean()) as EventData | null;

  if (!event) {
    notFound();
  }

  const bookings = 10;
  const similarEvents = (await getSimilarEventsBySlug(slug)) as EventData[];

  return (
    <section id="event">
      <div className="header">
        <h1>Event Description</h1>
        <p>{event.description}</p>
      </div>

      <div className="details">
        <div className="content">
          <Image
            src={event.image}
            alt={event.title}
            width={800}
            height={800}
            className="banner"
          />

          <section className="flex-col-gap-2">
            <h2>Overview</h2>
            <p>{event.overview}</p>
          </section>

          <section>
            <h2>Event Details</h2>
            <EventDetailItem icon="/icons/calendar.svg" alt="calendar" label={event.date} />
            <EventDetailItem icon="/icons/clock.svg" alt="clock" label={event.time} />
            <EventDetailItem icon="/icons/pin.svg" alt="pin" label={event.location} />
            <EventDetailItem icon="/icons/mode.svg" alt="mode" label={event.mode} />
            <EventDetailItem icon="/icons/audience.svg" alt="audience" label={event.audience} />
          </section>

          <EventAgenda agendaItems={event.agenda ?? []} />

          <section className="flex-col-gap-2">
            <h2>About the Organizer</h2>
            <h3>{event.organizer}</h3>
          </section>

          <EventTags tags={event.tags ?? []} />
        </div>

        <aside className="booking">
          <div className="signup-card">
            <h2>Book Your Spot</h2>
            {bookings > 0 ? (
              <p className="text-sm">
                Join {bookings} people who have already booked their spot!
              </p>
            ) : (
              <p className="text-sm">Be the first to book your spot!</p>
            )}

            <BookEvent />
          </div>
        </aside>
      </div>

      <div className="flex w-full flex-col gap-4 pt-20">
        <h2>Similar Events</h2>

        <div className="events">
          {similarEvents.length > 0 ? (
            similarEvents.map((similarEvent) => (
              <EventCard key={similarEvent.title} {...similarEvent} />
            ))
          ) : (
            <p>No similar events found.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default EventDetailsPage;
