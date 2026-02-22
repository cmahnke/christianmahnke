---
date: 2026-02-22T10:39:44+02:00
title: "Ein Rant über die Bahn"
tags:
  - Travel
wikidata:
  - https://www.wikidata.org/wiki/Q129172
  - https://www.wikidata.org/wiki/Q9322
  - https://www.wikidata.org/wiki/Q110087903
  - https://www.wikidata.org/wiki/Q1392385
---

Dieser Beitrag entstand zum Teil im Zug, der 80 Minuten später als geplant am Zielort ankam.
<!--more-->

Ich pendle mehrmals pro Woche zwischen Hannover und Göttingen und habe mich schon fast daran gewöhnt, dass Züge mal 30 Minuten zu spät sind. Heute war es jedoch besonders schlimm: Statt zweimal 35 Minuten hat es heute ca. 115 und 70 Minuten gedauert. Ein neuer Tiefpunkt.

**Ich wurde also zu diesem Beitrag geradezu genötigt:**

Als Bahnkunde muss man sich in den letzten Jahren immer mehr gefallen lassen. Die Bahn hat ein massives Qualitätsproblem. Dazu kommt, dass man sich fragen kann, ob sie nicht auch Ressourcen dafür aufwendet, dieses Problem zu verschleiern. Ein Klassiker ist natürlich, dass ausgefallene Züge nicht als Verspätung zählen und [die Bahn diesen Umstand zur Verbesserunge der Statistik ausnutzt](https://www.spiegel.de/wirtschaft/deutsche-bahn-laesst-offenbar-zuege-ausfallen-um-statistik-zu-verbessern-a-c98d916e-770e-4f61-90f5-83c9dcc3db12).

Wenn man dann mal zu spät ist, gibt es zwar die Fahrgastrechte bzw. Erstattung, aber der Prozess ist nicht ansatzweise so einfach, wie er sein könnte bzw. sollte. Das fängt schon damit an, dass sich die notwendigen Daten nicht recherchieren lassen.

Die Informationspolitik der Bahn hat sich in den letzten zehn Jahren massiv verschlechtert. Es ist beispielsweise nicht mehr möglich, die Zugläufe aus der Vergangenheit herauszufinden. Die Bahn wird ihre Gründe haben.
Das gilt auch für die Anzeige im DB Navigator: Dort werden die tatsächlichen Daten auch nicht bei den vergangenen Reisen angezeigt.

Daher ist ein Ökosystem externer Dienste entstanden, um dies zu kompensieren:
* [bahn.expert](https://bahn.expert/)
* [Bahn-Vorhersage](https://bahnvorhersage.de/)
* [verspaetung.net](https://verspaetung.net/)
* [Zugfinder](https://www.zugfinder.net/de/start)

Wobei diese Liste sicher nicht vollständig ist. 

Dies ist aus meiner Sicht ein klares Indiz dafür, dass es einen Transparenzbedarf gibt, den die "DB Navigator"-App oder die Website der Bahn nicht erfüllen kann. 

Gerade an der App gibt es viel zu kritisieren. Von Problemen wie der Privatsphäre ([durch Drittabieter-Cookies](https://www.kuketz-blog.de/db-navigator-datenschutz-faellt-heute-aus-app-check-teil1/)) der Nutzung der Bahn App will ich hier gar nicht anfangen, dazu haben andere schon viel geschrieben.

Hier soll es eher um die Erstattung über den "DB Navigator" gehen...

## Der Vorgang der Entschädigung

Um ehrlich zu sein, stört mich auch, dass der Nutzer die Erstattung "beantragen" muss. Hier wäre eine Formulierung wünschenswert, die besser reflektiert, dass die Bahn vertragsbrüchig ist. Der Button muss ja nicht gleich "Absolution erteilen" heißen. Aber ich denke, man sollte eher von Entschädigung als von Erstattung sprechen.

Womit wir bei dem "Antrag" wären. Dieser ist so schlecht in die "DB Navigator" integriert, dass man sich fragen muss, ob man von Dark Patterns sprechen sollte, oder ob er "nur" Ausdruck von Inkompetenz in der Mediengestaltung darstellt. 

Um es kurz zu machen: Es gibt das [Papierformular](https://www.bahn.de/wmedia/view/mdb/media/intern/fahrgastrechteformular.pdf) und eine elektronische Form davon, die die Bahn den Nutzern der App zumutet. Und hier sieht man, was ich als inkompetente Mediengestaltung bezeichnen würde: Das Formular wird einfach nachgebaut, ohne dass die vorhandenen Daten in der Standardeinstellung genutzt werden. Bei mir sind alle für eine Erstattung erforderlichen Angaben in der App hinterlegt: die Bankverbindung (und selbst wenn diese nicht hinterlegt wäre, wäre sie noch am Datensatz zur BahnCard verknüpft)  und die Verbindung, in der ich gerade sitze. Grundsätzlich wäre es möglich, die Erstattung über einen Button neben dem "Komfort-Check-in" zu implementieren. Noch mal: **Ein Button, kein Formular**, für die einfachen Fälle (einfache Fahrt ohne umsteigen).
Die Folgen des implementierten Ansatzes kann man hier sehen: Der Screenshot zeigt meinen Versuch, eine Erstattung zu beantragen, bevor der Zug ankam – es funktioniert nicht.

{{< figure src="erstattung.jpeg" title="Erstattung beantragen bevor der Zug ankommt" >}}

Und spätestens hier drängt sich die Frage auf, ob es sich um Inkompetenz handelt oder ob hier nicht eher [Dark Patterns](https://de.wikipedia.org/wiki/Dark_Pattern) wirken:
* Wenn das Formular effizient optimiert worden wäre, würde die Zugnummer reichen. Stattdessen wird gefragt, welche geplanten Zeiten es gab (immerhin sind diese vorausgefüllt).
* Warum muss man abwarten, bis man da ist? Zu dem Zeitpunkt war ich schon für die 60-minütige Erstattung qualifiziert. Warum kann man das nicht in der Zeit machen, die einem die Bahn ohnehin schon raubt? Warum muss man das überhaupt ausfüllen? Die Bahn kennt doch die Zugnummer.
* Warum muss man alle persönlichen Daten neu ausfüllen? Auch diese sind in der App hinterlegt.
* Warum kann man nicht zurückgehen, sondern nur abbrechen und von vorne anfangen? (Das ist mir erst beim Erstellen des Artikels aufgefallen.)

Ein Teil der oben genannten Probleme liegt schlicht an der äußerst unglücklichen Art der Implementierung: Der Dialog ist Teil der Bahn-Webseite nicht der App. Dabei wird die Authentifizierung für den Zugriff auf das Nutzerkonto nicht mit durchgeschleift. Ein weiterer Grund ist der nach wie vor verbreitete Irrglaube, dass Online-Formulare Papier (oder PDF) eins zu eins abbilden müssen, als ob es keine Medienspezifika von Online-Medien gäbe. Zudem wird angenommen, dass ein Formular alle Fälle abdecken müsse. Deshalb werden auch bei einer einfachen Fahrt alle Optionen angezeigt – beides sind klassische Fehler der Verwaltungsdigitalisierung.

Idealerweise ist der Ablauf umzudrehen: Alle verfügbaren Daten werden übernommen und sobald ich den Prozess abschließen kann, ist das möglich. Zusätzliche optionale Daten, die nicht für alle Fälle (hier die einfache Fahrt) benötigt werden, beispielsweise Angaben zu zusätzlichen Auslagen oder ob Teilstrecken genutzt werden, werden erst nach der ersten Absendemöglichkeit abgefragt.

Ich hoffe, dass die Bahn APIs bereitstellt, mit denen Drittanbieter bessere Frontends (Apps) erstellen können, die einen besseren Service bieten. Diese APIs sollten selbstverständlich auch die Buchung, den "Comfort-Check-in", die Hinterlegung von (Zeit-)Fahrkarten und die Erstattung ermöglichen, sodass sie einen vollwertigen Ersatz darstellen.

## Was sollte sich ändern:

Es ist schwer nachvollziehbar, warum in einem System, in dem die Streckenlängen unterschiedlich sind, mit absoluten Verspätungszeiten gerechnet wird.
Ich würde vorschlagen, die zur Erstattung notwendige Verspätung relativ zur geplanten Fahrdauer auszurichten. Anstatt also mit festen Werten wie 60 oder 120 Minuten zu arbeiten, sollten die Stufen bei 100 %, 200 % und mehr Prozent der Überschreitung der geplanten Fahrzeit greifen. Ein Beispiel, orientiert an der Verbindung (ICE 583) aus der Einleitung:

Die geplante Abfahrt in Hannover war um 8:23 Uhr, die geplante Ankunft in Göttingen um 8:59 Uhr. Die tatsächliche Ankunft war um 10:19 Uhr, also mit einer Verspätung von einer Stunde und 20 Minuten.
Da die geplante Reisezeit 36 Minuten beträgt, würde nach dem vorgeschlagenen Modell die erste Erstattungsstufe schon um 9:35 Uhr und die zweite um 10:01 Uhr erreicht werden. In dem konkreten Fall würde die Erstattung somit 50 % statt 25 % betragen.

Das bestehende System hat gerade für Pendler den Nachteil, dass es sich an der Einzelverbindung orientiert. Das bedeutet, dass ich, wenn ich 20-mal im Monat fahre und davon 10-mal 15 Minuten später ankomme, eine Verspätung von insgesamt 150 Minuten habe, aber trotzdem leer ausgehe. Erst ab mehreren Verspätungen von jeweils über 20 Minuten gibt es die Möglichkeit, diese zu addieren.

Es gibt außerdem eine Kappung: Beträge unter 4 Euro werden nicht ausgezahlt. Da diese Vorgänge hoffentlich hochgradig automatisiert sind, sehe ich dafür keinen echten Grund. Wenn es nur um die Auszahlung geht, kann die Bahn ein Schattenkonto einrichten und dort Beträge sammeln, bis die Grenze erreicht ist. Alternativ kann sie auch Gutscheine ausstellen oder das Geld spenden. Einbehalten sollte keine Option sein!

Dazu ist man angehalten, die Erstattung schnell zu veranlassen – als ob die Bahn sich irgendeine Kompetenz in Bezug auf Schnelligkeit oder Fristen anmaßen dürfte. Die Frist sollte daher zwölf Monate betragen.

Eine weitere Idee wäre, die Verspätung einfach als Verdienstausfall zu deklarieren und sich dabei am Lohn bzw. den Einkünften für die zusätzliche Zeit zu orientieren.

## Fazit

Die Bahn unternimmt viel, um die Durchsetzung von Ansprüchen zu erschweren. Das muss ein Ende haben!
Im DB Navigator sollte die Erstattung einfacher sein als der "Komfort-Check-in". Wer der Meinung ist, dass die Sauberkeit der Bahnhöfe ein wichtiges Problem ist, das es zu lösen gilt, ist entweder inkompetent oder versucht, die öffentliche Meinung zu manipulieren. Ich kann beim erzwungenen Warten gutes WLAN besser gebrauchen als "Sauberkeit".
Außerdem sollte eine Zuverlässigkeitsuntergrenze festgelegt werden, deren Überschreitung Preiserhöhungen rechtfertigt. Eine nächste Fahrpreiserhöhung sollte erst erfolgen, wenn die Quote sechs Monate lang über 70% liegt. Alles darunter ist eher ein Grund für eine Preisreduzierung.

Und zuletzt der "DB Navigator" und dessen Ökosystem, gerade weil die Bahn so viel dafür tut ihre Kunden in die App zu zwingen (z.B. keine Sparpreise mehr am Automaten):
* Es sollte mindestens einen öffentlichen Bugtracker geben, damit transparenter wird, welche Prozesse und Verantwortlichkeiten z. B. dazu führen, dass man Verspätungen vergangener Fahrten nicht sehen kann oder warum Mehrfahrtentickets nach mindestens zwei Jahren immer noch nicht vernünftig integriert sind.
* Die Bahn muss alle notwendigen APIs für die Implementierung vollwertiger "DB Navigator"-Klone durch Drittanbieter erlauben. Als Monopolist sollte es einem nicht auch noch erlaubt werden, Gatekeeper in eigener Sache zu spielen.