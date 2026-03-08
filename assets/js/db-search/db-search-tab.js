import { Dom }        from './dom.js';
import { Beautifier } from './beautifier.js';

export class DbSearchTab {
	// AbortControllers for cancelling in-flight requests.
	static _fetchTablesCtrl = null;
	static _loadTableCtrl   = null;
	static _runQueryCtrl    = null;

	constructor( wrap, { ajaxurl, nonce } ) {
		this.wrap    = wrap;
		this.ajaxurl = ajaxurl;
		this.nonce   = nonce;
	}

	init() {
		const wrap = this.wrap;

		// Cancel any fetches still in flight from a previous tab visit so their
		// callbacks cannot interfere with the freshly-rendered DOM.
		DbSearchTab._fetchTablesCtrl?.abort();
		DbSearchTab._loadTableCtrl?.abort();
		DbSearchTab._runQueryCtrl?.abort();

		this._initTablesSidebar();
		this._initTableFilter();
		this.fetchTables();

		new Beautifier( wrap, { ajaxurl: this.ajaxurl, nonce: this.nonce } ).init();
	}

	_initTablesSidebar() {
		const wrap         = this.wrap;
		const sidebarToggle  = wrap.querySelector( '.wte-dbg-db-tables-header .wte-dbg-sidebar-toggle' );
		const DB_SIDEBAR_KEY = 'wte_dbg_query_sidebar_collapsed';

		try {
			if ( localStorage.getItem( DB_SIDEBAR_KEY ) === '1' ) {
				wrap.classList.add( 'sidebar-collapsed' );
				if ( sidebarToggle ) sidebarToggle.textContent = '\u203a'; // ›
			}
		} catch ( e ) {}

		if ( sidebarToggle ) {
			sidebarToggle.addEventListener( 'click', () => {
				const collapsed = wrap.classList.toggle( 'sidebar-collapsed' );
				sidebarToggle.textContent = collapsed ? '\u203a' : '\u2039'; // › / ‹
				try { localStorage.setItem( DB_SIDEBAR_KEY, collapsed ? '1' : '0' ); } catch ( e ) {}
			} );
		}
	}

	_initTableFilter() {
		const wrap        = this.wrap;
		const tablesList  = wrap.querySelector( '.wte-dbg-db-tables-list' );
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
	}

	fetchTables() {
		const wrap       = this.wrap;
		const tablesList = wrap.querySelector( '.wte-dbg-db-tables-list' );

		DbSearchTab._fetchTablesCtrl?.abort();
		DbSearchTab._fetchTablesCtrl = new AbortController();

		Dom.setTextContent( tablesList, '' );
		Dom.appendShimmer( tablesList, 8, 'Loading tables\u2026' );

		const params = new URLSearchParams( {
			action:      'wpte_devzone_db_tables',
			_ajax_nonce: this.nonce,
		} );

		fetch( this.ajaxurl + '?' + params, { signal: DbSearchTab._fetchTablesCtrl.signal } )
			.then( ( r ) => r.json() )
			.then( ( res ) => {
				Dom.setTextContent( tablesList, '' );
				window.wteDbgClearStatus?.();
				if ( ! res.success ) {
					tablesList.appendChild( Dom.makePara( 'wte-dbg-empty', 'Error loading tables.' ) );
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
						this.loadTable( t.name );
					} );

					tablesList.appendChild( item );
				} );
				tablesList.querySelector( '.wte-dbg-table-item' )?.click();
			} )
			.catch( ( e ) => {
				if ( e.name === 'AbortError' ) return;
				Dom.setTextContent( tablesList, '' );
				window.wteDbgClearStatus?.();
				tablesList.appendChild( Dom.makePara( 'wte-dbg-empty', 'Request failed.' ) );
			} );
	}

	loadTable( tableName ) {
		const wrap       = this.wrap;
		const queryPanel = wrap.querySelector( '.wte-dbg-db-query-panel' );

		DbSearchTab._loadTableCtrl?.abort();
		DbSearchTab._loadTableCtrl = new AbortController();

		Dom.setTextContent( queryPanel, '' );
		Dom.appendShimmer( queryPanel, 5, 'Loading columns\u2026' );

		const params = new URLSearchParams( {
			action:      'wpte_devzone_db_columns',
			table:       tableName,
			_ajax_nonce: this.nonce,
		} );

		fetch( this.ajaxurl + '?' + params, { signal: DbSearchTab._loadTableCtrl.signal } )
			.then( ( r ) => r.json() )
			.then( ( res ) => {
				Dom.setTextContent( queryPanel, '' );
				window.wteDbgClearStatus?.();
				if ( ! res.success ) {
					queryPanel.appendChild( Dom.makePara( 'wte-dbg-empty', 'Error loading columns.' ) );
					return;
				}
				const columns = res.data.columns.map( ( c ) => c.Field );
				this.renderQueryBuilder( tableName, columns );
			} )
			.catch( ( e ) => {
				if ( e.name === 'AbortError' ) {
					window.wteDbgSetStatus?.( 'Cancelled \u2014 ' + tableName + ' columns', 'cancelled' );
					return;
				}
				Dom.setTextContent( queryPanel, '' );
				window.wteDbgClearStatus?.();
				queryPanel.appendChild( Dom.makePara( 'wte-dbg-empty', 'Request failed.' ) );
			} );
	}

	renderQueryBuilder( tableName, columns ) {
		const wrap       = this.wrap;
		const queryPanel = wrap.querySelector( '.wte-dbg-db-query-panel' );

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
		addBtn.addEventListener( 'click', () => this.addFilterRow( filterRows, columns ) );

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
			this.runQuery( tableName, this.collectFilters( filterRows ), parseInt( limitSel.value, 10 ), 0, resultsWrap );
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

		Dom.setTextContent( queryPanel, '' );
		queryPanel.appendChild( builder );

		// Auto-run on load
		this.runQuery( tableName, [], parseInt( limitSel.value, 10 ), 0, resultsWrap );
	}

	addFilterRow( container, columns ) {
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

	collectFilters( container ) {
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

	runQuery( tableName, filters, limit, offset, resultsWrap ) {
		DbSearchTab._runQueryCtrl?.abort();
		DbSearchTab._runQueryCtrl = new AbortController();

		Dom.setTextContent( resultsWrap, '' );
		Dom.appendShimmer( resultsWrap, 6, 'Running query\u2026' );

		const params = new URLSearchParams( {
			action:      'wpte_devzone_db_query',
			table:       tableName,
			limit,
			offset,
			_ajax_nonce: this.nonce,
		} );

		filters.forEach( ( f, i ) => {
			params.append( 'filters[' + i + '][column]',   f.column );
			params.append( 'filters[' + i + '][operator]', f.operator );
			params.append( 'filters[' + i + '][value]',    f.value );
		} );

		fetch( this.ajaxurl + '?' + params, { signal: DbSearchTab._runQueryCtrl.signal } )
			.then( ( r ) => r.json() )
			.then( ( res ) => {
				Dom.setTextContent( resultsWrap, '' );
				window.wteDbgClearStatus?.();
				if ( ! res.success ) {
					resultsWrap.appendChild( Dom.makePara( 'wte-dbg-empty', 'Query error.' ) );
					return;
				}
				this.renderResults( res.data, tableName, filters, limit, resultsWrap );
			} )
			.catch( ( e ) => {
				if ( e.name === 'AbortError' ) {
					window.wteDbgSetStatus?.( 'Cancelled \u2014 ' + tableName + ' query', 'cancelled' );
					return;
				}
				Dom.setTextContent( resultsWrap, '' );
				window.wteDbgClearStatus?.();
				resultsWrap.appendChild( Dom.makePara( 'wte-dbg-empty', 'Request failed.' ) );
			} );
	}

	renderResults( data, tableName, filters, limit, resultsWrap ) {
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
			resultsWrap.appendChild( Dom.makePara( 'wte-dbg-empty', 'No rows found.' ) );
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

				td.addEventListener( 'click', () => this._copyCell( td, val ) );

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
			Dom.buildPagination(
				paginEl,
				Math.floor( offset / limit ) + 1,
				Math.ceil( total / limit ),
				( page ) => this.runQuery( tableName, filters, limit, ( page - 1 ) * limit, resultsWrap )
			);
			resultsWrap.appendChild( paginEl );
		}
	}

	_copyCell( td, val ) {
		if ( td.classList.contains( 'is-copied' ) ) return;
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
	}
}
