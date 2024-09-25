import React from 'react';
import { Card } from 'antd';
import FormDeliveryman from './form';
import { useTranslation } from 'react-i18next';

function AddDeliveryman() {
  const { t } = useTranslation();

  return (
    <Card title={t('add.deliveryman')}>
      <FormDeliveryman />
    </Card>
  );
}

export default AddDeliveryman;
