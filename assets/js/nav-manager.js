/**
 * NavManager — nav stack, group state, subtab link injection, tab-switching clicks.
 */
/* global wpteDbg */

const GROUP_SUBTABS = wpteDbg.groupSubtabs || {};
const DEV_FEATURES  = wpteDbg.devFeatures  || {};

export class NavManager {
	constructor() {
		this._navStack  = [];
		this._backBtn   = document.querySelector( '.wte-dbg-back-btn' );
		this._onLoadTab = null;
	}

	init( onLoadTab ) {
		this._onLoadTab = onLoadTab;
		this._applyDevFeatures();
		this._initTabSwitching();
		return this;
	}

	// ---- Stack helpers ----

	push( slug, postId ) { this._navStack.push( { slug, postId } ); this._syncBackBtn(); }
	pop()                { const e = this._navStack.pop(); this._syncBackBtn(); return e; }
	get stackSize()      { return this._navStack.length; }
	clearStack()         { this._navStack = []; this._syncBackBtn(); }
	_syncBackBtn()       { this._backBtn?.classList.toggle( 'is-visible', this._navStack.length > 0 ); }

	// ---- Slug resolution ----

	resolveSlug( slug ) {
		const subs = GROUP_SUBTABS[ slug ];
		if ( subs ) {
			const first = Object.keys( subs )[ 0 ];
			if ( first ) return first;
		}
		return slug;
	}

	// ---- Group state ----

	updateGroupState( slug ) {
		const groupBtns   = document.querySelectorAll( '.wte-dbg-group-btn[data-group]' );
		const namedGroups = new Set(
			[ ...groupBtns ].map( b => b.dataset.group ).filter( g => g !== 'devzone' )
		);

		let activeGroup = namedGroups.has( slug ) ? slug : null;
		if ( ! activeGroup ) {
			for ( const [ g, subs ] of Object.entries( GROUP_SUBTABS ) ) {
				if ( slug in subs ) { activeGroup = g; break; }
			}
		}
		const isNamedGroup = activeGroup !== null;

		groupBtns.forEach( btn => {
			const group = btn.dataset.group;
			btn.classList.toggle( 'is-active', group === 'devzone' ? ! isNamedGroup : group === activeGroup );
		} );

		const nav      = document.querySelector( '.wte-dbg-tabs' );
		const subtabs  = activeGroup ? ( GROUP_SUBTABS[ activeGroup ] || {} ) : {};
		const hasSubtabs = Object.keys( subtabs ).length > 0;

		if ( ! nav ) return;

		nav.classList.toggle( 'is-hidden', isNamedGroup && ! hasSubtabs );

		nav.querySelectorAll( '.wte-dbg-tab[data-inspector-tab]' ).forEach( el => {
			el.style.display = isNamedGroup ? 'none' : '';
		} );

		if ( isNamedGroup && hasSubtabs ) {
			nav.querySelectorAll( '.wte-dbg-tab[data-group-sub]' ).forEach( el => el.remove() );

			const statusNote    = nav.querySelector( '#wte-dbg-status-note' );
			const backBtn       = nav.querySelector( '.wte-dbg-back-btn' );
			const groupDevScope = DEV_FEATURES[ activeGroup ];
			const groupDevSlugs = groupDevScope && groupDevScope !== '__all'
				? groupDevScope.split( ',' ).map( s => s.trim() )
				: [];

			for ( const [ subSlug, label ] of Object.entries( subtabs ) ) {
				const url = new URL( window.location.href );
				url.searchParams.set( 'tab', subSlug );
				url.searchParams.delete( 'post_id' );

				const a = document.createElement( 'a' );
				a.href             = url.toString();
				a.className        = 'wte-dbg-tab' + ( slug === subSlug ? ' is-active' : '' );
				a.role             = 'tab';
				a.dataset.groupSub = '1';
				if ( groupDevSlugs.includes( subSlug ) ) {
					a.dataset.dev = '1';
				}
				a.setAttribute( 'aria-selected', slug === subSlug ? 'true' : 'false' );
				a.textContent      = label;
				a.addEventListener( 'click', ( e ) => {
					e.preventDefault();
					this._onLoadTab( subSlug );
				} );

				nav.insertBefore( a, statusNote ?? backBtn ?? null );
			}
		} else if ( ! isNamedGroup ) {
			nav.querySelectorAll( '.wte-dbg-tab[data-group-sub]' ).forEach( el => el.remove() );
		}
	}

	// ---- Tab switching click handlers ----

	_initTabSwitching() {
		const clearStack = () => this.clearStack();

		document.querySelector( '.wte-dbg-header-brand-link' )
			?.addEventListener( 'click', ( e ) => {
				e.preventDefault();
				clearStack();
				this._onLoadTab( 'overview' );
			} );

		document.querySelector( '.wte-dbg-group-btn[data-group="devzone"]' )
			?.addEventListener( 'click', () => {
				clearStack();
				this._onLoadTab( 'overview' );
			} );

		document.querySelectorAll( '.wte-dbg-group-btn[data-group]' ).forEach( btn => {
			const group = btn.dataset.group;
			if ( group === 'devzone' ) return;
			btn.addEventListener( 'click', () => {
				clearStack();
				const subs     = GROUP_SUBTABS[ group ] || {};
				const firstSub = Object.keys( subs )[ 0 ];
				this._onLoadTab( firstSub || group );
			} );
		} );

		document.querySelectorAll( '.wte-dbg-tab' ).forEach( tabLink => {
			tabLink.addEventListener( 'click', ( e ) => {
				if ( tabLink.dataset.pageNav ) return;
				e.preventDefault();
				clearStack();
				const slug = new URL( tabLink.href ).searchParams.get( 'tab' ) || 'overview';
				this._onLoadTab( slug );
			} );
		} );
	}

	// ---- Dev features ----

	_applyDevFeatures() {
		Object.entries( DEV_FEATURES ).forEach( ( [ group, scope ] ) => {
			if ( scope === '__all' ) {
				const btn = document.querySelector( `.wte-dbg-group-btn[data-group="${ group }"]` );
				if ( ! btn ) return;
				btn.dataset.dev = '1';
				const prev = btn.previousElementSibling;
				if ( prev?.classList.contains( 'wte-dbg-header-divider' ) ) {
					prev.dataset.dev = '1';
				}
			} else {
				const slugs = scope.split( ',' ).map( s => s.trim() );
				document.querySelectorAll( '.wte-dbg-tab' ).forEach( tab => {
					try {
						const slug = new URL( tab.href ).searchParams.get( 'tab' ) || 'overview';
						if ( slugs.includes( slug ) ) tab.dataset.dev = '1';
					} catch ( e ) {}
				} );
			}
		} );
	}
}
