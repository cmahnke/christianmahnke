---
date: 2025-11-18T20:14:44+02:00
title: "Einfache Datenanreicherung mit Wikidata"
tags:
  - Wikidata
  - SPARQL
  - Python
wikidata:
  - https://www.wikidata.org/wiki/Q36578
  - https://www.wikidata.org/wiki/Q105099901
---

Beim Aufräumen meiner Browser-Tabs gefunden...
<!--more-->
...es ging darum, wie wir an mehr Informationen (z.B. auch ein Bild) für eine Medienstation bekommen, wenn wir nur eine [GND](https://www.dnb.de/DE/Professionell/Standardisierung/GND/gnd_node.html) ID haben...

Die Antwort ist einfach: Einfach mal bei [Wikidata](https://www.wikidata.org/wiki/Wikidata:Main_Page) fragen. Im Grunde ist es eine generalisierte Variante der Abfrage aus dem Beitrag über [Hugo und Wikidata](https://christianmahnke.de/post/wikidata-entities-in-hugo/).

```sparql
SELECT ?propertyLabel ?valueLabel
WHERE {
  ?item wdt:P227 "10153740-2" .
  ?item ?wdt ?o .
  ?property wikibase:directClaim ?wdt .
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "en,de" .
    ?property rdfs:label ?propertyLabel .
  }
  OPTIONAL {
    FILTER(isIRI(?o))
    ?o rdfs:label ?enLabel .
    FILTER(LANG(?enLabel) = "en")
  }
  BIND(COALESCE(?enLabel, STR(?o)) AS ?valueLabel)
}
```

Die Abfrage kann einfach in das Abfragefenster des [Wikidata Query Services](https://query.wikidata.org/#SELECT%20%3FpropertyLabel%20%3FvalueLabel%0AWHERE%20%7B%0A%20%20%3Fitem%20wdt%3AP227%20%2210153740-2%22%20.%0A%20%20%3Fitem%20%3Fwdt%20%3Fo%20.%0A%20%20%3Fproperty%20wikibase%3AdirectClaim%20%3Fwdt%20.%0A%20%20SERVICE%20wikibase%3Alabel%20%7B%0A%20%20%20%20bd%3AserviceParam%20wikibase%3Alanguage%20%22en%2Cde%22%20.%0A%20%20%20%20%3Fproperty%20rdfs%3Alabel%20%3FpropertyLabel%20.%0A%20%20%7D%0A%20%20OPTIONAL%20%7B%0A%20%20%20%20FILTER%28isIRI%28%3Fo%29%29%0A%20%20%20%20%3Fo%20rdfs%3Alabel%20%3FenLabel%20.%0A%20%20%20%20FILTER%28LANG%28%3FenLabel%29%20%3D%20%22en%22%29%0A%20%20%7D%0A%20%20BIND%28COALESCE%28%3FenLabel%2C%20STR%28%3Fo%29%29%20AS%20%3FvalueLabel%29%0A%7D) kopiert werden. Um die gesuchte GND ID zu ändern muss einfach [`wdt:P227`](https://www.wikidata.org/wiki/Property_talk:P227) (hier `"10153740-2"`) geändert werden. Natürlich lässt sich auch nach anderen Identifiern suchen, es gibt inzwischen sehr viele in Wikidata:
* [Eigenschaften mit externen IDs](https://www.wikidata.org/wiki/Category:Properties_with_external-id-datatype)
* [Normdateneigenschaften](https://www.wikidata.org/wiki/Category:Authority_control_properties)

Und zur Einbindung in ein Jupyter Notebook oder Python Script, kann diese Funktion genutzt werden:

```python3
import urllib.request
import json
import urllib.parse

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

```
