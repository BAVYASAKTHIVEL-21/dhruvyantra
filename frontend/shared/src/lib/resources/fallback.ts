import type { Resource, ResourceSubject, ResourceType } from "@/types/resource";

function seed(
  id: string,
  subject: ResourceSubject,
  topic: string,
  type: ResourceType,
  flags: { recommended?: boolean; featured?: boolean } = {},
): Resource {
  const title =
    type === "PYQs"
      ? `${topic} PYQ Bank`
      : type === "DPPs"
        ? `${topic} DPP Set`
        : type === "Notes"
          ? `${topic} Notes`
          : type === "Books"
            ? `${topic} Reference Book`
            : `${topic} ${type}`;

  return {
    id,
    title,
    subject,
    topic,
    type,
    difficulty: type === "PYQs" ? "Hard" : "Medium",
    rating: 4.5 + (id.charCodeAt(id.length - 1) % 5) * 0.1,
    reviewCount: 40 + (id.charCodeAt(1) % 20) * 10,
    thumbnail: type === "PYQs" ? "pyqs" : type === "DPPs" ? "dpp" : type === "Videos" ? "video" : "formula",
    fileSize: type === "Videos" ? undefined : `${8 + (id.length % 12)} MB`,
    duration: type === "Videos" ? "35 min" : undefined,
    tags: [topic.toLowerCase(), subject.toLowerCase(), type.toLowerCase(), "jee", "neet"],
    source: "local",
    driveUrl: "#",
    recommended: flags.recommended ?? false,
    weakTopicRelated: false,
    featured: flags.featured ?? false,
    classLabel: `${subject} · ${topic}`,
  };
}

/** JEE + NEET topics — 3 resource types each (Notes, PYQs, DPPs) */
const TOPIC_ROWS: { subject: ResourceSubject; topic: string; pick?: boolean }[] = [
  // JEE Physics
  { subject: "Physics", topic: "Mechanics", pick: true },
  { subject: "Physics", topic: "Electrostatics", pick: true },
  { subject: "Physics", topic: "Current Electricity" },
  { subject: "Physics", topic: "Optics" },
  { subject: "Physics", topic: "Modern Physics" },
  { subject: "Physics", topic: "Thermodynamics" },
  { subject: "Physics", topic: "Rotational Motion", pick: true },
  { subject: "Physics", topic: "Waves" },
  { subject: "Physics", topic: "Magnetism" },
  // JEE Chemistry
  { subject: "Chemistry", topic: "Organic Chemistry", pick: true },
  { subject: "Chemistry", topic: "Inorganic Chemistry", pick: true },
  { subject: "Chemistry", topic: "Physical Chemistry" },
  { subject: "Chemistry", topic: "Chemical Bonding" },
  { subject: "Chemistry", topic: "Coordination Compounds" },
  { subject: "Chemistry", topic: "Electrochemistry" },
  { subject: "Chemistry", topic: "Biomolecules" },
  { subject: "Chemistry", topic: "Hydrocarbons" },
  // JEE Mathematics
  { subject: "Mathematics", topic: "Calculus", pick: true },
  { subject: "Mathematics", topic: "Algebra" },
  { subject: "Mathematics", topic: "Coordinate Geometry" },
  { subject: "Mathematics", topic: "Vectors", pick: true },
  { subject: "Mathematics", topic: "Probability" },
  { subject: "Mathematics", topic: "Trigonometry" },
  { subject: "Mathematics", topic: "Matrices" },
  // NEET Biology
  { subject: "Biology", topic: "Human Physiology", pick: true },
  { subject: "Biology", topic: "Plant Physiology" },
  { subject: "Biology", topic: "Genetics" },
  { subject: "Biology", topic: "Ecology" },
  { subject: "Biology", topic: "Biotechnology" },
  { subject: "Biology", topic: "Cell Biology", pick: true },
  { subject: "Biology", topic: "Reproduction" },
  { subject: "Biology", topic: "Evolution" },
  { subject: "Biology", topic: "Human Health and Disease" },
];

const RESOURCE_TYPES: ResourceType[] = ["Notes", "PYQs", "DPPs"];

const GENERATED: Resource[] = TOPIC_ROWS.flatMap((row, rowIndex) =>
  RESOURCE_TYPES.map((type, typeIndex) => {
    const id = `seed-${rowIndex}-${typeIndex}`;
    return seed(id, row.subject, row.topic, type, {
      recommended: row.pick === true && type !== "DPPs",
      featured: row.pick === true && type === "Notes",
    });
  }),
);

/** Extra stand-alone picks (books & videos) */
const EXTRAS: Resource[] = [
  seed("extra-1", "Physics", "Mechanics", "Books", { featured: true, recommended: true }),
  seed("extra-2", "Chemistry", "Organic Chemistry", "Videos", { recommended: true }),
  seed("extra-3", "Biology", "Human Physiology", "Books", { featured: true }),
  seed("extra-4", "Mathematics", "Calculus", "Books", { recommended: true }),
  seed("extra-5", "Physics", "Electrostatics", "Videos"),
  seed("extra-6", "Biology", "Genetics", "Videos", { recommended: true }),
];

/** Seeded library when Notion Resources DB is empty or unavailable */
export const FALLBACK_RESOURCES: Resource[] = [...GENERATED, ...EXTRAS];
