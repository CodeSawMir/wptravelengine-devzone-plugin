# WP Travel Engine — Dev Zone

> **For development and debugging purposes only. Do not use on production sites.**

A visual database inspector for [WP Travel Engine](https://wptravelengine.com/) that lets you diagnose and inspect trip, booking, payment, and customer data directly from WP Admin — without touching phpMyAdmin or writing raw SQL queries.

## Intent

This plugin is being developed as an internal developer tool to support the WP Travel Engine team during active development and debugging. The goal is to provide a quick, centralized admin interface to inspect and search database records related to WP Travel Engine — covering trips, bookings, payments, customers, and raw DB queries — all without leaving the WordPress dashboard.

## Requirements

- WordPress 6.9+
- PHP 7.4+
- [WP Travel Engine](https://wptravelengine.com/) plugin (active)

## Installation

Since this plugin is not listed on the WordPress plugin directory, install it directly from this repository:

1. Click **Code → Download ZIP** on this page
2. In your WordPress admin, navigate to **Plugins → Add New → Upload Plugin**
3. Choose the downloaded `.zip` file and click **Install Now**
4. Click **Activate Plugin**

Once activated, navigate to **Tools → Dev Zone** in WP Admin.

## Tabs

| Tab | Description |
|-----|-------------|
| Overview | WP Travel Engine price categories, registered taxonomies with their terms, and all WTE-related options stored in the database |
| Trips | Browse and inspect all trip post data |
| Bookings | View booking records and their metadata |
| Payments | Inspect payment entries linked to bookings |
| Customers | View customer records |
| Logs | Browse the WordPress debug log with live-reload and line count |
| Query | Full table browser — select any DB table, apply column filters, paginate results, and copy cell values with a single click |

## Query Tab

The Query tab is a full interactive database browser:

- **Table list** — left sidebar lists all DB tables grouped by WP Travel Engine, WordPress core, and Other; filterable by name; collapsible
- **Query builder** — select a table to load its columns, add one or more column filters (`=`, `!=`, `LIKE`, `IS NULL`, etc.), set a row limit, and run the query
- **Results table** — click any cell to copy its value to the clipboard
- **Pagination** — navigate large result sets in pages

### Beautifier sidebar

A collapsible, resizable panel on the right edge of the Query tab for parsing raw serialized data:

- Paste PHP-serialized strings, JSON, Base64-encoded data, `var_dump()` output, or URL query strings
- Click **Beautify** to decode and render as an interactive tree with type badges (`string`, `int`, `float`, `bool`, `null`)
- The input and result persist across tab switches and are cleared only on page reload
- The sidebar can be collapsed, drag-resized, or maximized to full screen

## UI

- **Dark mode** — toggle via the ☀ button in the header; preference is saved across sessions
- **Status bar** — live loading/error notices float in the tab bar
- **Inline editing** — metadata values can be edited directly in the Trips, Bookings, Payments, and Customers tabs

---

## Extending Dev Zone

Other plugins can add their own tabs, groups, and features to the Dev Zone without modifying this plugin.

---

### 1. Register a Tool Tab

The primary integration point. Create a class that extends `AbstractTool` and hook it in via `wpte_devzone_tools`.

```php
use WPTravelEngineDevZone\Tools\AbstractTool;

class MyPluginDevTool extends AbstractTool {

    public function get_slug(): string     { return 'my-plugin'; }
    public function get_label(): string    { return 'My Plugin'; }
    public function get_template(): string { return MY_PLUGIN_DIR . 'devzone/tab-my-plugin.php'; }

    public function register_ajax(): void {
        add_action( 'wp_ajax_my_plugin_devzone_data', [ $this, 'ajax_data' ] );
    }

    public function enqueue_assets(): void {
        wp_enqueue_script( 'my-plugin-devzone', MY_PLUGIN_URL . 'devzone/tab.js', [ 'wpte-devzone' ], '1.0', true );
    }

    public function ajax_data(): void {
        \WPTravelEngineDevZone\Admin::verify_request(); // nonce + manage_options check
        wp_send_json_success( [ 'items' => [] ] );
    }
}

add_filter( 'wpte_devzone_tools', function ( array $tools ): array {
    $tools[] = new MyPluginDevTool();
    return $tools;
} );
```

The template file (`tab-my-plugin.php`) receives no variables by default — fetch data via AJAX inside the template's JS, or query directly in PHP using `$wpdb`.

---

### 2. Add Navigation Groups and Subtabs

Use `wpte_devzone_tabs` to register new group buttons and their subtab structure. The shape mirrors the built-in `get_tabs()` output.

```php
add_filter( 'wpte_devzone_tabs', function ( array $tabs ): array {

    // Simple group — single tab, no subtabs.
    $tabs['my-plugin'] = __( 'My Plugin', 'my-plugin' );

    // Group with subtabs.
    $tabs['my-plugin'] = [
        'title'   => __( 'My Plugin', 'my-plugin' ),
        'subtabs' => [
            'overview' => __( 'Overview', 'my-plugin' ),
            'settings' => __( 'Settings', 'my-plugin' ),
            'advanced' => [
                'title'  => __( 'Advanced', 'my-plugin' ),
                'on_dev' => true, // hidden unless hot-features mode is on
            ],
        ],
    ];

    return $tabs;
} );
```

Each key in `$tabs` maps to a group button slug in the header. Subtabs appear in the tab navigation bar when that group is active.

**Supported entry shapes:**

| Shape | Meaning |
|---|---|
| `'slug' => 'Label'` | Simple group, single tab |
| `'slug' => [ 'title' => '...' ]` | Group with no subtabs |
| `'slug' => [ 'title' => '...', 'subtabs' => [...] ]` | Group with subtab nav |
| `'on_dev' => true` on group | Entire group hidden unless hot-features mode is on |
| `'on_dev' => true` on subtab | Only that subtab hidden in normal mode |

---

### 3. Register a Tab for Each Subtab

When a group has subtabs, register one `AbstractTool` per subtab slug:

```php
add_filter( 'wpte_devzone_tools', function ( array $tools ): array {
    $tools[] = new MyPluginOverviewTool(); // get_slug() === 'overview' must match subtab key
    $tools[] = new MyPluginSettingsTool(); // get_slug() === 'settings'
    return $tools;
} );
```

The slug returned by `get_slug()` must exactly match the subtab key in `wpte_devzone_tabs`.

---

### 4. Inject Header Buttons

Add extra controls to the right side of the header bar:

```php
add_action( 'wpte_devzone_header_buttons', function ( string $active_slug ): void {
    ?>
    <button type="button" class="wte-dbg-group-btn" data-group="my-plugin">
        <?php esc_html_e( 'My Plugin', 'my-plugin' ); ?>
    </button>
    <?php
} );
```

`$active_slug` is the currently active tab slug — use it to conditionally add `is-active` or render context-sensitive controls.

---

### 5. Mark Features as Hot-Features Only

Hot-features mode hides tabs and buttons marked `data-dev="1"`. There are two ways to gate content:

**Via `wpte_devzone_tabs`** (recommended) — set `'on_dev' => true` on any group or subtab entry (see §2).

**Via `wpte_devzone_dev_features`** — directly extend the derived map for custom slugs:

```php
add_filter( 'wpte_devzone_dev_features', function ( array $features ): array {
    // Gate an entire group.
    $features['my-plugin'] = '__all';

    // Gate specific subtabs within a group.
    $features['my-plugin'] = 'advanced,experimental';

    return $features;
} );
```

The JS reads `wpteDbg.devFeatures` and hides matching elements automatically.

---

### 6. JavaScript Integration

The `wpteDbg` global is available to all scripts that depend on `wpte-devzone`:

```js
const { ajaxurl, nonce } = wpteDbg;

// Make an authenticated AJAX request.
fetch( ajaxurl, {
    method: 'POST',
    body: new URLSearchParams( {
        action:      'my_plugin_devzone_data',
        _ajax_nonce: nonce,
    } ),
} ).then( r => r.json() ).then( res => {
    if ( res.success ) { /* render res.data */ }
} );

// Show a status message in the Dev Zone status bar.
window.wteDbgSetStatus( 'Loaded successfully', 'success' );
window.wteDbgSetStatus( 'Something failed', 'error' );
window.wteDbgClearStatus();
```

**`wpteDbg` keys:**

| Key | Type | Description |
|---|---|---|
| `ajaxurl` | `string` | WordPress AJAX endpoint |
| `nonce` | `string` | Security nonce (action: `wpte_devzone_nonce`) |
| `post_types` | `object` | `{ post_type: label }` for registered post tools |
| `devFeatures` | `object` | Hot-features map |
| `groupSubtabs` | `object` | `{ groupSlug: { subSlug: label } }` |

---

### 7. AJAX Tab Loading

When a user navigates to a tab, the JS fires a POST to `wpte_devzone_load_tab`. Dev Zone finds the matching tool by slug, renders its template via output buffering, and returns the HTML.

Your tool's `get_template()` path is all that is needed — no extra registration. Within the template you have full access to WordPress globals (`$wpdb`, etc.).

To verify the request inside any custom AJAX handler:

```php
\WPTravelEngineDevZone\Admin::verify_request();
// Checks: valid nonce (wpte_devzone_nonce) + current_user_can( 'manage_options' )
// On failure: sends wp_send_json_error( 'Forbidden', 403 ) and exits.
```

---

### Filter / Action Reference

| Hook | Type | Purpose |
|---|---|---|
| `wpte_devzone_tools` | Filter | Add `AbstractTool` instances |
| `wpte_devzone_tabs` | Filter | Add groups and subtabs to nav |
| `wpte_devzone_dev_features` | Filter | Gate tabs behind hot-features mode |
| `wpte_devzone_header_buttons` | Action | Inject header controls |
| `wpte_devzone_group_slugs` | Filter | Legacy — group slug array |
| `wpte_devzone_group_buttons` | Filter | Legacy — slug-to-title map |
| `wpte_devzone_cron_schedule_registry` | Filter | Register triggerable cron hooks in the Crontrol tab |

---

## Warning

This plugin is **solely intended for development and debugging use**. It exposes raw database content in the WP Admin and is not hardened for use on public or production environments. Keep it deactivated or uninstalled on any live site.
