<?php defined( 'ABSPATH' ) || exit; ?>
<div class="wte-dbg-master-detail" data-post-type="wte-payments">
	<div class="wte-dbg-list-panel">
		<div class="wte-dbg-list-header">
			<strong><?php esc_html_e( 'PAYMENTS', 'wptravelengine-devzone' ); ?></strong>
			<span class="wte-dbg-list-count"></span>
		</div>
		<div class="wte-dbg-search-wrap">
			<input type="search"
				class="wte-dbg-search"
				placeholder="<?php esc_attr_e( 'Search payments…', 'wptravelengine-devzone' ); ?>">
		</div>
		<div class="wte-dbg-list-items">
			<p class="wte-dbg-loading"><?php esc_html_e( 'Loading…', 'wptravelengine-devzone' ); ?></p>
		</div>
		<div class="wte-dbg-pagination"></div>
	</div>

	<div class="wte-dbg-inspector-panel">
		<div class="wte-dbg-inspector-placeholder">
			<p><?php esc_html_e( '← Select a payment to inspect', 'wptravelengine-devzone' ); ?></p>
		</div>
	</div>
</div>
