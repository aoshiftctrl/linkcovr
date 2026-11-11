=== LinkCovr ===
Contributors: aoshiftctrl
Tags: cover, link, block, gutenberg
Requires at least: 6.5
Tested up to: 7.1
Requires PHP: 8.0
Stable tag: 1.0.1
License: CC BY-ND 4.0
License URI: https://creativecommons.org/licenses/by-nd/4.0/

Verlinkt den Cover-Block auf eine Seite. Die gesamte Fläche des Covers wird klickbar, die Auswahl erfolgt in der Block-Seitenleiste.

== Description ==

Ist ein Cover-Block ausgewählt, erscheint in der Block-Seitenleiste das Panel „Link“. Dort wird eine veröffentlichte Seite ausgewählt, auf die das Cover verlinkt.

* Die Auswahl ist ein Suchfeld. Ohne Suchbegriff werden die ersten 100 Seiten hierarchisch nach Reihenfolge angezeigt, weitere Seiten findet die Suche im Seitentitel.
* Das X im Feld entfernt den Link.
* Unterseiten sind eingerückt. Ist die Elternseite nicht veröffentlicht, erscheint die Unterseite auf oberster Ebene.
* Im Frontend legt das Plugin einen Link über die gesamte Cover-Fläche („Stretched Link“). Das Cover wird nicht in ein `<a>` gewickelt, das HTML bleibt gültig.
* Der Link funktioniert unabhängig vom HTML-Element des Covers (`div`, `section`, `header`, …).
* Für Screenreader trägt der Link den Seitentitel als `aria-label`.
* Ist die verlinkte Seite nicht mehr veröffentlicht oder gelöscht, wird das Cover ohne Link ausgegeben. Der Editor weist unter dem Auswahlfeld darauf hin.

Verlinkte Cover sollten keine eigenen Buttons oder Links enthalten: Der Stretched Link liegt darüber und fängt alle Klicks ab.

= Technik =

* Block-Attribut `shftLinkPage` (number) am Block `core/cover`, `0` = kein Link.
* Das verlinkte Cover bekommt im Frontend die CSS-Klasse `has-shft-link`, der Link die Klasse `shft-cover-link`.
* Das Stylesheet wird über `wp_enqueue_block_style()` nur geladen, wenn auf der Seite ein Cover-Block vorkommt.

== Installation ==

1. Den Ordner `shft-cover-link` nach `wp-content/plugins/` kopieren. Bei einem GitHub-ZIP heißt der entpackte Ordner `linkcovr-main` und muss vorher in `shft-cover-link` umbenannt werden, sonst passt er nicht zur Text Domain.
2. Das Plugin unter „Plugins“ aktivieren.
3. Im Block-Editor einen Cover-Block auswählen und im Panel „Link“ eine Seite wählen.

== Frequently Asked Questions ==

= Kann ich auf Beiträge oder externe URLs verlinken? =

Nein, nur auf veröffentlichte Seiten.

= Warum lassen sich Buttons im verlinkten Cover nicht anklicken? =

Der Link liegt über der gesamten Fläche des Covers. Ein verlinktes Cover ist als Ganzes ein Link und sollte keine weiteren interaktiven Elemente enthalten.

= Wie passe ich den Fokusrahmen an? =

Der Rahmen nutzt die Theme-Variable `--wp--custom--focus--outline`, Fallback ist `2px solid currentColor`. Eigene Regeln über `.shft-cover-link:focus-visible`.

= Warum fehlt der Link, obwohl eine Seite gewählt ist? =

Entweder ist die Seite nicht veröffentlicht – dann steht im Editor ein Hinweis unter dem Auswahlfeld. Oder das Cover enthält fehlerhaftes HTML, etwa ein nicht geschlossenes `<div>` in einem HTML-Block. Das Plugin findet dann das Ende des Covers nicht und gibt es unverändert aus. Der Browser gleicht den Fehler aus, die Seite sieht deshalb normal aus; mit korrigiertem HTML erscheint auch der Link.

== Changelog ==

= 1.0.1 =
* Die Seitenauswahl ist ein Suchfeld statt einer Auswahlliste. Es lädt die ersten 100 Seiten, weitere findet die Suche im Seitentitel. Bisher wurden alle Seiten auf einmal geladen.
* Die Seitenauswahl funktioniert auch für Benutzer, die keine Seiten bearbeiten dürfen (Autoren, Mitarbeiter).
* Der Editor weist darauf hin, wenn die verlinkte Seite nicht veröffentlicht ist oder nicht gefunden wird.
* Unterseiten, deren Elternseite nicht veröffentlicht ist, erscheinen auf oberster Ebene statt zu fehlen.
* Der Link trägt den Seitentitel als `aria-label`. Der `<span class="screen-reader-text">` im Link entfällt; eigenes CSS, das auf ihn zielt, greift nicht mehr. Seiten ohne Titel bekommen den WordPress-Platzhalter „(no title)“ in der Sprache der Website als Namen.
* Der Link wird vor dem schließenden Tag des Cover-Wrappers eingefügt, ermittelt über den HTML Tag Processor. Bisher landete er vor dem letzten passenden schließenden Tag im Block-HTML und damit an der falschen Stelle, wenn ein anderer Filter nach dem Cover noch Markup anhängte.
* Der Wrapper wird über die Klasse `wp-block-cover` gesucht. Stellt ein anderer Filter Markup voran, landet der Link trotzdem im Cover.
* Findet sich kein schließendes Tag, bleibt das Cover unverändert. Bisher bekam es die Klasse `has-shft-link` ohne Link.
* Das verlinkte Cover bildet einen eigenen Stacking Context (`isolation: isolate`). Der Link überdeckt keine Elemente außerhalb des Covers mehr, etwa Untermenüs der Navigation.
* Das CSS gilt auch für Cover mit der alten Klasse `wp-block-cover-image`.
* Erfordert WordPress 6.5.

= 1.0.0 =
* Erste Version.
