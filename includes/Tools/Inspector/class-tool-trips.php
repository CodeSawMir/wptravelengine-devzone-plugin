<?php

namespace WPTravelEngineDevZone\Tools\Inspector;

use WPTravelEngineDevZone\Tools\AbstractPostTool;

defined( 'ABSPATH' ) || exit;

class ToolTrips extends AbstractPostTool {
	public function get_slug(): string      { return 'trips'; }
	public function get_label(): string     { return __( 'Trips', 'wptravelengine-devzone' ); }
	public function get_post_type(): string { return 'trip'; }
	public function get_noun(): string      { return __( 'trip', 'wptravelengine-devzone' ); }

	public function get_relations( int $post_id, string $group, int $page ): array {
		$booking_query = new \WP_Query( [
			'post_type'        => 'booking',
			'post_status'      => array_keys( get_post_stati() ),
			'posts_per_page'   => 20,
			'paged'            => $page,
			'suppress_filters' => true,
			'meta_query'       => [
				[
					'key'     => 'cart_info',
					'value'   => 's:7:"trip_id";i:' . $post_id . ';',
					'compare' => 'LIKE',
				],
			],
		] );

		$relations = [
			'bookings' => [
				'items'       => array_map( [ $this, 'format_relation_post' ], $booking_query->posts ),
				'total'       => (int) $booking_query->found_posts,
				'total_pages' => (int) $booking_query->max_num_pages,
				'page'        => $page,
			],
		];

		if ( $group && isset( $relations[ $group ] ) ) {
			return [ $group => $relations[ $group ] ];
		}
		return $relations;
	}
}
