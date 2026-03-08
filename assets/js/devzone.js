/**
 * WPTE Dev Zone — Entry Point
 * Imports all tab modules, defines TAB_REGISTRY and DevZoneApp, then bootstraps.
 *
 * Native ES modules are automatically scoped and strict — no IIFE or 'use strict' needed.
 *
 * Security note: All server-supplied strings are HTML-escaped via esc() before
 * any innerHTML assignment. No raw user input is ever inserted unescaped.
 */
/* global wpteDbg */

import { DomHelper }       from './dom-helper.js';
import { OverviewTab }     from './overview-tab.js';
import { MasterDetailTab } from './master-detail-tab.js';
import { LogsTab }         from './logs-tab.js';

// Injected via wp_localize_script
const { ajaxurl, nonce } = wpteDbg;

const TAB_KEY = 'wte_dbg_tab';

// -----------------------------------------------------------------------
// TAB_REGISTRY — maps slug → factory fn, instantiates on demand
// -----------------------------------------------------------------------

const TAB_REGISTRY = {
	overview:  ( el ) => new OverviewTab( el ).init(),
	trips:     ( el ) => new MasterDetailTab( 'trip', el ).init(),
	bookings:  ( el ) => new MasterDetailTab( 'booking', el ).init(),
	payments:  ( el ) => new MasterDetailTab( 'wte-payments', el ).init(),
	customers: ( el ) => new MasterDetailTab( 'customer', el ).init(),
	logs:      ( el ) => new LogsTab( el, ( slug, extra ) => DevZoneApp.instance.loadTab( slug, extra ) ).init(),
	// query: handled by window.wpteDbgInitSearch() in db-search.js
};

// -----------------------------------------------------------------------
// DevZoneApp — bootstrap, tab switching, AJAX load, theme toggle
// -----------------------------------------------------------------------

class DevZoneApp {
	constructor() {
		this.contentEl    = document.querySelector( '.wte-dbg-content' );
		this._fetchController = null;
	}

	boot() {
		this._initTabSwitching();
		this._initThemeToggle();

		// Restore last active tab across reloads.
		let savedTab = null;
		try { savedTab = localStorage.getItem( TAB_KEY ); } catch ( e ) {}

		const renderedTab = ( this.contentEl && this.contentEl.dataset.renderedTab ) || 'overview';

		if ( savedTab && savedTab !== renderedTab ) {
			this.loadTab( savedTab );
		} else {
			// Init the tab that PHP already rendered
			if ( this.contentEl ) {
				TAB_REGISTRY[ renderedTab ]?.( this.contentEl );
				if ( typeof window.wpteDbgInitSearch === 'function' ) {
					window.wpteDbgInitSearch();
				}
			}
			this._updateGroupState( renderedTab );
		}
	}

	_updateGroupState( slug ) {
		const isLogs = slug === 'logs';
		document.querySelector( '.wte-dbg-group-btn[data-group="devzone"]' )?.classList.toggle( 'is-active', ! isLogs );
		document.querySelector( '.wte-dbg-group-btn[data-group="logs"]' )?.classList.toggle( 'is-active', isLogs );
		document.querySelector( '.wte-dbg-tabs' )?.classList.toggle( 'is-hidden', isLogs );
	}

	loadTab( slug, extra ) {
		this._updateGroupState( slug );

		// Update active tab UI
		document.querySelectorAll( '.wte-dbg-tab' ).forEach( ( t ) => {
			const tSlug = new URL( t.href ).searchParams.get( 'tab' ) || 'overview';
			t.classList.toggle( 'is-active', tSlug === slug );
		} );

		try { localStorage.setItem( TAB_KEY, slug ); } catch ( e ) {}

		// Keep the URL in sync so a page reload renders the correct tab directly
		// without needing an extra AJAX round-trip (eliminates tab-switch flash).
		try {
			const url = new URL( window.location.href );
			if ( slug === 'overview' ) {
				url.searchParams.delete( 'tab' );
			} else {
				url.searchParams.set( 'tab', slug );
			}
			history.replaceState( null, '', url.toString() );
		} catch ( e ) {}

		const content = this.contentEl;
		if ( ! content ) return;

		// Abort any in-flight request before starting a new one.
		this._fetchController?.abort();
		this._fetchController = new AbortController();
		const { signal } = this._fetchController;

		// Clear any running note timer from a previous load.
		if ( this._noteTimer ) {
			clearInterval( this._noteTimer );
			this._noteTimer = null;
		}

		DomHelper.setTextContent( content, '' );
		content.style.visibility = '';

		// Build skeleton overlay with a status note that cycles through load stages.
		const tabLabels = {
			overview: 'settings', trips: 'trips', bookings: 'bookings',
			payments: 'payments', customers: 'customers', logs: 'logs', query: 'query',
		};
		const label = tabLabels[ slug ] || slug;
		const noteMessages = [
			'Loading ' + label + '\u2026',
			'Fetching ' + label + ' data\u2026',
			'Parsing records\u2026',
			'Rendering ' + label + '\u2026',
		];
		let noteIdx = 0;
		content.appendChild( DomHelper.makeLoader( noteMessages[ 0 ], slug ) );
		this._noteTimer = setInterval( () => {
			noteIdx = ( noteIdx + 1 ) % noteMessages.length;
			DomHelper.updateLoaderNote( noteMessages[ noteIdx ] );
		}, 800 );

		fetch( ajaxurl, {
			method: 'POST',
			signal,
			body:   new URLSearchParams( Object.assign( {
				action:      'wpte_devzone_load_tab',
				tab:         slug,
				_ajax_nonce: nonce,
			}, extra || {} ) ),
		} )
			.then( ( r ) => r.json() )
			.then( ( res ) => {
				clearInterval( this._noteTimer );
				this._noteTimer = null;
				DomHelper.clearStatus();
				DomHelper.setTextContent( content, '' );
				content.style.visibility = '';
				if ( ! res.success ) {
					content.appendChild( DomHelper.makePara( 'wte-dbg-empty', 'Failed to load tab.' ) );
					return;
				}
				DomHelper.setServerHtml( content, res.data.html );
				TAB_REGISTRY[ slug ]?.( content );
				if ( typeof window.wpteDbgInitSearch === 'function' ) {
					window.wpteDbgInitSearch();
				}
			} )
			.catch( ( err ) => {
				clearInterval( this._noteTimer );
				this._noteTimer = null;
				DomHelper.clearStatus();
				if ( err.name === 'AbortError' ) {
					DomHelper.setStatus( 'Cancelled \u2014 ' + label + ' loading', 'cancelled' );
					return;
				}
				DomHelper.setTextContent( content, '' );
				content.style.visibility = '';
				content.appendChild( DomHelper.makePara( 'wte-dbg-empty', 'Request failed.' ) );
			} );
	}

	_initTabSwitching() {
		// Brand link → always go to devzone group, overview tab
		document.querySelector( '.wte-dbg-header-brand-link' )
			?.addEventListener( 'click', ( e ) => {
				e.preventDefault();
				this.loadTab( 'overview' );
			} );

		// Dev Zone button → always reload to overview tab
		document.querySelector( '.wte-dbg-group-btn[data-group="devzone"]' )
			?.addEventListener( 'click', () => {
				this.loadTab( 'overview' );
			} );

		// Logs button → load logs tab
		document.querySelector( '.wte-dbg-group-btn[data-group="logs"]' )
			?.addEventListener( 'click', () => this.loadTab( 'logs' ) );

		document.querySelectorAll( '.wte-dbg-tab' ).forEach( ( tabLink ) => {
			tabLink.addEventListener( 'click', ( e ) => {
				if ( tabLink.dataset.pageNav ) return;
				e.preventDefault();
				const slug = new URL( tabLink.href ).searchParams.get( 'tab' ) || 'overview';
				this.loadTab( slug );
			} );
		} );
	}

	_initThemeToggle() {
		const wrap = document.querySelector( '.wte-devzone-wrap' );
		const btn  = document.querySelector( '.wte-dbg-theme-toggle' );
		const icon = btn && btn.querySelector( '.wte-dbg-theme-icon' );
		const KEY  = 'wte_dbg_theme';

		if ( ! wrap || ! btn ) return;

		// Dark class already applied by the inline script in layout.php
		// (before first paint — no flash). Just sync the icon to match.
		if ( wrap.classList.contains( 'wte-dbg-dark' ) ) {
			if ( icon ) icon.textContent = '\u263e'; // ☾
		}

		btn.addEventListener( 'click', () => {
			const isDark = wrap.classList.toggle( 'wte-dbg-dark' );
			document.body.classList.toggle( 'wte-dbg-page-dark', isDark );
			if ( icon ) icon.textContent = isDark ? '\u263e' : '\u2600'; // ☾ / ☀
			localStorage.setItem( KEY, isDark ? 'dark' : 'light' );
			DomHelper.setStatus( isDark ? 'Dark mode enabled' : 'Light mode enabled', 'success' );
		} );
	}
}

// -----------------------------------------------------------------------
// Bootstrap
// -----------------------------------------------------------------------

document.addEventListener( 'DOMContentLoaded', () => {
	DevZoneApp.instance = new DevZoneApp();
	DevZoneApp.instance.boot();

	// Expose status helpers for non-module scripts (e.g. db-search.js)
	window.wteDbgSetStatus   = ( msg, type ) => DomHelper.setStatus( msg, type );
	window.wteDbgClearStatus = ()            => DomHelper.clearStatus();
} );
