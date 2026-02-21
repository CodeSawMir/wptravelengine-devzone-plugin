<?php

namespace WPTravelEngineDevZone;

defined( 'ABSPATH' ) || exit;

class Renderer {

	/**
	 * Recursively renders a PHP array/object as an HTML tree.
	 * Used for the Settings tab (server-side rendered).
	 *
	 * @param array  $data        The data to render.
	 * @param string $option_name The root option name (for AJAX save calls).
	 * @param string $path_prefix Dot-notation path prefix for nested keys.
	 * @param int    $depth       Current nesting depth.
	 */
	public function render_tree( array $data, string $option_name, string $path_prefix = '', int $depth = 0 ): void {
		foreach ( $data as $key => $value ) {
			$path = $path_prefix ? "{$path_prefix}.{$key}" : (string) $key;

			if ( is_array( $value ) || is_object( $value ) ) {
				$arr   = (array) $value;
				$count = count( $arr );
				?>
				<details class="wte-dbg-node" data-depth="<?php echo esc_attr( $depth ); ?>">
					<summary class="wte-dbg-key">
						<?php echo esc_html( $key ); ?>
						<span class="wte-dbg-count">[<?php echo esc_html( $count ); ?> item<?php echo $count !== 1 ? 's' : ''; ?>]</span>
					</summary>
					<div class="wte-dbg-children">
						<?php $this->render_tree( $arr, $option_name, $path, $depth + 1 ); ?>
					</div>
				</details>
				<?php
			} else {
				$display = $this->format_scalar( $value );
				$raw     = is_null( $value ) ? '' : (string) $value;
				$type    = is_null( $value )                        ? 'null'
				         : ( is_bool( $value )                      ? 'boolean'
				         : ( is_int( $value ) || is_float( $value ) ? 'number'
				         :                                            'string' ) );
				?>
				<div class="wte-dbg-row"
					data-option-name="<?php echo esc_attr( $option_name ); ?>"
					data-path="<?php echo esc_attr( $path ); ?>">
					<span class="wte-dbg-key"><?php echo esc_html( $key ); ?></span>
					<span class="wte-dbg-value"
					      data-raw="<?php echo esc_attr( $raw ); ?>"
					      data-type="<?php echo esc_attr( $type ); ?>"><?php echo esc_html( $display ); ?></span>
					<button class="wte-dbg-edit-btn" title="<?php esc_attr_e( 'Edit', 'wptravelengine-devzone' ); ?>">&#9998;</button>
				</div>
				<?php
			}
		}
	}

	/**
	 * Format a scalar value for display.
	 */
	public function format_scalar( $value ): string {
		if ( is_null( $value ) ) {
			return '(null)';
		}
		if ( $value === '' ) {
			return '(empty)';
		}
		if ( is_bool( $value ) ) {
			return $value ? 'true' : 'false';
		}
		$str = (string) $value;
		if ( strlen( $str ) > 120 ) {
			return substr( $str, 0, 120 ) . '…';
		}
		return $str;
	}
}
