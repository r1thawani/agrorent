const SECTIONS = [
  {
    title: "1. Information we collect",
    body: "When you create an account, we collect your name, email address, and profile photo. If you list equipment, we also collect the details you provide about that equipment, including photos, pricing, and location. If you book equipment, we collect the booking dates and any messages you exchange with the owner.",
  },
  {
    title: "2. How we use your information",
    body: "We use your information to operate AgroRent: creating and displaying your listings, matching renters with owners, processing bookings, and sending you notifications about activity on your account. We do not sell your personal information to third parties.",
  },
  {
    title: "3. Sharing between users",
    body: "When you book equipment, your name and contact details are shared with the equipment owner so the rental can be arranged, and vice versa. Public profile information (name, photo, listings, reviews) is visible to anyone browsing AgroRent.",
  },
  {
    title: "4. Data retention",
    body: "We keep your account information for as long as your account is active. You can request deletion of your account and associated data at any time by contacting support.",
  },
  {
    title: "5. Your choices",
    body: "You can review and update your profile information at any time from your account settings. You can also contact us to ask what information we hold about you.",
  },
  {
    title: "6. Contact",
    body: "Questions about this policy can be sent to support@agrorent.co.zm.",
  },
];

export default function PrivacyPolicy() {
  return (
    <div style={{ paddingTop: "56px", backgroundColor: "#FFFFFF", minHeight: "calc(100vh - 56px)" }}>
      <section style={{ backgroundColor: "#0F3D1E", padding: "56px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 500, color: "#FFFFFF" }}>Privacy Policy</h1>
        <p style={{ fontSize: "13px", color: "#A8E6BE", marginTop: "8px" }}>Last updated August 2026</p>
      </section>

      <section style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 24px" }}>
        <p style={{ fontSize: "14px", color: "#555555", lineHeight: 1.7, marginBottom: "32px" }}>
          This policy explains what information AgroRent collects when you use the platform to
          rent or list farm equipment, and how that information is used.
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
