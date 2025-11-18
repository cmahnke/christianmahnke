import urllib.request
import json
import urllib.parse
import sys

def query_by_gnd(gnd_id):
    query = """
    SELECT ?propertyLabel ?valueLabel ?valueURI
    WHERE {{
      ?item wdt:P227 "{}" .
      ?item ?wdt ?o .
      ?property wikibase:directClaim ?wdt .

      SERVICE wikibase:label {{
        bd:serviceParam wikibase:language "en,de" .
        ?property rdfs:label ?propertyLabel .
      }}

      OPTIONAL {{
        FILTER(isIRI(?o))
        ?o rdfs:label ?enLabel .
        FILTER(LANG(?enLabel) = "en")
      }}

      BIND(COALESCE(?enLabel, STR(?o)) AS ?valueLabel)

      BIND(IF(isIRI(?o), ?o, ?undefined) AS ?valueURI)
    }}
    """.format(gnd_id)

    endpoint = "https://query.wikidata.org/sparql"
    params = {
        'query': query,
        'format': 'json'
    }
    url = f"{endpoint}?{urllib.parse.urlencode(params)}"

    wikidata = {}

    try:
        req = urllib.request.Request(url, headers={'Accept': 'application/sparql-results+json'})
        with urllib.request.urlopen(req) as response:
            data = response.read().decode('utf-8')
        results = json.loads(data)
        for binding in results['results']['bindings']:
            key = binding['propertyLabel']['value']
            value = binding['valueLabel']['value']
            if key in wikidata:
                if isinstance(wikidata[key], list):
                    wikidata[key].append(value)
                else:
                    wikidata[key] = [wikidata[key], value]
            else:
                wikidata[key] = value
        return wikidata

    except urllib.error.URLError as e:
        print(f"Error accessing Wikidata endpoint: {e.reason}")
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e.reason}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("GND ID required")
        sys.exit(1)

    target_gnd_id = sys.argv[1]
    properties = query_by_gnd(target_gnd_id)
    print(json.dumps(properties, indent=4, ensure_ascii=False))
