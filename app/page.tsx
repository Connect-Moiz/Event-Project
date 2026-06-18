import EventCard from "@/components/EventCard";
import ExploreBtn from "@/components/Explorebtn";
import connectToDatabase from "@/lib/mongodb";
import EventModel from "@/database/event.model";
import type { Event as EventData } from "@/database";

const Page = async () => {
  await connectToDatabase();

  const events = (await EventModel.find().sort({ createdAt: -1 }).lean()) as EventData[];

  return (
    <section id="events">
      <h1 className="text-center">
        The Hub for Every <br /> Event You Can't Miss
      </h1>
      <p className="text-center mt-5">
        Hackathons, Meetups, and Conference, All in One Place
      </p>

      <ExploreBtn />

      <div className="mt-20 space-y-7">
        <h3>Featured Events</h3>

        <ul className="events">
          {events.map((event) => (
            <li key={event.slug} className="list-none">
              <EventCard {...event} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Page;
