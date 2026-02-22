<?php

namespace WPTravelEngineDevZone;

defined( 'ABSPATH' ) || exit;

class Plugin {

	private static ?Plugin $instance = null;

	public static function register_autoloader(): void {
		spl_autoload_register( function ( $class ) {
			$prefix = 'WPTravelEngineDevZone\\';
			if ( strpos( $class, $prefix ) !== 0 ) {
				return;
			}

			// Convert namespace path to file path:
			// WPTravelEngineDevZone\AjaxHandler => includes/class-ajax-handler.php
			$relative = substr( $class, strlen( $prefix ) );
			$filename  = 'class-' . strtolower( preg_replace( '/([A-Z])/', '-$1', lcfirst( $relative ) ) ) . '.php';
			$file      = WPTE_DEVZONE_DIR . 'includes/' . $filename;

			if ( file_exists( $file ) ) {
				require_once $file;
			}
		} );
	}

	public static function instance(): Plugin {
		if ( null === self::$instance ) {
			self::$instance = new self();
			self::$instance->boot();
		}
		return self::$instance;
	}

	private function boot(): void {
		new Admin();
	}
}
