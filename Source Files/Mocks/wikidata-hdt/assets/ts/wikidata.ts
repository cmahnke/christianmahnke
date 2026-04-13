export interface WikidataEntity {
  id: string;
  uri: string;
  label: string;
  description: string;
  properties: Map<string, string[]>;
}

export function isWikidataUri(uri: string): boolean {
  return uri.startsWith('http://www.wikidata.org/entity/Q')
    || uri.startsWith('https://www.wikidata.org/entity/Q');
}

export function extractQid(uri: string): string | null {
  const match = uri.match(/wikidata\.org\/entity\/(Q\d+)/);
  return match ? match[1] : null;
}

export async function fetchWikidataLabels(
  qids: string[],
  languages: string[] = ['de', 'en']
): Promise<Map<string, { label: string; description: string }>> {
  console.log(`Fetching Wikidata labels for QIDs: ${qids.join(', ')} with languages: ${languages.join(', ')}`);
  const result = new Map<string, { label: string; description: string }>();
  if (qids.length === 0) return result;

  // Immer mul und en als Fallback anhängen
  const langChain = [...new Set([...languages, 'mul', 'en'])];
  const langParam = langChain.join('|');

  const chunks = [];
  for (let i = 0; i < qids.length; i += 50) {
    chunks.push(qids.slice(i, i + 50));
  }

  for (const chunk of chunks) {
    const url = `https://www.wikidata.org/w/api.php?` + new URLSearchParams({
      action: 'wbgetentities',
      ids: chunk.join('|'),
      props: 'labels|descriptions',
      languages: langParam,
      format: 'json',
      origin: '*'
    });

    try {
      const response = await fetch(url);
      const json = await response.json();

      for (const [qid, entity] of Object.entries(json.entities ?? {}) as any[]) {
        let label: string | null = null;
        let description: string | null = null;

        // Label: erste gefundene Sprache in der Kette
        for (const lang of langChain) {
          if (!label && entity.labels?.[lang]?.value) {
            label = entity.labels[lang].value;
          }
          if (!description && entity.descriptions?.[lang]?.value) {
            description = entity.descriptions[lang].value;
          }
          if (label && description) break;
        }

        result.set(qid, {
          label: label ?? qid,
          description: description ?? ''
        });
      }
    } catch (e) {
      console.warn('Wikidata API error:', e);
    }
  }

  return result;
}

export async function fetchWikidataDetails(
  qid: string,
  languages: string[] = ['de', 'en']
): Promise<WikidataEntity> {
  const langFilter = languages.map(l => `"${l}"`).join(',');

  const query = `
    SELECT ?prop ?propLabel ?value ?valueLabel WHERE {
      wd:${qid} ?p ?statement .
      ?statement ?ps ?value .
      ?prop wikibase:statementProperty ?ps .
      SERVICE wikibase:label {
        bd:serviceParam wikibase:language "${languages.join(',')},mul,en" .
      }
    } LIMIT 50
  `;

  const url = 'https://query.wikidata.org/sparql';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/sparql-results+json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'HDT-Browser-Viewer/1.0'
    },
    body: new URLSearchParams({ query })
  });

  const json = await response.json();
  const properties = new Map<string, string[]>();

  for (const b of json.results.bindings) {
    const key = b.propLabel?.value ?? b.prop?.value ?? '';
    const val = b.valueLabel?.value ?? b.value?.value ?? '';
    if (!properties.has(key)) properties.set(key, []);
    properties.get(key)!.push(val);
  }

  return {
    id: qid,
    uri: `http://www.wikidata.org/entity/${qid}`,
    label: qid,
    description: '',
    properties
  };
}