---
date: 2025-01-05T07:52:22+02:00
title: 'Sammlungsdaten in Wikidata'
description: ""
#keywords:
cite: true
draft: true
tags:
- ProjectIdea
- CulturalPolicy
- AI
---

"Alle Welt" spricht von KI für Kulturdaten...
<--more-->

...und dazu gibt viele Ideen dazu, die bisher jedoch sehr stark auf einzelne Anwendungsfälle und Institutionen zugeschnitten sind. Hier soll es zunächst um die Objektmetadaten gehen. Zusätzlich gibt es eine gewisse Skepsis, die in Teilen berechtigt ist, sowohl gegenüber den Möglichkeiten als auch der Qualität der zu erwartenden Ergebnisse. Was die Sache nicht einfacher macht, ist, dass es derzeit noch einer gewissen Kompetenz bedarf, um solche Systeme gewinnbringend einzusetzen. Es wird noch etwas dauern, bis man einfach seine Excel-Tabelle „hineinwerfen” kann und die Lücken werden gefüllt. Wo das bereits zu funktionieren scheint, muss man aufpassen, dass man keine halluzinierten Daten bekommt oder die Anreicherung nicht aus der Duplizierung der eigenen, öffentlich zugänglichen Daten besteht. Letzteres ist kein hypothetisches Beispiel, sondern ist mir bei Experimenten mit meinen Sammlungen bereits passiert.

Dann stellt sich die Frage, woraus eine Anreicherung überhaupt bestehen kann und sollte. Einigen Sammlungen wird es sicher reichen, wenn eine KI „nur” als Erweiterung bzw. Automatisierung einer klassischen Websuche funktioniert (Beispiele können die Ergänzung von Zeichenketten mit Personen- oder Ortsangaben um Identifikatoren sein). Die wirklich interessanten Ansätze gehen jedoch darüber hinaus.
Das „Sicherste” ist vermutlich die klassische Zuarbeit: Rechercheansätze zu bestehenden Daten heraussuchen und ggf. vorsortieren. Dieser Ansatz ist sicher, da die tatsächliche „Datenarbeit” weiterhin durch einen Menschen erfolgt.
* Plausibilitätsprüfungen bzw. Qualitätskontrollen, die von einfachen Rechtschreibfehlern bis zu anderweitig falschen Zuordnungen reichen.  
* Muster erkennen und daraus weitere Metadaten zuordnen. 
* Metadaten z. B. aus Bildern generieren. Dies ist sicher der komplexeste Zugang, da hierfür spezifische Modelle erstellt und genutzt werden müssen.

Je komplexer die Anwendungsfälle sind, desto mehr profitieren einzelne Einrichtungen von einer breiten Datenbasis. Dabei ist auch zu berücksichtigen, dass viele Einrichtungen gar nicht über die Ressourcen verfügen, um entsprechende Datenbanken aufzubauen. Hier ist der Einsatz von Werkzeugen wie ChatGPT oder Gemini, die derzeit auch eine kostenfreie Nutzung erlauben, die naheliegendste Wahl, zumal diese Dienste auch eine einfache und nutzerfreundliche Oberfläche bieten. Da mein Fokus in der Regel (und aus eigenem Interesse) auf kostengünstigen Lösungen liegt, plädiere ich dafür, die Nutzung kommerzieller LLMs nicht kategorisch auszuschließen. 

Dieses Vorgehen berührt jedoch ein weiteres Problem, das nicht unter den Tisch fallen gelassen werden sollte: In manchen Kulturbereichen können Zugänge zu Materialien und Metadaten beschränkt sein. Beispiele sind:
* urheberrechtlich geschütztes „modernes” Material
 Sperrfristen in Archiven

Diese Materialien können nicht einfach an einen externen KI-Dienst geschickt werden, der webbasiert ist, wenn nicht sichergestellt ist, dass dadurch die entsprechenden Vorgaben nicht verletzt werden. Ein Beispiel hierfür ist, dass solche Daten ggf. nicht zum Training verwendet werden dürfen.

# Was tun?

Aus den oben genannten Gründen ist es sinnvoll, indirekt Einfluss auf die Trainingsgrundlage der LLMs zu nehmen. Dadurch steigt die Wahrscheinlichkeit, dass diese Trainingsdaten auch von anderen Einrichtungen genutzt werden können. Eine Möglichkeit, dies zu erreichen, ist, die eigenen Daten strukturiert vorzuhalten. Noch besser ist es, die Daten dort abzulegen, wo ein LLM-Crawler sie ohnehin abholen würde: Bei Wikidata.

Nun mag man einwenden, dass die potenziellen Mengen vielleicht doch zu groß sind oder dass die Relevanz für Wikidata gar nicht gegeben ist. Und vielleicht sogar, dass man dadurch zu viel (die „heilige Datenhoheit”) aus der Hand geben würde. Gerade Letzteres lässt sich leicht entkräften. Wikidata ist eher als Datenhub zu verstehen. Es geht nicht darum, die eigenen Datensilos abzuschaffen. Im Gegenteil: Es ist auch denkbar, die extern generierten Daten manuell wieder ins eigene System zurückzuspielen. 

Bezüglich des Einwands zur Relevanz lässt sich sagen, dass Wikibase explizit andere Relevanzkriterien als Wikipedia anwendet. Wie auch in der Wikipedia ist die Belegbarkeit (für die Existenz des beschriebenen Objektes) eine zentrale Vorgabe. Zusätzlich dazu sind strukturelle Objekte (solche, die der Vernetzung anderer dienen) erlaubt.

Was die Menge der Daten angeht, sei hier auf WikiCite verwiesen, das Unmengen an bibliographischen Informationen (also Metadaten) und Zitationen verwaltet.


## Und muss das jetzt jede Sammlung selber machen?

Der Betrieb von Infrastrukturen zur Verwaltung von Sammlungsdaten wird immer weiter zentralsiert, geradee für kleinere Insttitutionen bieten bundelandweise (teilweise auch über Bundesländer hinweg) organsierte Verbünde zu den jeweiligen Kultursparten meist den Betrieb einer Infrastruktur an.  Und um den Aufwand (bzw. die Ressourceneinsatz) zu bündeln, sollte hier angesetzt werden. Interessant dürfte allerdiinngs die Frage werden, ob man mit einem Opt-In oder Opt-Out operieren würde. Meine Vermutung wäre, das man aus Vorsicht zu einemm Opt-In tendieren wird. Alternativ lässt sich auch ann den übergeorneten Portalen (wie denen die unter dem Dach der DDB versammelten oder Europeana) ansetzt. 

Gerade für das Training auf basis von Diugitalisate wäre es aucuh wünschenswert technische MEtadaten recherchierbar zu machen, Beispiele sind verfügbare Auflösungen / Aufnahmequalitäten. 


# Und dann?

Wenn erstmal diese Grundlage existiert, können davon nicht nur die kommerziellen LLMs profitieren, sondern auch spezialierte Modell, die z.B. für spezifische Domänen oder räumliche Zuschnitte (wie die jrweiligen Bundesländer) zugeschnoitten sind.



https://ceur-ws.org/Vol-4064/PD-paper3.pdf
https://meta.wikimedia.org/wiki/WikiCite/WDQS_graph_split