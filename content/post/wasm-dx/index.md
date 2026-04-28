---
date: 2026-04-26T06:22:44+02:00
title: "Meine Erfahrungen mit WASM"
tags:
  - JavaScript
  - SoftwareDevelopment
  - Hugo
wikidata:
  - https://www.wikidata.org/wiki/Q20155677
  - https://www.wikidata.org/wiki/Q111590996
  - https://www.wikidata.org/wiki/Q114900810
  - https://www.wikidata.org/wiki/Q726780
---

Für die letzten beiden Blog-Posts über SPARQL und Triple Stores musste ich mich mit [WASM](https://webassembly.org/) herumschlagen...
<!--more-->

...und war ernsthaft überrascht, wie schlecht die Browser-Integration und die Developer Experience (DX) immer noch sind.

Ersteres lässt sich relativ schnell beobachten, wenn man die Komponente auf einer Webseite eingebunden hat, die sich mittels Watcher bei jeder Änderung neu lädt. Nach einiger Zeit verdichten sich die Hinweise darauf, dass der Browser alte Ressourcen nicht zuverlässig aufräumt. Unter Chrome kann sich das in hängenden bis abstürzenden Tabs oder auch esoterischen Speicherfehlern der WASM-Anwendung äußern.
Daran kann man sich nach einiger Zeit gewöhnen und sicher treten die Effekte beim Endanwender nicht in dieser Form auf, aber trotzdem fühlt sich WASM bisher noch an, wie schlecht dran getackert.

Das Hauptproblem ist jedoch das Einbinden von WASM-Artefakten in JavaScript (für den Browser): Es ist kompliziert bzw. kontraintuitiv, insbesondere, wenn man zusätzlich einen Bundler einsetzen muss. Allein schon, weil man gezwungen ist, den WASM-Code als zusätzliches eigenes Asset einzubinden und dabei eine eigene Lade-Semantik (asynchrone Initialisierung) zu befolgen, während man gleichzeitig sicherstellt, dass der JavaScript-Wrapper für den Code in der WASM-Datei geladen ist. Die [MDN-Dokumentation](https://developer.mozilla.org/en-US/docs/WebAssembly) gibt ein Beispiel zur Komplexität.

Für die älteren Leser: Das Ganze scheint stark vom Einbinden von Inline-Assembler für verschiedene Architekturen in C inspiriert zu sein. Schließlich enthält es ja auch das Wort "Assembly" im Namen.

## Exkurs

Zugegeben ist für dieses Blog der Aufbau auch recht kompliziert:
* Komplexere JavaScript-Funktionalitäten entwickle ich zuerst auf Basis von [Vite](https://www.typescriptlang.org/) und [Typescript](https://www.typescriptlang.org/).
* Diese werden dann mit [Rollup](https://rollupjs.org/) (da es damit einfacher ist aus einem Quellbaum verschiedene Artefakte zu erstellen) zusammen gepackt (jeweils ein JS- und ein CSS-Artefakt)
* Daraus wird dann ein Wrapper als [Hugo-Shortcode](https://gohugo.io/content-management/shortcodes/) erstellt - diese Schritt ist noch nicht automatisiert. Die Verknüpfung des JavaScript Artefakts mit dem Shortcode ist hier beschrieben: [Geteilte Metadaten für Hugo Seiten](https://christianmahnke.de/post/hugo-shared-metadata/)
* Hugo nutzt dann [esbuild](https://esbuild.github.io/) um darum das JavaScript für den Browser zu erstellen.

Dass es mehr als einen Schritt braucht, um JavaScript zu transformieren (auch Kompilieren genannt), ist ein bekanntes Problem der modernen Webentwicklung und alles andere als optimal.

Dazu zählt, dass das gesamte JavaScript-Ökosystem darauf ausgelegt ist, mit den eigenen Unzulänglichkeiten umzugehen. Aus eher traditionellen Gründen, aus der Zeit vor dem Tree Shaking (also der Code-Optimierung, bei der ungenutzte Funktionen nicht in den Client-Code gelangen sollen, da sich die Anzeigezeit einer Webseite durch die Übertragung weniger Daten verbessert), tendiert die gesamte Community dazu, ihre Software-Artefakte zu atomisieren und sie in sehr kleine Einheiten zu verpacken.
Zu dieser Problematik (und anderen Problemen von "modernem" JavaScript im Sinne von zeitgenössischem, nicht innovativem JavaScript) haben andere Besseres und Klügeres geschrieben, z. B. in [The Three Pillars of JavaScript Bloat](https://43081j.com/2026/03/three-pillars-of-javascript-bloat)

Dieses Muster wird in anderen Communities eher als Antipattern betrachtet, kommt aber bei fast allem zum Einsatz, auch bei Build-Werkzeugen wie Bundlern. Dadurch muss man sich zwangsläufig mehr mit seiner Build-Infrastruktur beschäftigen, als einem lieb ist.
Das hat beispielsweise die "lustige" Konsequenz, dass nicht alle diese Werkzeuge die komplette Spannbreite moderner Web-Technologien von sich aus abdecken: So benötigen [Rollup](https://rollupjs.org/) oder [Vite](https://vite.dev/) beispielsweise Plugins für Wasm. 

## Zurück zu Wasm:
Das Hauptproblem ist vermutlich, dass sich das Ganze zwar WebAssembly nennt, aber so entworfen wurde, dass es auf vielen Plattformen zum Einsatz kommen kann. Wenn man also den Namen als Zielvorstellung annimmt, leidet man unter Übergeneralisierung. 

Vor 20 Jahren hatten wir mit Java etwas im Browser, das in dieser Hinsicht schon weiter war. Sicher hat die Sprache nicht mehr so viele Freunde, aber die Einbettung und auch der Zugriff auf DOM-Elemente der Seite, auf der das Applet lief, waren deutlich besser.

## Wie ginge es besser ?
Aber WASM hat auch andere theoretische Vorteile, wie die erhöhte Ausführungsgeschwindigkeit oder die Möglichkeit, auch Legacy-Code als Ausgangsbasis zu nutzen.
Trotzdem könnten Entwickler davon profitieren, wenn der Fokus primär auf dem Web als Plattform liegen würde. Das Nutzungsszenario sollte so gestaltet werden, dass es sich wie JavaScript anfühlt. Beispielsweise könnte man auf die notwendigen externen JS-Wrapper verzichten, indem man sie in der WASM-Datei bündelt (oder den WASM-Bytecode in einer JS Datei), sodass diese automatisch beim Instanzieren verfügbar sind. 
Darauf aufbauende wäre auch eine vereinfachte API hilfreich gewesen:

```javascript
const wasm_obj = await WebAssembly.new("./simple.wasm");
```

Statt dem ganzen Budenzauber zum Abrufen (`fetch`), ggf. Kompilieren, Instanzieren und "Verheiraten" mit dem JS-Wrapper-Code, den man ja auch noch bündeln bzw. laden muss. Also wirklich "seamless". Natürlich wäre das optional. Wer die bisherige API bevorzugt, soll sie natürlich weiterhin nutzen können.

Da diese Änderung in der Browser-JS-API nicht zu erwarten ist, muss beim Bundler bzw. Bundling angesetzt werden. Derzeit bietet sich leider nur die Methode an, das WASM-Artefakt Base64-kodiert als Teil einer JavaScript-Datei zu verteilen. Der Nachteil ist allerdings, dass die Kodierung die Dateigröße um 33–37 % erhöht.

Wenn man also eine WASM Datei über NPM verbreitet, sollte man dafür sorgen, das es mindestens eine Art der Einbindung gibt, bei der das WASM Artefakt Teil einer JS Datei ist. Derzeit häufig in diesen Bereich genutzte Tools, wie [`wasm-pack`](https://github.com/wasm-bindgen/wasm-pack) (für Rust), sollten das als Default machen.
