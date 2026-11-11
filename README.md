# LinkCovr (`shft-cover-link`)

WordPress-Plugin, das den Cover-Block (`core/cover`) auf eine Seite verlinkt. Die gesamte Fläche des Covers wird klickbar, die Auswahl erfolgt in der Block-Seitenleiste.

## Voraussetzungen

- WordPress 6.5 oder neuer (getestet bis 7.1)
- PHP 8.0 oder neuer

## Installation

1. Den Ordner `shft-cover-link` nach `wp-content/plugins/` kopieren. Bei einem GitHub-ZIP heißt der entpackte Ordner `linkcovr-main` und muss vorher in `shft-cover-link` umbenannt werden, sonst passt er nicht zur Text Domain.
2. Das Plugin unter „Plugins“ aktivieren.
3. Im Block-Editor einen Cover-Block auswählen und im Panel „Link“ eine Seite wählen.

## Funktionsweise

- **Editor:** Ein Filter auf `editor.BlockEdit` ergänzt das Panel „Link“ mit einem durchsuchbaren Auswahlfeld (`ComboboxControl`). Ohne Suchbegriff lädt es die ersten 100 veröffentlichten Seiten hierarchisch, weitere Seiten über die Titelsuche der REST-API (`context=view`, damit auch Autoren die Liste sehen).
- **Attribut:** `shftLinkPage` (number, `0` = kein Link) wird client- und serverseitig für `core/cover` registriert (`blocks.registerBlockType` bzw. `register_block_type_args`).
- **Frontend:** `render_block_core/cover` setzt am Wrapper die Klasse `has-shft-link` und fügt vor dessen schließendem Tag einen absolut positionierten Link ein (`a.shft-cover-link`, Seitentitel als `aria-label`). Ist die Seite nicht veröffentlicht oder das HTML im Cover unbalanciert (kein schließendes Tag auf Wrapper-Ebene), bleibt das Cover unverändert.
- **CSS:** `assets/cover-link.css` wird per `wp_enqueue_block_style()` nur zusammen mit dem Cover-Block geladen.

Verlinkte Cover sollten keine Buttons oder Links enthalten, da der Stretched Link alle Klicks abfängt.

## Dateien

| Datei | Zweck |
| --- | --- |
| `shft-cover-link.php` | Attribut, Asset-Registrierung, Frontend-Rendering |
| `assets/editor.js` | Panel und Seitenauswahl im Block-Editor |
| `assets/cover-link.css` | Stretched Link und Fokusrahmen |
| `readme.txt` | Plugin-Readme im Format von WordPress.org |

## Lizenz

[CC BY-ND 4.0](https://creativecommons.org/licenses/by-nd/4.0/)
