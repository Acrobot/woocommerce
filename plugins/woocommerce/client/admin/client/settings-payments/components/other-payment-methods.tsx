/**
 * External dependencies
 */
import React, { useMemo } from '@wordpress/element';
import { Button, ExternalLink, Panel, PanelBody } from '@wordpress/components';
import {
	ONBOARDING_STORE_NAME,
	PAYMENT_GATEWAYS_STORE_NAME,
	SETTINGS_STORE_NAME,
} from '@woocommerce/data';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { getCountryCode } from '~/dashboard/utils';
import {
	getEnrichedPaymentGateways,
	getIsGatewayWCPay,
	getIsWCPayOrOtherCategoryDoneSetup,
	getSplitGateways,
} from '~/task-lists/fills/PaymentGatewaySuggestions/utils';

type PaymentGateway = {
	id: string;
	image_72x72: string;
	title: string;
	content: string;
	enabled: boolean;
	needsSetup: boolean;
	// Add other properties as needed...
};

const usePaymentGatewayData = () => {
	return useSelect( ( select ) => {
		const { getSettings } = select( SETTINGS_STORE_NAME );
		const { general: settings = {} } = getSettings( 'general' );
		return {
			getPaymentGateway: select( PAYMENT_GATEWAYS_STORE_NAME )
				.getPaymentGateway,
			installedPaymentGateways: select(
				PAYMENT_GATEWAYS_STORE_NAME
			).getPaymentGateways(),
			isResolving: select( ONBOARDING_STORE_NAME ).isResolving(
				'getPaymentGatewaySuggestions'
			),
			paymentGatewaySuggestions: select(
				ONBOARDING_STORE_NAME
			).getPaymentGatewaySuggestions(),
			countryCode: getCountryCode( settings.woocommerce_default_country ),
		};
	}, [] );
};

// TODO implement gateway images.
// const AdditionalGatewayImages = ( {
// 	additionalGateways,
// }: {
// 	additionalGateways: PaymentGateway[];
// } ) => (
// 	<>
// 		{ additionalGateways.map( ( gateway ) => (
// 			<img
// 				key={ gateway.id }
// 				src={ gateway.image_72x72 }
// 				alt={ gateway.title }
// 				width="24"
// 				height="24"
// 				className="other-payment-methods__image"
// 			/>
// 		) ) }
// 		{ _x( '& more.', 'More payment providers to discover', 'woocommerce' ) }
// 	</>
// );

export const OtherPaymentMethods = () => {
	// Mock other payment methods for now.
	// TODO Get the list of plugins via the API in future PR.
	const mockOtherPaymentMethods = [
		{
			id: 'amazon-pay',
			title: 'Amazon Pay',
			content:
				'Enable a familiar, fast checkout for hundreds of millions of active Amazon customers globally.',
			image_72x72:
				'https://woocommerce.com/wp-content/plugins/wccom-plugins/payment-gateway-suggestions/images/72x72/paypal.png',
			enabled: false,
			needsSetup: false,
		},
		{
			id: 'affirm',
			title: 'Affirm Payments',
			content:
				"Safe and secure payments using credit cards or your customer's PayPal account.",
			image_72x72:
				'https://woocommerce.com/wp-content/plugins/wccom-plugins/payment-gateway-suggestions/images/72x72/paypal.png',
			enabled: false,
			needsSetup: false,
		},
		{
			id: 'afterpay',
			title: 'Afterpay',
			content:
				'Afterpay allows customers to purchase products and choose to pay in four installments over six weeks or pay monthly.',
			image_72x72:
				'https://woocommerce.com/wp-content/plugins/wccom-plugins/payment-gateway-suggestions/images/72x72/paypal.png',
			enabled: false,
			needsSetup: false,
		},
		{
			id: 'klarna',
			title: 'Klarna Payments',
			content:
				'Grow your business for increased sales and enhanced shopping experiences at no extra cost.',
			image_72x72:
				'https://woocommerce.com/wp-content/plugins/wccom-plugins/payment-gateway-suggestions/images/72x72/paypal.png',
			enabled: false,
			needsSetup: false,
		},
	];

	const {
		paymentGatewaySuggestions,
		installedPaymentGateways,
		isResolving,
		countryCode,
	} = usePaymentGatewayData();

	const paymentGateways = useMemo(
		() =>
			getEnrichedPaymentGateways(
				installedPaymentGateways,
				paymentGatewaySuggestions
			),
		[ installedPaymentGateways, paymentGatewaySuggestions ]
	);

	const isWCPayOrOtherCategoryDoneSetup = useMemo(
		() =>
			getIsWCPayOrOtherCategoryDoneSetup( paymentGateways, countryCode ),
		[ countryCode, paymentGateways ]
	);

	const isWCPaySupported = Array.from( paymentGateways.values() ).some(
		getIsGatewayWCPay
	);

	// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
	const [ wcPayGateway, _offlineGateways, additionalGateways ] = useMemo(
		() =>
			getSplitGateways(
				paymentGateways,
				countryCode ?? '',
				isWCPaySupported,
				isWCPayOrOtherCategoryDoneSetup
			),
		[
			paymentGateways,
			countryCode,
			isWCPaySupported,
			isWCPayOrOtherCategoryDoneSetup,
		]
	);

	if ( isResolving || ! wcPayGateway ) {
		return null;
	}

	return (
		<Panel className="other-payment-methods">
			<PanelBody title="Other payment methods">
				<div className="other-payment-methods__grid">
					{ mockOtherPaymentMethods.map(
						( gateway: PaymentGateway ) => (
							<div
								className="other-payment-methods__grid-item"
								key={ gateway.id }
							>
								<img src={ gateway.image_72x72 } alt="" />
								<div className="other-payment-methods__grid-item__content">
									<span className="other-payment-methods__grid-item__content__title">
										{ gateway.title }
									</span>
									<span className="other-payment-methods__grid-item__content__description">
										{ gateway.content }
									</span>
									<div className="other-payment-methods__grid-item__content__actions">
										<Button variant={ 'primary' }>
											Install
										</Button>
									</div>
								</div>
							</div>
						)
					) }
				</div>
				<ExternalLink href="https://woocommerce.com/product-category/woocommerce-extensions/payment-gateways/">
					More payment options
				</ExternalLink>
			</PanelBody>
		</Panel>
	);
};