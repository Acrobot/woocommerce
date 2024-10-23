<?php
declare( strict_types=1 );

namespace Automattic\WooCommerce\Internal\Orders;

use Automattic\WooCommerce\Internal\Traits\AccessiblePrivateMethods;
use Automattic\WooCommerce\Internal\RestApiControllerBase;
use WP_Error;
use WP_REST_Request;

/**
 * Controller for the REST endpoint to the send the order details emails to customers
 */
class OrderDetailsRestController extends RestApiControllerBase {
	use AccessiblePrivateMethods;

	/**
	 * Get the WooCommerce REST API namespace for the class.
	 *
	 * @return string
	 */
	protected function get_rest_api_namespace(): string {
		return 'order-details';
	}

	/**
	 * Register the REST API endpoints handled by this controller.
	 */
	public function register_routes() {
		register_rest_route(
			$this->route_namespace,
			'/orders/(?P<id>[\d]+)/details',
			array(
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => fn( $request ) => $this->run( $request, 'send_order_details' ),
					'permission_callback' => fn( $request ) => $this->check_permissions( $request ),
					'args'                => $this->get_args_for_send_order_details(),
					'schema'              => $this->get_schema_for_send_order_details(),
				),
			)
		);
	}

	/**
	 * Permission check for REST API endpoint.
	 *
	 * @param WP_REST_Request $request The request for which the permission is checked.
	 * @return bool|WP_Error True if the current user has the capability, otherwise a WP_Error object.
	 */
	private function check_permissions( WP_REST_Request $request ) {
		$order_id = $request->get_param( 'id' );
		$order    = wc_get_order( $order_id );

		if ( ! $order ) {
			return new WP_Error( 'woocommerce_rest_not_found', __( 'Order not found', 'woocommerce' ), array( 'status' => 404 ) );
		}

		return $this->check_permission( $request, 'read_shop_order', $order_id );
	}

	/**
	 * Get the accepted arguments for the POST request.
	 *
	 * @return array[]
	 */
	private function get_args_for_send_order_details(): array {
		return array(
			'id' => array(
				'description' => __( 'Unique identifier of the order.', 'woocommerce' ),
				'type'        => 'integer',
				'context'     => array( 'view', 'edit' ),
				'readonly'    => true,
			),
		);
	}

	/**
	 * Get the schema for both the GET and the POST requests.
	 *
	 * @return array[]
	 */
	private function get_schema_for_send_order_details(): array {
		$schema['properties'] = array(
			'message' => array(
				'description' => __( 'A message indication whether the email was sent.', 'woocommerce' ),
				'type'        => 'string',
				'context'     => array( 'view', 'edit' ),
				'readonly'    => true,
			),
		);
		return $schema;
	}

	/**
	 * Handle the POST /orders/{id}/details.
	 *
	 * Sends the order details email to the customer.
	 *
	 * @param WP_REST_Request $request The received request.
	 * @return array|WP_Error Request response or an error.
	 */
	public function send_order_details( WP_REST_Request $request ) {
		$order_id = $request->get_param( 'id' );
		$order    = wc_get_order( $order_id );
		if ( ! $order ) {
			return new WP_Error( 'invalid_order', __( 'Invalid order ID.', 'woocommerce' ), array( 'status' => 404 ) );
		}

		// phpcs:disable WooCommerce.Commenting.CommentHooks.MissingSinceComment
		/** This action is documented in includes/admin/meta-boxes/class-wc-meta-box-order-actions.php */
		do_action( 'woocommerce_before_resend_order_emails', $order, 'customer_invoice' );

		WC()->mailer()->customer_invoice( $order );

		$order->add_order_note( __( 'Order details sent to customer via REST API.', 'woocommerce' ), false, true );

		// phpcs:disable WooCommerce.Commenting.CommentHooks.MissingSinceComment
		/** This action is documented in includes/admin/meta-boxes/class-wc-meta-box-order-actions.php */
		do_action( 'woocommerce_after_resend_order_email', $order, 'customer_invoice' );

		return array(
			'message' => __( 'Order details email sent to customer.', 'woocommerce' ),
		);
	}
}
