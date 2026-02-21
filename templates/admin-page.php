<?php
defined( 'ABSPATH' ) || exit;

$active_tab = sanitize_key( $_GET['tab'] ?? 'settings' );
$tabs       = [
	'settings'  => __( 'Overview', 'wptravelengine-devzone' ),
	'trips'     => __( 'Trips', 'wptravelengine-devzone' ),
	'bookings'  => __( 'Bookings', 'wptravelengine-devzone' ),
	'payment'   => __( 'Payments', 'wptravelengine-devzone' ),
	'customers' => __( 'Customers', 'wptravelengine-devzone' ),
	'search'    => __( 'DB Search', 'wptravelengine-devzone' ),
];
?>
<div class="wrap wte-debugger-wrap">
	<div class="wte-dbg-header">
		<div class="wte-dbg-header-brand">
			<a class="wte-dbg-header-brand-link" href="<?php echo esc_url( add_query_arg( [ 'page' => \WPTravelEngineDevZone\Admin::PAGE_SLUG ], admin_url( 'edit.php?post_type=booking' ) ) ); ?>">
				<span class="wte-dbg-header-icon" aria-hidden="true">&#9992;</span>
				<span class="wte-dbg-header-product"><?php esc_html_e( 'WP Travel Engine', 'wptravelengine-devzone' ); ?></span>
				<span class="wte-dbg-header-divider" aria-hidden="true"></span>
				<span class="wte-dbg-header-zone"><?php esc_html_e( 'Dev Zone', 'wptravelengine-devzone' ); ?></span>
			</a>
		</div>
		<div class="wte-dbg-header-meta">
			<span class="wte-dbg-meta-pill">v<?php echo esc_html( WTE_DEVZONE_VERSION ); ?></span>
			<span class="wte-dbg-meta-pill">WP&nbsp;<?php echo esc_html( get_bloginfo( 'version' ) ); ?></span>
			<span class="wte-dbg-meta-pill">PHP&nbsp;<?php echo esc_html( PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION ); ?></span>
		</div>
	</div>

	<nav class="wte-dbg-tabs" role="tablist">
		<?php foreach ( $tabs as $slug => $label ) : ?>
			<a href="<?php echo esc_url( add_query_arg( [ 'page' => \WPTravelEngineDevZone\Admin::PAGE_SLUG, 'tab' => $slug ], admin_url( 'edit.php?post_type=booking' ) ) ); ?>"
			   class="wte-dbg-tab <?php echo $active_tab === $slug ? 'is-active' : ''; ?>"
			   role="tab"
			   aria-selected="<?php echo $active_tab === $slug ? 'true' : 'false'; ?>">
				<?php echo esc_html( $label ); ?>
			</a>
		<?php endforeach; ?>
	</nav>

	<div class="wte-dbg-content">
		<?php
		$template_map = [
			'settings'  => WTE_DEVZONE_DIR . 'templates/tab-settings.php',
			'trips'     => WTE_DEVZONE_DIR . 'templates/tab-trips.php',
			'bookings'  => WTE_DEVZONE_DIR . 'templates/tab-bookings.php',
			'payment'   => WTE_DEVZONE_DIR . 'templates/tab-payment.php',
			'customers' => WTE_DEVZONE_DIR . 'templates/tab-customers.php',
			'search'    => WTE_DEVZONE_DIR . 'templates/tab-search.php',
		];

		if ( isset( $template_map[ $active_tab ] ) && file_exists( $template_map[ $active_tab ] ) ) {
			require $template_map[ $active_tab ];
		}
		?>
	</div>
</div>
