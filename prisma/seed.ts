import "dotenv/config";
import { prisma } from "../lib/prisma";

const SUBJECTS_WITH_TOPICS: Record<string, string[]> = {
  Mathematics: [
    "Algebra",
    "Functions",
    "Trigonometry",
    "Calculus",
    "Probability",
    "Statistics",
  ],
  Physics: [
    "Motion",
    "Forces",
    "Work and Energy",
    "Waves",
    "Electricity",
    "Magnetism",
  ],
  "Computer Science": [
    "Programming Fundamentals",
    "Python",
    "JavaScript",
    "Data Structures",
    "Algorithms",
    "Databases",
    "Artificial Intelligence",
  ],
  Chemistry: [
    "Atomic Structure",
    "Chemical Bonding",
    "Stoichiometry",
    "Organic Chemistry",
    "Thermochemistry",
    "Equilibrium",
  ],
  English: [
    "Grammar",
    "Vocabulary",
    "Essay Writing",
    "Comprehension",
    "Creative Writing",
    "Communication Skills",
  ],
  Biology: [
    "Cell Biology",
    "Genetics",
    "Human Anatomy",
    "Ecology",
    "Evolution",
    "Microbiology",
  ],
};

async function main() {
  let topicCount = 0;
  for (const [subjectName, topics] of Object.entries(SUBJECTS_WITH_TOPICS)) {
    const subject = await prisma.subject.upsert({
      where: { name: subjectName },
      update: {},
      create: { name: subjectName },
    });
    for (const topicName of topics) {
      await prisma.topic.upsert({
        where: { subjectId_name: { subjectId: subject.id, name: topicName } },
        update: {},
        create: { subjectId: subject.id, name: topicName },
      });
      topicCount += 1;
    }
  }
  console.log(
    `Seeded ${Object.keys(SUBJECTS_WITH_TOPICS).length} subjects and ${topicCount} topics.`
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
