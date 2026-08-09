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
    <div style={{ paddingTop: "56px", backgroundColor: "#FFFFFF", minHeight: "calc(100vh - 56px)" }}>
      <section style={{ backgroundColor: "#0F3D1E", padding: "56px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 500, color: "#FFFFFF" }}>Terms of Service</h1>
        <p style={{ fontSize: "13px", color: "#A8E6BE", marginTop: "8px" }}>Last updated August 2026</p>
      </section>

      <section style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ fontSize: "14px", color: "#555555", lineHeight: 1.7, marginBottom: "32px" }}>
          These terms govern your use of AgroRent to list, browse, and rent farm equipment. By
          creating an account you agree to the terms below.
        </p>

        {SECTIONS.map((s) => (
          <div key={s.title} style={{ marginBottom: "28px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 500, color: "#111111", marginBottom: "8px" }}>
              {s.title}
            </h2>
            <p style={{ fontSize: "14px", color: "#555555", lineHeight: 1.7 }}>{s.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
