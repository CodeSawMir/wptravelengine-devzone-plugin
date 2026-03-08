<?php

namespace WPTravelEngineDevZone\Tools;

defined( 'ABSPATH' ) || exit;

class ToolTrips extends AbstractPostTool {
	public function get_slug(): string      { return 'trips'; }
	public function get_label(): string     { return __( 'Trips', 'wptravelengine-devzone' ); }
	public function get_post_type(): string { return 'trip'; }
	public function get_noun(): string      { return __( 'trip', 'wptravelengine-devzone' ); }
}
