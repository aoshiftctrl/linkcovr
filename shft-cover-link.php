<?php

/*
 * Plugin Name:       LinkCovr
 * Plugin URI:        https://github.com/aoshiftctrl/linkcovr
 * Description:       Verlinkt den Cover-Block auf eine Seite. Auswahl in der Block-Seitenleiste.
 * Version:           1.0.1
 * Requires at least: 6.5
 * Requires PHP:      8.0
 * Author:            aoshiftctrl
 * Author URI:        https://github.com/aoshiftctrl
 * License:           CC BY-ND 4.0
 * License URI:       https://creativecommons.org/licenses/by-nd/4.0/
 * Text Domain:       shft-cover-link
 */

if (!defined('ABSPATH')) {
    exit;
}

define('SHFT_COVER_LINK_URL', plugin_dir_url(__FILE__));
define('SHFT_COVER_LINK_DIR', plugin_dir_path(__FILE__));

if (!function_exists('shft_cover_link_version')) {
    function shft_cover_link_version(string $fil): string
    {
        $pth = SHFT_COVER_LINK_DIR . $fil;
        return file_exists($pth) ? (string) filemtime($pth) : '1.0.0';
    }
}

/**
 * Attribut serverseitig registrieren, damit es auch in REST und Render bekannt ist.
 */
if (!function_exists('shft_cover_link_block_args')) {
    function shft_cover_link_block_args(array $args, string $name): array
    {
        if ($name !== 'core/cover') {
            return $args;
        }
        $args['attributes']['shftLinkPage'] = [
            'type'    => 'number',
            'default' => 0,
        ];
        return $args;
    }
    add_filter('register_block_type_args', 'shft_cover_link_block_args', 10, 2);
}

if (!function_exists('shft_cover_link_editor_assets')) {
    function shft_cover_link_editor_assets(): void
    {
        wp_enqueue_script(
            'shft-cover-link-editor',
            SHFT_COVER_LINK_URL . 'assets/editor.js',
            ['wp-hooks', 'wp-blocks', 'wp-compose', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-data', 'wp-core-data', 'wp-html-entities', 'wp-i18n'],
            shft_cover_link_version('assets/editor.js'),
            true
        );
        wp_set_script_translations('shft-cover-link-editor', 'shft-cover-link');
    }
    add_action('enqueue_block_editor_assets', 'shft_cover_link_editor_assets');
}

if (!function_exists('shft_cover_link_styles')) {
    function shft_cover_link_styles(): void
    {
        wp_enqueue_block_style('core/cover', [
            'handle' => 'shft-cover-link',
            'src'    => SHFT_COVER_LINK_URL . 'assets/cover-link.css',
            'path'   => SHFT_COVER_LINK_DIR . 'assets/cover-link.css',
            'ver'    => shft_cover_link_version('assets/cover-link.css'),
        ]);
    }
    add_action('init', 'shft_cover_link_styles');
}

/**
 * Tag Processor, der HTML vor dem schließenden Tag des aktuellen Elements einfügt.
 * Bookmarks und lexical_updates wie in Core (WP_Interactivity_API_Directives_Processor);
 * WP_HTML_Text_Replacement erwartet (start, length) erst ab WP 6.5.
 */
if (!class_exists('Shft_Cover_Link_Processor')) {
    class Shft_Cover_Link_Processor extends WP_HTML_Tag_Processor
    {
        public function insert_before_closer(string $ins): bool
        {
            $tag = $this->get_tag();
            $dep = 0;
            // Gleichnamige verschachtelte Elemente überspringen
            while ($this->next_tag(['tag_name' => $tag, 'tag_closers' => 'visit'])) {
                if (!$this->is_tag_closer()) {
                    ++$dep;
                    continue;
                }
                if ($dep-- > 0) {
                    continue;
                }
                // Ausstehende Änderungen anwenden, damit die Bookmark-Position stimmt
                $this->get_updated_html();
                $this->set_bookmark('shft-closer');
                $pos = $this->bookmarks['shft-closer']->start;
                $this->release_bookmark('shft-closer');
                $this->lexical_updates[] = new WP_HTML_Text_Replacement($pos, 0, $ins);
                return true;
            }
            return false;
        }
    }
}

/**
 * Frontend: Stretched Link in den Cover legen statt ihn in <a> zu wickeln —
 * so bleiben verschachtelte Links im Inhalt gültiges HTML.
 */
if (!function_exists('shft_cover_link_render')) {
    function shft_cover_link_render(string $html, array $blk): string
    {
        $id = (int) ($blk['attrs']['shftLinkPage'] ?? 0);
        if ($id <= 0 || get_post_type($id) !== 'page' || get_post_status($id) !== 'publish') {
            return $html;
        }

        // Leerer Titel → Core-Platzhalter, sonst hat der inhaltsleere Link keinen zugänglichen Namen
        $ttl = wp_strip_all_tags(get_the_title($id));
        if ($ttl === '') {
            $ttl = __('(no title)');
        }

        $lnk = sprintf(
            '<a class="shft-cover-link" href="%s" aria-label="%s"></a>',
            esc_url(get_permalink($id)),
            esc_attr($ttl)
        );

        // Wrapper-Tag ist per tagName-Attribut wählbar (div, section, header, …).
        // Über die Klasse suchen: andere Filter können Markup voranstellen oder den Block einwickeln.
        $tag = new Shft_Cover_Link_Processor($html);
        do {
            if (!$tag->next_tag()) {
                return $html;
            }
        } while (!$tag->has_class('wp-block-cover') && !$tag->has_class('wp-block-cover-image'));
        $tag->add_class('has-shft-link');
        if (!$tag->insert_before_closer($lnk)) {
            return $html;
        }

        return $tag->get_updated_html();
    }
    add_filter('render_block_core/cover', 'shft_cover_link_render', 10, 2);
}
