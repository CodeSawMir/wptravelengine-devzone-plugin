<?php

namespace WPTravelEngineDevZone\Tools;

use WPTravelEngineDevZone\Admin;

defined( 'ABSPATH' ) || exit;

/**
 * Handles AJAX for the Beautifier / Var Dump sidebar panel on the Query tab.
 */
class ToolBeautifier {

	public function register(): void {
		$actions = [
			'wpte_devzone_unserialize' => 'unserialize_data',
			'wpte_devzone_var_dump'    => 'parse_var_dump',
		];
		foreach ( $actions as $action => $method ) {
			add_action( "wp_ajax_{$action}", [ $this, $method ] );
		}
	}

	// -------------------------------------------------------------------------
	// Endpoints
	// -------------------------------------------------------------------------

	public function unserialize_data(): void {
		Admin::verify_request();

		$raw     = wp_unslash( $_POST['data'] ?? '' );
		$trimmed = trim( $raw );

		// 1. Try JSON
		if ( strpos( $trimmed, '{' ) === 0 || strpos( $trimmed, '[' ) === 0 ) {
			$decoded = json_decode( $raw, true );
			if ( json_last_error() === JSON_ERROR_NONE ) {
				wp_send_json_success( [ 'tree' => $decoded, 'format' => 'json' ] );
				return;
			}
		}

		// 2. Try PHP unserialize
		$unserialized = maybe_unserialize( $raw );
		if ( $unserialized !== $raw ) {
			wp_send_json_success( [ 'tree' => $unserialized, 'format' => 'php' ] );
			return;
		}

		// 3. Try Base64
		$decoded = base64_decode( $trimmed, true );
		if ( $decoded !== false && mb_detect_encoding( $decoded, 'UTF-8', true ) ) {
			$inner = trim( $decoded );
			if ( strpos( $inner, '{' ) === 0 || strpos( $inner, '[' ) === 0 ) {
				$json = json_decode( $decoded, true );
				if ( json_last_error() === JSON_ERROR_NONE ) {
					wp_send_json_success( [ 'tree' => $json, 'format' => 'base64+json' ] );
					return;
				}
			}
			$unserialized = maybe_unserialize( $decoded );
			if ( $unserialized !== $decoded ) {
				wp_send_json_success( [ 'tree' => $unserialized, 'format' => 'base64+php' ] );
				return;
			}
			wp_send_json_success( [ 'tree' => $decoded, 'format' => 'base64' ] );
			return;
		}

		// 4. Try URL query string
		if ( strpos( $trimmed, '=' ) !== false && ( strpos( $trimmed, '%' ) !== false || strpos( $trimmed, '&' ) !== false || strpos( $trimmed, '+' ) !== false ) ) {
			parse_str( $trimmed, $parsed );
			if ( count( $parsed ) >= 2 ) {
				wp_send_json_success( [ 'tree' => $parsed, 'format' => 'url' ] );
				return;
			}
		}

		// 5. Unknown format — return raw string with fallback flag
		wp_send_json_success( [ 'tree' => $raw, 'format' => 'unknown' ] );
	}

	public function parse_var_dump(): void {
		Admin::verify_request();

		$raw     = wp_unslash( $_POST['data'] ?? '' );
		$trimmed = trim( $raw );

		if ( empty( $trimmed ) ) {
			wp_send_json_error( [ 'message' => 'No input provided.' ] );
			return;
		}

		// Keep a copy because parse_vardump_value() consumes $trimmed by reference.
		$original = $trimmed;
		$parsed   = $this->parse_vardump_value( $trimmed );

		// If the parser returned the original string unchanged, the input is not
		// var_dump format. Fall back to PHP unserialize / JSON detection.
		if ( is_string( $parsed ) && $parsed === $original ) {
			$unserialized = maybe_unserialize( $raw );
			if ( $unserialized !== $raw ) {
				wp_send_json_success( [ 'tree' => $unserialized, 'format' => 'php' ] );
				return;
			}
			if ( strpos( $trimmed, '{' ) === 0 || strpos( $trimmed, '[' ) === 0 ) {
				$decoded = json_decode( $raw, true );
				if ( json_last_error() === JSON_ERROR_NONE ) {
					wp_send_json_success( [ 'tree' => $decoded, 'format' => 'json' ] );
					return;
				}
			}
		}

		wp_send_json_success( [ 'tree' => $parsed, 'format' => 'vardump' ] );
	}

	// -------------------------------------------------------------------------
	// var_dump parser
	// -------------------------------------------------------------------------

	/** Parse a single var_dump value from the start of $str, consuming matched characters. */
	private function parse_vardump_value( string &$str ) {
		$str = ltrim( $str );

		if ( empty( $str ) ) return null;

		if ( strncmp( $str, 'NULL', 4 ) === 0 ) {
			$str = substr( $str, 4 );
			return null;
		}

		if ( preg_match( '/^bool\((true|false)\)/', $str, $m ) ) {
			$str = substr( $str, strlen( $m[0] ) );
			return $m[1] === 'true';
		}

		if ( preg_match( '/^int\((-?\d+)\)/', $str, $m ) ) {
			$str = substr( $str, strlen( $m[0] ) );
			return (int) $m[1];
		}

		if ( preg_match( '/^float\(([^)]+)\)/', $str, $m ) ) {
			$str = substr( $str, strlen( $m[0] ) );
			return (float) $m[1];
		}

		// Use declared byte length to extract exact content (handles embedded quotes/braces).
		if ( preg_match( '/^string\((\d+)\) "/', $str, $m ) ) {
			$header_len  = strlen( $m[0] );
			$content_len = (int) $m[1];
			$value       = substr( $str, $header_len, $content_len );
			$str         = substr( $str, $header_len + $content_len + 1 ); // skip closing "
			return $value;
		}

		if ( preg_match( '/^array\(\d+\) \{/', $str, $m ) ) {
			$str = substr( $str, strlen( $m[0] ) );
			return $this->parse_vardump_block( $str );
		}

		if ( preg_match( '/^object\(([^)]+)\)#\d+ \(\d+\) \{/', $str, $m ) ) {
			$class = $m[1];
			$str   = substr( $str, strlen( $m[0] ) );
			$body  = $this->parse_vardump_block( $str );
			return array_merge( [ '__class__' => $class ], $body );
		}

		// Unrecognised token — consume to end of line.
		$nl  = strpos( $str, "\n" );
		$val = $nl !== false ? substr( $str, 0, $nl ) : $str;
		$str = $nl !== false ? substr( $str, $nl + 1 ) : '';
		return trim( $val );
	}

	/** Parse the body of a { … } block, consuming the closing } from $str. */
	private function parse_vardump_block( string &$str ): array {
		$result = [];

		while ( true ) {
			$str = ltrim( $str );
			if ( empty( $str ) || $str[0] === '}' ) break;

			if ( ! preg_match( '/^\[(.+?)\]=>\s*/s', $str, $m ) ) break;

			$raw_key = $m[1];
			$str     = substr( $str, strlen( $m[0] ) );

			// Strip outer quotes and visibility modifiers.
			$key = preg_replace( '/^"(.*)"$/s', '$1', $raw_key );
			$key = preg_replace( '/":[^"]*:(?:private|protected|public)$/', '', $key );

			$result[ $key ] = $this->parse_vardump_value( $str );
		}

		$str = ltrim( $str );
		if ( ! empty( $str ) && $str[0] === '}' ) {
			$str = substr( $str, 1 );
		}

		return $result;
	}
}
