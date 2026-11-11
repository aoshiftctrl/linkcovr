(function (wp) {
	'use strict';

	var el = wp.element.createElement;
	var Fragment = wp.element.Fragment;
	var useState = wp.element.useState;
	var useMemo = wp.element.useMemo;
	var useRef = wp.element.useRef;
	var addFilter = wp.hooks.addFilter;
	var createHigherOrderComponent = wp.compose.createHigherOrderComponent;
	var useDebounce = wp.compose.useDebounce;
	var InspectorControls = wp.blockEditor.InspectorControls;
	var PanelBody = wp.components.PanelBody;
	var ComboboxControl = wp.components.ComboboxControl;
	var useSelect = wp.data.useSelect;
	var decodeEntities = wp.htmlEntities.decodeEntities;
	var __ = wp.i18n.__;

	var BLOCK = 'core/cover';
	var PER_PAGE = 100;
	// Liste und Einzelabruf mit denselben Feldern, damit core-data den Eintrag wiederverwendet
	var FIELDS = 'id,title,parent,status';
	var EMPTY = [];

	// Attribut clientseitig ergänzen, sonst wird es beim Speichern verworfen
	addFilter('blocks.registerBlockType', 'shft/cover-link/attribute', function (settings, name) {
		if (name !== BLOCK) {
			return settings;
		}
		settings.attributes = Object.assign({}, settings.attributes, {
			shftLinkPage: { type: 'number', default: 0 }
		});
		return settings;
	});

	// Seiten hierarchisch sortieren, Unterseiten eingerückt
	function buildOptions(pages) {
		var opt = [];
		var byParent = {};
		var ids = {};

		pages.forEach(function (p) {
			ids[p.id] = true;
		});
		// Eltern nicht im Ergebnis (privat, Entwurf, …) → Seite als Wurzel einhängen
		pages.forEach(function (p) {
			var key = ids[p.parent] ? p.parent : 0;
			(byParent[key] = byParent[key] || []).push(p);
		});

		function walk(parent, depth) {
			(byParent[parent] || []).forEach(function (p) {
				var title = (p.title && p.title.rendered) ? p.title.rendered : __('(ohne Titel)', 'shft-cover-link');
				opt.push({ label: new Array(depth + 1).join('— ') + decodeEntities(title), value: String(p.id) });
				walk(p.id, depth + 1);
			});
		}
		walk(0, 0);

		return opt;
	}

	// Erste PER_PAGE Seiten, mehr nur über die Suche — sonst lädt core-data bei großen Sites alles
	function LinkPanel(props) {
		var selected = props.attributes.shftLinkPage || 0;
		var searchState = useState('');
		var search = searchState[0];
		var setSearch = useDebounce(searchState[1], 300);
		var lastPages = useRef(EMPTY);

		var data = useSelect(function (select) {
			var core = select('core');
			// context view: der core-data-Default edit verlangt edit_pages (403 für Autoren)
			var query = {
				context: 'view',
				per_page: PER_PAGE,
				status: 'publish',
				orderby: 'menu_order',
				order: 'asc',
				_fields: FIELDS
			};
			var currentQuery = { context: 'view', _fields: FIELDS };
			if (search) {
				query.search = search;
				// Nur Titel: die Combobox filtert nach Label, Inhaltstreffer würden nur das Limit füllen
				query.search_columns = ['post_title'];
			}
			return {
				pages: core.getEntityRecords('postType', 'page', query),
				pagesResolved: core.hasFinishedResolution('getEntityRecords', ['postType', 'page', query]),
				current: selected ? core.getEntityRecord('postType', 'page', selected, currentQuery) : null,
				currentResolved: !selected || core.hasFinishedResolution('getEntityRecord', ['postType', 'page', selected, currentQuery])
			};
		}, [search, selected]);

		// Während eine neue Suche lädt, die letzte Liste behalten — sonst meldet die Combobox „No results“
		if (data.pagesResolved) {
			lastPages.current = data.pages || EMPTY;
		}
		var pages = lastPages.current;

		var options = useMemo(function () {
			var list = pages.slice();
			// Gewählte Seite muss in den Optionen stehen, sonst zeigt die Combobox kein Label
			if (data.current && !list.some(function (p) { return p.id === data.current.id; })) {
				list.push(data.current);
			}
			return buildOptions(list);
		}, [pages, data.current]);

		// Das Frontend verlinkt nur veröffentlichte Seiten — hier sagen, warum der Link fehlt
		var help;
		if (selected && data.currentResolved) {
			if (!data.current) {
				help = __('Die verlinkte Seite wurde nicht gefunden. Ist sie gelöscht oder nicht veröffentlicht, bleibt das Cover im Frontend ohne Link.', 'shft-cover-link');
			} else if (data.current.status && data.current.status !== 'publish') {
				help = __('Die verlinkte Seite ist nicht veröffentlicht. Das Cover bleibt im Frontend ohne Link.', 'shft-cover-link');
			}
		}

		return el(InspectorControls, null,
			el(PanelBody, { title: __('Link', 'shft-cover-link'), initialOpen: true },
				el(ComboboxControl, {
					label: __('Verlinkte Seite', 'shft-cover-link'),
					// null statt '0': das eingebaute Zurücksetzen (X) entfernt den Link
					value: selected ? String(selected) : null,
					placeholder: __('Kein Link', 'shft-cover-link'),
					help: help,
					options: options,
					isLoading: !data.pagesResolved || !data.currentResolved,
					onFilterValueChange: setSearch,
					onChange: function (val) {
						props.setAttributes({ shftLinkPage: parseInt(val, 10) || 0 });
					},
					__nextHasNoMarginBottom: true
				})
			)
		);
	}

	addFilter('editor.BlockEdit', 'shft/cover-link/inspector', createHigherOrderComponent(function (BlockEdit) {
		return function (props) {
			if (props.name !== BLOCK) {
				return el(BlockEdit, props);
			}
			return el(Fragment, null,
				el(BlockEdit, props),
				props.isSelected ? el(LinkPanel, props) : null
			);
		};
	}, 'withShftCoverLink'));
})(window.wp);
