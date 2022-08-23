import { useTranslation } from 'next-i18next';
import { billingAddressAtom, shippingAddressAtom } from '@/store/checkout';
import dynamic from 'next/dynamic';
import { getLayout } from '@/components/layouts/layout';
import { AddressType } from '@/framework/utils/constants';
import ContentLoader from 'react-content-loader';
import Seo from '@/components/seo/seo';
import Link from '@/components/ui/link';
import { ROUTES } from '@/lib/routes';
import { useUser } from '@/framework/user';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import Badge from '@/components/ui/badge';
import dayjs from 'dayjs';
import Spinner from '@/components/ui/loaders/spinner/spinner';
import ThankyouPageView from './thank-page-view';
import { useCart } from '@/store/quick-cart/cart.context';
import { useAtom } from 'jotai';
export { getStaticProps } from '@/framework/general.ssr';
import { clearCheckoutAtom } from '@/store/checkout';

export default function ThankyouPage() {
  const router = useRouter();
  const { resetCart } = useCart();
  const [, resetCheckout] = useAtom(clearCheckoutAtom);
  const [checkout_data, setCheckoutData] = useState<any>({});
  const [fetch_data, setFetchData] = useState(true);
  const {
    query: { checkout_id, status },
  } = router;

  const getCheckoutData = useCallback(async () => {
    const access_key = localStorage.getItem('access_key');
    const secret_key = localStorage.getItem('secret_key');
    if (!access_key && !secret_key) {
      toast.error('FINMO ACCESS KEY and SECRET KEY is required');
      return;
    }

    const auth_string: string = window.btoa(`${access_key}:${secret_key}`);
    const auth_token: string = `Basic ${auth_string}`;

    const {
      data: { data: checkout_data },
    } = await axios.get(`https://api.qafinmo.net/v1/checkout/${checkout_id}`, {
      headers: {
        Authorization: auth_token,
        'x-env': 'sandbox',
        'Content-Type': 'application/json',
      },
    });
    if (
      checkout_data?.status !== 'CANCELLED' ||
      checkout_data?.status !== 'FAILED'
    ) {
      resetCart();
      resetCheckout();
    }
    setCheckoutData(checkout_data);

    setFetchData(false);
  }, [checkout_id]);

  useEffect(() => {
    const {
      query: { checkout_id, status },
    } = router;
    if (checkout_id) {
      getCheckoutData();
    }
  }, [getCheckoutData]);

  return (
    <>
      <Seo noindex={true} nofollow={true} />
      {
        fetch_data ? (
          <Spinner />
        ) : (
          <ThankyouPageView checkout_data={checkout_data} />
        )
        // : (
        //     <div className="p-4 sm:p-8">
        //       <div className="mx-auto w-full max-w-screen-lg rounded border bg-light p-6 shadow-sm sm:p-8 lg:p-12">
        //         <h3 className="mb-8 text-center text-2xl font-bold text-heading">
        //           Thank you
        //         </h3>
        //         <h2 className="mb-9 flex flex-col items-center justify-between text-base font-bold text-heading sm:mb-12 sm:flex-row">
        //           <span className="order-2 mt-5 ltr:mr-auto rtl:ml-auto sm:order-1 sm:mt-0">
        //             <span className="ltr:mr-4 rtl:ml-4">Status :</span>
        //             <Badge
        //               text={checkout_data?.status}
        //               className="whitespace-nowrap text-sm font-normal"
        //             />
        //           </span>
        //           <Link
        //             href={ROUTES.HOME}
        //             className="order-1 inline-flex items-center text-base font-normal text-accent underline hover:text-accent-hover hover:no-underline sm:order-2"
        //           >
        //             Back to Home
        //           </Link>
        //         </h2>

        //         <div className="mb-6 grid gap-4 sm:grid-cols-2 md:mb-12 lg:grid-cols-4">
        //           <div className="break-all rounded border border-border-200 py-4 px-5 shadow-sm">
        //             <h3 className="mb-2 text-sm font-semibold text-heading">
        //               Order Number
        //             </h3>
        //             <p className=" text-sm text-body-dark">
        //               {' '}
        //               {checkout_data?.checkout_id}
        //             </p>
        //           </div>
        //           <div className="rounded border border-border-200 py-4 px-5 shadow-sm">
        //             <h3 className="mb-2 text-sm font-semibold text-heading">
        //               Date
        //             </h3>
        //             <p className="text-sm text-body-dark">
        //               {dayjs(checkout_data?.created_at).format(
        //                 'MMMM D, YYYY h:mm A'
        //               )}
        //             </p>
        //           </div>
        //           <div className="rounded border border-border-200 py-4 px-5 shadow-sm">
        //             <h3 className="mb-2 text-sm font-semibold text-heading">
        //               Total
        //             </h3>
        //             <p className="text-sm text-body-dark">
        //               ${checkout_data?.amount}
        //             </p>
        //           </div>
        //           <div className="rounded border border-border-200 py-4 px-5 shadow-sm">
        //             <h3 className="mb-2 text-sm font-semibold text-heading">
        //               Payment Method
        //             </h3>
        //             <p className="text-sm text-body-dark">FINMO</p>
        //           </div>
        //         </div>
        //         {/* end of order received  */}

        //         <div className="flex flex-col lg:flex-row">
        //           <div className="mb-12 w-full lg:mb-0 lg:w-1/2 ltr:lg:pr-3 rtl:lg:pl-3">
        //             <h2 className="mb-6 text-xl font-bold text-heading">
        //               Total Amount
        //             </h2>
        //             <div>
        //               <p className="mt-5 flex text-body-dark">
        //                 <strong className="w-5/12 text-sm font-semibold text-heading sm:w-4/12">
        //                   Sub Total
        //                 </strong>
        //                 :
        //                 <span className="w-7/12 text-sm ltr:pl-4 rtl:pr-4 sm:w-8/12 ">
        //                   ${checkout_data?.amount_breakdown?.['Sub Total']}
        //                 </span>
        //               </p>
        //               <p className="mt-5 flex text-body-dark">
        //                 <strong className="w-5/12 text-sm font-semibold text-heading sm:w-4/12">
        //                   Shipping Charge
        //                 </strong>
        //                 :
        //                 <span className="w-7/12 text-sm ltr:pl-4 rtl:pr-4 sm:w-8/12 ">
        //                   ${checkout_data?.amount_breakdown?.['Shipping Charge']}
        //                 </span>
        //               </p>
        //               <p className="mt-5 flex text-body-dark">
        //                 <strong className="w-5/12 text-sm font-semibold text-heading sm:w-4/12">
        //                   Tax
        //                 </strong>
        //                 :
        //                 <span className="w-7/12 text-sm ltr:pl-4 rtl:pr-4 sm:w-8/12 ">
        //                   ${checkout_data?.amount_breakdown?.['Tax']}
        //                 </span>
        //               </p>
        //               <p className="mt-5 flex text-body-dark">
        //                 <strong className="w-5/12 text-sm font-semibold text-heading sm:w-4/12">
        //                   Discount
        //                 </strong>
        //                 :
        //                 <span className="w-7/12 text-sm ltr:pl-4 rtl:pr-4 sm:w-8/12 ">
        //                   ${-1 *  checkout_data?.amount_breakdown?.['Discount']}
        //                 </span>
        //               </p>
        //               <p className="mt-5 flex text-body-dark">
        //                 <strong className="w-5/12 text-sm font-semibold text-heading sm:w-4/12">
        //                   Total
        //                 </strong>
        //                 :
        //                 <span className="w-7/12 text-sm ltr:pl-4 rtl:pr-4 sm:w-8/12">
        //                   ${checkout_data?.amount}
        //                 </span>
        //               </p>
        //             </div>
        //           </div>
        //           {/* end of total amount */}
        //         </div>
        //       </div>
        //     </div>
        //   )}
      }
    </>
  );
}
ThankyouPage.getLayout = getLayout;
