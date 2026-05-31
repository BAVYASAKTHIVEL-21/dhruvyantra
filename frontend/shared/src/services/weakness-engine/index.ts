export {
  WEAKNESS_ANALYTICS_LIMIT,
  WEAKNESS_DEFAULT_WINDOW_DAYS,
  WEAKNESS_MIN_FOCUS_SECONDS,
  WEAKNESS_SCORING,
  WEAKNESS_TOP_TOPIC_LIMIT,
} from "./constants";

export {
  applyEvolvedWeakTopics,
  computeWeaknessEngine,
  toWeakTopicMasteryRows,
  topicWeaknessRank,
  weaknessPriorityScore,
  type WeaknessEngineInput,
} from "./compute-scores";

export {
  buildTopicCandidatePool,
  buildTrackedTopics,
  findSubjectForTopic,
  resolveCanonicalTopic,
  topicMatchesText,
} from "./topic-resolution";
