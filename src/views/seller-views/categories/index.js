import React, { useState } from 'react';
import { Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import SellerCategoryList from './category-list';
import SellerCategoryRequests from './category-request';
import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { setRefetch } from 'redux/slices/menu';

export default function SellerCategories({ parentId, type }) {
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
        <SellerCategoryList
          parentId={parentId}
          type={type}
          activeTab={activeTab}
        />
      </Tabs.TabPane>
      <Tabs.TabPane key='request' tab={t('requests')}>
        <SellerCategoryRequests
          parentId={parentId}
          type={type}
          activeTab={activeTab}
        />
      </Tabs.TabPane>
    </Tabs>
  );
}
