<?php

namespace WPTravelEngineDevZone\Tools;

defined( 'ABSPATH' ) || exit;

/**
 * Base class for all Dev Zone tool tabs.
 *
 * To add a new tool:
 *  1. Extend this class (or AbstractPostTool) and implement the three abstract methods.
 *  2. Create a template file and return its path from get_template().
 *  3. Add `new Tools\YourTool()` to the array in Plugin::boot().
 */
abstract class AbstractTool {

	/** The ?tab= URL param value (must be a valid slug). */
	abstract public function get_slug(): string;

	/** Tab navigation label shown to the user. */
	abstract public function get_label(): string;

	/** Absolute filesystem path to the PHP template for this tab. */
	abstract public function get_template(): string;

	/** Override to redirect the tab link to an external admin URL instead of this page. */
	public function get_tab_url(): ?string { return null; }

	/** Override to true to do a full-page load for this tab (needed for WP_List_Table). */
	public function use_page_navigation(): bool { return false; }

	/** Override to register wp_ajax_ hooks for this tool. */
	public function register_ajax(): void {}

	/** Override to enqueue CSS/JS specific to this tool. Called only on the Dev Zone page. */
	public function enqueue_assets(): void {}
}
