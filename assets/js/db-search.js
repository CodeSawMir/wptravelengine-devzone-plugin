/**
 * WPTE Dev Zone — DB Search tab JS entry point.
 * Handles: table list, query builder, results, and the Unserializer sidebar.
 *
 * Loaded only on ?tab=query (conditionally enqueued by ToolQuery::enqueue_assets()).
 * Depends on the core `wpte-devzone` script for the `wpteDbg` global.
 */
/* global wpteDbg */

import { DbSearchTab } from './db-search/db-search-tab.js';

const { ajaxurl, nonce } = wpteDbg;

function initDbSearch() {
	const wrap = document.querySelector( '.wte-dbg-db-search' );
	if ( ! wrap || wrap.dataset.initialized ) return;
	wrap.dataset.initialized = '1';
	new DbSearchTab( wrap, { ajaxurl, nonce } ).init();
}

document.addEventListener( 'DOMContentLoaded', initDbSearch );
window.wpteDbgInitSearch = initDbSearch;
