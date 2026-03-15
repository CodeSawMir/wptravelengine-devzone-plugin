/**
 * WPTE Dev Zone — MasterDetailTab
 * List + inspector panel for trips/bookings/payments/customers.
 */
/* global wpteDbg */

import { DomHelper }    from './dom-helper.js';
import { InlineEditor } from './inline-editor.js';

const { ajaxurl, nonce } = wpteDbg;

export class MasterDetailTab {
	constructor( postType, contentEl ) {
		this.postType             = postType;
		this.contentEl            = contentEl;
		this.currentPostId        = null;
		this.searchTimeout        = null;
		this._listController      = null;
		this._inspectorController = null;
		this.editor               = new InlineEditor(
			() => this.currentPostId,
			() => this.postType
		);
	}

	init() {
		const panel = this.contentEl.querySelector( '.wte-dbg-master-detail' );
		if ( ! panel ) return;

		// Sidebar collapse toggle — persisted in localStorage.
		const toggleBtn   = panel.querySelector( '.wte-dbg-sidebar-toggle' );
		const SIDEBAR_KEY = 'wte_dbg_sidebar_collapsed';

		try {
			if ( localStorage.getItem( SIDEBAR_KEY ) === '1' ) {
				panel.classList.add( 'sidebar-collapsed' );
				if ( toggleBtn ) toggleBtn.textContent = '\u203a'; // ›
			}
		} catch ( e ) {}

		if ( toggleBtn ) {
			toggleBtn.addEventListener( 'click', () => {
				const collapsed = panel.classList.toggle( 'sidebar-collapsed' );
				toggleBtn.textContent = collapsed ? '\u203a' : '\u2039'; // › / ‹
				try { localStorage.setItem( SIDEBAR_KEY, collapsed ? '1' : '0' ); } catch ( e ) {}
			} );
		}

		const searchEl  = panel.querySelector( '.wte-dbg-search' );
		const listEl    = panel.querySelector( '.wte-dbg-list-items' );
		const paginEl   = panel.querySelector( '.wte-dbg-pagination' );
		const inspector = panel.querySelector( '.wte-dbg-inspector-panel' );

		this._loadList( '', 1, listEl, paginEl, panel, inspector );

		if ( searchEl ) {
			searchEl.addEventListener( 'input', () => {
				clearTimeout( this.searchTimeout );
				this.searchTimeout = setTimeout( () => {
					this._loadList( searchEl.value, 1, listEl, paginEl, panel, inspector );
				}, 400 );
			} );
		}

		// Event delegation for section collapse toggles, inline edit, and status-select.
		// Attached to `panel` (not contentEl) so it is not re-accumulated on each loadTab call.
		panel.addEventListener( 'click', ( e ) => {
			const hdr = e.target.closest( '.wte-dbg-inspector-panel .wte-dbg-section-header' );
			if ( hdr ) {
				hdr.closest( '.wte-dbg-section' ).classList.toggle( 'is-collapsed' );
				return;
			}

			const editBtn = e.target.closest( '.wte-dbg-inspector-panel .wte-dbg-edit-btn' );
			if ( editBtn ) {
				const row = editBtn.closest( '.wte-dbg-row' );
				if ( row ) this.editor.activateEdit( row );
				return;
			}

			const link = e.target.closest( '.wte-dbg-inspector-panel .wte-dbg-link[data-post-id]' );
			if ( link ) {
				const linkedId = parseInt( link.dataset.postId, 10 );
				this._loadInspector( linkedId, inspector );
			}
		} );

		panel.addEventListener( 'change', ( e ) => {
			const sel = e.target.closest( '.wte-dbg-inspector-panel .wte-dbg-status-select' );
			if ( sel ) {
				const postId = this.currentPostId;
				this.editor.savePostField( postId, 'post_status', sel.value, sel );
			}
		} );
	}

	_loadList( search, page, listEl, paginEl, panel, inspector ) {
		this._listController?.abort();
		this._listController = new AbortController();
		const { signal: listSignal } = this._listController;

		DomHelper.setTextContent( listEl, '' );
		DomHelper.appendShimmer( listEl, 6, 'Loading ' + this.postType + ' list\u2026' );

		const params = new URLSearchParams( {
			action:      'wpte_devzone_list_posts',
			post_type:   this.postType,
			search:      search || '',
			paged:       page,
			_ajax_nonce: nonce,
		} );

		fetch( ajaxurl + '?' + params, { signal: listSignal } )
			.then( ( r ) => r.json() )
			.then( ( res ) => {
				DomHelper.setTextContent( listEl, '' );
				DomHelper.clearStatus();

				if ( ! res.success ) {
					listEl.appendChild( DomHelper.makePara( 'wte-dbg-empty', 'Error: ' + ( res.data && res.data.message ? res.data.message : 'Unknown' ) ) );
					return;
				}

				const posts      = res.data.posts;
				const total      = res.data.total;
				const totalPages = res.data.total_pages;

				const countEl = panel.querySelector( '.wte-dbg-list-count' );
				if ( countEl ) countEl.textContent = '(' + total + ')';

				if ( ! posts.length ) {
					listEl.appendChild( DomHelper.makePara( 'wte-dbg-empty', 'No records found.' ) );
				} else {
					posts.forEach( ( p ) => {
						const item = this._buildListItem( p );
						item.addEventListener( 'click', () => {
							listEl.querySelectorAll( '.wte-dbg-list-item' ).forEach( ( i ) => i.classList.remove( 'is-active' ) );
							item.classList.add( 'is-active' );
							this._loadInspector( parseInt( item.dataset.postId, 10 ), inspector );
						} );
						listEl.appendChild( item );
					} );
					listEl.querySelector( '.wte-dbg-list-item' )?.click();
				}

				DomHelper.buildPagination( paginEl, page, totalPages, ( newPage ) => {
					this._loadList( search, newPage, listEl, paginEl, panel, inspector );
				} );
			} )
			.catch( ( e ) => {
				if ( e.name === 'AbortError' ) {
					DomHelper.setStatus( 'Cancelled \u2014 ' + this.postType + ' list', 'cancelled' );
					return;
				}
				DomHelper.setTextContent( listEl, '' );
				DomHelper.clearStatus();
				listEl.appendChild( DomHelper.makePara( 'wte-dbg-empty', 'Request failed.' ) );
			} );
	}

	_buildListItem( post ) {
		const item = document.createElement( 'div' );
		item.className = 'wte-dbg-list-item';
		item.dataset.postId = post.id;

		const title = document.createElement( 'span' );
		title.className = 'wte-dbg-list-item-title';
		title.textContent = post.title;

		const meta = document.createElement( 'span' );
		meta.className = 'wte-dbg-list-item-meta';

		const badge = document.createElement( 'span' );
		badge.className = 'wte-dbg-status wte-dbg-status-' + post.status;
		badge.textContent = post.status;

		const date   = post.date ? post.date.split( ' ' )[ 0 ] : '';
		const idSpan = document.createTextNode( '\u00a0 ID:' + post.id + '\u00a0\u00a0' + date );

		meta.appendChild( badge );
		meta.appendChild( idSpan );
		item.appendChild( title );
		item.appendChild( meta );

		return item;
	}

	_loadInspector( postId, inspector ) {
		this._inspectorController?.abort();
		this._inspectorController = new AbortController();
		const { signal: inspectorSignal } = this._inspectorController;

		this.currentPostId = postId;

		DomHelper.setTextContent( inspector, '' );
		DomHelper.appendShimmer( inspector, 4, 'Loading inspector\u2026' );

		const params = new URLSearchParams( {
			action:      'wpte_devzone_get_post',
			post_id:     postId,
			_ajax_nonce: nonce,
		} );

		fetch( ajaxurl + '?' + params, { signal: inspectorSignal } )
			.then( ( r ) => r.json() )
			.then( ( res ) => {
				DomHelper.setTextContent( inspector, '' );
				DomHelper.clearStatus();

				if ( ! res.success ) {
					const err = document.createElement( 'div' );
					err.className = 'wte-dbg-error-notice';
					err.textContent = 'Error: ' + ( res.data && res.data.message ? res.data.message : 'Unknown' );
					inspector.appendChild( err );
					return;
				}
				this._renderInspector( res.data, inspector );
			} )
			.catch( ( e ) => {
				if ( e.name === 'AbortError' ) {
					DomHelper.setStatus( 'Cancelled \u2014 ' + this.postType + ' inspector', 'cancelled' );
					return;
				}
				DomHelper.setTextContent( inspector, '' );
				DomHelper.clearStatus();
				const errEl = document.createElement( 'div' );
				errEl.className = 'wte-dbg-error-notice';
				errEl.textContent = 'Request failed.';
				inspector.appendChild( errEl );
			} );
	}

	_renderInspector( data, inspector ) {
		const post       = data.post;
		const meta       = data.meta;
		const taxonomies = data.taxonomies;

		// Header
		const header = document.createElement( 'div' );
		header.className = 'wte-dbg-inspector-header';

		const titleEl = document.createElement( 'div' );
		titleEl.className = 'wte-dbg-inspector-title';
		titleEl.textContent = post.post_title || '#' + post.ID;

		const subEl = document.createElement( 'div' );
		subEl.className = 'wte-dbg-inspector-subtitle';
		subEl.textContent = 'ID: ' + post.ID + ' \u2022 Type: ' + post.post_type;

		header.appendChild( titleEl );
		header.appendChild( subEl );
		inspector.appendChild( header );

		// Body
		const body = document.createElement( 'div' );
		body.className = 'wte-dbg-inspector-body';

		body.appendChild( this._buildInspectorSection( 'Post Fields', this._buildPostFieldsDOM( post ) ) );
		body.appendChild( this._buildInspectorSection( 'Meta', this._buildMetaTreeDOM( meta ) ) );
		body.appendChild( this._buildInspectorSection( 'Taxonomies', this._buildTaxonomiesDOM( taxonomies ) ) );

		inspector.appendChild( body );
	}

	_buildInspectorSection( title, contentNode ) {
		const section = document.createElement( 'div' );
		section.className = 'wte-dbg-section';

		const hdr = document.createElement( 'div' );
		hdr.className = 'wte-dbg-section-header';
		hdr.textContent = title;

		const bodyDiv = document.createElement( 'div' );
		bodyDiv.className = 'wte-dbg-section-body';
		bodyDiv.appendChild( contentNode );

		section.appendChild( hdr );
		section.appendChild( bodyDiv );
		return section;
	}

	_buildPostFieldsDOM( post ) {
		const wrap = document.createElement( 'div' );

		// Status dropdown
		const statuses  = [ 'publish', 'pending', 'draft', 'private', 'trash', 'booked', 'completed', 'cancelled' ];
		const statusRow = DomHelper.buildRow();
		statusRow.classList.add( 'wte-dbg-post-field' );
		statusRow.dataset.postId = post.ID;
		statusRow.dataset.field  = 'post_status';

		const sel = document.createElement( 'select' );
		sel.className = 'wte-dbg-status-select wte-dbg-input';
		sel.style.cssText = 'font-size:12px;padding:2px 4px;';
		statuses.forEach( ( s ) => {
			const opt = document.createElement( 'option' );
			opt.value = s;
			opt.textContent = s;
			if ( post.post_status === s ) opt.selected = true;
			sel.appendChild( opt );
		} );
		statusRow.appendChild( DomHelper.makeKeySpan( 'post_status' ) );
		statusRow.appendChild( sel );
		wrap.appendChild( statusRow );

		// Title (editable)
		const titleRow = DomHelper.buildRow();
		titleRow.dataset.postId = post.ID;
		titleRow.dataset.field  = 'post_title';
		titleRow.appendChild( DomHelper.makeKeySpan( 'post_title' ) );
		titleRow.appendChild( DomHelper.makeValueSpan( post.post_title || '' ) );
		titleRow.appendChild( DomHelper.makeEditBtn() );
		wrap.appendChild( titleRow );

		// Date (read-only)
		const dateRow = DomHelper.buildRow();
		dateRow.appendChild( DomHelper.makeKeySpan( 'post_date' ) );
		dateRow.appendChild( DomHelper.makeValueSpan( post.post_date || '' ) );
		wrap.appendChild( dateRow );

		return wrap;
	}

	_buildTaxonomiesDOM( taxonomies ) {
		const wrap = document.createElement( 'div' );
		let hasAny = false;

		for ( const [ tax, terms ] of Object.entries( taxonomies ) ) {
			if ( ! terms.length ) continue;
			hasAny = true;

			const rowDiv = document.createElement( 'div' );
			rowDiv.style.cssText = 'padding:4px 20px;display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;';

			const keySpan = DomHelper.makeKeySpan( tax );
			keySpan.style.minWidth = '120px';
			rowDiv.appendChild( keySpan );

			const termsWrap = document.createElement( 'span' );
			termsWrap.style.cssText = 'display:inline-flex;flex-wrap:wrap;gap:4px;';
			terms.forEach( ( t ) => {
				const badge = document.createElement( 'span' );
				badge.className = 'wte-dbg-tax-term';
				badge.textContent = t;
				termsWrap.appendChild( badge );
			} );

			rowDiv.appendChild( termsWrap );
			wrap.appendChild( rowDiv );
		}

		if ( ! hasAny ) {
			wrap.appendChild( DomHelper.makePara( 'wte-dbg-tax-empty', 'No taxonomy terms.' ) );
		}

		return wrap;
	}

	_buildMetaTreeDOM( meta ) {
		const wrap = document.createElement( 'div' );
		wrap.className = 'wte-dbg-meta-tree';

		if ( ! meta || ! Object.keys( meta ).length ) {
			wrap.appendChild( DomHelper.makePara( 'wte-dbg-empty', 'No meta found.' ) );
			return wrap;
		}

		const keys = Object.keys( meta ).sort( ( a, b ) => {
			if ( a === 'wp_travel_engine_setting' ) return -1;
			if ( b === 'wp_travel_engine_setting' ) return 1;
			return a.localeCompare( b );
		} );

		keys.forEach( ( key ) => {
			wrap.appendChild( this._buildMetaNodeDOM( key, meta[ key ], '' ) );
		} );

		DomHelper.applyRowStripes( wrap );
		return wrap;
	}

	_buildMetaNodeDOM( key, value, parentPath ) {
		const path = parentPath ? parentPath + '.' + key : key;

		if ( value !== null && typeof value === 'object' ) {
			const details = document.createElement( 'details' );
			details.className = 'wte-dbg-node';

			const summary = document.createElement( 'summary' );
			summary.className = 'wte-dbg-key';

			const keyText   = document.createTextNode( key + '\u00a0' );
			const countSpan = document.createElement( 'span' );
			countSpan.className = 'wte-dbg-count';
			const entries = Object.entries( value );
			countSpan.textContent = '[' + entries.length + ' item' + ( entries.length !== 1 ? 's' : '' ) + ']';

			summary.appendChild( keyText );
			summary.appendChild( countSpan );
			details.appendChild( summary );

			const children = document.createElement( 'div' );
			children.className = 'wte-dbg-children';
			entries.forEach( ( [ k, v ] ) => {
				children.appendChild( this._buildMetaNodeDOM( k, v, path ) );
			} );
			details.appendChild( children );

			return details;
		}

		// Scalar leaf
		const raw     = ( value === null || value === undefined ) ? '' : String( value );
		const row     = DomHelper.buildRow();
		row.dataset.metaKey = key;
		row.dataset.path    = path;
		const valSpan = DomHelper.makeValueSpan( raw );
		valSpan.dataset.type = value === null             ? 'null'
		                     : typeof value === 'boolean' ? 'boolean'
		                     : typeof value === 'number'  ? 'number'
		                     : 'string';
		row.appendChild( DomHelper.makeKeySpan( key ) );
		row.appendChild( valSpan );
		row.appendChild( DomHelper.makeEditBtn() );

		return row;
	}
}
