// Questions a renter can tap to ask an owner, for farmers who aren't sure
// what to check before renting. Shown in the chat (Conversation.jsx); a tap
// puts the question in the message box so it can be edited before sending.

const BY_CATEGORY = {
  Tractors: [
    "What horsepower is the tractor?",
    "Which implements come with it (plough, harrow, trailer)?",
    "How much diesel does it use in a day of work?",
    "Is it 2-wheel or 4-wheel drive?",
  ],
  Ploughs: [
    "Is it a disc plough or a mouldboard plough?",
    "What size of tractor (horsepower) does it need?",
    "About how many hectares can it plough in a day?",
    "Will it fit my tractor's hitch?",
  ],
  Planters: [
    "How many rows does it plant at once?",
    "Which seeds can it plant (maize, soya beans, groundnuts)?",
    "Can it put down fertiliser while planting?",
    "Can the seed spacing be adjusted?",
  ],
  Harvesters: [
    "Which crops can it harvest?",
    "About how many hectares can it harvest in a day?",
    "Does it come with an operator?",
    "Can it handle a crop that is wet or has fallen over?",
  ],
  Irrigation: [
    "How much water can the pump move, and how far?",
    "Does it run on diesel, petrol, electricity or solar?",
    "About how much land can it water in a day?",
    "Are the pipes or hoses included, and how long are they?",
  ],
  Sprayers: [
    "What is the tank size?",
    "Is it a knapsack, boom or tractor-mounted sprayer?",
    "Has it been cleaned since the last chemical was used in it?",
    "Does it come with protective gear (mask, gloves)?",
  ],
  Other: [
    "What exactly is included with the equipment?",
    "Can you show me how it is used?",
  ],
};

const NAMES = {
  Tractors: "tractor", Ploughs: "plough", Planters: "planter", Harvesters: "harvester",
  Irrigation: "irrigation equipment", Sprayers: "sprayer", Other: "equipment",
};

const GENERAL = {
  title: "Before you rent",
  questions: [
    "Is it free on the dates I need?",
    "Does the price include someone to operate it, or do I operate it myself?",
    "Does the price include fuel?",
    "Can you deliver it to my farm? How much would that cost?",
    "When was it last serviced? Are there any problems I should know about?",
    "What happens if it breaks down while I'm using it?",
    "Can I see it working before I pay the deposit?",
  ],
};

// Groups of questions for one piece of equipment: its own type first,
// then the general ones. Unknown or missing categories get "Other".
export function getSuggestedQuestions(category) {
  const key = BY_CATEGORY[category] ? category : "Other";
  return [
    { title: `About this ${NAMES[key]}`, questions: BY_CATEGORY[key] },
    GENERAL,
  ];
}
