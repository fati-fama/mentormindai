import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SETUP_TOKEN = "mentormind-setup-2026";

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

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-setup-token");
  if (token !== SETUP_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: string[] = [];
  try {
    for (const [subjectName, topics] of Object.entries(SUBJECTS_WITH_TOPICS)) {
      const existingSubject = await prisma.$queryRawUnsafe<
        { id: string; name: string }[]
      >(`SELECT id, name FROM subjects WHERE name = $1`, subjectName);

      let subjectId: string;
      if (existingSubject.length > 0) {
        subjectId = existingSubject[0].id;
        results.push(`Subject "${subjectName}" already exists (${subjectId})`);
      } else {
        const inserted = await prisma.$queryRawUnsafe<
          { id: string }[]
        >(
          `INSERT INTO subjects (name) VALUES ($1) ON CONFLICT ("name") DO NOTHING RETURNING id`,
          subjectName
        );
        if (inserted.length > 0) {
          subjectId = inserted[0].id;
          results.push(`Created subject "${subjectName}" (${subjectId})`);
        } else {
          const fallback = await prisma.$queryRawUnsafe<
            { id: string }[]
          >(`SELECT id FROM subjects WHERE name = $1`, subjectName);
          subjectId = fallback[0].id;
          results.push(`Subject "${subjectName}" created by concurrent insert (${subjectId})`);
        }
      }

      for (const topicName of topics) {
        const existingTopic = await prisma.$queryRawUnsafe<
          { id: string; name: string }[]
        >(
          `SELECT id, name FROM topics WHERE "subjectId" = $1 AND name = $2`,
          subjectId,
          topicName
        );

        if (existingTopic.length > 0) {
          results.push(`  Topic "${topicName}" already exists`);
        } else {
          const inserted = await prisma.$queryRawUnsafe<
            { id: string }[]
          >(
            `INSERT INTO topics ("subjectId", name) VALUES ($1, $2) ON CONFLICT ("subjectId", name) DO NOTHING RETURNING id`,
            subjectId,
            topicName
          );
          if (inserted.length > 0) {
            results.push(`  Created topic "${topicName}"`);
          } else {
            results.push(`  Topic "${topicName}" created by concurrent insert`);
          }
        }
      }
    }

    const subjectCount = await prisma.$queryRawUnsafe<
      { count: string }[]
    >(`SELECT COUNT(*) FROM subjects`);
    const topicCount = await prisma.$queryRawUnsafe<
      { count: string }[]
    >(`SELECT COUNT(*) FROM topics`);

    return NextResponse.json({
      success: true,
      summary: {
        subjects: parseInt(subjectCount[0].count),
        topics: parseInt(topicCount[0].count),
      },
      results,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: msg, results },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message:
      "Send a POST request with x-setup-token header to seed subjects and topics.",
    subjects: Object.keys(SUBJECTS_WITH_TOPICS),
    topicCounts: Object.fromEntries(
      Object.entries(SUBJECTS_WITH_TOPICS).map(([k, v]) => [k, v.length])
    ),
  });
}
