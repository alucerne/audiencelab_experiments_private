import { typesenseClient } from '../client';

export async function get4EyesIntentIds({
  keywords,
  audienceType,
}: {
  keywords: string[];
  audienceType: 'keyword' | 'premade' | 'custom';
}) {
  const interests = await (audienceType === 'keyword'
    ? Promise.all(
        keywords.map(async (keyword) => {
          return typesenseClient
            .collections<{
              intent_id: string;
              intent: string;
            }>('intents_auto_embed')
            .documents()
            .search({
              q: keyword,
              query_by: 'intent',
              per_page: 1,
            });
        }),
      )
    : typesenseClient
        .collections<{ intent_id: string; intent: string }>(
          'intents_auto_embed',
        )
        .documents()
        .search({
          q: '*',
          query_by: 'intent',
          filter_by: `intent:=[${keywords.join(',')}]`,
          per_page: 50,
        }));

  const allHits = Array.isArray(interests)
    ? interests.flatMap((response) => response.hits || [])
    : interests.hits || [];

  return Array.from(
    new Set(allHits.map((hit) => `4eyes_${hit.document.intent_id}`)),
  );
}

export async function getIntentNames({
  search,
  b2b,
  typos,
}: {
  search: string;
  b2b: boolean;
  typos: number;
}) {
  const searchResponse = await typesenseClient
    .collections<{
      intent: string;
      b2b: boolean;
    }>('intents_auto_embed')
    .documents()
    .search({
      q: search,
      query_by: 'intent',
      filter_by: `b2b:=${b2b}`,
      per_page: 20,
      num_typos: typos,
    });

  return searchResponse.hits?.map((hit) => hit.document.intent) ?? [];
}
