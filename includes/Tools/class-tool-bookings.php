<?php

namespace WPTravelEngineDevZone\Tools;

defined( 'ABSPATH' ) || exit;

class ToolBookings extends AbstractPostTool {
	public function get_slug(): string      { return 'bookings'; }
	public function get_label(): string     { return __( 'Bookings', 'wptravelengine-devzone' ); }
	public function get_post_type(): string { return 'booking'; }
	public function get_noun(): string      { return __( 'booking', 'wptravelengine-devzone' ); }
}
