<?php
defined( 'ABSPATH' ) || exit;

$active_tab = sanitize_key( $_GET['tab'] ?? 'settings' );
$tabs       = [
	'settings'  => __( 'Overview', 'wptravelengine-devzone' ),
	'trips'     => __( 'Trips', 'wptravelengine-devzone' ),
	'bookings'  => __( 'Bookings', 'wptravelengine-devzone' ),
	'payment'   => __( 'Payments', 'wptravelengine-devzone' ),
	'customers' => __( 'Customers', 'wptravelengine-devzone' ),
	'search'    => __( 'Query', 'wptravelengine-devzone' ),
];
?>
<div class="wrap wte-devzone-wrap">
<script>(function(){try{if(localStorage.getItem('wte_dbg_theme')==='dark'){document.currentScript.parentElement.classList.add('wte-dbg-dark');document.body.classList.add('wte-dbg-page-dark');}}catch(e){}}());</script>
	<div class="wte-dbg-header">
		<div class="wte-dbg-header-brand">
			<a class="wte-dbg-header-brand-link" href="<?php echo esc_url( add_query_arg( [ 'page' => \WPTravelEngineDevZone\Admin::PAGE_SLUG ], admin_url( 'tools.php' ) ) ); ?>">
				<svg class="wte-dbg-header-icon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="orange">
					<path d="M20 8h-2.81A6 6 0 0 0 6.81 8H4a1 1 0 0 0 0 2h2v1a8 8 0 0 0 .07 1H4a1 1 0 0 0 0 2h2.64A6 6 0 0 0 18 14v-1h2a1 1 0 0 0 0-2h-2.07A8 8 0 0 0 18 11v-1h2a1 1 0 0 0 0-2zM9 7.5a3 3 0 0 1 6 0H9zm3 10.5a4 4 0 0 1-4-4v-3h8v3a4 4 0 0 1-4 4zm-1-6v2h2v-2h-2z"/>
					<circle cx="9" cy="3" r="1.5"/>
					<circle cx="15" cy="3" r="1.5"/>
				</svg>
				<span class="wte-dbg-header-product"><?php esc_html_e( 'WP Travel Engine', 'wptravelengine-devzone' ); ?></span>
				<span class="wte-dbg-header-divider" aria-hidden="true"></span>
				<span class="wte-dbg-header-zone"><?php esc_html_e( 'Dev Zone', 'wptravelengine-devzone' ); ?></span>
			</a>
		</div>
		<div class="wte-dbg-header-meta">
			<span class="wte-dbg-meta-pill">PHP&nbsp;<?php echo esc_html( PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION ); ?></span>
			<span class="wte-dbg-meta-pill">WP&nbsp;<?php echo esc_html( get_bloginfo( 'version' ) ); ?></span>
			<span class="wte-dbg-meta-pill">WPTE&nbsp;<?php echo esc_html( WP_TRAVEL_ENGINE_VERSION ); ?></span>
			<button type="button" class="wte-dbg-theme-toggle" title="<?php esc_attr_e( 'Toggle dark mode', 'wptravelengine-devzone' ); ?>">
				<span class="wte-dbg-theme-icon">&#9728;</span>
			</button>
		</div>
	</div>

	<nav class="wte-dbg-tabs" role="tablist">
		<?php foreach ( $tabs as $slug => $label ) : ?>
			<a href="<?php echo esc_url( add_query_arg( [ 'page' => \WPTravelEngineDevZone\Admin::PAGE_SLUG, 'tab' => $slug ], admin_url( 'tools.php' ) ) ); ?>"
			   class="wte-dbg-tab <?php echo $active_tab === $slug ? 'is-active' : ''; ?>"
			   role="tab"
			   aria-selected="<?php echo $active_tab === $slug ? 'true' : 'false'; ?>">
				<?php echo esc_html( $label ); ?>
			</a>
		<?php endforeach; ?>
	</nav>

	<div class="wte-dbg-content" data-rendered-tab="<?php echo esc_attr( $active_tab ); ?>">
		<script>(function(){try{var s=localStorage.getItem('wte_dbg_tab');if(!s)return;var c=document.currentScript.parentElement.dataset.renderedTab||'settings';if(s===c)return;document.querySelectorAll('.wte-dbg-tab').forEach(function(t){var slug=new URL(t.href).searchParams.get('tab')||'settings';t.classList.toggle('is-active',slug===s);t.setAttribute('aria-selected',slug===s?'true':'false');});document.currentScript.parentElement.style.visibility='hidden';}catch(e){}}());</script>
		<?php
		$template_map = [
			'settings'  => WPTE_DEVZONE_DIR . 'templates/tab-overview.php',
			'trips'     => WPTE_DEVZONE_DIR . 'templates/tab-trips.php',
			'bookings'  => WPTE_DEVZONE_DIR . 'templates/tab-bookings.php',
			'payment'   => WPTE_DEVZONE_DIR . 'templates/tab-payments.php',
			'customers' => WPTE_DEVZONE_DIR . 'templates/tab-customers.php',
			'search'    => WPTE_DEVZONE_DIR . 'templates/tab-query.php',
		];

		if ( isset( $template_map[ $active_tab ] ) && file_exists( $template_map[ $active_tab ] ) ) {
			require $template_map[ $active_tab ];
		}
		?>
	</div>
</div>
