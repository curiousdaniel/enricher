import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are an expert auction catalog writer specializing in antiques, collectibles, and estate sale items.

Your job is to analyze the provided image of an auction lot and write a compelling, accurate title and description for auction bidders.

TITLE GUIDELINES:
- Be specific: identify the actual items visible, not generic categories
- Include brand names, materials, approximate era if identifiable
- Keep under 80 characters
- Lead with the most valuable/interesting item
- Format: "Primary Item — Secondary Items & Details"

DESCRIPTION GUIDELINES:
- Write 2-4 sentences in an engaging but factual tone
- Identify every distinct item visible in the image
- Note condition if visible (good condition, shows wear, etc.)
- Include any maker's marks, brand names, or notable features you can identify
- If items appear to be from a specific era, mention it
- Use web search to look up any brands, makers, or collectibles to add market context
- End with a sentence about what type of collector or buyer would want this lot
- Write in present tense, as if describing what's in front of the bidder
- Do NOT use the word "lot" repeatedly — vary language
- Do NOT make up measurements or quantities you can't see

IMPORTANT: Use web search to:
- Identify manufacturer/brand when you can see markings
- Look up collectible value context for notable items
- Verify the era/vintage of items when relevant

Return your response as valid JSON:
{
  "enrichedTitle": "...",
  "enrichedDescription": "..."
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      lotNumber,
      originalTitle,
      originalDescription,
      imageBase64,
      imageMimeType,
    } = body;

    if (!lotNumber || !originalTitle) {
      return NextResponse.json(
        { error: 'Missing lotNumber or originalTitle' },
        { status: 400 }
      );
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const userContent: Anthropic.MessageParam['content'] = [
      ...(imageBase64 && imageMimeType
        ? [
            {
              type: 'image' as const,
              source: {
                type: 'base64' as const,
                media_type: imageMimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: imageBase64,
              },
            },
          ]
        : []),
      {
        type: 'text' as const,
        text: `Auction lot #${lotNumber}. Original title: "${originalTitle}". ${
          originalDescription
            ? `Original description: "${originalDescription}".`
            : 'No description provided.'
        }\n\nPlease analyze this image and write an enriched title and description. Return only valid JSON.`,
      },
    ];

    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: userContent },
    ];

    let response: Anthropic.Message;
    let maxIterations = 10;

    while (maxIterations-- > 0) {
      response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      });

      if (response.stop_reason === 'end_turn') {
        break;
      }

      if (response.stop_reason === 'tool_use' && response.content) {
        const toolUseBlocks = response.content.filter(
          (b) => typeof b === 'object' && b !== null && 'type' in b && (b as { type: string }).type === 'tool_use'
        ) as { id: string }[];
        if (toolUseBlocks.length === 0) break;

        messages.push({
          role: 'assistant',
          content: response.content,
        });

        const toolResults = toolUseBlocks.map((tu) => ({
          type: 'tool_result' as const,
          tool_use_id: tu.id,
          content:
            'Search completed. Please continue with your analysis and return the final JSON.',
        }));

        messages.push({
          role: 'user',
          content: toolResults,
        });
      } else {
        break;
      }
    }

    const finalText =
      response!.content
        ?.filter((b) => typeof b === 'object' && b !== null && 'text' in b)
        .map((b) => (b as { text: string }).text)
        .join('')
        .trim() ?? '';

    if (!finalText) {
      return NextResponse.json(
        { error: 'No text response from Claude' },
        { status: 500 }
      );
    }

    let parsed: { enrichedTitle?: string; enrichedDescription?: string };
    try {
      const jsonMatch = finalText.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : finalText);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse Claude JSON response' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      enrichedTitle: parsed.enrichedTitle ?? originalTitle,
      enrichedDescription: parsed.enrichedDescription ?? originalDescription ?? '',
    });
  } catch (err) {
    console.error('Enrich error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Enrichment failed' },
      { status: 500 }
    );
  }
}
