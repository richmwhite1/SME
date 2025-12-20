"use server";

import { isAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Get or create a system account for automated posts
 */
async function getSystemAccount() {
  const sql = getDb();
  
  try {
    // Try to find an existing system account
    const existing = await sql`
      SELECT id FROM profiles
      WHERE username = 'sme-system'
      LIMIT 1
    `;

    if (existing && existing.length > 0) {
      return existing[0].id;
    }

    // If no system account exists, use the first admin user
    const admins = await sql`
      SELECT id FROM profiles
      WHERE is_admin = true
      LIMIT 1
    `;

    if (admins && admins.length > 0) {
      return admins[0].id;
    }

    throw new Error("No system account or admin found. Please create an admin user first.");
  } catch (error) {
    throw new Error(`Failed to get system account: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate introductory discussion content for a topic
 */
function getTopicIntroContent(topicName: string, description: string | null): { title: string; content: string } {
  const descriptions: Record<string, string> = {
    "Biohacking": "Optimizing biology through science and technology",
    "Longevity": "Extending healthy lifespan",
    "Research": "Scientific studies and evidence",
    "Supplements": "Nutritional supplements and vitamins",
    "Nutrition": "Diet and food science",
    "Wellness": "Holistic health and wellbeing",
    "Gut Health": "Digestive system and microbiome",
    "Mental Health": "Cognitive and emotional wellbeing",
    "Fitness": "Physical exercise and movement",
    "Sleep": "Sleep optimization and recovery",
    "Hormones": "Hormonal balance and optimization",
    "Prevention": "Disease prevention and early intervention",
  };

  const topicDescription = description || descriptions[topicName] || "Community-driven research and discussion";

  const title = `Welcome to #${topicName}: State of the Science`;
  
  const content = `## Welcome to the #${topicName} Discussion Hub

This is the **Court of Public Opinion** for ${topicDescription.toLowerCase()}.

### What We're Investigating

The SME community is actively researching and discussing evidence-based approaches to ${topicDescription.toLowerCase()}. This hub serves as a central gathering place for:

- **Research Analysis**: Peer-reviewed studies and scientific evidence
- **Community Experiences**: Real-world applications and outcomes
- **Product Transparency**: Verified supplements and protocols
- **Expert Insights**: Contributions from Trusted Voices

### How to Participate

1. **Share Research**: Post studies, articles, or evidence you've discovered
2. **Ask Questions**: Crowd-source knowledge from the community
3. **Review Products**: Help others by sharing your experiences
4. **Build Signal**: Contribute high-quality content to earn Trusted Voice status

### Community Guidelines

- Cite sources when making claims
- Respect diverse perspectives
- Focus on evidence-based discussions
- Report low-signal content

**Let's build the most comprehensive knowledge base for ${topicDescription.toLowerCase()}.**`;

  return { title, content };
}

/**
 * Seed Master Topics with introductory discussions
 */
export async function seedMasterTopics() {
  const adminStatus = await isAdmin();

  if (!adminStatus) {
    throw new Error("Unauthorized: Admin access required");
  }

  const sql = getDb();
  const systemAccountId = await getSystemAccount();

  // Fetch all master topics
  let masterTopics: Array<{ name: string; description: string | null }>;
  try {
    masterTopics = await sql`
      SELECT name, description
      FROM master_topics
      ORDER BY display_order ASC
    ` as Array<{ name: string; description: string | null }>;
  } catch (error) {
    throw new Error(`Failed to fetch master topics: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  if (!masterTopics || masterTopics.length === 0) {
    throw new Error("No master topics found. Please run the master_topics SQL script first.");
  }

  const results: Array<{ topic: string; status: string; slug?: string }> = [];

  // Create introductory discussion for each topic
  for (const topic of masterTopics) {
    try {
      // Check if an intro discussion already exists for this topic
      const existing = await sql`
        SELECT id, slug FROM discussions
        WHERE author_id = ${systemAccountId}
        AND tags @> ARRAY[${topic.name}]::text[]
        AND title ILIKE ${'%Welcome to #' + topic.name + '%'}
        LIMIT 1
      `;

      if (existing && existing.length > 0) {
        results.push({
          topic: topic.name,
          status: "Already exists",
          slug: existing[0].slug,
        });
        continue;
      }

      // Generate content
      const { title, content } = getTopicIntroContent(topic.name, topic.description);

      // Generate unique slug
      const baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const uniqueSlug = `${baseSlug}-${Date.now()}`;

      // Create the discussion
      const discussion = await sql`
        INSERT INTO discussions (
          title, content, author_id, slug, tags, flag_count, is_flagged, upvote_count, is_pinned
        )
        VALUES (
          ${title},
          ${content},
          ${systemAccountId},
          ${uniqueSlug},
          ARRAY[${topic.name}]::text[],
          0,
          false,
          0,
          true
        )
        RETURNING slug
      `;

      if (discussion && discussion.length > 0) {
        results.push({
          topic: topic.name,
          status: "Created",
          slug: discussion[0].slug,
        });
      } else {
        results.push({
          topic: topic.name,
          status: "Error: No data returned from insert",
        });
      }
    } catch (err) {
      results.push({
        topic: topic.name,
        status: `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
    }
  }

  // Revalidate relevant paths
  revalidatePath("/admin");
  revalidatePath("/topic");
  revalidatePath("/discussions");

  return {
    success: true,
    results,
    summary: {
      total: masterTopics.length,
      created: results.filter((r) => r.status === "Created").length,
      existing: results.filter((r) => r.status === "Already exists").length,
      errors: results.filter((r) => r.status.startsWith("Error")).length,
    },
  };
}
