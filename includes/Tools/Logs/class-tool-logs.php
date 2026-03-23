<?php

namespace WPTravelEngineDevZone\Tools\Logs;

use WPTravelEngineDevZone\Tools\AbstractTool;

defined( 'ABSPATH' ) || exit;

class ToolLogs extends AbstractTool {

	public function get_slug(): string     { return 'logs'; }
	public function get_label(): string    { return __( 'Logs', 'wptravelengine-devzone' ); }
	public function get_template(): string { return WPTE_DEVZONE_DIR . 'templates/tab-logs.php'; }
}
