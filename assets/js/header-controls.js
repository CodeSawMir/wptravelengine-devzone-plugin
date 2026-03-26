/**
 * Header controls — theme toggle, dev-mode toggle, meta collapse.
 */
/* global wpteDbg */

import { DomHelper } from './dom-helper.js';

export function isDevSlug( slug ) {
	const devFeatures  = wpteDbg.devFeatures  || {};
	const groupSubtabs = wpteDbg.groupSubtabs || {};

	// Slug is a group button whose entire group is dev-only.
	if ( devFeatures[ slug ] === '__all' ) return true;

	// Slug is a subtab of a group that is entirely dev-only.
	for ( const [ group, subs ] of Object.entries( groupSubtabs ) ) {
		if ( devFeatures[ group ] === '__all' && slug in subs ) return true;
	}

	// Slug appears in a comma-separated dev list for any group.
	for ( const [ , scope ] of Object.entries( devFeatures ) ) {
		if ( scope !== '__all' && scope.split( ',' ).map( s => s.trim() ).includes( slug ) ) {
			return true;
		}
	}

	return false;
}

export function initThemeToggle() {
	const wrap = document.querySelector( '.wte-devzone-wrap' );
	const btn  = document.querySelector( '.wte-dbg-theme-toggle' );
	const icon = btn && btn.querySelector( '.wte-dbg-theme-icon' );
	const KEY  = 'wte_dbg_theme';

	if ( ! wrap || ! btn ) return;

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

export function initDevModeToggle( onLoadTab, getCurrentSlug ) {
	const wrap = document.querySelector( '.wte-devzone-wrap' );
	const btn  = document.querySelector( '.wte-dbg-dev-toggle' );
	const KEY  = 'wte_dbg_dev_mode';

	if ( ! wrap || ! btn ) return;

	if ( ! Object.keys( wpteDbg.devFeatures || {} ).length ) {
		btn.hidden = true;
		return;
	}

	const tip = document.createElement( 'div' );
	tip.className = 'wte-dbg-float-tooltip';
	document.body.appendChild( tip );

	btn.addEventListener( 'mouseenter', () => {
		const r = btn.getBoundingClientRect();
		tip.textContent = btn.dataset.tooltip || '';
		tip.style.left  = ( r.left + r.width / 2 ) + 'px';
		tip.style.top   = ( r.bottom + 7 ) + 'px';

		const tipRect  = tip.getBoundingClientRect();
		const overflow = tipRect.right - ( window.innerWidth - 8 );
		if ( overflow > 0 ) {
			tip.style.left = ( r.left + r.width / 2 - overflow ) + 'px';
		}

		tip.classList.add( 'is-visible' );
	} );
	btn.addEventListener( 'mouseleave', () => tip.classList.remove( 'is-visible' ) );
	btn.addEventListener( 'click',      () => tip.classList.remove( 'is-visible' ) );

	const syncBtn = ( on ) => {
		btn.setAttribute( 'aria-checked', on ? 'true' : 'false' );
		btn.dataset.tooltip = on ? 'Hide hot features' : 'Show hot features';
	};

	syncBtn( wrap.classList.contains( 'wte-dbg-dev-mode' ) );

	btn.addEventListener( 'click', () => {
		const nowOn = wrap.classList.toggle( 'wte-dbg-dev-mode' );
		syncBtn( nowOn );
		try { localStorage.setItem( KEY, nowOn ? '1' : '0' ); } catch ( e ) {}

		if ( ! nowOn ) {
			const slug = getCurrentSlug?.();
			if ( slug && isDevSlug( slug ) ) {
				onLoadTab( 'overview' );
			}
		}
	} );
}

export function initMetaCollapse() {
	const wrap = document.querySelector( '.wte-devzone-wrap' );
	const btn  = document.querySelector( '.wte-dbg-meta-collapse-btn' );
	const KEY  = 'wte_dbg_meta_expanded';

	if ( ! wrap || ! btn ) return;

	const syncBtn = ( expanded ) => {
		btn.setAttribute( 'aria-expanded', expanded ? 'true' : 'false' );
		btn.title = expanded ? 'Collapse info' : 'Show info';
	};

	syncBtn( wrap.classList.contains( 'wte-dbg-meta-expanded' ) );

	btn.addEventListener( 'click', () => {
		const nowExpanded = wrap.classList.toggle( 'wte-dbg-meta-expanded' );
		syncBtn( nowExpanded );
		try { localStorage.setItem( KEY, nowExpanded ? '1' : '0' ); } catch ( e ) {}
	} );
}
