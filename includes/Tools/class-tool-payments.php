<?php

namespace WPTravelEngineDevZone\Tools;

defined( 'ABSPATH' ) || exit;

class ToolPayments extends AbstractPostTool {
	public function get_slug(): string      { return 'payments'; }
	public function get_label(): string     { return __( 'Payments', 'wptravelengine-devzone' ); }
	public function get_post_type(): string { return 'wte-payments'; }
	public function get_noun(): string      { return __( 'payment', 'wptravelengine-devzone' ); }
}
