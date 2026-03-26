/** WPTE Dev Zone — entry point. Wires NavManager + TabLoader + header controls. */
/* global wpteDbg */

import { DomHelper }       from './dom-helper.js';
import { OverviewTab }     from './tabs/overview-tab.js';
import { MasterDetailTab } from './tabs/master-detail-tab.js';
import { LogsTab }         from './tabs/logs-tab.js';
import { CronTab }         from './tabs/cron-tab.js';
import { PerfTab }         from './tabs/perf-tab.js';
import { NavManager }      from './nav-manager.js';
import { TabLoader }       from './tab-loader.js';
import { initThemeToggle, initDevModeToggle, initMetaCollapse } from './header-controls.js';

let loader;

const TAB_REGISTRY = {
	overview:  ( el )      => new OverviewTab( el ).init(),
	trips:     ( el, id )  => new MasterDetailTab( 'trip',         el, id, ( s, pid ) => loader.navigateTo( s, pid ) ).init(),
	bookings:  ( el, id )  => new MasterDetailTab( 'booking',      el, id, ( s, pid ) => loader.navigateTo( s, pid ) ).init(),
	payments:  ( el, id )  => new MasterDetailTab( 'wte-payments', el, id, ( s, pid ) => loader.navigateTo( s, pid ) ).init(),
	customers: ( el, id )  => new MasterDetailTab( 'customer',     el, id, ( s, pid ) => loader.navigateTo( s, pid ) ).init(),
	logs:      ( el )      => new LogsTab( el, ( slug, extra ) => loader.loadTab( slug, extra ) ).init(),
	cron:      ( el )      => new CronTab( el ).init(),
	perf:      ( el )      => new PerfTab( el ).init(),
	// query: handled by window.wpteDbgInitSearch() in tabs/query.js
};

document.addEventListener( 'DOMContentLoaded', () => {
	const nav = new NavManager();
	loader    = new TabLoader( nav, TAB_REGISTRY );

	nav.init( ( slug, extra ) => loader.loadTab( slug, extra ) );
	document.querySelector( '.wte-dbg-back-btn' )?.addEventListener( 'click', () => loader.goBack() );

	initThemeToggle();
	initDevModeToggle( ( slug ) => loader.loadTab( slug ), () => loader.currentSlug );
	initMetaCollapse();

	// Restore last active tab or init the PHP-rendered one.
	let savedTab = null;
	try { savedTab = localStorage.getItem( 'wte_dbg_tab' ); } catch ( e ) {}
	const contentEl   = document.querySelector( '.wte-dbg-content' );
	const renderedTab = contentEl?.dataset.renderedTab || 'overview';
	let urlPostId = null;
	try {
		const raw = new URL( window.location.href ).searchParams.get( 'post_id' );
		if ( raw ) urlPostId = parseInt( raw, 10 ) || null;
	} catch ( e ) {}

	if ( savedTab && savedTab !== renderedTab && ! urlPostId ) {
		loader.loadTab( savedTab );
	} else {
		loader.initRendered( renderedTab, urlPostId );
	}

	// Expose status helpers for non-module scripts (e.g. db-search.js).
	window.wteDbgSetStatus   = ( msg, type ) => DomHelper.setStatus( msg, type );
	window.wteDbgClearStatus = ()            => DomHelper.clearStatus();
} );
