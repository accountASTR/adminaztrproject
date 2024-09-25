// import React, { useState } from 'react';
// import { Tabs } from 'antd';
// import { useTranslation } from 'react-i18next';
import UserForm from './user-form';
// import DeliverymanForm from './deliveryman-form';

// const { TabPane } = Tabs;

const FormDeliveryman = () => {
  // const { t } = useTranslation();

  // const [tab, setTab] = useState('edit');

  return (
    <UserForm />
    // <Tabs
    //   tabPosition='left'
    //   size='small'
    //   activeTab={tab}
    //   onChange={(key) => setTab(key)}
    // >
    //   <TabPane key='user' tab={t('user')}>
    //     <UserForm form={form} />
    //   </TabPane>
    //   <TabPane key='deliveryman' tab={t('deliveryman')}>
    //     <DeliverymanForm form={form} />
    //   </TabPane>
    // </Tabs>
  );
};

export default FormDeliveryman;
