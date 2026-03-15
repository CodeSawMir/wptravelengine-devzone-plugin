/**
 * WPTE Dev Zone — LogsTab
 * Link & GET-form interception for logs sub-navigation.
 *
 * Receives `loadTab` as a constructor callback to avoid a circular import
 * with the DevZoneApp entry point.
 */

export class LogsTab {
	/**
	 * @param {Element}  contentEl — the tab content container
	 * @param {Function} loadTab   — DevZoneApp.instance.loadTab bound callback
	 */
	constructor( contentEl, loadTab ) {
		this.contentEl  = contentEl;
		this._loadTab   = loadTab;
	}

	init() {
		const logsExtra = ( params ) => {
			const extra = {};
			params.forEach( ( v, k ) => {
				if ( k !== 'page' && k !== 'tab' ) extra[ k ] = String( v );
			} );
			return extra;
		};

		// Delegate link clicks — intercept any Logs-tab <a> link.
		this.contentEl.addEventListener( 'click', ( e ) => {
			const link = e.target.closest( 'a[href]' );
			if ( ! link ) return;

			let url;
			try { url = new URL( link.href ); } catch ( _ ) { return; }

			if ( url.searchParams.get( 'tab' ) !== 'logs' ) return;

			e.preventDefault();
			this._loadTab( 'logs', { extra_get: JSON.stringify( logsExtra( url.searchParams ) ) } );
		} );

		// Delegate GET form submissions
		this.contentEl.addEventListener( 'submit', ( e ) => {
			const form = e.target.closest( 'form' );
			if ( ! form ) return;
			if ( ( form.method || 'get' ).toLowerCase() !== 'get' ) return;

			const tabInput = form.querySelector( 'input[name="tab"]' );
			if ( ! tabInput || tabInput.value !== 'logs' ) return;

			e.preventDefault();
			this._loadTab( 'logs', { extra_get: JSON.stringify( logsExtra( new FormData( form ) ) ) } );
		} );

		// Delegate POST form submissions (e.g. settings save).
		// The browser URL may not contain tab=logs, so a normal submit would land on
		// the wrong DevZone tab and the save would never run.  Route through the
		// DevZone AJAX call instead, merging the form fields into the request body.
		this.contentEl.addEventListener( 'submit', ( e ) => {
			const form = e.target.closest( 'form' );
			if ( ! form ) return;
			if ( ( form.method || 'get' ).toLowerCase() !== 'post' ) return;

			e.preventDefault();

			// Strip keys that would clash with DevZone AJAX reserved params.
			const skipKeys = new Set( [ 'action', 'tab', '_ajax_nonce', 'page' ] );
			const postFields = {};
			new FormData( form ).forEach( ( v, k ) => {
				if ( ! skipKeys.has( k ) ) postFields[ k ] = String( v );
			} );

			// FormData excludes submit inputs; add the submitter manually so PHP
			// triggers like isset($_POST['wte_save_logger_settings']) work correctly.
			if ( e.submitter && e.submitter.name && ! skipKeys.has( e.submitter.name ) ) {
				postFields[ e.submitter.name ] = e.submitter.value || '';
			}

			// Preserve the current view (settings, files, entries…) so the response
			// re-renders the same view with a success/error notice.
			const viewInput = form.querySelector( 'input[name="view"]' );
			const view = viewInput
				? viewInput.value
				: ( new URLSearchParams( window.location.search ).get( 'view' ) || 'settings' );

			this._loadTab( 'logs', Object.assign(
				{ extra_get: JSON.stringify( { view } ) },
				postFields
			) );
		} );
	}
}
