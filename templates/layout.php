<?php
/**
 * Dev Zone admin page shell.
 *
 * Variables provided by Admin::render_page():
 *   $tools       AbstractTool[]  All registered tools (tab order).
 *   $active_tool AbstractTool    The currently active tool.
 */
defined( 'ABSPATH' ) || exit;

$active_slug = $active_tool->get_slug();
?>
<div class="wrap wte-devzone-wrap">
<script>(function(){try{if(localStorage.getItem('wte_dbg_theme')==='dark'){document.currentScript.parentElement.classList.add('wte-dbg-dark');document.body.classList.add('wte-dbg-page-dark');}}catch(e){}}());</script>
<script>(function(){try{var k='wte_dbg_brand_animated';if(!sessionStorage.getItem(k)){sessionStorage.setItem(k,'1');document.addEventListener('DOMContentLoaded',function(){var el=document.querySelector('.wte-dbg-header-brand-link');if(el){el.classList.add('wte-dbg-brand-animate');}});}}catch(e){}}());</script>
	<div class="wte-dbg-header">
		<div class="wte-dbg-header-brand">
			<a class="wte-dbg-header-brand-link" href="<?php echo esc_url( add_query_arg( [ 'page' => \WPTravelEngineDevZone\Admin::PAGE_SLUG ], admin_url( 'tools.php' ) ) ); ?>">
				<svg class="wte-dbg-header-icon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="orange">
					<path d="M20 8h-2.81A6 6 0 0 0 6.81 8H4a1 1 0 0 0 0 2h2v1a8 8 0 0 0 .07 1H4a1 1 0 0 0 0 2h2.64A6 6 0 0 0 18 14v-1h2a1 1 0 0 0 0-2h-2.07A8 8 0 0 0 18 11v-1h2a1 1 0 0 0 0-2zM9 7.5a3 3 0 0 1 6 0H9zm3 10.5a4 4 0 0 1-4-4v-3h8v3a4 4 0 0 1-4 4zm-1-6v2h2v-2h-2z"/>
					<circle cx="9" cy="3" r="1.5"/>
					<circle cx="15" cy="3" r="1.5"/>
				</svg>
			<span class="wte-dbg-header-product"><?php esc_html_e( 'WP Travel Engine - Dev Zone', 'wptravelengine-devzone' ); ?></span>
			</a>
			<span class="wte-dbg-header-divider" aria-hidden="true"></span>
			<button type="button" class="wte-dbg-group-btn <?php echo ! in_array( $active_slug, [ 'logs', 'cron' ], true ) ? 'is-active' : ''; ?>" data-group="devzone">
				<?php esc_html_e( 'Inspector', 'wptravelengine-devzone' ); ?>
			</button>
			<span class="wte-dbg-header-divider" aria-hidden="true"></span>
			<button type="button" class="wte-dbg-group-btn <?php echo $active_slug === 'cron' ? 'is-active' : ''; ?>" data-group="cron">
				<?php esc_html_e( 'Cron', 'wptravelengine-devzone' ); ?>
			</button>
			<span class="wte-dbg-header-divider" aria-hidden="true"></span>
			<button type="button" class="wte-dbg-group-btn <?php echo $active_slug === 'logs' ? 'is-active' : ''; ?>" data-group="logs">
				<?php esc_html_e( 'Logs', 'wptravelengine-devzone' ); ?>
			</button>
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

	<nav class="wte-dbg-tabs wte-dbg-bar <?php echo in_array( $active_slug, [ 'logs', 'cron' ], true ) ? 'is-hidden' : ''; ?>" role="tablist">
		<?php foreach ( $tools as $tool ) : ?>
			<?php if ( in_array( $tool->get_slug(), [ 'logs', 'cron' ], true ) ) continue; ?>
			<?php $tab_url = $tool->get_tab_url() ?? add_query_arg( [ 'page' => \WPTravelEngineDevZone\Admin::PAGE_SLUG, 'tab' => $tool->get_slug() ], admin_url( 'tools.php' ) ); ?>
			<a href="<?php echo esc_url( $tab_url ); ?>"
			   class="wte-dbg-tab <?php echo $active_slug === $tool->get_slug() ? 'is-active' : ''; ?>"
			   role="tab"
			   aria-selected="<?php echo $active_slug === $tool->get_slug() ? 'true' : 'false'; ?>"
			   <?php if ( null !== $tool->get_tab_url() ) : ?>data-page-nav="1"<?php endif; ?>>
				<?php echo esc_html( $tool->get_label() ); ?>
			</a>
		<?php endforeach; ?>
		<div class="wte-dbg-status-note-wrap" id="wte-dbg-status-note" aria-live="polite" aria-atomic="true">
			<span class="wte-dbg-loader-note"></span>
		</div>
		<button type="button" class="wte-dbg-back-btn" title="<?php esc_attr_e( 'Go back', 'wptravelengine-devzone' ); ?>">&#8592; <?php esc_html_e( 'Back', 'wptravelengine-devzone' ); ?></button>
	</nav>

	<div class="wte-dbg-content" data-rendered-tab="<?php echo esc_attr( $active_slug ); ?>">
		<script>(function(){try{var s=localStorage.getItem('wte_dbg_tab');if(!s)return;var c=document.currentScript.parentElement.dataset.renderedTab||'overview';if(s===c)return;document.querySelectorAll('.wte-dbg-tab').forEach(function(t){var slug=new URL(t.href).searchParams.get('tab')||'overview';t.classList.toggle('is-active',slug===s);t.setAttribute('aria-selected',slug===s?'true':'false');});document.currentScript.parentElement.style.visibility='hidden';}catch(e){}}());</script>
		<?php
		$tool     = $active_tool;
		$template = $active_tool->get_template();
		if ( file_exists( $template ) ) {
			require $template;
		}
		?>
	</div>

</div>
