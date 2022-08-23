import Button from '@/components/ui/button';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { useTranslation } from 'next-i18next';

export default function ApiConfigButton() {
  const { openModal } = useModalAction();
  function handleJoin() {
    return openModal('API_CONFIG_VIEW');
  }
  return (
    <Button className="font-semibold" size="small" onClick={handleJoin}>
      CONFIG API
    </Button>
  );
}
