<?php
/**
 * Shared master-detail template for all post-type tools.
 *
 * Expected variables (set by SharedAjax::load_tab or Admin::render_page):
 * 
 * @var \WPTravelEngineDevZone\Tools\AbstractPostTool $tool
 */
defined( 'ABSPATH' ) || exit;

$post_type = $tool->get_post_type();
$noun      = $tool->get_noun();
$label     = strtoupper( $tool->get_label() );
?>
<div class="wte-dbg-master-detail" data-post-type="<?php echo esc_attr( $post_type ); ?>">
	<div class="wte-dbg-list-panel">
		<div class="wte-dbg-list-header">
			<strong><?php echo esc_html( $label ); ?></strong>
			<span class="wte-dbg-list-count"></span>
			<button type="button" class="wte-dbg-sidebar-toggle" title="<?php esc_attr_e( 'Collapse sidebar', 'wptravelengine-devzone' ); ?>"><?php echo '&#x2039;'; ?></button>
		</div>
		<div class="wte-dbg-search-wrap">
			<input type="search"
				class="wte-dbg-search wte-dbg-search-input"
				placeholder="<?php
					/* translators: %s: singular noun for the post type, e.g. "trip" */
					echo esc_attr( sprintf( __( 'Search %s…', 'wptravelengine-devzone' ), $noun ) );
				?>">
		</div>
		<div class="wte-dbg-list-items">
			<p class="wte-dbg-loading"><?php esc_html_e( 'Loading…', 'wptravelengine-devzone' ); ?></p>
		</div>
		<div class="wte-dbg-pagination"></div>
	</div>

	<div class="wte-dbg-inspector-panel">
		<div class="wte-dbg-inspector-placeholder">
			<p><?php
				/* translators: %s: singular noun for the post type, e.g. "trip" */
				echo esc_html( sprintf( __( '← Select a %s to inspect', 'wptravelengine-devzone' ), $noun ) );
			?></p>
		</div>
	</div>

	<div class="wte-dbg-relations-resize-handle"></div>

	<div class="wte-dbg-relations-sidebar">
		<div class="wte-dbg-relations-sidebar-header">
			<button type="button" class="wte-dbg-relations-toggle" title="<?php esc_attr_e( 'Collapse sidebar', 'wptravelengine-devzone' ); ?>">&#x203a;</button>
			<span><?php esc_html_e( 'Relations', 'wptravelengine-devzone' ); ?></span>
		</div>
		<div class="wte-dbg-relations-sidebar-body">
			<div class="wte-dbg-relation-empty"><?php esc_html_e( 'Select a record to see relations.', 'wptravelengine-devzone' ); ?></div>
		</div>
	</div>
</div>
