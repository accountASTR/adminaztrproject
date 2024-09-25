import React, { useState } from 'react';
import { Tabs } from 'antd';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CategoryList from './category-list';
import CategoryRequestList from './category-request-list';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { setRefetch } from 'redux/slices/menu';

export default function SellerCategories() {
  const { t } = useTranslation();
  const location = useLocation();
  const dispatch = useDispatch();
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'list');
  return (
    <Tabs
      defaultActiveKey={location.state?.tab || 'list'}
      destroyInactiveTabPane
      onChange={(key) => {
        dispatch(setRefetch(activeMenu));
        setActiveTab(key);
      }}
    >
      <Tabs.TabPane key='list' tab={t('category.list')}>
        <CategoryList activeTab={activeTab} />
      </Tabs.TabPane>
      <Tabs.TabPane key='request' tab={t('requests')}>
        <CategoryRequestList activeTab={activeTab} />
      </Tabs.TabPane>
    </Tabs>
  );
}
