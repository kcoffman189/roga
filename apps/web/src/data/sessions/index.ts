// apps/web/src/data/sessions/index.ts
import type { RogaSessionSeed } from "./types";
import mentorMentee from "./mentor-mentee.json";

export const sessionSeeds: RogaSessionSeed[] = [mentorMentee];

// Simple helpers
export const getSessionById = (id: string) =>
  sessionSeeds.find(s => s.id === id);

export const getDefaultSession = () => sessionSeeds[0];
