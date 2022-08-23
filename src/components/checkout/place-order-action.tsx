import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import isEmpty from 'lodash/isEmpty';
import classNames from 'classnames';
import { useCreateOrder, useOrderStatuses } from '@/framework/order';
import ValidationError from '@/components/ui/validation-error';
import Button from '@/components/ui/button';
import { formatOrderedProduct } from '@/lib/format-ordered-product';
import { useCart } from '@/store/quick-cart/cart.context';
import { checkoutAtom, discountAtom, walletAtom } from '@/store/checkout';
import {
  calculatePaidTotal,
  calculateTotal,
} from '@/store/quick-cart/cart.utils';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import { useLocalStorage } from '@/lib/use-local-storage';

export const PlaceOrderAction: React.FC<{ className?: string }> = (props) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { createOrder, isLoading } = useCreateOrder();
  const router = useRouter();

  const { orderStatuses } = useOrderStatuses({
    limit: 1,
  });

  const { items } = useCart();
  const [
    {
      billing_address,
      shipping_address,
      delivery_time,
      coupon,
      verified_response,
      customer_contact,
      payment_gateway,
      token,
    },
  ] = useAtom(checkoutAtom);
  const [discount] = useAtom(discountAtom);
  const [use_wallet_points] = useAtom(walletAtom);
  const [saved_access_key, saveAccessKey] =
    useLocalStorage<string>('access_key');
  const [saved_secret_key, saveSecretKey] =
    useLocalStorage<string>('secret_key');
  const [saved_currency, saveCurrency] = useLocalStorage<string>('currency');

  useEffect(() => {
    setErrorMessage(null);
  }, [payment_gateway]);

  const available_items = items?.filter(
    (item) => !verified_response?.unavailable_products?.includes(item.id)
  );

  const subtotal = calculateTotal(available_items);
  const total = calculatePaidTotal(
    {
      totalAmount: subtotal,
      tax: verified_response?.total_tax!,
      shipping_charge: verified_response?.shipping_charge!,
    },
    Number(discount)
  );

  const handlePlaceOrder = async () => {
    if (!customer_contact) {
      setErrorMessage('Contact Number Is Required');
      return;
    }
    if (!use_wallet_points && !payment_gateway) {
      setErrorMessage('Gateway Is Required');
      return;
    }
    // if (!use_wallet_points && payment_gateway === 'STRIPE' && !token) {
    //   setErrorMessage('Please Pay First');
    //   return;
    // }
    let input = {
      //@ts-ignore
      products: available_items?.map((item) => formatOrderedProduct(item)),
      status: orderStatuses[0]?.id ?? '1',
      amount: subtotal,
      coupon_id: Number(coupon?.id),
      discount: discount ?? 0,
      paid_total: total,
      sales_tax: verified_response?.total_tax,
      delivery_fee: verified_response?.shipping_charge,
      total,
      delivery_time: delivery_time?.title,
      customer_contact,
      payment_gateway,
      use_wallet_points,
      billing_address: {
        ...(billing_address?.address && billing_address.address),
      },
      shipping_address: {
        ...(shipping_address?.address && shipping_address.address),
      },
    };
    if (payment_gateway === 'FINMO_CHECKOUT') {
      //@ts-ignore
      const access_key = saved_access_key;
      const secret_key = saved_secret_key;
      if (!access_key && !secret_key) {
        toast.error('FINMO ACCESS KEY and SECRET KEY is required');
        return;
      }

      const auth_string: string = window.btoa(`${access_key}:${secret_key}`);
      const auth_token: string = `Basic ${auth_string}`;
      const currency_country_map: any = {
        PHP: 'PH',
        AUD: 'AU',
      };

      const currency_data: string = saved_currency || 'AUD';
      const checkout_data = {
        amount: input.paid_total,
        amount_breakdown: {
          'Sub Total': input.amount,
          'Shipping Charge': input.delivery_fee,
          Tax: input.sales_tax,
          Discount: -input.discount,
        },
        currency: currency_data,
        country: currency_country_map[currency_data],
        redirect_url: 'http://127.0.0.1:3004/thankyou',
      };

      try {
        const {
          data: { data: response },
        } = await axios.post(
          'https://api.qafinmo.net/v1/checkout',
          checkout_data,
          {
            headers: {
              Authorization: auth_token,
              'x-env': 'sandbox',
              'Content-Type': 'application/json',
            },
          }
        );

        const { checkout_url } = response;
        router.push(checkout_url);
      } catch (error) {
        const apiErrorMessage = (error: any) => {
          if (
            Array.isArray(
              error?.response && error?.response?.data?.error?.message
            )
          ) {
            const message =
              error?.response && error?.response?.data?.error?.message;
            return message.join(' , ');
          } else if (error?.response && error?.response?.data?.message) {
          } else {
            return error?.response && error?.response?.data?.error
              ? error?.response?.data?.error?.message
              : error?.message;
          }
        };
        toast.error(apiErrorMessage(error));
      }
    }

    // delete input.billing_address.__typename;
    // delete input.shipping_address.__typename;
    // //@ts-ignore
    // createOrder(input);
  };
  const isDigitalCheckout = available_items.find((item) =>
    Boolean(item.is_digital)
  );

  const formatRequiredFields = isDigitalCheckout
    ? [customer_contact, payment_gateway, available_items]
    : [
        customer_contact,
        payment_gateway,
        billing_address,
        shipping_address,
        delivery_time,
        available_items,
      ];
  const isAllRequiredFieldSelected = formatRequiredFields.every(
    (item) => !isEmpty(item)
  );
  return (
    <>
      <Button
        loading={isLoading}
        className={classNames('mt-5 w-full', props.className)}
        onClick={async () => await handlePlaceOrder()}
        disabled={!isAllRequiredFieldSelected}
        {...props}
      />
      {errorMessage && (
        <div className="mt-3">
          <ValidationError message={errorMessage} />
        </div>
      )}
    </>
  );
};
