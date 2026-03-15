<?php

namespace WPTravelEngineDevZone\Tools;

defined( 'ABSPATH' ) || exit;

class ToolCustomers extends AbstractPostTool {
	public function get_slug(): string      { return 'customers'; }
	public function get_label(): string     { return __( 'Customers', 'wptravelengine-devzone' ); }
	public function get_post_type(): string { return 'customer'; }
	public function get_noun(): string      { return __( 'customer', 'wptravelengine-devzone' ); }
}
