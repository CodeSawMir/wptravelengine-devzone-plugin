<?php

namespace WPTravelEngineDevZone\Tools;

use WPTravelEngineDevZone\Traits\PostQueryTrait;

defined( 'ABSPATH' ) || exit;

/**
 * Base class for tools that display WP post types in a master-detail layout.
 *
 * Concrete implementations must declare their slug, label, post type, and
 * the relations that should appear in the detail sidebar (get_relations()).
 */
abstract class AbstractPostTool extends AbstractTool {

	use PostQueryTrait;

	/** The WP post type slug this tool manages (e.g. 'trip', 'booking'). */
	abstract public function get_post_type(): string;

	/**
	 * Return the related entities for a given post.
	 *
	 * The return value is a map of group keys to paginated result arrays:
	 *   [ 'bookings' => [ 'items' => [...], 'total' => N, 'total_pages' => M, 'page' => P ] ]
	 *
	 * When $group is non-empty, return only that group's data.
	 */
	abstract public function get_relations( int $post_id, string $group, int $page ): array;

	/**
	 * Singular noun used for placeholder text (defaults to the tab label).
	 * Override for a more natural string, e.g. 'booking' instead of 'Bookings'.
	 */
	public function get_noun(): string {
		return $this->get_label();
	}

	/** All post tools share a single template. */
	final public function get_template(): string {
		return WPTE_DEVZONE_DIR . 'templates/tab-post-master-detail.php';
	}
}
