const SECTIONS = [
  {
    title: "1. Using AgroRent",
    body: "AgroRent connects equipment owners with renters. You must be at least 18 years old and provide accurate information when creating an account, listing equipment, or making a booking.",
  },
  {
    title: "2. Listings",
    body: "Owners are responsible for the accuracy of their listings, including equipment condition, availability, and pricing. AgroRent does not own or inspect listed equipment.",
  },
  {
    title: "3. Bookings and payment",
    body: "A booking request must be accepted by the owner before it is confirmed. Renters agree to pay the listed daily rate for the agreed rental period. Cancellation terms are set by the individual owner unless otherwise stated on the listing.",
  },
  {
    title: "4. Responsibilities during rental",
    body: "Renters are responsible for the safe and appropriate use of rented equipment for the duration of the booking, and for returning it in the condition it was received, ordinary wear and tear excepted.",
  },
  {
    title: "5. Reviews",
    body: "Reviews must reflect a genuine rental experience. AgroRent may remove reviews that are abusive, fraudulent, or unrelated to the rental itself.",
  },
  {
    title: "6. Disputes",
    body: "Disagreements between renters and owners about a booking should first be resolved directly between the two parties. If that isn't possible, either party can raise it with AgroRent support for review.",
  },
  {
    title: "7. Changes to these terms",
    body: "We may update these terms from time to time. Continued use of AgroRent after a change means you accept the updated terms.",
  },
];

export default function TermsOfService() {
  return (
    <div className="pt-14 bg-white min-h-[calc(100vh-56px)]">
      <section className="bg-green-dark px-6 py-14 text-center">
        <h1 className="text-[26px] font-medium text-white">Terms of Service</h1>
        <p className="text-[13px] text-green-tint-2 mt-2">Last updated August 2026</p>
      </section>

      <section className="max-w-[720px] mx-auto px-4 sm:px-6 py-12">
        <p className="text-sm text-ink-muted leading-[1.7] mb-8">
          These terms govern your use of AgroRent to list, browse, and rent farm equipment. By
          creating an account you agree to the terms below.
        </p>

        {SECTIONS.map((s) => (
          <div key={s.title} className="mb-7">
            <h2 className="text-base font-medium text-ink mb-2">{s.title}</h2>
            <p className="text-sm text-ink-muted leading-[1.7]">{s.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
