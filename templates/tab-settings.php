<?php
defined( 'ABSPATH' ) || exit;

global $wpdb;

// Load only option names — values are fetched on-demand via AJAX.
$option_names = $wpdb->get_col(
	"SELECT option_name FROM {$wpdb->options}
	 WHERE option_name LIKE 'wp_travel_engine_%'
	    OR option_name LIKE 'wptravelengine_%'
		OR option_name LIKE 'wpte_%'
	 ORDER BY option_name ASC"
);

// Options to highlight first (most important)
$priority_options = [
	'wp_travel_engine_settings',
	'wp_travel_engine_permalinks',
	'wptravelengine_logger_settings',
];

// Re-order: priority first, then the rest alphabetically
$ordered = [];
foreach ( $priority_options as $name ) {
	if ( in_array( $name, $option_names, true ) ) {
		$ordered[] = $name;
	}
}
foreach ( $option_names as $name ) {
	if ( ! in_array( $name, $ordered, true ) ) {
		$ordered[] = $name;
	}
}

// Taxonomies registered to WTE post types
$wte_post_types = [ 'trip', 'booking', 'wte-payments', 'customer' ];
$seen_taxs      = [];
foreach ( $wte_post_types as $pt ) {
	foreach ( get_object_taxonomies( $pt, 'objects' ) as $tax ) {
		$seen_taxs[ $tax->name ] = $tax;
	}
}
if ( taxonomy_exists( 'trip-packages-categories' ) ) {
	$seen_taxs['trip-packages-categories'] = get_taxonomy( 'trip-packages-categories' );
}
ksort( $seen_taxs );

// Price categories
$price_terms    = get_terms( [ 'taxonomy' => 'trip-packages-categories', 'hide_empty' => false, 'orderby' => 'term_id' ] );
$primary_cat_id = (int) get_option( 'primary_pricing_category', 0 );
?>

<div class="wte-dbg-settings-tab">

	<!-- ── Section 1: Price Categories ───────────────────────────────────── -->
	<div class="wte-dbg-section">
		<div class="wte-dbg-section-header">
			<?php esc_html_e( 'Price Categories', 'wptravelengine-devzone' ); ?>
			<?php if ( is_array( $price_terms ) && ! is_wp_error( $price_terms ) ) : ?>
				<span class="wte-dbg-count-badge"><?php echo esc_html( count( $price_terms ) ); ?> categories</span>
			<?php endif; ?>
		</div>
		<div class="wte-dbg-section-body">
			<?php if ( is_wp_error( $price_terms ) || empty( $price_terms ) ) : ?>
				<p class="wte-dbg-empty"><?php esc_html_e( 'No price categories found.', 'wptravelengine-devzone' ); ?></p>
			<?php else : ?>
				<table class="wte-dbg-price-cat-table">
					<thead>
						<tr>
							<th><?php esc_html_e( 'Primary', 'wptravelengine-devzone' ); ?></th>
							<th><?php esc_html_e( 'ID', 'wptravelengine-devzone' ); ?></th>
							<th><?php esc_html_e( 'Label', 'wptravelengine-devzone' ); ?></th>
							<th><?php esc_html_e( 'Slug', 'wptravelengine-devzone' ); ?></th>
							<th><?php esc_html_e( 'Age Group', 'wptravelengine-devzone' ); ?></th>
							<th><?php esc_html_e( 'Usage', 'wptravelengine-devzone' ); ?></th>
						</tr>
					</thead>
					<tbody>
						<?php foreach ( $price_terms as $term ) : ?>
							<tr>
								<td>
									<?php if ( $term->term_id === $primary_cat_id ) : ?>
										<span class="wte-dbg-price-cat-primary" title="<?php esc_attr_e( 'Primary category', 'wptravelengine-devzone' ); ?>">&#9733;</span>
									<?php endif; ?>
								</td>
								<td><?php echo esc_html( $term->term_id ); ?></td>
								<td><?php echo esc_html( $term->name ); ?></td>
								<td><?php echo esc_html( $term->slug ); ?></td>
								<td>
									<?php
									$age_group = get_term_meta( $term->term_id, 'age_group', true );
									echo esc_html( '' !== $age_group ? $age_group : '—' );
									?>
								</td>
								<td><?php echo esc_html( $term->count ); ?></td>
							</tr>
						<?php endforeach; ?>
					</tbody>
				</table>
			<?php endif; ?>
		</div>
	</div>

	<!-- ── Section 2: Taxonomies ──────────────────────────────────────────── -->
	<div class="wte-dbg-section">
		<div class="wte-dbg-section-header">
			<?php esc_html_e( 'Taxonomies', 'wptravelengine-devzone' ); ?>
			<span class="wte-dbg-count-badge"><?php echo esc_html( count( $seen_taxs ) ); ?> taxonomies</span>
		</div>
		<div class="wte-dbg-section-body">
			<?php if ( empty( $seen_taxs ) ) : ?>
				<p class="wte-dbg-empty"><?php esc_html_e( 'No taxonomies found.', 'wptravelengine-devzone' ); ?></p>
			<?php else : ?>
				<div class="wte-dbg-settings-tree">
					<?php foreach ( $seen_taxs as $tax_name => $tax ) : ?>
						<?php
						$tax_terms  = get_terms( [ 'taxonomy' => $tax_name, 'hide_empty' => false, 'orderby' => 'term_id' ] );
						$term_count = ( is_array( $tax_terms ) && ! is_wp_error( $tax_terms ) ) ? count( $tax_terms ) : 0;
						?>
						<div class="wte-dbg-option-block">
							<details>
								<summary class="wte-dbg-option-name">
									<?php echo esc_html( $tax->label ); ?>
									<span class="wte-dbg-count-badge"><?php echo esc_html( $tax_name ); ?></span>
									<span class="wte-dbg-count-badge"><?php echo esc_html( $term_count ); ?> terms</span>
								</summary>
								<div class="wte-dbg-option-body" style="padding:0;">
									<?php if ( $term_count > 0 ) : ?>
										<table class="wte-dbg-tax-terms-table">
											<thead>
												<tr>
													<th><?php esc_html_e( 'ID', 'wptravelengine-devzone' ); ?></th>
													<th><?php esc_html_e( 'Name', 'wptravelengine-devzone' ); ?></th>
													<th><?php esc_html_e( 'Slug', 'wptravelengine-devzone' ); ?></th>
													<th><?php esc_html_e( 'Count', 'wptravelengine-devzone' ); ?></th>
												</tr>
											</thead>
											<tbody>
												<?php foreach ( $tax_terms as $term ) : ?>
													<tr>
														<td><?php echo esc_html( $term->term_id ); ?></td>
														<td><?php echo esc_html( $term->name ); ?></td>
														<td><?php echo esc_html( $term->slug ); ?></td>
														<td><?php echo esc_html( $term->count ); ?></td>
													</tr>
												<?php endforeach; ?>
											</tbody>
										</table>
									<?php else : ?>
										<p class="wte-dbg-empty"><?php esc_html_e( 'No terms found.', 'wptravelengine-devzone' ); ?></p>
									<?php endif; ?>
								</div>
							</details>
						</div>
					<?php endforeach; ?>
				</div>
			<?php endif; ?>
		</div>
	</div>

	<!-- ── Section 3: Options ─────────────────────────────────────────────── -->
	<div class="wte-dbg-section">
		<div class="wte-dbg-section-header">
			<?php esc_html_e( 'Options', 'wptravelengine-devzone' ); ?>
			<span class="wte-dbg-count-badge"><?php echo esc_html( count( $ordered ) ); ?> options</span>
		</div>
		<div class="wte-dbg-section-body">
			<p class="wte-dbg-help">
				<?php esc_html_e( 'All WP Travel Engine options from the database.', 'wptravelengine-devzone' ); ?>
			</p>
			<!-- JS injects search input here (existing behaviour via initSettingsTree) -->
			<div class="wte-dbg-settings-tree wte-dbg-options-tree">
				<?php foreach ( $ordered as $option_name ) : ?>
					<div class="wte-dbg-option-block">
						<details class="wte-dbg-option-root" data-option-name="<?php echo esc_attr( $option_name ); ?>">
							<summary class="wte-dbg-option-name">
								<?php echo esc_html( $option_name ); ?>
							</summary>
							<div class="wte-dbg-option-body wte-dbg-lazy"></div>
						</details>
						<button class="wte-dbg-delete-option-btn"
							data-option-name="<?php echo esc_attr( $option_name ); ?>"
							title="<?php esc_attr_e( 'Delete option', 'wptravelengine-devzone' ); ?>">&#128465;</button>
					</div>
				<?php endforeach; ?>

				<?php if ( empty( $ordered ) ) : ?>
					<p class="wte-dbg-empty"><?php esc_html_e( 'No WP Travel Engine options found.', 'wptravelengine-devzone' ); ?></p>
				<?php endif; ?>
			</div>
			<div class="wte-dbg-options-pagination"></div>
		</div>
	</div>

</div>
