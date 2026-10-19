import { describe, it, expect } from "vitest";
import { getSuggestedQuestions } from "./suggestedQuestions";

describe("getSuggestedQuestions", () => {
  it("puts questions for the equipment's own type first", () => {
    const [own, general] = getSuggestedQuestions("Tractors");
    expect(own.title).toBe("About this tractor");
    expect(own.questions).toContain("What horsepower is the tractor?");
    expect(general.title).toBe("Before you rent");
  });

  it("names irrigation and sprayers sensibly", () => {
    expect(getSuggestedQuestions("Irrigation")[0].title).toBe("About this irrigation equipment");
    expect(getSuggestedQuestions("Sprayers")[0].title).toBe("About this sprayer");
  });

  it("falls back to general equipment questions for unknown categories", () => {
    const [own] = getSuggestedQuestions(undefined);
    expect(own.title).toBe("About this equipment");
    expect(own.questions.length).toBeGreaterThan(0);
  });

  it("always includes the must-ask questions about operator, fuel and breakdowns", () => {
    const general = getSuggestedQuestions("Planters")[1].questions.join(" ");
    expect(general).toMatch(/operate it/);
    expect(general).toMatch(/fuel/);
    expect(general).toMatch(/breaks down/);
  });
});
