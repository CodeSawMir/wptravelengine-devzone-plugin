<?php

namespace WPTravelEngineDevZone\Tools;

defined( 'ABSPATH' ) || exit;

/**
 * Base class for tools that display WP post types in a master-detail layout.
 *
 * Concrete implementations only need to declare their slug, label, and post type.
 * The shared template and all post AJAX endpoints are handled by AbstractPostTool
 * and SharedAjax respectively.
 */
abstract class AbstractPostTool extends AbstractTool {

	/** The WP post type slug this tool manages (e.g. 'trip', 'booking'). */
	abstract public function get_post_type(): string;

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
