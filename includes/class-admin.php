<?php

namespace WPTravelEngineDevZone;

defined( 'ABSPATH' ) || exit;

class Admin {

	// WTE's parent menu slug (all WTE sub-pages hang under Bookings post type)
	public const PARENT_SLUG = 'edit.php?post_type=booking';
	public const PAGE_SLUG   = 'wptravelengine-devzone';
	public const NONCE       = 'wte_devzone_nonce';

	public function __construct() {
		add_action( 'admin_menu', [ $this, 'register_menu' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_assets' ] );
		add_action( 'current_screen', [ $this, 'suppress_notices_on_our_page' ] );

		$handler = new AjaxHandler();
		$handler->register();
	}

	/**
	 * Remove all admin notice hooks when viewing the Debugger page so the UI
	 * stays clean and uncluttered by unrelated plugin/theme notices.
	 */
	public function suppress_notices_on_our_page( \WP_Screen $screen ): void {
		if ( strpos( $screen->id, self::PAGE_SLUG ) === false ) {
			return;
		}
		remove_all_actions( 'admin_notices' );
		remove_all_actions( 'all_admin_notices' );
		remove_all_actions( 'user_admin_notices' );
		remove_all_actions( 'network_admin_notices' );
	}

	public function register_menu(): void {
		add_submenu_page(
			self::PARENT_SLUG,
			__( 'WP Travel Engine - Dev Zone', 'wptravelengine-devzone' ),
			__( 'Dev Zone', 'wptravelengine-devzone' ),
			'manage_options',
			self::PAGE_SLUG,
			[ $this, 'render_page' ]
		);
	}

	public function enqueue_assets( string $hook ): void {
		// Only load on our admin page
		if ( strpos( $hook, self::PAGE_SLUG ) === false ) {
			return;
		}

		wp_enqueue_style(
			'wptravelengine-devzone',
			WTE_DEVZONE_URL . 'assets/css/debugger.css',
			[],
			WTE_DEVZONE_VERSION
		);

		wp_enqueue_script(
			'wptravelengine-devzone',
			WTE_DEVZONE_URL . 'assets/js/debugger.js',
			[],
			WTE_DEVZONE_VERSION,
			true
		);

		wp_enqueue_style(
			'wte-debugger-search',
			WTE_DEVZONE_URL . 'assets/css/db-search.css',
			[ 'wptravelengine-devzone' ],
			WTE_DEVZONE_VERSION
		);
		wp_enqueue_script(
			'wte-debugger-search',
			WTE_DEVZONE_URL . 'assets/js/db-search.js',
			[ 'wptravelengine-devzone' ],
			WTE_DEVZONE_VERSION,
			true
		);

		wp_localize_script( 'wptravelengine-devzone', 'wteDbg', [
			'ajaxurl'    => admin_url( 'admin-ajax.php' ),
			'nonce'      => wp_create_nonce( self::NONCE ),
			'post_types' => [
				'trip'         => __( 'Trips', 'wptravelengine-devzone' ),
				'booking'      => __( 'Bookings', 'wptravelengine-devzone' ),
				'wte-payments' => __( 'Payments', 'wptravelengine-devzone' ),
				'customer'     => __( 'Customers', 'wptravelengine-devzone' ),
			],
		] );
	}

	public function render_page(): void {
		require WTE_DEVZONE_DIR . 'templates/admin-page.php';
	}
}
