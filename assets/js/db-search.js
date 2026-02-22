/**
 * WPTE Dev Zone — DB Search tab JS
 * Handles: table list, query builder, results, and the Unserializer sidebar.
 *
 * Loaded only on ?tab=search (conditionally enqueued by class-admin.php).
 * Depends on the core `wpte-devzone` script for the `wpteDbg` global.
 */
/* global wpteDbg */

( function () {
	'use strict';

	const { ajaxurl, nonce } = wpteDbg;

	// -----------------------------------------------------------------------
	// Bootstrap
	// -----------------------------------------------------------------------

	document.addEventListener( 'DOMContentLoaded', () => {
		initDbSearch();
	} );

	// -----------------------------------------------------------------------
	// DB Search tab
	// -----------------------------------------------------------------------

	function initDbSearch() {
		const wrap = document.querySelector( '.wte-dbg-db-search' );
		if ( ! wrap ) return;

		const tablesList  = wrap.querySelector( '.wte-dbg-db-tables-list' );
		const queryPanel  = wrap.querySelector( '.wte-dbg-db-query-panel' );
		const tableFilter = wrap.querySelector( '.wte-dbg-db-tables-filter' );

		// Filter the table list client-side (hide group headers with no visible items)
		if ( tableFilter ) {
			tableFilter.addEventListener( 'input', () => {
				const q = tableFilter.value.toLowerCase();
				tablesList.querySelectorAll( '.wte-dbg-table-item' ).forEach( ( item ) => {
					item.style.display = ( ! q || item.dataset.table.includes( q ) ) ? '' : 'none';
				} );
				// Hide a group header if all its following items are hidden
				tablesList.querySelectorAll( '.wte-dbg-table-group-hdr' ).forEach( ( hdr ) => {
					let next = hdr.nextElementSibling;
					let hasVisible = false;
					while ( next && ! next.classList.contains( 'wte-dbg-table-group-hdr' ) ) {
						if ( next.style.display !== 'none' ) hasVisible = true;
						next = next.nextElementSibling;
					}
					hdr.style.display = hasVisible ? '' : 'none';
				} );
			} );
		}

		fetchTables();
		initUnserializer( wrap );

		function fetchTables() {
			const params = new URLSearchParams( {
				action:      'wpte_devzone_db_tables',
				_ajax_nonce: nonce,
			} );

			fetch( ajaxurl + '?' + params )
				.then( ( r ) => r.json() )
				.then( ( res ) => {
					setTextContent( tablesList, '' );
					if ( ! res.success ) {
						tablesList.appendChild( makePara( 'wte-dbg-empty', 'Error loading tables.' ) );
						return;
					}
					const groupLabels = { wte: 'WP Travel Engine', wp: 'WordPress', other: 'Other' };
					let   currentGroup = null;

					res.data.tables.forEach( ( t ) => {
						if ( t.group !== currentGroup ) {
							currentGroup = t.group;
							const hdr = document.createElement( 'div' );
							hdr.className   = 'wte-dbg-table-group-hdr';
							hdr.textContent = groupLabels[ t.group ] || t.group;
							tablesList.appendChild( hdr );
						}

						const item = document.createElement( 'div' );
						item.className    = 'wte-dbg-table-item';
						item.dataset.table = t.name;

						const nameSpan = document.createElement( 'span' );
						nameSpan.className   = 'wte-dbg-table-name';
						nameSpan.textContent = t.name;

						const countSpan = document.createElement( 'span' );
						countSpan.className   = 'wte-dbg-table-rows';
						countSpan.textContent = t.rows.toLocaleString();

						item.appendChild( nameSpan );
						item.appendChild( countSpan );

						item.addEventListener( 'click', () => {
							tablesList.querySelectorAll( '.wte-dbg-table-item' ).forEach( ( i ) => i.classList.remove( 'is-active' ) );
							item.classList.add( 'is-active' );
							loadTable( t.name );
						} );

						tablesList.appendChild( item );
					} );
					tablesList.querySelector( '.wte-dbg-table-item' )?.click();
				} )
				.catch( () => {
					setTextContent( tablesList, '' );
					tablesList.appendChild( makePara( 'wte-dbg-empty', 'Request failed.' ) );
				} );
		}

		function loadTable( tableName ) {
			setTextContent( queryPanel, '' );
			queryPanel.appendChild( makePara( 'wte-dbg-loading', 'Loading columns\u2026' ) );

			const params = new URLSearchParams( {
				action:      'wpte_devzone_db_columns',
				table:       tableName,
				_ajax_nonce: nonce,
			} );

			fetch( ajaxurl + '?' + params )
				.then( ( r ) => r.json() )
				.then( ( res ) => {
					setTextContent( queryPanel, '' );
					if ( ! res.success ) {
						queryPanel.appendChild( makePara( 'wte-dbg-empty', 'Error loading columns.' ) );
						return;
					}
					const columns = res.data.columns.map( ( c ) => c.Field );
					renderQueryBuilder( tableName, columns );
				} )
				.catch( () => {
					setTextContent( queryPanel, '' );
					queryPanel.appendChild( makePara( 'wte-dbg-empty', 'Request failed.' ) );
				} );
		}

		function renderQueryBuilder( tableName, columns ) {
			const builder = document.createElement( 'div' );
			builder.className = 'wte-dbg-query-builder';

			// Header
			const header = document.createElement( 'div' );
			header.className = 'wte-dbg-query-header';

			const titleSpan = document.createElement( 'span' );
			titleSpan.className   = 'wte-dbg-query-title';
			titleSpan.textContent = tableName;
			header.appendChild( titleSpan );

			const colsSpan = document.createElement( 'span' );
			colsSpan.className   = 'wte-dbg-query-cols-hint';
			colsSpan.textContent = columns.length + ' columns';
			header.appendChild( colsSpan );

			builder.appendChild( header );

			// Filters
			const filtersSection = document.createElement( 'div' );
			filtersSection.className = 'wte-dbg-filters-section';

			const filtersLabel = document.createElement( 'div' );
			filtersLabel.className   = 'wte-dbg-filters-label';
			filtersLabel.textContent = 'Filters';
			filtersSection.appendChild( filtersLabel );

			// Filter toolbar: Add Filter | Limit | Run Query — above the filter rows
			const filterFooter = document.createElement( 'div' );
			filterFooter.className = 'wte-dbg-filter-footer';

			const addBtn = document.createElement( 'button' );
			addBtn.type      = 'button';
			addBtn.className = 'wte-dbg-add-filter-btn';
			addBtn.textContent = '+ Add Filter';
			addBtn.addEventListener( 'click', () => addFilterRow( filterRows, columns ) );

			const limitLabel = document.createElement( 'label' );
			limitLabel.className   = 'wte-dbg-limit-label';
			limitLabel.textContent = 'Limit:\u00a0';

			const limitSel = document.createElement( 'select' );
			limitSel.className = 'wte-dbg-limit-select wte-dbg-input';
			[ 25, 50, 100, 200 ].forEach( ( n ) => {
				const opt = document.createElement( 'option' );
				opt.value       = n;
				opt.textContent = n;
				if ( n === 50 ) opt.selected = true;
				limitSel.appendChild( opt );
			} );
			limitLabel.appendChild( limitSel );

			const runBtn = document.createElement( 'button' );
			runBtn.type      = 'button';
			runBtn.className = 'wte-dbg-run-btn';
			runBtn.textContent = 'Run Query';

			const resultsWrap = document.createElement( 'div' );
			resultsWrap.className = 'wte-dbg-results';

			runBtn.addEventListener( 'click', () => {
				runQuery( tableName, collectFilters( filterRows ), parseInt( limitSel.value, 10 ), 0, resultsWrap );
			} );

			filterFooter.appendChild( addBtn );
			filterFooter.appendChild( limitLabel );
			filterFooter.appendChild( runBtn );
			filtersSection.appendChild( filterFooter );

			const filterRows = document.createElement( 'div' );
			filterRows.className = 'wte-dbg-filter-rows';
			filtersSection.appendChild( filterRows );

			builder.appendChild( filtersSection );
			builder.appendChild( resultsWrap );

			setTextContent( queryPanel, '' );
			queryPanel.appendChild( builder );

			// Auto-run on load
			runQuery( tableName, [], parseInt( limitSel.value, 10 ), 0, resultsWrap );
		}

		function addFilterRow( container, columns ) {
			const row = document.createElement( 'div' );
			row.className = 'wte-dbg-filter-row';

			const colSel = document.createElement( 'select' );
			colSel.className = 'wte-dbg-filter-col wte-dbg-input';
			columns.forEach( ( col ) => {
				const opt = document.createElement( 'option' );
				opt.value = opt.textContent = col;
				colSel.appendChild( opt );
			} );

			const opSel = document.createElement( 'select' );
			opSel.className = 'wte-dbg-filter-op wte-dbg-input';
			[ '=', '!=', 'LIKE', 'NOT LIKE', '>', '<', '>=', '<=', 'IS NULL', 'IS NOT NULL' ].forEach( ( op ) => {
				const opt = document.createElement( 'option' );
				opt.value = opt.textContent = op;
				opSel.appendChild( opt );
			} );

			const valInput = document.createElement( 'input' );
			valInput.type        = 'text';
			valInput.className   = 'wte-dbg-filter-val wte-dbg-input';
			valInput.placeholder = 'value\u2026';

			opSel.addEventListener( 'change', () => {
				const noVal = opSel.value === 'IS NULL' || opSel.value === 'IS NOT NULL';
				valInput.style.display = noVal ? 'none' : '';
			} );

			const removeBtn = document.createElement( 'button' );
			removeBtn.type      = 'button';
			removeBtn.className = 'wte-dbg-filter-remove';
			removeBtn.textContent = '\u00d7';
			removeBtn.addEventListener( 'click', () => row.remove() );

			row.appendChild( removeBtn );
			row.appendChild( colSel );
			row.appendChild( opSel );
			row.appendChild( valInput );
			container.appendChild( row );
		}

		function collectFilters( container ) {
			const filters = [];
			container.querySelectorAll( '.wte-dbg-filter-row' ).forEach( ( row ) => {
				const col = row.querySelector( '.wte-dbg-filter-col' )?.value;
				const op  = row.querySelector( '.wte-dbg-filter-op' )?.value;
				const val = row.querySelector( '.wte-dbg-filter-val' )?.value || '';
				if ( col && op ) {
					filters.push( { column: col, operator: op, value: val } );
				}
			} );
			return filters;
		}

		function runQuery( tableName, filters, limit, offset, resultsWrap ) {
			setTextContent( resultsWrap, '' );
			resultsWrap.appendChild( makePara( 'wte-dbg-loading', 'Running query\u2026' ) );

			const params = new URLSearchParams( {
				action:      'wpte_devzone_db_query',
				table:       tableName,
				limit,
				offset,
				_ajax_nonce: nonce,
			} );

			filters.forEach( ( f, i ) => {
				params.append( 'filters[' + i + '][column]',   f.column );
				params.append( 'filters[' + i + '][operator]', f.operator );
				params.append( 'filters[' + i + '][value]',    f.value );
			} );

			fetch( ajaxurl + '?' + params )
				.then( ( r ) => r.json() )
				.then( ( res ) => {
					setTextContent( resultsWrap, '' );
					if ( ! res.success ) {
						resultsWrap.appendChild( makePara( 'wte-dbg-empty', 'Query error.' ) );
						return;
					}
					renderResults( res.data, tableName, filters, limit, resultsWrap );
				} )
				.catch( () => {
					setTextContent( resultsWrap, '' );
					resultsWrap.appendChild( makePara( 'wte-dbg-empty', 'Request failed.' ) );
				} );
		}

		function renderResults( data, tableName, filters, limit, resultsWrap ) {
			const rows   = data.rows;
			const total  = data.total;
			const offset = data.offset;

			const summary = document.createElement( 'div' );
			summary.className = 'wte-dbg-results-summary';
			const showing = rows.length < total
				? ' (showing ' + ( offset + 1 ) + '\u2013' + ( offset + rows.length ) + ')'
				: '';
			summary.textContent = total.toLocaleString() + ' row' + ( total !== 1 ? 's' : '' ) + showing;
			resultsWrap.appendChild( summary );

			if ( ! rows.length ) {
				resultsWrap.appendChild( makePara( 'wte-dbg-empty', 'No rows found.' ) );
				return;
			}

			const cols = Object.keys( rows[ 0 ] );

			const tableWrap = document.createElement( 'div' );
			tableWrap.className = 'wte-dbg-table-wrap';

			const table = document.createElement( 'table' );
			table.className = 'wte-dbg-result-table';

			const thead = document.createElement( 'thead' );
			const headerRow = document.createElement( 'tr' );
			cols.forEach( ( col ) => {
				const th = document.createElement( 'th' );
				th.textContent = col;
				headerRow.appendChild( th );
			} );
			thead.appendChild( headerRow );
			table.appendChild( thead );

			const tbody = document.createElement( 'tbody' );
			rows.forEach( ( row ) => {
				const tr = document.createElement( 'tr' );
				cols.forEach( ( col ) => {
					const td  = document.createElement( 'td' );
					const val = row[ col ];
					const text = val === null ? '(null)' : String( val );
					td.textContent = text;
					if ( val === null ) td.classList.add( 'is-null' );

					td.addEventListener( 'click', () => {
						const copyText = val === null ? '' : String( val );
						const prev     = td.textContent;

						const showFeedback = () => {
							td.classList.add( 'is-copied' );
							td.textContent = 'Copied!';
							setTimeout( () => {
								td.classList.remove( 'is-copied' );
								td.textContent = prev;
							}, 1000 );
						};

						if ( navigator.clipboard && navigator.clipboard.writeText ) {
							navigator.clipboard.writeText( copyText ).then( showFeedback );
						} else {
							// Fallback for HTTP / older browsers
							const ta = document.createElement( 'textarea' );
							ta.value = copyText;
							ta.style.cssText = 'position:fixed;opacity:0;';
							document.body.appendChild( ta );
							ta.select();
							document.execCommand( 'copy' );
							document.body.removeChild( ta );
							showFeedback();
						}
					} );

					tr.appendChild( td );
				} );
				tbody.appendChild( tr );
			} );
			table.appendChild( tbody );
			tableWrap.appendChild( table );
			resultsWrap.appendChild( tableWrap );

			// Pagination
			if ( total > limit ) {
				const paginEl = document.createElement( 'div' );
				paginEl.className = 'wte-dbg-pagination';
				buildPagination(
					paginEl,
					Math.floor( offset / limit ) + 1,
					Math.ceil( total / limit ),
					( page ) => runQuery( tableName, filters, limit, ( page - 1 ) * limit, resultsWrap )
				);
				resultsWrap.appendChild( paginEl );
			}
		}
	}

	// -----------------------------------------------------------------------
	// Unserializer sidebar
	// -----------------------------------------------------------------------

	function initUnserializer( wrap ) {
		const sidebar   = wrap.querySelector( '.wte-dbg-unserializer' );
		const toggleBtn = wrap.querySelector( '.wte-dbg-unser-toggle' );
		const input     = wrap.querySelector( '.wte-dbg-unser-input' );
		const runBtn    = wrap.querySelector( '.wte-dbg-unser-btn' );
		const outputEl  = wrap.querySelector( '.wte-dbg-unser-output' );

		if ( ! sidebar || ! toggleBtn ) return;

		// Drag-resize handle — inserted as flex sibling just before the sidebar
		const resizeHandle = document.createElement( 'div' );
		resizeHandle.className = 'wte-dbg-unser-resize-handle';
		wrap.insertBefore( resizeHandle, sidebar );

		let resizing       = false;
		let resizeStartX   = 0;
		let resizeStartW   = 0;

		resizeHandle.addEventListener( 'mousedown', ( e ) => {
			if ( wrap.classList.contains( 'unser-closed' ) ) return;
			resizing     = true;
			resizeStartX = e.clientX;
			resizeStartW = sidebar.offsetWidth;
			sidebar.style.transition = 'none'; // disable slide animation while dragging
			document.body.style.cursor    = 'ew-resize';
			document.body.style.userSelect = 'none';
			e.preventDefault();
		} );

		document.addEventListener( 'mousemove', ( e ) => {
			if ( ! resizing ) return;
			// Moving the cursor left → positive dx → wider sidebar
			const dx       = resizeStartX - e.clientX;
			const newWidth = Math.max( 200, Math.min( 800, resizeStartW + dx ) );
			sidebar.style.width = newWidth + 'px';
		} );

		document.addEventListener( 'mouseup', () => {
			if ( ! resizing ) return;
			resizing = false;
			sidebar.style.transition      = '';
			document.body.style.cursor    = '';
			document.body.style.userSelect = '';
		} );

		// Toggle open/close
		toggleBtn.addEventListener( 'click', () => {
			const isOpen = ! wrap.classList.contains( 'unser-closed' );
			if ( isOpen ) {
				// Save the inline width so it can be restored on reopen,
				// then clear it so the CSS width:0 rule can take effect.
				sidebar.dataset.savedWidth = sidebar.style.width;
				sidebar.style.width = '';
			} else if ( sidebar.dataset.savedWidth ) {
				sidebar.style.width = sidebar.dataset.savedWidth;
			}
			wrap.classList.toggle( 'unser-closed', isOpen );
			toggleBtn.textContent = isOpen ? '\u25C4' : '\u25BA'; // ► / ◄
		} );

		// Maximize / restore
		const maximizeBtn = wrap.querySelector( '.wte-dbg-unser-maximize' );
		if ( maximizeBtn ) {
			maximizeBtn.addEventListener( 'click', () => {
				const isMaximized = wrap.classList.toggle( 'unser-maximized' );
				if ( isMaximized && wrap.classList.contains( 'unser-closed' ) ) {
					wrap.classList.remove( 'unser-closed' );
					if ( toggleBtn ) toggleBtn.textContent = '\u25C4';
				}
				maximizeBtn.textContent = isMaximized ? '\u29C1' : '\u2922'; // ⧁ / ⤢
				maximizeBtn.title = isMaximized ? 'Restore' : 'Maximize';
			} );
		}

		// Unserialize button
		runBtn.addEventListener( 'click', () => {
			const data = input.value.trim();
			if ( ! data ) return;

			outputEl.textContent = 'Processing\u2026';

			const body = new URLSearchParams( {
				action:      'wpte_devzone_unserialize',
				data,
				_ajax_nonce: nonce,
			} );

			fetch( ajaxurl, { method: 'POST', body } )
				.then( ( r ) => r.json() )
				.then( ( res ) => {
					const out = wrap.querySelector( '.wte-dbg-unser-output' );
					while ( out.firstChild ) out.removeChild( out.firstChild );
					if ( res.success ) {
						const { tree, format } = res.data;
						const badgeLabels = {
							json:          'JSON',
							php:           'PHP',
							'base64+json': 'Base64 → JSON',
							'base64+php':  'Base64 → PHP',
							base64:        'Base64',
							url:           'URL params',
						};
						if ( badgeLabels[ format ] ) {
							const lbl = document.createElement( 'div' );
							lbl.className   = 'wte-dbg-count wte-dbg-unser-format-badge';
							lbl.textContent = badgeLabels[ format ];
							out.appendChild( lbl );
						}
						if ( format === 'unknown' ) {
							renderUnserFallback( out, tree );
						} else {
							out.appendChild( buildUnserTree( tree ) );
						}
					} else {
						out.textContent = 'Error.';
					}
				} )
				.catch( () => {
					outputEl.textContent = 'Request failed.';
				} );
		} );
	}

	// -----------------------------------------------------------------------
	// Unserializer tree renderer (mirrors meta tree in devzone.js, read-only)
	// -----------------------------------------------------------------------

	function buildUnserTree( data ) {
		const wrap = document.createElement( 'div' );
		wrap.className = 'wte-dbg-unser-tree';

		if ( data === null || data === undefined ) {
			const p = document.createElement( 'p' );
			p.className   = 'wte-dbg-empty';
			p.textContent = '(null)';
			wrap.appendChild( p );
			return wrap;
		}

		if ( typeof data !== 'object' ) {
			const row = document.createElement( 'div' );
			row.className = 'wte-dbg-row';
			const val = document.createElement( 'span' );
			val.className    = 'wte-dbg-value';
			val.dataset.raw  = String( data );
			val.textContent  = String( data );
			row.appendChild( val );
			wrap.appendChild( row );
			return wrap;
		}

		const entries = Object.entries( data );
		if ( ! entries.length ) {
			const p = document.createElement( 'p' );
			p.className   = 'wte-dbg-empty';
			p.textContent = '(empty)';
			wrap.appendChild( p );
			return wrap;
		}

		entries.forEach( ( [ key, value ] ) => {
			wrap.appendChild( buildUnserNode( key, value ) );
		} );

		applyUnserStripes( wrap );
		return wrap;
	}

	function buildUnserNode( key, value ) {
		if ( value !== null && typeof value === 'object' ) {
			const details = document.createElement( 'details' );
			details.className = 'wte-dbg-node';

			const summary = document.createElement( 'summary' );
			summary.className = 'wte-dbg-key';

			const entries = Object.entries( value );
			summary.appendChild( document.createTextNode( key + '\u00a0' ) );

			const countSpan = document.createElement( 'span' );
			countSpan.className   = 'wte-dbg-count';
			countSpan.textContent = '[' + entries.length + ' item' + ( entries.length !== 1 ? 's' : '' ) + ']';
			summary.appendChild( countSpan );
			details.appendChild( summary );

			const children = document.createElement( 'div' );
			children.className = 'wte-dbg-unser-children';
			entries.forEach( ( [ k, v ] ) => {
				children.appendChild( buildUnserNode( k, v ) );
			} );
			details.appendChild( children );
			return details;
		}

		// Scalar leaf
		const raw = ( value === null || value === undefined ) ? '' : String( value );
		const row = document.createElement( 'div' );
		row.className = 'wte-dbg-row';

		const keySpan = document.createElement( 'span' );
		keySpan.className   = 'wte-dbg-key';
		keySpan.textContent = key;

		const valSpan = document.createElement( 'span' );
		valSpan.className   = 'wte-dbg-value';
		valSpan.dataset.raw = raw;
		valSpan.dataset.type = value === null            ? 'null'
		                     : typeof value === 'boolean' ? 'boolean'
		                     : typeof value === 'number'  ? 'number'
		                     : 'string';
		valSpan.textContent = raw === '' ? '(empty)' : ( raw.length > 120 ? raw.substring( 0, 120 ) + '\u2026' : raw );

		row.appendChild( keySpan );
		row.appendChild( valSpan );
		return row;
	}

	function renderUnserFallback( container, raw ) {
		const notice = document.createElement( 'div' );
		notice.className = 'wte-dbg-unser-unknown-notice';
		notice.textContent = 'Unknown format — showing raw input.';

		const pre = document.createElement( 'pre' );
		pre.className = 'wte-dbg-unser-pre';
		pre.textContent = raw;

		container.appendChild( notice );
		container.appendChild( pre );
	}

	function applyUnserStripes( container ) {
		let idx = 0;
		for ( const el of container.children ) {
			if ( el.classList.contains( 'wte-dbg-row' ) || el.classList.contains( 'wte-dbg-node' ) ) {
				el.classList.toggle( 'is-stripe', ( idx++ ) % 2 !== 0 );
			}
		}
		container.querySelectorAll( '.wte-dbg-unser-children' ).forEach( applyUnserStripes );
	}

	// -----------------------------------------------------------------------
	// Pagination helper (mirrors core devzone.js)
	// -----------------------------------------------------------------------

	function buildPagination( paginEl, page, totalPages, onPage ) {
		setTextContent( paginEl, '' );
		if ( totalPages <= 1 ) return;

		const prev = document.createElement( 'button' );
		prev.className = 'wte-dbg-page-btn';
		prev.textContent = '\u00ab Prev';
		prev.dataset.page = page - 1;
		if ( page <= 1 ) prev.disabled = true;

		const info = document.createElement( 'span' );
		info.style.cssText = 'font-size:12px;padding:0 8px;';
		info.textContent = page + ' / ' + totalPages;

		const next = document.createElement( 'button' );
		next.className = 'wte-dbg-page-btn';
		next.textContent = 'Next \u00bb';
		next.dataset.page = page + 1;
		if ( page >= totalPages ) next.disabled = true;

		[ prev, next ].forEach( ( btn ) => {
			if ( ! btn.disabled ) {
				btn.addEventListener( 'click', () => onPage( parseInt( btn.dataset.page, 10 ) ) );
			}
		} );

		paginEl.appendChild( prev );
		paginEl.appendChild( info );
		paginEl.appendChild( next );
	}

	// -----------------------------------------------------------------------
	// DOM helpers
	// -----------------------------------------------------------------------

	function makePara( className, text ) {
		const p = document.createElement( 'p' );
		p.className = className;
		p.textContent = text;
		return p;
	}

	function setTextContent( el, text ) {
		while ( el.firstChild ) el.removeChild( el.firstChild );
		if ( text ) el.textContent = text;
	}

	window.wpteDbgInitSearch = initDbSearch;
} )();
