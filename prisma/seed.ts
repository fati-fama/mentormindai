import "dotenv/config";
import { prisma } from "../lib/prisma";

const SUBJECTS_WITH_TOPICS: Record<string, string[]> = {
  Mathematics: ["Algebra", "Geometry", "Trigonometry", "Calculus", "Statistics & Probability"],
  Physics: ["Mechanics", "Thermodynamics", "Electricity & Magnetism", "Waves & Optics"],
  Chemistry: ["Physical Chemistry", "Organic Chemistry", "Inorganic Chemistry"],
  Biology: ["Cell Biology", "Genetics", "Human Physiology", "Ecology"],
  "Computer Science": ["Programming Fundamentals", "Data Structures", "Algorithms", "Databases"],
  English: ["Reading Comprehension", "Grammar & Usage", "Vocabulary", "Essay Writing"],
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
  console.log(`Seeded ${Object.keys(SUBJECTS_WITH_TOPICS).length} subjects and ${topicCount} topics.`);
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
