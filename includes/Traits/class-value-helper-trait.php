<?php

namespace WPTravelEngineDevZone\Traits;

defined( 'ABSPATH' ) || exit;

/**
 * Shared helpers for casting and logging value changes.
 * Used by ToolOverview (options) and SharedAjax (post meta).
 */
trait ValueHelperTrait {

	/**
	 * Cast the incoming string value to match the type of the existing value.
	 */
	protected function cast_value( $new, $existing ) {
		if ( is_int( $existing ) ) {
			return intval( $new );
		}
		if ( is_float( $existing ) ) {
			return floatval( $new );
		}
		if ( is_bool( $existing ) ) {
			return filter_var( $new, FILTER_VALIDATE_BOOLEAN );
		}
		if ( is_array( $existing ) || is_object( $existing ) ) {
			$decoded = json_decode( $new, true );
			return json_last_error() === JSON_ERROR_NONE ? $decoded : $new;
		}
		return sanitize_textarea_field( $new );
	}

	/**
	 * Log a change to the WordPress debug log.
	 */
	protected function log_change( string $field, $old, $new ): void {
		if ( ! defined( 'WP_DEBUG_LOG' ) || ! WP_DEBUG_LOG ) {
			return;
		}
		$user    = wp_get_current_user();
		$message = sprintf(
			'[WTE Dev Zone] user=%s field=%s before=%s after=%s',
			$user->user_login,
			$field,
			is_scalar( $old ) ? (string) $old : wp_json_encode( $old ),
			is_scalar( $new ) ? (string) $new : wp_json_encode( $new )
		);
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		error_log( $message );
	}
}
