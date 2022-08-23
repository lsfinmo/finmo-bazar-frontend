import { signIn } from 'next-auth/react';
import Logo from '@/components/ui/logo';
import Alert from '@/components/ui/alert';
import Input from '@/components/ui/forms/input';
import PasswordInput from '@/components/ui/forms/password-input';
import Button from '@/components/ui/button';
import { useTranslation } from 'next-i18next';
import * as yup from 'yup';
import { GoogleIcon } from '@/components/icons/google';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { MobileIcon } from '@/components/icons/mobile-icon';
import { Form } from '@/components/ui/forms/form';
import { useLogin } from '@/framework/user';
import type { ApiConfigInput, LoginUserInput } from '@/types';
import { AnonymousIcon } from '@/components/icons/anonymous-icon';
import { useRouter } from 'next/router';
import { ROUTES } from '@/lib/routes';
import Select from '../ui/select/select';
import { useState } from 'react';
import { useLocalStorage } from '@/lib/use-local-storage';
const loginFormSchema = yup.object().shape({
  access_key: yup.string().required('Access Key is Required'),
  secret_key: yup.string().required('Secret Key is Required'),
});
function LoginForm() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { openModal, closeModal } = useModalAction();
  const isCheckout = router.pathname.includes('checkout');
  const { mutate: login, isLoading, serverError, setServerError } = useLogin();
  const [saved_access_key, saveAccessKey] =
    useLocalStorage<string>('access_key');
  const [saved_secret_key, saveSecretKey] =
    useLocalStorage<string>('secret_key');
  const [saved_currency, saveCurrency] = useLocalStorage<string>('currency');
  const [currency, setCurrency] = useState({
    label: saved_currency || 'AUD',
    value: saved_currency || 'AUD',
  });

  function onSubmit({ access_key, secret_key }: ApiConfigInput) {
    saveAccessKey(access_key);
    saveSecretKey(secret_key);
    saveCurrency(currency.value);
    closeModal();
    router.reload();
  }

  return (
    <>
      <Alert
        variant="error"
        message={serverError && t(serverError)}
        className="mb-6"
        closeable={true}
        onClose={() => setServerError(null)}
      />
      <Form<ApiConfigInput>
        onSubmit={onSubmit}
        validationSchema={loginFormSchema}
      >
        {({ register, formState: { errors } }) => (
          <>
            <Input
              label={'Access Key'}
              {...register('access_key')}
              variant="outline"
              className="mb-5"
              defaultValue={saved_access_key || ''}
              error={t(errors.access_key?.message!)}
            />
            <Input
              label={'Secret Key'}
              {...register('secret_key')}
              variant="outline"
              defaultValue={saved_secret_key || ''}
              className="mb-5"
              error={t(errors.secret_key?.message!)}
            />
            <Select
              defaultValue={currency}
              options={[
                {
                  label: 'AUD',
                  value: 'AUD',
                },
                {
                  label: 'PHP',
                  value: 'PHP',
                },
              ]}
              isSearchable={false}
              // @ts-ignore
              onChange={setCurrency}
            />
            <div className="mt-8">
              <Button
                className="h-11 w-full sm:h-12"
                loading={isLoading}
                disabled={isLoading}
              >
                SAVE CONFIG
              </Button>
            </div>
          </>
        )}
      </Form>
    </>
  );
}

export default function ApiConfigView() {
  const { t } = useTranslation('common');
  return (
    <div className="flex h-full min-h-screen w-screen flex-col justify-center bg-light py-6 px-5 sm:p-8 md:h-auto md:min-h-0 md:max-w-[680px] md:rounded-xl">
      <div className="flex justify-center">
        <Logo />
      </div>
      <p className="mt-4 mb-8 text-center text-sm text-body sm:mt-5 sm:mb-10 md:text-base">
        CONFIG API KEYS
      </p>
      <LoginForm />
    </div>
  );
}
