import { mockDelay } from "./api";
import { MESSAGES } from "../data/mockData";

// Mock service backing Messages.jsx / Conversation.jsx.
export const messageService = {
  async getConversations() {
    await mockDelay();
    return MESSAGES;
  },

  async getConversation(id) {
    await mockDelay();
    const convo = MESSAGES.find((m) => m.id === id);
    if (!convo) throw new Error(`Conversation ${id} not found`);
    return convo;
  },

  async sendMessage(conversationId, text) {
    await mockDelay(150);
    return { id: Date.now(), conversationId, from: "me", text, time: "Now" };
  },
};
